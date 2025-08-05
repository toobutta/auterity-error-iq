"""
API endpoints for cross-system error correlation and handling.
"""

import json
import logging
from datetime import datetime
from typing import Any
from typing import Dict
from typing import List
from typing import Optional

from fastapi import APIRouter
from fastapi import BackgroundTasks
from fastapi import Depends
from fastapi import HTTPException

from ..auth import get_current_user
from ..models.user import User
from ..services.error_correlation import CorrelationPattern
from ..services.error_correlation import ErrorCorrelation
from ..services.error_correlation import ErrorCorrelationService
from ..services.error_correlation import get_correlation_service

router = APIRouter(prefix="/api/v1/error-correlation", tags=["error-correlation"])
logger = logging.getLogger(__name__)


@router.post("/aggregate")
async def aggregate_error(
    error_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Aggregate error from any system for correlation analysis.

    This endpoint accepts errors from AutoMatrix, RelayCore, and NeuroWeaver
    and processes them for cross-system correlation.
    """
    try:
        # Add user context if not present
        if "user_id" not in error_data and current_user:
            error_data["user_id"] = str(current_user.id)

        # Add timestamp if not present
        if "timestamp" not in error_data:
            error_data["timestamp"] = datetime.utcnow().isoformat()

        # Aggregate error in background
        background_tasks.add_task(correlation_service.aggregate_error, error_data)

        return {
            "status": "accepted",
            "message": "Error submitted for correlation analysis",
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to aggregate error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error aggregation failed: {str(e)}"
        )


@router.post("/aggregate/batch")
async def aggregate_errors_batch(
    errors: List[Dict[str, Any]],
    background_tasks: BackgroundTasks,
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Aggregate multiple errors in batch for correlation analysis.
    """
    try:
        # Process each error
        for error_data in errors:
            # Add user context if not present
            if "user_id" not in error_data and current_user:
                error_data["user_id"] = str(current_user.id)

            # Add timestamp if not present
            if "timestamp" not in error_data:
                error_data["timestamp"] = datetime.utcnow().isoformat()

            # Aggregate error in background
            background_tasks.add_task(correlation_service.aggregate_error, error_data)

        return {
            "status": "accepted",
            "message": (
                f"Batch of {len(errors)} errors submitted " "for correlation analysis"
            ),
            "count": len(errors),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to aggregate error batch: {e}")
        raise HTTPException(
            status_code=500, detail=f"Batch error aggregation failed: {str(e)}"
        )


@router.get("/status")
async def get_correlation_status(
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Get current error correlation status and statistics.
    """
    try:
        status = await correlation_service.get_correlation_status()
        return status

    except Exception as e:
        logger.error(f"Failed to get correlation status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/correlations")
async def get_recent_correlations(
    limit: int = 50,
    pattern: Optional[str] = None,
    system: Optional[str] = None,
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Get recent error correlations with optional filtering.
    """
    try:
        # This would be implemented to fetch correlations from Redis
        # with filtering by pattern and system
        correlations = await correlation_service._get_recent_correlations(
            limit=limit, pattern=pattern, system=system
        )

        return {
            "correlations": correlations,
            "count": len(correlations),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get correlations: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get correlations: {str(e)}"
        )


@router.get("/alerts")
async def get_correlation_alerts(
    limit: int = 20,
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Get recent correlation alerts.
    """
    try:
        alerts = await correlation_service._get_correlation_alerts(limit=limit)

        return {
            "alerts": alerts,
            "count": len(alerts),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.get("/recovery-actions")
async def get_recovery_actions(
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Get available recovery actions and their status.
    """
    try:
        actions = correlation_service.recovery_actions

        # Convert to API response format
        action_list = []
        for action_id, action in actions.items():
            action_list.append(
                {
                    "id": action.id,
                    "name": action.name,
                    "description": action.description,
                    "applicable_patterns": action.applicable_patterns,
                    "applicable_categories": action.applicable_categories,
                    "action_type": action.action_type,
                    "retry_count": action.retry_count,
                    "retry_delay": action.retry_delay,
                    "timeout": action.timeout,
                }
            )

        return {
            "recovery_actions": action_list,
            "count": len(action_list),
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to get recovery actions: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get recovery actions: {str(e)}"
        )


@router.post("/test-correlation")
async def test_correlation_detection(
    test_errors: List[Dict[str, Any]],
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Test correlation detection with sample errors (for development/testing).
    """
    try:
        correlations_found = []

        # Process test errors
        for error_data in test_errors:
            # Add timestamp if not present
            if "timestamp" not in error_data:
                error_data["timestamp"] = datetime.utcnow().isoformat()

            # Aggregate error and check for correlations
            system_error = await correlation_service.aggregate_error(error_data)

            # Get recent errors for correlation analysis
            recent_errors = await correlation_service._get_recent_errors()

            # Analyze correlations
            correlations = await correlation_service._analyze_correlations(
                system_error, recent_errors
            )
            correlations_found.extend(correlations)

        return {
            "test_results": {
                "errors_processed": len(test_errors),
                "correlations_found": len(correlations_found),
                "correlations": [
                    {
                        "id": c.id,
                        "pattern": c.pattern.value,
                        "root_cause": c.root_cause,
                        "affected_systems": list(c.affected_systems),
                        "confidence": c.confidence,
                        "error_count": len(c.error_ids),
                    }
                    for c in correlations_found
                ],
            },
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Failed to test correlation: {e}")
        raise HTTPException(
            status_code=500, detail=f"Correlation test failed: {str(e)}"
        )


@router.post("/manual-recovery/{correlation_id}")
async def trigger_manual_recovery(
    correlation_id: str,
    recovery_action: str,
    background_tasks: BackgroundTasks,
    correlation_service: ErrorCorrelationService = Depends(get_correlation_service),
    current_user: User = Depends(get_current_user),
):
    """
    Manually trigger a recovery action for a specific correlation.
    """
    try:
        # Get correlation data
        correlation_key = f"correlation:{correlation_id}"
        correlation_data = await correlation_service.redis.get(correlation_key)

        if not correlation_data:
            raise HTTPException(status_code=404, detail="Correlation not found")

        # Get recovery action
        action = correlation_service._get_recovery_action(recovery_action)
        if not action:
            raise HTTPException(status_code=404, detail="Recovery action not found")

        # Parse correlation data
        correlation_dict = json.loads(correlation_data)

        # Create correlation object for recovery
        correlation = ErrorCorrelation(
            id=correlation_dict["id"],
            pattern=CorrelationPattern(correlation_dict["pattern"]),
            root_cause=correlation_dict["root_cause"],
            affected_systems=set(correlation_dict["affected_systems"]),
            error_ids=correlation_dict["error_ids"],
            confidence=correlation_dict["confidence"],
            created_at=datetime.fromisoformat(correlation_dict["created_at"]),
        )

        # Execute recovery action in background
        background_tasks.add_task(
            correlation_service._execute_recovery_action, action, correlation
        )

        return {
            "status": "accepted",
            "message": (
                f"Recovery action '{recovery_action}' triggered "
                f"for correlation {correlation_id}"
            ),
            "correlation_id": correlation_id,
            "recovery_action": recovery_action,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger manual recovery: {e}")
        raise HTTPException(status_code=500, detail=f"Manual recovery failed: {str(e)}")


# Add helper methods to ErrorCorrelationService for API endpoints
async def _get_recent_correlations(
    self, limit: int = 50, pattern: Optional[str] = None, system: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Get recent correlations with filtering."""
    try:
        correlation_keys = await self.redis.keys("correlation:*")
        correlations = []

        for key in correlation_keys[:limit]:
            data = await self.redis.get(key)
            if data:
                correlation_data = json.loads(data)

                # Apply filters
                if pattern and correlation_data.get("pattern") != pattern:
                    continue

                if system and system not in correlation_data.get(
                    "affected_systems", []
                ):
                    continue

                correlations.append(correlation_data)

        # Sort by creation time (newest first)
        correlations.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return correlations[:limit]

    except Exception as e:
        self.logger.error(f"Failed to get recent correlations: {e}")
        return []


async def _get_correlation_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
    """Get recent correlation alerts."""
    try:
        alerts = await self.redis.lrange("alerts:correlations", 0, limit - 1)
        return [json.loads(alert) for alert in alerts]

    except Exception as e:
        self.logger.error(f"Failed to get correlation alerts: {e}")
        return []


# Monkey patch the methods to ErrorCorrelationService
ErrorCorrelationService._get_recent_correlations = _get_recent_correlations
ErrorCorrelationService._get_correlation_alerts = _get_correlation_alerts
