"""Multi-tenant architecture models for enterprise security."""

import uuid
from enum import Enum
from typing import Optional

from sqlalchemy import UUID, Boolean, Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class TenantStatus(str, Enum):
    """Tenant status enumeration."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class SSOProvider(str, Enum):
    """SSO provider types."""
    SAML = "saml"
    OIDC = "oidc"
    OAUTH2 = "oauth2"


class Tenant(Base):
    """Tenant model for multi-tenant architecture."""

    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), unique=True, nullable=False, index=True)
    status = Column(String(20), default=TenantStatus.ACTIVE, nullable=False)
    
    # SSO Configuration
    sso_enabled = Column(Boolean, default=False, nullable=False)
    sso_provider = Column(String(20), nullable=True)
    sso_config = Column(JSON, nullable=True)
    
    # Audit settings
    audit_enabled = Column(Boolean, default=True, nullable=False)
    audit_retention_days = Column(String(10), default="365", nullable=False)
    
    # Metadata
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant(id={self.id}, name='{self.name}', domain='{self.domain}')>"


class SSOConfiguration(Base):
    """SSO configuration for tenants."""

    __tablename__ = "sso_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    provider = Column(String(20), nullable=False)
    
    # SAML Configuration
    saml_entity_id = Column(String(255), nullable=True)
    saml_sso_url = Column(String(500), nullable=True)
    saml_x509_cert = Column(Text, nullable=True)
    
    # OIDC Configuration
    oidc_issuer = Column(String(500), nullable=True)
    oidc_client_id = Column(String(255), nullable=True)
    oidc_client_secret = Column(String(255), nullable=True)
    oidc_redirect_uri = Column(String(500), nullable=True)
    
    # Common settings
    auto_provision_users = Column(Boolean, default=True, nullable=False)
    default_role = Column(String(50), default="user", nullable=False)
    attribute_mapping = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    tenant = relationship("Tenant")

    def __repr__(self):
        return f"<SSOConfiguration(id={self.id}, provider='{self.provider}', tenant_id={self.tenant_id})>"


class AuditLog(Base):
    """Audit log for tracking user actions and system events."""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Event details
    event_type = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False, index=True)
    resource_id = Column(String(255), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    
    # Request details
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    session_id = Column(String(255), nullable=True)
    
    # Event data
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(20), default="success", nullable=False)
    error_message = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, event_type='{self.event_type}', action='{self.action}')>"