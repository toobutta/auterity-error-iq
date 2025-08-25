"""Redis-based message queue service with persistence and delivery guarantees."""

import time
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, Optional

import redis
from app.config.settings import get_settings
from pydantic import BaseModel, Field


class MessageStatus(str, Enum):
    """Message status enumeration."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTER = "dead_letter"


class QueueMessage(BaseModel):
    """Message model for queue operations."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    queue_name: str
    payload: Dict[str, Any]
    priority: int = Field(default=0, ge=0, le=10)
    retry_count: int = Field(default=0, ge=0)
    max_retries: int = Field(default=3, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    status: MessageStatus = MessageStatus.PENDING
    error_message: Optional[str] = None


class MessageQueue:
    """Redis-based message queue with persistence and delivery guarantees."""

    def __init__(self, redis_url: Optional[str] = None):
        """Initialize message queue with Redis connection."""
        settings = get_settings()
        self.redis_url = redis_url or getattr(
            settings, "REDIS_URL", "redis://localhost:6379"
        )
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)

        # Queue configuration
        self.default_ttl = 86400  # 24 hours
        self.processing_timeout = 300  # 5 minutes
        self.dead_letter_ttl = 604800  # 7 days

        # Key prefixes
        self.queue_prefix = "queue:"
        self.processing_prefix = "processing:"
        self.dead_letter_prefix = "dead_letter:"
        self.message_prefix = "message:"
        self.scheduled_prefix = "scheduled:"

    def _get_queue_key(self, queue_name: str) -> str:
        """Get Redis key for queue."""
        return f"{self.queue_prefix}{queue_name}"

    def _get_processing_key(self, queue_name: str) -> str:
        """Get Redis key for processing queue."""
        return f"{self.processing_prefix}{queue_name}"

    def _get_dead_letter_key(self, queue_name: str) -> str:
        """Get Redis key for dead letter queue."""
        return f"{self.dead_letter_prefix}{queue_name}"

    def _get_message_key(self, message_id: str) -> str:
        """Get Redis key for message data."""
        return f"{self.message_prefix}{message_id}"

    def _get_scheduled_key(self) -> str:
        """Get Redis key for scheduled messages."""
        return f"{self.scheduled_prefix}messages"

    def enqueue(
        self,
        queue_name: str,
        payload: Dict[str, Any],
        priority: int = 0,
        delay_seconds: int = 0,
        ttl_seconds: Optional[int] = None,
        max_retries: int = 3,
    ) -> str:
        """Enqueue a message with optional delay and TTL."""
        message = QueueMessage(
            queue_name=queue_name,
            payload=payload,
            priority=priority,
            max_retries=max_retries,
        )

        # Set expiration if TTL provided
        if ttl_seconds:
            message.expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

        # Set scheduled time if delay provided
        if delay_seconds > 0:
            message.scheduled_at = datetime.utcnow() + timedelta(seconds=delay_seconds)

        # Store message data
        message_key = self._get_message_key(message.id)
        self.redis_client.setex(
            message_key, ttl_seconds or self.default_ttl, message.model_dump_json()
        )

        # Add to appropriate queue
        if message.scheduled_at:
            # Add to scheduled messages sorted set
            scheduled_key = self._get_scheduled_key()
            self.redis_client.zadd(
                scheduled_key, {message.id: message.scheduled_at.timestamp()}
            )
        else:
            # Add to immediate processing queue
            queue_key = self._get_queue_key(queue_name)
            self.redis_client.lpush(queue_key, message.id)

        return message.id

    def dequeue(self, queue_name: str, timeout: int = 0) -> Optional[QueueMessage]:
        """Dequeue a message with blocking support."""
        queue_key = self._get_queue_key(queue_name)
        processing_key = self._get_processing_key(queue_name)

        # Move message from queue to processing with atomic operation
        if timeout > 0:
            result = self.redis_client.brpoplpush(queue_key, processing_key, timeout)
        else:
            result = self.redis_client.rpoplpush(queue_key, processing_key)

        if not result:
            return None

        message_id = result
        message_key = self._get_message_key(message_id)
        message_data = self.redis_client.get(message_key)

        if not message_data:
            # Message expired, remove from processing
            self.redis_client.lrem(processing_key, 1, message_id)
            return None

        message = QueueMessage.model_validate_json(message_data)
        message.status = MessageStatus.PROCESSING

        # Update message status and add processing timeout
        self.redis_client.setex(
            message_key, self.processing_timeout, message.model_dump_json()
        )

        return message

    def ack(self, message: QueueMessage) -> bool:
        """Acknowledge successful message processing."""
        processing_key = self._get_processing_key(message.queue_name)
        message_key = self._get_message_key(message.id)

        # Remove from processing queue
        removed = self.redis_client.lrem(processing_key, 1, message.id)

        # Update message status
        message.status = MessageStatus.COMPLETED
        self.redis_client.setex(
            message_key,
            3600,  # Keep completed messages for 1 hour
            message.model_dump_json(),
        )

        return removed > 0

    def nack(self, message: QueueMessage, error_message: str = None) -> bool:
        """Negative acknowledge - retry or move to dead letter queue."""
        processing_key = self._get_processing_key(message.queue_name)
        message_key = self._get_message_key(message.id)

        # Remove from processing queue
        removed = self.redis_client.lrem(processing_key, 1, message.id)
        if removed == 0:
            return False

        message.retry_count += 1
        message.error_message = error_message

        if message.retry_count <= message.max_retries:
            # Retry with exponential backoff
            delay = min(300, 2**message.retry_count)  # Max 5 minutes
            message.scheduled_at = datetime.utcnow() + timedelta(seconds=delay)
            message.status = MessageStatus.PENDING

            # Add to scheduled messages
            scheduled_key = self._get_scheduled_key()
            self.redis_client.zadd(
                scheduled_key, {message.id: message.scheduled_at.timestamp()}
            )

            # Update message data
            self.redis_client.setex(
                message_key, self.default_ttl, message.model_dump_json()
            )
        else:
            # Move to dead letter queue
            message.status = MessageStatus.DEAD_LETTER
            dead_letter_key = self._get_dead_letter_key(message.queue_name)

            self.redis_client.lpush(dead_letter_key, message.id)
            self.redis_client.setex(
                message_key, self.dead_letter_ttl, message.model_dump_json()
            )

        return True

    def process_scheduled_messages(self) -> int:
        """Process scheduled messages that are ready."""
        scheduled_key = self._get_scheduled_key()
        current_time = time.time()

        # Get messages ready for processing
        ready_messages = self.redis_client.zrangebyscore(
            scheduled_key, 0, current_time, withscores=True
        )

        processed_count = 0
        for message_id, _ in ready_messages:
            message_key = self._get_message_key(message_id)
            message_data = self.redis_client.get(message_key)

            if not message_data:
                # Message expired, remove from scheduled
                self.redis_client.zrem(scheduled_key, message_id)
                continue

            message = QueueMessage.model_validate_json(message_data)

            # Check if message has expired
            if message.expires_at and message.expires_at < datetime.utcnow():
                self.redis_client.zrem(scheduled_key, message_id)
                self.redis_client.delete(message_key)
                continue

            # Move to processing queue
            queue_key = self._get_queue_key(message.queue_name)
            self.redis_client.lpush(queue_key, message_id)
            self.redis_client.zrem(scheduled_key, message_id)

            processed_count += 1

        return processed_count

    def recover_stale_messages(self) -> int:
        """Recover messages stuck in processing state."""
        processing_pattern = f"{self.processing_prefix}*"
        recovered_count = 0

        for key in self.redis_client.scan_iter(match=processing_pattern):
            queue_name = key.replace(self.processing_prefix, "")
            processing_key = self._get_processing_key(queue_name)

            # Get all messages in processing
            message_ids = self.redis_client.lrange(processing_key, 0, -1)

            for message_id in message_ids:
                message_key = self._get_message_key(message_id)
                message_data = self.redis_client.get(message_key)

                if not message_data:
                    # Message expired, remove from processing
                    self.redis_client.lrem(processing_key, 1, message_id)
                    recovered_count += 1
                    continue

                message = QueueMessage.model_validate_json(message_data)

                # Check if processing timeout exceeded
                processing_time = datetime.utcnow() - message.created_at
                if processing_time.total_seconds() > self.processing_timeout:
                    # Treat as failed and retry
                    self.nack(message, "Processing timeout exceeded")
                    recovered_count += 1

        return recovered_count

    def get_queue_stats(self, queue_name: str) -> Dict[str, int]:
        """Get queue statistics."""
        queue_key = self._get_queue_key(queue_name)
        processing_key = self._get_processing_key(queue_name)
        dead_letter_key = self._get_dead_letter_key(queue_name)

        return {
            "pending": self.redis_client.llen(queue_key),
            "processing": self.redis_client.llen(processing_key),
            "dead_letter": self.redis_client.llen(dead_letter_key),
        }

    def get_message(self, message_id: str) -> Optional[QueueMessage]:
        """Get message by ID."""
        message_key = self._get_message_key(message_id)
        message_data = self.redis_client.get(message_key)

        if not message_data:
            return None

        return QueueMessage.model_validate_json(message_data)

    def purge_queue(self, queue_name: str) -> int:
        """Purge all messages from a queue."""
        queue_key = self._get_queue_key(queue_name)
        processing_key = self._get_processing_key(queue_name)
        dead_letter_key = self._get_dead_letter_key(queue_name)

        # Get all message IDs
        pending_ids = self.redis_client.lrange(queue_key, 0, -1)
        processing_ids = self.redis_client.lrange(processing_key, 0, -1)
        dead_letter_ids = self.redis_client.lrange(dead_letter_key, 0, -1)

        all_ids = pending_ids + processing_ids + dead_letter_ids

        # Delete message data
        if all_ids:
            message_keys = [self._get_message_key(msg_id) for msg_id in all_ids]
            self.redis_client.delete(*message_keys)

        # Clear queues
        deleted_count = 0
        deleted_count += self.redis_client.delete(queue_key)
        deleted_count += self.redis_client.delete(processing_key)
        deleted_count += self.redis_client.delete(dead_letter_key)

        return len(all_ids)

    def health_check(self) -> Dict[str, Any]:
        """Perform health check on message queue."""
        try:
            # Test Redis connection
            self.redis_client.ping()

            # Get Redis info
            info = self.redis_client.info()

            return {
                "status": "healthy",
                "redis_version": info.get("redis_version"),
                "connected_clients": info.get("connected_clients"),
                "used_memory_human": info.get("used_memory_human"),
                "uptime_in_seconds": info.get("uptime_in_seconds"),
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}


# Global message queue instance
_message_queue: Optional[MessageQueue] = None


def get_message_queue() -> MessageQueue:
    """Get global message queue instance."""
    global _message_queue
    if _message_queue is None:
        _message_queue = MessageQueue()
    return _message_queue
