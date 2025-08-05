"""
NeuroWeaver Health Check API
System health and status monitoring endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
import psutil
import asyncio

from app.core.config import settings
from app.core.database import engine
from app.core.logging import logger

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "neuroweaver-backend",
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT
    }


@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with system metrics"""
    try:
        # Database connectivity check
        db_status = await check_database_health()
        
        # System metrics
        system_metrics = get_system_metrics()
        
        # Service status
        service_status = {
            "training_enabled": settings.TRAINING_ENABLED,
            "auto_deploy": settings.AUTO_DEPLOY,
            "relaycore_enabled": settings.RELAYCORE_ENABLED
        }
        
        overall_status = "healthy" if db_status["status"] == "healthy" else "degraded"
        
        return {
            "status": overall_status,
            "service": "neuroweaver-backend",
            "version": settings.VERSION,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": settings.ENVIRONMENT,
            "database": db_status,
            "system": system_metrics,
            "services": service_status
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/readiness")
async def readiness_check():
    """Kubernetes readiness probe endpoint"""
    try:
        # Check database connectivity
        db_status = await check_database_health()
        
        if db_status["status"] != "healthy":
            raise HTTPException(status_code=503, detail="Database not ready")
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/liveness")
async def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


async def check_database_health() -> Dict[str, Any]:
    """Check database connectivity and health"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            await result.fetchone()
        
        return {
            "status": "healthy",
            "message": "Database connection successful",
            "response_time_ms": 0  # Could measure actual response time
        }
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
            "response_time_ms": None
        }


def get_system_metrics() -> Dict[str, Any]:
    """Get system performance metrics"""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        
        # Disk usage
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2),
                "used_percent": round((disk.used / disk.total) * 100, 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        return {
            "error": "Failed to retrieve system metrics"
        }