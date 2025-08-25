"""
Enhanced request/response logging middleware for Agent API.
Provides structured logging with security filtering and performance tracking.
"""

import asyncio
import json
import logging
import time
import uuid
from typing import Any, Dict, List, Optional, Set

from fastapi import Request, Response
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)


class RequestLoggingConfig:
    """Configuration for request logging"""

    # Sensitive fields to mask in logs
    SENSITIVE_FIELDS = {
        "password",
        "token",
        "secret",
        "key",
        "authorization",
        "cookie",
        "jwt",
        "api_key",
        "bearer",
        "auth",
        "credentials",
        "ssn",
        "credit_card",
        "encryption_password",
        "jwt_secret",
    }

    # Headers to exclude from logging
    EXCLUDED_HEADERS = {"authorization", "cookie", "x-api-key", "x-auth-token"}

    # Paths to exclude from detailed logging
    EXCLUDED_PATHS = {"/health", "/metrics", "/favicon.ico"}

    # Maximum body size to log (in bytes)
    MAX_BODY_SIZE = 10000  # 10KB

    # Enable/disable response body logging
    LOG_RESPONSE_BODY = True

    # Log levels for different scenarios
    SUCCESS_LOG_LEVEL = logging.INFO
    ERROR_LOG_LEVEL = logging.ERROR
    SLOW_REQUEST_THRESHOLD = 5.0  # seconds
    SLOW_REQUEST_LOG_LEVEL = logging.WARNING


class SecurityFilter:
    """Filter sensitive information from requests/responses"""

    @staticmethod
    def mask_sensitive_data(data: Any, depth: int = 0) -> Any:
        """Recursively mask sensitive fields in data structures"""
        if depth > 10:  # Prevent infinite recursion
            return "[MAX_DEPTH_REACHED]"

        if isinstance(data, dict):
            masked = {}
            for key, value in data.items():
                if any(
                    sensitive in key.lower()
                    for sensitive in RequestLoggingConfig.SENSITIVE_FIELDS
                ):
                    masked[key] = "[MASKED]"
                else:
                    masked[key] = SecurityFilter.mask_sensitive_data(value, depth + 1)
            return masked

        elif isinstance(data, list):
            return [
                SecurityFilter.mask_sensitive_data(item, depth + 1)
                for item in data[:10]
            ]  # Limit list size

        elif isinstance(data, str) and len(data) > 100:
            return data[:100] + "...[TRUNCATED]"

        return data

    @staticmethod
    def filter_headers(headers: Dict[str, str]) -> Dict[str, str]:
        """Filter sensitive headers"""
        filtered = {}
        for key, value in headers.items():
            if key.lower() in RequestLoggingConfig.EXCLUDED_HEADERS:
                filtered[key] = "[MASKED]"
            else:
                filtered[key] = value
        return filtered


