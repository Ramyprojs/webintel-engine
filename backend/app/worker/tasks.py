import time
import logging
import traceback
from datetime import datetime, timezone
import asyncio

from app.worker.celery_app import celery_app
from app.db.session import get_sync_session
from app.models.job import Job, JobStatus, InputType
from app.models.scraped_page import ScrapedPage, PageStatus
from app.models.structured_result import StructuredResult, ResultStatus

logger = logging.getLogger(__name__)


def update_job_progress(session, job, status=None, progress=None, stage_detail=None):
    """Update job progress and commit to the database."""
    if status is not None:
        job.status = status
    if progress is not None:
        job.progress_percent = progress
    if stage_detail is not None:
        job.stage_detail = stage_detail
    session.commit()
    logger.info(
        f"Job {job.id} updated: status={job.status}, "
        f"progress={job.progress_percent}%, stage={job.stage_detail}"
    )


# Stub scraping function removed. Now handled by ScrapeEngine in app/scraping/engine.py


def run_cleaning_stage(session, job, gemini_api_key=None):
    """Stub cleaning stage — creates StructuredResult for each scraped page.

    Will be replaced with real LLM cleaning in Phase 4.
    """
    logger.info(f"Starting cleaning stage for job {job.id}")

    pages = (
        session.query(ScrapedPage)
        .filter(
            ScrapedPage.job_id == job.id,
            ScrapedPage.status == PageStatus.success,
        )
        .all()
    )

    if not pages:
        logger.info(f"No successful pages to clean for job {job.id}")
        return

    # Choose provider
    from app.config import settings
    api_key = gemini_api_key or settings.GEMINI_API_KEY
    if api_key:
        from app.llm.gemini import GeminiProvider
        provider = GeminiProvider(api_key=api_key)
        logger.info('Using GeminiProvider for LLM extraction')
    else:
        from app.llm.mock import MockLLMProvider
        provider = MockLLMProvider()
        logger.info('Using MockLLMProvider for LLM extraction (no API key configured)')

    from app.llm.cleaner import DataCleaner
    cleaner = DataCleaner(provider, batch_size=settings.LLM_BATCH_SIZE)

    # Process all texts with live progress updates
    texts = [page.extracted_text for page in pages]
    total_items = len(texts)
    
    def on_progress(items_done, total):
        progress = 50 + int((items_done / total) * 40)
        update_job_progress(
            session, job,
            progress=progress,
            stage_detail=f"Cleaned {items_done}/{total} pages..."
        )

    results = cleaner.clean_texts(texts, progress_callback=on_progress)

    # Store results
    for idx, (page, result_data) in enumerate(zip(pages, results)):
        if result_data.error_diagnostic:
            status = ResultStatus.failed if "API Error" in result_data.error_diagnostic else ResultStatus.needs_review
        else:
            status = ResultStatus.cleaned if result_data.confidence_score and result_data.confidence_score > 0 else ResultStatus.needs_review
        
        result = StructuredResult(
            job_id=job.id,
            scraped_page_id=page.id,
            company_name=result_data.company_name,
            industry=result_data.industry,
            website=result_data.website,
            contact_email=result_data.contact_email,
            contact_phone=result_data.contact_phone,
            address=result_data.address,
            summary=result_data.summary,
            key_data_points=result_data.key_data_points,
            confidence_score=result_data.confidence_score,
            status=status,
            review_notes=result_data.error_diagnostic,
        )
        session.add(result)
    
    session.commit()
    
    update_job_progress(
        session, job,
        progress=95,
        stage_detail=f"Saved {len(pages)} cleaned records to database"
    )


@celery_app.task(name="app.worker.tasks.process_job", bind=True)
def process_job(self, job_id: str):
    """Main orchestrator task: scrape → clean → store results.

    This task is dispatched by the API when a new job is created.
    It runs synchronously in a Celery worker process.
    """
    logger.info(f"Processing job: {job_id}")

    with get_sync_session() as session:
        job = session.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in database")
            return

        api_key = job.config.get("gemini_api_key") if job.config else None

        try:
            # Stage 1: Scraping
            update_job_progress(
                session, job,
                status=JobStatus.scraping,
                progress=1,
                stage_detail="Starting scraper..."
            )

            from app.scraping.engine import ScrapeEngine
            engine = ScrapeEngine()
            asyncio.run(engine.scrape_job(job, session))

            # Stage 2: Cleaning
            update_job_progress(
                session, job,
                status=JobStatus.cleaning,
                progress=50,
                stage_detail="Starting LLM data cleaning..."
            )

            run_cleaning_stage(session, job, gemini_api_key=api_key)

            # Done
            update_job_progress(
                session, job,
                status=JobStatus.done,
                progress=100,
                stage_detail="Job completed successfully"
            )
            logger.info(f"Job {job_id} completed successfully")

        except Exception as exc:
            logger.error(f"Error processing job {job_id}: {exc}")
            job.status = JobStatus.failed
            job.progress_percent = job.progress_percent  # freeze at last value
            job.error_message = f"Job processing failed: {type(exc).__name__}"
            job.internal_error = traceback.format_exc()
            job.stage_detail = "Failed"
            session.commit()
            raise
