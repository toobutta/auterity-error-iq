"""Authentication API endpoints."""

from datetime import timedelta
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload

from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    RoleManager,
    authenticate_user,
    create_access_token,
    create_cross_system_token,
    get_current_active_user,
    get_password_hash,
    require_admin_access,
)
from app.database import get_db
from app.models import Permission, Role, User
from app.schemas.auth import (
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

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    user_data: UserRegister, db: Session = Depends(get_db)
):
    """Register a new user."""
    # Check if user already exists
    existing_user = (
        db.query(User).filter(User.email == user_data.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=Token)
async def login_user(
    user_credentials: UserLogin, db: Session = Depends(get_db)
):
    """Login user and return JWT token."""
    user = authenticate_user(
        db, user_credentials.email, user_credentials.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Type guard: user is now guaranteed to be User instance
    assert isinstance(user, User)

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    # Load user with roles and permissions for token creation
    user_with_perms = (
        db.query(User)
        .options(joinedload(User.roles).joinedload(Role.permissions))
        .filter(User.id == user.id)
        .first()
    )

    if not user_with_perms:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": user_with_perms.email,
        "user_id": str(user_with_perms.id),
        "name": user_with_perms.name,
        "permissions": user_with_perms.get_permissions(),
    }
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    """OAuth2 compatible token endpoint (for OpenAPI docs)."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Type guard: user is now guaranteed to be User instance
    assert isinstance(user, User)

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
):
    """Get current authenticated user information."""
    return UserResponse.from_user(current_user)


@router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)."""
    # Since we're using stateless JWT tokens, logout is handled client-side
    # by removing the token from storage
    return {"message": "Successfully logged out"}


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Refresh JWT token for current user."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "user_id": str(current_user.id),
        "name": current_user.name,
        "permissions": current_user.get_permissions(),
    }
    access_token = create_access_token(
        data=token_data, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# Cross-system authentication endpoints
@router.post("/cross-system-token", response_model=CrossSystemTokenResponse)
async def get_cross_system_token(
    request: CrossSystemTokenRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Get a token for accessing another system."""
    # Check if user has access to the target system
    if not current_user.has_system_access(request.target_system):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied to {request.target_system} system",
        )

    access_token = create_cross_system_token(
        current_user, request.target_system
    )
    user_permissions = current_user.get_permissions()
    system_permissions = [
        p
        for p in user_permissions
        if p.startswith(f"{request.target_system}:")
    ]

    return CrossSystemTokenResponse(
        access_token=access_token,
        token_type="bearer",
        target_system=request.target_system,
        permissions=system_permissions,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# Role management endpoints
@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """List all roles (admin only)."""
    roles = db.query(Role).all()
    return roles


@router.post(
    "/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED
)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Create a new role (admin only)."""
    # Check if role already exists
    existing_role = db.query(Role).filter(Role.name == role_data.name).first()
    if existing_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists",
        )

    # Create role
    role = Role(name=role_data.name, description=role_data.description)
    db.add(role)
    db.flush()

    # Assign permissions
    if role_data.permission_ids:
        permissions = (
            db.query(Permission)
            .filter(Permission.id.in_(role_data.permission_ids))
            .all()
        )
        role.permissions.extend(permissions)

    db.commit()
    db.refresh(role)
    return role


@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """List all permissions (admin only)."""
    permissions = db.query(Permission).all()
    return permissions


@router.post("/users/{user_id}/roles", status_code=status.HTTP_200_OK)
async def assign_user_roles(
    user_id: str,
    assignment: UserRoleAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Assign roles to a user (admin only)."""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Get roles
    roles = db.query(Role).filter(Role.name.in_(assignment.role_names)).all()
    if len(roles) != len(assignment.role_names):
        found_names = {str(role.name) for role in roles}
        missing_names = set(assignment.role_names) - found_names
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roles not found: {', '.join(missing_names)}",
        )

    # Clear existing roles and assign new ones
    user.roles.clear()
    user.roles.extend(roles)
    db.commit()

    return {"message": "Roles assigned successfully"}


@router.post("/init-roles", status_code=status.HTTP_200_OK)
async def initialize_default_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_access()),
):
    """Initialize default roles and permissions (admin only)."""
    role_manager = RoleManager(db)
    role_manager.create_default_roles()
    return {
        "message": "Default roles and permissions initialized successfully"
    }
