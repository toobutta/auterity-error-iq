"""Global error handling middleware for FastAPI."""

import json
import logging
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware

from app.exceptions import BaseAppException, DatabaseError, SystemError
from app.exceptions import ValidationError as AppValidationError

logger = logging.getLogger(__name__)


class GlobalErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware that catches and processes all exceptions."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            return await self._handle_exception(request, exc)

    async def _handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle different types of exceptions and return appropriate responses."""
        correlation_id = getattr(request.state, "correlation_id", None)

        # Log the exception with context
        self._log_exception(exc, request, correlation_id)

        # Handle different exception types
        if isinstance(exc, BaseAppException):
            return self._handle_app_exception(exc, correlation_id)
        elif isinstance(exc, ValidationError):
            return self._handle_pydantic_validation_error(exc, correlation_id)
        elif isinstance(exc, SQLAlchemyError):
            return self._handle_database_error(exc, correlation_id)
        else:
            return self._handle_unexpected_error(exc, correlation_id)

    def _log_exception(self, exc: Exception, request: Request, correlation_id: str):
        """Log exception with structured information."""
        error_log = {
            "event": "exception_occurred",
            "correlation_id": correlation_id,
            "exception_type": type(exc).__name__,
            "exception_message": str(exc),
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }

        # Add exception-specific details
        if isinstance(exc, BaseAppException):
            error_log.update(
                {
                    "error_code": exc.code,
                    "error_category": exc.category.value,
                    "error_severity": exc.severity.value,
                    "error_details": exc.details,
                    "retryable": exc.retryable,
                }
            )

        # Log at appropriate level based on severity
        if isinstance(exc, BaseAppException):
            if exc.severity.value in ["critical", "high"]:
                logger.error(json.dumps(error_log), exc_info=True)
            else:
                logger.warning(json.dumps(error_log))
        else:
            logger.error(json.dumps(error_log), exc_info=True)

    def _handle_app_exception(
        self, exc: BaseAppException, correlation_id: str
    ) -> JSONResponse:
        """Handle application-specific exceptions."""
        status_code = self._get_status_code_for_category(exc.category.value)

        error_response = exc.to_dict()
        error_response["correlation_id"] = correlation_id

        return JSONResponse(
            status_code=status_code,
            content=error_response,
            headers={"X-Correlation-ID": correlation_id} if correlation_id else {},
        )

    def _handle_pydantic_validation_error(
        self, exc: ValidationError, correlation_id: str
    ) -> JSONResponse:
        """Handle Pydantic validation errors."""
        validation_error = AppValidationError(
            message="Request validation failed",
            details={
                "validation_errors": [
                    {
                        "field": ".".join(str(loc) for loc in error["loc"]),
                        "message": error["msg"],
                        "type": error["type"],
                    }
                    for error in exc.errors()
                ]
            },
        )

        error_response = validation_error.to_dict()
        error_response["correlation_id"] = correlation_id

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response,
            headers={"X-Correlation-ID": correlation_id} if correlation_id else {},
        )

    def _handle_database_error(
        self, exc: SQLAlchemyError, correlation_id: str
    ) -> JSONResponse:
        """Handle database errors."""
        db_error = DatabaseError(
            message="Database operation failed", details={"original_error": str(exc)}
        )

        error_response = db_error.to_dict()
        error_response["correlation_id"] = correlation_id

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response,
            headers={"X-Correlation-ID": correlation_id} if correlation_id else {},
        )

    def _handle_unexpected_error(
        self, exc: Exception, correlation_id: str
    ) -> JSONResponse:
        """Handle unexpected errors."""
        system_error = SystemError(
            message="An unexpected error occurred",
            details={
                "original_error": str(exc),
                "error_type": type(exc).__name__,
            },
        )

        error_response = system_error.to_dict()
        error_response["correlation_id"] = correlation_id

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response,
            headers={"X-Correlation-ID": correlation_id} if correlation_id else {},
        )

    def _get_status_code_for_category(self, category: str) -> int:
        """Map error categories to HTTP status codes."""
        category_status_map = {
            "authentication": status.HTTP_401_UNAUTHORIZED,
            "authorization": status.HTTP_403_FORBIDDEN,
            "validation": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "workflow": status.HTTP_400_BAD_REQUEST,
            "ai_service": status.HTTP_503_SERVICE_UNAVAILABLE,
            "database": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "external_api": status.HTTP_503_SERVICE_UNAVAILABLE,
            "system": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "business_logic": status.HTTP_400_BAD_REQUEST,
        }

        return category_status_map.get(category, status.HTTP_500_INTERNAL_SERVER_ERROR)


class ErrorReportingMiddleware(BaseHTTPMiddleware):
    """Middleware for error reporting and metrics collection."""

    def __init__(self, app, enable_reporting: bool = True):
        super().__init__(app)
        self.enable_reporting = enable_reporting
        self.error_counts = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            if self.enable_reporting:
                await self._report_error(exc, request)
            raise  # Re-raise to let GlobalErrorHandlerMiddleware handle it

    async def _report_error(self, exc: Exception, request: Request):
        """Report error for monitoring and analytics."""
        error_type = type(exc).__name__

        # Update error counts
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

        # In a production environment, this would send to an error reporting service
        # like Sentry, Rollbar, or a custom monitoring system
        error_report = {
            "error_type": error_type,
            "error_message": str(exc),
            "request_path": request.url.path,
            "request_method": request.method,
            "user_agent": request.headers.get("user-agent"),
            "timestamp": "now",  # Would use actual timestamp
        }

        # For now, just log the report
        logger.info(f"Error report: {json.dumps(error_report)}")

    def get_error_stats(self) -> dict:
        """Get error statistics for monitoring."""
        return {
            "total_errors": sum(self.error_counts.values()),
            "error_counts": self.error_counts.copy(),
        }
