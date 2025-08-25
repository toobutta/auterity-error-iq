"""Performance monitoring and health check endpoints."""

import time
from datetime import datetime, timedelta

from app.database import get_db
from app.models.execution import ExecutionStatus, WorkflowExecution
from app.models.workflow import Workflow
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check with database connectivity and performance metrics."""
    start_time = time.time()

    try:
        # Test database connectivity
        db.execute(text("SELECT 1"))
        db_status = "healthy"
        db_response_time = round((time.time() - start_time) * 1000, 2)
    except Exception:
        db_status = "unhealthy"
        db_response_time = None

    # Get basic system metrics
    total_response_time = round((time.time() - start_time) * 1000, 2)

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
        "database": {"status": db_status, "response_time_ms": db_response_time},
        "api": {"response_time_ms": total_response_time},
    }


@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with comprehensive system metrics."""
    start_time = time.time()
    health_data = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
        "checks": {},
    }

    # Database connectivity check
    try:
        db_start = time.time()
        db.execute(text("SELECT 1"))
        health_data["checks"]["database"] = {
            "status": "healthy",
            "response_time_ms": round((time.time() - db_start) * 1000, 2),
        }
    except Exception as e:
        health_data["checks"]["database"] = {"status": "unhealthy", "error": str(e)}
        health_data["status"] = "unhealthy"

    # Database table checks
    try:
        table_start = time.time()
        workflow_count = db.query(func.count(Workflow.id)).scalar()
        execution_count = db.query(func.count(WorkflowExecution.id)).scalar()

        health_data["checks"]["database_tables"] = {
            "status": "healthy",
            "workflow_count": workflow_count,
            "execution_count": execution_count,
            "response_time_ms": round((time.time() - table_start) * 1000, 2),
        }
    except Exception as e:
        health_data["checks"]["database_tables"] = {
            "status": "unhealthy",
            "error": str(e),
        }
        health_data["status"] = "degraded"

    # Overall response time
    health_data["total_response_time_ms"] = round((time.time() - start_time) * 1000, 2)

    return health_data


@router.get("/metrics/performance")
async def get_performance_metrics(
    hours: int = Query(24, ge=1, le=168, description="Hours of data to analyze"),
    db: Session = Depends(get_db),
):
    """Get performance metrics for workflow executions."""
    start_time = datetime.utcnow() - timedelta(hours=hours)

    # Get execution metrics
    executions = (
        db.query(WorkflowExecution)
        .filter(WorkflowExecution.started_at >= start_time)
        .all()
    )

    if not executions:
        return {
            "period_hours": hours,
            "total_executions": 0,
            "success_rate": 0.0,
            "average_duration_ms": 0,
            "status_breakdown": {},
            "performance_trends": [],
        }

    # Calculate metrics
    total_executions = len(executions)
    successful_executions = len(
        [e for e in executions if e.status == ExecutionStatus.COMPLETED]
    )
    success_rate = (successful_executions / total_executions) * 100

    # Calculate average duration for completed executions
    completed_executions = [e for e in executions if e.completed_at and e.started_at]
    if completed_executions:
        durations = [
            (e.completed_at - e.started_at).total_seconds() * 1000
            for e in completed_executions
        ]
        average_duration_ms = sum(durations) / len(durations)
    else:
        average_duration_ms = 0

    # Status breakdown
    status_breakdown = {}
    for execution in executions:
        status = execution.status.value
        status_breakdown[status] = status_breakdown.get(status, 0) + 1

    # Performance trends (hourly buckets)
    trends = []
    for i in range(hours):
        hour_start = start_time + timedelta(hours=i)
        hour_end = hour_start + timedelta(hours=1)

        hour_executions = [
            e for e in executions if hour_start <= e.started_at < hour_end
        ]

        if hour_executions:
            hour_successful = len(
                [e for e in hour_executions if e.status == ExecutionStatus.COMPLETED]
            )
            hour_success_rate = (hour_successful / len(hour_executions)) * 100
        else:
            hour_success_rate = 0

        trends.append(
            {
                "hour": hour_start.isoformat(),
                "executions": len(hour_executions),
                "success_rate": round(hour_success_rate, 2),
            }
        )

    return {
        "period_hours": hours,
        "total_executions": total_executions,
        "success_rate": round(success_rate, 2),
        "average_duration_ms": round(average_duration_ms, 2),
        "status_breakdown": status_breakdown,
        "performance_trends": trends,
    }


@router.get("/metrics/system")
async def get_system_metrics(db: Session = Depends(get_db)):
    """Get system-level metrics and statistics."""
    try:
        # Database metrics
        total_workflows = db.query(func.count(Workflow.id)).scalar()
        active_workflows = (
            db.query(func.count(Workflow.id))
            .filter(Workflow.is_active is True)
            .scalar()
        )

        total_executions = db.query(func.count(WorkflowExecution.id)).scalar()

        # Recent activity (last 24 hours)
        recent_start = datetime.utcnow() - timedelta(hours=24)
        recent_executions = (
            db.query(func.count(WorkflowExecution.id))
            .filter(WorkflowExecution.started_at >= recent_start)
            .scalar()
        )

        # Database size estimation (PostgreSQL specific)
        try:
            db_size_result = db.execute(
                text(
                    """
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """
                )
            ).fetchone()
            database_size = db_size_result[0] if db_size_result else "Unknown"
        except Exception:
            database_size = "Unknown"

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "database": {
                "total_workflows": total_workflows,
                "active_workflows": active_workflows,
                "total_executions": total_executions,
                "recent_executions_24h": recent_executions,
                "estimated_size": database_size,
            },
            "system": {"uptime_check": "healthy", "version": "0.1.0"},
        }

    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Failed to collect system metrics: {str(e)}",
            "status": "error",
        }


@router.get("/metrics/workflows")
async def get_workflow_metrics(
    limit: int = Query(
        10, ge=1, le=50, description="Number of top workflows to return"
    ),
    db: Session = Depends(get_db),
):
    """Get workflow-specific performance metrics."""
    try:
        # Get workflow execution statistics
        workflow_stats = (
            db.query(
                Workflow.id,
                Workflow.name,
                func.count(WorkflowExecution.id).label("total_executions"),
                func.sum(
                    func.case(
                        (WorkflowExecution.status == ExecutionStatus.COMPLETED, 1),
                        else_=0,
                    )
                ).label("successful_executions"),
                func.avg(
                    func.extract(
                        "epoch",
                        WorkflowExecution.completed_at - WorkflowExecution.started_at,
                    )
                    * 1000
                ).label("avg_duration_ms"),
            )
            .outerjoin(WorkflowExecution)
            .filter(Workflow.is_active is True)
            .group_by(Workflow.id, Workflow.name)
            .order_by(func.count(WorkflowExecution.id).desc())
            .limit(limit)
            .all()
        )

        workflow_metrics = []
        for stat in workflow_stats:
            total_exec = stat.total_executions or 0
            successful_exec = stat.successful_executions or 0
            success_rate = (successful_exec / total_exec * 100) if total_exec > 0 else 0
            avg_duration = stat.avg_duration_ms or 0

            workflow_metrics.append(
                {
                    "workflow_id": str(stat.id),
                    "workflow_name": stat.name,
                    "total_executions": total_exec,
                    "successful_executions": successful_exec,
                    "success_rate": round(success_rate, 2),
                    "average_duration_ms": round(avg_duration, 2),
                }
            )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "top_workflows": workflow_metrics,
        }

    except Exception as e:
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "error": f"Failed to collect workflow metrics: {str(e)}",
            "status": "error",
        }
