import json
import os
from typing import Any, Dict

from app.exceptions import ServiceError
from kafka import KafkaProducer


class KafkaService:
    def __init__(self):
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092")
        self.producer = None
        self.consumer = None

    def get_producer(self) -> KafkaProducer:
        if not self.producer:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            )
        return self.producer

    async def publish_event(self, topic: str, event: Dict[str, Any]) -> bool:
        try:
            producer = self.get_producer()
            producer.send(topic, event)
            producer.flush()
            return True
        except Exception as e:
            raise ServiceError(f"Failed to publish event to {topic}: {str(e)}")

    async def publish_workflow_event(
        self, workflow_id: str, event_type: str, data: Dict[str, Any]
    ):
        event = {
            "workflow_id": workflow_id,
            "event_type": event_type,
            "data": data,
            "timestamp": data.get("timestamp"),
        }
        await self.publish_event("workflow-events", event)


kafka_service = KafkaService()
