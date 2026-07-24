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
    key_data_points: Optional[dict] = Field(None, description="Arbitrary key-value pairs of other relevant numerical or categorical data extracted.")
    confidence_score: float = Field(..., description="A score between 0.0 and 1.0 indicating how confident the extraction was.")
    error_diagnostic: Optional[str] = Field(None, description="Diagnostic message if extraction failed after all retries.")
