from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class LLMExtractedData(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    summary: Optional[str] = None
    key_data_points: Optional[dict] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
