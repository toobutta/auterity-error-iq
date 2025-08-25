"""
Models API Endpoints
"""

from app.core.logging import get_logger
from fastapi import APIRouter

logger = get_logger(__name__)
router = APIRouter()


@router.get("/models/status")
async def get_status():
    """Get models status"""
    return {"status": "operational", "service": "models"}
