"""Pydantic schemas for Auterity AI Platform Expansion features."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Base Schemas
class TriageRuleBase(BaseModel):
    """Base schema for triage rules."""

    name: str = Field(..., min_length=1, max_length=255)
    rule_type: str = Field(..., pattern="^(ml|rule_based|hybrid)$")
    conditions: Dict[str, Any] = Field(
        ..., description="JSON conditions for rule matching"
    )
    routing_logic: Dict[str, Any] = Field(..., description="JSON routing decisions")
    confidence_threshold: Decimal = Field(..., ge=0.0, le=1.0)
    priority: int = Field(1, ge=1, le=100)
    is_active: bool = True


class TriageRuleCreate(TriageRuleBase):
    """Schema for creating a triage rule."""


class TriageRuleUpdate(BaseModel):
    """Schema for updating a triage rule."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    rule_type: Optional[str] = Field(None, pattern="^(ml|rule_based|hybrid)$")
    conditions: Optional[Dict[str, Any]] = None
    routing_logic: Optional[Dict[str, Any]] = None
    confidence_threshold: Optional[Decimal] = Field(None, ge=0.0, le=1.0)
    priority: Optional[int] = Field(None, ge=1, le=100)
    is_active: Optional[bool] = None


class TriageRuleResponse(TriageRuleBase):
    """Schema for triage rule responses."""

    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VectorEmbeddingBase(BaseModel):
    """Base schema for vector embeddings."""

    item_type: str = Field(..., pattern="^(workflow|ticket|template)$")
    item_id: UUID
    content_hash: str = Field(..., min_length=1, max_length=64)
    embedding_vector: List[float] = Field(..., description="Vector embedding values")
    metadata: Optional[Dict[str, Any]] = None


class VectorEmbeddingCreate(VectorEmbeddingBase):
    """Schema for creating vector embeddings."""


class VectorEmbeddingResponse(VectorEmbeddingBase):
    """Schema for vector embedding responses."""

    id: UUID
    tenant_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class SimilarityResult(BaseModel):
    """Schema for similarity search results."""

    item_id: UUID
    item_type: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    content_preview: str
    metadata: Optional[Dict[str, Any]] = None


class IntegrationBase(BaseModel):
    """Base schema for integrations."""

    provider: str = Field(
        ..., pattern="^(slack|zendesk|salesforce|fireflies|github|jira|custom)$"
    )
    name: str = Field(..., min_length=1, max_length=255)
    config: Dict[str, Any] = Field(..., description="Integration configuration")
    sync_interval_minutes: Optional[int] = Field(None, ge=1)


class IntegrationCreate(IntegrationBase):
    """Schema for creating integrations."""


class IntegrationUpdate(BaseModel):
    """Schema for updating integrations."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    config: Optional[Dict[str, Any]] = None
    sync_interval_minutes: Optional[int] = Field(None, ge=1)


class IntegrationResponse(IntegrationBase):
    """Schema for integration responses."""

    id: UUID
    tenant_id: UUID
    status: str
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IntegrationWebhookBase(BaseModel):
    """Base schema for integration webhooks."""

    webhook_url: str = Field(..., description="Webhook endpoint URL")
    events: List[str] = Field(..., description="List of events to listen for")


class IntegrationWebhookCreate(IntegrationWebhookBase):
    """Schema for creating integration webhooks."""


class IntegrationWebhookResponse(IntegrationWebhookBase):
    """Schema for integration webhook responses."""

    id: UUID
    integration_id: UUID
    status: str
    last_triggered: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChannelTriggerBase(BaseModel):
    """Base schema for channel triggers."""

    channel_type: str = Field(..., pattern="^(voice|sms|email|webhook|slack|api)$")
    name: str = Field(..., min_length=1, max_length=255)
    trigger_config: Dict[str, Any] = Field(
        ..., description="Channel-specific configuration"
    )
    workflow_mapping: Dict[str, Any] = Field(
        ..., description="Workflow mapping configuration"
    )


class ChannelTriggerCreate(ChannelTriggerBase):
    """Schema for creating channel triggers."""


class ChannelTriggerUpdate(BaseModel):
    """Schema for updating channel triggers."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    trigger_config: Optional[Dict[str, Any]] = None
    workflow_mapping: Optional[Dict[str, Any]] = None


class ChannelTriggerResponse(ChannelTriggerBase):
    """Schema for channel trigger responses."""

    id: UUID
    tenant_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomModelBase(BaseModel):
    """Base schema for custom models."""

    model_name: str = Field(..., min_length=1, max_length=255)
    endpoint_url: str = Field(..., description="Model endpoint URL")
    model_type: str = Field(
        ..., pattern="^(llm|embedding|classification|translation|summarization)$"
    )
    config: Dict[str, Any] = Field(..., description="Model configuration")
    version: str = Field("1.0.0", pattern="^\\d+\\.\\d+\\.\\d+$")


class CustomModelCreate(CustomModelBase):
    """Schema for creating custom models."""


class CustomModelUpdate(BaseModel):
    """Schema for updating custom models."""

    model_name: Optional[str] = Field(None, min_length=1, max_length=255)
    endpoint_url: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    version: Optional[str] = Field(None, pattern="^\\d+\\.\\d+\\.\\d+$")