class RequestResponseLogger:
    """Enhanced request/response logger with structured output"""

    def __init__(self):
        self.active_requests: Dict[str, Dict] = {}

    async def log_request(self, request: Request) -> str:
        """Log incoming request and return correlation ID"""
        correlation_id = str(uuid.uuid4())
        start_time = time.time()

        # Skip logging for excluded paths
        if request.url.path in RequestLoggingConfig.EXCLUDED_PATHS:
            return correlation_id

        # Extract request body if present
        request_body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if len(body) <= RequestLoggingConfig.MAX_BODY_SIZE:
                    content_type = request.headers.get("content-type", "")
                    if "application/json" in content_type:
                        request_body = json.loads(body)
                    else:
                        request_body = body.decode("utf-8", errors="replace")
                else:
                    request_body = f"[BODY_TOO_LARGE:{len(body)}_bytes]"
            except Exception as e:
                request_body = f"[BODY_READ_ERROR:{str(e)}]"

        # Prepare log data
        log_data = {
            "event": "request_received",
            "correlation_id": correlation_id,
            "timestamp": time.time(),
            "request": {
                "method": request.method,
                "url": str(request.url),
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "headers": SecurityFilter.filter_headers(dict(request.headers)),
                "client_ip": getattr(request.client, "host", None)
                if request.client
                else None,
                "user_agent": request.headers.get("user-agent"),
                "content_length": request.headers.get("content-length"),
                "body": SecurityFilter.mask_sensitive_data(request_body)
                if request_body
                else None,
            },
            "user_context": {
                "user_id": getattr(request.state, "user_id", None),
                "tenant_id": getattr(request.state, "tenant_id", None),
                "session_id": getattr(request.state, "session_id", None),
            },
        }

        # Store request info for response logging
        self.active_requests[correlation_id] = {
            "start_time": start_time,
            "method": request.method,
            "path": request.url.path,
            "user_id": getattr(request.state, "user_id", None),
            "tenant_id": getattr(request.state, "tenant_id", None),
        }

        logger.info("Request received", extra={"structured_data": log_data})
        return correlation_id

    async def log_response(
        self,
        correlation_id: str,
        response: Response,
        response_body: Optional[str] = None,
    ):
        """Log response with performance metrics"""
        if correlation_id not in self.active_requests:
            return

        request_info = self.active_requests.pop(correlation_id)
        end_time = time.time()
        duration = end_time - request_info["start_time"]

        # Skip logging for excluded paths
        if request_info["path"] in RequestLoggingConfig.EXCLUDED_PATHS:
            return

        # Prepare response body for logging
        logged_response_body = None
        if RequestLoggingConfig.LOG_RESPONSE_BODY and response_body:
            if len(response_body) <= RequestLoggingConfig.MAX_BODY_SIZE:
                try:
                    # Try to parse as JSON for better formatting
                    logged_response_body = json.loads(response_body)
                except:
                    logged_response_body = response_body
            else:
                logged_response_body = (
                    f"[RESPONSE_TOO_LARGE:{len(response_body)}_bytes]"
                )

        # Prepare log data
        log_data = {
            "event": "response_sent",
            "correlation_id": correlation_id,
            "timestamp": end_time,
            "request": {"method": request_info["method"], "path": request_info["path"]},
            "response": {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": SecurityFilter.mask_sensitive_data(logged_response_body)
                if logged_response_body
                else None,
            },
            "performance": {
                "duration_seconds": round(duration, 3),
                "is_slow": duration > RequestLoggingConfig.SLOW_REQUEST_THRESHOLD,
            },
            "user_context": {
                "user_id": request_info.get("user_id"),
                "tenant_id": request_info.get("tenant_id"),
            },
        }

        # Choose log level based on response and performance
        if response.status_code >= 500:
            log_level = RequestLoggingConfig.ERROR_LOG_LEVEL
            event_message = "Request failed with server error"
        elif response.status_code >= 400:
            log_level = logging.WARNING
            event_message = "Request failed with client error"
        elif duration > RequestLoggingConfig.SLOW_REQUEST_THRESHOLD:
            log_level = RequestLoggingConfig.SLOW_REQUEST_LOG_LEVEL
            event_message = "Slow request detected"
        else:
            log_level = RequestLoggingConfig.SUCCESS_LOG_LEVEL
            event_message = "Request completed successfully"

        logger.log(log_level, event_message, extra={"structured_data": log_data})

    def get_active_request_count(self) -> int:
        """Get count of currently active requests"""
        return len(self.active_requests)

    def cleanup_stale_requests(self, max_age_seconds: int = 300):
        """Clean up requests that have been active too long"""
        current_time = time.time()
        stale_ids = []

        for correlation_id, request_info in self.active_requests.items():
            if (current_time - request_info["start_time"]) > max_age_seconds:
                stale_ids.append(correlation_id)

        for correlation_id in stale_ids:
            logger.warning(f"Cleaning up stale request: {correlation_id}")
            self.active_requests.pop(correlation_id, None)


# Global logger instance
request_logger = RequestResponseLogger()


class RequestLoggingMiddleware:
    """FastAPI middleware for request/response logging"""

    def __init__(self):
        self.logger = request_logger
        # Schedule periodic cleanup
        asyncio.create_task(self._periodic_cleanup())

    async def __call__(self, request: Request, call_next):
        # Log request
        correlation_id = await self.logger.log_request(request)

        # Add correlation ID to request state
        request.state.correlation_id = correlation_id

        # Call next middleware/endpoint
        try:
            response = await call_next(request)

            # Capture response body for logging
            response_body = None
            if isinstance(response, StreamingResponse):
                # For streaming responses, we can't capture the body
                pass
            else:
                # For regular responses, try to get the body
                try:
                    if hasattr(response, "body"):
                        response_body = response.body.decode("utf-8", errors="replace")
                except:
                    pass

            # Log response
            await self.logger.log_response(correlation_id, response, response_body)

            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id

            return response

        except Exception as e:
            # Log exception
            logger.error(
                "Request processing failed",
                extra={
                    "structured_data": {
                        "event": "request_exception",
                        "correlation_id": correlation_id,
                        "error": str(e),
                        "error_type": type(e).__name__,
                    }
                },
                exc_info=True,
            )

            # Clean up from active requests
            self.logger.active_requests.pop(correlation_id, None)
            raise

    async def _periodic_cleanup(self):
        """Periodically clean up stale requests"""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                self.logger.cleanup_stale_requests()
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")


# Create middleware instance
request_logging_middleware = RequestLoggingMiddleware()
