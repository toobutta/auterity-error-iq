"""Dashboard metrics API endpoints."""

from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, and_, desc
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.execution import WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get comprehensive dashboard metrics for the authenticated user."""

    # Get total workflows count
    total_workflows = (
        db.query(func.count(Workflow.id))
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                Workflow.is_active == True
            )
        )
        .scalar()
    )

    # Get total executions count
    total_executions = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(Workflow.user_id == current_user.id)
        .scalar()
    )

    # Calculate success rate
    total_executions_count = total_executions if total_executions > 0 else 1
    successful_executions = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.status == "completed"
            )
        )
        .scalar()
    )
    success_rate = (successful_executions / total_executions_count) * 100

    # Calculate average execution time
    avg_execution_time_result = (
        db.query(func.avg(WorkflowExecution.duration_ms))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.status == "completed",
                WorkflowExecution.duration_ms.isnot(None)
            )
        )
        .scalar()
    )
    average_execution_time = float(avg_execution_time_result) if avg_execution_time_result else 0.0

    # Get active executions count
    active_executions = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.status.in_(["running", "pending"])
            )
        )
        .scalar()
    )

    # Get failed executions count
    failed_executions = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.status == "failed"
            )
        )
        .scalar()
    )

    # Get executions today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    executions_today = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.created_at >= today_start
            )
        )
        .scalar()
    )

    # Get executions this week
    week_start = today_start - timedelta(days=today_start.weekday())
    executions_this_week = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.created_at >= week_start
            )
        )
        .scalar()
    )

    return {
        "totalWorkflows": total_workflows,
        "totalExecutions": total_executions,
        "successRate": round(success_rate, 2),
        "averageExecutionTime": round(average_execution_time, 2),
        "activeExecutions": active_executions,
        "failedExecutions": failed_executions,
        "executionsToday": executions_today,
        "executionsThisWeek": executions_this_week,
    }


@router.get("/health")
async def get_dashboard_health(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get dashboard health status and quick metrics."""

    # Quick health check - count recent executions
    recent_executions = (
        db.query(func.count(WorkflowExecution.id))
        .join(Workflow, WorkflowExecution.workflow_id == Workflow.id)
        .filter(
            and_(
                Workflow.user_id == current_user.id,
                WorkflowExecution.created_at >= datetime.utcnow() - timedelta(hours=1)
            )
        )
        .scalar()
    )

    # Check if system is healthy
    system_healthy = recent_executions >= 0  # Basic connectivity check

    return {
        "healthy": system_healthy,
        "recentActivity": recent_executions,
        "timestamp": datetime.utcnow().isoformat(),
    }
