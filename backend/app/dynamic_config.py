import json
import logging
import redis.asyncio as redis
from sqlalchemy import select
# removed get_db import
from app.models.config import AppConfig
from app.config import settings

logger = logging.getLogger(__name__)

# Reusing the celery broker URL for our caching layer
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class DynamicConfig:
    @staticmethod
    async def get_gemini_key(db_session=None) -> str | None:
        """Fetch the Gemini API key from Redis cache, falling back to Postgres."""
        # 1. Check Redis cache first
        try:
            cached_key = await redis_client.get("config:gemini_api_key")
            if cached_key is not None:
                return cached_key if cached_key != "null" else None
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")

        # 2. If not in cache, read from DB
        should_close = False
        if db_session is None:
            # Create a throwaway session if none provided
            from app.db.session import async_session
            db_session = async_session()
            should_close = True

        try:
            result = await db_session.execute(select(AppConfig).where(AppConfig.key == "GEMINI_API_KEY"))
            config_entry = result.scalar_one_or_none()
            api_key = config_entry.value if config_entry else None

            # 3. Save to cache
            try:
                await redis_client.set("config:gemini_api_key", api_key or "null")
            except Exception as e:
                logger.warning(f"Redis cache write failed: {e}")

            return api_key
        finally:
            if should_close:
                await db_session.close()

    @staticmethod
    async def set_gemini_key(api_key: str, db_session) -> None:
        """Store the Gemini API key in Postgres and explicitly invalidate the Redis cache."""
        result = await db_session.execute(select(AppConfig).where(AppConfig.key == "GEMINI_API_KEY"))
        config_entry = result.scalar_one_or_none()
        
        if config_entry:
            config_entry.value = api_key
        else:
            config_entry = AppConfig(key="GEMINI_API_KEY", value=api_key)
            db_session.add(config_entry)
            
        await db_session.commit()

        # Invalidate the cache immediately so Celery workers see it on next task
        try:
            await redis_client.delete("config:gemini_api_key")
        except Exception as e:
            logger.warning(f"Redis cache invalidation failed: {e}")
