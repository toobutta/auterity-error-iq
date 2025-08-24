"""
Alerts API Endpoints
"""

from fastapi import APIRouter
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/alerts/status")
async def get_status():
    """Get alerts status"""
    return {"status": "operational", "service": "alerts"}
