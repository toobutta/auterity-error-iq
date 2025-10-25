"""Metrics endpoints for monitoring and observability."""

import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.monitoring.performance import performance_monitor

router = APIRouter()


@router.get("/health/ai-orchestration")
async def get_ai_orchestration_health() -> Dict[str, Any]:
    """
    Get comprehensive AI orchestration health status.

    Returns:
        Dictionary containing AI service health metrics
    """
    try:
        return performance_monitor.get_ai_metrics_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI health metrics: {str(e)}")


@router.get("/metrics/ai-services")
async def get_ai_service_metrics() -> Dict[str, Any]:
    """
    Get detailed AI service performance metrics.

    Returns:
        Dictionary containing detailed AI service metrics
    """
    try:
        summary = performance_monitor.get_ai_metrics_summary()
        step_summary = performance_monitor.get_step_metrics_summary()

        return {
            "ai_services": summary,
            "workflow_steps": step_summary,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI metrics: {str(e)}")


@router.get("/metrics/prometheus", response_class=PlainTextResponse)
async def get_prometheus_metrics() -> str:
    """
    Get Prometheus-compatible metrics for all services.

    Returns:
        Plain text response with Prometheus metrics format
    """
    try:
        return performance_monitor.get_prometheus_metrics()
    except Exception as e:
        # Return basic error metric for Prometheus
        return f"""# HELP auterity_metrics_error Error generating metrics
# TYPE auterity_metrics_error gauge
auterity_metrics_error 1
# HELP auterity_metrics_error_message Error message
# TYPE auterity_metrics_error_message gauge
auterity_metrics_error_message "{str(e)}"
"""


@router.get("/health/workflow-steps")
async def get_workflow_step_health() -> Dict[str, Any]:
    """
    Get workflow step execution health metrics.

    Returns:
        Dictionary containing workflow step health metrics
    """
    try:
        return performance_monitor.get_step_metrics_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow metrics: {str(e)}")


@router.get("/health/combined")
async def get_combined_health() -> Dict[str, Any]:
    """
    Get combined health status for AI orchestration and workflow execution.

    Returns:
        Dictionary containing combined health metrics
    """
    try:
        ai_summary = performance_monitor.get_ai_metrics_summary()
        step_summary = performance_monitor.get_step_metrics_summary()

        # Determine overall system health
        overall_health = "healthy"
        if ai_summary.get("overall_health") == "unhealthy":
            overall_health = "unhealthy"
        elif ai_summary.get("overall_health") == "degraded" or step_summary.get("total_step_types", 0) == 0:
            overall_health = "degraded"

        return {
            "overall_health": overall_health,
            "ai_orchestration": ai_summary,
            "workflow_execution": step_summary,
            "timestamp": time.time(),
            "status_message": f"System is {overall_health}"
        }
    except Exception as e:
        return {
            "overall_health": "unknown",
            "error": str(e),
            "timestamp": time.time(),
            "status_message": f"Health check failed: {str(e)}"
        }
