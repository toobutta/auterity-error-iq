"""Audit logging service for enterprise compliance."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.tenant import AuditLog
from app.models.user import User


class AuditService:
    """Service for comprehensive audit logging."""

    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        tenant_id: UUID,
        event_type: str,
        resource_type: str,
        action: str,
        user: Optional[User] = None,
        resource_id: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
        status: str = "success",
        error_message: Optional[str] = None,
    ) -> AuditLog:
        """Log an audit event."""

        # Extract request information if available
        ip_address = None
        user_agent = None
        session_id = None

        if request:
            ip_address = self._get_client_ip(request)
            user_agent = request.headers.get("user-agent")
            session_id = request.headers.get("x-session-id")

        # Create audit log entry
        audit_log = AuditLog(
            tenant_id=tenant_id,
            user_id=user.id if user else None,
            event_type=event_type,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            old_values=old_values,
            new_values=new_values,
            metadata=metadata,
            status=status,
            error_message=error_message,
        )

        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)

        return audit_log

    def log_authentication(
        self,
        tenant_id: UUID,
        user: Optional[User],
        action: str,
        request: Optional[Request] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log authentication events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="authentication",
            resource_type="user_session",
            action=action,
            user=user,
            request=request,
            status=status,
            error_message=error_message,
            metadata=metadata,
        )

    def log_user_management(
        self,
        tenant_id: UUID,
        admin_user: User,
        target_user: User,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """Log user management events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="user_management",
            resource_type="user",
            resource_id=str(target_user.id),
            action=action,
            user=admin_user,
            old_values=old_values,
            new_values=new_values,
            request=request,
            metadata={"target_user_email": target_user.email},
        )

    def log_workflow_event(
        self,
        tenant_id: UUID,
        user: User,
        workflow_id: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log workflow-related events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="workflow",
            resource_type="workflow",
            resource_id=workflow_id,
            action=action,
            user=user,
            old_values=old_values,
            new_values=new_values,
            request=request,
            metadata=metadata,
        )

    def log_template_event(
        self,
        tenant_id: UUID,
        user: User,
        template_id: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log template-related events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="template",
            resource_type="template",
            resource_id=template_id,
            action=action,
            user=user,
            old_values=old_values,
            new_values=new_values,
            request=request,
            metadata=metadata,
        )

    def log_system_event(
        self,
        tenant_id: UUID,
        event_type: str,
        action: str,
        user: Optional[User] = None,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """Log system-level events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type=event_type,
            resource_type="system",
            action=action,
            user=user,
            request=request,
            metadata=metadata,
        )

    def log_security_event(
        self,
        tenant_id: UUID,
        event_type: str,
        action: str,
        user: Optional[User] = None,
        request: Optional[Request] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log security-related events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type=f"security_{event_type}",
            resource_type="security",
            action=action,
            user=user,
            request=request,
            status=status,
            error_message=error_message,
            metadata=metadata,
        )

    def log_data_access(
        self,
        tenant_id: UUID,
        user: User,
        resource_type: str,
        resource_id: str,
        action: str,
        request: Optional[Request] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Log data access events."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="data_access",
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            user=user,
            request=request,
            metadata=metadata,
        )

    def log_configuration_change(
        self,
        tenant_id: UUID,
        user: User,
        config_type: str,
        action: str,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None,
    ) -> AuditLog:
        """Log configuration changes."""
        return self.log_event(
            tenant_id=tenant_id,
            event_type="configuration",
            resource_type=config_type,
            action=action,
            user=user,
            old_values=old_values,
            new_values=new_values,
            request=request,
        )

    def get_audit_logs(
        self,
        tenant_id: UUID,
        event_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        user_id: Optional[UUID] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AuditLog]:
        """Retrieve audit logs with filtering."""
        query = self.db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)

        if event_type:
            query = query.filter(AuditLog.event_type == event_type)

        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)

        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)

        return (
            query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
        )

    def get_audit_summary(
        self,
        tenant_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get audit log summary statistics."""
        query = self.db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)

        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)

        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)

        total_events = query.count()

        # Count by event type
        event_type_counts = {}
        for log in query.all():
            event_type_counts[log.event_type] = (
                event_type_counts.get(log.event_type, 0) + 1
            )

        # Count by status
        success_count = query.filter(AuditLog.status == "success").count()
        failure_count = query.filter(AuditLog.status == "failure").count()

        return {
            "total_events": total_events,
            "success_count": success_count,
            "failure_count": failure_count,
            "event_type_distribution": event_type_counts,
            "period": {
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
        }

    def _get_client_ip(self, request: Request) -> Optional[str]:
        """Extract client IP address from request."""
        # Check for forwarded headers first
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # Fallback to client host
        if hasattr(request, "client") and request.client:
            return request.client.host

        return None

    def _sanitize_values(
        self, values: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """Sanitize sensitive data from audit log values."""
        if not values:
            return values

        sensitive_fields = {
            "password",
            "hashed_password",
            "secret",
            "token",
            "key",
            "private_key",
            "client_secret",
            "api_key",
        }

        sanitized = {}
        for key, value in values.items():
            if any(field in key.lower() for field in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = value

        return sanitized
