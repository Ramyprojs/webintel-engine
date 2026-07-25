import enum
import uuid
from typing import Optional
from sqlalchemy import String, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class ResultStatus(str, enum.Enum):
    cleaned = "cleaned"
    needs_review = "needs_review"
    failed = "failed"

class StructuredResult(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "structured_results"

    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"))
    scraped_page_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("scraped_pages.id"), unique=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(512))
    industry: Mapped[Optional[str]] = mapped_column(String(256))
    website: Mapped[Optional[str]] = mapped_column(String(2048))
    contact_email: Mapped[Optional[str]] = mapped_column(String(512))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(128))
    address: Mapped[Optional[str]] = mapped_column(String(1024))
    summary: Mapped[Optional[str]] = mapped_column(Text)
    key_data_points: Mapped[Optional[dict]] = mapped_column(JSON)
    confidence_score: Mapped[Optional[float]] = mapped_column()
    status: Mapped[ResultStatus] = mapped_column(default=ResultStatus.cleaned)
    review_notes: Mapped[Optional[str]] = mapped_column(Text)

    job: Mapped["Job"] = relationship(back_populates="structured_results")
    scraped_page: Mapped["ScrapedPage"] = relationship(back_populates="structured_result")

    @property
    def source_url(self) -> Optional[str]:
        if hasattr(self, "scraped_page") and self.scraped_page:
            return self.scraped_page.url
        return None
