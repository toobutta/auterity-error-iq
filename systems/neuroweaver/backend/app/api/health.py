"""
Health Check API
System health and status endpoints
"""

import asyncio
import psutil
import torch
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.config import settings
from app.core.logging import get_logger
from app.middleware.prometheus import metrics_endpoint

logger = get_logger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.VERSION
    }


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db_session)):
    """Detailed health check with system information"""
    try:
        health_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "system": await _get_system_info(),
            "database": await _check_database_health(db),
            "gpu": _get_gpu_info(),
            "dependencies": _check_dependencies()
        }
        
        # Determine overall health status
        if not health_data["database"]["healthy"]:
            health_data["status"] = "unhealthy"
            
        return health_data
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db_session)):
    """Kubernetes readiness probe"""
    try:
        # Check database connectivity
        await db.execute("SELECT 1")
        
        # Check if training is enabled and working
        if settings.TRAINING_ENABLED:
            # Basic GPU check if available
            if torch.cuda.is_available():
                torch.cuda.device_count()
        
        return {"status": "ready"}
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    try:
        # Basic application liveness check
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}
        
    except Exception as e:
        logger.error(f"Liveness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not alive")


@router.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return await metrics_endpoint()


async def _get_system_info() -> Dict[str, Any]:
    """Get system information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": (disk.used / disk.total) * 100
            },
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
    except Exception as e:
        logger.error(f"Failed to get system info: {e}")
        return {"error": str(e)}


async def _check_database_health(db: AsyncSession) -> Dict[str, Any]:
    """Check database health"""
    try:
        start_time = datetime.utcnow()
        await db.execute("SELECT 1")
        end_time = datetime.utcnow()
        
        response_time = (end_time - start_time).total_seconds() * 1000
        
        return {
            "healthy": True,
            "response_time_ms": response_time,
            "url": settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else "hidden"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "healthy": False,
            "error": str(e)
        }


def _get_gpu_info() -> Dict[str, Any]:
    """Get GPU information"""
    try:
        if not torch.cuda.is_available():
            return {"available": False, "message": "CUDA not available"}
        
        gpu_count = torch.cuda.device_count()
        gpus = []
        
        for i in range(gpu_count):
            gpu_props = torch.cuda.get_device_properties(i)
            memory_allocated = torch.cuda.memory_allocated(i)
            memory_cached = torch.cuda.memory_reserved(i)
            
            gpus.append({
                "id": i,
                "name": gpu_props.name,
                "memory_total": gpu_props.total_memory,
                "memory_allocated": memory_allocated,
                "memory_cached": memory_cached,
                "memory_free": gpu_props.total_memory - memory_allocated,
                "compute_capability": f"{gpu_props.major}.{gpu_props.minor}"
            })
        
        return {
            "available": True,
            "count": gpu_count,
            "gpus": gpus
        }
        
    except Exception as e:
        logger.error(f"Failed to get GPU info: {e}")
        return {"available": False, "error": str(e)}


def _check_dependencies() -> Dict[str, Any]:
    """Check critical dependencies"""
    dependencies = {}
    
    try:
        # Check PyTorch
        dependencies["torch"] = {
            "version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "status": "healthy"
        }
    except Exception as e:
        dependencies["torch"] = {"status": "error", "error": str(e)}
    
    try:
        # Check Transformers
        import transformers
        dependencies["transformers"] = {
            "version": transformers.__version__,
            "status": "healthy"
        }
    except Exception as e:
        dependencies["transformers"] = {"status": "error", "error": str(e)}
    
    try:
        # Check Datasets
        import datasets
        dependencies["datasets"] = {
            "version": datasets.__version__,
            "status": "healthy"
        }
    except Exception as e:
        dependencies["datasets"] = {"status": "error", "error": str(e)}
    
    return dependencies