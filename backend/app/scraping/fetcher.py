import asyncio
import logging
import time
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup
import redis.asyncio as redis
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.config import settings
from app.scraping.proxy import ProxyProvider

logger = logging.getLogger(__name__)

# Note: Playwright imports are deferred to avoid loading if not needed
# and to prevent issues in strict environments.


class RateLimitExceeded(Exception):
    pass


class Fetcher:
    """Handles rate-limited, retried fetching of web pages with Playwright fallback."""
    
    def __init__(self, proxy_provider: Optional[ProxyProvider] = None):
        self.proxy_provider = proxy_provider or ProxyProvider()
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.rps_limit = settings.SCRAPE_RATE_LIMIT_RPS

    async def _wait_for_rate_limit(self, domain: str):
        """Wait until we have capacity for this domain using a Redis-backed window."""
        if self.rps_limit <= 0:
            return  # No limit

        max_reqs = max(1, int(self.rps_limit))
        # If RPS < 1, e.g. 0.5, we want 1 request every 2 seconds.
        # For simplicity, we'll use a 1-second window for RPS >= 1, and a multi-second window for RPS < 1.
        window_size = 1
        if self.rps_limit < 1:
            window_size = int(1 / self.rps_limit)
            max_reqs = 1

        while True:
            # We use the current timestamp bucket
            current_window = int(time.time() / window_size)
            key = f"scrape_rate_limit:{domain}:{current_window}"
            
            # Atomic increment and expire
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, window_size * 2)
            results = await pipe.execute()
            
            current_count = results[0]
            if current_count <= max_reqs:
                break
                
            # Rate limit exceeded for this window, sleep until the next one
            sleep_time = (current_window + 1) * window_size - time.time()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=10),
        stop=stop_after_attempt(settings.SCRAPE_MAX_RETRIES),
        retry=retry_if_exception_type((httpx.RequestError, RateLimitExceeded)),
        reraise=True
    )
    async def fetch(self, url: str) -> dict:
        """Fetch a URL, trying httpx first, falling back to Playwright if needed.
        
        Returns a dict with 'url', 'html', 'text', 'status_code'.
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        if not domain:
            raise ValueError(f"Invalid URL: {url}")

        await self._wait_for_rate_limit(domain)

        proxy = self.proxy_provider.get_proxy()
        
        # 1. Try static fetch first
        try:
            logger.info(f"Static fetch attempting: {url}")
            async with httpx.AsyncClient(proxy=proxy, verify=False, timeout=10.0) as client:
                # Basic headers to look somewhat like a browser
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                }
                response = await client.get(url, headers=headers, follow_redirects=True)
                
            status_code = response.status_code
            html = response.text
            
            soup = BeautifulSoup(html, "html.parser")
            text = soup.get_text(separator=" ", strip=True)
            
            # If successful and looks like it has content, return
            if status_code == 200 and len(text) > 500:
                return {
                    "url": str(response.url),
                    "html": html,
                    "text": text,
                    "status_code": status_code,
                    "method": "httpx"
                }
                
            logger.warning(f"Static fetch for {url} returned status {status_code} and {len(text)} text chars. Falling back to Playwright.")
            
        except httpx.RequestError as e:
            logger.warning(f"Static fetch failed for {url}: {e}. Falling back to Playwright.")
            status_code = None

        # 2. Fallback to Playwright for JS rendering or if blocked (e.g. Cloudflare 403)
        return await self._fetch_playwright(url, proxy, status_code)
        
    async def _fetch_playwright(self, url: str, proxy: Optional[str] = None, prev_status: Optional[int] = None) -> dict:
        """Fetch using Playwright to render JS."""
        from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
        
        logger.info(f"Playwright fetch attempting: {url}")
        try:
            async with async_playwright() as p:
                launch_args = {}
                if proxy:
                    launch_args["proxy"] = {"server": proxy}
                    
                browser = await p.chromium.launch(headless=True, **launch_args)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={"width": 1920, "height": 1080},
                )
                page = await context.new_page()
                
                # Block media to speed up
                await page.route("**/*.{png,jpg,jpeg,webp,gif,css,woff2,svg,mp4,webm}", lambda route: route.abort())
                
                response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                status_code = response.status if response else (prev_status or 500)
                
                # Give SPA frameworks a second to inject content
                await page.wait_for_timeout(2000)
                
                html = await page.content()
                
                # Extract text using playwright's internal tools or beautifulsoup
                soup = BeautifulSoup(html, "html.parser")
                text = soup.get_text(separator=" ", strip=True)
                
                await browser.close()
                
                return {
                    "url": page.url,
                    "html": html,
                    "text": text,
                    "status_code": status_code,
                    "method": "playwright"
                }
                
        except Exception as e:
            logger.error(f"Playwright fetch failed for {url}: {e}")
            raise httpx.RequestError(f"All fetch methods failed for {url}. Last error: {e}")
