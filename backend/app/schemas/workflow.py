"""Workflow-specific Pydantic schemas."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, validator


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

        required_fields = ["nodes", "edges"]
        for field in required_fields:
            if field not in v:
                raise ValueError(f'Workflow definition must contain "{field}" field')

        if not isinstance(v["nodes"], list):
            raise ValueError("Workflow nodes must be a list")
        if not isinstance(v["edges"], list):
            raise ValueError("Workflow edges must be a list")

        for i, node in enumerate(v["nodes"]):
            if not isinstance(node, dict):
                raise ValueError(f"Node {i} must be an object")
            if "id" not in node:
                raise ValueError(f'Node {i} must have an "id" field')
            if "type" not in node:
                raise ValueError(f'Node {i} must have a "type" field')

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
                raise ValueError("Workflow definition must be a valid JSON object")

            required_fields = ["nodes", "edges"]
            for field in required_fields:
                if field not in v:
                    raise ValueError(
                        f'Workflow definition must contain "{field}" field'
                    )

            if not isinstance(v["nodes"], list):
                raise ValueError("Workflow nodes must be a list")
            if not isinstance(v["edges"], list):
                raise ValueError("Workflow edges must be a list")

            for i, node in enumerate(v["nodes"]):
                if not isinstance(node, dict):
                    raise ValueError(f"Node {i} must be an object")
                if "id" not in node:
                    raise ValueError(f'Node {i} must have an "id" field')
                if "type" not in node:
                    raise ValueError(f'Node {i} must have a "type" field')

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
