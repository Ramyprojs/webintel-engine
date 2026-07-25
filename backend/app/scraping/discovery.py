import logging
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

from duckduckgo_search import DDGS
from app.config import settings

logger = logging.getLogger(__name__)


def extract_internal_links(html: str, base_url: str) -> list[str]:
    """Parse HTML and return a list of internal links belonging to the same domain."""
    soup = BeautifulSoup(html, "html.parser")
    base_domain = urlparse(base_url).netloc
    
    internal_links = set()
    
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        
        # Skip junk links
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
            
        full_url = urljoin(base_url, href)
        parsed_full = urlparse(full_url)
        
        # Only keep HTTP/HTTPS links
        if parsed_full.scheme not in ("http", "https"):
            continue
            
        # Check if it's the same domain
        if parsed_full.netloc == base_domain:
            # Strip fragment anchor (#) but preserve query parameters for dynamic pages
            clean_url = f"{parsed_full.scheme}://{parsed_full.netloc}{parsed_full.path}"
            if parsed_full.query:
                clean_url += f"?{parsed_full.query}"
            internal_links.add(clean_url)
            
    return list(internal_links)


def search_for_urls(query: str, max_results: int = 5) -> list[str]:
    """Use DuckDuckGo search to find relevant URLs for a keyword or search term."""
    logger.info(f"Searching DuckDuckGo for: '{query}'")
    urls = []
    
    try:
        with DDGS() as ddgs:
            results = ddgs.text(query, max_results=max_results)
            for r in results:
                target_url = r.get("href") or r.get("link")
                if target_url:
                    urls.append(target_url)
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        
    return urls
