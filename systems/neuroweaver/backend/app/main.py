"""
NeuroWeaver Backend Main Application
FastAPI application with training pipeline and model management
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from app.core.config import settings
from app.core.logging import logger
from app.core.database import init_database, close_database
from app.middleware.prometheus import PrometheusMiddleware

# Import API routers
from app.api.health import router as health_router
from app.api.training import router as training_router
from app.api.models import router as models_router
from app.api.inference import router as inference_router
from app.api.automotive import router as automotive_router
from app.api.performance import router as performance_router
from app.api.alerts import router as alerts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting NeuroWeaver Backend...")
    
    try:
        # Initialize database
        await init_database()
        logger.info("Database initialized successfully")
        
        # Additional startup tasks
        logger.info(f"NeuroWeaver Backend started successfully on {settings.HOST}:{settings.PORT}")
        
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down NeuroWeaver Backend...")
    try:
        await close_database()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="NeuroWeaver Backend - AI Model Training and Management Platform",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus middleware
app.add_middleware(PrometheusMiddleware)

# Include API routers
app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(training_router, prefix="/api/v1", tags=["training"])
app.include_router(models_router, prefix="/api/v1", tags=["models"])
app.include_router(inference_router, prefix="/api/v1", tags=["inference"])
app.include_router(automotive_router, prefix="/api/v1", tags=["automotive"])
app.include_router(performance_router, prefix="/api/v1", tags=["performance"])
app.include_router(alerts_router, prefix="/api/v1", tags=["alerts"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.DEBUG else "disabled"
    }


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global HTTP exception handler"""
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )