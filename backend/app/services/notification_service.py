"""
Enhanced Notification Service

Handles error notifications, alerts, and recovery status updates.
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import redis.asyncio as redis
from app.exceptions import BaseAppException, ErrorSeverity


class NotificationType(str, Enum):
    """Types of notifications."""

    ERROR_ALERT = "error_alert"
    RECOVERY_SUCCESS = "recovery_success"
    RECOVERY_FAILURE = "recovery_failure"
    SYSTEM_HEALTH = "system_health"
    CORRELATION_DETECTED = "correlation_detected"
    THRESHOLD_EXCEEDED = "threshold_exceeded"


class NotificationChannel(str, Enum):
    """Notification delivery channels."""

    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    IN_APP = "in_app"
    SMS = "sms"


class NotificationPriority(str, Enum):
    """Notification priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class NotificationRule:
    """Rule for when to send notifications."""

    id: str
    name: str
    description: str
    enabled: bool
    conditions: Dict[str, Any]
    channels: List[NotificationChannel]
    recipients: List[str]
    throttle_minutes: int = 0
    created_at: datetime = None


@dataclass
class Notification:
    """Notification message."""

    id: str
    type: NotificationType
    priority: NotificationPriority
    title: str
    message: str
    data: Dict[str, Any]
    channels: List[NotificationChannel]
    recipients: List[str]
    created_at: datetime
    sent_at: Optional[datetime] = None
    status: str = "pending"
    error_message: Optional[str] = None


