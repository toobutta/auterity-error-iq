"""Pydantic schemas for request/response validation."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, validator

from app.models import TenantStatus


# Authentication schemas
class UserLogin(BaseModel):
    """Schema for user login request."""

    email: EmailStr
    password: str


class UserRegister(BaseModel):
    """Schema for user registration request."""

    email: EmailStr
    name: str
    password: str


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token data."""

    email: Optional[str] = None


class RoleResponse(BaseModel):
    """Schema for role response."""

    id: uuid.UUID
    name: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


class PermissionResponse(BaseModel):
    """Schema for permission response."""

    id: uuid.UUID
    name: str
    description: Optional[str]
    system: str
    resource: str
    action: str
    is_active: bool

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Schema for user response (without password)."""

    id: uuid.UUID
    email: str
    name: str
    is_active: bool
    created_at: datetime
    roles: List[RoleResponse] = []
    permissions: List[str] = []

    class Config:
        from_attributes = True

    @classmethod
    def from_user(cls, user):
        """Create UserResponse from User model with computed permissions."""
        return cls(
            id=user.id,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            created_at=user.created_at,
            roles=[
                RoleResponse.model_validate(role.__dict__)
                for role in user.roles
            ],
            permissions=user.get_permissions(),
        )


class UserUpdate(BaseModel):
    """Schema for user update request."""

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class RoleCreate(BaseModel):
    """Schema for role creation request."""

    name: str
    description: Optional[str] = None
    permission_ids: List[uuid.UUID] = []


class RoleUpdate(BaseModel):
    """Schema for role update request."""

    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[uuid.UUID]] = None


class UserRoleAssignment(BaseModel):
    """Schema for assigning roles to users."""

    user_id: uuid.UUID
    role_names: List[str]


class CrossSystemTokenRequest(BaseModel):
    """Schema for cross-system token request."""

    target_system: str

    @validator("target_system")
    def validate_target_system(cls, v):
        allowed_systems = ["autmatrix", "relaycore", "neuroweaver"]
        if v not in allowed_systems:
            raise ValueError(
                f"Target system must be one of: {', '.join(allowed_systems)}"
            )
        return v


class CrossSystemTokenResponse(BaseModel):
    """Schema for cross-system token response."""

    access_token: str
    token_type: str
    target_system: str
    permissions: List[str]
    expires_in: int


# Workflow schemas
class WorkflowCreate(BaseModel):
    """Schema for workflow creation request."""

    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]

    @validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Workflow name cannot be empty")
        if len(v.strip()) > 255:
            raise ValueError("Workflow name cannot exceed 255 characters")
        return v.strip()

    @validator("definition")
    def validate_definition(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Workflow definition must be a valid JSON object")

        # Basic workflow structure validation
        required_fields = ["nodes", "edges"]
        for field in required_fields:
            if field not in v:
                raise ValueError(
                    f'Workflow definition must contain "{field}" field'
                )

        # Validate nodes structure
        if not isinstance(v["nodes"], list):
            raise ValueError("Workflow nodes must be a list")

        # Validate edges structure
        if not isinstance(v["edges"], list):
            raise ValueError("Workflow edges must be a list")

        # Validate each node has required fields
        for i, node in enumerate(v["nodes"]):
            if not isinstance(node, dict):
                raise ValueError(f"Node {i} must be an object")
            if "id" not in node:
                raise ValueError(f'Node {i} must have an "id" field')
            if "type" not in node:
                raise ValueError(f'Node {i} must have a "type" field')

        # Validate each edge has required fields
        for i, edge in enumerate(v["edges"]):
            if not isinstance(edge, dict):
                raise ValueError(f"Edge {i} must be an object")
            if "source" not in edge:
                raise ValueError(f'Edge {i} must have a "source" field')
            if "target" not in edge:
                raise ValueError(f'Edge {i} must have a "target" field')

        return v


class WorkflowUpdate(BaseModel):
    """Schema for workflow update request."""

    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @validator("name")
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Workflow name cannot be empty")
            if len(v.strip()) > 255:
                raise ValueError("Workflow name cannot exceed 255 characters")
            return v.strip()
        return v

    @validator("definition")
    def validate_definition(cls, v):
        if v is not None:
            if not isinstance(v, dict):
                raise ValueError(
                    "Workflow definition must be a valid JSON object"
                )

            # Basic workflow structure validation
            required_fields = ["nodes", "edges"]
            for field in required_fields:
                if field not in v:
                    raise ValueError(
                        f'Workflow definition must contain "{field}" field'
                    )

            # Validate nodes structure
            if not isinstance(v["nodes"], list):
                raise ValueError("Workflow nodes must be a list")

            # Validate edges structure
            if not isinstance(v["edges"], list):
                raise ValueError("Workflow edges must be a list")

            # Validate each node has required fields
            for i, node in enumerate(v["nodes"]):
                if not isinstance(node, dict):
                    raise ValueError(f"Node {i} must be an object")
                if "id" not in node:
                    raise ValueError(f'Node {i} must have an "id" field')
                if "type" not in node:
                    raise ValueError(f'Node {i} must have a "type" field')

            # Validate each edge has required fields
            for i, edge in enumerate(v["edges"]):
                if not isinstance(edge, dict):
                    raise ValueError(f"Edge {i} must be an object")
                if "source" not in edge:
                    raise ValueError(f'Edge {i} must have a "source" field')
                if "target" not in edge:
                    raise ValueError(f'Edge {i} must have a "target" field')

        return v


class WorkflowResponse(BaseModel):
    """Schema for workflow response."""

    id: uuid.UUID
    name: str
    description: Optional[str]
    user_id: uuid.UUID
    definition: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowListResponse(BaseModel):
    """Schema for workflow list response."""

    workflows: List[WorkflowResponse]
    total: int
    page: int
    page_size: int


# Workflow execution schemas
class WorkflowExecuteRequest(BaseModel):
    """Schema for workflow execution request."""

    input_data: Optional[Dict[str, Any]] = None


class ExecutionStatusResponse(BaseModel):
    """Schema for execution status response."""

    id: uuid.UUID
    workflow_id: uuid.UUID
    status: str
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExecutionLogResponse(BaseModel):
    """Schema for execution log response."""

    id: uuid.UUID
    step_name: str
    step_type: str
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    duration_ms: Optional[int]
    error_message: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class ExecutionResultResponse(BaseModel):
    """Schema for workflow execution result."""

    execution_id: uuid.UUID
    status: str
    output_data: Optional[Dict[str, Any]]
    error_message: Optional[str]


# Template schemas
class TemplateParameterCreate(BaseModel):
    """Schema for template parameter creation."""

    name: str
    description: Optional[str] = None
    parameter_type: str
    is_required: bool = False
    default_value: Optional[Any] = None
    validation_rules: Optional[Dict[str, Any]] = None

    @validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Parameter name cannot be empty")
        if len(v.strip()) > 255:
            raise ValueError("Parameter name cannot exceed 255 characters")
        return v.strip()

    @validator("parameter_type")
    def validate_parameter_type(cls, v):
        allowed_types = ["string", "number", "boolean", "array", "object"]
        if v not in allowed_types:
            raise ValueError(
                f"Parameter type must be one of: {', '.join(allowed_types)}"
            )
        return v


class TemplateParameterResponse(BaseModel):
    """Schema for template parameter response."""

    id: uuid.UUID
    template_id: uuid.UUID
    name: str
    description: Optional[str]
    parameter_type: str
    is_required: bool
    default_value: Optional[Any]
    validation_rules: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class TemplateCreate(BaseModel):
    """Schema for template creation request."""

    name: str
    description: Optional[str] = None
    category: str
    definition: Dict[str, Any]
    parameters: Optional[List[TemplateParameterCreate]] = []

    @validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Template name cannot be empty")
        if len(v.strip()) > 255:
            raise ValueError("Template name cannot exceed 255 characters")
        return v.strip()

    @validator("category")
    def validate_category(cls, v):
        allowed_categories = ["sales", "service", "parts", "general"]
        if v.lower() not in allowed_categories:
            raise ValueError(
                f"Category must be one of: {', '.join(allowed_categories)}"
            )
        return v.lower()

    @validator("definition")
    def validate_definition(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Template definition must be a valid JSON object")

        # Basic template structure validation
        required_fields = ["nodes", "edges"]
        for field in required_fields:
            if field not in v:
                raise ValueError(
                    f'Template definition must contain "{field}" field'
                )

        # Validate nodes structure
        if not isinstance(v["nodes"], list):
            raise ValueError("Template nodes must be a list")

        # Validate edges structure
        if not isinstance(v["edges"], list):
            raise ValueError("Template edges must be a list")

        return v


class TemplateUpdate(BaseModel):
    """Schema for template update request."""

    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    definition: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

    @validator("name")
    def validate_name(cls, v):
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Template name cannot be empty")
            if len(v.strip()) > 255:
                raise ValueError("Template name cannot exceed 255 characters")
            return v.strip()
        return v

    @validator("category")
    def validate_category(cls, v):
        if v is not None:
            allowed_categories = ["sales", "service", "parts", "general"]
            if v.lower() not in allowed_categories:
                raise ValueError(
                    f"Category must be one of: {', '.join(allowed_categories)}"
                )
            return v.lower()
        return v


class TemplateResponse(BaseModel):
    """Schema for template response."""

    id: uuid.UUID
    name: str
    description: Optional[str]
    category: str
    definition: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    parameters: List[TemplateParameterResponse] = []

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for template list response."""

    templates: List[TemplateResponse]
    total: int
    page: int
    page_size: int


