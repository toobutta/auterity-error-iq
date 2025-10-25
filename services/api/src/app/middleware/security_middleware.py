"""Security middleware for analytics platform."""

from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import time

from app.services.security_service import EnterpriseSecurityService
from app.middleware.logging import get_logger

logger = get_logger(__name__)
security = HTTPBearer(auto_error=False)


class AnalyticsSecurityMiddleware(BaseHTTPMiddleware):
    """Middleware for analytics security, authentication, and authorization."""

    def __init__(self, app, jwt_secret: str, encryption_key: Optional[str] = None):
        super().__init__(app)
        self.security_service = EnterpriseSecurityService(jwt_secret, encryption_key)

    async def dispatch(self, request: Request, call_next):
        """Process request through security middleware."""
        start_time = time.time()

        try:
            # Extract request information
            path = request.url.path
            method = request.method
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent", "")

            # Skip security checks for health endpoints
            if path in ["/health", "/docs", "/redoc", "/openapi.json"]:
                return await call_next(request)

            # Extract authentication token
            credentials = await security(request)

            if not credentials:
                # Check for token in query parameters (for WebSocket connections)
                token = request.query_params.get("token")
                if token:
                    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
                else:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Authentication required"}
                    )

            # Validate token
            token_payload = self.security_service.validate_access_token(credentials.credentials)

            if not token_payload:
                # Log security event
                await self._log_security_event(
                    "invalid_token",
                    "auth",
                    None,
                    client_ip,
                    user_agent,
                    False,
                    {"token_length": len(credentials.credentials)}
                )

                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or expired token"}
                )

            # Extract user information
            user_id = token_payload.get("sub", "unknown")
            tenant_id = token_payload.get("tenant_id", "unknown")
            roles = token_payload.get("roles", [])

            # Get user permissions
            user_permissions = self.security_service.get_user_permissions(user_id, tenant_id, roles)

            # Check rate limits
            endpoint = f"{method}:{path}"
            if not self.security_service.check_rate_limit(user_id, endpoint):
                # Log rate limit violation
                await self._log_security_event(
                    "rate_limit_exceeded",
                    endpoint,
                    None,
                    client_ip,
                    user_agent,
                    False,
                    {"endpoint": endpoint}
                )

                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after": 60
                    }
                )

            # Add user context to request
            request.state.user_id = user_id
            request.state.tenant_id = tenant_id
            request.state.roles = roles
            request.state.permissions = user_permissions
            request.state.client_ip = client_ip
            request.state.user_agent = user_agent

            # Process request
            response = await call_next(request)

            # Log successful access
            processing_time = time.time() - start_time
            await self._log_security_event(
                "api_access",
                endpoint,
                None,
                client_ip,
                user_agent,
                True,
                {
                    "response_status": response.status_code,
                    "processing_time": processing_time
                }
            )

            return response

        except Exception as e:
            # Log security error
            processing_time = time.time() - start_time
            await self._log_security_event(
                "security_error",
                f"{method}:{path}",
                None,
                self._get_client_ip(request),
                request.headers.get("user-agent", ""),
                False,
                {"error": str(e), "processing_time": processing_time}
            )

            logger.error(f"Security middleware error: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Security processing error"}
            )

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Check for real IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fall back to direct connection
        return request.client.host if request.client else "unknown"

    async def _log_security_event(
        self,
        action: str,
        resource: str,
        resource_id: Optional[str],
        ip_address: str,
        user_agent: str,
        success: bool,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log security event."""
        try:
            user_id = getattr(getattr(getattr(await self._get_current_request_context(), 'state', None), 'user_id', None), 'default', 'anonymous')
            tenant_id = getattr(getattr(getattr(await self._get_current_request_context(), 'state', None), 'tenant_id', None), 'default', 'unknown')

            await self.security_service.create_audit_event(
                user_id=user_id,
                tenant_id=tenant_id,
                action=action,
                resource=resource,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                details=details
            )
        except Exception as e:
            logger.error(f"Failed to log security event: {str(e)}")

    async def _get_current_request_context(self):
        """Get current request context (placeholder for middleware)."""
        return None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware for API protection."""

    def __init__(self, app, security_service: EnterpriseSecurityService):
        super().__init__(app)
        self.security_service = security_service

    async def dispatch(self, request: Request, call_next):
        """Process request through rate limiting middleware."""
        try:
            # Skip rate limiting for health endpoints
            if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
                return await call_next(request)

            # Get user ID from request state (set by security middleware)
            user_id = getattr(request.state, 'user_id', None)
            if not user_id:
                # Anonymous user - use IP-based rate limiting
                client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                if not client_ip:
                    client_ip = request.client.host if request.client else "unknown"
                user_id = f"anon_{client_ip}"

            # Check rate limit
            endpoint = f"{request.method}:{request.url.path}"
            if not self.security_service.check_rate_limit(user_id, endpoint):
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Rate limit exceeded",
                        "retry_after": 60,
                        "endpoint": endpoint
                    },
                    headers={"Retry-After": "60"}
                )

            # Add rate limit headers to response
            response = await call_next(request)

            # Get current rate limit status
            rate_status = self.security_service.get_rate_limit_status(user_id, endpoint)

            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(rate_status["limit"])
            response.headers["X-RateLimit-Remaining"] = str(rate_status["remaining"])
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + rate_status["reset_in"])

            return response

        except Exception as e:
            logger.error(f"Rate limit middleware error: {str(e)}")
            return await call_next(request)


