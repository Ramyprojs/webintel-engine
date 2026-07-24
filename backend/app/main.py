from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.api.routes import api_router
from app.api.routes.ws import router as ws_router
from app.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting WebIntel Engine API...")
    yield
    logger.info("Shutting down WebIntel Engine API...")

app = FastAPI(
    title="WebIntel Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router, prefix="/ws")

@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}
