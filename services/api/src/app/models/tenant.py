"""Multi-tenant architecture models for enterprise security."""

import uuid
from enum import Enum

from sqlalchemy import (
    JSON,
    UUID,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class TenantStatus(str, Enum):
    """Tenant status enumeration."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"
    TRIAL = "trial"
    PAYMENT_FAILED = "payment_failed"


class SubscriptionPlan(str, Enum):
    """Subscription plan types."""

    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    WHITE_LABEL_STARTER = "white_label_starter"
    WHITE_LABEL_ENTERPRISE = "white_label_enterprise"


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

    # SaaS Subscription Management
    subscription_plan = Column(
        String(50),
        default=SubscriptionPlan.STARTER,
        nullable=False,
        index=True,
    )
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True, index=True)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)

    # Usage Limits & Billing
    max_users = Column(Integer, default=5, nullable=False)
    max_workflows = Column(Integer, default=100, nullable=False)
    max_ai_requests_per_month = Column(Integer, default=10000, nullable=False)
    current_month_ai_requests = Column(Integer, default=0, nullable=False)
    monthly_budget = Column(Numeric(10, 2), default=99.00, nullable=False)

    # White-Label Branding
    custom_domain = Column(String(255), nullable=True, index=True)
    logo_url = Column(String(500), nullable=True)
    primary_color = Column(String(7), default="#3B82F6", nullable=False)
    secondary_color = Column(String(7), default="#10B981", nullable=False)
    company_name = Column(String(255), nullable=True)
    custom_css = Column(Text, nullable=True)
    remove_auterity_branding = Column(Boolean, default=False, nullable=False)

    # Industry Profile
    industry_profile = Column(String(50), nullable=True, index=True)
    industry_settings = Column(JSON, nullable=True)

    # SSO Configuration
    sso_enabled = Column(Boolean, default=False, nullable=False)
    sso_provider = Column(String(20), nullable=True)
    sso_config = Column(JSON, nullable=True)

    # Audit settings
    audit_enabled = Column(Boolean, default=True, nullable=False)
    audit_retention_days = Column(String(10), default="365", nullable=False)

    # Metadata
    tenant_metadata = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    users = relationship(
        "User", back_populates="tenant", cascade="all, delete-orphan"
    )
    audit_logs = relationship(
        "AuditLog", back_populates="tenant", cascade="all, delete-orphan"
    )
    billing_records = relationship(
        "BillingRecord", back_populates="tenant", cascade="all, delete-orphan"
    )
    usage_logs = relationship(
        "UsageLog", back_populates="tenant", cascade="all, delete-orphan"
    )

    # Auterity Expansion Relationships
    triage_rules = relationship(
        "TriageRule", back_populates="tenant", cascade="all, delete-orphan"
    )
    vector_embeddings = relationship(
        "VectorEmbedding",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )
    integrations = relationship(
        "Integration", back_populates="tenant", cascade="all, delete-orphan"
    )
    channel_triggers = relationship(
        "ChannelTrigger", back_populates="tenant", cascade="all, delete-orphan"
    )
    custom_models = relationship(
        "CustomModel", back_populates="tenant", cascade="all, delete-orphan"
    )
    triage_results = relationship(
        "TriageResult", back_populates="tenant", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Tenant(id={self.id}, name='{self.name}', domain='{self.domain}')>"

    def is_subscription_active(self):
        """Check if subscription is active."""
        if self.status == TenantStatus.ACTIVE:
            return True
        if self.status == TenantStatus.TRIAL and self.trial_end:
            from datetime import datetime

            return datetime.utcnow() < self.trial_end
        return False

    def can_add_user(self):
        """Check if tenant can add more users."""
        return len(self.users) < self.max_users

    def can_create_workflow(self):
        """Check if tenant can create more workflows."""
        return len(self.workflows) < self.max_workflows

    def can_make_ai_request(self):
        """Check if tenant can make more AI requests this month."""
        return self.current_month_ai_requests < self.max_ai_requests_per_month

    def get_plan_features(self):
        """Get features available for current subscription plan."""
        plan_features = {
            SubscriptionPlan.STARTER: {
                "max_users": 5,
                "max_workflows": 100,
                "max_ai_requests_per_month": 10000,
                "custom_branding": False,
                "sso_support": False,
                "white_label": False,
            },
            SubscriptionPlan.PROFESSIONAL: {
                "max_users": 25,
                "max_workflows": -1,  # Unlimited
                "max_ai_requests_per_month": 50000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": False,
            },
            SubscriptionPlan.ENTERPRISE: {
                "max_users": -1,  # Unlimited
                "max_workflows": -1,  # Unlimited
                "max_ai_requests_per_month": 200000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": False,
            },
            SubscriptionPlan.WHITE_LABEL_STARTER: {
                "max_users": 25,
                "max_workflows": -1,
                "max_ai_requests_per_month": 50000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": True,
            },
            SubscriptionPlan.WHITE_LABEL_ENTERPRISE: {
                "max_users": -1,
                "max_workflows": -1,
                "max_ai_requests_per_month": 200000,
                "custom_branding": True,
                "sso_support": True,
                "white_label": True,
            },
        }
        return plan_features.get(self.subscription_plan, {})


class SSOConfiguration(Base):
    """SSO configuration for tenants."""

    __tablename__ = "sso_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
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
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant")

    def __repr__(self):
        return f"<SSOConfiguration(id={self.id}, provider='{self.provider}', tenant_id={self.tenant_id})>"


class AuditLog(Base):
    """Audit log for tracking user actions and system events."""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
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
    audit_metadata = Column(JSON, nullable=True)

    # Status
    status = Column(String(20), default="success", nullable=False)
    error_message = Column(Text, nullable=True)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, event_type='{self.event_type}', action='{self.action}')>"


class BillingRecord(Base):
    """Billing records for tenant subscriptions."""

    __tablename__ = "billing_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    # Stripe information
    stripe_invoice_id = Column(String(255), nullable=True, index=True)
    stripe_payment_intent_id = Column(String(255), nullable=True, index=True)

    # Billing details
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    description = Column(String(500), nullable=False)
    billing_period_start = Column(DateTime(timezone=True), nullable=False)
    billing_period_end = Column(DateTime(timezone=True), nullable=False)

    # Status
    status = Column(
        String(20), default="pending", nullable=False, index=True
    )  # pending, paid, failed, refunded
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    billing_metadata = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="billing_records")

    def __repr__(self):
        return f"<BillingRecord(id={self.id}, tenant_id={self.tenant_id}, amount={self.amount})>"


class UsageLog(Base):
    """Usage tracking for tenant resources."""

    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )

    # Usage details
    resource_type = Column(
        String(50), nullable=False, index=True
    )  # ai_request, workflow_execution, user_login
    resource_id = Column(String(255), nullable=True, index=True)
    quantity = Column(Integer, default=1, nullable=False)
    cost = Column(Numeric(10, 4), default=0.00, nullable=False)

    # Context
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    workflow_id = Column(
        UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=True
    )

    # Metadata
    usage_metadata = Column(JSON, nullable=True)
    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="usage_logs")
    user = relationship("User")
    workflow = relationship("Workflow")

    def __repr__(self):
        return f"<UsageLog(id={self.id}, tenant_id={self.tenant_id}, resource_type={self.resource_type})>"
