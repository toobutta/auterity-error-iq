"""
Security Manager for Auterity Agent System

This module provides enterprise-grade security for all agent operations:
- Authentication and authorization
- Data encryption and protection
- Secure communication channels
- Threat detection and prevention
- Security monitoring and alerting
"""

import base64
import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class ThreatLevel:
    """Threat level constants"""

    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class SecurityManager:
    """
    Enterprise security manager for Auterity agent operations

    Provides:
    - Encryption/decryption of sensitive data
    - Secure token generation and validation
    - Threat detection and monitoring
    - Access control enforcement
    - Security audit logging
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.encryption_key = self._initialize_encryption()
        self.jwt_secret = self.config.get(
            "jwt_secret", secrets.token_urlsafe(32)
        )
        self.threat_patterns = self._load_threat_patterns()
        self.security_events = []
        self.blocked_ips = set()
        self.rate_limits = {}

        logger.info("Security manager initialized")

    def _initialize_encryption(self) -> Fernet:
        """Initialize encryption key for data protection"""

        password = self.config.get(
            "encryption_password", "auterity-default-key"
        ).encode()
        salt = self.config.get("encryption_salt", b"auterity-salt")

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )

        key = base64.urlsafe_b64encode(kdf.derive(password))
        return Fernet(key)

    def _load_threat_patterns(self) -> Dict[str, List[str]]:
        """Load threat detection patterns"""

        return {
            "sql_injection": [
                r"(\bunion\b.*\bselect\b)",
                r"(\bselect\b.*\bfrom\b.*\bwhere\b)",
                r"(\bdrop\b.*\btable\b)",
                r"(\binsert\b.*\binto\b.*\bvalues\b)",
            ],
            "xss": [
                r"<script[^>]*>.*?</script>",
                r"javascript:",
                r"on\w+\s*=",
                r"<iframe[^>]*>.*?</iframe>",
            ],
            "command_injection": [
                r";\s*(rm|del|format|shutdown)",
                r"\|\s*(cat|type|more)",
                r"&&\s*(rm|del|format)",
                r"`.*`",
            ],
            "path_traversal": [r"\.\./", r"\.\.\\", r"%2e%2e%2f", r"..%2f"],
        }

    async def authenticate_request(
        self, token: str, required_permissions: List[str] = None
    ) -> Dict[str, Any]:
        """Authenticate and authorize a request"""

        try:
            # Decode JWT token
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])

            # Check token expiration
            if payload.get("exp", 0) < datetime.now(timezone.utc).timestamp():
                return {"authenticated": False, "error": "Token expired"}

            user_id = payload.get("user_id")
            tenant_id = payload.get("tenant_id")
            permissions = payload.get("permissions", [])

            # Check required permissions
            if required_permissions:
                missing_permissions = set(required_permissions) - set(
                    permissions
                )
                if missing_permissions:
                    return {
                        "authenticated": False,
                        "error": f"Missing permissions: {list(missing_permissions)}",
                    }

            # Log successful authentication
            await self._log_security_event(
                {
                    "event_type": "authentication_success",
                    "user_id": user_id,
                    "tenant_id": tenant_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

            return {
                "authenticated": True,
                "user_id": user_id,
                "tenant_id": tenant_id,
                "permissions": permissions,
            }

        except jwt.InvalidTokenError as e:
            await self._log_security_event(
                {
                    "event_type": "authentication_failure",
                    "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

            return {"authenticated": False, "error": "Invalid token"}

    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""

        try:
            encrypted = self.encryption_key.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise

    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""

        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.encryption_key.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise

    def generate_secure_token(
        self,
        user_id: str,
        tenant_id: str,
        permissions: List[str],
        expires_in_hours: int = 24,
    ) -> str:
        """Generate secure JWT token"""

        payload = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "permissions": permissions,
            "iat": datetime.now(timezone.utc).timestamp(),
            "exp": (
                datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
            ).timestamp(),
        }

        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")

    def generate_token(self, user_data: Dict[str, Any]) -> str:
        """Simple token generation for testing and basic use"""
        user_id = user_data.get("user_id", "unknown")
        tenant_id = user_data.get("tenant_id", "default")
        permissions = user_data.get("permissions", [])

        return self.generate_secure_token(user_id, tenant_id, permissions)

    def validate_token(self, token: str) -> Dict[str, Any]:
        """Validate a JWT token"""
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])

            # Check if token is expired
            current_time = datetime.now(timezone.utc).timestamp()
            if payload.get("exp", 0) < current_time:
                return {"valid": False, "error": "Token expired"}

            return {
                "valid": True,
                "user_id": payload.get("user_id"),
                "tenant_id": payload.get("tenant_id"),
                "permissions": payload.get("permissions", []),
            }

        except jwt.InvalidTokenError as e:
            return {"valid": False, "error": str(e)}

    def detect_threat(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Simple threat detection for testing"""
        ip_address = request_data.get("ip_address")
        request_count = request_data.get("request_count", 0)

        # Simple rate limiting logic
        threat_detected = request_count > 100
        threat_level = "high" if threat_detected else "low"

        actions_taken = []
        if threat_detected and ip_address:
            self.blocked_ips.add(ip_address)
            actions_taken.append(f"Blocked IP {ip_address}")

        return {
            "threat_detected": threat_detected,
            "threat_level": threat_level,
            "actions_taken": actions_taken,
        }

    async def detect_threats(
        self, input_data: Dict[str, Any], source_ip: str = None
    ) -> Dict[str, Any]:
        """Detect potential security threats in input data"""

        threats_detected = []
        threat_level = ThreatLevel.LOW

        # Convert input data to string for pattern matching
        data_str = str(input_data)

        # Check for known threat patterns
        for threat_type, patterns in self.threat_patterns.items():
            for pattern in patterns:
                if re.search(pattern, data_str, re.IGNORECASE):
                    threats_detected.append(
                        {
                            "type": threat_type,
                            "pattern": pattern,
                            "severity": (
                                "high"
                                if threat_type
                                in ["sql_injection", "command_injection"]
                                else "medium"
                            ),
                        }
                    )
                    threat_level = max(
                        threat_level,
                        (
                            ThreatLevel.HIGH
                            if threat_type
                            in ["sql_injection", "command_injection"]
                            else ThreatLevel.MEDIUM
                        ),
                    )

        # Check rate limiting if source IP provided
        if source_ip:
            rate_limit_result = await self._check_rate_limit(source_ip)
            if not rate_limit_result["allowed"]:
                threats_detected.append(
                    {"type": "rate_limit_exceeded", "severity": "medium"}
                )
                threat_level = max(threat_level, ThreatLevel.MEDIUM)

        # Log security event if threats detected
        if threats_detected:
            await self._log_security_event(
                {
                    "event_type": "threat_detected",
                    "threats": threats_detected,
                    "threat_level": threat_level,
                    "source_ip": source_ip,
                    "input_data_hash": hashlib.sha256(
                        str(input_data).encode()
                    ).hexdigest(),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )

        return {
            "threats_detected": len(threats_detected) > 0,
            "threats": threats_detected,
            "threat_level": threat_level,
            "action_required": threat_level >= ThreatLevel.HIGH,
        }

    async def _check_rate_limit(self, source_ip: str) -> Dict[str, Any]:
        """Check rate limiting for source IP"""

        current_time = datetime.now(timezone.utc)
        window_minutes = 10
        max_requests = 100

        # Clean old entries
        cutoff_time = current_time - timedelta(minutes=window_minutes)

        if source_ip not in self.rate_limits:
            self.rate_limits[source_ip] = []

        # Remove old timestamps
        self.rate_limits[source_ip] = [
            timestamp
            for timestamp in self.rate_limits[source_ip]
            if timestamp > cutoff_time
        ]

        # Check if limit exceeded
        if len(self.rate_limits[source_ip]) >= max_requests:
            # Add to blocked IPs if severely exceeding
            if len(self.rate_limits[source_ip]) > max_requests * 2:
                self.blocked_ips.add(source_ip)

            return {
                "allowed": False,
                "requests_in_window": len(self.rate_limits[source_ip]),
                "max_requests": max_requests,
                "window_minutes": window_minutes,
            }

        # Add current request
        self.rate_limits[source_ip].append(current_time)

        return {
            "allowed": True,
            "requests_in_window": len(self.rate_limits[source_ip]),
            "max_requests": max_requests,
            "window_minutes": window_minutes,
        }

    async def _log_security_event(self, event: Dict[str, Any]):
        """Log security event for monitoring and audit"""

        event["event_id"] = secrets.token_hex(8)
        self.security_events.append(event)

        # Keep only recent events in memory (last 1000)
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]

        # Log critical events
        if event.get("threat_level", ThreatLevel.LOW) >= ThreatLevel.HIGH:
            logger.warning(f"High threat detected: {event}")

        # In production, this would send to SIEM or security monitoring system
        logger.info(f"Security event: {event['event_type']}")

    def hash_password(self, password: str, salt: str = None) -> Dict[str, str]:
        """Hash password securely"""

        if not salt:
            salt = secrets.token_hex(16)

        # Use PBKDF2 for password hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
        )

        hashed = base64.urlsafe_b64encode(
            kdf.derive(password.encode())
        ).decode()

        return {"hash": hashed, "salt": salt}

    def verify_password(
        self, password: str, stored_hash: str, salt: str
    ) -> bool:
        """Verify password against stored hash"""

        try:
            computed_hash = self.hash_password(password, salt)["hash"]
            return secrets.compare_digest(computed_hash, stored_hash)
        except Exception:
            return False

    def sanitize_input(self, input_data: str) -> str:
        """Sanitize input to prevent injection attacks"""

        # Remove potential SQL injection patterns
        sanitized = re.sub(r"[';\"\\]", "", input_data)

        # Remove script tags and javascript
        sanitized = re.sub(
            r"<script[^>]*>.*?</script>",
            "",
            sanitized,
            flags=re.IGNORECASE | re.DOTALL,
        )
        sanitized = re.sub(r"javascript:", "", sanitized, flags=re.IGNORECASE)

        # Remove potential command injection patterns
        sanitized = re.sub(r"[;&|`$()]", "", sanitized)

        return sanitized.strip()

    async def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics for monitoring"""

        recent_events = [
            event
            for event in self.security_events
            if datetime.fromisoformat(event["timestamp"])
            > datetime.now(timezone.utc) - timedelta(hours=24)
        ]

        threat_events = [
            event
            for event in recent_events
            if event.get("event_type") == "threat_detected"
        ]

        auth_failures = [
            event
            for event in recent_events
            if event.get("event_type") == "authentication_failure"
        ]

        return {
            "total_security_events_24h": len(recent_events),
            "threat_detections_24h": len(threat_events),
            "auth_failures_24h": len(auth_failures),
            "blocked_ips": len(self.blocked_ips),
            "rate_limited_ips": len(self.rate_limits),
            "high_threat_events": len(
                [
                    event
                    for event in threat_events
                    if event.get("threat_level", ThreatLevel.LOW)
                    >= ThreatLevel.HIGH
                ]
            ),
        }

    def is_ip_blocked(self, ip_address: str) -> bool:
        """Check if IP address is blocked"""
        return ip_address in self.blocked_ips

    def unblock_ip(self, ip_address: str) -> bool:
        """Unblock an IP address"""
        if ip_address in self.blocked_ips:
            self.blocked_ips.remove(ip_address)
            return True
        return False
