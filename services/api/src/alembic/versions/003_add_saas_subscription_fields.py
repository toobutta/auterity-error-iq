"""Add SaaS subscription fields and billing tables.

Revision ID: 003
Revises: 002_create_industry_profiles_table
Create Date: 2024-01-15 10:00:00.000000

"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "003"
down_revision = "002_create_industry_profiles_table"
branch_labels = None
depends_on = None


def upgrade():
    # Add SaaS fields to tenants table
    op.add_column(
        "tenants", sa.Column("subscription_plan", sa.String(50), nullable=True)
    )
    op.add_column(
        "tenants",
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "current_period_start", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "current_period_end", sa.DateTime(timezone=True), nullable=True
        ),
    )
    op.add_column(
        "tenants",
        sa.Column("trial_end", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index(
        "ix_tenants_stripe_customer_id",
        "tenants",
        ["stripe_customer_id"],
        unique=True,
    )
    op.create_index(
        "ix_tenants_stripe_subscription_id",
        "tenants",
        ["stripe_subscription_id"],
        unique=True,
    )

    # Add usage limits
    op.add_column(
        "tenants", sa.Column("max_users", sa.Integer(), nullable=True)
    )
    op.add_column(
        "tenants", sa.Column("max_workflows", sa.Integer(), nullable=True)
    )
    op.add_column(
        "tenants",
        sa.Column("max_ai_requests_per_month", sa.Integer(), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("current_month_ai_requests", sa.Integer(), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("monthly_budget", sa.Numeric(10, 2), nullable=True),
    )

    # Add white-label branding fields
    op.add_column(
        "tenants", sa.Column("custom_domain", sa.String(255), nullable=True)
    )
    op.add_column(
        "tenants", sa.Column("logo_url", sa.String(500), nullable=True)
    )
    op.add_column(
        "tenants", sa.Column("primary_color", sa.String(7), nullable=True)
    )
    op.add_column(
        "tenants", sa.Column("secondary_color", sa.String(7), nullable=True)
    )
    op.add_column(
        "tenants", sa.Column("company_name", sa.String(255), nullable=True)
    )
    op.add_column("tenants", sa.Column("custom_css", sa.Text(), nullable=True))
    op.add_column(
        "tenants",
        sa.Column("remove_auterity_branding", sa.Boolean(), nullable=True),
    )

    # Add industry profile fields
    op.add_column(
        "tenants", sa.Column("industry_profile", sa.String(50), nullable=True)
    )
    op.add_column(
        "tenants",
        sa.Column(
            "industry_settings",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    # Set default values for existing tenants
    op.execute("UPDATE tenants SET subscription_plan = 'starter'")
    op.execute("UPDATE tenants SET max_users = 5")
    op.execute("UPDATE tenants SET max_workflows = 100")
    op.execute("UPDATE tenants SET max_ai_requests_per_month = 10000")
    op.execute("UPDATE tenants SET current_month_ai_requests = 0")
    op.execute("UPDATE tenants SET monthly_budget = 99.00")
    op.execute("UPDATE tenants SET primary_color = '#3B82F6'")
    op.execute("UPDATE tenants SET secondary_color = '#10B981'")
    op.execute("UPDATE tenants SET remove_auterity_branding = false")

    # Make required fields non-nullable after setting defaults
    op.alter_column("tenants", "subscription_plan", nullable=False)
    op.alter_column("tenants", "max_users", nullable=False)
    op.alter_column("tenants", "max_workflows", nullable=False)
    op.alter_column("tenants", "max_ai_requests_per_month", nullable=False)
    op.alter_column("tenants", "current_month_ai_requests", nullable=False)
    op.alter_column("tenants", "monthly_budget", nullable=False)
    op.alter_column("tenants", "primary_color", nullable=False)
    op.alter_column("tenants", "secondary_color", nullable=False)
    op.alter_column("tenants", "remove_auterity_branding", nullable=False)

    # Create billing_records table
    op.create_table(
        "billing_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("stripe_invoice_id", sa.String(255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column(
            "billing_period_start", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column(
            "billing_period_end", sa.DateTime(timezone=True), nullable=False
        ),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata", postgresql.JSON(astext_type=sa.Text()), nullable=True
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
            ["tenant_id"],
            ["tenants.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_billing_records_stripe_invoice_id"),
        "billing_records",
        ["stripe_invoice_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_billing_records_status"),
        "billing_records",
        ["status"],
        unique=False,
    )

    # Create usage_logs table
    op.create_table(
        "usage_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=False),
        sa.Column("resource_id", sa.String(255), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("cost", sa.Numeric(10, 4), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "metadata", postgresql.JSON(astext_type=sa.Text()), nullable=True
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["workflow_id"],
            ["workflows.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_usage_logs_resource_type"),
        "usage_logs",
        ["resource_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_usage_logs_timestamp"),
        "usage_logs",
        ["timestamp"],
        unique=False,
    )

    # Add indexes for new tenant fields
    op.create_index(
        op.f("ix_tenants_subscription_plan"),
        "tenants",
        ["subscription_plan"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tenants_stripe_customer_id"),
        "tenants",
        ["stripe_customer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tenants_industry_profile"),
        "tenants",
        ["industry_profile"],
        unique=False,
    )
    op.create_index(
        op.f("ix_tenants_custom_domain"),
        "tenants",
        ["custom_domain"],
        unique=False,
    )


def downgrade():
    # Drop indexes
    op.drop_index(op.f("ix_tenants_custom_domain"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_industry_profile"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_stripe_customer_id"), table_name="tenants")
    op.drop_index(
        op.f("ix_tenants_stripe_subscription_id"), table_name="tenants"
    )
    op.drop_index(op.f("ix_tenants_subscription_plan"), table_name="tenants")

    # Drop tables
    op.drop_table("usage_logs")
    op.drop_table("billing_records")

    # Drop columns from tenants table
    op.drop_column("tenants", "industry_settings")
    op.drop_column("tenants", "industry_profile")
    op.drop_column("tenants", "remove_auterity_branding")
    op.drop_column("tenants", "custom_css")
    op.drop_column("tenants", "company_name")
    op.drop_column("tenants", "secondary_color")
    op.drop_column("tenants", "primary_color")
    op.drop_column("tenants", "logo_url")
    op.drop_column("tenants", "custom_domain")
    op.drop_column("tenants", "current_month_ai_requests")
    op.drop_column("tenants", "max_ai_requests_per_month")
    op.drop_column("tenants", "max_workflows")
    op.drop_column("tenants", "max_users")
    op.drop_column("tenants", "monthly_budget")
    op.drop_column("tenants", "trial_end")
    op.drop_column("tenants", "current_period_end")
    op.drop_column("tenants", "current_period_start")
    op.drop_column("tenants", "stripe_subscription_id")
    op.drop_column("tenants", "stripe_customer_id")
    op.drop_column("tenants", "subscription_plan")
