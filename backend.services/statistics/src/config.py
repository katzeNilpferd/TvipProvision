# backend.services/statistics/src/core/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Service
    SERVICE_HOST: str = "0.0.0.0"
    SERVICE_PORT: int = 8000
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "tvip_statistics"
    DB_USER: str = "stats_user"
    DB_PASSWORD: str = "stats_password"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    @property
    def DATABASE_URL(self) -> str:
        """Async database URL for SQLAlchemy."""
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # TimescaleDB specific
    RETENTION_DAYS: int = 90  # Keep raw data for 90 days
    COMPRESSION_DAYS: int = 7  # Compress data older than 7 days
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
