"""
Comprehensive security headers middleware for Agent API.
Implements OWASP security headers and additional protections.
"""

import logging
import time
from typing import Dict, List, Optional

from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class SecurityConfig:
    """Security configuration constants"""

    # Content Security Policy
    CSP_POLICY = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self'"
    )

    # Allowed origins for CORS (should be configured per environment)
    ALLOWED_ORIGINS = ["http://localhost:3000", "https://app.auterity.com"]

    # Security headers configuration
    SECURITY_HEADERS = {
        # Prevent MIME type sniffing
        "X-Content-Type-Options": "nosniff",
        # Prevent clickjacking
        "X-Frame-Options": "DENY",
        # XSS Protection (legacy but still useful)
        "X-XSS-Protection": "1; mode=block",
        # Referrer policy
        "Referrer-Policy": "strict-origin-when-cross-origin",
        # Permissions policy (previously Feature-Policy)
        "Permissions-Policy": (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=(), "
            "accelerometer=(), ambient-light-sensor=()"
        ),
        # HSTS (HTTP Strict Transport Security)
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        # Content Security Policy
        "Content-Security-Policy": CSP_POLICY,
        # Cross-Origin policies
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
    }

    # Rate limiting configuration
    RATE_LIMIT_HEADERS = True

    # API versioning
    API_VERSION = "v1"

    # Server identification
    HIDE_SERVER_HEADER = True


class SecurityHeadersMiddleware:
    """Comprehensive security headers middleware"""

    def __init__(
        self,
        enable_hsts: bool = True,
        enable_csp: bool = True,
        custom_headers: Optional[Dict[str, str]] = None,
    ):
        self.enable_hsts = enable_hsts
        self.enable_csp = enable_csp
        self.custom_headers = custom_headers or {}

        # Merge custom headers with defaults
        self.headers = {**SecurityConfig.SECURITY_HEADERS, **self.custom_headers}

        # Remove HSTS if not enabled (for development)
        if not enable_hsts:
            self.headers.pop("Strict-Transport-Security", None)

        # Remove CSP if not enabled
        if not enable_csp:
            self.headers.pop("Content-Security-Policy", None)

    async def __call__(self, request: Request, call_next):
        # Process request
        response = await call_next(request)

        # Add security headers
        for header, value in self.headers.items():
            response.headers[header] = value

        # Add API version header
        response.headers["X-API-Version"] = SecurityConfig.API_VERSION

        # Add timing information (for performance monitoring)
        response.headers["X-Response-Time"] = str(int(time.time() * 1000))

        # Hide server information
        if SecurityConfig.HIDE_SERVER_HEADER:
            response.headers.pop("server", None)

        # Add correlation ID if present
        if hasattr(request.state, "correlation_id"):
            response.headers["X-Correlation-ID"] = request.state.correlation_id

        return response


class APISecurityEnhancer:
    """Additional API security enhancements"""

    def __init__(self):
        self.blocked_user_agents = {
            "curl",
            "wget",
            "python-requests",
            "postman",  # Add as needed
        }
        self.suspicious_patterns = [
            "select",
            "union",
            "drop",
            "delete",
            "insert",  # SQL injection
            "<script",
            "javascript:",
            "eval(",  # XSS patterns
            "../",
            "..\\",  # Directory traversal
        ]

    async def __call__(self, request: Request, call_next):
        # Security validations
        security_check = await self._security_checks(request)
        if security_check:
            return security_check

        # Process request
        response = await call_next(request)

        # Add security context to response
        await self._add_security_context(request, response)

        return response

    async def _security_checks(self, request: Request) -> Optional[JSONResponse]:
        """Perform various security checks"""

        # Check User-Agent (optional - can be bypassed easily)
        user_agent = request.headers.get("user-agent", "").lower()
        if any(blocked in user_agent for blocked in self.blocked_user_agents):
            logger.warning(f"Blocked user agent: {user_agent}")
            # Note: In production, you might want to allow these for legitimate use
            # return JSONResponse(
            #     status_code=403,
            #     content={"error": "Access denied"}
            # )

        # Check for suspicious patterns in query parameters
        for param, value in request.query_params.items():
            if any(
                pattern in str(value).lower() for pattern in self.suspicious_patterns
            ):
                logger.warning(f"Suspicious query parameter detected: {param}={value}")
                return JSONResponse(
                    status_code=400, content={"error": "Invalid request parameters"}
                )

        # Check request size
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > 10 * 1024 * 1024:  # 10MB limit
                    logger.warning(f"Request too large: {content_length} bytes")
                    return JSONResponse(
                        status_code=413, content={"error": "Request entity too large"}
                    )
            except ValueError:
                logger.warning(
                    f"Invalid Content-Length header: {content_length}"
                )

        # Check for required headers in agent requests
        if request.url.path.startswith("/api/agents"):
            if not request.headers.get("content-type") and request.method in [
                "POST",
                "PUT",
                "PATCH",
            ]:
                return JSONResponse(
                    status_code=400, content={"error": "Content-Type header required"}
                )

        return None

    async def _add_security_context(self, request: Request, response: Response):
        """Add security context information"""

        # Add cache control for sensitive endpoints
        if request.url.path.startswith("/api/agents"):
            if request.method in ["POST", "PUT", "DELETE"]:
                response.headers[
                    "Cache-Control"
                ] = "no-store, no-cache, must-revalidate"
                response.headers["Pragma"] = "no-cache"

        # Add CORS headers if needed (FastAPI CORS middleware handles this better)
        origin = request.headers.get("origin")
        if origin in SecurityConfig.ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"


class RateLimitSecurityMiddleware:
    """Security-focused rate limiting with threat detection"""

    def __init__(self):
        self.request_counts = {}
        self.blocked_ips = set()
        self.suspicious_ips = set()

    async def __call__(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)

        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            logger.warning(f"Blocked IP attempted access: {client_ip}")
            return JSONResponse(
                status_code=429, content={"error": "Access temporarily restricted"}
            )

        # Track requests per IP
        current_time = time.time()
        if client_ip not in self.request_counts:
            self.request_counts[client_ip] = []

        # Clean old requests (last minute)
        self.request_counts[client_ip] = [
            timestamp
            for timestamp in self.request_counts[client_ip]
            if current_time - timestamp < 60
        ]

        # Add current request
        self.request_counts[client_ip].append(current_time)

        # Check for abuse (more than 100 requests per minute)
        if len(self.request_counts[client_ip]) > 100:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            self.suspicious_ips.add(client_ip)

            # Block if consistently abusive
            if len(self.request_counts[client_ip]) > 200:
                self.blocked_ips.add(client_ip)
                logger.error(f"IP blocked for abuse: {client_ip}")

        response = await call_next(request)

        # Add rate limit headers
        remaining = max(0, 100 - len(self.request_counts[client_ip]))
        response.headers["X-RateLimit-Limit"] = "100"
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time) + 60)

        return response

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP considering proxies"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to direct client IP
        return (
            getattr(request.client, "host", "unknown") if request.client else "unknown"
        )


# Create middleware instances
security_headers_middleware = SecurityHeadersMiddleware(
    enable_hsts=True, enable_csp=True  # Set to False for development
)

api_security_enhancer = APISecurityEnhancer()
rate_limit_security_middleware = RateLimitSecurityMiddleware()
