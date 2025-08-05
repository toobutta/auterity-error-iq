"""Frontend log collection API endpoints."""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.middleware.logging import get_correlation_id, log_structured
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logs", tags=["logs"])


class FrontendLogEntry(BaseModel):
    """Frontend log entry model."""

    timestamp: datetime
    level: str = Field(..., pattern="^(debug|info|warn|error)$")
    message: str
    correlationId: Optional[str] = None
    context: Optional[dict] = None
    component: Optional[str] = None
    action: Optional[str] = None
    userId: Optional[str] = None
    sessionId: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None


class LogBatchRequest(BaseModel):
    """Batch log submission request."""

    logs: List[FrontendLogEntry]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_frontend_logs(
    request: Request,
    log_batch: LogBatchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Submit frontend logs for server-side processing and storage.

    This endpoint receives batched log entries from the frontend and processes
    them for monitoring, debugging, and analytics purposes.
    """
    correlation_id = get_correlation_id(request)

    try:
        processed_logs = []

        for log_entry in log_batch.logs:
            # Enhance log entry with server-side information
            enhanced_log = {
                "event": "frontend_log",
                "correlation_id": log_entry.correlationId or correlation_id,
                "frontend_timestamp": log_entry.timestamp.isoformat(),
                "server_timestamp": datetime.utcnow().isoformat(),
                "level": log_entry.level,
                "message": log_entry.message,
                "component": log_entry.component,
                "action": log_entry.action,
                "user_id": str(current_user.id),
                "session_id": log_entry.sessionId,
                "url": log_entry.url,
                "user_agent": log_entry.userAgent,
                "context": log_entry.context or {},
            }

            # Log to structured logging system
            log_structured(
                event="frontend_log",
                correlation_id=log_entry.correlationId or correlation_id,
                level=log_entry.level,
                **enhanced_log,
            )

            processed_logs.append(enhanced_log)

        # Log batch submission
        log_structured(
            event="frontend_log_batch_received",
            correlation_id=correlation_id,
            user_id=str(current_user.id),
            log_count=len(log_batch.logs),
            level="info",
        )

        return {
            "message": f"Successfully processed {len(log_batch.logs)} log entries",
            "processed_count": len(processed_logs),
            "correlation_id": correlation_id,
        }

    except Exception as e:
        logger.error(f"Failed to process frontend logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process log entries",
        )


@router.post("/client-error", status_code=status.HTTP_201_CREATED)
async def log_client_error(
    request: Request,
    error_data: dict,
    db: Session = Depends(get_db),
):
    """
    Log client-side errors from Kiro hooks.

    This endpoint receives error data from Kiro error intelligence hooks
    for centralized logging and monitoring.
    """
    correlation_id = get_correlation_id(request)

    try:
        # Enhance error data with server-side information
        enhanced_error = {
            "event": "kiro_client_error",
            "correlation_id": correlation_id,
            "timestamp": datetime.utcnow().isoformat(),
            "source": error_data.get("source", "kiro_hook"),
            "workflow_id": error_data.get("workflowId"),
            "error_type": error_data.get("errorType"),
            "stack_trace": error_data.get("stackTrace"),
            "client_timestamp": error_data.get("timestamp"),
        }

        # Log to structured logging system
        log_structured(
            event="kiro_client_error",
            correlation_id=correlation_id,
            level="error",
            **enhanced_error,
        )

        return {
            "message": "Client error logged successfully",
            "correlation_id": correlation_id,
        }

    except Exception as e:
        logger.error(f"Failed to log client error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to log client error",
        )


@router.get("/health")
async def logs_health_check():
    """Health check endpoint for log collection service."""
    return {
        "status": "healthy",
        "service": "frontend_log_collection",
        "timestamp": datetime.utcnow().isoformat(),
    }


class LogQueryRequest(BaseModel):
    """Log query request model."""

    level: Optional[str] = None
    component: Optional[str] = None
    action: Optional[str] = None
    correlationId: Optional[str] = None
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    limit: int = Field(default=100, le=1000)


@router.post("/query")
async def query_logs(
    request: Request,
    query: LogQueryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Query logs for debugging and monitoring purposes.

    This endpoint allows querying of processed logs with various filters.
    In a production environment, this would query a log storage system.
    """
    correlation_id = get_correlation_id(request)

    # For now, return a placeholder response
    # In a real implementation, this would query a log storage system like Elasticsearch
    log_structured(
        event="log_query_requested",
        correlation_id=correlation_id,
        user_id=str(current_user.id),
        query_params=query.dict(),
        level="info",
    )

    return {
        "message": "Log query functionality not yet implemented",
        "query": query.dict(),
        "correlation_id": correlation_id,
        "note": "This would query a log storage system in production",
    }


class LogMetricsResponse(BaseModel):
    """Log metrics response model."""

    total_logs: int
    logs_by_level: dict
    logs_by_component: dict
    error_rate: float
    top_errors: List[dict]


@router.get("/metrics", response_model=LogMetricsResponse)
async def get_log_metrics(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    hours: int = 24,
):
    """
    Get log metrics and analytics.

    This endpoint provides aggregated metrics about log entries for monitoring
    and alerting purposes.
    """
    correlation_id = get_correlation_id(request)

    log_structured(
        event="log_metrics_requested",
        correlation_id=correlation_id,
        user_id=str(current_user.id),
        hours=hours,
        level="info",
    )

    # Placeholder metrics - in production this would query actual log data
    return LogMetricsResponse(
        total_logs=0,
        logs_by_level={"info": 0, "warn": 0, "error": 0, "debug": 0},
        logs_by_component={},
        error_rate=0.0,
        top_errors=[],
    )
