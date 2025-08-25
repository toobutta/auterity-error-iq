"""Email automation service with SendGrid and Mailgun support."""

import base64
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
import sendgrid
from app.config.settings import get_settings
from sendgrid.helpers.mail import Attachment, Content, Email, Mail, To


class EmailService:
    """Email automation service."""

    def __init__(self):
        """Initialize email service."""
        settings = get_settings()
        self.sendgrid_api_key = getattr(settings, "SENDGRID_API_KEY", "")
        self.mailgun_api_key = getattr(settings, "MAILGUN_API_KEY", "")
        self.mailgun_domain = getattr(settings, "MAILGUN_DOMAIN", "")
        self.default_from_email = getattr(
            settings, "DEFAULT_FROM_EMAIL", "noreply@auterity.com"
        )

        # Initialize SendGrid client
        if self.sendgrid_api_key:
            self.sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
        else:
            self.sg = None

    def send_email_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_email: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Send email via SendGrid."""
        if not self.sg:
            return {"error": "SendGrid not configured"}

        try:
            from_email_obj = Email(from_email or self.default_from_email)
            to_email_obj = To(to_email)

            mail = Mail(
                from_email=from_email_obj,
                to_emails=to_email_obj,
                subject=subject,
                html_content=html_content,
            )

            if plain_content:
                mail.content = [
                    Content("text/plain", plain_content),
                    Content("text/html", html_content),
                ]

            # Add attachments
            if attachments:
                for attachment_data in attachments:
                    attachment = Attachment()
                    attachment.file_content = base64.b64encode(
                        attachment_data["content"]
                    ).decode()
                    attachment.file_type = attachment_data.get(
                        "type", "application/octet-stream"
                    )
                    attachment.file_name = attachment_data["filename"]
                    mail.attachment = [attachment]

            response = self.sg.send(mail)

            return {
                "status_code": response.status_code,
                "message_id": response.headers.get("X-Message-Id"),
                "to": to_email,
                "subject": subject,
                "timestamp": datetime.utcnow().isoformat(),
                "provider": "sendgrid",
            }
        except Exception as e:
            return {"error": str(e), "provider": "sendgrid"}

    def send_email_mailgun(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_email: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Send email via Mailgun."""
        if not self.mailgun_api_key or not self.mailgun_domain:
            return {"error": "Mailgun not configured"}

        try:
            url = f"https://api.mailgun.net/v3/{self.mailgun_domain}/messages"

            data = {
                "from": from_email or self.default_from_email,
                "to": to_email,
                "subject": subject,
                "html": html_content,
            }

            if plain_content:
                data["text"] = plain_content

            files = []
            if attachments:
                for attachment_data in attachments:
                    files.append(
                        (
                            "attachment",
                            (
                                attachment_data["filename"],
                                attachment_data["content"],
                                attachment_data.get("type", "application/octet-stream"),
                            ),
                        )
                    )

            response = requests.post(
                url,
                auth=("api", self.mailgun_api_key),
                data=data,
                files=files if files else None,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "status_code": response.status_code,
                    "message_id": result.get("id"),
                    "message": result.get("message"),
                    "to": to_email,
                    "subject": subject,
                    "timestamp": datetime.utcnow().isoformat(),
                    "provider": "mailgun",
                }
            else:
                return {
                    "error": f"Mailgun API error: {response.status_code}",
                    "details": response.text,
                    "provider": "mailgun",
                }
        except Exception as e:
            return {"error": str(e), "provider": "mailgun"}

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        from_email: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        provider: str = "sendgrid",
    ) -> Dict[str, Any]:
        """Send email using specified provider."""
        if provider == "sendgrid":
            return self.send_email_sendgrid(
                to_email, subject, html_content, plain_content, from_email, attachments
            )
        elif provider == "mailgun":
            return self.send_email_mailgun(
                to_email, subject, html_content, plain_content, from_email, attachments
            )
        else:
            return {"error": f"Unknown provider: {provider}"}

    def send_bulk_email(
        self,
        recipients: List[Dict[str, str]],
        subject_template: str,
        html_template: str,
        plain_template: Optional[str] = None,
        provider: str = "sendgrid",
    ) -> List[Dict[str, Any]]:
        """Send bulk personalized emails."""
        results = []

        for recipient in recipients:
            # Personalize content
            personalized_subject = subject_template.format(**recipient)
            personalized_html = html_template.format(**recipient)
            personalized_plain = (
                plain_template.format(**recipient) if plain_template else None
            )

            result = self.send_email(
                to_email=recipient["email"],
                subject=personalized_subject,
                html_content=personalized_html,
                plain_content=personalized_plain,
                provider=provider,
            )
            result["recipient"] = recipient
            results.append(result)

        return results

    def create_email_template(
        self,
        template_name: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        variables: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Create reusable email template."""
        template = {
            "name": template_name,
            "subject": subject,
            "html_content": html_content,
            "plain_content": plain_content,
            "variables": variables or [],
            "created_at": datetime.utcnow().isoformat(),
        }

        # Store template (would integrate with database)
        return {"template_id": template_name, "status": "created", "template": template}

    def schedule_email_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule email campaign for later execution."""
        from app.services.message_queue import get_message_queue

        mq = get_message_queue()

        # Calculate delay
        scheduled_time = datetime.fromisoformat(campaign_data["scheduled_time"])
        delay_seconds = int((scheduled_time - datetime.utcnow()).total_seconds())

        if delay_seconds < 0:
            return {"error": "Scheduled time must be in the future"}

        message_id = mq.enqueue(
            queue_name="email_campaigns",
            payload={
                "action": "send_bulk_email",
                "recipients": campaign_data["recipients"],
                "subject_template": campaign_data["subject_template"],
                "html_template": campaign_data["html_template"],
                "plain_template": campaign_data.get("plain_template"),
                "provider": campaign_data.get("provider", "sendgrid"),
                "campaign_name": campaign_data.get("name", "Unnamed Campaign"),
            },
            delay_seconds=delay_seconds,
        )

        return {
            "campaign_id": message_id,
            "scheduled_time": campaign_data["scheduled_time"],
            "recipient_count": len(campaign_data["recipients"]),
            "status": "scheduled",
        }

    def track_email_opens(self, message_id: str) -> Dict[str, Any]:
        """Track email opens (SendGrid only)."""
        if not self.sg:
            return {"error": "SendGrid not configured"}

        try:
            # This would require SendGrid Event Webhook setup
            # For now, return placeholder
            return {
                "message_id": message_id,
                "opens": 0,
                "clicks": 0,
                "bounces": 0,
                "status": "tracking_enabled",
            }
        except Exception as e:
            return {"error": str(e)}


# Global email service instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get global email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
