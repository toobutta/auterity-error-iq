"""
Kafka Event Streaming Service

Provides HTTP endpoints for Kafka topic management and event streaming.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from kafka import KafkaAdminClient, KafkaProducer
from kafka.admin import ConfigResource, ConfigResourceType, NewTopic
from pydantic import BaseModel

from app.exceptions import SystemError

logger = logging.getLogger(__name__)


class KafkaEventModel(BaseModel):
    """Model for Kafka event data."""

    topic: str
    key: Optional[str] = None
    value: Dict[str, Any]
    headers: Optional[Dict[str, str]] = None


class TopicConfig(BaseModel):
    """Model for Kafka topic configuration."""

    name: str
    num_partitions: int = 3
    replication_factor: int = 1
    config: Optional[Dict[str, str]] = None


class KafkaService:
    """Service for managing Kafka operations with HTTP interface."""

    def __init__(self):
        self.bootstrap_servers = os.getenv(
            "KAFKA_BOOTSTRAP_SERVERS", "kafka:9092"
        )
        self.producer = None
        self.consumer = None
        self.admin_client = None
        self._setup_clients()

    def _setup_clients(self):
        """Initialize Kafka clients."""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                retries=3,
                acks="all",
            )

            self.admin_client = KafkaAdminClient(
                bootstrap_servers=self.bootstrap_servers,
                client_id="kafka_http_service",
            )
            logger.info("Kafka clients initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka clients: {e}")
            # Don't raise here to allow service to start even if Kafka is down

    def get_producer(self) -> KafkaProducer:
        """Get Kafka producer instance."""
        if not self.producer:
            self._setup_clients()
        if self.producer is None:
            raise SystemError("Failed to initialize Kafka producer")
        return self.producer

    async def get_health_status(self) -> Dict[str, Any]:
        """Get Kafka cluster health status."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if self.admin_client is None:
                raise SystemError("Failed to initialize Kafka admin client")

            # Check if we can connect to Kafka
            metadata = self.admin_client.describe_cluster()

            # Get broker information
            brokers = []
            for broker in metadata.brokers:
                brokers.append(
                    {"id": broker.id, "host": broker.host, "port": broker.port}
                )

            return {
                "status": "healthy",
                "cluster_id": metadata.cluster_id,
                "controller_id": metadata.controller.id,
                "brokers": brokers,
                "broker_count": len(brokers),
                "last_check": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat(),
            }

    async def list_topics(self) -> Dict[str, Any]:
        """List all Kafka topics."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if self.admin_client is None:
                raise SystemError("Failed to initialize Kafka admin client")

            metadata = self.admin_client.list_topics()
            topics = []

            # Handle the metadata object which might have different structure
            if hasattr(metadata, "topics"):
                topics_dict = getattr(metadata, "topics", {})
            else:
                # Convert list to dict format for compatibility
                if isinstance(metadata, list):
                    topics_dict = {topic: None for topic in metadata}
                else:
                    topics_dict = {}

            for topic_name in topics_dict:
                if topics_dict[topic_name]:
                    topic_metadata = topics_dict[topic_name]
                else:
                    topic_metadata = None
                partitions = []

                if topic_metadata and hasattr(topic_metadata, "partitions"):
                    for (
                        partition_id,
                        partition_metadata,
                    ) in topic_metadata.partitions.items():
                        partitions.append(
                            {
                                "id": partition_id,
                                "leader": getattr(
                                    partition_metadata, "leader", None
                                ),
                                "replicas": list(
                                    getattr(partition_metadata, "replicas", [])
                                ),
                                "isr": list(
                                    getattr(partition_metadata, "isr", [])
                                ),
                            }
                        )

                topics.append(
                    {
                        "name": topic_name,
                        "partitions": partitions,
                        "partition_count": len(partitions),
                    }
                )

            return {
                "topics": topics,
                "topic_count": len(topics),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to list topics: {e}")
            raise SystemError(f"Failed to list topics: {str(e)}")

    async def create_topic(self, topic_config: TopicConfig) -> Dict[str, Any]:
        """Create a new Kafka topic."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if self.admin_client is None:
                raise SystemError("Failed to initialize Kafka admin client")

            new_topic = NewTopic(
                name=topic_config.name,
                num_partitions=topic_config.num_partitions,
                replication_factor=topic_config.replication_factor,
                topic_configs=topic_config.config or {},
            )

            result = self.admin_client.create_topics([new_topic])

            # Wait for the operation to complete
            if result:
                for topic, future in result.items():
                    try:
                        future.result()  # The result itself is None
                        logger.info(f"Topic {topic} created successfully")
                    except Exception as e:
                        logger.error(f"Failed to create topic {topic}: {e}")
                        raise SystemError(
                            f"Failed to create topic {topic}: {str(e)}"
                        )

            return {
                "message": f"Topic '{topic_config.name}' created successfully",
                "topic": topic_config.name,
                "partitions": topic_config.num_partitions,
                "replication_factor": topic_config.replication_factor,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to create topic: {e}")
            raise SystemError(f"Failed to create topic: {str(e)}")

    async def delete_topic(self, topic_name: str) -> Dict[str, Any]:
        """Delete a Kafka topic."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if self.admin_client is None:
                raise SystemError("Failed to initialize Kafka admin client")

            result = self.admin_client.delete_topics([topic_name])

            # Wait for the operation to complete
            if result:
                for topic, future in result.items():
                    try:
                        future.result()
                        logger.info(f"Topic {topic} deleted successfully")
                    except Exception as e:
                        logger.error(f"Failed to delete topic {topic}: {e}")
                        raise SystemError(
                            f"Failed to delete topic {topic}: {str(e)}"
                        )

            return {
                "message": f"Topic '{topic_name}' deleted successfully",
                "topic": topic_name,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to delete topic: {e}")
            raise SystemError(f"Failed to delete topic: {str(e)}")

    async def produce_event(self, event: KafkaEventModel) -> Dict[str, Any]:
        """Produce an event to a Kafka topic."""
        try:
            producer = self.get_producer()

            # Prepare headers
            headers = []
            if event.headers:
                headers = [
                    (k, v.encode("utf-8")) for k, v in event.headers.items()
                ]

            # Send the message
            future = producer.send(
                topic=event.topic,
                key=event.key,
                value=event.value,
                headers=headers,
            )

            # Wait for the message to be sent
            record_metadata = future.get(timeout=10)

            return {
                "message": "Event produced successfully",
                "topic": record_metadata.topic,
                "partition": record_metadata.partition,
                "offset": record_metadata.offset,
                "timestamp": record_metadata.timestamp,
                "key": event.key,
                "produced_at": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to produce event: {e}")
            raise SystemError(f"Failed to produce event: {str(e)}")

    async def get_topic_config(self, topic_name: str) -> Dict[str, Any]:
        """Get configuration for a specific topic."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if not self.admin_client:
                raise SystemError("Kafka admin client not available")

            resource = ConfigResource(ConfigResourceType.TOPIC, topic_name)
            configs = self.admin_client.describe_configs([resource])

            topic_config = {}
            if configs and isinstance(configs, dict):
                for resource, config_response in configs.items():
                    if config_response.configs:
                        topic_config = {
                            config.name: {
                                "value": config.value,
                                "source": config.source.name,
                                "is_default": config.is_default,
                                "is_read_only": config.is_read_only,
                                "is_sensitive": config.is_sensitive,
                            }
                            for config in config_response.configs.values()
                        }

            return {
                "topic": topic_name,
                "config": topic_config,
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get topic config: {e}")
            raise SystemError(f"Failed to get topic config: {str(e)}")

    async def get_consumer_groups(self) -> Dict[str, Any]:
        """Get information about consumer groups."""
        try:
            if not self.admin_client:
                self._setup_clients()

            if not self.admin_client:
                raise SystemError("Kafka admin client not available")

            groups = self.admin_client.list_consumer_groups()

            consumer_groups = []
            for group in groups:
                consumer_groups.append(
                    {
                        "group_id": group.group_id,
                        "is_simple_consumer_group": group.is_simple_consumer_group,
                        "protocol_type": group.protocol_type,
                        "state": group.state.name if group.state else None,
                    }
                )

            return {
                "consumer_groups": consumer_groups,
                "group_count": len(consumer_groups),
                "timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Failed to get consumer groups: {e}")
            raise SystemError(f"Failed to get consumer groups: {str(e)}")

    async def create_default_topics(self) -> Dict[str, Any]:
        """Create default topics for the Auterity platform."""
        default_topics = [
            TopicConfig(
                name="workflow-events",
                num_partitions=3,
                replication_factor=1,
                config={
                    "retention.ms": "604800000",  # 7 days
                    "compression.type": "snappy",
                },
            ),
            TopicConfig(
                name="error-events",
                num_partitions=3,
                replication_factor=1,
                config={
                    "retention.ms": "2592000000",  # 30 days
                    "compression.type": "snappy",
                },
            ),
            TopicConfig(
                name="audit-events",
                num_partitions=2,
                replication_factor=1,
                config={
                    "retention.ms": "7776000000",  # 90 days
                    "compression.type": "snappy",
                },
            ),
            TopicConfig(
                name="ai-model-events",
                num_partitions=2,
                replication_factor=1,
                config={
                    "retention.ms": "604800000",  # 7 days
                    "compression.type": "snappy",
                },
            ),
        ]

        created_topics = []
        errors = []

        for topic_config in default_topics:
            try:
                result = await self.create_topic(topic_config)
                created_topics.append(result)
            except Exception as e:
                errors.append({"topic": topic_config.name, "error": str(e)})

        return {
            "message": "Default topics creation completed",
            "created_topics": created_topics,
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # Legacy methods for backward compatibility
    async def publish_event(self, topic: str, event: Dict[str, Any]) -> bool:
        """Legacy method for publishing events."""
        try:
            kafka_event = KafkaEventModel(topic=topic, value=event)
            await self.produce_event(kafka_event)
            return True
        except Exception as e:
            raise SystemError(f"Failed to publish event to {topic}: {str(e)}")

    async def publish_workflow_event(
        self, workflow_id: str, event_type: str, data: Dict[str, Any]
    ):
        """Publish workflow-specific events."""
        event = {
            "workflow_id": workflow_id,
            "event_type": event_type,
            "data": data,
            "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
        }
        await self.publish_event("workflow-events", event)

    def close(self):
        """Close Kafka connections."""
        try:
            if self.producer:
                self.producer.close()
            logger.info("Kafka connections closed")
        except Exception as e:
            logger.error(f"Error closing Kafka connections: {e}")


# Global Kafka service instance
kafka_service = KafkaService()
