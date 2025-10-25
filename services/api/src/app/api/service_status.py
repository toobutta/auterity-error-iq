from typing import Any, Dict

from fastapi import APIRouter

from app.services.registry import service_registry

router = APIRouter()


@router.get("/services")
async def get_all_services() -> Dict[str, Any]:
    return service_registry.get_all_services()


@router.get("/services/production")
async def get_production_services() -> Dict[str, Any]:
    return service_registry.get_production_services()


@router.get("/services/health")
async def get_service_health() -> Dict[str, Any]:
    return await service_registry.health_check_all()
