"""Tenant management API endpoints."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.auth import require_admin_access
from app.database import get_db
from app.models.tenant import TenantStatus
from app.models.user import User
from app.schemas import (
    AuditLogResponse,
    SSOConfigurationCreate,
    SSOConfigurationResponse,
    TenantCreate,
    TenantResponse,
    TenantStatsResponse,
    TenantUpdate,
)
from app.services.audit_service import AuditService
from app.services.tenant_service import TenantService
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Create a new tenant (admin only)."""
    tenant_service = TenantService(db)
    audit_service = AuditService(db)

    try:
        tenant = tenant_service.create_tenant(
            name=tenant_data.name,
            slug=tenant_data.slug,
            domain=tenant_data.domain,
            admin_user=current_user,
            sso_enabled=tenant_data.sso_enabled,
            audit_enabled=tenant_data.audit_enabled,
        )

        return TenantResponse.from_tenant(tenant)

    except HTTPException:
        raise
    except Exception as e:
        # Log failed tenant creation
        audit_service.log_system_event(
            tenant_id=current_user.tenant_id,
            event_type="tenant_management",
            action="create_tenant_failed",
            user=current_user,
            request=request,
            metadata={
                "error": str(e),
                "tenant_name": tenant_data.name,
                "tenant_slug": tenant_data.slug,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tenant",
        )


@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    status_filter: Optional[TenantStatus] = Query(None, alias="status"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """List all tenants (admin only)."""
    tenant_service = TenantService(db)

    tenants = tenant_service.list_tenants(
        status=status_filter, limit=limit, offset=offset
    )

    return [TenantResponse.from_tenant(tenant) for tenant in tenants]


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get tenant by ID (admin only)."""
    tenant_service = TenantService(db)

    tenant = tenant_service.get_tenant_by_id(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )

    return TenantResponse.from_tenant(tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Update tenant configuration (admin only)."""
    tenant_service = TenantService(db)

    tenant = tenant_service.update_tenant(
        tenant_id=tenant_id,
        admin_user=current_user,
        name=tenant_data.name,
        status=tenant_data.status,
        sso_enabled=tenant_data.sso_enabled,
        audit_enabled=tenant_data.audit_enabled,
        metadata=tenant_data.metadata,
    )

    return TenantResponse.from_tenant(tenant)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Delete tenant (admin only)."""
    tenant_service = TenantService(db)

    success = tenant_service.delete_tenant(tenant_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found"
        )


@router.get("/{tenant_id}/stats", response_model=TenantStatsResponse)
async def get_tenant_stats(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get tenant statistics (admin only)."""
    tenant_service = TenantService(db)

    stats = tenant_service.get_tenant_stats(tenant_id)
    return TenantStatsResponse(**stats)


# SSO Configuration endpoints
@router.post(
    "/{tenant_id}/sso",
    response_model=SSOConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def configure_sso(
    tenant_id: UUID,
    sso_config: SSOConfigurationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Configure SSO for a tenant (admin only)."""
    tenant_service = TenantService(db)

    config = tenant_service.configure_sso(
        tenant_id=tenant_id,
        admin_user=current_user,
        provider=sso_config.provider,
        config=sso_config.config,
    )

    return SSOConfigurationResponse.from_sso_config(config)


@router.get("/{tenant_id}/sso", response_model=List[SSOConfigurationResponse])
async def get_sso_configurations(
    tenant_id: UUID,
    provider: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get SSO configurations for a tenant (admin only)."""
    from app.models.tenant import SSOConfiguration

    query = db.query(SSOConfiguration).filter(
        SSOConfiguration.tenant_id == tenant_id, SSOConfiguration.is_active == True
    )

    if provider:
        query = query.filter(SSOConfiguration.provider == provider)

    configs = query.all()
    return [SSOConfigurationResponse.from_sso_config(config) for config in configs]


@router.delete("/{tenant_id}/sso/{provider}", status_code=status.HTTP_204_NO_CONTENT)
async def disable_sso(
    tenant_id: UUID,
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Disable SSO for a tenant (admin only)."""
    tenant_service = TenantService(db)

    success = tenant_service.disable_sso(tenant_id, current_user, provider)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="SSO configuration not found"
        )


# Audit Log endpoints
@router.get("/{tenant_id}/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    tenant_id: UUID,
    event_type: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    user_id: Optional[UUID] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get audit logs for a tenant (admin only)."""
    audit_service = AuditService(db)

    # Verify tenant access
    if not current_user.can_access_tenant(str(tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to tenant audit logs",
        )

    logs = audit_service.get_audit_logs(
        tenant_id=tenant_id,
        event_type=event_type,
        resource_type=resource_type,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )

    return [AuditLogResponse.from_audit_log(log) for log in logs]


@router.get("/{tenant_id}/audit-summary")
async def get_audit_summary(
    tenant_id: UUID,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get audit log summary for a tenant (admin only)."""
    audit_service = AuditService(db)

    # Verify tenant access
    if not current_user.can_access_tenant(str(tenant_id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to tenant audit logs",
        )

    summary = audit_service.get_audit_summary(
        tenant_id=tenant_id, start_date=start_date, end_date=end_date
    )

    return summary


# Tenant Users endpoints
@router.get("/{tenant_id}/users")
async def get_tenant_users(
    tenant_id: UUID,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Get users for a tenant (admin only)."""
    tenant_service = TenantService(db)

    users = tenant_service.get_tenant_users(
        tenant_id=tenant_id, limit=limit, offset=offset
    )

    return [
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "sso_provider": user.sso_provider,
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "created_at": user.created_at.isoformat(),
            "roles": [role.name for role in user.roles],
        }
        for user in users
    ]
