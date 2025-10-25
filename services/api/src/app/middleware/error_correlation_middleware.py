"""
Middleware for automatic error correlation integration.
This middleware automatically aggregates errors to the correlation service.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..exceptions import BaseAppException
from ..utils.error_aggregator import get_error_aggregator

logger = logging.getLogger(__name__)


class ErrorCorrelationMiddleware(BaseHTTPMiddleware):
    """Middleware to automatically aggregate errors for correlation analysis."""

    def __init__(self, app, enable_aggregation: bool = True):
        super().__init__(app)
        self.enable_aggregation = enable_aggregation
        self.error_aggregator = get_error_aggregator()

    async def dispatch(self, request: Request, call_next):
        """Process request and aggregate any errors that occur."""

        # Extract request context
        request_id = request.headers.get(
            "x-request-id", f"req_{datetime.utcnow().timestamp()}"
        )
        user_id = getattr(request.state, "user_id", None)
        correlation_id = request.headers.get("x-correlation-id")

        try:
            # Process the request
            response = await call_next(request)
            return response

        except Exception as error:
            # Aggregate error if enabled
            if self.enable_aggregation:
                await self._aggregate_request_error(
                    error=error,
                    request=request,
                    request_id=request_id,
                    user_id=user_id,
                    correlation_id=correlation_id,
                )

            # Re-raise the error for normal error handling
            raise error

    async def _aggregate_request_error(
        self,
        error: Exception,
        request: Request,
        request_id: str,
        user_id: Optional[str],
        correlation_id: Optional[str],
    ):
        """Aggregate request error to correlation service."""

        try:
            # Extract error details
            if isinstance(error, BaseAppException):
                # Use structured error information
                await self.error_aggregator.aggregate_error(
                    error=error,
                    context={
                        "request_method": request.method,
                        "request_url": str(request.url),
                        "request_headers": dict(request.headers),
                        "client_ip": request.client.host
                        if request.client
                        else None,
                        "user_agent": request.headers.get("user-agent"),
                    },
                    correlation_id=correlation_id,
                    request_id=request_id,
                    user_id=user_id,
                )
            else:
                # Use raw error information
                await self.error_aggregator.aggregate_raw_error(
                    message=str(error),
                    code=self._get_error_code(error),
                    category="api",
                    severity=self._get_error_severity(error),
                    context={
                        "request_method": request.method,
                        "request_url": str(request.url),
                        "request_headers": dict(request.headers),
                        "client_ip": request.client.host
                        if request.client
                        else None,
                        "user_agent": request.headers.get("user-agent"),
                        "error_type": type(error).__name__,
                    },
                    stack_trace=self._get_stack_trace(error),
                    correlation_id=correlation_id,
                    request_id=request_id,
                    user_id=user_id,
                )

            logger.debug(f"Aggregated request error: {type(error).__name__}")

        except Exception as aggregation_error:
            # Don't let aggregation errors affect the main request
            logger.error(
                f"Failed to aggregate request error: {aggregation_error}"
            )

    def _get_error_code(self, error: Exception) -> str:
        """Get error code from exception."""
        if hasattr(error, "code"):
            return error.code

        error_type = type(error).__name__
        if error_type == "HTTPException":
            return f"HTTP_{getattr(error, 'status_code', 500)}"

        return f"API_{error_type.upper()}"

    def _get_error_severity(self, error: Exception) -> str:
        """Determine error severity."""
        error_message = str(error).lower()

        # Critical errors
        if (
            "timeout" in error_message
            or "connection" in error_message
            or "database" in error_message
        ):
            return "high"

        # Authentication/authorization errors
        if (
            "auth" in error_message
            or "permission" in error_message
            or "unauthorized" in error_message
        ):
            return "medium"

        # Validation errors
        if "validation" in error_message or "invalid" in error_message:
            return "low"

        # Default
        return "medium"

    def _get_stack_trace(self, error: Exception) -> Optional[str]:
        """Get stack trace from exception."""
        import traceback

        try:
            return "".join(
                traceback.format_exception(
                    type(error), error, error.__traceback__
                )
            )
        except Exception:
            return None


class WorkflowErrorCorrelationMixin:
    """Mixin for workflow services to automatically aggregate errors."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.error_aggregator = get_error_aggregator()

    async def _aggregate_workflow_error(
        self,
        error: Exception,
        workflow_id: str,
        execution_id: Optional[str] = None,
        step_name: Optional[str] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ):
        """Aggregate workflow error for correlation analysis."""

        try:
            await self.error_aggregator.aggregate_workflow_error(
                workflow_id=workflow_id,
                execution_id=execution_id
                or f"exec_{datetime.utcnow().timestamp()}",
                step_name=step_name,
                error=error,
                user_id=user_id,
                request_id=request_id,
            )
        except Exception as aggregation_error:
            logger.error(
                f"Failed to aggregate workflow error: {aggregation_error}"
            )


