"""Database migration for MCP support - adds all required tables for multi-agent orchestration

Revision ID: add_mcp_support_tables
Revises: add_model_tracking_tables
Create Date: 2025-08-08 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_mcp_support_tables"
down_revision = "add_model_tracking_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add MCP support tables for multi-agent orchestration."""

    # Create agent_types enum
    agent_type_enum = sa.Enum("MCP", "OPENAI", "CUSTOM", "A2A", name="agenttype")
    agent_type_enum.create(op.get_bind())

    # Create agent_status enum
    agent_status_enum = sa.Enum(
        "ACTIVE", "INACTIVE", "UNHEALTHY", "MAINTENANCE", name="agentstatus"
    )
    agent_status_enum.create(op.get_bind())

    # Create protocol_type enum
    protocol_type_enum = sa.Enum(
        "MCP", "OPENAI_API", "WEBSOCKET", "CUSTOM", name="protocoltype"
    )
    protocol_type_enum.create(op.get_bind())

    # Create mcp_servers table
    op.create_table(
        "mcp_servers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column(
            "status", agent_status_enum, nullable=False, server_default="INACTIVE"
        ),
        sa.Column("health_endpoint", sa.String(length=512), nullable=True),
        sa.Column("process_id", sa.String(length=50), nullable=True),
        sa.Column("last_health_check", sa.DateTime(timezone=True), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mcp_servers")),
        sa.UniqueConstraint("name", name=op.f("uq_mcp_servers_name")),
    )
    op.create_index(
        op.f("ix_mcp_servers_status"), "mcp_servers", ["status"], unique=False
    )
    op.create_index(op.f("ix_mcp_servers_name"), "mcp_servers", ["name"], unique=False)

    # Create agents table
    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", agent_type_enum, nullable=False),
        sa.Column("capabilities", sa.JSON(), nullable=False),
        sa.Column("config", sa.JSON(), nullable=False),
        sa.Column(
            "status", agent_status_enum, nullable=False, server_default="INACTIVE"
        ),
        sa.Column("health_url", sa.String(length=512), nullable=True),
        sa.Column("mcp_server_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("last_health_check", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["mcp_server_id"],
            ["mcp_servers.id"],
            name=op.f("fk_agents_mcp_server_id_mcp_servers"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_agents_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agents")),
        sa.UniqueConstraint("name", "user_id", name=op.f("uq_agents_name_user_id")),
    )
    op.create_index(op.f("ix_agents_type"), "agents", ["type"], unique=False)
    op.create_index(op.f("ix_agents_status"), "agents", ["status"], unique=False)
    op.create_index(op.f("ix_agents_user_id"), "agents", ["user_id"], unique=False)

    # Create agent_capabilities table for normalized capability storage
    op.create_table(
        "agent_capabilities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("capability_name", sa.String(length=255), nullable=False),
        sa.Column("capability_data", sa.JSON(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agents.id"],
            name=op.f("fk_agent_capabilities_agent_id_agents"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agent_capabilities")),
        sa.UniqueConstraint(
            "agent_id",
            "capability_name",
            name=op.f("uq_agent_capabilities_agent_capability"),
        ),
    )
    op.create_index(
        op.f("ix_agent_capabilities_capability_name"),
        "agent_capabilities",
        ["capability_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_capabilities_agent_id"),
        "agent_capabilities",
        ["agent_id"],
        unique=False,
    )

    # Create protocol_messages table for inter-agent communication tracking
    op.create_table(
        "protocol_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_agent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("target_agent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("protocol_type", protocol_type_enum, nullable=False),
        sa.Column("message_data", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("response_data", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["source_agent_id"],
            ["agents.id"],
            name=op.f("fk_protocol_messages_source_agent_id_agents"),
        ),
        sa.ForeignKeyConstraint(
            ["target_agent_id"],
            ["agents.id"],
            name=op.f("fk_protocol_messages_target_agent_id_agents"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_protocol_messages")),
    )
    op.create_index(
        op.f("ix_protocol_messages_status"),
        "protocol_messages",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_protocol_messages_protocol_type"),
        "protocol_messages",
        ["protocol_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_protocol_messages_created_at"),
        "protocol_messages",
        ["created_at"],
        unique=False,
    )

    # Create workflow_contexts table for multi-agent shared state
    op.create_table(
        "workflow_contexts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("execution_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("context_data", sa.JSON(), nullable=False),
        sa.Column("shared_context_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["execution_id"],
            ["workflow_executions.id"],
            name=op.f("fk_workflow_contexts_execution_id_workflow_executions"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_id"],
            ["agents.id"],
            name=op.f("fk_workflow_contexts_agent_id_agents"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_workflow_contexts")),
    )
    op.create_index(
        op.f("ix_workflow_contexts_execution_id"),
        "workflow_contexts",
        ["execution_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_contexts_shared_context_id"),
        "workflow_contexts",
        ["shared_context_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_contexts_agent_id"),
        "workflow_contexts",
        ["agent_id"],
        unique=False,
    )

    # Create mcp_tools table for tool registry
    op.create_table(
        "mcp_tools",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mcp_server_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tool_name", sa.String(length=255), nullable=False),
        sa.Column("tool_description", sa.Text(), nullable=True),
        sa.Column("tool_schema", sa.JSON(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "last_discovered",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
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
        sa.ForeignKeyConstraint(
            ["mcp_server_id"],
            ["mcp_servers.id"],
            name=op.f("fk_mcp_tools_mcp_server_id_mcp_servers"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_mcp_tools")),
        sa.UniqueConstraint(
            "mcp_server_id", "tool_name", name=op.f("uq_mcp_tools_server_tool")
        ),
    )
    op.create_index(
        op.f("ix_mcp_tools_tool_name"), "mcp_tools", ["tool_name"], unique=False
    )
    op.create_index(
        op.f("ix_mcp_tools_is_available"), "mcp_tools", ["is_available"], unique=False
    )

    # Add agent-specific columns to existing workflow_executions table
    op.add_column(
        "workflow_executions",
        sa.Column("primary_agent_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "workflow_executions",
        sa.Column("agent_execution_data", sa.JSON(), nullable=True),
    )
    op.add_column(
        "workflow_executions",
        sa.Column("multi_agent_coordination", sa.JSON(), nullable=True),
    )

    # Add foreign key constraint for primary_agent_id
    op.create_foreign_key(
        op.f("fk_workflow_executions_primary_agent_id_agents"),
        "workflow_executions",
        "agents",
        ["primary_agent_id"],
        ["id"],
    )

    # Create index for agent-related queries
    op.create_index(
        op.f("ix_workflow_executions_primary_agent_id"),
        "workflow_executions",
        ["primary_agent_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove MCP support tables and columns."""

    # Remove indexes and foreign key constraints first
    op.drop_index(
        op.f("ix_workflow_executions_primary_agent_id"),
        table_name="workflow_executions",
    )
    op.drop_constraint(
        op.f("fk_workflow_executions_primary_agent_id_agents"),
        "workflow_executions",
        type_="foreignkey",
    )

    # Remove added columns from workflow_executions
    op.drop_column("workflow_executions", "multi_agent_coordination")
    op.drop_column("workflow_executions", "agent_execution_data")
    op.drop_column("workflow_executions", "primary_agent_id")

    # Drop tables in reverse order (respecting foreign key dependencies)
    op.drop_table("mcp_tools")
    op.drop_table("workflow_contexts")
    op.drop_table("protocol_messages")
    op.drop_table("agent_capabilities")
    op.drop_table("agents")
    op.drop_table("mcp_servers")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS protocoltype")
    op.execute("DROP TYPE IF EXISTS agentstatus")
    op.execute("DROP TYPE IF EXISTS agenttype")