class CustomModelResponse(CustomModelBase):
    """Schema for custom model responses."""

    id: UUID
    tenant_id: UUID
    status: str
    last_health_check: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentMemoryBase(BaseModel):
    """Base schema for agent memories."""

    context_hash: str = Field(..., min_length=1, max_length=64)
    memory_data: Dict[str, Any] = Field(..., description="Contextual memory data")
    importance_score: Decimal = Field(0.5, ge=0.0, le=1.0)


class AgentMemoryCreate(AgentMemoryBase):
    """Schema for creating agent memories."""


class AgentMemoryResponse(AgentMemoryBase):
    """Schema for agent memory responses."""

    id: UUID
    agent_id: UUID
    created_at: datetime
    accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExecutionMetricBase(BaseModel):
    """Base schema for execution metrics."""

    step_name: str = Field(..., min_length=1, max_length=255)
    duration_ms: int = Field(..., ge=0)
    status: str = Field(..., description="Step execution status")
    model_confidence: Optional[Decimal] = Field(None, ge=0.0, le=1.0)
    error_message: Optional[str] = None


class ExecutionMetricCreate(ExecutionMetricBase):
    """Schema for creating execution metrics."""


class ExecutionMetricResponse(ExecutionMetricBase):
    """Schema for execution metric responses."""

    id: UUID
    execution_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TriageResultBase(BaseModel):
    """Base schema for triage results."""

    input_content: str = Field(..., description="Input content that was triaged")
    predicted_routing: str = Field(..., description="Predicted routing decision")
    confidence_score: Decimal = Field(..., ge=0.0, le=1.0)
    human_override: Optional[str] = Field(None, description="Human override decision")
    processing_time_ms: int = Field(..., ge=0)


class TriageResultCreate(TriageResultBase):
    """Schema for creating triage results."""


class TriageResultResponse(TriageResultBase):
    """Schema for triage result responses."""

    id: UUID
    tenant_id: UUID
    rule_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Request/Response Schemas for Core Features
class TriageRequest(BaseModel):
    """Schema for triage requests."""

    content: str = Field(..., description="Content to be triaged")
    context: Dict[str, Any] = Field(
        default_factory=dict, description="Additional context"
    )
    tenant_id: UUID


class TriageResponse(BaseModel):
    """Schema for triage responses."""

    routing_decision: str = Field(..., description="Routing decision")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    rule_applied: Optional[str] = None
    reasoning: str = Field(..., description="Explanation for the decision")
    processing_time_ms: int = Field(..., ge=0)
    suggested_actions: List[str] = Field(default_factory=list)


class SimilaritySearchRequest(BaseModel):
    """Schema for similarity search requests."""

    content: str = Field(..., description="Content to search for similarities")
    item_type: str = Field(..., pattern="^(workflow|ticket|template)$")
    threshold: float = Field(0.8, ge=0.0, le=1.0, description="Similarity threshold")
    limit: int = Field(10, ge=1, le=100, description="Maximum results to return")


class SimilaritySearchResponse(BaseModel):
    """Schema for similarity search responses."""

    query_content: str
    results: List[SimilarityResult] = Field(default_factory=list)
    total_found: int
    search_time_ms: int


class AgentDeployRequest(BaseModel):
    """Schema for agent deployment requests."""

    agent_config: Dict[str, Any] = Field(..., description="Agent configuration")
    memory_config: Optional[Dict[str, Any]] = None
    coordination_rules: Optional[Dict[str, Any]] = None
    escalation_policy: Optional[Dict[str, Any]] = None


class AgentDeployResponse(BaseModel):
    """Schema for agent deployment responses."""

    agent_id: UUID
    status: str
    deployment_time_ms: int
    memory_configured: bool
    coordination_enabled: bool


class IntegrationSyncRequest(BaseModel):
    """Schema for integration sync requests."""

    integration_id: UUID
    force_sync: bool = False


class IntegrationSyncResponse(BaseModel):
    """Schema for integration sync responses."""

    integration_id: UUID
    status: str
    sync_time_ms: int
    records_processed: int
    errors: List[str] = Field(default_factory=list)


class ChannelTriggerRequest(BaseModel):
    """Schema for channel trigger requests."""

    channel_type: str
    input_data: Dict[str, Any]
    tenant_id: UUID


class ChannelTriggerResponse(BaseModel):
    """Schema for channel trigger responses."""

    triggered: bool
    workflows_triggered: List[str] = Field(default_factory=list)
    processing_time_ms: int
    errors: List[str] = Field(default_factory=list)


class CustomModelHealthCheck(BaseModel):
    """Schema for custom model health checks."""

    model_id: UUID
    endpoint_url: str
    model_type: str
    response_time_ms: Optional[int] = None
    status: str
    error_message: Optional[str] = None


class LiveInsightsRequest(BaseModel):
    """Schema for live insights requests."""

    workflow_id: Optional[UUID] = None
    execution_id: Optional[UUID] = None
    include_metrics: bool = True
    include_traces: bool = True


class LiveInsightsResponse(BaseModel):
    """Schema for live insights responses."""

    workflow_id: Optional[UUID] = None
    execution_id: Optional[UUID] = None
    current_status: str
    execution_time_ms: int
    steps_completed: int
    total_steps: int
    metrics: List[ExecutionMetricResponse] = Field(default_factory=list)
    recent_errors: List[str] = Field(default_factory=list)
    performance_score: float = Field(..., ge=0.0, le=1.0)
