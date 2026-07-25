import pytest
from unittest.mock import MagicMock, patch
from pydantic import ValidationError

from google.genai.errors import APIError

from app.llm.gemini import GeminiProvider
from app.schemas.llm import LLMExtractedData


@pytest.fixture
def gemini_provider():
    # Use a dummy key so it doesn't try to use real creds or fail init
    provider = GeminiProvider(api_key="dummy", model="gemini-test")
    return provider


def test_api_error_retry(gemini_provider):
    """Test that APIError triggers fallback models and uses heuristic fallback when all models fail."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        # Simulate APIError (requires message and response_json)
        mock_gen.side_effect = APIError("503 Service Unavailable", {"error": "503"})
        
        result = gemini_provider.extract_structured_data("Nexus Tech | Innovative AI Solutions")
        
        # It should try primary model + 4 fallback models before reverting to heuristic fallback
        assert mock_gen.call_count == 5
        
        # It should return a valid extracted object via the Heuristic Extractor fallback with dynamic confidence
        assert result.confidence_score == 0.70
        assert result.company_name == "Nexus Tech"


def test_malformed_json_fallback(gemini_provider):
    """Test that malformed JSON from API safely triggers Heuristic Extractor fallback."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        
        class MockResponse:
            def __init__(self, text):
                self.text = text
                
        mock_gen.return_value = MockResponse("Here is your data: { malformed")
        
        result = gemini_provider.extract_structured_data("Nexus Tech | Enterprise AI Solutions")
        
        assert mock_gen.call_count == 1
        assert result.company_name == "Nexus Tech"
        assert result.confidence_score == 0.70


def test_multiline_json_extraction(gemini_provider):
    """Test that the regex cleanup correctly extracts multi-line JSON with newlines."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        class MockResponse:
            def __init__(self, text):
                self.text = text
                
        # Simulate a Gemini response with conversational preamble, multiline formatted JSON, and trailing junk
        multiline_response = """Here is the data you requested:
```json
{
  "company_name": "MultiLine Inc",
  "industry": "Tech",
  "confidence_score": 0.85,
  "key_data_points": {
      "nested_value": 42
  }
}
```
Hope this helps!"""
        
        mock_gen.return_value = MockResponse(multiline_response)
        
        result = gemini_provider.extract_structured_data("Some raw text")
        
        # It should succeed on the first attempt without throwing a ValidationError
        assert mock_gen.call_count == 1
        assert result.company_name == "MultiLine Inc"
        assert result.confidence_score == 0.85
        assert result.key_data_points["nested_value"] == 42
        assert result.error_diagnostic is None


def test_category_page_detection(gemini_provider):
    """Test that category/navigation pages are assigned company_name=None and confidence_score=0.35."""
    raw_category_text = "PAGE_URL: https://books.toscrape.com/catalogue/category/books/crime_52/index.html\n\nCONTENT:\nCrime (52) | Books to Scrape\nHome > Books > Crime"
    result = gemini_provider.extract_structured_data(raw_category_text)
    
    assert result.company_name is None
    assert result.confidence_score == 0.35
    assert "Category/listing page" in result.error_diagnostic


def test_product_page_extraction(gemini_provider):
    """Test that individual product/book pages are correctly extracted with clean title and high confidence score."""
    raw_product_text = "PAGE_URL: https://books.toscrape.com/catalogue/the-coming-woman_995/index.html\n\nCONTENT:\nThe Coming Woman\n£17.93\nIn stock\nAn engaging historical novel about Victoria Woodhull."
    result = gemini_provider.extract_structured_data(raw_product_text)
    
    assert result.company_name == "The Coming Woman"
    assert result.confidence_score >= 0.70
    assert result.error_diagnostic is None
