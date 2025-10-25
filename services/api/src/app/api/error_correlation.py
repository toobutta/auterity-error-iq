"""Error correlation API endpoints."""

from typing import Dict

from fastapi import APIRouter

router = APIRouter(prefix="/error-correlation", tags=["error-correlation"])


@router.get("/health")
async def health_check() -> Dict[str, str]:
    return {"status": "ok"}
