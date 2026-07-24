"""
Base interfaces and protocols for LLM providers.
"""
from typing import Protocol, List
from app.schemas.llm import LLMExtractedData

class LLMProvider(Protocol):
    """Protocol defining the interface for an LLM provider."""
    
    def extract_structured_data(self, raw_text: str) -> LLMExtractedData:
        """Extract structured data from raw text."""
        ...
        
    def extract_batch(self, texts: List[str]) -> List[LLMExtractedData]:
        """Extract structured data from a batch of texts."""
        ...
