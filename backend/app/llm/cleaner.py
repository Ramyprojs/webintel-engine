import logging
from typing import List

from pydantic import ValidationError

from app.llm.base import LLMProvider
from app.schemas.llm import LLMExtractedData

logger = logging.getLogger(__name__)


class DataCleaner:
    """Orchestrates LLM-based cleaning of scraped text into structured data.

    Processes texts in batches, validates each result against the Pydantic schema,
    and handles malformed LLM output with retry logic.
    """

    def __init__(self, provider: LLMProvider, batch_size: int = 5):
        self.provider = provider
        self.batch_size = batch_size

    def clean_texts(self, texts: List[str], progress_callback=None) -> List[LLMExtractedData]:
        """Process texts through the LLM provider and validate results.

        Args:
            texts: List of raw text strings to clean/structure.
            progress_callback: Optional callable(batch_num, total_batches) to report progress.

        Returns:
            List of validated LLMExtractedData results. Results that fail
            validation after retry will have confidence_score set to 0.0
            to indicate they need manual review.
        """
        logger.info(f"Cleaning {len(texts)} texts in batches of {self.batch_size}")
        all_results: List[LLMExtractedData] = []
        total_batches = (len(texts) + self.batch_size - 1) // self.batch_size

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            logger.info(f"Processing batch {batch_num}/{total_batches}")

            try:
                batch_results = self.provider.extract_batch(batch)
            except Exception as exc:
                logger.error(f"Batch {batch_num} failed: {exc}")
                
                # Check for quota exhaustion. If so, fail the rest of the batches immediately
                if "429" in str(exc) and "quota" in str(exc).lower():
                    logger.error("Quota exceeded! Aborting remaining batches to avoid hanging.")
                    # Fill the rest with needs_review
                    for _ in range(len(texts) - len(all_results)):
                        all_results.append(self._create_needs_review_result("Quota Exceeded - Skipped"))
                    break

                # Otherwise mark all items in this batch as needing review and continue
                for text in batch:
                    all_results.append(self._create_needs_review_result(text))
                
                if progress_callback:
                    progress_callback(batch_num, total_batches)
                continue

            for idx, result in enumerate(batch_results):
                try:
                    # Validate the result against the schema
                    validated = LLMExtractedData.model_validate(
                        result.model_dump() if hasattr(result, "model_dump") else result
                    )
                    all_results.append(validated)
                except ValidationError as exc:
                    logger.warning(
                        f"Validation failed for item {i + idx}, retrying: {exc}"
                    )
                    # Retry once
                    retry_result = self._retry_single(batch[idx])
                    all_results.append(retry_result)

            if progress_callback:
                progress_callback(batch_num, total_batches)

        logger.info(f"Cleaning complete: {len(all_results)} results produced")
        return all_results

    def _retry_single(self, text: str) -> LLMExtractedData:
        """Retry extraction for a single text that failed validation."""
        try:
            result = self.provider.extract_structured_data(text)
            validated = LLMExtractedData.model_validate(
                result.model_dump() if hasattr(result, "model_dump") else result
            )
            return validated
        except (ValidationError, Exception) as exc:
            logger.error(f"Retry also failed: {exc}. Marking as needs_review.")
            return self._create_needs_review_result(text)

    @staticmethod
    def _create_needs_review_result(text: str) -> LLMExtractedData:
        """Create a placeholder result indicating manual review is needed."""
        return LLMExtractedData(
            summary=f"[NEEDS REVIEW] Raw text: {text[:200]}...",
            confidence_score=0.0,
        )
