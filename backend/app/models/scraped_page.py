import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class PageStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    skipped = "skipped"

class ScrapedPage(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "scraped_pages"

    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id"))
    url: Mapped[str] = mapped_column(String(4096))
    domain: Mapped[str] = mapped_column(String(512))
    raw_html: Mapped[Optional[str]] = mapped_column(Text)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[PageStatus] = mapped_column(default=PageStatus.pending)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    http_status_code: Mapped[Optional[int]] = mapped_column()
    retry_count: Mapped[int] = mapped_column(default=0)
    scraped_at: Mapped[Optional[datetime]] = mapped_column()

    job: Mapped["Job"] = relationship(back_populates="scraped_pages")
    structured_result: Mapped[Optional["StructuredResult"]] = relationship(back_populates="scraped_page", uselist=False)
