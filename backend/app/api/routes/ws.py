import asyncio
import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session
from app.models.job import Job, JobStatus

logger = logging.getLogger(__name__)

router = APIRouter()

TERMINAL_STATES = {JobStatus.done, JobStatus.partial, JobStatus.failed}


@router.websocket("/jobs/{job_id}/progress")
async def job_progress_ws(websocket: WebSocket, job_id: UUID):
    """WebSocket endpoint for live job progress updates.

    Polls the job row every 1 second and pushes status updates.
    Auto-closes when the job reaches a terminal state.
    """
    await websocket.accept()

    try:
        async with async_session() as db:
            # Validate job exists
            job = await db.get(Job, job_id)
            if not job:
                await websocket.close(code=4004, reason="Job not found")
                return

            while True:
                # Refresh to get latest state from DB
                await db.refresh(job)

                msg = {
                    "id": str(job.id),
                    "status": job.status.value,
                    "progress_percent": job.progress_percent,
                    "stage_detail": job.stage_detail,
                }

                await websocket.send_json(msg)

                if job.status in TERMINAL_STATES:
                    await websocket.close()
                    break

                await asyncio.sleep(1)

    except WebSocketDisconnect:
        logger.debug(f"WebSocket disconnected for job {job_id}")
    except Exception as exc:
        logger.error(f"WebSocket error for job {job_id}: {exc}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except Exception:
            pass
