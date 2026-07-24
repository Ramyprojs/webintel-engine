import logging
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import DBSession
from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate, JobResponse, JobListResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(job_in: JobCreate, db: DBSession):
    """Create a new scraping job and dispatch it to the Celery worker."""
    try:
        new_job = Job(
            input_type=job_in.input_type,
            input_value=job_in.input_value,
            config=job_in.config,
            status=JobStatus.queued,
        )
        db.add(new_job)
        await db.commit()
        await db.refresh(new_job)

        # Late import to avoid circular dependency at module load time
        try:
            from app.worker.tasks import process_job
            process_job.delay(str(new_job.id))
            logger.info(f"Dispatched job {new_job.id} to worker")
        except ImportError:
            logger.warning("Celery worker not available — job queued but not dispatched")

        return new_job
    except SQLAlchemyError as exc:
        await db.rollback()
        logger.error(f"Database error creating job: {exc}")
        raise HTTPException(status_code=500, detail="Database error occurred.")


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    db: DBSession,
    page: int = 1,
    page_size: int = 20,
    status: Optional[JobStatus] = None,
):
    """List all jobs with optional filtering by status and pagination."""
    query = select(Job)
    count_query = select(func.count()).select_from(Job)

    if status:
        query = query.where(Job.status == status)
        count_query = count_query.where(Job.status == status)

    query = query.order_by(Job.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    try:
        total_count = await db.scalar(count_query)
        result = await db.execute(query)
        jobs = result.scalars().all()
        return JobListResponse(
            jobs=jobs,
            total=total_count or 0,
            page=page,
            page_size=page_size,
        )
    except SQLAlchemyError as exc:
        logger.error(f"Database error listing jobs: {exc}")
        raise HTTPException(status_code=500, detail="Database error occurred.")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: UUID, db: DBSession):
    """Get a single job by its UUID."""
    try:
        job = await db.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except SQLAlchemyError as exc:
        logger.error(f"Database error fetching job {job_id}: {exc}")
        raise HTTPException(status_code=500, detail="Database error occurred.")


@router.post("/{job_id}/retry", response_model=JobResponse)
async def retry_job(job_id: UUID, db: DBSession):
    """Retry a failed job by resetting its state and re-dispatching."""
    try:
        job = await db.get(Job, job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status != JobStatus.failed:
            raise HTTPException(
                status_code=400,
                detail="Only failed jobs can be retried"
            )

        job.status = JobStatus.queued
        job.error_message = None
        job.internal_error = None
        job.progress_percent = 0
        job.stage_detail = None

        await db.commit()
        await db.refresh(job)

        try:
            from app.worker.tasks import process_job
            process_job.delay(str(job.id))
            logger.info(f"Re-dispatched job {job.id} for retry")
        except ImportError:
            logger.warning("Celery worker not available — job queued but not dispatched")

        return job
    except SQLAlchemyError as exc:
        await db.rollback()
        logger.error(f"Database error retrying job {job_id}: {exc}")
        raise HTTPException(status_code=500, detail="Database error occurred.")
