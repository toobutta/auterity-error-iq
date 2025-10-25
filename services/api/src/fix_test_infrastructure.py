#!/usr/bin/env python3
"""Fix test infrastructure by resolving missing schema imports."""

import os
from pathlib import Path


def fix_missing_schemas():
    """Add missing schema classes to schemas/__init__.py"""

    schemas_init_path = Path("app/schemas/__init__.py")

    # Read current content
    with open(schemas_init_path, "r") as f:
        content = f.read()

    # Add missing imports
    missing_imports = """
from .auth import (
    CrossSystemTokenRequest,
    CrossSystemTokenResponse,
    PermissionResponse,
    RoleCreate,
    RoleResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
    UserRoleAssignment,
)
"""

    # Add missing exports to __all__
    missing_exports = [
        "CrossSystemTokenRequest",
        "CrossSystemTokenResponse",
        "PermissionResponse",
        "RoleCreate",
        "RoleResponse",
        "Token",
        "UserLogin",
        "UserRegister",
        "UserResponse",
        "UserRoleAssignment",
    ]

    # Update content
    lines = content.split("\n")

    # Find workflow import section and add auth imports after
    workflow_import_end = -1
    for i, line in enumerate(lines):
        if line.strip() == ")" and "workflow" in lines[i - 5 : i]:
            workflow_import_end = i
            break

    if workflow_import_end > -1:
        lines.insert(workflow_import_end + 1, missing_imports)

    # Update __all__ list
    all_start = -1
    all_end = -1
    for i, line in enumerate(lines):
        if line.strip().startswith("__all__"):
            all_start = i
        if all_start > -1 and line.strip() == "]":
            all_end = i
            break

    if all_start > -1 and all_end > -1:
        # Add missing exports before the closing bracket
        for export in missing_exports:
            lines.insert(all_end, f'    "{export}",')

    # Write updated content
    with open(schemas_init_path, "w") as f:
        f.write("\n".join(lines))

    print("✅ Updated schemas/__init__.py with missing imports")


def create_missing_auth_schemas():
    """Create missing auth.py schema file"""

    auth_schemas_path = Path("app/schemas/auth.py")

    auth_schemas_content = '''"""Authentication schemas."""

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
            roles=[role.name for role in user.roles] if hasattr(user, 'roles') else []
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
'''

    with open(auth_schemas_path, "w") as f:
        f.write(auth_schemas_content)

    print("✅ Created app/schemas/auth.py with missing schema classes")


def main():
    """Main function to fix test infrastructure."""
    print("🔧 Fixing test infrastructure...")

    # Change to backend directory
    os.chdir(Path(__file__).parent)

    # Create missing auth schemas
    create_missing_auth_schemas()

    # Fix schemas init file
    fix_missing_schemas()

    print("✅ Test infrastructure repair completed!")
    print(
        "🧪 Run 'python3 -m pytest --collect-only' to verify tests are discoverable"
    )


if __name__ == "__main__":
    main()
