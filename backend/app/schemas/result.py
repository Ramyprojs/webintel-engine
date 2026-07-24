import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.structured_result import ResultStatus

class ResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    job_id: uuid.UUID
    scraped_page_id: uuid.UUID
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    key_data_points: Optional[dict] = None
    confidence_score: Optional[float] = None
    status: ResultStatus
    review_notes: Optional[str] = None
    created_at: datetime

class ResultListResponse(BaseModel):
    results: List[ResultResponse]
    total: int
    page: int
    page_size: int

class ResultFilter(BaseModel):
    job_id: Optional[uuid.UUID] = None
    status: Optional[ResultStatus] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