def auto_aggregate_workflow_errors(
    workflow_id_extractor: callable = None,
    execution_id_extractor: callable = None,
    step_name_extractor: callable = None,
):
    """
    Decorator to automatically aggregate workflow errors.

    Args:
        workflow_id_extractor: Function to extract workflow_id from function args
        execution_id_extractor: Function to extract execution_id from function args
        step_name_extractor: Function to extract step_name from function args
    """

    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as error:
                # Extract context
                workflow_id = "unknown"
                execution_id = None
                step_name = None

                if workflow_id_extractor:
                    try:
                        workflow_id = workflow_id_extractor(*args, **kwargs)
                    except Exception:
                        pass

                if execution_id_extractor:
                    try:
                        execution_id = execution_id_extractor(*args, **kwargs)
                    except Exception:
                        pass

                if step_name_extractor:
                    try:
                        step_name = step_name_extractor(*args, **kwargs)
                    except Exception:
                        pass

                # Aggregate error
                error_aggregator = get_error_aggregator()
                asyncio.create_task(
                    error_aggregator.aggregate_workflow_error(
                        workflow_id=workflow_id,
                        execution_id=execution_id
                        or f"exec_{datetime.utcnow().timestamp()}",
                        step_name=step_name,
                        error=error,
                    )
                )

                # Re-raise the original error
                raise error

        return wrapper

    return decorator


# Example usage in workflow service
class ExampleWorkflowService(WorkflowErrorCorrelationMixin):
    """Example workflow service with automatic error correlation."""

    @auto_aggregate_workflow_errors(
        workflow_id_extractor=lambda *args, **kwargs: kwargs.get(
            "workflow_id", args[0] if args else "unknown"
        ),
        execution_id_extractor=lambda *args, **kwargs: kwargs.get(
            "execution_id"
        ),
        step_name_extractor=lambda *args, **kwargs: kwargs.get("step_name"),
    )
    async def execute_workflow_step(
        self,
        workflow_id: str,
        execution_id: str,
        step_name: str,
        step_config: dict,
    ):
        """Execute a workflow step with automatic error aggregation."""

        try:
            # Simulate step execution
            if step_config.get("simulate_error"):
                raise Exception(f"Simulated error in step {step_name}")

            return {"status": "success", "result": "Step completed"}

        except Exception as error:
            # Error will be automatically aggregated by decorator
            logger.error(f"Step {step_name} failed: {error}")
            raise

    async def execute_workflow(self, workflow_id: str, workflow_config: dict):
        """Execute entire workflow with error correlation."""

        execution_id = f"exec_{datetime.utcnow().timestamp()}"

        try:
            results = []

            for step_config in workflow_config.get("steps", []):
                step_name = step_config.get("name", "unknown_step")

                try:
                    result = await self.execute_workflow_step(
                        workflow_id=workflow_id,
                        execution_id=execution_id,
                        step_name=step_name,
                        step_config=step_config,
                    )
                    results.append(result)

                except Exception as step_error:
                    # Step error already aggregated by decorator
                    # Aggregate workflow-level error as well
                    await self._aggregate_workflow_error(
                        error=step_error,
                        workflow_id=workflow_id,
                        execution_id=execution_id,
                        step_name=step_name,
                    )
                    raise

            return {"execution_id": execution_id, "results": results}

        except Exception as workflow_error:
            # Aggregate workflow-level error
            await self._aggregate_workflow_error(
                error=workflow_error,
                workflow_id=workflow_id,
                execution_id=execution_id,
            )
            raise