class TemplateInstantiateRequest(BaseModel):
    """Schema for template instantiation request."""

    name: str
    description: Optional[str] = None
    parameter_values: Dict[str, Any] = {}

    @validator("name")
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError("Workflow name cannot be empty")
        if len(v.strip()) > 255:
            raise ValueError("Workflow name cannot exceed 255 characters")
        return v.strip()


# Tenant schemas
class TenantCreate(BaseModel):
    """Schema for tenant creation request."""

    name: str
    slug: str
    domain: str
    sso_enabled: bool = False
    audit_enabled: bool = True

    @validator("slug")
    def validate_slug(cls, v):
        if not v or not v.strip():
            raise ValueError("Tenant slug cannot be empty")
        # Allow only alphanumeric and hyphens
        import re

        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "Tenant slug can only contain lowercase letters, "
                "numbers, and hyphens"
            )
        return v.strip()

    @validator("domain")
    def validate_domain(cls, v):
        if not v or not v.strip():
            raise ValueError("Tenant domain cannot be empty")
        # Basic domain validation
        import re

        if not re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid domain format")
        return v.strip().lower()


class TenantUpdate(BaseModel):
    """Schema for tenant update request."""

    name: Optional[str] = None
    status: Optional[TenantStatus] = None
    sso_enabled: Optional[bool] = None
    audit_enabled: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class TenantResponse(BaseModel):
    """Schema for tenant response."""

    id: uuid.UUID
    name: str
    slug: str
    domain: str
    status: str
    sso_enabled: bool
    audit_enabled: bool
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_tenant(cls, tenant):
        """Create TenantResponse from Tenant model."""
        return cls(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug,
            domain=tenant.domain,
            status=tenant.status,
            sso_enabled=tenant.sso_enabled,
            audit_enabled=tenant.audit_enabled,
            metadata=tenant.metadata,
            created_at=tenant.created_at,
            updated_at=tenant.updated_at,
        )


