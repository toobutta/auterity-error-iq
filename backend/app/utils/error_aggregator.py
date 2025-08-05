"""
Error aggregation utility for sending errors to correlation service.
This utility is used by all systems to report errors for correlation analysis.
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, Optional

import aiohttp

from ..exceptions import BaseAppException


class ErrorAggregator:
    """Utility class for aggregating errors to correlation service."""

    def __init__(self, correlation_service_url: str = "http://localhost:8000"):
        self.correlation_service_url = correlation_service_url.rstrip("/")
        self.logger = logging.getLogger(__name__)
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

    async def aggregate_error(
        self,
        error: BaseAppException,
        context: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a structured error to the correlation service.

        Args:
            error: The BaseAppException to aggregate
            context: Additional context information
            correlation_id: Optional correlation ID for tracking
            request_id: Optional request ID for tracking
            user_id: Optional user ID for tracking

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": error.message,
                "code": error.code,
                "category": error.category.value,
                "severity": error.severity.value,
                "details": error.details,
                "retryable": error.retryable,
                "user_message": error.user_message,
                "context": context or {},
                "correlation_id": correlation_id,
                "request_id": request_id,
                "user_id": user_id,
            }

            return await self._send_error_data(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate structured error: {e}")
            return False

    async def aggregate_raw_error(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        category: str = "system",
        severity: str = "medium",
        context: Optional[Dict[str, Any]] = None,
        stack_trace: Optional[str] = None,
        correlation_id: Optional[str] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a raw error to the correlation service.

        Args:
            message: Error message
            code: Error code
            category: Error category
            severity: Error severity
            context: Additional context information
            stack_trace: Optional stack trace
            correlation_id: Optional correlation ID for tracking
            request_id: Optional request ID for tracking
            user_id: Optional user ID for tracking

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": message,
                "code": code,
                "category": category,
                "severity": severity,
                "context": context or {},
                "stack_trace": stack_trace,
                "correlation_id": correlation_id,
                "request_id": request_id,
                "user_id": user_id,
            }

            return await self._send_error_data(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate raw error: {e}")
            return False

    async def aggregate_workflow_error(
        self,
        workflow_id: str,
        execution_id: str,
        step_name: Optional[str],
        error: Exception,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate a workflow-specific error.

        Args:
            workflow_id: ID of the workflow
            execution_id: ID of the execution
            step_name: Name of the failed step
            error: The exception that occurred
            user_id: Optional user ID
            request_id: Optional request ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "WORKFLOW_ERROR"),
                "category": "workflow",
                "severity": "high",
                "context": {
                    "workflow_id": workflow_id,
                    "execution_id": execution_id,
                    "step_name": step_name,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
            }

            return await self._send_error_data(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate workflow error: {e}")
            return False

    async def aggregate_ai_service_error(
        self,
        provider: str,
        model_id: str,
        request_type: str,
        error: Exception,
        cost: Optional[float] = None,
        latency: Optional[float] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> bool:
        """
        Aggregate an AI service error (for RelayCore).

        Args:
            provider: AI provider name
            model_id: Model identifier
            request_type: Type of AI request
            error: The exception that occurred
            cost: Optional cost of the request
            latency: Optional latency of the request
            user_id: Optional user ID
            request_id: Optional request ID

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "AI_SERVICE_ERROR"),
                "category": "ai_service",
                "severity": "medium",
                "context": {
                    "provider": provider,
                    "model_id": model_id,
                    "request_type": request_type,
                    "cost": cost,
                    "latency": latency,
                    "error_type": type(error).__name__,
                },
                "stack_trace": self._get_stack_trace(error),
                "user_id": user_id,
                "request_id": request_id,
            }

            return await self._send_error_data(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate AI service error: {e}")
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
    ) -> bool:
        """
        Aggregate a model-related error (for NeuroWeaver).

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

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            error_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "message": str(error),
                "code": getattr(error, "code", "MODEL_ERROR"),
                "category": "model",
                "severity": "medium",
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
            }

            return await self._send_error_data(error_data)

        except Exception as e:
            self.logger.error(f"Failed to aggregate model error: {e}")
            return False

    async def aggregate_batch_errors(self, errors: list[Dict[str, Any]]) -> bool:
        """
        Aggregate multiple errors in batch.

        Args:
            errors: List of error data dictionaries

        Returns:
            bool: True if aggregation was successful, False otherwise
        """
        try:
            async with self.get_session() as session:
                url = f"{self.correlation_service_url}/api/v1/error-correlation/aggregate/batch"

                async with session.post(
                    url,
                    json=errors,
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

    async def _send_error_data(self, error_data: Dict[str, Any]) -> bool:
        """
        Send error data to correlation service.

        Args:
            error_data: Error data dictionary

        Returns:
            bool: True if successful, False otherwise
        """
        try:
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
            self.logger.error(f"Failed to send error data: {e}")
            return False

    def _get_stack_trace(self, error: Exception) -> Optional[str]:
        """Get stack trace from exception."""
        import traceback

        try:
            return "".join(
                traceback.format_exception(type(error), error, error.__traceback__)
            )
        except Exception:
            return None

    async def close(self):
        """Close the HTTP session."""
        if self.session:
            await self.session.close()
            self.session = None


# Global aggregator instance
_error_aggregator: Optional[ErrorAggregator] = None


def get_error_aggregator() -> ErrorAggregator:
    """Get or create global error aggregator instance."""
    global _error_aggregator

    if _error_aggregator is None:
        _error_aggregator = ErrorAggregator()

    return _error_aggregator


# Convenience functions for different systems
async def aggregate_autmatrix_error(
    workflow_id: str,
    execution_id: str,
    step_name: Optional[str],
    error: Exception,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None,
) -> bool:
    """Convenience function for AutoMatrix errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_workflow_error(
        workflow_id=workflow_id,
        execution_id=execution_id,
        step_name=step_name,
        error=error,
        user_id=user_id,
        request_id=request_id,
    )


