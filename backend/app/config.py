"""Application settings loaded from environment variables."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App configuration. Values can be overridden via .env or environment variables."""

    DATABASE_URL: str = "postgresql+asyncpg://outfit_user:outfit_pass@localhost:5432/outfit_db"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://outfit_user:outfit_pass@localhost:5432/outfit_db"
    UPLOAD_DIR: str = "uploads"
    MODEL_INPUT_SIZE: int = 300
    EMBEDDING_DIM: int = 1536
    TOP_K_RECOMMENDATIONS: int = 5
    SESSION_SECRET_KEY: str = "outfit-ai-session-secret-change-in-production"
    SESSION_MAX_AGE: int = 604800  # 7 days in seconds

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
