import logging
from urllib.parse import urlparse
from robotexclusionrulesparser import RobotExclusionRulesParser
import httpx

logger = logging.getLogger(__name__)

class RobotsChecker:
    """Checks and caches robots.txt rules per domain."""
    
    def __init__(self):
        # Maps domain -> RobotExclusionRulesParser instance
        self._cache: dict[str, RobotExclusionRulesParser] = {}
        
    async def can_fetch(self, url: str, user_agent: str = "*") -> bool:
        """Check if the given URL is allowed to be fetched by the user agent.
        
        Downloads and parses robots.txt on the first check for a domain.
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        if not domain:
            return False
            
        if domain not in self._cache:
            robots_url = f"{parsed_url.scheme}://{domain}/robots.txt"
            parser = RobotExclusionRulesParser()
            
            try:
                # Use a fast timeout for robots.txt
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(robots_url, follow_redirects=True)
                    
                if response.status_code == 200:
                    parser.parse(response.text)
                    logger.debug(f"Loaded robots.txt for {domain}")
                else:
                    # If not 200, assume allowed
                    logger.debug(f"No valid robots.txt for {domain} (Status {response.status_code})")
            except Exception as e:
                # If network error fetching robots.txt, assume allowed (fail open)
                logger.warning(f"Failed to fetch robots.txt for {domain}: {e}")
                
            self._cache[domain] = parser
            
        return self._cache[domain].is_allowed(user_agent, url)
