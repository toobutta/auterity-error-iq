"""Tenant isolation middleware for multi-tenant architecture."""

import json
import logging
import time
import uuid
from typing import Optional, cast

from fastapi import HTTPException, Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth import verify_token
from app.database import SessionLocal
from app.models.tenant import Tenant
from app.models.user import User
from app.services.audit_service import AuditService


class TenantIsolationMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce tenant isolation."""

    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/api/auth/login",
            "/api/auth/register",
            "/api/sso/",
            "/.well-known/",
        ]

    async def dispatch(self, request: Request, call_next):
        """Process request with tenant isolation."""
        # Skip tenant isolation for excluded paths
        if any(
            request.url.path.startswith(path) for path in self.exclude_paths
        ):
            return await call_next(request)

        # Extract tenant information
        tenant_id = await self._extract_tenant_id(request)

        if tenant_id:
            # Add tenant context to request state
            request.state.tenant_id = tenant_id

            # Validate tenant is active
            if not await self._validate_tenant(tenant_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant is not active",
                )

        response = await call_next(request)
        return response

    async def _extract_tenant_id(
        self, request: Request
    ) -> Optional[uuid.UUID]:
        """Extract tenant ID from request."""
        # Try to get tenant from subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            tenant = await self._get_tenant_by_slug(subdomain)
            if tenant:
                return cast(uuid.UUID, tenant.id)

        # Try to get tenant from custom header
        tenant_header = request.headers.get("x-tenant-id")
        if tenant_header:
            try:
                return uuid.UUID(tenant_header)
            except ValueError:
                # Try to get by slug
                tenant = await self._get_tenant_by_slug(tenant_header)
                if tenant:
                    return cast(uuid.UUID, tenant.id)

        # Try to get tenant from user context (if authenticated)
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            user = await self._get_user_from_token(token)
            if user:
                return cast(uuid.UUID, user.tenant_id)

        return None

    async def _get_tenant_by_slug(self, slug: str) -> Optional[Tenant]:
        """Get tenant by slug."""
        db = SessionLocal()
        try:
            return db.query(Tenant).filter(Tenant.slug == slug).first()
        finally:
            db.close()

    async def _validate_tenant(self, tenant_id: uuid.UUID) -> bool:
        """Validate tenant is active."""
        db = SessionLocal()
        try:
            tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
            return tenant and tenant.status == "active"
        finally:
            db.close()

    async def _get_user_from_token(self, token: str) -> Optional[User]:
        """Get user from JWT token."""
        try:
            payload = verify_token(token)
            if not payload:
                return None

            email = payload.get("sub")
            if not email:
                return None

            db = SessionLocal()
            try:
                return db.query(User).filter(User.email == email).first()
            finally:
                db.close()
        except Exception:
            return None


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for automatic audit logging."""

    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/metrics",
        ]

    async def dispatch(self, request: Request, call_next):
        """Process request with audit logging."""
        # Skip audit logging for excluded paths
        if any(
            request.url.path.startswith(path) for path in self.exclude_paths
        ):
            return await call_next(request)

        # Skip GET requests for read-only operations (optional)
        if request.method == "GET" and not self._should_audit_read(
            request.url.path
        ):
            return await call_next(request)

        # Capture request details
        start_time = time.time()
        request_body = await self._get_request_body(request)

        response = await call_next(request)

        # Log the request
        await self._log_request(
            request=request,
            response=response,
            request_body=request_body,
            duration_ms=int((time.time() - start_time) * 1000),
        )

        return response

    def _should_audit_read(self, path: str) -> bool:
        """Determine if read operations should be audited."""
        sensitive_paths = ["/api/tenants/", "/api/auth/", "/api/users/"]
        return any(
            path.startswith(sensitive_path)
            for sensitive_path in sensitive_paths
        )

    async def _get_request_body(self, request: Request) -> Optional[dict]:
        """Safely extract request body."""
        try:
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
                if body:
                    return json.loads(body.decode())
        except Exception:
            pass
        return None

    async def _log_request(
        self,
        request: Request,
        response: Response,
        request_body: Optional[dict],
        duration_ms: int,
    ):
        """Log the request to audit system."""
        try:
            # Get tenant and user context
            tenant_id = getattr(request.state, "tenant_id", None)
            user = getattr(request.state, "user", None)

            if not tenant_id:
                return  # Skip if no tenant context

            db = SessionLocal()
            try:
                audit_service = AuditService(db)

                # Determine event type and action
                event_type = self._get_event_type(request.url.path)
                action = (
                    f"{request.method.lower()}_"
                    f"{self._get_resource_action(request.url.path)}"
                )

                # Determine resource type and ID
                resource_type, resource_id = self._extract_resource_info(
                    request.url.path
                )

                # Log the event
                audit_service.log_event(
                    tenant_id=tenant_id,
                    event_type=event_type,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    action=action,
                    user=user,
                    request=request,
                    status=(
                        "success" if response.status_code < 400 else "failure"
                    ),
                    metadata={
                        "method": request.method,
                        "path": str(request.url.path),
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                        "request_body": self._sanitize_request_body(
                            request_body
                        ),
                    },
                )
            finally:
                db.close()

        except Exception as e:
            # Log audit failure but don't break the request

            logger = logging.getLogger(__name__)
            logger.error(f"Audit logging failed: {str(e)}")

    def _get_event_type(self, path: str) -> str:
        """Determine event type from request path."""
        if "/auth/" in path:
            return "authentication"
        elif "/tenants/" in path:
            return "tenant_management"
        elif "/workflows/" in path:
            return "workflow"
        elif "/templates/" in path:
            return "template"
        elif "/users/" in path:
            return "user_management"
        else:
            return "api_access"

    def _get_resource_action(self, path: str) -> str:
        """Determine resource action from request path."""
        if path.endswith("/execute"):
            return "execute"
        elif path.endswith("/logs"):
            return "view_logs"
        elif "/stats" in path:
            return "view_stats"
        else:
            return "access"

    def _extract_resource_info(self, path: str) -> tuple:
        """Extract resource type and ID from path."""
        parts = path.strip("/").split("/")

        if len(parts) >= 3 and parts[0] == "api":
            resource_type = parts[1].rstrip("s")  # Remove plural

            # Try to extract UUID from path
            for part in parts[2:]:
                try:
                    uuid.UUID(part)
                    return resource_type, part
                except ValueError:
                    continue

            return resource_type, None

        return "unknown", None

    def _sanitize_request_body(self, body: Optional[dict]) -> Optional[dict]:
        """Sanitize sensitive data from request body."""
        if not body:
            return body

        sensitive_fields = {
            "password",
            "hashed_password",
            "secret",
            "token",
            "key",
            "private_key",
            "client_secret",
            "api_key",
            "saml_x509_cert",
        }

        sanitized = {}
        for key, value in body.items():
            if any(field in key.lower() for field in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value

        return sanitized
