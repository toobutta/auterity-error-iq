"""Workflow management API endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.config.workflow_config import create_workflow_engine
from app.database import get_db
from app.models.execution import ExecutionLog, WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas import (
    ExecutionLogResponse,
    ExecutionResultResponse,
    ExecutionStatusResponse,
    WorkflowCreate,
    WorkflowExecuteRequest,
    WorkflowListResponse,
    WorkflowResponse,
    WorkflowUpdate,
)
from app.services.workflow_engine import WorkflowExecutionError

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new workflow for the authenticated user."""
    # Check if workflow name already exists for this user
    existing_workflow = (
        db.query(Workflow)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                Workflow.name == workflow_data.name,
                Workflow.is_active is True,
            )
        )
        .first()
    )

    if existing_workflow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow with name '{workflow_data.name}' already exists",
        )

    # Create new workflow
    db_workflow = Workflow(
        name=workflow_data.name,
        description=workflow_data.description,
        user_id=current_user.id,
        definition=workflow_data.definition,
    )

    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@router.get("/", response_model=WorkflowListResponse)
async def list_workflows(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(
        10, ge=1, le=100, description="Number of workflows per page"
    ),
    name_filter: Optional[str] = Query(None, description="Filter workflows by name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List workflows for the authenticated user with pagination and filtering."""
    # Build query with user filter
    query = db.query(Workflow).filter(Workflow.user_id == current_user.id)

    # Apply filters
    if name_filter:
        query = query.filter(Workflow.name.ilike(f"%{name_filter}%"))

    if is_active is not None:
        query = query.filter(Workflow.is_active == is_active)

    # Get total count
    total = query.count()

    # Apply pagination and ordering
    workflows = (
        query.order_by(Workflow.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return WorkflowListResponse(
        workflows=workflows, total=total, page=page, page_size=page_size
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific workflow by ID."""
    workflow = (
        db.query(Workflow)
        .filter(and_(Workflow.id == workflow_id, Workflow.user_id == current_user.id))
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a specific workflow."""
    # Get existing workflow
    workflow = (
        db.query(Workflow)
        .filter(and_(Workflow.id == workflow_id, Workflow.user_id == current_user.id))
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    # Check if new name conflicts with existing workflows (if name is being updated)
    if workflow_data.name and workflow_data.name != workflow.name:
        existing_workflow = (
            db.query(Workflow)
            .filter(
                and_(
                    Workflow.user_id == current_user.id,
                    Workflow.name == workflow_data.name,
                    Workflow.is_active is True,
                    Workflow.id != workflow_id,
                )
            )
            .first()
        )

        if existing_workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Workflow with name '{workflow_data.name}' already exists",
            )

    # Update workflow fields
    update_data = workflow_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workflow, field, value)

    db.commit()
    db.refresh(workflow)

    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a specific workflow (soft delete by setting is_active to False)."""
    workflow = (
        db.query(Workflow)
        .filter(and_(Workflow.id == workflow_id, Workflow.user_id == current_user.id))
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    # Soft delete by setting is_active to False
    workflow.is_active = False
    db.commit()

    return None


@router.post(
    "/{workflow_id}/duplicate",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
)
async def duplicate_workflow(
    workflow_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a duplicate of an existing workflow."""
    # Get original workflow
    original_workflow = (
        db.query(Workflow)
        .filter(and_(Workflow.id == workflow_id, Workflow.user_id == current_user.id))
        .first()
    )

    if not original_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    # Generate unique name for duplicate
    base_name = f"{original_workflow.name} (Copy)"
    duplicate_name = base_name
    counter = 1

    while (
        db.query(Workflow)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                Workflow.name == duplicate_name,
                Workflow.is_active is True,
            )
        )
        .first()
    ):
        counter += 1
        duplicate_name = f"{base_name} {counter}"

    # Create duplicate workflow
    duplicate_workflow = Workflow(
        name=duplicate_name,
        description=f"Copy of {original_workflow.name}",
        user_id=current_user.id,
        definition=original_workflow.definition,
    )

    db.add(duplicate_workflow)
    db.commit()
    db.refresh(duplicate_workflow)

    return duplicate_workflow


# Workflow execution endpoints
@router.post(
    "/{workflow_id}/execute",
    response_model=ExecutionResultResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def execute_workflow(
    workflow_id: UUID,
    execution_request: WorkflowExecuteRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Execute a workflow with the provided input data."""
    # Verify workflow exists and belongs to user
    workflow = (
        db.query(Workflow)
        .filter(
            and_(
                Workflow.id == workflow_id,
                Workflow.user_id == current_user.id,
                Workflow.is_active is True,
            )
        )
        .first()
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )

    try:
        # Initialize workflow engine and execute
        engine = create_workflow_engine()
        result = await engine.execute_workflow(
            workflow_id=workflow_id, input_data=execution_request.input_data
        )

        return ExecutionResultResponse(
            execution_id=result.execution_id,
            status=result.status.value,
            output_data=result.output_data,
            error_message=result.error_message,
        )

    except WorkflowExecutionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Workflow execution failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error during workflow execution: {str(e)}",
        )


@router.get("/executions/{execution_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(
    execution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get the status and details of a workflow execution."""
    # Get execution and verify it belongs to user's workflow
    execution = (
        db.query(WorkflowExecution)
        .join(Workflow)
        .filter(
            and_(
                WorkflowExecution.id == execution_id,
                Workflow.user_id == current_user.id,
            )
        )
        .first()
    )

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found"
        )

    return ExecutionStatusResponse(
        id=execution.id,
        workflow_id=execution.workflow_id,
        status=execution.status.value,
        input_data=execution.input_data,
        output_data=execution.output_data,
        error_message=execution.error_message,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
    )


@router.get(
    "/executions/{execution_id}/logs", response_model=List[ExecutionLogResponse]
)
async def get_execution_logs(
    execution_id: UUID,
    limit: Optional[int] = Query(
        100, ge=1, le=1000, description="Maximum number of logs to return"
    ),
    step_type: Optional[str] = Query(None, description="Filter logs by step type"),
    step_name: Optional[str] = Query(None, description="Filter logs by step name"),
    has_error: Optional[bool] = Query(None, description="Filter logs by error status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get execution logs for a workflow execution with filtering capabilities."""
    # Verify execution belongs to user's workflow
    execution = (
        db.query(WorkflowExecution)
        .join(Workflow)
        .filter(
            and_(
                WorkflowExecution.id == execution_id,
                Workflow.user_id == current_user.id,
            )
        )
        .first()
    )

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found"
        )

    # Build query with filters
    query = db.query(ExecutionLog).filter(ExecutionLog.execution_id == execution_id)

    if step_type:
        query = query.filter(ExecutionLog.step_type == step_type)

    if step_name:
        query = query.filter(ExecutionLog.step_name.ilike(f"%{step_name}%"))

    if has_error is not None:
        if has_error:
            query = query.filter(ExecutionLog.error_message.isnot(None))
        else:
            query = query.filter(ExecutionLog.error_message.is_(None))

    # Apply ordering and limit
    logs = query.order_by(ExecutionLog.timestamp).limit(limit).all()

    return [
        ExecutionLogResponse(
            id=log.id,
            step_name=log.step_name,
            step_type=log.step_type,
            input_data=log.input_data,
            output_data=log.output_data,
            duration_ms=log.duration_ms,
            error_message=log.error_message,
            timestamp=log.timestamp,
        )
        for log in logs
    ]


@router.post("/executions/{execution_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_execution(
    execution_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel a running workflow execution."""
    # Verify execution belongs to user's workflow
    execution = (
        db.query(WorkflowExecution)
        .join(Workflow)
        .filter(
            and_(
                WorkflowExecution.id == execution_id,
                Workflow.user_id == current_user.id,
            )
        )
        .first()
    )

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Execution not found"
        )

    try:
        # Use workflow engine to cancel execution
        engine = create_workflow_engine()
        success = await engine.cancel_execution(execution_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Execution cannot be cancelled (may be completed or failed)",
            )

        return {"message": "Execution cancelled successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel execution: {str(e)}",
        )


@router.get("/executions", response_model=List[ExecutionStatusResponse])
async def list_executions(
    workflow_id: Optional[UUID] = Query(None, description="Filter by workflow ID"),
    status_filter: Optional[str] = Query(
        None, description="Filter by execution status"
    ),
    limit: int = Query(
        50, ge=1, le=200, description="Maximum number of executions to return"
    ),
    offset: int = Query(0, ge=0, description="Number of executions to skip"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List workflow executions for the authenticated user with filtering."""
    # Build query for user's executions
    query = (
        db.query(WorkflowExecution)
        .join(Workflow)
        .filter(Workflow.user_id == current_user.id)
    )

    # Apply filters
    if workflow_id:
        # Verify workflow belongs to user
        workflow = (
            db.query(Workflow)
            .filter(
                and_(
                    Workflow.id == workflow_id,
                    Workflow.user_id == current_user.id,
                )
            )
            .first()
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
            )
        query = query.filter(WorkflowExecution.workflow_id == workflow_id)

    if status_filter:
        try:
            from app.models.execution import ExecutionStatus

            status_enum = ExecutionStatus(status_filter.lower())
            query = query.filter(WorkflowExecution.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status filter: {status_filter}",
            )

    # Apply ordering, offset, and limit
    executions = (
        query.order_by(WorkflowExecution.started_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        ExecutionStatusResponse(
            id=execution.id,
            workflow_id=execution.workflow_id,
            status=execution.status.value,
            input_data=execution.input_data,
            output_data=execution.output_data,
            error_message=execution.error_message,
            started_at=execution.started_at,
            completed_at=execution.completed_at,
        )
        for execution in executions
    ]
