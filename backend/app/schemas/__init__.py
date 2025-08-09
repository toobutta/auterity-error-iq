"""Pydantic schemas package."""

from .workflow import (
    ExecutionLogResponse,
    ExecutionResultResponse,
    ExecutionStatusResponse,
    WorkflowCreate,
    WorkflowExecuteRequest,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowUpdate,
)

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

from .template import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
    TemplateInstantiateRequest,
)

__all__ = [
    "WorkflowCreate",
    "WorkflowUpdate",
    "WorkflowResponse",
    "WorkflowListResponse",
    "WorkflowExecuteRequest",
    "ExecutionStatusResponse",
    "ExecutionLogResponse",
    "ExecutionResultResponse",
    "UserRoleAssignment",
    "UserResponse",
    "UserRegister",
    "UserLogin",
    "Token",
    "RoleResponse",
    "RoleCreate",
    "PermissionResponse",
    "CrossSystemTokenResponse",
    "CrossSystemTokenRequest",
    "TemplateCreate",
    "TemplateUpdate",
    "TemplateResponse",
    "TemplateListResponse",
    "TemplateInstantiateRequest",
]
