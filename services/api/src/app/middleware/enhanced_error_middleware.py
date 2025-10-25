"""
Enhanced Error Handling Middleware

Automatically integrates error analytics, recovery, and \
    notifications into the request pipeline.
"""

import asyncio
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.exceptions import BaseAppException
from app.services.enhanced_recovery import get_enhanced_recovery_service
from app.services.error_analytics import get_error_analytics_service
from app.services.notification_service import get_notification_service


class EnhancedErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for enhanced error handling with analytics and recovery."""

    def __init__(self, app, enable_auto_recovery: bool = True):
        super().__init__(app)
        self.enable_auto_recovery = enable_auto_recovery
        self.logger = logging.getLogger(__name__)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request with enhanced error handling."""
        start_time = time.time()

        try:
            # Process request normally
            response = await call_next(request)
            return response

        except BaseAppException as e:
            # Handle application exceptions with enhanced error handling
            await self._handle_application_error(e, request, start_time)

            # Re-raise the exception to be handled by the global error handler
            raise

        except Exception as e:
            # Handle unexpected exceptions
            await self._handle_unexpected_error(e, request, start_time)

            # Re-raise the exception
            raise

    async def _handle_application_error(
        self, error: BaseAppException, request: Request, start_time: float
    ) -> None:
        """Handle application errors with enhanced processing."""
        try:
            # Extract request context
            context = await self._extract_request_context(request, start_time)

            # Track error in analytics
            analytics_service = await get_error_analytics_service()
            await analytics_service.track_error(error, context)

            # Send notification if needed
            notification_service = await get_notification_service()
            await notification_service.send_error_notification(error, context)

            # Trigger automatic recovery if enabled and error is retryable
            if self.enable_auto_recovery and error.retryable:
                await self._trigger_auto_recovery(error, context)

        except Exception as e:
            # Don't let error handling errors break the main flow
            self.logger.error(f"Enhanced error handling failed: {e}")

    async def _handle_unexpected_error(
        self, error: Exception, request: Request, start_time: float
    ) -> None:
        """Handle unexpected errors by converting them to BaseAppException."""
        try:
            # Convert to BaseAppException for consistent handling
            from app.exceptions import SystemError

            app_error = SystemError(
                message=f"Unexpected error: {str(error)}",
                details={
                    "original_error": str(error),
                    "error_type": type(error).__name__,
                },
            )

            # Handle as application error
            await self._handle_application_error(
                app_error, request, start_time
            )

        except Exception as e:
            self.logger.error(f"Failed to handle unexpected error: {e}")

    async def _extract_request_context(
        self, request: Request, start_time: float
    ) -> dict:
        """Extract relevant context from the request."""
        context = {
            "method": request.method,
            "url": str(request.url),
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
            "request_duration": time.time() - start_time,
            "timestamp": time.time(),
        }

        # Extract user information if available
        if hasattr(request.state, "user"):
            context["user_id"] = getattr(request.state.user, "id", None)
            context["user_email"] = getattr(request.state.user, "email", None)

        # Extract correlation ID if available
        correlation_id = request.headers.get("x-correlation-id")
        if correlation_id:
            context["correlation_id"] = correlation_id

        # Mark as user-facing if it's an API endpoint
        context["user_facing"] = request.url.path.startswith("/api/")

        # Mark as business critical for certain endpoints
        critical_paths = [
            "/api/workflows/execute",
            "/api/auth/",
            "/api/templates/",
        ]
        context["business_critical"] = any(
            request.url.path.startswith(path) for path in critical_paths
        )

        return context

    async def _trigger_auto_recovery(
        self, error: BaseAppException, context: dict
    ) -> None:
        """Trigger automatic recovery for retryable errors."""
        try:
            # Only trigger recovery for high-severity errors or
            # business-critical operations
            if error.severity.value in ["high", "critical"] or context.get(
                "business_critical", False
            ):
                recovery_service = await get_enhanced_recovery_service()

                # Create recovery plan
                plan = await recovery_service.create_recovery_plan(
                    error, context
                )

                # Execute recovery plan asynchronously
                asyncio.create_task(
                    recovery_service.execute_recovery_plan(
                        plan, error, context
                    )
                )

                self.logger.info(
                    f"Triggered automatic recovery for error {error.code} "
                    f"with plan {plan.error_id}"
                )

        except Exception as e:
            self.logger.error(f"Failed to trigger auto recovery: {e}")


