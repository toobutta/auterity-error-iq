"""
Error Management API

Provides endpoints for error analytics, recovery management, and notifications.
"""

from datetime import datetime, timezone
import logging
import traceback
from typing import Any, Dict, List, Optional

from app.services.enhanced_recovery import get_enhanced_recovery_service
from app.services.error_analytics import get_error_analytics_service
from app.services.error_correlation import get_correlation_service
from app.services.notification_service import get_notification_service
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/error-management", tags=["Error Management"])


class ErrorMetricsResponse(BaseModel):
    """Response model for error metrics."""

    total_errors: int
    error_rate: float
    categories: Dict[str, int]
    severities: Dict[str, int]
    top_errors: List[Dict[str, Any]]
    trend: str
    period_start: datetime
    period_end: datetime


class ErrorInsightResponse(BaseModel):
    """Response model for error insights."""

    id: str
    title: str
    description: str
    category: str
    severity: str
    confidence: float
    affected_systems: List[str]
    recommended_actions: List[str]
    created_at: datetime


class RecoveryStatsResponse(BaseModel):
    """Response model for recovery statistics."""

    total_attempts: int
    successful_attempts: int
    success_rate: float
    average_duration_seconds: float
    strategy_performance: Dict[str, Dict[str, Any]]
    last_updated: str


def log_exception(message: str, exc: Exception) -> None:
    timestamp = datetime.now(timezone.utc).isoformat()
    tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    logger.error(f"{message} | {timestamp}\n{tb}")


@router.get("/metrics", response_model=ErrorMetricsResponse)
async def get_error_metrics(
    period_hours: int = Query(
        24, ge=1, le=168, description="Time period in hours (1-168)"
    )
):
    """Get error metrics for specified time period."""
    try:
        analytics_service = await get_error_analytics_service()
        metrics = await analytics_service.get_error_metrics(period_hours)

        return ErrorMetricsResponse(
            total_errors=metrics.total_errors,
            error_rate=metrics.error_rate,
            categories=metrics.categories,
            severities=metrics.severities,
            top_errors=metrics.top_errors,
            trend=metrics.trend.value,
            period_start=metrics.period_start,
            period_end=metrics.period_end,
        )

    except Exception as e:
        log_exception("Failed to get error metrics", e)
        raise HTTPException(status_code=500, detail="Failed to get error metrics")


@router.get("/insights", response_model=List[ErrorInsightResponse])
async def get_error_insights(
    limit: int = Query(
        10, ge=1, le=100, description="Maximum number of insights to return"
    )
):
    """Get recent error insights and recommendations."""
    try:
        analytics_service = await get_error_analytics_service()
        insights = await analytics_service.get_error_insights(limit)

        return [
            ErrorInsightResponse(
                id=insight.id,
                title=insight.title,
                description=insight.description,
                category=insight.category,
                severity=insight.severity,
                confidence=insight.confidence,
                affected_systems=insight.affected_systems,
                recommended_actions=insight.recommended_actions,
                created_at=insight.created_at,
            )
            for insight in insights
        ]

    except Exception as e:
        log_exception("Failed to get error insights", e)
        raise HTTPException(status_code=500, detail="Failed to get error insights")


@router.get("/dashboard")
async def get_error_dashboard():
    """Get comprehensive error dashboard data."""
    try:
        analytics_service = await get_error_analytics_service()
        dashboard_data = await analytics_service.get_error_dashboard_data()
        return dashboard_data

    except Exception as e:
        log_exception("Failed to get dashboard data", e)
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")


@router.get("/health-indicators")
async def get_health_indicators():
    """Get system health indicators based on error patterns."""
    try:
        analytics_service = await get_error_analytics_service()
        dashboard_data = await analytics_service.get_error_dashboard_data()
        return dashboard_data.get("health_indicators", {})

    except Exception as e:
        log_exception("Failed to get health indicators", e)
        raise HTTPException(status_code=500, detail="Failed to get health indicators")


@router.get("/recovery/stats", response_model=RecoveryStatsResponse)
async def get_recovery_stats():
    """Get recovery system statistics and performance metrics."""
    try:
        recovery_service = await get_enhanced_recovery_service()
        stats = await recovery_service.get_recovery_stats()

        if "error" in stats:
            raise HTTPException(status_code=500, detail=stats["error"])

        return RecoveryStatsResponse(
            total_attempts=stats.get("total_attempts", 0),
            successful_attempts=stats.get("successful_attempts", 0),
            success_rate=stats.get("success_rate", 0.0),
            average_duration_seconds=stats.get("average_duration_seconds", 0.0),
            strategy_performance=stats.get("strategy_performance", {}),
            last_updated=stats.get("last_updated", datetime.utcnow().isoformat()),
        )

    except HTTPException:
        raise
    except Exception as e:
        log_exception("Failed to get recovery stats", e)
        raise HTTPException(status_code=500, detail="Failed to get recovery stats")


