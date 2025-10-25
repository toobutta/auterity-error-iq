"""
Kafka HTTP API endpoints for event streaming management.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import get_current_active_user
from app.models import User
from app.services.kafka_service import KafkaEventModel, TopicConfig, kafka_service

router = APIRouter(prefix="/kafka", tags=["kafka"])


class KafkaHealthResponse(BaseModel):
    """Response model for Kafka health check."""

    status: str
    cluster_id: Optional[str] = None
    controller_id: Optional[int] = None
    brokers: List[Dict[str, Any]] = []
    broker_count: int = 0
    last_check: str


class TopicListResponse(BaseModel):
    """Response model for topic listing."""

    topics: List[Dict[str, Any]]
    topic_count: int
    timestamp: str


class EventProduceResponse(BaseModel):
    """Response model for event production."""

    message: str
    topic: str
    partition: int
    offset: int
    timestamp: Optional[int] = None
    key: Optional[str] = None
    produced_at: str


@router.get("/health", response_model=Dict[str, Any])
async def get_kafka_health(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Get Kafka cluster health status."""
    try:
        return await kafka_service.get_health_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Kafka health check failed: {str(e)}",
        )


@router.get("/topics", response_model=Dict[str, Any])
async def list_kafka_topics(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """List all Kafka topics with partition information."""
    try:
        return await kafka_service.list_topics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list topics: {str(e)}",
        )


@router.post("/topics", response_model=Dict[str, Any])
async def create_kafka_topic(
    topic_config: TopicConfig,
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Create a new Kafka topic."""
    try:
        return await kafka_service.create_topic(topic_config)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create topic: {str(e)}",
        )


@router.delete("/topics/{topic_name}", response_model=Dict[str, Any])
async def delete_kafka_topic(
    topic_name: str, current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Delete a Kafka topic."""
    try:
        return await kafka_service.delete_topic(topic_name)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete topic: {str(e)}",
        )


@router.get("/topics/{topic_name}/config", response_model=Dict[str, Any])
async def get_topic_configuration(
    topic_name: str, current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """Get configuration for a specific topic."""
    try:
        return await kafka_service.get_topic_config(topic_name)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Failed to get topic config: {str(e)}",
        )


@router.post("/events", response_model=Dict[str, Any])
async def produce_kafka_event(
    event: KafkaEventModel,
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Produce an event to a Kafka topic."""
    try:
        return await kafka_service.produce_event(event)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to produce event: {str(e)}",
        )


@router.get("/consumer-groups", response_model=Dict[str, Any])
async def list_consumer_groups(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Get information about Kafka consumer groups."""
    try:
        return await kafka_service.get_consumer_groups()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get consumer groups: {str(e)}",
        )


@router.post("/setup/default-topics", response_model=Dict[str, Any])
async def setup_default_topics(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """Create default topics for the Auterity platform."""
    try:
        return await kafka_service.create_default_topics()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create default topics: {str(e)}",
        )


# Legacy endpoints for backward compatibility
@router.post("/events/workflow", response_model=Dict[str, str])
async def publish_workflow_event(
    workflow_id: str,
    event_type: str,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
    """Publish a workflow-specific event (legacy endpoint)."""
    try:
        await kafka_service.publish_workflow_event(
            workflow_id, event_type, data
        )
        return {"message": "Workflow event published successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to publish workflow event: {str(e)}",
        )


@router.post("/events/{topic}", response_model=Dict[str, str])
async def publish_event_to_topic(
    topic: str,
    event: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, str]:
    """Publish an event to a specific topic (legacy endpoint)."""
    try:
        success = await kafka_service.publish_event(topic, event)
        if success:
            return {"message": f"Event published to {topic} successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to publish event",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to publish event: {str(e)}",
        )
