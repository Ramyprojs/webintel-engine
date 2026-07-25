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
            progress_callback: Optional callable(items_done, total_items) to report progress.

        Returns:
            List of validated LLMExtractedData results. Results that fail
            validation after retry will have confidence_score set to 0.0
            to indicate they need manual review.
        """
        logger.info(f"Cleaning {len(texts)} texts in batches of {self.batch_size}")
        all_results: List[LLMExtractedData] = []
        total_batches = (len(texts) + self.batch_size - 1) // self.batch_size
        total_items = len(texts)

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            batch_num = (i // self.batch_size) + 1
            logger.info(f"Processing batch {batch_num}/{total_batches}")

            # Per-item callback that fires after every single page is cleaned
            def make_item_cb(batch_start):
                def item_cb(items_in_batch, batch_total):
                    items_done = batch_start + items_in_batch
                    if progress_callback:
                        progress_callback(items_done, total_items)
                return item_cb

            try:
                batch_results = self.provider.extract_batch(batch, item_callback=make_item_cb(i))
            except Exception as exc:
                logger.error(f"Batch {batch_num} failed: {exc}. Using Heuristic Extractor fallback.")
                from app.llm.gemini import extract_heuristic_fallback
                batch_results = []
                for idx, text in enumerate(batch):
                    res = extract_heuristic_fallback(text)
                    batch_results.append(res)
                    if make_item_cb(i):
                        make_item_cb(i)(idx + 1, len(batch))

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
