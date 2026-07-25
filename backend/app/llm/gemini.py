import logging
import re
import json
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
        if not api_key:
            import asyncio
            from app.dynamic_config import DynamicConfig
            api_key = asyncio.run(DynamicConfig.get_gemini_key())
            
        self.api_key = api_key
        self.model = model or settings.LLM_MODEL
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY must be provided via config")
            
        self.client = genai.Client(api_key=self.api_key)
        
        # We inject the JSON schema directly into the prompt because
        # Gemini's structured output schema (response_schema) can fail
        # on arbitrary dictionaries (additionalProperties).
    @retry(
        wait=wait_exponential(multiplier=2, min=4, max=30),
        stop=stop_after_attempt(2),
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
        
        # Progressive strictness prompts (limited to 2 to reduce API usage)
        prompts = [
            # Attempt 1: Standard
            f"You are an expert data extraction assistant. Extract structured info about a company or entity from the raw text.\n\nCRITICAL INSTRUCTION: Extract the specific company, project, or entity that is the SUBJECT of this page — not the platform, publisher, or site hosting the content, unless the page is literally the platform's own about/homepage.\n\nYou MUST respond with valid JSON ONLY that conforms exactly to the following JSON Schema. Do NOT include markdown blocks, just the raw JSON.\n\nSCHEMA:\n{schema_json}\n\nRAW TEXT:\n{raw_text}",
            # Attempt 2: Maximum Strictness
            f"JSON ONLY. DO NOT OUTPUT ANYTHING EXCEPT A JSON DICTIONARY. MUST MATCH SCHEMA EXACTLY. IF YOU ADD ANY TEXT OUTSIDE THE BRACES, THE SYSTEM WILL CRASH.\n\nCRITICAL INSTRUCTION: Extract the specific company, project, or entity that is the SUBJECT of this page — not the platform, publisher, or site hosting the content, unless the page is literally the platform's own about/homepage.\n\nSCHEMA:\n{schema_json}\nTEXT:\n{raw_text}"
        ]
        
        last_error = None
        
        for attempt, prompt in enumerate(prompts, 1):
            try:
                # 1. API Call (handles 503s via tenacity)
                raw_response = self._call_api_with_retry(prompt)
                
                # 2. Robust JSON Cleanup (handles stray characters, markdown fences, and trailing braces)
                cleaned_json = raw_response.strip()
                if cleaned_json.startswith("```json"):
                    cleaned_json = cleaned_json[7:]
                elif cleaned_json.startswith("```"):
                    cleaned_json = cleaned_json[3:]
                if cleaned_json.endswith("```"):
                    cleaned_json = cleaned_json[:-3]
                cleaned_json = cleaned_json.strip()
                
                # Try direct parse or backtrack from trailing characters/extra closing braces
                start = cleaned_json.find('{')
                if start != -1:
                    found_valid = False
                    for end in range(len(cleaned_json), start, -1):
                        if cleaned_json[end-1] == '}':
                            candidate = cleaned_json[start:end]
                            try:
                                json.loads(candidate)
                                cleaned_json = candidate
                                found_valid = True
                                break
                            except Exception:
                                continue
                
                # 3. Validation
                return LLMExtractedData.model_validate_json(cleaned_json)
                
            except ValidationError as e:
                last_error = f"Pydantic Validation Error on attempt {attempt}: {e}"
                logger.warning(f"JSON validation failed on attempt {attempt}. Retrying with stricter prompt. Error: {e}")
            except APIError as e:
                # If tenacity gave up after 4 retries
                last_error = f"Gemini API Error: {e}"
                logger.error(f"Gemini API totally failed on attempt {attempt}: {e}")
                
                # Check if it's a quota error (RESOURCE_EXHAUSTED). If so, we MUST fail fast!
                if getattr(e, 'code', None) == 429 and "quota" in str(e).lower():
                    raise e
                    
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

    def extract_batch(self, texts: List[str], item_callback=None) -> List[LLMExtractedData]:
        """Extract structured data from a batch of texts."""
        import time
        results = []
        for idx, text in enumerate(texts):
            try:
                results.append(self.extract_structured_data(text))
                if item_callback:
                    item_callback(idx + 1, len(texts))
                # Free tier limit is 5 RPM (1 request every 13 seconds).
                # We sleep 13s between items to stay safely under the limit.
                if idx < len(texts) - 1:
                    logger.info(f"Rate limiting: sleeping 13s before next API call ({idx+1}/{len(texts)})")
                    time.sleep(13)
            except Exception as e:
                logger.error(f"Failed to extract item in batch: {e}")
                raise
        return results
