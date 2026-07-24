import logging
from typing import List
from pydantic import ValidationError

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
    def extract_structured_data(self, raw_text: str) -> LLMExtractedData:
        """Extract structured data from a single text using Gemini."""
        schema_json = LLMExtractedData.model_json_schema()
        
        prompt = f"""
You are an expert data extraction assistant. Your task is to extract structured information about a company from the provided raw text.

You MUST respond with valid JSON ONLY that conforms exactly to the following JSON Schema. Do NOT include markdown blocks, just the raw JSON.

SCHEMA:
{schema_json}

RAW TEXT:
{raw_text}
"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            
            try:
                # Parse the raw JSON text directly into our Pydantic model
                return LLMExtractedData.model_validate_json(response.text)
            except ValidationError as e:
                logger.error(f"Gemini returned invalid schema: {e}\nRaw output: {response.text}")
                raise
                
        except APIError as e:
            logger.error(f"Gemini API error: {e}")
            raise

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
