import logging
import re
from typing import List
from pydantic import ValidationError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.llm.base import LLMProvider
from app.schemas.llm import LLMExtractedData
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """LLM Provider implementation using Google Gemini API."""

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.LLM_MODEL
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be provided")
            
        self.client = genai.Client(api_key=self.api_key)
        
        # We inject the JSON schema directly into the prompt because
        # Gemini's structured output schema (response_schema) can fail
        # on arbitrary dictionaries (additionalProperties).
    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(4),
        retry=retry_if_exception_type(APIError),
        reraise=True
    )
    def _call_api_with_retry(self, prompt: str) -> str:
        """Call Gemini API with automatic retries for network/503 errors."""
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        return response.text

    def extract_structured_data(self, raw_text: str) -> LLMExtractedData:
        """Extract structured data from a single text using Gemini."""
        schema_json = LLMExtractedData.model_json_schema()
        
        # Progressive strictness prompts
        prompts = [
            # Attempt 1: Standard
            f"You are an expert data extraction assistant. Extract structured info about a company from the raw text.\n\nYou MUST respond with valid JSON ONLY that conforms exactly to the following JSON Schema. Do NOT include markdown blocks, just the raw JSON.\n\nSCHEMA:\n{schema_json}\n\nRAW TEXT:\n{raw_text}",
            # Attempt 2: Stricter
            f"Extract company info to JSON. CRITICAL: Your entire response must be a single, parseable JSON object. NO markdown fences like ```json. NO preamble. NO trailing text. ONLY output the JSON object matching this schema:\n\nSCHEMA:\n{schema_json}\n\nRAW TEXT:\n{raw_text}",
            # Attempt 3: Maximum Strictness
            f"JSON ONLY. DO NOT OUTPUT ANYTHING EXCEPT A JSON DICTIONARY. MUST MATCH SCHEMA EXACTLY. IF YOU ADD ANY TEXT OUTSIDE THE BRACES, THE SYSTEM WILL CRASH.\nSCHEMA:\n{schema_json}\nTEXT:\n{raw_text}"
        ]
        
        last_error = None
        
        for attempt, prompt in enumerate(prompts, 1):
            try:
                # 1. API Call (handles 503s via tenacity)
                raw_response = self._call_api_with_retry(prompt)
                
                # 2. Regex Cleanup (strip anything before the first { and after the last })
                match = re.search(r'\{.*?\}', raw_response, re.DOTALL)
                
                if match:
                    # To match the LAST closing brace (instead of the first due to non-greedy .*?), 
                    # we do a reverse search or use a greedy match from the first brace to the last.
                    # Since re.DOTALL is used, greedy .* will naturally match until the last closing brace.
                    match_greedy = re.search(r'\{.*\}', raw_response, re.DOTALL)
                    cleaned_json = match_greedy.group(0) if match_greedy else raw_response
                else:
                    cleaned_json = raw_response
                
                # 3. Validation
                return LLMExtractedData.model_validate_json(cleaned_json)
                
            except ValidationError as e:
                last_error = f"Pydantic Validation Error on attempt {attempt}: {e}"
                logger.warning(f"JSON validation failed on attempt {attempt}. Retrying with stricter prompt. Error: {e}")
            except APIError as e:
                # If tenacity gave up after 4 retries
                last_error = f"Gemini API Error: {e}"
                logger.error(f"Gemini API totally failed on attempt {attempt}: {e}")
                break # Don't loop prompt strictness if the API is just down
            except Exception as e:
                last_error = f"Unexpected Error: {e}"
                logger.error(f"Unexpected error during extraction: {e}")
                break

        # If we exhausted all 3 attempts or hit a terminal API error
        logger.error(f"Failed to extract structured data. Returning fallback object. Last error: {last_error}")
        return LLMExtractedData(
            confidence_score=0.0,
            error_diagnostic=last_error
        )

    def extract_batch(self, texts: List[str]) -> List[LLMExtractedData]:
        """Extract structured data from a batch of texts."""
        results = []
        for text in texts:
            try:
                results.append(self.extract_structured_data(text))
            except Exception as e:
                logger.error(f"Failed to extract item in batch: {e}")
                raise
        return results
