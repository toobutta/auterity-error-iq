"""Structured logging middleware with correlation ID tracking."""

import json
import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure structured logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured logging with correlation ID tracking."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())

        # Add correlation ID to request state
        request.state.correlation_id = correlation_id

        # Start timing
        start_time = time.time()

        # Log request
        request_log = {
            "event": "request_started",
            "correlation_id": correlation_id,
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "user_agent": request.headers.get("user-agent"),
            "client_ip": request.client.host if request.client else None,
            "timestamp": time.time(),
        }

        logger.info(json.dumps(request_log))

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Log response
            response_log = {
                "event": "request_completed",
                "correlation_id": correlation_id,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "timestamp": time.time(),
            }

            logger.info(json.dumps(response_log))

            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id

            return response

        except Exception as e:
            # Calculate duration
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Log error
            error_log = {
                "event": "request_error",
                "correlation_id": correlation_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "duration_ms": duration_ms,
                "timestamp": time.time(),
            }

            logger.error(json.dumps(error_log))

            # Re-raise the exception
            raise


def get_correlation_id(request: Request) -> str:
    """Get correlation ID from request state."""
    return getattr(request.state, "correlation_id", "unknown")


def log_structured(
    event: str, correlation_id: str = None, level: str = "info", **kwargs
):
    """Log structured data with correlation ID."""
    log_data = {
        "event": event,
        "correlation_id": correlation_id or "unknown",
        "timestamp": time.time(),
        **kwargs,
    }

    log_message = json.dumps(log_data)

    if level == "debug":
        logger.debug(log_message)
    elif level == "info":
        logger.info(log_message)
    elif level == "warning":
        logger.warning(log_message)
    elif level == "error":
        logger.error(log_message)
    elif level == "critical":
        logger.critical(log_message)
    else:
        logger.info(log_message)


class WorkflowExecutionLogger:
    """Specialized logger for workflow execution events."""

    def __init__(self, correlation_id: str, workflow_id: str, execution_id: str):
        self.correlation_id = correlation_id
        self.workflow_id = workflow_id
        self.execution_id = execution_id

    def log_step_start(self, step_name: str, step_type: str, input_data: dict = None):
        """Log workflow step start."""
        log_structured(
            event="workflow_step_started",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            step_name=step_name,
            step_type=step_type,
            input_data=input_data,
        )

    def log_step_complete(
        self,
        step_name: str,
        step_type: str,
        output_data: dict = None,
        duration_ms: float = None,
    ):
        """Log workflow step completion."""
        log_structured(
            event="workflow_step_completed",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            step_name=step_name,
            step_type=step_type,
            output_data=output_data,
            duration_ms=duration_ms,
        )

    def log_step_error(
        self, step_name: str, step_type: str, error: str, duration_ms: float = None
    ):
        """Log workflow step error."""
        log_structured(
            event="workflow_step_error",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            step_name=step_name,
            step_type=step_type,
            error=error,
            duration_ms=duration_ms,
            level="error",
        )

    def log_execution_start(self, input_data: dict = None):
        """Log workflow execution start."""
        log_structured(
            event="workflow_execution_started",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            input_data=input_data,
        )

    def log_execution_complete(
        self, output_data: dict = None, duration_ms: float = None
    ):
        """Log workflow execution completion."""
        log_structured(
            event="workflow_execution_completed",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            output_data=output_data,
            duration_ms=duration_ms,
        )

    def log_execution_error(self, error: str, duration_ms: float = None):
        """Log workflow execution error."""
        log_structured(
            event="workflow_execution_error",
            correlation_id=self.correlation_id,
            workflow_id=self.workflow_id,
            execution_id=self.execution_id,
            error=error,
            duration_ms=duration_ms,
            level="error",
        )
