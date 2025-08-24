"""Authentication schemas."""

from typing import List, Optional

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str


class UserLogin(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class UserRegister(BaseModel):
    """User registration request."""

    email: EmailStr
    name: str
    password: str


class UserResponse(BaseModel):
    """User response model."""

    id: str
    email: str
    name: str
    is_active: bool
    roles: List[str] = []

    @classmethod
    def from_user(cls, user):
        """Create from User model."""
        return cls(
            id=str(user.id),
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            roles=[role.name for role in user.roles] if hasattr(user, "roles") else [],
        )


class CrossSystemTokenRequest(BaseModel):
    """Cross-system token request."""

    target_system: str


class CrossSystemTokenResponse(BaseModel):
    """Cross-system token response."""

    access_token: str
    token_type: str
    target_system: str
    permissions: List[str]
    expires_in: int


class RoleCreate(BaseModel):
    """Role creation request."""

    name: str
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None


class RoleResponse(BaseModel):
    """Role response model."""

    id: str
    name: str
    description: Optional[str] = None
    permissions: List[str] = []


class PermissionResponse(BaseModel):
    """Permission response model."""

    id: str
    name: str
    description: Optional[str] = None


class UserRoleAssignment(BaseModel):
    """User role assignment request."""

    role_names: List[str]


class SSOInitiateResponse(BaseModel):
    """SSO initiation response."""

    redirect_url: str
    provider: str
    tenant_slug: str


class SSOLoginResponse(BaseModel):
    """SSO login response."""

    access_token: str
    token_type: str
    user: dict


class SSOConfigurationResponse(BaseModel):
    """SSO configuration response."""

    id: str
    tenant_id: str
    provider: str
    auto_provision_users: bool
    default_role: str
    is_active: bool
    created_at: str
    updated_at: str


class AuditLogResponse(BaseModel):
    """Audit log response schema."""

    id: str
    tenant_id: str
    user_id: Optional[str] = None
    event_type: str
    resource_type: str
    resource_id: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    metadata: Optional[dict] = None
    status: str
    error_message: Optional[str] = None
    timestamp: str
