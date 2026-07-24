import os
import sys

# Load environment manually for the test script
from dotenv import load_dotenv
load_dotenv()

# We need the backend dir in PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.llm.gemini import GeminiProvider

def test_gemini():
    print("Testing GeminiProvider...")
    
    provider = GeminiProvider()
    print(f"Using model: {provider.model}")
    
    test_text = """
    Welcome to AlphaCorp! We are a leading logistics and supply chain management company based in Seattle, Washington.
    Founded in 2012, we now have over 3,000 employees worldwide. Last year our annual revenue topped $400 million.
    Get in touch with our partnerships team at partnerships@alphacorp.io or call us toll-free at 1-800-555-0199.
    """
    
    try:
        result = provider.extract_structured_data(test_text)
        print("Success! Extracted data:")
        print(result.model_dump_json(indent=2))
        return True
    except Exception as e:
        print(f"Error during extraction: {e}")
        return False

if __name__ == "__main__":
    test_gemini()
