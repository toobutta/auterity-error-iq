"""
NeuroWeaver Alert Manager
Handles performance alerts and notifications
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Dict, List

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(Enum):
    PERFORMANCE_DEGRADATION = "performance_degradation"
    MODEL_SWITCH = "model_switch"
    THRESHOLD_BREACH = "threshold_breach"
    NO_BACKUP_MODEL = "no_backup_model"


class Alert:
    def __init__(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        model_id: str,
        message: str,
        metadata: Dict = None,
    ):
        self.alert_type = alert_type
        self.severity = severity
        self.model_id = model_id
        self.message = message
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()
        self.resolved = False


class AlertManager:
    def __init__(self):
        self.active_alerts: List[Alert] = []
        self.alert_channels = {
            "console": True,
            "slack": False,  # Configure as needed
            "email": False,  # Configure as needed
        }

    async def create_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        model_id: str,
        message: str,
        metadata: Dict = None,
    ) -> Alert:
        """Create and process a new alert"""
        alert = Alert(alert_type, severity, model_id, message, metadata)

        # Check for duplicate alerts
        if not self._is_duplicate_alert(alert):
            self.active_alerts.append(alert)
            await self._send_alert_notifications(alert)

        return alert

    def _is_duplicate_alert(self, new_alert: Alert) -> bool:
        """Check if this alert is a duplicate of an existing active alert"""
        for alert in self.active_alerts:
            if (
                not alert.resolved
                and alert.alert_type == new_alert.alert_type
                and alert.model_id == new_alert.model_id
                and alert.severity == new_alert.severity
            ):
                return True
        return False

    async def _send_alert_notifications(self, alert: Alert):
        """Send alert through configured notification channels"""
        if self.alert_channels.get("console", True):
            await self._send_console_alert(alert)

        if self.alert_channels.get("slack", False):
            await self._send_slack_alert(alert)

        if self.alert_channels.get("email", False):
            await self._send_email_alert(alert)

    async def _send_console_alert(self, alert: Alert):
        """Send alert to console/logs"""
        log_level = {
            AlertSeverity.INFO: logger.info,
            AlertSeverity.WARNING: logger.warning,
            AlertSeverity.CRITICAL: logger.critical,
        }

        log_func = log_level.get(alert.severity, logger.info)
        log_func(
            f"ALERT [{alert.severity.value.upper()}] {alert.alert_type.value}: "
            f"Model {alert.model_id} - {alert.message}"
        )

    async def _send_slack_alert(self, alert: Alert):
        """Send alert to Slack (placeholder)"""
        # Implement Slack webhook integration
        logger.info(f"Slack alert would be sent: {alert.message}")

    async def _send_email_alert(self, alert: Alert):
        """Send alert via email (placeholder)"""
        # Implement email notification
        logger.info(f"Email alert would be sent: {alert.message}")

    async def resolve_alert(self, alert_id: str, resolution_message: str = ""):
        """Mark an alert as resolved"""
        for alert in self.active_alerts:
            if str(id(alert)) == alert_id:
                alert.resolved = True
                logger.info(f"Alert resolved: {alert.message} - {resolution_message}")
                break

    def get_active_alerts(self, model_id: str = None) -> List[Alert]:
        """Get active alerts, optionally filtered by model"""
        alerts = [a for a in self.active_alerts if not a.resolved]

        if model_id:
            alerts = [a for a in alerts if a.model_id == model_id]

        return alerts

    def get_alert_summary(self) -> Dict:
        """Get summary of alert status"""
        active_alerts = self.get_active_alerts()

        return {
            "total_active": len(active_alerts),
            "critical": len(
                [a for a in active_alerts if a.severity == AlertSeverity.CRITICAL]
            ),
            "warning": len(
                [a for a in active_alerts if a.severity == AlertSeverity.WARNING]
            ),
            "info": len([a for a in active_alerts if a.severity == AlertSeverity.INFO]),
            "by_model": self._group_alerts_by_model(active_alerts),
        }

    def _group_alerts_by_model(self, alerts: List[Alert]) -> Dict:
        """Group alerts by model ID"""
        grouped = {}
        for alert in alerts:
            if alert.model_id not in grouped:
                grouped[alert.model_id] = []
            grouped[alert.model_id].append(
                {
                    "type": alert.alert_type.value,
                    "severity": alert.severity.value,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                }
            )
        return grouped
