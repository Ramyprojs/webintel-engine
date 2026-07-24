import enum
import uuid
from typing import Optional, List
from sqlalchemy import String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, UUIDPrimaryKeyMixin

class JobStatus(str, enum.Enum):
    queued = "queued"
    scraping = "scraping"
    cleaning = "cleaning"
    done = "done"
    partial = "partial"
    failed = "failed"

class InputType(str, enum.Enum):
    domain = "domain"
    keyword = "keyword"
    search_term = "search_term"

class Job(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "jobs"

    input_type: Mapped[InputType] = mapped_column()
    input_value: Mapped[str] = mapped_column(String(2048))
    status: Mapped[JobStatus] = mapped_column(default=JobStatus.queued)
    progress_percent: Mapped[int] = mapped_column(default=0)
    stage_detail: Mapped[Optional[str]] = mapped_column()
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    internal_error: Mapped[Optional[str]] = mapped_column(Text)
    config: Mapped[Optional[dict]] = mapped_column(JSON)

    scraped_pages: Mapped[List["ScrapedPage"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    structured_results: Mapped[List["StructuredResult"]] = relationship(back_populates="job", cascade="all, delete-orphan")
