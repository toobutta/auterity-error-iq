"""
NeuroWeaver Error Aggregation Client
Sends errors to the cross-system correlation service
"""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiohttp

logger = logging.getLogger(__name__)


class NeuroWeaverErrorAggregator:
    """Error aggregation client specifically for NeuroWeaver system."""

    def __init__(self, correlation_service_url: str = "http://localhost:8000"):
        self.correlation_service_url = correlation_service_url.rstrip("/")
        self.logger = logger
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()

    @asynccontextmanager
    async def get_session(self):
        """Get or create HTTP session."""
        if self.session is None:
            self.session = aiohttp.ClientSession()
        try:
            yield self.session
        finally:
            pass  # Keep session open for reuse

    async def aggregate_error(self, error_data: Dict[str, Any]) -> bool:
        """
        Aggregate error to correlation service.

        Args:
            error_data: Error data dictionary

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Add timestamp if not present
            if "timestamp" not in error_data:
                error_data["timestamp"] = datetime.utcnow().isoformat()

            async with self.get_session() as session:
                url = (
                    f"{self.correlation_service_url}/api/v1/error-correlation/aggregate"
                )

                async with session.post(
                    url,
                    json=error_data,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as response:
                    if response.status == 200:
                        self.logger.debug(
                            f"Successfully aggregated error: {error_data.get('code')}"
                        )
                        return True
                    else:
                        error_text = await response.text()
                        self.logger.error(
                            f"Failed to aggregate error: {response.status} - {error_text}"
                        )
                        return False

        except asyncio.TimeoutError:
            self.logger.error("Timeout while aggregating error")
            return False
        except Exception as e:
            self.logger.error(f"Failed to aggregate error: {e}")
            return False

    async def aggregate_model_error(
        self,
        model_id: str,
        model_version: str,
        operation: str,
        error: Exception,
        training_job_id: Optional[str] = None,
        deployment_id: Optional[str] = None,
        performance_metrics: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a model-related error.

        Args:
            model_id: Model identifier
            model_version: Model version
            operation: Operation that failed
            error: The exception that occurred
            training_job_id: Optional training job ID
            deployment_id: Optional deployment ID
            performance_metrics: Optional performance metrics
            user_id: Optional user ID
            request_id: Optional request ID
            correlation_id: Optional correlation ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "MODEL_ERROR"),
                "category": "model",
                "severity": self._get_error_severity(error),
                "context": {
                    "model_id": model_id,
                    "model_version": model_version,
                    "operation": operation,
                    "training_job_id": training_job_id,
                    "deployment_id": deployment_id,
                    "performance_metrics": performance_metrics,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
                "correlation_id": correlation_id,
            }

            return await self.aggregate_error(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate model error: {e}")
            return False

    async def aggregate_training_error(
        self,
        training_job_id: str,
        model_id: str,
        error: Exception,
        epoch: Optional[int] = None,
        batch: Optional[int] = None,
        training_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a training-specific error.

        Args:
            training_job_id: Training job identifier
            model_id: Model being trained
            error: The exception that occurred
            epoch: Current epoch when error occurred
            batch: Current batch when error occurred
            training_config: Training configuration
            user_id: Optional user ID
            request_id: Optional request ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "TRAINING_ERROR"),
                "category": "training",
                "severity": self._get_error_severity(error),
                "context": {
                    "training_job_id": training_job_id,
                    "model_id": model_id,
                    "epoch": epoch,
                    "batch": batch,
                    "training_config": training_config,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
            }

            return await self.aggregate_error(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate training error: {e}")
            return False

    async def aggregate_inference_error(
        self,
        model_id: str,
        model_version: str,
        error: Exception,
        input_data: Optional[Dict[str, Any]] = None,
        deployment_id: Optional[str] = None,
        latency: Optional[float] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate an inference-specific error.

        Args:
            model_id: Model identifier
            model_version: Model version
            error: The exception that occurred
            input_data: Input data that caused the error (sanitized)
            deployment_id: Deployment identifier
            latency: Request latency before error
            user_id: Optional user ID
            request_id: Optional request ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            # Sanitize input data to remove sensitive information
            sanitized_input = (
                self._sanitize_input_data(input_data) if input_data else None
            )

            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "INFERENCE_ERROR"),
                "category": "inference",
                "severity": self._get_error_severity(error),
                "context": {
                    "model_id": model_id,
                    "model_version": model_version,
                    "deployment_id": deployment_id,
                    "input_data_summary": sanitized_input,
                    "latency": latency,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
            }

            return await self.aggregate_error(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate inference error: {e}")
            return False

    async def aggregate_deployment_error(
        self,
        deployment_id: str,
        model_id: str,
        model_version: str,
        error: Exception,
        deployment_config: Optional[Dict[str, Any]] = None,
        resource_requirements: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a deployment-specific error.

        Args:
            deployment_id: Deployment identifier
            model_id: Model being deployed
            model_version: Model version being deployed
            error: The exception that occurred
            deployment_config: Deployment configuration
            resource_requirements: Resource requirements
            user_id: Optional user ID
            request_id: Optional request ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "DEPLOYMENT_ERROR"),
                "category": "deployment",
                "severity": self._get_error_severity(error),
                "context": {
                    "deployment_id": deployment_id,
                    "model_id": model_id,
                    "model_version": model_version,
                    "deployment_config": deployment_config,
                    "resource_requirements": resource_requirements,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
            }

            return await self.aggregate_error(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate deployment error: {e}")
            return False

    async def aggregate_performance_degradation(
        self,
        model_id: str,
        model_version: str,
        current_metrics: Dict[str, float],
        baseline_metrics: Dict[str, float],
        threshold_violations: List[str],
        deployment_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a performance degradation event.

        Args:
            model_id: Model identifier
            model_version: Model version
            current_metrics: Current performance metrics
            baseline_metrics: Baseline performance metrics
            threshold_violations: List of violated thresholds
            deployment_id: Optional deployment ID
            user_id: Optional user ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            # Calculate degradation percentages
            degradation_summary = {}
            for metric, current_value in current_metrics.items():
                if metric in baseline_metrics:
                    baseline_value = baseline_metrics[metric]
                    if baseline_value > 0:
                        degradation_pct = (
                            (current_value - baseline_value) / baseline_value
                        ) * 100
                        degradation_summary[metric] = degradation_pct

            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Performance degradation detected for model {model_id}",
                "code": "PERFORMANCE_DEGRADATION",
                "category": "performance",
                "severity": "high" if len(threshold_violations) > 2 else "medium",
                "context": {
                    "model_id": model_id,
                    "model_version": model_version,
                    "deployment_id": deployment_id,
                    "current_metrics": current_metrics,
                    "baseline_metrics": baseline_metrics,
                    "degradation_summary": degradation_summary,
                    "threshold_violations": threshold_violations,
                    "violation_count": len(threshold_violations),
                },
                "user_id": user_id,
            }

            return await self.aggregate_error(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate performance degradation: {e}")
            return False

    async def aggregate_batch_errors(self, errors: List[Dict[str, Any]]) -> bool:
        """
        Aggregate multiple errors in batch.

        Args:
            errors: List of error data dictionaries

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            # Add timestamps to errors that don't have them
            processed_errors = []
            for error in errors:
                if "timestamp" not in error:
                    error["timestamp"] = datetime.utcnow().isoformat()
                processed_errors.append(error)

            async with self.get_session() as session:
                url = f"{self.correlation_service_url}/api/v1/error-correlation/aggregate/batch"

                async with session.post(
                    url,
                    json=processed_errors,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status == 200:
                        self.logger.info(
                            f"Successfully aggregated batch of {len(errors)} errors"
                        )
                        return True
                    else:
                        error_text = await response.text()
                        self.logger.error(
                            f"Failed to aggregate batch errors: {response.status} - {error_text}"
                        )
                        return False

        except asyncio.TimeoutError:
            self.logger.error("Timeout while aggregating batch errors")
            return False
        except Exception as e:
            self.logger.error(f"Failed to aggregate batch errors: {e}")
            return False

    def _get_error_severity(self, error: Exception) -> str:
        """Determine error severity based on error type and message."""
        error_message = str(error).lower()
        error_type = type(error).__name__.lower()

        # Critical errors
        if (
            "memory" in error_message
            or "oom" in error_message
            or "cuda" in error_message
            or "gpu" in error_message
            or "timeout" in error_message
            or "connection" in error_message
        ):
            return "critical"

        # High severity errors
        if (
            "training" in error_type
            or "deployment" in error_type
            or "model" in error_message
            or "inference" in error_message
        ):
            return "high"

        # Medium severity (default)
        return "medium"

    def _get_stack_trace(self, error: Exception) -> Optional[str]:
        """Get stack trace from exception."""
        import traceback

        try:
            return "".join(
                traceback.format_exception(type(error), error, error.__traceback__)
            )
        except Exception:
            return None

    def _sanitize_input_data(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize input data to remove sensitive information."""
        sanitized = {}

        for key, value in input_data.items():
            if isinstance(value, str):
                # Truncate long strings and mask potential sensitive data
                if len(value) > 100:
                    sanitized[key] = f"{value[:50]}...{value[-50:]} (truncated)"
                elif any(
                    sensitive in key.lower()
                    for sensitive in ["password", "token", "key", "secret"]
                ):
                    sanitized[key] = "[REDACTED]"
                else:
                    sanitized[key] = value
            elif isinstance(value, (list, tuple)):
                sanitized[key] = f"[{type(value).__name__} with {len(value)} items]"
            elif isinstance(value, dict):
                sanitized[key] = f"[dict with {len(value)} keys]"
            else:
                sanitized[key] = str(type(value).__name__)

        return sanitized

    async def close(self):
        """Close the HTTP session."""
        if self.session:
            await self.session.close()
            self.session = None


# Global aggregator instance
_error_aggregator: Optional[NeuroWeaverErrorAggregator] = None


def get_error_aggregator() -> NeuroWeaverErrorAggregator:
    """Get or create global error aggregator instance."""
    global _error_aggregator

    if _error_aggregator is None:
        _error_aggregator = NeuroWeaverErrorAggregator()

    return _error_aggregator


# Convenience functions
async def aggregate_model_error(
    model_id: str, model_version: str, operation: str, error: Exception, **kwargs
) -> bool:
    """Convenience function for model errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_model_error(
        model_id=model_id,
        model_version=model_version,
        operation=operation,
        error=error,
        **kwargs,
    )


async def aggregate_training_error(
    training_job_id: str, model_id: str, error: Exception, **kwargs
) -> bool:
    """Convenience function for training errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_training_error(
        training_job_id=training_job_id, model_id=model_id, error=error, **kwargs
    )


async def aggregate_inference_error(
    model_id: str, model_version: str, error: Exception, **kwargs
) -> bool:
    """Convenience function for inference errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_inference_error(
        model_id=model_id, model_version=model_version, error=error, **kwargs
    )


# Decorator for automatic error aggregation
def auto_aggregate_errors(operation: str, context_extractor: Optional[callable] = None):
    """
    Decorator to automatically aggregate errors from function calls.

    Args:
        operation: Operation name for context
        context_extractor: Function to extract context from function args
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as error:
                # Extract context if extractor provided
                context = {}
                if context_extractor:
                    try:
                        context = context_extractor(*args, **kwargs)
                    except Exception:
                        pass

                # Aggregate error
                aggregator = get_error_aggregator()
                await aggregator.aggregate_model_error(
                    model_id=context.get("model_id", "unknown"),
                    model_version=context.get("model_version", "unknown"),
                    operation=operation,
                    error=error,
                    training_job_id=context.get("training_job_id"),
                    deployment_id=context.get("deployment_id"),
                    performance_metrics=context.get("performance_metrics"),
                    user_id=context.get("user_id"),
                    request_id=context.get("request_id"),
                )

                # Re-raise the original error
                raise error

        return wrapper

    return decorator
