from typing import Optional

class ProxyProvider:
    """Interface for providing proxy URLs for scraping."""
    
    def get_proxy(self) -> Optional[str]:
        """Get a proxy URL. Returns None if no proxy should be used.
        
        Returns:
            Proxy URL string (e.g. 'http://user:pass@1.2.3.4:8080') or None
        """
        # For Phase 3, this is a no-op implementation.
        # It can be swapped for a real proxy rotation service in the future.
        return None
