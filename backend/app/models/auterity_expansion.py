"""SQLAlchemy models for Auterity AI Platform Expansion features."""

import uuid
from enum import Enum

from app.models.base import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class TriageRuleType(str, Enum):
    """Types of triage rules."""

    ML = "ml"
    RULE_BASED = "rule_based"
    HYBRID = "hybrid"


class TriageRule(Base):
    """Model for AI-powered triage rules."""

    __tablename__ = "triage_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    rule_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    conditions = Column(JSON, nullable=False)  # JSON conditions for rule matching
    routing_logic = Column(JSON, nullable=False)  # JSON routing decisions
    confidence_threshold = Column(Numeric(3, 2), nullable=False, default=0.8)
    priority = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="triage_rules")
    triage_results = relationship("TriageResult", back_populates="rule")


class VectorEmbedding(Base):
    """Model for vector embeddings of workflows, tickets, and templates."""

    __tablename__ = "vector_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    item_type = Column(String(50), nullable=False)  # 'workflow', 'ticket', 'template'
    item_id = Column(UUID(as_uuid=True), nullable=False)
    content_hash = Column(String(64), nullable=False)
    embedding_vector = Column(
        JSON, nullable=False
    )  # Store as JSON for now, will use pgvector later
    embedding_metadata = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="vector_embeddings")


class IntegrationProvider(str, Enum):
    """Supported integration providers."""

    SLACK = "slack"
    ZENDESK = "zendesk"
    SALESFORCE = "salesforce"
    FIREFLIES = "fireflies"
    GITHUB = "github"
    JIRA = "jira"
    CUSTOM = "custom"


class IntegrationStatus(str, Enum):
    """Integration status values."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    SYNCING = "syncing"


class Integration(Base):
    """Model for external tool integrations."""

    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    provider = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    config = Column(JSON, nullable=False)  # OAuth2 tokens, API keys, etc.
    status = Column(String(20), nullable=False, default="inactive")
    last_sync = Column(DateTime(timezone=True), nullable=True)
    sync_interval_minutes = Column(Integer, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="integrations")
    webhooks = relationship(
        "IntegrationWebhook", back_populates="integration", cascade="all, delete-orphan"
    )


class IntegrationWebhook(Base):
    """Model for integration webhook configurations."""

    __tablename__ = "integration_webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_id = Column(
        UUID(as_uuid=True), ForeignKey("integrations.id"), nullable=False
    )
    webhook_url = Column(Text, nullable=False)
    events = Column(JSON, nullable=False)  # List of events to listen for
    status = Column(String(20), nullable=False, default="active")
    last_triggered = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    integration = relationship("Integration", back_populates="webhooks")


class ChannelType(str, Enum):
    """Supported channel types for workflow triggers."""

    VOICE = "voice"
    SMS = "sms"
    EMAIL = "email"
    WEBHOOK = "webhook"
    SLACK = "slack"
    API = "api"


class ChannelTrigger(Base):
    """Model for multi-channel workflow triggers."""

    __tablename__ = "channel_triggers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    channel_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    trigger_config = Column(JSON, nullable=False)  # Channel-specific configuration
    workflow_mapping = Column(JSON, nullable=False)  # Which workflows to trigger
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="channel_triggers")


class CustomModelType(str, Enum):
    """Types of custom models."""

    LLM = "llm"
    EMBEDDING = "embedding"
    CLASSIFICATION = "classification"
    TRANSLATION = "translation"
    SUMMARIZATION = "summarization"


class CustomModelStatus(str, Enum):
    """Custom model status values."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    TRAINING = "training"
    MAINTENANCE = "maintenance"


class CustomModel(Base):
    """Model for custom AI models (BYOM - Bring Your Own Model)."""

    __tablename__ = "custom_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    model_name = Column(String(255), nullable=False)
    endpoint_url = Column(Text, nullable=False)
    model_type = Column(String(50), nullable=False)
    config = Column(JSON, nullable=False)  # Model configuration and parameters
    version = Column(String(20), nullable=False, default="1.0.0")
    status = Column(String(20), nullable=False, default="inactive")
    last_health_check = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="custom_models")


class AgentMemory(Base):
    """Model for agent memory persistence."""

    __tablename__ = "agent_memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    context_hash = Column(String(64), nullable=False)
    memory_data = Column(JSON, nullable=False)  # Contextual memory data
    importance_score = Column(Numeric(3, 2), nullable=False, default=0.5)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    accessed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    agent = relationship("Agent", back_populates="memories")


class ExecutionMetric(Base):
    """Model for workflow execution metrics and monitoring."""

    __tablename__ = "execution_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(
        UUID(as_uuid=True), ForeignKey("workflow_executions.id"), nullable=False
    )
    step_name = Column(String(255), nullable=False)
    duration_ms = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    model_confidence = Column(Numeric(3, 2), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    execution = relationship("WorkflowExecution", back_populates="metrics")


class TriageResult(Base):
    """Model for tracking triage accuracy and human overrides."""

    __tablename__ = "triage_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("triage_rules.id"), nullable=True)
    input_content = Column(Text, nullable=False)
    predicted_routing = Column(String(100), nullable=False)
    confidence_score = Column(Numeric(3, 2), nullable=False)
    human_override = Column(String(100), nullable=True)
    processing_time_ms = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    tenant = relationship("Tenant", back_populates="triage_results")
    rule = relationship("TriageRule", back_populates="triage_results")