class ErrorMetricsMiddleware(BaseHTTPMiddleware):
    """Lightweight middleware for collecting error metrics."""

    def __init__(self, app):
        super().__init__(app)
        self.logger = logging.getLogger(__name__)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Collect error metrics from requests."""
        try:
            response = await call_next(request)

            # Track successful requests
            if response.status_code < 400:
                await self._track_success_metric(request, response)
            else:
                await self._track_error_metric(request, response)

            return response

        except Exception as e:
            # Track exception metrics
            await self._track_exception_metric(request, e)
            raise

    async def _track_success_metric(
        self, request: Request, response: Response
    ) -> None:
        """Track successful request metrics."""
        try:
            # Update success counters in Redis
            analytics_service = await get_error_analytics_service()
            await analytics_service.redis.incr("request_success_count")
            await analytics_service.redis.expire(
                "request_success_count", 86400
            )

        except Exception as e:
            self.logger.error(f"Failed to track success metric: {e}")

    async def _track_error_metric(
        self, request: Request, response: Response
    ) -> None:
        """Track HTTP error metrics."""
        try:
            analytics_service = await get_error_analytics_service()

            # Track by status code
            await analytics_service.redis.incr(
                f"http_error_{response.status_code}"
            )
            await analytics_service.redis.expire(
                f"http_error_{response.status_code}", 86400
            )

            # Track overall error count
            await analytics_service.redis.incr("request_error_count")
            await analytics_service.redis.expire("request_error_count", 86400)

        except Exception as e:
            self.logger.error(f"Failed to track error metric: {e}")

    async def _track_exception_metric(
        self, request: Request, exception: Exception
    ) -> None:
        """Track exception metrics."""
        try:
            analytics_service = await get_error_analytics_service()

            # Track by exception type
            exception_type = type(exception).__name__
            await analytics_service.redis.incr(f"exception_{exception_type}")
            await analytics_service.redis.expire(
                f"exception_{exception_type}", 86400
            )

            # Track overall exception count
            await analytics_service.redis.incr("request_exception_count")
            await analytics_service.redis.expire(
                "request_exception_count", 86400
            )

        except Exception as e:
            self.logger.error(f"Failed to track exception metric: {e}")


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware for system health monitoring based on error patterns."""

    def __init__(self, app, health_check_interval: int = 60):
        super().__init__(app)
        self.health_check_interval = health_check_interval
        self.last_health_check = 0
        self.logger = logging.getLogger(__name__)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Monitor system health during request processing."""
        # Perform periodic health checks
        current_time = time.time()
        if current_time - self.last_health_check > self.health_check_interval:
            asyncio.create_task(self._perform_health_check())
            self.last_health_check = current_time

        return await call_next(request)

    async def _perform_health_check(self) -> None:
        """Perform system health check based on error patterns."""
        try:
            analytics_service = await get_error_analytics_service()

            # Get recent error metrics
            metrics = await analytics_service.get_error_metrics(1)  # Last hour

            # Calculate health indicators
            health_indicators = {
                "error_rate": metrics.error_rate,
                "trend": metrics.trend.value,
                "total_errors": metrics.total_errors,
            }

            # Determine health status
            if metrics.error_rate > 50:  # >50 errors per hour
                health_status = "critical"
            elif metrics.error_rate > 20:  # >20 errors per hour
                health_status = "degraded"
            elif metrics.error_rate > 5:  # >5 errors per hour
                health_status = "warning"
            else:
                health_status = "healthy"

            # Store health status
            await analytics_service.redis.setex(
                "system_health_status",
                self.health_check_interval * 2,
                health_status,
            )

            # Send health notification if status changed
            previous_status = await analytics_service.redis.get(
                "previous_health_status"
            )
            if previous_status and previous_status.decode() != health_status:
                notification_service = await get_notification_service()
                await notification_service.send_health_notification(
                    health_status, health_indicators
                )

            # Update previous status
            await analytics_service.redis.setex(
                "previous_health_status",
                self.health_check_interval * 2,
                health_status,
            )

        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