async def aggregate_relaycore_error(
    provider: str,
    model_id: str,
    request_type: str,
    error: Exception,
    cost: Optional[float] = None,
    latency: Optional[float] = None,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None,
) -> bool:
    """Convenience function for RelayCore errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_ai_service_error(
        provider=provider,
        model_id=model_id,
        request_type=request_type,
        error=error,
        cost=cost,
        latency=latency,
        user_id=user_id,
        request_id=request_id,
    )


async def aggregate_neuroweaver_error(
    model_id: str,
    model_version: str,
    operation: str,
    error: Exception,
    training_job_id: Optional[str] = None,
    deployment_id: Optional[str] = None,
    performance_metrics: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None,
) -> bool:
    """Convenience function for NeuroWeaver errors."""
    aggregator = get_error_aggregator()
    return await aggregator.aggregate_model_error(
        model_id=model_id,
        model_version=model_version,
        operation=operation,
        error=error,
        training_job_id=training_job_id,
        deployment_id=deployment_id,
        performance_metrics=performance_metrics,
        user_id=user_id,
        request_id=request_id,
    )


# Decorator for automatic error aggregation
def auto_aggregate_errors(
    system: str = "autmatrix", context_extractor: Optional[callable] = None
):
    """
    Decorator to automatically aggregate errors from function calls.

    Args:
        system: System name (autmatrix, relaycore, neuroweaver)
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

                # Aggregate error based on system
                aggregator = get_error_aggregator()
                if system == "autmatrix":
                    await aggregator.aggregate_workflow_error(
                        workflow_id=context.get("workflow_id", "unknown"),
                        execution_id=context.get("execution_id", "unknown"),
                        step_name=context.get("step_name"),
                        error=error,
                        user_id=context.get("user_id"),
                        request_id=context.get("request_id"),
                    )
                elif system == "relaycore":
                    await aggregator.aggregate_ai_service_error(
                        provider=context.get("provider", "unknown"),
                        model_id=context.get("model_id", "unknown"),
                        request_type=context.get("request_type", "unknown"),
                        error=error,
                        cost=context.get("cost"),
                        latency=context.get("latency"),
                        user_id=context.get("user_id"),
                        request_id=context.get("request_id"),
                    )
                elif system == "neuroweaver":
                    await aggregator.aggregate_model_error(
                        model_id=context.get("model_id", "unknown"),
                        model_version=context.get("model_version", "unknown"),
                        operation=context.get("operation", "unknown"),
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