@router.get("/correlations/status")
async def get_correlation_status():
    """Get error correlation status and statistics."""
    try:
        correlation_service = await get_correlation_service()
        status = await correlation_service.get_correlation_status()
        return status

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get correlation status: {str(e)}"
        )


@router.get("/notifications/recent")
async def get_recent_notifications(
    limit: int = Query(
        50, ge=1, le=200, description="Maximum number of notifications to return"
    )
):
    """Get recent error notifications."""
    try:
        notification_service = await get_notification_service()
        notifications = await notification_service.get_recent_notifications(limit)
        return {"notifications": notifications}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get recent notifications: {str(e)}"
        )


@router.get("/notifications/stats")
async def get_notification_stats():
    """Get notification system statistics."""
    try:
        notification_service = await get_notification_service()
        stats = await notification_service.get_notification_stats()
        return stats

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get notification stats: {str(e)}"
        )


@router.post("/recovery/trigger")
async def trigger_manual_recovery(
    error_code: str, context: Optional[Dict[str, Any]] = None
):
    """Manually trigger recovery for a specific error type."""
    try:
        # This would typically be used for testing or manual intervention
        recovery_service = await get_enhanced_recovery_service()

        # Create a mock error for recovery planning
        from app.exceptions import BaseAppException, ErrorCategory, ErrorSeverity

        mock_error = BaseAppException(
            message=f"Manual recovery trigger for {error_code}",
            code=error_code,
            category=ErrorCategory.SYSTEM,
            severity=ErrorSeverity.MEDIUM,
        )

        # Create and execute recovery plan
        plan = await recovery_service.create_recovery_plan(mock_error, context or {})
        attempts = await recovery_service.execute_recovery_plan(
            plan, mock_error, context or {}
        )

        return {
            "plan_id": plan.error_id,
            "strategies": [s.value for s in plan.strategies],
            "attempts": len(attempts),
            "success": any(a.outcome.value == "success" for a in attempts),
            "duration": sum(a.duration_seconds or 0 for a in attempts),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger recovery: {str(e)}"
        )


@router.get("/system-status")
async def get_system_status():
    """Get overall system status based on error patterns and recovery state."""
    try:
        # Get data from all services
        analytics_service = await get_error_analytics_service()
        recovery_service = await get_enhanced_recovery_service()
        correlation_service = await get_correlation_service()
        notification_service = await get_notification_service()

        # Get metrics
        dashboard_data = await analytics_service.get_error_dashboard_data()
        recovery_stats = await recovery_service.get_recovery_stats()
        correlation_status = await correlation_service.get_correlation_status()
        notification_stats = await notification_service.get_notification_stats()

        # Calculate overall system health
        health_indicators = dashboard_data.get("health_indicators", {})
        overall_status = health_indicators.get("overall_status", "unknown")

        # Determine if system is in recovery mode
        active_recoveries = recovery_stats.get("total_attempts", 0) > 0
        active_correlations = correlation_status.get("active_correlations", 0) > 0

        return {
            "overall_status": overall_status,
            "error_health": health_indicators,
            "recovery_active": active_recoveries,
            "correlations_active": active_correlations,
            "notification_health": {
                "success_rate": notification_stats.get("success_rate", 0),
                "total_notifications": notification_stats.get("total_notifications", 0),
            },
            "last_updated": datetime.utcnow().isoformat(),
            "components": {
                "error_analytics": "operational",
                "recovery_system": "operational",
                "correlation_engine": "operational",
                "notification_service": "operational",
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get system status: {str(e)}"
        )


@router.get("/export/error-report")
async def export_error_report(
    period_hours: int = Query(24, ge=1, le=168),
    format: str = Query("json", pattern="^(json|csv)$"),
):
    """Export comprehensive error report."""
    try:
        analytics_service = await get_error_analytics_service()

        # Get comprehensive data
        metrics = await analytics_service.get_error_metrics(period_hours)
        insights = await analytics_service.get_error_insights(50)
        dashboard_data = await analytics_service.get_error_dashboard_data()

        report_data = {
            "report_generated": datetime.utcnow().isoformat(),
            "period_hours": period_hours,
            "metrics": {
                "total_errors": metrics.total_errors,
                "error_rate": metrics.error_rate,
                "categories": metrics.categories,
                "severities": metrics.severities,
                "top_errors": metrics.top_errors,
                "trend": metrics.trend.value,
            },
            "insights": [
                {
                    "title": insight.title,
                    "description": insight.description,
                    "category": insight.category,
                    "severity": insight.severity,
                    "confidence": insight.confidence,
                    "recommended_actions": insight.recommended_actions,
                }
                for insight in insights
            ],
            "health_indicators": dashboard_data.get("health_indicators", {}),
        }

        if format == "json":
            return report_data
        else:
            # For CSV format, we'd convert to CSV here
            # This is a simplified implementation
            return {"message": "CSV export not implemented yet", "data": report_data}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export error report: {str(e)}"
        )
