"""Pydantic schemas for SaaS management."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


# Subscription Schemas
class SubscriptionCreate(BaseModel):
    """Schema for creating a new subscription."""

    plan: str = Field(..., description="Subscription plan type")
    payment_method_id: str = Field(..., description="Stripe payment method ID")
    trial_days: Optional[int] = Field(14, description="Number of trial days")

    @validator("plan")
    def validate_plan(cls, v):
        valid_plans = [
            "starter",
            "professional",
            "enterprise",
            "white_label_starter",
            "white_label_enterprise",
        ]
        if v not in valid_plans:
            raise ValueError(f'Plan must be one of: {", ".join(valid_plans)}')
        return v

    @validator("trial_days")
    def validate_trial_days(cls, v):
        if v is not None and (v < 0 or v > 30):
            raise ValueError("Trial days must be between 0 and 30")
        return v


class SubscriptionUpdate(BaseModel):
    """Schema for updating subscription."""

    plan: str = Field(..., description="New subscription plan type")

    @validator("plan")
    def validate_plan(cls, v):
        valid_plans = [
            "starter",
            "professional",
            "enterprise",
            "white_label_starter",
            "white_label_enterprise",
        ]
        if v not in valid_plans:
            raise ValueError(f'Plan must be one of: {", ".join(valid_plans)}')
        return v


class SubscriptionInfo(BaseModel):
    """Schema for subscription information."""

    id: UUID
    plan: str
    status: str
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    trial_end: Optional[datetime]
    stripe_subscription_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Billing Schemas
class BillingRecordInfo(BaseModel):
    """Schema for billing record information."""

    id: UUID
    amount: Decimal
    currency: str
    description: str
    status: str
    billing_period_start: datetime
    billing_period_end: datetime
    paid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class BillingInfo(BaseModel):
    """Schema for comprehensive billing information."""

    tenant: Dict[str, Any]
    usage: Dict[str, Any]
    billing: Dict[str, Any]

    class Config:
        from_attributes = True


# Usage Tracking Schemas
class UsageLogInfo(BaseModel):
    """Schema for usage log information."""

    id: UUID
    resource_type: str
    quantity: int
    cost: Decimal
    timestamp: datetime
    metadata: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class UsageSummary(BaseModel):
    """Schema for usage summary."""

    total_cost: Decimal
    total_ai_requests: int
    total_workflow_executions: int
    resource_breakdown: Dict[str, Dict[str, Any]]

    class Config:
        from_attributes = True


class UsageTrackingRequest(BaseModel):
    """Schema for usage tracking request."""

    resource_type: str = Field(..., description="Type of resource being tracked")
    quantity: int = Field(1, description="Quantity of resources used")
    cost: Decimal = Field(Decimal("0.00"), description="Cost of the usage")
    workflow_id: Optional[UUID] = Field(None, description="Associated workflow ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

    @validator("resource_type")
    def validate_resource_type(cls, v):
        valid_types = [
            "ai_request",
            "workflow_execution",
            "user_login",
            "storage_usage",
            "api_call",
            "integration_usage",
        ]
        if v not in valid_types:
            raise ValueError(f'Resource type must be one of: {", ".join(valid_types)}')
        return v

    @validator("quantity")
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError("Quantity must be non-negative")
        return v

    @validator("cost")
    def validate_cost(cls, v):
        if v < 0:
            raise ValueError("Cost must be non-negative")
        return v


# White-Label Branding Schemas
class BrandingUpdate(BaseModel):
    """Schema for updating tenant branding."""

    primary_color: Optional[str] = Field(None, description="Primary brand color (hex)")
    secondary_color: Optional[str] = Field(
        None, description="Secondary brand color (hex)"
    )
    logo_url: Optional[str] = Field(None, description="URL to company logo")
    company_name: Optional[str] = Field(None, description="Company name for branding")
    custom_css: Optional[str] = Field(None, description="Custom CSS for branding")
    remove_auterity_branding: Optional[bool] = Field(
        None, description="Remove Auterity branding"
    )
    custom_domain: Optional[str] = Field(None, description="Custom domain for tenant")

    @validator("primary_color", "secondary_color")
    def validate_color(cls, v):
        if v is not None:
            import re

            if not re.match(r"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", v):
                raise ValueError("Color must be a valid hex color (e.g., #FF0000)")
        return v

    @validator("custom_domain")
    def validate_domain(cls, v):
        if v is not None:
            import re

            domain_pattern = r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$"
            if not re.match(domain_pattern, v):
                raise ValueError("Invalid domain format")
        return v


class BrandingTheme(BaseModel):
    """Schema for tenant branding theme."""

    primary_color: str
    secondary_color: str
    logo_url: str
    company_name: str
    custom_css: Optional[str]
    remove_auterity_branding: bool
    custom_domain: Optional[str]
    industry_profile: Optional[str]

    class Config:
        from_attributes = True


class BrandingPreview(BaseModel):
    """Schema for branding preview."""

    theme: BrandingTheme
    sample_elements: Dict[str, Any]
    css_preview: str

    class Config:
        from_attributes = True


class ComplianceCheck(BaseModel):
    """Schema for compliance check result."""

    score: int = Field(..., ge=0, le=100, description="Compliance score (0-100)")
    issues: List[str] = Field(
        default_factory=list, description="List of compliance issues"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="Recommendations for improvement"
    )

    class Config:
        from_attributes = True


class ComplianceReport(BaseModel):
    """Schema for branding compliance report."""

    logo: ComplianceCheck
    colors: ComplianceCheck
    css: ComplianceCheck
    domain: ComplianceCheck
    overall_score: float = Field(
        ..., ge=0, le=100, description="Overall compliance score"
    )

    class Config:
        from_attributes = True


# Tenant Management Schemas
class TenantCreate(BaseModel):
    """Schema for creating a new tenant."""

    name: str = Field(..., min_length=1, max_length=255, description="Tenant name")
    slug: str = Field(..., min_length=1, max_length=100, description="Tenant slug")
    domain: str = Field(..., description="Tenant domain")
    industry_profile: Optional[str] = Field(None, description="Industry profile")
    subscription_plan: str = Field("starter", description="Initial subscription plan")
    max_users: int = Field(5, ge=1, description="Maximum number of users")
    max_workflows: int = Field(100, ge=1, description="Maximum number of workflows")
    max_ai_requests_per_month: int = Field(
        10000, ge=1, description="Monthly AI request limit"
    )

    @validator("slug")
    def validate_slug(cls, v):
        import re

        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "Slug must contain only lowercase letters, numbers, and hyphens"
            )
        return v

    @validator("subscription_plan")
    def validate_plan(cls, v):
        valid_plans = [
            "starter",
            "professional",
            "enterprise",
            "white_label_starter",
            "white_label_enterprise",
        ]
        if v not in valid_plans:
            raise ValueError(f'Plan must be one of: {", ".join(valid_plans)}')
        return v


class TenantUpdate(BaseModel):
    """Schema for updating tenant."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    domain: Optional[str] = Field(None)
    industry_profile: Optional[str] = Field(None)
    max_users: Optional[int] = Field(None, ge=1)
    max_workflows: Optional[int] = Field(None, ge=1)
    max_ai_requests_per_month: Optional[int] = Field(None, ge=1)
    monthly_budget: Optional[Decimal] = Field(None, ge=0)


