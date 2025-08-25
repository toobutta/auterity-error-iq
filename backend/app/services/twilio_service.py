"""Twilio voice and SMS automation service."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.config.settings import get_settings
from twilio.rest import Client
from twilio.twiml import VoiceResponse


class TwilioService:
    """Twilio voice and SMS automation service."""

    def __init__(self):
        """Initialize Twilio service."""
        settings = get_settings()
        self.account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
        self.auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
        self.phone_number = getattr(settings, "TWILIO_PHONE_NUMBER", "")

        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None

    def send_sms(
        self, to_number: str, message: str, from_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send SMS message."""
        if not self.client:
            return {"error": "Twilio not configured"}

        try:
            message_obj = self.client.messages.create(
                body=message, from_=from_number or self.phone_number, to=to_number
            )

            return {
                "sid": message_obj.sid,
                "status": message_obj.status,
                "to": to_number,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def send_bulk_sms(
        self, recipients: List[Dict[str, str]], message_template: str
    ) -> List[Dict[str, Any]]:
        """Send bulk SMS with personalization."""
        results = []

        for recipient in recipients:
            # Personalize message
            personalized_message = message_template.format(**recipient)

            result = self.send_sms(
                to_number=recipient["phone"], message=personalized_message
            )
            result["recipient"] = recipient
            results.append(result)

        return results

    def make_voice_call(
        self, to_number: str, twiml_url: str, from_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """Make voice call with TwiML instructions."""
        if not self.client:
            return {"error": "Twilio not configured"}

        try:
            call = self.client.calls.create(
                url=twiml_url, to=to_number, from_=from_number or self.phone_number
            )

            return {
                "sid": call.sid,
                "status": call.status,
                "to": to_number,
                "from": from_number or self.phone_number,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e)}

    def create_voice_response(
        self, message: str, voice: str = "alice", language: str = "en-US"
    ) -> str:
        """Create TwiML voice response."""
        response = VoiceResponse()
        response.say(message, voice=voice, language=language)
        return str(response)

    def create_interactive_voice_response(
        self, message: str, menu_options: Dict[str, str], action_url: str
    ) -> str:
        """Create interactive voice response with menu."""
        response = VoiceResponse()

        gather = response.gather(num_digits=1, action=action_url, method="POST")
        gather.say(message)

        # Add menu options
        menu_text = " ".join(
            [f"Press {key} for {value}." for key, value in menu_options.items()]
        )
        gather.say(menu_text)

        # Fallback if no input
        response.say("Sorry, I didn't receive any input. Goodbye.")
        response.hangup()

        return str(response)

    def get_call_status(self, call_sid: str) -> Dict[str, Any]:
        """Get call status and details."""
        if not self.client:
            return {"error": "Twilio not configured"}

        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "sid": call.sid,
                "status": call.status,
                "duration": call.duration,
                "start_time": call.start_time.isoformat() if call.start_time else None,
                "end_time": call.end_time.isoformat() if call.end_time else None,
                "price": call.price,
                "direction": call.direction,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_message_status(self, message_sid: str) -> Dict[str, Any]:
        """Get SMS message status."""
        if not self.client:
            return {"error": "Twilio not configured"}

        try:
            message = self.client.messages(message_sid).fetch()
            return {
                "sid": message.sid,
                "status": message.status,
                "to": message.to,
                "from": message.from_,
                "body": message.body,
                "date_sent": (
                    message.date_sent.isoformat() if message.date_sent else None
                ),
                "price": message.price,
                "error_code": message.error_code,
                "error_message": message.error_message,
            }
        except Exception as e:
            return {"error": str(e)}

    def schedule_sms_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule SMS campaign for later execution."""
        # This would integrate with the message queue service
        from app.services.message_queue import get_message_queue

        mq = get_message_queue()

        # Calculate delay in seconds
        scheduled_time = datetime.fromisoformat(campaign_data["scheduled_time"])
        delay_seconds = int((scheduled_time - datetime.utcnow()).total_seconds())

        if delay_seconds < 0:
            return {"error": "Scheduled time must be in the future"}

        message_id = mq.enqueue(
            queue_name="sms_campaigns",
            payload={
                "action": "send_bulk_sms",
                "recipients": campaign_data["recipients"],
                "message_template": campaign_data["message_template"],
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


# Global Twilio service instance
_twilio_service: Optional[TwilioService] = None


def get_twilio_service() -> TwilioService:
    """Get global Twilio service instance."""
    global _twilio_service
    if _twilio_service is None:
        _twilio_service = TwilioService()
    return _twilio_service
