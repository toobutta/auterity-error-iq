from typing import Any, Dict

from app.db.session import get_db
from app.services.redis_service import get_redis
from app.services.search_service import get_search_service
from fastapi import APIRouter, Depends
from redis import Redis
from sqlalchemy.orm import Session

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check(
    db: Session = Depends(get_db), redis: Redis = Depends(get_redis)
) -> Dict[str, Any]:
    """
    Health check endpoint for the API and its dependencies.
    """
    health_status = {"status": "healthy", "services": {}}

    # Check database
    try:
        db.execute("SELECT 1")
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Redis
    try:
        redis.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Elasticsearch
    try:
        search_service = get_search_service()
        es_health = search_service.health_check()
        if es_health.get("status") == "healthy":
            health_status["services"]["elasticsearch"] = "healthy"
        else:
            health_status["services"][
                "elasticsearch"
            ] = f"unhealthy: {es_health.get('error', 'unknown error')}"
            health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["elasticsearch"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return health_status
