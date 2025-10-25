"""Enterprise Security Service for Analytics Platform."""

import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass
import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

from app.middleware.logging import get_logger

logger = get_logger(__name__)


@dataclass
class UserPermissions:
    """User permissions for analytics access."""
    can_view_analytics: bool = False
    can_view_business_metrics: bool = False
    can_view_user_data: bool = False
    can_view_ai_metrics: bool = False
    can_export_data: bool = False
    can_modify_dashboards: bool = False
    can_access_admin_features: bool = False
    data_retention_days: int = 90
    allowed_tenants: List[str] = None
    restricted_metrics: List[str] = None

    def __post_init__(self):
        if self.allowed_tenants is None:
            self.allowed_tenants = []
        if self.restricted_metrics is None:
            self.restricted_metrics = []


@dataclass
class AuditEvent:
    """Audit event for security tracking."""
    event_id: str
    timestamp: datetime
    user_id: str
    tenant_id: str
    action: str
    resource: str
    resource_id: Optional[str]
    ip_address: str
    user_agent: str
    success: bool
    details: Dict[str, Any]
    risk_level: str  # low, medium, high, critical


class EnterpriseSecurityService:
    """Enterprise-grade security service for analytics platform."""

    def __init__(self, jwt_secret: str, encryption_key: Optional[str] = None):
        self.jwt_secret = jwt_secret
        self.encryption_key = encryption_key or self._generate_encryption_key()
        self.fernet = Fernet(self.encryption_key)

        # RBAC configuration
        self.role_permissions = self._initialize_role_permissions()

        # Audit logging
        self.audit_events: List[AuditEvent] = []
        self.max_audit_events = 10000

        # Rate limiting
        self.rate_limits = {}
        self.rate_limit_windows = {}  # user_id -> {endpoint: [timestamps]}

        # Session management
        self.active_sessions: Dict[str, Dict[str, Any]] = {}

    def _generate_encryption_key(self) -> str:
        """Generate a new encryption key."""
        salt = secrets.token_bytes(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.jwt_secret.encode()))
        return key

    def _initialize_role_permissions(self) -> Dict[str, UserPermissions]:
        """Initialize role-based permissions."""
        return {
            "admin": UserPermissions(
                can_view_analytics=True,
                can_view_business_metrics=True,
                can_view_user_data=True,
                can_view_ai_metrics=True,
                can_export_data=True,
                can_modify_dashboards=True,
                can_access_admin_features=True,
                data_retention_days=365,
                allowed_tenants=[],  # Empty means all tenants
                restricted_metrics=[]
            ),
            "analyst": UserPermissions(
                can_view_analytics=True,
                can_view_business_metrics=True,
                can_view_user_data=True,
                can_view_ai_metrics=True,
                can_export_data=True,
                can_modify_dashboards=True,
                can_access_admin_features=False,
                data_retention_days=180,
                allowed_tenants=[],  # Will be set per user
                restricted_metrics=[]
            ),
            "manager": UserPermissions(
                can_view_analytics=True,
                can_view_business_metrics=True,
                can_view_user_data=False,  # No PII access
                can_view_ai_metrics=True,
                can_export_data=True,
                can_modify_dashboards=False,
                can_access_admin_features=False,
                data_retention_days=90,
                allowed_tenants=[],  # Will be set per user
                restricted_metrics=["user_pii", "sensitive_financial"]
            ),
            "viewer": UserPermissions(
                can_view_analytics=True,
                can_view_business_metrics=False,
                can_view_user_data=False,
                can_view_ai_metrics=False,
                can_export_data=False,
                can_modify_dashboards=False,
                can_access_admin_features=False,
                data_retention_days=30,
                allowed_tenants=[],  # Will be set per user
                restricted_metrics=["business_metrics", "ai_metrics", "user_data"]
            )
        }

    # ============================================================================
    # AUTHENTICATION & AUTHORIZATION
    # ============================================================================

    def generate_access_token(self, user_id: str, tenant_id: str, roles: List[str],
                             permissions: UserPermissions, expires_in: int = 3600) -> str:
        """Generate JWT access token with embedded permissions."""
        now = datetime.utcnow()
        payload = {
            "sub": user_id,
            "tenant_id": tenant_id,
            "roles": roles,
            "permissions": {
                "can_view_analytics": permissions.can_view_analytics,
                "can_view_business_metrics": permissions.can_view_business_metrics,
                "can_view_user_data": permissions.can_view_user_data,
                "can_view_ai_metrics": permissions.can_view_ai_metrics,
                "can_export_data": permissions.can_export_data,
                "can_modify_dashboards": permissions.can_modify_dashboards,
                "can_access_admin_features": permissions.can_access_admin_features,
                "data_retention_days": permissions.data_retention_days,
                "allowed_tenants": permissions.allowed_tenants,
                "restricted_metrics": permissions.restricted_metrics
            },
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
            "iss": "auterity-analytics",
            "aud": "analytics-api"
        }

        token = jwt.encode(payload, self.jwt_secret, algorithm="HS256")
        return token

    def validate_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT access token and return payload."""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"],
                               audience="analytics-api", issuer="auterity-analytics")

            # Check if token is expired
            if payload.get("exp", 0) < int(datetime.utcnow().timestamp()):
                return None

            return payload

        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return None

    def get_user_permissions(self, user_id: str, tenant_id: str, roles: List[str]) -> UserPermissions:
        """Get consolidated user permissions from roles."""
        # Start with most restrictive permissions
        consolidated = UserPermissions()

        for role in roles:
            if role in self.role_permissions:
                role_perms = self.role_permissions[role]

                # Use OR logic for boolean permissions (allow if any role allows)
                consolidated.can_view_analytics |= role_perms.can_view_analytics
                consolidated.can_view_business_metrics |= role_perms.can_view_business_metrics
                consolidated.can_view_user_data |= role_perms.can_view_user_data
                consolidated.can_view_ai_metrics |= role_perms.can_view_ai_metrics
                consolidated.can_export_data |= role_perms.can_export_data
                consolidated.can_modify_dashboards |= role_perms.can_modify_dashboards
                consolidated.can_access_admin_features |= role_perms.can_access_admin_features

                # Use minimum for restrictive settings
                consolidated.data_retention_days = min(
                    consolidated.data_retention_days, role_perms.data_retention_days
                )

                # Combine allowed tenants (intersection)
                if consolidated.allowed_tenants and role_perms.allowed_tenants:
                    consolidated.allowed_tenants = list(
                        set(consolidated.allowed_tenants) & set(role_perms.allowed_tenants)
                    )
                elif role_perms.allowed_tenants:
                    consolidated.allowed_tenants = role_perms.allowed_tenants.copy()

                # Combine restricted metrics (union)
                consolidated.restricted_metrics.extend(role_perms.restricted_metrics)
                consolidated.restricted_metrics = list(set(consolidated.restricted_metrics))

        # Set tenant-specific permissions
        if not consolidated.allowed_tenants or tenant_id in consolidated.allowed_tenants:
            consolidated.allowed_tenants = [tenant_id]

        return consolidated

    def check_permission(self, user_permissions: UserPermissions, permission: str,
                        resource: Optional[str] = None) -> bool:
        """Check if user has specific permission."""

        # Check basic permissions
        if permission == "view_analytics" and not user_permissions.can_view_analytics:
            return False
        elif permission == "view_business_metrics" and not user_permissions.can_view_business_metrics:
            return False
        elif permission == "view_user_data" and not user_permissions.can_view_user_data:
            return False
        elif permission == "view_ai_metrics" and not user_permissions.can_view_ai_metrics:
            return False
        elif permission == "export_data" and not user_permissions.can_export_data:
            return False
        elif permission == "modify_dashboards" and not user_permissions.can_modify_dashboards:
            return False
        elif permission == "access_admin" and not user_permissions.can_access_admin_features:
            return False

        # Check resource restrictions
        if resource and resource in user_permissions.restricted_metrics:
            return False

        return True

    # ============================================================================
    # DATA ENCRYPTION & PRIVACY
    # ============================================================================

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        if not data:
            return data
        encrypted = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        if not encrypted_data:
            return encrypted_data
        try:
            encrypted = base64.urlsafe_b64decode(encrypted_data)
            decrypted = self.fernet.decrypt(encrypted)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt data: {str(e)}")
            return "[DECRYPTION_FAILED]"

    def hash_pii_data(self, data: str, salt: Optional[str] = None) -> str:
        """Hash personally identifiable information."""
        if not data:
            return data

        if salt:
            data = data + salt

        return hashlib.sha256(data.encode()).hexdigest()

    def anonymize_user_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Anonymize user data for privacy compliance."""
        anonymized = user_data.copy()

        # Fields to hash/anonymize
        pii_fields = ['email', 'first_name', 'last_name', 'phone', 'address']
        sensitive_fields = ['ip_address', 'user_agent', 'device_id']

        for field in pii_fields:
            if field in anonymized and anonymized[field]:
                anonymized[field] = self.hash_pii_data(anonymized[field])

        for field in sensitive_fields:
            if field in anonymized and anonymized[field]:
                anonymized[field] = self.encrypt_sensitive_data(anonymized[field])

        return anonymized

    def apply_data_retention_policy(self, user_permissions: UserPermissions,
                                   data_timestamp: datetime) -> bool:
        """Check if data should be retained based on user permissions."""
        retention_days = user_permissions.data_retention_days
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

        return data_timestamp >= cutoff_date

    # ============================================================================
    # AUDIT LOGGING
    # ============================================================================

    def log_audit_event(self, event: AuditEvent):
        """Log security audit event."""
        self.audit_events.append(event)

        # Keep only recent events
        if len(self.audit_events) > self.max_audit_events:
            self.audit_events = self.audit_events[-self.max_audit_events:]

        # Log to security monitoring
        log_data = {
            "event_id": event.event_id,
            "timestamp": event.timestamp.isoformat(),
            "user_id": event.user_id,
            "tenant_id": event.tenant_id,
            "action": event.action,
            "resource": event.resource,
            "resource_id": event.resource_id,
            "ip_address": event.ip_address,
            "success": event.success,
            "risk_level": event.risk_level,
            "details": event.details
        }

        if event.risk_level in ['high', 'critical']:
            logger.warning(f"Security Event: {event.action} on {event.resource}", extra=log_data)
        else:
            logger.info(f"Audit Event: {event.action} on {event.resource}", extra=log_data)

    def create_audit_event(self, user_id: str, tenant_id: str, action: str,
                          resource: str, resource_id: Optional[str] = None,
                          ip_address: str = "", user_agent: str = "",
                          success: bool = True, details: Optional[Dict[str, Any]] = None) -> AuditEvent:
        """Create and log audit event."""

        # Assess risk level
        risk_level = self._assess_risk_level(action, resource, success)

        event = AuditEvent(
            event_id=f"audit_{int(time.time())}_{secrets.token_hex(4)}",
            timestamp=datetime.utcnow(),
            user_id=user_id,
            tenant_id=tenant_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            details=details or {},
            risk_level=risk_level
        )

        self.log_audit_event(event)
        return event

    def _assess_risk_level(self, action: str, resource: str, success: bool) -> str:
        """Assess risk level of audit event."""
        if not success:
            return "high"

        high_risk_actions = ['delete', 'modify_admin', 'export_sensitive', 'access_restricted']
        high_risk_resources = ['user_data', 'admin_settings', 'security_config']

        if action in high_risk_actions or resource in high_risk_resources:
            return "medium"

        return "low"

    def get_audit_trail(self, user_id: Optional[str] = None,
                       tenant_id: Optional[str] = None,
                       resource: Optional[str] = None,
                       limit: int = 100) -> List[AuditEvent]:
        """Get audit trail with optional filtering."""
        events = self.audit_events

        if user_id:
            events = [e for e in events if e.user_id == user_id]
        if tenant_id:
            events = [e for e in events if e.tenant_id == tenant_id]
        if resource:
            events = [e for e in events if e.resource == resource]

        # Return most recent events
        return sorted(events, key=lambda x: x.timestamp, reverse=True)[:limit]

    # ============================================================================
    # RATE LIMITING
    # ============================================================================

    def check_rate_limit(self, user_id: str, endpoint: str,
                        limit: int = 100, window_seconds: int = 60) -> bool:
        """Check if user has exceeded rate limit."""
        now = time.time()
        window_start = now - window_seconds

        # Initialize user rate limit data
        if user_id not in self.rate_limit_windows:
            self.rate_limit_windows[user_id] = {}

        if endpoint not in self.rate_limit_windows[user_id]:
            self.rate_limit_windows[user_id][endpoint] = []

        # Clean old requests outside the window
        requests = self.rate_limit_windows[user_id][endpoint]
        self.rate_limit_windows[user_id][endpoint] = [
            req_time for req_time in requests if req_time > window_start
        ]

        # Check if under limit
        if len(self.rate_limit_windows[user_id][endpoint]) < limit:
            self.rate_limit_windows[user_id][endpoint].append(now)
            return True

        return False

    def get_rate_limit_status(self, user_id: str, endpoint: str,
                             limit: int = 100, window_seconds: int = 60) -> Dict[str, Any]:
        """Get current rate limit status for user."""
        now = time.time()
        window_start = now - window_seconds

        if user_id not in self.rate_limit_windows:
            return {"requests_used": 0, "limit": limit, "remaining": limit, "reset_in": window_seconds}

        if endpoint not in self.rate_limit_windows[user_id]:
            return {"requests_used": 0, "limit": limit, "remaining": limit, "reset_in": window_seconds}

        requests = self.rate_limit_windows[user_id][endpoint]
        valid_requests = [req_time for req_time in requests if req_time > window_start]

        requests_used = len(valid_requests)
        remaining = max(0, limit - requests_used)

        # Calculate reset time
        if valid_requests:
            oldest_request = min(valid_requests)
            reset_in = int(window_seconds - (now - oldest_request))
        else:
            reset_in = window_seconds

        return {
            "requests_used": requests_used,
            "limit": limit,
            "remaining": remaining,
            "reset_in": reset_in
        }

    # ============================================================================
    # SESSION MANAGEMENT
    # ============================================================================

    def create_session(self, user_id: str, tenant_id: str,
                      ip_address: str, user_agent: str) -> str:
        """Create a new user session."""
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
            "is_active": True
        }

        self.active_sessions[session_id] = session_data
        return session_id

    def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Validate session and return session data."""
        if session_id not in self.active_sessions:
            return None

        session = self.active_sessions[session_id]
        if not session.get("is_active", False):
            return None

        # Update last activity
        session["last_activity"] = datetime.utcnow().isoformat()
        return session

    def invalidate_session(self, session_id: str):
        """Invalidate a user session."""
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["is_active"] = False
            logger.info(f"Session invalidated: {session_id}")

    def cleanup_expired_sessions(self, max_age_hours: int = 24):
        """Clean up expired sessions."""
        now = datetime.utcnow()
        expired_sessions = []

        for session_id, session_data in self.active_sessions.items():
            last_activity = datetime.fromisoformat(session_data["last_activity"])
            if (now - last_activity).total_seconds() > (max_age_hours * 3600):
                expired_sessions.append(session_id)

        for session_id in expired_sessions:
            del self.active_sessions[session_id]

        if expired_sessions:
            logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")

    # ============================================================================
    # COMPLIANCE & GDPR
    # ============================================================================

    def check_gdpr_compliance(self, data_processing: Dict[str, Any]) -> Dict[str, Any]:
        """Check GDPR compliance for data processing operations."""
        compliance_check = {
            "compliant": True,
            "issues": [],
            "recommendations": []
        }

        # Check data retention
        if 'retention_days' in data_processing:
            retention = data_processing['retention_days']
            if retention > 2555:  # 7 years max for some data
                compliance_check["compliant"] = False
                compliance_check["issues"].append("Data retention period exceeds GDPR limits")

        # Check consent requirements
        if data_processing.get('contains_pii', False):
            if not data_processing.get('user_consent_obtained', False):
                compliance_check["compliant"] = False
                compliance_check["issues"].append("PII data processing requires explicit user consent")
                compliance_check["recommendations"].append("Implement consent management system")

        # Check data minimization
        if data_processing.get('data_fields', []):
            unnecessary_fields = ['unnecessary_pii', 'excessive_tracking']
            for field in unnecessary_fields:
                if field in data_processing['data_fields']:
                    compliance_check["issues"].append(f"Field '{field}' may violate data minimization principle")

        return compliance_check

    def apply_privacy_filters(self, data: Dict[str, Any],
                            user_permissions: UserPermissions) -> Dict[str, Any]:
        """Apply privacy filters to data based on user permissions."""
        filtered_data = data.copy()

        # Remove restricted metrics
        if 'metrics' in filtered_data:
            filtered_data['metrics'] = [
                metric for metric in filtered_data['metrics']
                if metric.get('type', '') not in user_permissions.restricted_metrics
            ]

        # Anonymize PII if user doesn't have permission to view user data
        if not user_permissions.can_view_user_data:
            if 'user_data' in filtered_data:
                filtered_data['user_data'] = [
                    self.anonymize_user_data(user) for user in filtered_data['user_data']
                ]

        return filtered_data

