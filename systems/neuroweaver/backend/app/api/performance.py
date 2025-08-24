"""
Performance API Endpoints
"""

from fastapi import APIRouter
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/performance/status")
async def get_status():
    """Get performance status"""
    return {"status": "operational", "service": "performance"}