class DataPrivacyMiddleware(BaseHTTPMiddleware):
    """Data privacy and GDPR compliance middleware."""

    def __init__(self, app, security_service: EnterpriseSecurityService):
        super().__init__(app)
        self.security_service = security_service

    async def dispatch(self, request: Request, call_next):
        """Process request through data privacy middleware."""
        try:
            # Get user permissions from request state
            user_permissions = getattr(request.state, 'permissions', None)
            if not user_permissions:
                return await call_next(request)

            # Process request
            response = await call_next(request)

            # Apply privacy filters to response data
            if hasattr(response, 'body') and response.status_code == 200:
                try:
                    import json
                    response_data = json.loads(response.body)

                    # Apply privacy filters
                    filtered_data = self.security_service.apply_privacy_filters(
                        response_data, user_permissions
                    )

                    # Update response with filtered data
                    response.body = json.dumps(filtered_data).encode()
                    response.headers["content-length"] = str(len(response.body))

                except (json.JSONDecodeError, AttributeError):
                    # Not JSON response or can't parse - skip filtering
                    pass

            return response

        except Exception as e:
            logger.error(f"Data privacy middleware error: {str(e)}")
            return await call_next(request)


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """Comprehensive audit logging middleware."""

    def __init__(self, app, security_service: EnterpriseSecurityService):
        super().__init__(app)
        self.security_service = security_service

    async def dispatch(self, request: Request, call_next):
        """Process request through audit logging middleware."""
        start_time = time.time()

        try:
            # Extract request information
            user_id = getattr(request.state, 'user_id', 'anonymous')
            tenant_id = getattr(request.state, 'tenant_id', 'unknown')
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent", "")
            endpoint = f"{request.method}:{request.url.path}"

            # Log request start
            await self.security_service.create_audit_event(
                user_id=user_id,
                tenant_id=tenant_id,
                action="api_request_start",
                resource=endpoint,
                ip_address=client_ip,
                user_agent=user_agent,
                success=True,
                details={
                    "method": request.method,
                    "path": request.url.path,
                    "query_params": dict(request.query_params),
                    "headers": dict(request.headers)
                }
            )

            # Process request
            response = await call_next(request)
            processing_time = time.time() - start_time

            # Log request completion
            await self.security_service.create_audit_event(
                user_id=user_id,
                tenant_id=tenant_id,
                action="api_request_complete",
                resource=endpoint,
                ip_address=client_ip,
                user_agent=user_agent,
                success=response.status_code < 400,
                details={
                    "status_code": response.status_code,
                    "processing_time": processing_time,
                    "response_headers": dict(response.headers)
                }
            )

            return response

        except Exception as e:
            processing_time = time.time() - start_time

            # Log error
            await self.security_service.create_audit_event(
                user_id=getattr(request.state, 'user_id', 'anonymous'),
                tenant_id=getattr(request.state, 'tenant_id', 'unknown'),
                action="api_request_error",
                resource=f"{request.method}:{request.url.path}",
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("user-agent", ""),
                success=False,
                details={
                    "error": str(e),
                    "processing_time": processing_time
                }
            )

            logger.error(f"Audit logging middleware error: {str(e)}")
            raise

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"


# ============================================================================
# DEPENDENCY INJECTION HELPERS
# ============================================================================

async def get_current_user_permissions(request: Request) -> Any:
    """Dependency injection for user permissions."""
    return getattr(request.state, 'permissions', None)


async def get_current_user_context(request: Request) -> Dict[str, Any]:
    """Dependency injection for user context."""
    return {
        "user_id": getattr(request.state, 'user_id', None),
        "tenant_id": getattr(request.state, 'tenant_id', None),
        "roles": getattr(request.state, 'roles', []),
        "permissions": getattr(request.state, 'permissions', None),
        "client_ip": getattr(request.state, 'client_ip', None),
        "user_agent": getattr(request.state, 'user_agent', None)
    }


async def require_permission(permission: str):
    """Dependency injection for permission checking."""
    def permission_checker(request: Request):
        permissions = getattr(request.state, 'permissions', None)
        if not permissions:
            raise HTTPException(status_code=401, detail="Authentication required")

        if not hasattr(permissions, permission.replace('_', '')):
            # Generic permission check
            if permission == "view_analytics" and not permissions.can_view_analytics:
                raise HTTPException(status_code=403, detail="Insufficient permissions: view_analytics")
            elif permission == "export_data" and not permissions.can_export_data:
                raise HTTPException(status_code=403, detail=f"Insufficient permissions: {permission}")
            # Add more permission checks as needed

        return True

    return permission_checker

