"""
Configuration settings for NeuroWeaver
"""
import os
from typing import List


class Settings:
    """Application settings"""

    # App info
    APP_NAME: str = "NeuroWeaver"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
    ]

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://user:pass@localhost/neuroweaver"
    )

    # Storage paths
    DATA_DIR: str = os.getenv("DATA_DIR", "/app/data")
    MODEL_STORAGE_PATH: str = os.getenv("MODEL_STORAGE_PATH", "/app/models")

    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    WANDB_API_KEY: str = os.getenv("WANDB_API_KEY", "")


settings = Settings()
