"""
NeuroWeaver Configuration
Application settings and environment configuration
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    APP_NAME: str = "NeuroWeaver Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ALLOWED_HOSTS: List[str] = ["*"]
    CORS_ORIGINS: List[str] = ["*"]
    
    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/neuroweaver"
    DATABASE_ECHO: bool = False
    
    # Authentication settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # AI/ML settings
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    WANDB_API_KEY: Optional[str] = None
    
    # Training settings
    TRAINING_ENABLED: bool = True
    AUTO_DEPLOY: bool = False
    MODEL_STORAGE_PATH: str = "/tmp/neuroweaver/models"
    DATA_DIR: str = "/tmp/neuroweaver/data"
    
    # RelayCore integration
    RELAYCORE_URL: str = "http://localhost:3001"
    RELAYCORE_API_KEY: Optional[str] = None
    RELAYCORE_ENABLED: bool = True
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Performance settings
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 8
    MAX_SEQUENCE_LENGTH: int = 2048
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @validator("ALLOWED_HOSTS", pre=True)
    def assemble_allowed_hosts(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure required directories exist
os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)