from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from app.api.deps import DBSession
from app.models.structured_result import StructuredResult, ResultStatus
from app.schemas.result import ResultResponse, ResultListResponse
import csv
import io

router = APIRouter()

def build_result_query(
    job_id: Optional[UUID] = None,
    status: Optional[ResultStatus] = None,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    query = select(StructuredResult)
    if job_id:
        query = query.where(StructuredResult.job_id == job_id)
    if status:
        query = query.where(StructuredResult.status == status)
    if company_name:
        query = query.where(StructuredResult.company_name.ilike(f"%{company_name}%"))
    if industry:
        query = query.where(StructuredResult.industry.ilike(f"%{industry}%"))
    if date_from:
        query = query.where(StructuredResult.created_at >= date_from)
    if date_to:
        query = query.where(StructuredResult.created_at <= date_to)
    return query

@router.get("/", response_model=ResultListResponse)
async def list_results(
    db: DBSession,
    page: int = 1,
    page_size: int = 20,
    job_id: Optional[UUID] = None,
    status: Optional[ResultStatus] = None,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """
    Query results with filters and pagination.
    """
    base_query = build_result_query(job_id, status, company_name, industry, date_from, date_to)
    
    count_query = select(func.count()).select_from(base_query.subquery())
    
    query = base_query.order_by(StructuredResult.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    try:
        total_count = await db.scalar(count_query)
        result = await db.execute(query)
        results = result.scalars().all()
        return ResultListResponse(
            results=results,
            total=total_count,
            page=page,
            page_size=page_size
        )
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred.")

@router.get("/export")
async def export_results(
    db: DBSession,
    format: str = 'json',
    job_id: Optional[UUID] = None,
    status: Optional[ResultStatus] = None,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
):
    """
    Export results matching filters. Supported formats: json, csv.
    """
    query = build_result_query(job_id, status, company_name, industry, date_from, date_to)
    query = query.order_by(StructuredResult.created_at.desc())
    
    try:
        result = await db.execute(query)
        results = result.scalars().all()
        
        if format.lower() == 'csv':
            output = io.StringIO()
            if results:
                fields = ["id", "job_id", "status", "company_name", "industry", "created_at"]
                writer = csv.DictWriter(output, fieldnames=fields, extrasaction='ignore')
                writer.writeheader()
                for r in results:
                    writer.writerow({
                        "id": str(r.id),
                        "job_id": str(r.job_id),
                        "status": r.status.value if hasattr(r.status, 'value') else str(r.status),
                        "company_name": r.company_name,
                        "industry": r.industry,
                        "created_at": r.created_at.isoformat() if r.created_at else ""
                    })
            
            output.seek(0)
            return StreamingResponse(
                iter([output.getvalue()]), 
                media_type="text/csv", 
                headers={"Content-Disposition": "attachment; filename=export.csv"}
            )
            
        else:
            return [ResultResponse.model_validate(r).model_dump() for r in results]
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error occurred.")
