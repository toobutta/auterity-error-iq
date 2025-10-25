"""User model for authentication and user management."""

import uuid
from enum import Enum

from sqlalchemy import UUID, Boolean, Column, DateTime, ForeignKey, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class UserRole(str, Enum):
    """User roles for role-based access control."""

    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    VIEWER = "viewer"


class SystemPermission(str, Enum):
    """System permissions for cross-system access."""

    AUTMATRIX_READ = "autmatrix:read"
    AUTMATRIX_WRITE = "autmatrix:write"
    AUTMATRIX_ADMIN = "autmatrix:admin"
    RELAYCORE_READ = "relaycore:read"
    RELAYCORE_WRITE = "relaycore:write"
    RELAYCORE_ADMIN = "relaycore:admin"
    NEUROWEAVER_READ = "neuroweaver:read"
    NEUROWEAVER_WRITE = "neuroweaver:write"
    NEUROWEAVER_ADMIN = "neuroweaver:admin"


# Association table for many-to-many relationship between users and roles
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column(
        "user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    ),
    Column(
        "role_id", UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    ),
)

# Association table for many-to-many relationship between roles and permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column(
        "role_id", UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True
    ),
    Column(
        "permission_id",
        UUID(as_uuid=True),
        ForeignKey("permissions.id"),
        primary_key=True,
    ),
)


class Role(Base):
    """Role model for role-based access control."""

    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255))
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
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship(
        "Permission", secondary=role_permissions, back_populates="roles"
    )

    def __repr__(self):
        return f"<Role(id={self.id}, name='{self.name}')>"


class Permission(Base):
    """Permission model for fine-grained access control."""

    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(255))
    system = Column(
        String(50), nullable=False, index=True
    )  # autmatrix, relaycore, neuroweaver
    resource = Column(String(50), nullable=False)  # workflows, models, etc.
    action = Column(String(50), nullable=False)  # read, write, delete, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    roles = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )

    def __repr__(self):
        return f"<Permission(id={self.id}, name='{self.name}', system='{self.system}')>"


class User(Base):
    """User model for storing user account information."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False
    )
    email = Column(String(255), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(
        String(255), nullable=True
    )  # Nullable for SSO users

    # SSO fields
    sso_provider = Column(String(20), nullable=True)
    sso_subject_id = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
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
    tenant = relationship("Tenant", back_populates="users")
    workflows = relationship(
        "Workflow", back_populates="user", cascade="all, delete-orphan"
    )
    dashboards = relationship(
        "Dashboard", back_populates="user", cascade="all, delete-orphan"
    )
    roles = relationship("Role", secondary=user_roles, back_populates="users")

    def __repr__(self):
        return (
            f"<User(id={self.id}, email='{self.email}', name='{self.name}')>"
        )

    def has_permission(self, permission_name: str) -> bool:
        """Check if user has a specific permission."""
        for role in self.roles:
            if not role.is_active:
                continue
            for permission in role.permissions:
                if permission.is_active and permission.name == permission_name:
                    return True
        return False

    def has_system_access(self, system: str, action: str = "read") -> bool:
        """Check if user has access to a specific system."""
        permission_name = f"{system}:{action}"
        return self.has_permission(permission_name)

    def get_permissions(self) -> list[str]:
        """Get all permissions for the user."""
        permissions = set()
        for role in self.roles:
            if not role.is_active:
                continue
            for permission in role.permissions:
                if permission.is_active:
                    permissions.add(permission.name)
        return list(permissions)

    def is_sso_user(self) -> bool:
        """Check if user is authenticated via SSO."""
        return self.sso_provider is not None

    def can_access_tenant(self, tenant_id: str) -> bool:
        """Check if user can access a specific tenant."""
        return str(self.tenant_id) == tenant_id
