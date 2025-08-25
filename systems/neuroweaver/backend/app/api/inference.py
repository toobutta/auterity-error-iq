"""
Inference API Endpoints
"""

from app.core.logging import get_logger
from fastapi import APIRouter

logger = get_logger(__name__)
router = APIRouter()


@router.get("/inference/status")
async def get_status():
    """Get inference status"""
    return {"status": "operational", "service": "inference"}
