"""
NeuroWeaver Backend - Model Specialization Service
FastAPI application for automotive AI model training and deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os
from contextlib import asynccontextmanager

from app.api import models, training, inference, health, automotive
from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import setup_logging, logger
from app.services.model_registry import ModelRegistry
from app.services.relaycore_connector import RelayCoreConnector


# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting NeuroWeaver Backend")

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialize services
    ModelRegistry()  # Initialize registry
    relaycore_connector = RelayCoreConnector()

    # Register with RelayCore
    try:
        await relaycore_connector.register_service()
        logger.info("Successfully registered with RelayCore")
    except Exception as e:
        logger.warning(f"Failed to register with RelayCore: {e}")

    yield

    # Shutdown
    logger.info("Shutting down NeuroWeaver Backend")

# Create FastAPI application
app = FastAPI(
    title="NeuroWeaver Backend",
    description="AI Model Specialization Service for Automotive Domain",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(
    models.router, prefix="/api/v1/models", tags=["models"]
)
app.include_router(
    training.router, prefix="/api/v1/training", tags=["training"]
)
app.include_router(
    inference.router, prefix="/api/v1/inference", tags=["inference"]
)
app.include_router(
    automotive.router, prefix="/api/v1/automotive", tags=["automotive"]
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "NeuroWeaver Backend",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled",
        "specializations": [
            "automotive-sales",
            "service-advisor",
            "parts-specialist",
            "finance-advisor"
        ]
    }

@app.get("/api/v1/status")
async def get_status():
    """Get service status and capabilities"""
    return {
        "service": "neuroweaver-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "training_enabled": settings.TRAINING_ENABLED,
        "auto_deploy": settings.AUTO_DEPLOY,
        "model_storage": settings.MODEL_STORAGE_PATH,
        "available_specializations": [
            {
                "name": "automotive-sales",
                "description": "Specialized for automotive sales conversations",
                "status": "available"
            },
            {
                "name": "service-advisor",
                "description": "Specialized for service department interactions",
                "status": "available"
            },
            {
                "name": "parts-specialist",
                "description": "Specialized for parts department queries",
                "status": "available"
            },
            {
                "name": "finance-advisor",
                "description": "Specialized for automotive financing",
                "status": "development"
            }
        ]
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return {
        "error": {
            "status_code": exc.status_code,
            "message": exc.detail,
            "type": "http_error"
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return {
        "error": {
            "status_code": 500,
            "message": "Internal server error",
            "type": "server_error",
            "details": str(exc) if settings.DEBUG else None
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=settings.DEBUG,
        log_level="info"
    )