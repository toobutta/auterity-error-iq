"""
App settings for DB and environment config.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database configuration
    SQLALCHEMY_DATABASE_URL: str = (
        "postgresql+psycopg2://user:password@localhost:5432/auterity"
    )
    
    # Environment settings
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Security settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    
    # CORS settings
    CORS_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"


settings = Settings()


def get_settings():
    return settings
