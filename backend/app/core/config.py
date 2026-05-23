import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Sentinel-Shield"
    DEBUG: bool = False
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentinel-shield-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:nH2eoIZoLnUq90Xy@db.xpccbkhgsrmkqxyprrtg.supabase.co:5432/postgres"
    )
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "./ml_artifacts")
    DATASET_PATH: str = os.getenv("DATASET_PATH", "./datasets")
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
