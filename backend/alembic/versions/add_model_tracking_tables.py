"""Add model tracking tables

Revision ID: add_model_tracking
Revises: [previous_revision]
Create Date: 2025-01-31
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "add_model_tracking"
down_revision = "[previous_revision]"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "model_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("tokens_used", sa.Integer, nullable=False),
        sa.Column("cost", sa.Float, nullable=False),
        sa.Column("execution_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
    )
    op.create_index("ix_model_usage_model_name", "model_usage", ["model_name"])
    op.create_index("ix_model_usage_provider", "model_usage", ["provider"])

    op.create_table(
        "model_configurations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("config", sa.JSON, nullable=False),
        sa.Column("is_active", sa.Boolean, default=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now()
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    op.create_index("ix_model_configurations_name", "model_configurations", ["name"])
    op.create_index(
        "ix_model_configurations_provider", "model_configurations", ["provider"]
    )


def downgrade():
    op.drop_index("ix_model_usage_model_name", table_name="model_usage")
    op.drop_index("ix_model_usage_provider", table_name="model_usage")
    op.drop_table("model_usage")
    op.drop_index("ix_model_configurations_name", table_name="model_configurations")
    op.drop_index("ix_model_configurations_provider", table_name="model_configurations")
    op.drop_table("model_configurations")
