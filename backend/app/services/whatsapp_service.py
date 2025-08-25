"""WhatsApp Business API integration service."""

from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from app.config.settings import get_settings


class WhatsAppService:
    """WhatsApp Business API service."""

    def __init__(self):
        """Initialize WhatsApp service."""
        settings = get_settings()
        self.access_token = getattr(settings, "WHATSAPP_ACCESS_TOKEN", "")
        self.phone_number_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", "")
        self.business_account_id = getattr(settings, "WHATSAPP_BUSINESS_ACCOUNT_ID", "")
        self.webhook_verify_token = getattr(
            settings, "WHATSAPP_WEBHOOK_VERIFY_TOKEN", ""
        )

        self.base_url = "https://graph.facebook.com/v18.0"
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    def send_text_message(self, to_number: str, message: str) -> Dict[str, Any]:
        """Send text message via WhatsApp."""
        if not self.access_token or not self.phone_number_id:
            return {"error": "WhatsApp not configured"}

        url = f"{self.base_url}/{self.phone_number_id}/messages"

        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": message},
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                result = response.json()
                return {
                    "message_id": result["messages"][0]["id"],
                    "status": "sent",
                    "to": to_number,
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"WhatsApp API error: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def send_template_message(
        self,
        to_number: str,
        template_name: str,
        language_code: str = "en_US",
        parameters: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Send template message via WhatsApp."""
        if not self.access_token or not self.phone_number_id:
            return {"error": "WhatsApp not configured"}

        url = f"{self.base_url}/{self.phone_number_id}/messages"

        template_data = {"name": template_name, "language": {"code": language_code}}

        if parameters:
            template_data["components"] = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": param} for param in parameters
                    ],
                }
            ]

        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": template_data,
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                result = response.json()
                return {
                    "message_id": result["messages"][0]["id"],
                    "status": "sent",
                    "to": to_number,
                    "template": template_name,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"WhatsApp API error: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def send_media_message(
        self,
        to_number: str,
        media_type: str,
        media_url: str,
        caption: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send media message (image, document, video, audio)."""
        if not self.access_token or not self.phone_number_id:
            return {"error": "WhatsApp not configured"}

        url = f"{self.base_url}/{self.phone_number_id}/messages"

        media_data = {"link": media_url}
        if caption and media_type in ["image", "video"]:
            media_data["caption"] = caption

        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": media_type,
            media_type: media_data,
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                result = response.json()
                return {
                    "message_id": result["messages"][0]["id"],
                    "status": "sent",
                    "to": to_number,
                    "media_type": media_type,
                    "media_url": media_url,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"WhatsApp API error: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def send_interactive_message(
        self,
        to_number: str,
        header_text: str,
        body_text: str,
        footer_text: str,
        buttons: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Send interactive message with buttons."""
        if not self.access_token or not self.phone_number_id:
            return {"error": "WhatsApp not configured"}

        url = f"{self.base_url}/{self.phone_number_id}/messages"

        interactive_data = {
            "type": "button",
            "header": {"type": "text", "text": header_text},
            "body": {"text": body_text},
            "footer": {"text": footer_text},
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {"id": button["id"], "title": button["title"]},
                    }
                    for button in buttons[:3]  # Max 3 buttons
                ]
            },
        }

        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "interactive",
            "interactive": interactive_data,
        }

        try:
            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                result = response.json()
                return {
                    "message_id": result["messages"][0]["id"],
                    "status": "sent",
                    "to": to_number,
                    "type": "interactive",
                    "timestamp": datetime.utcnow().isoformat(),
                }
            else:
                return {
                    "error": f"WhatsApp API error: {response.status_code}",
                    "details": response.text,
                }
        except Exception as e:
            return {"error": str(e)}

    def send_bulk_messages(
        self,
        recipients: List[Dict[str, str]],
        message_template: str,
        message_type: str = "text",
    ) -> List[Dict[str, Any]]:
        """Send bulk WhatsApp messages."""
        results = []

        for recipient in recipients:
            # Personalize message
            personalized_message = message_template.format(**recipient)

            if message_type == "text":
                result = self.send_text_message(
                    to_number=recipient["phone"], message=personalized_message
                )
            elif message_type == "template":
                result = self.send_template_message(
                    to_number=recipient["phone"],
                    template_name=recipient.get("template_name", "default"),
                    parameters=recipient.get("parameters", []),
                )

            result["recipient"] = recipient
            results.append(result)

        return results

    def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """Get message delivery status."""
        # WhatsApp uses webhooks for status updates
        # This would typically query a database where webhook data is stored
        return {
            "message_id": message_id,
            "status": "unknown",
            "note": "Status tracking requires webhook implementation",
        }

    def verify_webhook(self, verify_token: str, challenge: str) -> Optional[str]:
        """Verify webhook for WhatsApp."""
        if verify_token == self.webhook_verify_token:
            return challenge
        return None

    def process_webhook_message(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming webhook message."""
        try:
            entry = webhook_data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})

            if "messages" in value:
                message = value["messages"][0]
                return {
                    "message_id": message.get("id"),
                    "from": message.get("from"),
                    "timestamp": message.get("timestamp"),
                    "type": message.get("type"),
                    "text": (
                        message.get("text", {}).get("body")
                        if message.get("type") == "text"
                        else None
                    ),
                    "status": "received",
                }
            elif "statuses" in value:
                status = value["statuses"][0]
                return {
                    "message_id": status.get("id"),
                    "status": status.get("status"),
                    "timestamp": status.get("timestamp"),
                    "recipient_id": status.get("recipient_id"),
                }

            return {"status": "processed"}
        except Exception as e:
            return {"error": str(e)}


# Global WhatsApp service instance
_whatsapp_service: Optional[WhatsAppService] = None


def get_whatsapp_service() -> WhatsAppService:
    """Get global WhatsApp service instance."""
    global _whatsapp_service
    if _whatsapp_service is None:
        _whatsapp_service = WhatsAppService()
    return _whatsapp_service
