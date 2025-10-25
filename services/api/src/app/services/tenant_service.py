"""Tenant management service for multi-tenant architecture."""

from typing import Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.tenant import SSOConfiguration, Tenant, TenantStatus
from app.models.user import User
from app.services.audit_service import AuditService


class TenantService:
    """Service for managing tenants in multi-tenant architecture."""

    def __init__(self, db: Session):
        self.db = db
        self.audit_service = AuditService(db)

    def create_tenant(
        self,
        name: str,
        slug: str,
        domain: str,
        admin_user: Optional[User] = None,
        sso_enabled: bool = False,
        audit_enabled: bool = True,
    ) -> Tenant:
        """Create a new tenant."""
        # Check if tenant already exists
        existing_tenant = (
            self.db.query(Tenant)
            .filter((Tenant.slug == slug) | (Tenant.domain == domain))
            .first()
        )

        if existing_tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant with this slug or domain already exists",
            )

        # Create tenant
        tenant = Tenant(
            name=name,
            slug=slug,
            domain=domain,
            status=TenantStatus.ACTIVE,
            sso_enabled=sso_enabled,
            audit_enabled=audit_enabled,
        )

        self.db.add(tenant)
        self.db.commit()
        self.db.refresh(tenant)

        # Log tenant creation
        if admin_user:
            self.audit_service.log_system_event(
                tenant_id=tenant.id,
                event_type="tenant_management",
                action="create_tenant",
                user=admin_user,
                metadata={
                    "tenant_name": name,
                    "tenant_slug": slug,
                    "tenant_domain": domain,
                },
            )

        return tenant

    def get_tenant_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug."""
        return self.db.query(Tenant).filter(Tenant.slug == slug).first()

    def get_tenant_by_domain(self, domain: str) -> Optional[Tenant]:
        """Get tenant by domain."""
        return self.db.query(Tenant).filter(Tenant.domain == domain).first()

    def get_tenant_by_id(self, tenant_id: UUID) -> Optional[Tenant]:
        """Get tenant by ID."""
        return self.db.query(Tenant).filter(Tenant.id == tenant_id).first()

    def list_tenants(
        self,
        status: Optional[TenantStatus] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Tenant]:
        """List tenants with optional filtering."""
        query = self.db.query(Tenant)

        if status:
            query = query.filter(Tenant.status == status)

        return query.offset(offset).limit(limit).all()

    def update_tenant(
        self,
        tenant_id: UUID,
        admin_user: User,
        name: Optional[str] = None,
        status: Optional[TenantStatus] = None,
        sso_enabled: Optional[bool] = None,
        audit_enabled: Optional[bool] = None,
        metadata: Optional[Dict] = None,
    ) -> Tenant:
        """Update tenant configuration."""
        tenant = self.get_tenant_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

        # Store old values for audit
        old_values = {
            "name": tenant.name,
            "status": tenant.status,
            "sso_enabled": tenant.sso_enabled,
            "audit_enabled": tenant.audit_enabled,
            "metadata": tenant.metadata,
        }

        # Update fields
        if name is not None:
            tenant.name = name
        if status is not None:
            tenant.status = status
        if sso_enabled is not None:
            tenant.sso_enabled = sso_enabled
        if audit_enabled is not None:
            tenant.audit_enabled = audit_enabled
        if metadata is not None:
            tenant.metadata = metadata

        self.db.commit()
        self.db.refresh(tenant)

        # Log tenant update
        new_values = {
            "name": tenant.name,
            "status": tenant.status,
            "sso_enabled": tenant.sso_enabled,
            "audit_enabled": tenant.audit_enabled,
            "metadata": tenant.metadata,
        }

        self.audit_service.log_configuration_change(
            tenant_id=tenant.id,
            user=admin_user,
            config_type="tenant",
            action="update_tenant",
            old_values=old_values,
            new_values=new_values,
        )

        return tenant

    def configure_sso(
        self, tenant_id: UUID, admin_user: User, provider: str, config: Dict
    ) -> SSOConfiguration:
        """Configure SSO for a tenant."""
        tenant = self.get_tenant_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

        # Check if SSO config already exists
        existing_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant_id,
                SSOConfiguration.provider == provider,
            )
            .first()
        )

        if existing_config:
            # Update existing configuration
            old_values = {
                "provider": existing_config.provider,
                "auto_provision_users": existing_config.auto_provision_users,
                "default_role": existing_config.default_role,
            }

            # Update configuration based on provider
            if provider == "saml":
                existing_config.saml_entity_id = config.get("entity_id")
                existing_config.saml_sso_url = config.get("sso_url")
                existing_config.saml_x509_cert = config.get("x509_cert")
            elif provider == "oidc":
                existing_config.oidc_issuer = config.get("issuer")
                existing_config.oidc_client_id = config.get("client_id")
                existing_config.oidc_client_secret = config.get(
                    "client_secret"
                )
                existing_config.oidc_redirect_uri = config.get("redirect_uri")

            existing_config.auto_provision_users = config.get(
                "auto_provision_users", True
            )
            existing_config.default_role = config.get("default_role", "user")
            existing_config.attribute_mapping = config.get("attribute_mapping")

            self.db.commit()
            self.db.refresh(existing_config)

            # Log SSO configuration update
            new_values = {
                "provider": existing_config.provider,
                "auto_provision_users": existing_config.auto_provision_users,
                "default_role": existing_config.default_role,
            }

            self.audit_service.log_configuration_change(
                tenant_id=tenant.id,
                user=admin_user,
                config_type="sso_configuration",
                action="update_sso_config",
                old_values=old_values,
                new_values=new_values,
            )

            return existing_config

        else:
            # Create new SSO configuration
            sso_config = SSOConfiguration(
                tenant_id=tenant_id,
                provider=provider,
                auto_provision_users=config.get("auto_provision_users", True),
                default_role=config.get("default_role", "user"),
                attribute_mapping=config.get("attribute_mapping"),
            )

            # Set provider-specific configuration
            if provider == "saml":
                sso_config.saml_entity_id = config.get("entity_id")
                sso_config.saml_sso_url = config.get("sso_url")
                sso_config.saml_x509_cert = config.get("x509_cert")
            elif provider == "oidc":
                sso_config.oidc_issuer = config.get("issuer")
                sso_config.oidc_client_id = config.get("client_id")
                sso_config.oidc_client_secret = config.get("client_secret")
                sso_config.oidc_redirect_uri = config.get("redirect_uri")

            self.db.add(sso_config)
            self.db.commit()
            self.db.refresh(sso_config)

            # Enable SSO for tenant
            tenant.sso_enabled = True
            self.db.commit()

            # Log SSO configuration creation
            self.audit_service.log_configuration_change(
                tenant_id=tenant.id,
                user=admin_user,
                config_type="sso_configuration",
                action="create_sso_config",
                new_values={
                    "provider": provider,
                    "auto_provision_users": sso_config.auto_provision_users,
                    "default_role": sso_config.default_role,
                },
            )

            return sso_config

    def get_sso_configuration(
        self, tenant_id: UUID, provider: Optional[str] = None
    ) -> Optional[SSOConfiguration]:
        """Get SSO configuration for a tenant."""
        query = self.db.query(SSOConfiguration).filter(
            SSOConfiguration.tenant_id == tenant_id, SSOConfiguration.is_active
        )

        if provider:
            query = query.filter(SSOConfiguration.provider == provider)

        return query.first()

    def disable_sso(
        self, tenant_id: UUID, admin_user: User, provider: str
    ) -> bool:
        """Disable SSO for a tenant."""
        sso_config = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant_id,
                SSOConfiguration.provider == provider,
            )
            .first()
        )

        if not sso_config:
            return False

        sso_config.is_active = False
        self.db.commit()

        # Check if any SSO configs are still active
        active_configs = (
            self.db.query(SSOConfiguration)
            .filter(
                SSOConfiguration.tenant_id == tenant_id,
                SSOConfiguration.is_active,
            )
            .count()
        )

        # If no active SSO configs, disable SSO for tenant
        if active_configs == 0:
            tenant = self.get_tenant_by_id(tenant_id)
            if tenant:
                tenant.sso_enabled = False
                self.db.commit()

        # Log SSO disable
        self.audit_service.log_configuration_change(
            tenant_id=tenant_id,
            user=admin_user,
            config_type="sso_configuration",
            action="disable_sso",
            metadata={"provider": provider},
        )

        return True

    def get_tenant_users(
        self, tenant_id: UUID, limit: int = 100, offset: int = 0
    ) -> List[User]:
        """Get users for a tenant."""
        return (
            self.db.query(User)
            .filter(User.tenant_id == tenant_id)
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_tenant_stats(self, tenant_id: UUID) -> Dict:
        """Get statistics for a tenant."""
        tenant = self.get_tenant_by_id(tenant_id)
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant not found",
            )

        # Count users
        total_users = (
            self.db.query(User).filter(User.tenant_id == tenant_id).count()
        )
        active_users = (
            self.db.query(User)
            .filter(User.tenant_id == tenant_id, User.is_active)
            .count()
        )
        sso_users = (
            self.db.query(User)
            .filter(User.tenant_id == tenant_id, User.sso_provider.isnot(None))
            .count()
        )

        # Get audit summary
        audit_summary = self.audit_service.get_audit_summary(tenant_id)

        return {
            "tenant_id": str(tenant_id),
            "tenant_name": tenant.name,
            "tenant_status": tenant.status,
            "users": {
                "total": total_users,
                "active": active_users,
                "sso_users": sso_users,
            },
            "sso_enabled": tenant.sso_enabled,
            "audit_enabled": tenant.audit_enabled,
            "audit_summary": audit_summary,
        }

    def delete_tenant(self, tenant_id: UUID, admin_user: User) -> bool:
        """Delete a tenant (soft delete by setting status to inactive)."""
        tenant = self.get_tenant_by_id(tenant_id)
        if not tenant:
            return False

        # Soft delete by setting status to inactive
        tenant.status = TenantStatus.INACTIVE
        self.db.commit()

        # Log tenant deletion
        self.audit_service.log_system_event(
            tenant_id=tenant.id,
            event_type="tenant_management",
            action="delete_tenant",
            user=admin_user,
            metadata={"tenant_name": tenant.name, "tenant_slug": tenant.slug},
        )

        return True
