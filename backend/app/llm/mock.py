import random
from typing import List

from app.schemas.llm import LLMExtractedData


class MockLLMProvider:
    """Mock LLM provider for demo/testing when no API key is configured.

    Returns plausible fake company data. Implements the LLMProvider protocol.
    """

    _COMPANIES = [
        ("Nexus Technologies", "Technology", "nexustech.com"),
        ("Quantum Dynamics", "Research & Development", "quantumdynamics.io"),
        ("Alpine Digital Solutions", "Consulting", "alpinedigital.com"),
        ("Horizon Ventures", "Financial Technology", "horizonventures.io"),
        ("Pinnacle Software", "Software", "pinnaclesoftware.com"),
        ("Crest Innovations", "Healthcare Technology", "crestinnovations.com"),
        ("Vertex Systems", "Cybersecurity", "vertexsystems.com"),
        ("Aero Dynamics", "Aerospace", "aerodynamics.co"),
        ("Zenith Corp", "Manufacturing", "zenithcorp.com"),
        ("Stellar Solutions", "Renewable Energy", "stellarsolutions.com"),
    ]

    _SUMMARIES = [
        "A leading provider of innovative {industry} solutions serving enterprise clients globally.",
        "Pioneering {industry} company focused on delivering cutting-edge technology and services.",
        "Fast-growing {industry} firm known for its customer-centric approach and technical excellence.",
        "Established {industry} company with a track record of delivering transformative solutions.",
    ]

    def extract_structured_data(self, raw_text: str) -> LLMExtractedData:
        """Extract structured data from raw text using mock data."""
        company_name, industry, domain = random.choice(self._COMPANIES)
        summary_template = random.choice(self._SUMMARIES)

        return LLMExtractedData(
            company_name=company_name,
            industry=industry,
            website=f"https://{domain}",
            contact_email=f"contact@{domain}",
            contact_phone=f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}",
            address=random.choice([
                "San Francisco, CA",
                "New York, NY",
                "Austin, TX",
                "Denver, CO",
                "Seattle, WA",
                "Boston, MA",
            ]),
            summary=summary_template.format(industry=industry),
            key_data_points={
                "founded": str(random.randint(2010, 2023)),
                "employees": random.choice(["50+", "100+", "250+", "500+", "1000+"]),
            },
            confidence_score=round(random.uniform(0.70, 0.95), 2),
        )

    def extract_batch(self, texts: List[str]) -> List[LLMExtractedData]:
        """Extract structured data from a batch of texts."""
        return [self.extract_structured_data(text) for text in texts]