class NotificationService:
    """Service for handling error notifications and alerts."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
        self.notification_rules = {}
        self.throttle_cache = {}

        # Initialize default notification rules
        self._initialize_default_rules()

    def _initialize_default_rules(self) -> None:
        """Initialize default notification rules."""

        # Critical error alerts
        self.notification_rules["critical_errors"] = NotificationRule(
            id="critical_errors",
            name="Critical Error Alerts",
            description="Alert on critical severity errors",
            enabled=True,
            conditions={
                "severity": ["critical"],
                "categories": ["system", "database", "ai_service"],
            },
            channels=[NotificationChannel.EMAIL, NotificationChannel.SLACK],
            recipients=["admin@company.com", "#alerts"],
            throttle_minutes=5,
        )

        # Error rate spike alerts
        self.notification_rules["error_spike"] = NotificationRule(
            id="error_spike",
            name="Error Rate Spike",
            description="Alert when error rate increases significantly",
            enabled=True,
            conditions={
                "error_rate_increase": 200,  # 200% increase
                "time_window": 60,  # minutes
            },
            channels=[NotificationChannel.SLACK, NotificationChannel.IN_APP],
            recipients=["#monitoring"],
            throttle_minutes=15,
        )

        # Recovery notifications
        self.notification_rules["recovery_status"] = NotificationRule(
            id="recovery_status",
            name="Recovery Status Updates",
            description="Notify on automated recovery attempts",
            enabled=True,
            conditions={"recovery_actions": ["restart", "scale", "fallback"]},
            channels=[NotificationChannel.IN_APP, NotificationChannel.SLACK],
            recipients=["#ops"],
            throttle_minutes=0,
        )

        # Correlation alerts
        self.notification_rules["correlations"] = NotificationRule(
            id="correlations",
            name="Error Correlation Alerts",
            description="Alert when error correlations are detected",
            enabled=True,
            conditions={
                "correlation_confidence": 0.7,
                "affected_systems": 2,  # minimum systems affected
            },
            channels=[NotificationChannel.EMAIL, NotificationChannel.SLACK],
            recipients=["admin@company.com", "#alerts"],
            throttle_minutes=10,
        )

    async def send_error_notification(
        self, error: BaseAppException, context: Dict[str, Any] = None
    ) -> None:
        """Send notification for an error based on rules."""
        try:
            context = context or {}

            # Check which rules apply to this error
            applicable_rules = await self._get_applicable_rules(error, context)

            for rule in applicable_rules:
                # Check throttling
                if await self._is_throttled(rule.id, error.code):
                    continue

                # Create notification
                notification = await self._create_error_notification(
                    error, rule, context
                )

                # Send notification
                await self._send_notification(notification)

                # Update throttle cache
                await self._update_throttle_cache(rule.id, error.code)

        except Exception as e:
            self.logger.error(f"Failed to send error notification: {e}")

    async def send_recovery_notification(
        self, recovery_type: str, success: bool, details: Dict[str, Any]
    ) -> None:
        """Send notification about recovery attempt."""
        try:
            notification_type = (
                NotificationType.RECOVERY_SUCCESS
                if success
                else NotificationType.RECOVERY_FAILURE
            )

            rule = self.notification_rules.get("recovery_status")
            if not rule or not rule.enabled:
                return

            notification = Notification(
                id=f"recovery_{datetime.utcnow().timestamp()}",
                type=notification_type,
                priority=(
                    NotificationPriority.MEDIUM
                    if success
                    else NotificationPriority.HIGH
                ),
                title=f"Recovery {'Successful' if success else 'Failed'}: {recovery_type}",
                message=self._format_recovery_message(recovery_type, success, details),
                data=details,
                channels=rule.channels,
                recipients=rule.recipients,
                created_at=datetime.utcnow(),
            )

            await self._send_notification(notification)

        except Exception as e:
            self.logger.error(f"Failed to send recovery notification: {e}")

    async def send_correlation_notification(
        self, correlation_data: Dict[str, Any]
    ) -> None:
        """Send notification about detected error correlation."""
        try:
            rule = self.notification_rules.get("correlations")
            if not rule or not rule.enabled:
                return

            # Check if correlation meets rule conditions
            confidence = correlation_data.get("confidence", 0)
            affected_systems = len(correlation_data.get("affected_systems", []))

            if confidence < rule.conditions.get(
                "correlation_confidence", 0.7
            ) or affected_systems < rule.conditions.get("affected_systems", 2):
                return

            notification = Notification(
                id=f"correlation_{datetime.utcnow().timestamp()}",
                type=NotificationType.CORRELATION_DETECTED,
                priority=NotificationPriority.HIGH,
                title=f"Error Correlation Detected: {correlation_data.get('pattern', 'Unknown')}",
                message=self._format_correlation_message(correlation_data),
                data=correlation_data,
                channels=rule.channels,
                recipients=rule.recipients,
                created_at=datetime.utcnow(),
            )

            await self._send_notification(notification)

        except Exception as e:
            self.logger.error(f"Failed to send correlation notification: {e}")

    async def send_health_notification(
        self, health_status: str, metrics: Dict[str, Any]
    ) -> None:
        """Send system health notification."""
        try:
            if health_status in ["healthy", "warning"]:
                return  # Only notify on degraded/critical states

            priority = (
                NotificationPriority.CRITICAL
                if health_status == "critical"
                else NotificationPriority.HIGH
            )

            notification = Notification(
                id=f"health_{datetime.utcnow().timestamp()}",
                type=NotificationType.SYSTEM_HEALTH,
                priority=priority,
                title=f"System Health Alert: {health_status.title()}",
                message=self._format_health_message(health_status, metrics),
                data={"health_status": health_status, "metrics": metrics},
                channels=[NotificationChannel.SLACK, NotificationChannel.EMAIL],
                recipients=["admin@company.com", "#alerts"],
                created_at=datetime.utcnow(),
            )

            await self._send_notification(notification)

        except Exception as e:
            self.logger.error(f"Failed to send health notification: {e}")

    async def _get_applicable_rules(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> List[NotificationRule]:
        """Get notification rules that apply to this error."""
        applicable_rules = []

        for rule in self.notification_rules.values():
            if not rule.enabled:
                continue

            # Check severity condition
            if "severity" in rule.conditions:
                if error.severity.value not in rule.conditions["severity"]:
                    continue

            # Check category condition
            if "categories" in rule.conditions:
                if error.category.value not in rule.conditions["categories"]:
                    continue

            # Check custom conditions
            if await self._check_custom_conditions(rule, error, context):
                applicable_rules.append(rule)

        return applicable_rules

    async def _check_custom_conditions(
        self, rule: NotificationRule, error: BaseAppException, context: Dict[str, Any]
    ) -> bool:
        """Check custom rule conditions."""
        # For error spike detection
        if rule.id == "error_spike":
            return await self._check_error_spike_condition(rule.conditions)

        return True

    async def _check_error_spike_condition(self, conditions: Dict[str, Any]) -> bool:
        """Check if error rate spike condition is met."""
        try:
            # Get current and previous hour error counts
            current_hour = datetime.utcnow().strftime("%Y-%m-%d-%H")
            prev_hour = (
                datetime.utcnow().replace(minute=0, second=0, microsecond=0)
                - timedelta(hours=1)
            ).strftime("%Y-%m-%d-%H")

            current_count = (
                await self.redis.get(f"metrics_hour:{current_hour}:total") or 0
            )
            prev_count = await self.redis.get(f"metrics_hour:{prev_hour}:total") or 0

            current_count = int(current_count)
            prev_count = int(prev_count)

            if prev_count == 0:
                return current_count > 10  # Spike if >10 errors from 0

            increase_percentage = ((current_count - prev_count) / prev_count) * 100
            return increase_percentage >= conditions.get("error_rate_increase", 200)

        except Exception as e:
            self.logger.error(f"Failed to check error spike condition: {e}")
            return False

    async def _is_throttled(self, rule_id: str, error_code: str) -> bool:
        """Check if notification is throttled."""
        throttle_key = f"throttle:{rule_id}:{error_code}"
        return await self.redis.exists(throttle_key)

    async def _update_throttle_cache(self, rule_id: str, error_code: str) -> None:
        """Update throttle cache for rule and error code."""
        rule = self.notification_rules.get(rule_id)
        if rule and rule.throttle_minutes > 0:
            throttle_key = f"throttle:{rule_id}:{error_code}"
            await self.redis.setex(throttle_key, rule.throttle_minutes * 60, "1")

    async def _create_error_notification(
        self, error: BaseAppException, rule: NotificationRule, context: Dict[str, Any]
    ) -> Notification:
        """Create notification for an error."""
        priority_map = {
            ErrorSeverity.LOW: NotificationPriority.LOW,
            ErrorSeverity.MEDIUM: NotificationPriority.MEDIUM,
            ErrorSeverity.HIGH: NotificationPriority.HIGH,
            ErrorSeverity.CRITICAL: NotificationPriority.CRITICAL,
        }

        return Notification(
            id=f"error_{datetime.utcnow().timestamp()}",
            type=NotificationType.ERROR_ALERT,
            priority=priority_map.get(error.severity, NotificationPriority.MEDIUM),
            title=f"Error Alert: {error.code}",
            message=self._format_error_message(error, context),
            data={
                "error_code": error.code,
                "error_message": error.message,
                "category": error.category.value,
                "severity": error.severity.value,
                "retryable": error.retryable,
                "context": context,
            },
            channels=rule.channels,
            recipients=rule.recipients,
            created_at=datetime.utcnow(),
        )

    def _format_error_message(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> str:
        """Format error message for notification."""
        message_parts = [
            f"**Error Code:** {error.code}",
            f"**Severity:** {error.severity.value.title()}",
            f"**Category:** {error.category.value.title()}",
            f"**Message:** {error.message}",
        ]

        if error.retryable:
            message_parts.append("**Retryable:** Yes")

        if context:
            if "workflow_id" in context:
                message_parts.append(f"**Workflow ID:** {context['workflow_id']}")
            if "execution_id" in context:
                message_parts.append(f"**Execution ID:** {context['execution_id']}")
            if "user_id" in context:
                message_parts.append(f"**User ID:** {context['user_id']}")

        message_parts.append(f"**Timestamp:** {datetime.utcnow().isoformat()}")

        return "\n".join(message_parts)

    def _format_recovery_message(
        self, recovery_type: str, success: bool, details: Dict[str, Any]
    ) -> str:
        """Format recovery notification message."""
        status = "✅ Successful" if success else "❌ Failed"

        message_parts = [
            f"**Recovery Action:** {recovery_type}",
            f"**Status:** {status}",
        ]

        if "correlation_id" in details:
            message_parts.append(f"**Correlation ID:** {details['correlation_id']}")

        if "affected_systems" in details:
            systems = ", ".join(details["affected_systems"])
            message_parts.append(f"**Affected Systems:** {systems}")

        if "duration" in details:
            message_parts.append(f"**Duration:** {details['duration']}s")

        if not success and "error" in details:
            message_parts.append(f"**Error:** {details['error']}")

        message_parts.append(f"**Timestamp:** {datetime.utcnow().isoformat()}")

        return "\n".join(message_parts)

    def _format_correlation_message(self, correlation_data: Dict[str, Any]) -> str:
        """Format correlation notification message."""
        message_parts = [
            f"**Pattern:** {correlation_data.get('pattern', 'Unknown')}",
            f"**Confidence:** {correlation_data.get('confidence', 0):.1%}",
            f"**Root Cause:** {correlation_data.get('root_cause', 'Unknown')}",
        ]

        affected_systems = correlation_data.get("affected_systems", [])
        if affected_systems:
            message_parts.append(f"**Affected Systems:** {', '.join(affected_systems)}")

        error_count = len(correlation_data.get("error_ids", []))
        message_parts.append(f"**Related Errors:** {error_count}")

        recovery_actions = correlation_data.get("recovery_actions", [])
        if recovery_actions:
            message_parts.append(f"**Recovery Actions:** {', '.join(recovery_actions)}")

        message_parts.append(f"**Timestamp:** {datetime.utcnow().isoformat()}")

        return "\n".join(message_parts)

    def _format_health_message(
        self, health_status: str, metrics: Dict[str, Any]
    ) -> str:
        """Format health notification message."""
        message_parts = [
            f"**System Status:** {health_status.title()}",
        ]

        if "error_rate" in metrics:
            message_parts.append(
                f"**Error Rate:** {metrics['error_rate']:.1f} errors/hour"
            )

        if "trend" in metrics:
            message_parts.append(f"**Trend:** {metrics['trend'].title()}")

        category_health = metrics.get("category_health", {})
        if category_health:
            unhealthy_categories = [
                f"{cat}: {status}"
                for cat, status in category_health.items()
                if status != "healthy"
            ]
            if unhealthy_categories:
                message_parts.append(
                    f"**Affected Categories:** {', '.join(unhealthy_categories)}"
                )

        message_parts.append(f"**Timestamp:** {datetime.utcnow().isoformat()}")

        return "\n".join(message_parts)

    async def _send_notification(self, notification: Notification) -> None:
        """Send notification through configured channels."""
        try:
            # Store notification
            await self._store_notification(notification)

            # Send through each channel
            for channel in notification.channels:
                try:
                    if channel == NotificationChannel.IN_APP:
                        await self._send_in_app_notification(notification)
                    elif channel == NotificationChannel.EMAIL:
                        await self._send_email_notification(notification)
                    elif channel == NotificationChannel.SLACK:
                        await self._send_slack_notification(notification)
                    elif channel == NotificationChannel.WEBHOOK:
                        await self._send_webhook_notification(notification)

                except Exception as e:
                    self.logger.error(f"Failed to send notification via {channel}: {e}")

            # Update notification status
            notification.sent_at = datetime.utcnow()
            notification.status = "sent"
            await self._update_notification_status(notification)

        except Exception as e:
            self.logger.error(f"Failed to send notification {notification.id}: {e}")
            notification.status = "failed"
            notification.error_message = str(e)
            await self._update_notification_status(notification)

    async def _store_notification(self, notification: Notification) -> None:
        """Store notification in Redis."""
        key = f"notification:{notification.id}"
        data = asdict(notification)
        data["created_at"] = notification.created_at.isoformat()
        if notification.sent_at:
            data["sent_at"] = notification.sent_at.isoformat()

        await self.redis.setex(key, 86400 * 7, json.dumps(data, default=str))  # 7 days

        # Add to notifications list
        await self.redis.lpush("notifications", notification.id)
        await self.redis.ltrim("notifications", 0, 999)  # Keep last 1000

    async def _update_notification_status(self, notification: Notification) -> None:
        """Update notification status."""
        key = f"notification:{notification.id}"
        data = asdict(notification)
        data["created_at"] = notification.created_at.isoformat()
        if notification.sent_at:
            data["sent_at"] = notification.sent_at.isoformat()

        await self.redis.setex(key, 86400 * 7, json.dumps(data, default=str))

    async def _send_in_app_notification(self, notification: Notification) -> None:
        """Send in-app notification."""
        # Store for real-time delivery via WebSocket
        in_app_data = {
            "id": notification.id,
            "type": notification.type.value,
            "priority": notification.priority.value,
            "title": notification.title,
            "message": notification.message,
            "timestamp": notification.created_at.isoformat(),
        }

        await self.redis.lpush("in_app_notifications", json.dumps(in_app_data))
        await self.redis.ltrim("in_app_notifications", 0, 99)  # Keep last 100

    async def _send_email_notification(self, notification: Notification) -> None:
        """Send email notification (placeholder)."""
        # In a real implementation, this would integrate with an email service
        self.logger.info(f"EMAIL: {notification.title} to {notification.recipients}")

    async def _send_slack_notification(self, notification: Notification) -> None:
        """Send Slack notification using real Slack service."""
        try:
            # Import here to avoid circular imports
            from app.services.slack_service import get_slack_service

            slack_service = get_slack_service()

            # Map notification types to appropriate Slack methods
            if notification.type == NotificationType.ERROR_ALERT:
                result = await slack_service.send_error_alert(
                    error_code=notification.data.get("error_code", "UNKNOWN"),
                    message=notification.message,
                    severity=notification.priority.value,
                )
            elif notification.type in [
                NotificationType.RECOVERY_SUCCESS,
                NotificationType.RECOVERY_FAILURE,
            ]:
                result = await slack_service.send_recovery_notification(
                    service=notification.data.get("service", "Unknown"),
                    status="recovered"
                    if notification.type == NotificationType.RECOVERY_SUCCESS
                    else "failed",
                    details=notification.data,
                )
            elif notification.type == NotificationType.SYSTEM_HEALTH:
                result = await slack_service.send_system_health_alert(
                    status=notification.data.get("health_status", "unknown"),
                    metrics=notification.data.get("metrics", {}),
                )
            else:
                # Generic notification
                result = await slack_service.send_custom_notification(
                    title=notification.title,
                    message=notification.message,
                    channel=notification.recipients[0]
                    if notification.recipients
                    else "#general",
                    priority=notification.priority.value,
                    metadata=notification.data,
                )

            if result.get("error"):
                self.logger.error(f"Slack notification failed: {result['error']}")
            else:
                self.logger.info(
                    f"Slack notification sent successfully: {notification.title}"
                )

        except Exception as e:
            self.logger.error(f"Failed to send Slack notification: {e}")
            # Fallback to simple logging
            self.logger.info(
                f"SLACK: {notification.title} to {notification.recipients}"
            )

    async def _send_webhook_notification(self, notification: Notification) -> None:
        """Send webhook notification (placeholder)."""
        # In a real implementation, this would send HTTP POST to webhook URLs
        self.logger.info(f"WEBHOOK: {notification.title}")

    async def get_recent_notifications(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent notifications."""
        try:
            notification_ids = await self.redis.lrange("notifications", 0, limit - 1)
            notifications = []

            for notification_id in notification_ids:
                key = f"notification:{notification_id.decode()}"
                data = await self.redis.get(key)
                if data:
                    notifications.append(json.loads(data))

            return notifications

        except Exception as e:
            self.logger.error(f"Failed to get recent notifications: {e}")
            return []

    async def get_notification_stats(self) -> Dict[str, Any]:
        """Get notification statistics."""
        try:
            # Get recent notifications for stats
            notifications = await self.get_recent_notifications(1000)

            # Calculate stats
            total_notifications = len(notifications)
            by_type = Counter(n["type"] for n in notifications)
            by_priority = Counter(n["priority"] for n in notifications)
            by_status = Counter(n["status"] for n in notifications)

            # Calculate success rate
            sent_count = sum(1 for n in notifications if n["status"] == "sent")
            success_rate = (
                (sent_count / total_notifications * 100)
                if total_notifications > 0
                else 0
            )

            return {
                "total_notifications": total_notifications,
                "success_rate": success_rate,
                "by_type": dict(by_type),
                "by_priority": dict(by_priority),
                "by_status": dict(by_status),
                "last_updated": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            self.logger.error(f"Failed to get notification stats: {e}")
            return {"error": str(e)}


# Global service instance
_notification_service: Optional[NotificationService] = None


async def get_notification_service() -> NotificationService:
    """Get or create notification service instance."""
    global _notification_service

    if _notification_service is None:
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=False)
        _notification_service = NotificationService(redis_client)

    return _notification_service
