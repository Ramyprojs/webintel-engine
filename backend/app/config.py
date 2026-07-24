from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env')

    DATABASE_URL: str = "postgresql+asyncpg://webintel:webintel@localhost:5432/webintel"
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.5-flash"
    SCRAPE_MAX_DEPTH: int = 1
    SCRAPE_MAX_PAGES: int = 20
    SCRAPE_RATE_LIMIT_RPS: float = 2.0
    SCRAPE_MAX_RETRIES: int = 3
    LLM_BATCH_SIZE: int = 5
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

settings = Settings()
