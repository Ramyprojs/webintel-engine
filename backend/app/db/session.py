from contextlib import contextmanager

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Async engine (for FastAPI)
async_engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(async_engine, expire_on_commit=False)


async def get_db_session():
    """Async session generator for FastAPI dependency injection."""
    async with async_session() as session:
        yield session


# Sync engine (for Celery workers)
sync_database_url = settings.DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql+psycopg2://"
)
sync_engine = create_engine(sync_database_url, echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine)


@contextmanager
def get_sync_session():
    """Sync session context manager for Celery tasks."""
    session = SyncSessionLocal()
    try:
        yield session
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
