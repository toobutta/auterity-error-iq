"""Authentication utilities for JWT token management and password hashing."""

import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload

from app.database import get_db

# Configuration
from app.models.user import Permission, Role, User

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_cross_system_token(user: User, target_system: str) -> str:
    """Create JWT token for cross-system authentication."""
    permissions = user.get_permissions()
    system_permissions = [
        p for p in permissions if p.startswith(f"{target_system}:")
    ]

    token_data = {
        "sub": user.email,
        "user_id": str(user.id),
        "name": user.name,
        "permissions": system_permissions,
        "target_system": target_system,
        "type": "cross_system",
    }

    return create_access_token(token_data)


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except InvalidTokenError:
        return None


def authenticate_user(
    db: Session, email: str, password: str
) -> Optional[User]:
    """Authenticate user with email and password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, str(user.hashed_password)):
        return None
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    email = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Load user with roles and permissions
    user = (
        db.query(User)
        .options(joinedload(User.roles).joinedload(Role.permissions))
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise credentials_exception

    if not bool(user.is_active):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user (additional check for active status)."""
    if not bool(current_user.is_active):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_permission(permission: str):
    """Dependency factory for requiring specific permissions."""

    def permission_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission}",
            )
        return current_user

    return permission_checker


def require_system_access(system: str, action: str = "read"):
    """Dependency factory for requiring system access."""

    def system_access_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not current_user.has_system_access(system, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied to {system} system for action: {action}"
                ),
            )
        return current_user

    return system_access_checker


def require_admin_access():
    """Dependency for requiring admin access."""

    def admin_checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        admin_permissions = [
            "autmatrix:admin",
            "relaycore:admin",
            "neuroweaver:admin",
        ]

        has_admin = any(
            current_user.has_permission(perm) for perm in admin_permissions
        )
        if not has_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator access required",
            )
        return current_user

    return admin_checker


class RoleManager:
    """Service class for managing roles and permissions."""

    def __init__(self, db: Session):
        self.db = db

    def create_default_roles(self):
        """Create default roles and permissions."""
        # Define default permissions
        default_permissions = [
            # AutoMatrix permissions
            (
                "autmatrix:read",
                "Read access to AutoMatrix workflows",
                "autmatrix",
                "workflows",
                "read",
            ),
            (
                "autmatrix:write",
                "Write access to AutoMatrix workflows",
                "autmatrix",
                "workflows",
                "write",
            ),
            (
                "autmatrix:admin",
                "Admin access to AutoMatrix",
                "autmatrix",
                "system",
                "admin",
            ),
            # RelayCore permissions
            (
                "relaycore:read",
                "Read access to RelayCore routing",
                "relaycore",
                "routing",
                "read",
            ),
            (
                "relaycore:write",
                "Write access to RelayCore routing",
                "relaycore",
                "routing",
                "write",
            ),
            (
                "relaycore:admin",
                "Admin access to RelayCore",
                "relaycore",
                "system",
                "admin",
            ),
            # NeuroWeaver permissions
            (
                "neuroweaver:read",
                "Read access to NeuroWeaver models",
                "neuroweaver",
                "models",
                "read",
            ),
            (
                "neuroweaver:write",
                "Write access to NeuroWeaver models",
                "neuroweaver",
                "models",
                "write",
            ),
            (
                "neuroweaver:admin",
                "Admin access to NeuroWeaver",
                "neuroweaver",
                "system",
                "admin",
            ),
        ]

        # Create permissions
        permissions = {}
        for (
            perm_name,
            description,
            system,
            resource,
            action,
        ) in default_permissions:
            permission = (
                self.db.query(Permission)
                .filter(Permission.name == perm_name)
                .first()
            )
            if not permission:
                permission = Permission(
                    name=perm_name,
                    description=description,
                    system=system,
                    resource=resource,
                    action=action,
                )
                self.db.add(permission)
                self.db.flush()
            permissions[perm_name] = permission

        # Define default roles
        default_roles = [
            (
                "admin",
                "System Administrator",
                ["autmatrix:admin", "relaycore:admin", "neuroweaver:admin"],
            ),
            (
                "manager",
                "System Manager",
                [
                    "autmatrix:read",
                    "autmatrix:write",
                    "relaycore:read",
                    "relaycore:write",
                    "neuroweaver:read",
                    "neuroweaver:write",
                ],
            ),
            (
                "user",
                "Regular User",
                [
                    "autmatrix:read",
                    "autmatrix:write",
                    "relaycore:read",
                    "neuroweaver:read",
                ],
            ),
            (
                "viewer",
                "Read-only User",
                ["autmatrix:read", "relaycore:read", "neuroweaver:read"],
            ),
        ]

        # Create roles
        for role_name, description, role_permissions in default_roles:
            role = self.db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=description)
                self.db.add(role)
                self.db.flush()

                # Assign permissions to role
                for perm_name in role_permissions:
                    if perm_name in permissions:
                        role.permissions.append(permissions[perm_name])

        self.db.commit()

    def assign_role_to_user(self, user: User, role_name: str):
        """Assign a role to a user."""
        role = self.db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found")

        if role not in user.roles:
            user.roles.append(role)
            self.db.commit()

    def remove_role_from_user(self, user: User, role_name: str):
        """Remove a role from a user."""
        role = self.db.query(Role).filter(Role.name == role_name).first()
        if role and role in user.roles:
            user.roles.remove(role)
            self.db.commit()