class TenantStatsResponse(BaseModel):
    """Schema for tenant statistics response."""

    tenant_id: str
    tenant_name: str
    tenant_status: str
    users: Dict[str, int]
    sso_enabled: bool
    audit_enabled: bool
    audit_summary: Dict[str, Any]


# SSO schemas
class SSOConfigurationCreate(BaseModel):
    """Schema for SSO configuration creation."""

    provider: str
    config: Dict[str, Any]

    @validator("provider")
    def validate_provider(cls, v):
        allowed_providers = ["saml", "oidc", "oauth2"]
        if v not in allowed_providers:
            raise ValueError(
                f"Provider must be one of: {', '.join(allowed_providers)}"
            )
        return v


class SSOConfigurationResponse(BaseModel):
    """Schema for SSO configuration response."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    provider: str
    auto_provision_users: bool
    default_role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_sso_config(cls, config):
        """Create SSOConfigurationResponse from SSOConfiguration model."""
        return cls(
            id=config.id,
            tenant_id=config.tenant_id,
            provider=config.provider,
            auto_provision_users=config.auto_provision_users,
            default_role=config.default_role,
            is_active=config.is_active,
            created_at=config.created_at,
            updated_at=config.updated_at,
        )


class SSOInitiateResponse(BaseModel):
    """Schema for SSO initiation response."""

    redirect_url: str
    provider: str
    tenant_slug: str


class SSOLoginResponse(BaseModel):
    """Schema for SSO login response."""

    access_token: str
    token_type: str
    user: Dict[str, Any]


# Audit Log schemas
class AuditLogResponse(BaseModel):
    """Schema for audit log response."""

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: Optional[uuid.UUID]
    event_type: str
    resource_type: str
    resource_id: Optional[str]
    action: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]]
    status: str
    error_message: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_audit_log(cls, log):
        """Create AuditLogResponse from AuditLog model."""
        return cls(
            id=log.id,
            tenant_id=log.tenant_id,
            user_id=log.user_id,
            event_type=log.event_type,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            action=log.action,
            ip_address=log.ip_address,
            user_agent=log.user_agent,
            old_values=log.old_values,
            new_values=log.new_values,
            metadata=log.metadata,
            status=log.status,
            error_message=log.error_message,
            timestamp=log.timestamp,
        )