class TenantInfo(BaseModel):
    """Schema for tenant information."""

    id: UUID
    name: str
    slug: str
    domain: str
    status: str
    subscription_plan: str
    industry_profile: Optional[str]
    max_users: int
    max_workflows: int
    max_ai_requests_per_month: int
    current_month_ai_requests: int
    monthly_budget: Decimal
    custom_domain: Optional[str]
    logo_url: Optional[str]
    primary_color: str
    secondary_color: str
    company_name: Optional[str]
    remove_auterity_branding: bool
    sso_enabled: bool
    audit_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Plan Management Schemas
class PlanFeature(BaseModel):
    """Schema for plan features."""

    max_users: int
    max_workflows: int
    max_ai_requests_per_month: int
    custom_branding: bool
    sso_support: bool
    white_label: bool
    support: str


class PlanInfo(BaseModel):
    """Schema for subscription plan information."""

    id: str
    name: str
    price: Decimal
    currency: str
    billing_cycle: str
    features: PlanFeature
    description: str


# Analytics and Reporting Schemas
class UsageAnalytics(BaseModel):
    """Schema for usage analytics."""

    period: str = Field(..., description="Analysis period (daily, weekly, monthly)")
    start_date: datetime
    end_date: datetime
    total_requests: int
    total_cost: Decimal
    average_cost_per_request: Decimal
    peak_usage_day: datetime
    peak_usage_hour: int
    resource_breakdown: Dict[str, int]
    cost_trends: List[Dict[str, Any]]


class BillingAnalytics(BaseModel):
    """Schema for billing analytics."""

    period: str = Field(..., description="Analysis period (monthly, quarterly, yearly)")
    start_date: datetime
    end_date: datetime
    total_revenue: Decimal
    total_invoices: int
    paid_invoices: int
    pending_invoices: int
    failed_payments: int
    average_invoice_amount: Decimal
    revenue_trends: List[Dict[str, Any]]
    payment_methods: Dict[str, int]


# Error and Response Schemas
class ErrorResponse(BaseModel):
    """Schema for error responses."""

    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")
    code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseModel):
    """Schema for success responses."""

    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Webhook Schemas
class StripeWebhookEvent(BaseModel):
    """Schema for Stripe webhook events."""

    id: str
    object: str
    api_version: str
    created: int
    data: Dict[str, Any]
    livemode: bool
    pending_webhooks: int
    request: Optional[Dict[str, Any]]
    type: str


# Configuration Schemas
class SaaSConfig(BaseModel):
    """Schema for SaaS configuration."""

    stripe_enabled: bool = Field(True, description="Enable Stripe integration")
    trial_days: int = Field(14, description="Default trial period in days")
    max_trial_days: int = Field(30, description="Maximum trial period in days")
    auto_suspend_days: int = Field(
        7, description="Days after payment failure to suspend"
    )
    usage_tracking_enabled: bool = Field(True, description="Enable usage tracking")
    branding_enabled: bool = Field(True, description="Enable white-label branding")
    industry_profiles: List[str] = Field(
        default_factory=list, description="Available industry profiles"
    )
    compliance_checks_enabled: bool = Field(
        True, description="Enable compliance validation"
    )

    class Config:
        from_attributes = True


# Export all schemas
__all__ = [
    "SubscriptionCreate",
    "SubscriptionUpdate",
    "SubscriptionInfo",
    "BillingRecordInfo",
    "BillingInfo",
    "UsageLogInfo",
    "UsageSummary",
    "UsageTrackingRequest",
    "BrandingUpdate",
    "BrandingTheme",
    "BrandingPreview",
    "ComplianceCheck",
    "ComplianceReport",
    "TenantCreate",
    "TenantUpdate",
    "TenantInfo",
    "PlanFeature",
    "PlanInfo",
    "UsageAnalytics",
    "BillingAnalytics",
    "ErrorResponse",
    "SuccessResponse",
    "StripeWebhookEvent",
    "SaaSConfig",
]
