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
    # Mock the internal sleep for tenacity so tests run instantly
    provider._call_api_with_retry.retry.sleep = MagicMock()
    return provider


def test_api_error_retry(gemini_provider):
    """Test that APIError (like 503) triggers Tenacity retries and eventually fails gracefully."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        # Simulate APIError (requires message and response_json)
        mock_gen.side_effect = APIError("503 Service Unavailable", {"error": "503"})
        
        result = gemini_provider.extract_structured_data("Some raw text")
        
        # It should retry 4 times (the max attempts in tenacity config)
        assert mock_gen.call_count == 4
        
        # It should return a fallback object with the error diagnostic
        assert result.confidence_score == 0.0
        assert "Gemini API Error" in result.error_diagnostic


def test_malformed_json_progressive_prompts(gemini_provider):
    """Test that malformed JSON triggers the progressively stricter prompts."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        
        class MockResponse:
            def __init__(self, text):
                self.text = text
                
        # Simulate Pydantic validation errors by returning garbage JSON
        # First attempt: complete garbage
        # Second attempt: slightly better garbage
        # Third attempt: perfectly formatted JSON
        mock_gen.side_effect = [
            MockResponse("Here is your data: { malformed"),
            MockResponse("```json\n{ \"company_name\": \"Test\" \n```"),
            MockResponse('{"company_name": "TestCorp", "confidence_score": 0.99}')
        ]
        
        result = gemini_provider.extract_structured_data("Some raw text")
        
        # It should have taken 3 attempts
        assert mock_gen.call_count == 3
        
        # The 3rd attempt succeeded
        assert result.company_name == "TestCorp"
        assert result.confidence_score == 0.99
        assert result.error_diagnostic is None
        
        # Verify the prompts were progressively different
        calls = mock_gen.call_args_list
        prompt1 = calls[0].kwargs['contents']
        prompt2 = calls[1].kwargs['contents']
        prompt3 = calls[2].kwargs['contents']
        
        assert "CRITICAL" not in prompt1
        assert "CRITICAL" in prompt2
        assert "JSON ONLY" in prompt3


def test_malformed_json_total_failure(gemini_provider):
    """Test that complete failure across all 3 prompts returns a diagnostic."""
    with patch.object(gemini_provider.client.models, 'generate_content') as mock_gen:
        
        class MockResponse:
            def __init__(self, text):
                self.text = text
                
        # Always return garbage
        mock_gen.side_effect = [MockResponse("garbage")] * 3
        
        result = gemini_provider.extract_structured_data("Some raw text")
        
        # It should have exhausted all 3 prompt attempts
        assert mock_gen.call_count == 3
        
        # It should return a fallback object
        assert result.confidence_score == 0.0
        assert "Pydantic Validation Error on attempt 3" in result.error_diagnostic


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
