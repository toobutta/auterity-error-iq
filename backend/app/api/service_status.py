from app.services.registry import service_registry
from fastapi import APIRouter

router = APIRouter()


@router.get("/services")
async def get_all_services():
    return service_registry.get_all_services()


@router.get("/services/production")
async def get_production_services():
    return service_registry.get_production_services()


@router.get("/services/health")
async def get_service_health():
    return await service_registry.health_check_all()
