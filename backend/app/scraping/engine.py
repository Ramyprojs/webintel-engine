import asyncio
import logging
from collections import deque
from datetime import datetime, timezone
from urllib.parse import urlparse

from app.config import settings
from app.models.job import Job, InputType
from app.models.scraped_page import ScrapedPage, PageStatus
from app.scraping.proxy import ProxyProvider
from app.scraping.robots import RobotsChecker
from app.scraping.fetcher import Fetcher
from app.scraping.discovery import extract_internal_links, search_for_urls
from app.worker.tasks import update_job_progress

logger = logging.getLogger(__name__)


class ScrapeEngine:
    """Orchestrates the scraping process for a job."""

    def __init__(self):
        self.proxy_provider = ProxyProvider()
        self.robots_checker = RobotsChecker()
        self.fetcher = Fetcher(proxy_provider=self.proxy_provider)
        self.max_depth = settings.SCRAPE_MAX_DEPTH
        self.max_pages = settings.SCRAPE_MAX_PAGES

    async def scrape_job(self, job: Job, session) -> list[ScrapedPage]:
        """Execute the scrape job and return the ScrapedPage records.
        
        Updates job progress dynamically in the DB.
        """
        logger.info(f"Starting ScrapeEngine for Job {job.id}")
        
        # 1. Discover seed URLs
        seed_urls = []
        if job.input_type == InputType.domain:
            val = job.input_value
            if not val.startswith("http"):
                val = f"https://{val}"
            seed_urls.append(val)
        else:
            # Keyword or search term -> Use DDG search
            logger.info(f"Using DDG search for {job.input_type}: {job.input_value}")
            discovered = search_for_urls(job.input_value, max_results=5)
            seed_urls.extend(discovered)

        if not seed_urls:
            logger.warning(f"No seed URLs found for Job {job.id}")
            return []

        # 2. BFS Crawl Queue
        # Queue stores tuples of (url, current_depth)
        queue = deque([(url, 0) for url in seed_urls])
        visited = set()
        scraped_records = []
        
        pages_processed = 0

        while queue and pages_processed < self.max_pages:
            current_url, current_depth = queue.popleft()
            
            if current_url in visited:
                continue
                
            visited.add(current_url)
            pages_processed += 1
            
            # Progress update (scale 1 to 49 for the scraping phase)
            progress = int(1 + (pages_processed / self.max_pages) * 48)
            update_job_progress(
                session, job,
                progress=progress,
                stage_detail=f"Scraping page {pages_processed} (depth {current_depth})"
            )

            # Robots.txt check
            is_allowed = await self.robots_checker.can_fetch(current_url)
            if not is_allowed:
                logger.info(f"Robots.txt disallowed: {current_url}")
                record = self._create_page_record(job.id, current_url, status=PageStatus.skipped, error="Blocked by robots.txt")
                session.add(record)
                session.commit()
                continue

            # Fetch
            try:
                result = await self.fetcher.fetch(current_url)
                html = result["html"]
                text = result["text"]
                status_code = result["status_code"]
                
                record = self._create_page_record(
                    job.id, current_url,
                    html=html, text=text,
                    status=PageStatus.success,
                    status_code=status_code
                )
                session.add(record)
                session.commit()
                scraped_records.append(record)
                
                # Discover more links if depth allows
                if current_depth < self.max_depth:
                    new_links = extract_internal_links(html, current_url)
                    for link in new_links:
                        if link not in visited:
                            queue.append((link, current_depth + 1))
                            
            except Exception as e:
                logger.error(f"Failed to fetch {current_url}: {e}")
                record = self._create_page_record(job.id, current_url, status=PageStatus.failed, error=str(e))
                session.add(record)
                session.commit()
                
        # Close Redis connection on the fetcher
        await self.fetcher.redis_client.aclose()
                
        update_job_progress(session, job, progress=49, stage_detail="Scraping complete")
        return scraped_records

    def _create_page_record(self, job_id, url: str, html: str = None, text: str = None, 
                            status: PageStatus = PageStatus.pending, status_code: int = None, 
                            error: str = None) -> ScrapedPage:
        domain = urlparse(url).netloc
        return ScrapedPage(
            job_id=job_id,
            url=url,
            domain=domain,
            raw_html=html,
            extracted_text=text,
            status=status,
            http_status_code=status_code,
            error_message=error,
            scraped_at=datetime.now(timezone.utc)
        )
