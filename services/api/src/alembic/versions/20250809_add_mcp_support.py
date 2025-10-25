"""
Add MCP support tables and indexes (optimized)
Revision ID: 20250809_add_mcp_support
Revises:
Create Date: 2025-08-09
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


def upgrade():
    # Enums
    agent_type_enum = sa.Enum("MCP", "OPENAI", "CUSTOM", "A2A", name="agenttype")
    agent_type_enum.create(op.get_bind(), checkfirst=True)
    agent_status_enum = sa.Enum(
        "ACTIVE", "INACTIVE", "UNHEALTHY", "MAINTENANCE", name="agentstatus"
    )
    agent_status_enum.create(op.get_bind(), checkfirst=True)
    protocol_type_enum = sa.Enum(
        "MCP", "OPENAI_API", "WEBSOCKET", "CUSTOM", name="protocoltype"
    )
    protocol_type_enum.create(op.get_bind(), checkfirst=True)

    # MCP Servers
    op.create_table(
        "mcp_servers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column(
            "status", agent_status_enum, nullable=False, server_default="INACTIVE"
        ),
        sa.Column("health_endpoint", sa.String(512)),
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
    )
    op.create_index("ix_mcp_servers_status", "mcp_servers", ["status"])

    # Agents
    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", agent_type_enum, nullable=False),
        sa.Column("capabilities", sa.JSON(), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column(
            "status", agent_status_enum, nullable=False, server_default="INACTIVE"
        ),
        sa.Column("health_url", sa.String(512)),
        sa.Column(
            "mcp_server_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mcp_servers.id"),
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
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
        sa.UniqueConstraint("name", "user_id", name="uq_agents_name_user_id"),
    )
    op.create_index("ix_agents_type", "agents", ["type"])
    op.create_index("ix_agents_status", "agents", ["status"])
    op.create_index("ix_agents_user_id", "agents", ["user_id"])

    # Protocol Messages
    op.create_table(
        "protocol_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "source_agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id")
        ),
        sa.Column(
            "target_agent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("agents.id")
        ),
        sa.Column("protocol_type", protocol_type_enum, nullable=False),
        sa.Column("message_data", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_protocol_messages_status", "protocol_messages", ["status"])
    op.create_index(
        "ix_protocol_messages_protocol_type", "protocol_messages", ["protocol_type"]
    )
    op.create_index(
        "ix_protocol_messages_created_at", "protocol_messages", ["created_at"]
    )

    # Workflow Contexts
    op.create_table(
        "workflow_contexts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "execution_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workflow_executions.id"),
            nullable=False,
        ),
        sa.Column("context_data", sa.JSON(), nullable=False),
        sa.Column(
            "shared_context_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("workflow_contexts.id"),
        ),
        sa.Column(
            "agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
        ),
        sa.Column("snapshot_version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
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
    )
    op.create_index(
        "ix_workflow_contexts_execution_id", "workflow_contexts", ["execution_id"]
    )
    op.create_index(
        "ix_workflow_contexts_shared_context_id",
        "workflow_contexts",
        ["shared_context_id"],
    )
    op.create_index("ix_workflow_contexts_agent_id", "workflow_contexts", ["agent_id"])

    # Add agent-specific columns to workflow_executions
    op.add_column(
        "workflow_executions",
        sa.Column(
            "primary_agent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agents.id"),
        ),
    )
    op.add_column("workflow_executions", sa.Column("agent_execution_data", sa.JSON()))
    op.add_column(
        "workflow_executions", sa.Column("multi_agent_coordination", sa.JSON())
    )
    op.create_index(
        "ix_workflow_executions_primary_agent_id",
        "workflow_executions",
        ["primary_agent_id"],
    )


def downgrade():
    op.drop_index(
        "ix_workflow_executions_primary_agent_id", table_name="workflow_executions"
    )
    op.drop_column("workflow_executions", "multi_agent_coordination")
    op.drop_column("workflow_executions", "agent_execution_data")
    op.drop_column("workflow_executions", "primary_agent_id")
    op.drop_table("workflow_contexts")
    op.drop_table("protocol_messages")
    op.drop_table("agents")
    op.drop_table("mcp_servers")
    op.execute("DROP TYPE IF EXISTS protocoltype")
    op.execute("DROP TYPE IF EXISTS agentstatus")
    op.execute("DROP TYPE IF EXISTS agenttype")
