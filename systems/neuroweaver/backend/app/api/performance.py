"""
Performance API Endpoints
"""

from app.core.logging import get_logger
from fastapi import APIRouter

logger = get_logger(__name__)
router = APIRouter()


@router.get("/performance/status")
async def get_status():
    """Get performance status"""
    return {"status": "operational", "service": "performance"}
