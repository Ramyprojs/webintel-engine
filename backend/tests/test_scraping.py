import pytest
import asyncio
import time
from unittest.mock import AsyncMock, patch

import httpx
import fakeredis.aioredis as fakeredis
from tenacity import wait_exponential

from app.scraping.discovery import extract_internal_links
from app.scraping.fetcher import Fetcher
from app.config import settings


@pytest.fixture
def fake_redis():
    """Provides a FakeRedis client for testing."""
    return fakeredis.FakeRedis(decode_responses=True)


def test_extract_internal_links():
    """Test link filtering logic."""
    html = """
    <html>
        <body>
            <a href="/about">About Us</a>
            <a href="https://example.com/contact">Contact</a>
            <a href="https://external.com/partner">Partner</a>
            <a href="mailto:info@example.com">Email</a>
            <a href="tel:+123456789">Call</a>
            <a href="javascript:void(0)">Click</a>
            <a href="#section">Section</a>
        </body>
    </html>
    """
    base_url = "https://example.com/home"
    
    links = extract_internal_links(html, base_url)
    
    # Should only contain valid internal HTTP/HTTPS links
    assert "https://example.com/about" in links
    assert "https://example.com/contact" in links
    
    # Should NOT contain external or junk links
    assert "https://external.com/partner" not in links
    assert "mailto:info@example.com" not in links
    assert "tel:+123456789" not in links
    assert "javascript:void(0)" not in links
    assert "https://example.com/home#section" not in links
    
    assert len(links) == 2


@pytest.mark.asyncio
async def test_redis_rate_limiter(fake_redis):
    """Test the Redis-backed token bucket rate limiter."""
    fetcher = Fetcher()
    fetcher.redis_client = fake_redis
    fetcher.rps_limit = 2.0  # 2 requests per second
    
    domain = "ratelimit-test.com"
    
    start_time = time.time()
    
    # Run 5 requests concurrently
    tasks = [fetcher._wait_for_rate_limit(domain) for _ in range(5)]
    await asyncio.gather(*tasks)
    
    duration = time.time() - start_time
    
    # 2 requests per second limit. 
    # Window 1 (t=0s): 2 reqs
    # Window 2 (t=1s): 2 reqs
    # Window 3 (t=2s): 1 reqs
    # Accounting for sleep imprecision and window boundaries, it could take ~1.0-2.0s
    assert duration >= 1.0, f"Expected duration >= 1.0s, got {duration}s"
    
    # Ensure connections are closed
    await fetcher.redis_client.aclose()


@pytest.mark.asyncio
async def test_fetcher_retry_backoff():
    """Test that the fetcher retries on httpx RequestError."""
    fetcher = Fetcher()
    # Disable rate limiting for this test
    fetcher.rps_limit = 0 
    
    # We want to mock httpx.AsyncClient.get to raise RequestError
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        # Also mock playwright fallback so it doesn't actually launch a browser
        with patch.object(fetcher, "_fetch_playwright", new_callable=AsyncMock) as mock_playwright:
            
            # Setup the mocks
            mock_get.side_effect = httpx.RequestError("Network error")
            mock_playwright.return_value = {
                "url": "https://retry-test.com",
                "html": "<html>Fallback</html>",
                "text": "Fallback text",
                "status_code": 500,
                "method": "playwright"
            }
            
            result = await fetcher.fetch("https://retry-test.com")
            
            # Because we use tenacity, if it fails, it falls back to playwright.
            # Wait, the fallback to playwright is inside the fetch method catch block. 
            # If Playwright succeeds, it returns. The tenacity retry ONLY triggers if BOTH fail, 
            # or if Playwright raises RequestError.
            # Let's make Playwright raise RequestError as well to trigger tenacity retries.
            mock_playwright.side_effect = httpx.RequestError("Playwright also failed")
            
            # Change tenacity wait config to avoid waiting 10s during tests
            fetcher.fetch.retry.wait = wait_exponential(multiplier=0.01, min=0.01, max=0.05)
            
            try:
                await fetcher.fetch("https://retry-test.com")
            except httpx.RequestError:
                pass # Expected after max retries
                
            # Both get and playwright should have been called multiple times (retries)
            # settings.SCRAPE_MAX_RETRIES is default 3 (so 1 initial + 2 retries = 3 calls)
            assert mock_get.call_count >= 3
            assert mock_playwright.call_count >= 3
