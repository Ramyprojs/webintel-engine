from fastapi import APIRouter
from app.api.routes.jobs import router as jobs_router
from app.api.routes.results import router as results_router

api_router = APIRouter(prefix="/api")

api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(results_router, prefix="/results", tags=["results"])
