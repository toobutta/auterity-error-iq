"""Auterity Platform Expansion - Core Features

Revision ID: 003_auterity_expansion_core
Revises: 002_create_industry_profiles_table
Create Date: 2025-08-23 10:00:00.000000

"""
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "003_auterity_expansion_core"
down_revision = "001_enterprise_security"
branch_labels = None
depends_on = None


def upgrade():
    # Create triage_rules table
    op.create_table(
        "triage_rules",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "rule_type", sa.String(50), nullable=False
        ),  # 'ml', 'rule_based', 'hybrid'
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("conditions", postgresql.JSONB, nullable=False),
        sa.Column("routing_logic", postgresql.JSONB, nullable=False),
        sa.Column(
            "confidence_threshold",
            sa.Numeric(3, 2),
            nullable=False,
            server_default="0.8",
        ),
        sa.Column("priority", sa.Integer, nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
    )

    # Create vector_embeddings table
    op.create_table(
        "vector_embeddings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "item_type", sa.String(50), nullable=False
        ),  # 'workflow', 'ticket', 'template'
        sa.Column("item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column(
            "embedding_vector", postgresql.JSONB, nullable=False
        ),  # Store as JSON for now, will use pgvector later
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "tenant_id", "item_type", "item_id", "content_hash"
        ),
    )

    # Create integrations table
    op.create_table(
        "integrations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "provider", sa.String(100), nullable=False
        ),  # 'slack', 'zendesk', 'salesforce'
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("config", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="inactive"),
        sa.Column("last_sync", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sync_interval_minutes", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
    )

    # Create integration_webhooks table
    op.create_table(
        "integration_webhooks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column(
            "integration_id", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("webhook_url", sa.Text, nullable=False),
        sa.Column("events", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="active"),
        sa.Column("last_triggered", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["integration_id"], ["integrations.id"], ondelete="CASCADE"
        ),
    )

    # Create channel_triggers table
    op.create_table(
        "channel_triggers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "channel_type", sa.String(50), nullable=False
        ),  # 'voice', 'sms', 'email', 'webhook'
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("trigger_config", postgresql.JSONB, nullable=False),
        sa.Column("workflow_mapping", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, default="active"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
    )

    # Create custom_models table
    op.create_table(
        "custom_models",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("model_name", sa.String(255), nullable=False),
        sa.Column("endpoint_url", sa.Text, nullable=False),
        sa.Column(
            "model_type", sa.String(50), nullable=False
        ),  # 'llm', 'embedding', 'classification'
        sa.Column("config", postgresql.JSONB, nullable=False),
        sa.Column("version", sa.String(20), nullable=False, default="1.0.0"),
        sa.Column("status", sa.String(20), nullable=False, default="inactive"),
        sa.Column(
            "last_health_check", sa.DateTime(timezone=True), nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
    )

    # Create agent_memories table
    op.create_table(
        "agent_memories",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("context_hash", sa.String(64), nullable=False),
        sa.Column("memory_data", postgresql.JSONB, nullable=False),
        sa.Column(
            "importance_score", sa.Numeric(3, 2), nullable=False, default=0.5
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("accessed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["agent_id"], ["agents.id"], ondelete="CASCADE"
        ),
    )

    # Create execution_metrics table
    op.create_table(
        "execution_metrics",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column(
            "execution_id", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("step_name", sa.String(255), nullable=False),
        sa.Column("duration_ms", sa.Integer, nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("model_confidence", sa.Numeric(3, 2), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["execution_id"], ["workflow_executions.id"], ondelete="CASCADE"
        ),
    )

    # Create triage_results table for tracking triage accuracy
    op.create_table(
        "triage_results",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
            default=uuid.uuid4,
        ),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("input_content", sa.Text, nullable=False),
        sa.Column("predicted_routing", sa.String(100), nullable=False),
        sa.Column("confidence_score", sa.Numeric(3, 2), nullable=False),
        sa.Column("human_override", sa.String(100), nullable=True),
        sa.Column("processing_time_ms", sa.Integer, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["tenant_id"], ["tenants.id"], ondelete="CASCADE"
        ),
    )

    # Create indexes for performance
    op.create_index(
        "idx_triage_rules_tenant_active",
        "triage_rules",
        ["tenant_id", "is_active"],
    )
    op.create_index(
        "idx_vector_embeddings_tenant_type",
        "vector_embeddings",
        ["tenant_id", "item_type"],
    )
    op.create_index(
        "idx_integrations_tenant_provider",
        "integrations",
        ["tenant_id", "provider"],
    )
    op.create_index(
        "idx_channel_triggers_tenant_type",
        "channel_triggers",
        ["tenant_id", "channel_type"],
    )
    op.create_index(
        "idx_custom_models_tenant_status",
        "custom_models",
        ["tenant_id", "status"],
    )
    op.create_index(
        "idx_agent_memories_agent_hash",
        "agent_memories",
        ["agent_id", "context_hash"],
    )
    op.create_index(
        "idx_execution_metrics_execution",
        "execution_metrics",
        ["execution_id"],
    )
    op.create_index(
        "idx_triage_results_tenant_created",
        "triage_results",
        ["tenant_id", "created_at"],
    )


def downgrade():
    # Drop tables in reverse order
    op.drop_table("triage_results")
    op.drop_table("execution_metrics")
    op.drop_table("agent_memories")
    op.drop_table("custom_models")
    op.drop_table("channel_triggers")
    op.drop_table("integration_webhooks")
    op.drop_table("integrations")
    op.drop_table("vector_embeddings")
    op.drop_table("triage_rules")
