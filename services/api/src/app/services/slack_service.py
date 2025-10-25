"""
Real Slack Integration Service

Provides actual Slack API integration for notifications and alerts.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.config.settings import get_settings


class SlackService:
    """Real Slack integration service."""

    def __init__(self):
        """Initialize Slack service."""
        settings = get_settings()
        self.webhook_url = getattr(settings, "SLACK_WEBHOOK_URL", "")
        self.bot_token = getattr(settings, "SLACK_BOT_TOKEN", "")
        self.default_channel = getattr(
            settings, "SLACK_DEFAULT_CHANNEL", "#alerts"
        )
        self.logger = logging.getLogger(__name__)

        # Initialize HTTP client
        self.client = httpx.AsyncClient(timeout=30.0)

    async def send_message(
        self,
        message: str,
        channel: Optional[str] = None,
        username: Optional[str] = None,
        icon_emoji: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        blocks: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Send message to Slack channel."""
        try:
            if not self.webhook_url and not self.bot_token:
                return {"error": "Slack not configured"}

            channel = channel or self.default_channel
            username = username or "Auterity Bot"
            icon_emoji = icon_emoji or ":robot_face:"

            payload = {
                "text": message,
                "channel": channel,
                "username": username,
                "icon_emoji": icon_emoji,
                "mrkdwn": True,
            }

            if attachments:
                payload["attachments"] = attachments

            if blocks:
                payload["blocks"] = blocks

            # Use webhook if available (simpler)
            if self.webhook_url:
                response = await self.client.post(
                    self.webhook_url, json=payload
                )

                if response.status_code == 200:
                    return {
                        "status": "success",
                        "channel": channel,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                else:
                    return {
                        "error": f"Webhook failed: {response.status_code}",
                        "details": response.text,
                    }

            # Use Bot Token API
            elif self.bot_token:
                headers = {"Authorization": f"Bearer {self.bot_token}"}
                response = await self.client.post(
                    "https://slack.com/api/chat.postMessage",
                    headers=headers,
                    json=payload,
                )

                result = response.json()
                if result.get("ok"):
                    return {
                        "status": "success",
                        "message_ts": result.get("ts"),
                        "channel": result.get("channel"),
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                else:
                    return {"error": result.get("error", "Unknown error")}

        except Exception as e:
            self.logger.error(f"Failed to send Slack message: {e}")
            return {"error": str(e)}

    async def send_error_alert(
        self, error_code: str, message: str, severity: str = "high"
    ) -> Dict[str, Any]:
        """Send formatted error alert to Slack."""
        color_map = {
            "critical": "#ff0000",  # Red
            "high": "#ff8c00",  # Orange
            "medium": "#ffff00",  # Yellow
            "low": "#00ff00",  # Green
        }

        emoji_map = {
            "critical": ":rotating_light:",
            "high": ":warning:",
            "medium": ":large_orange_diamond:",
            "low": ":information_source:",
        }

        color = color_map.get(severity.lower(), "#808080")
        emoji = emoji_map.get(severity.lower(), ":exclamation:")

        attachments = [
            {
                "color": color,
                "fields": [
                    {
                        "title": "Error Code",
                        "value": error_code,
                        "short": True,
                    },
                    {
                        "title": "Severity",
                        "value": severity.upper(),
                        "short": True,
                    },
                    {"title": "Message", "value": message, "short": False},
                    {
                        "title": "Timestamp",
                        "value": datetime.utcnow().strftime(
                            "%Y-%m-%d %H:%M:%S UTC"
                        ),
                        "short": True,
                    },
                ],
                "footer": "Auterity Error Monitoring",
                "footer_icon": "https://cdn-icons-png.flaticon.com/512/2593/2593549.png",
            }
        ]

        alert_message = f"{emoji} *Error Alert: {error_code}*"
        return await self.send_message(
            message=alert_message, attachments=attachments, channel="#alerts"
        )

    async def send_recovery_notification(
        self, service: str, status: str, details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send service recovery notification."""
        emoji = ":white_check_mark:" if status == "recovered" else ":x:"
        color = "#00ff00" if status == "recovered" else "#ff0000"

        attachments = [
            {
                "color": color,
                "fields": [
                    {"title": "Service", "value": service, "short": True},
                    {
                        "title": "Status",
                        "value": status.upper(),
                        "short": True,
                    },
                    {
                        "title": "Recovery Time",
                        "value": f"{details.get('duration', 'N/A')} seconds",
                        "short": True,
                    },
                    {
                        "title": "Attempts",
                        "value": str(details.get("attempts", "N/A")),
                        "short": True,
                    },
                ],
                "footer": "Auterity Recovery System",
            }
        ]

        message = f"{emoji} *Service Recovery: {service}*"
        return await self.send_message(
            message=message, attachments=attachments, channel="#ops"
        )

    async def send_system_health_alert(
        self, status: str, metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Send system health status alert."""
        emoji_map = {
            "healthy": ":green_heart:",
            "warning": ":yellow_heart:",
            "degraded": ":orange_heart:",
            "critical": ":broken_heart:",
        }

        color_map = {
            "healthy": "#00ff00",
            "warning": "#ffff00",
            "degraded": "#ff8c00",
            "critical": "#ff0000",
        }

        emoji = emoji_map.get(status, ":question:")
        color = color_map.get(status, "#808080")

        fields = [
            {"title": "System Status", "value": status.upper(), "short": True},
            {
                "title": "Error Rate",
                "value": f"{metrics.get('error_rate', 0):.1f}/hour",
                "short": True,
            },
        ]

        # Add unhealthy services if any
        unhealthy_services = metrics.get("unhealthy_services", [])
        if unhealthy_services:
            fields.append(
                {
                    "title": "Affected Services",
                    "value": ", ".join(unhealthy_services),
                    "short": False,
                }
            )

        attachments = [
            {
                "color": color,
                "fields": fields,
                "footer": "Auterity Health Monitor",
            }
        ]

        message = f"{emoji} *System Health Update: {status.title()}*"
        return await self.send_message(
            message=message, attachments=attachments, channel="#monitoring"
        )

    async def send_deployment_notification(
        self, version: str, environment: str, status: str
    ) -> Dict[str, Any]:
        """Send deployment notification."""
        emoji = ":rocket:" if status == "success" else ":bomb:"
        color = "#00ff00" if status == "success" else "#ff0000"

        attachments = [
            {
                "color": color,
                "fields": [
                    {"title": "Version", "value": version, "short": True},
                    {
                        "title": "Environment",
                        "value": environment,
                        "short": True,
                    },
                    {
                        "title": "Status",
                        "value": status.upper(),
                        "short": True,
                    },
                    {
                        "title": "Deployed At",
                        "value": datetime.utcnow().strftime(
                            "%Y-%m-%d %H:%M:%S UTC"
                        ),
                        "short": True,
                    },
                ],
                "footer": "Auterity Deployment Pipeline",
            }
        ]

        message = f"{emoji} *Deployment {status.title()}: {version}*"
        return await self.send_message(
            message=message, attachments=attachments, channel="#deployments"
        )

    async def send_custom_notification(
        self,
        title: str,
        message: str,
        channel: str = "#general",
        priority: str = "normal",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Send custom formatted notification."""
        priority_colors = {
            "low": "#00ff00",
            "normal": "#0099ff",
            "high": "#ff8c00",
            "critical": "#ff0000",
        }

        priority_emojis = {
            "low": ":information_source:",
            "normal": ":bell:",
            "high": ":warning:",
            "critical": ":rotating_light:",
        }

        color = priority_colors.get(priority, "#808080")
        emoji = priority_emojis.get(priority, ":bell:")

        fields = [
            {"title": "Priority", "value": priority.upper(), "short": True},
            {
                "title": "Timestamp",
                "value": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
                "short": True,
            },
        ]

        # Add metadata fields if provided
        if metadata:
            for key, value in metadata.items():
                fields.append(
                    {"title": key.title(), "value": str(value), "short": True}
                )

        attachments = [
            {
                "color": color,
                "title": title,
                "text": message,
                "fields": fields,
                "footer": "Auterity Platform",
            }
        ]

        alert_message = f"{emoji} *{title}*"
        return await self.send_message(
            message=alert_message, attachments=attachments, channel=channel
        )

    async def get_channel_info(self, channel: str) -> Dict[str, Any]:
        """Get information about a Slack channel."""
        if not self.bot_token:
            return {"error": "Bot token required for channel info"}

        try:
            headers = {"Authorization": f"Bearer {self.bot_token}"}
            response = await self.client.get(
                f"https://slack.com/api/conversations.info?channel={channel}",
                headers=headers,
            )

            result = response.json()
            if result.get("ok"):
                return {"status": "success", "channel": result.get("channel")}
            else:
                return {"error": result.get("error", "Unknown error")}

        except Exception as e:
            return {"error": str(e)}

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global Slack service instance
_slack_service: Optional[SlackService] = None


def get_slack_service() -> SlackService:
    """Get global Slack service instance."""
    global _slack_service

    if _slack_service is None:
        _slack_service = SlackService()

    return _slack_service
