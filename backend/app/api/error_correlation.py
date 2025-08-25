"""Error correlation API endpoints."""

from fastapi import APIRouter

router = APIRouter(prefix="/error-correlation", tags=["error-correlation"])

@router.get("/health")
async def health_check():
    return {"status": "ok"}
