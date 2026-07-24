import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.job import JobStatus, InputType

class JobCreate(BaseModel):
    input_type: InputType
    input_value: str = Field(min_length=1)
    config: Optional[dict] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    input_type: InputType
    input_value: str
    status: JobStatus
    progress_percent: int
    stage_detail: Optional[str] = None
    error_message: Optional[str] = None
    config: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class JobListResponse(BaseModel):
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int

class JobProgressResponse(BaseModel):
    id: uuid.UUID
    status: JobStatus
    progress_percent: int
    stage_detail: Optional[str] = None
