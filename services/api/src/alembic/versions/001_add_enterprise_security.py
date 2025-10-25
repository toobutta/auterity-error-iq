"""Add enterprise security features

Revision ID: 001_enterprise_security
Revises:
Create Date: 2025-01-08 12:00:00.000000

"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers
revision = "001_enterprise_security"
down_revision = "0001"
depends_on = None


def upgrade():
    # Create tenants table
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=100), nullable=False),
        sa.Column("domain", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sso_enabled", sa.Boolean(), nullable=False),
        sa.Column("sso_provider", sa.String(length=20), nullable=True),
        sa.Column("sso_config", sa.JSON(), nullable=True),
        sa.Column("audit_enabled", sa.Boolean(), nullable=False),
        sa.Column(
            "audit_retention_days", sa.String(length=10), nullable=False
        ),
        sa.Column("metadata", sa.JSON(), nullable=True),
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
    )
    op.create_index(op.f("ix_tenants_name"), "tenants", ["name"], unique=False)
    op.create_index(op.f("ix_tenants_slug"), "tenants", ["slug"], unique=True)
    op.create_index(
        op.f("ix_tenants_domain"), "tenants", ["domain"], unique=True
    )

    # Create sso_configurations table
    op.create_table(
        "sso_configurations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("saml_entity_id", sa.String(length=255), nullable=True),
        sa.Column("saml_sso_url", sa.String(length=500), nullable=True),
        sa.Column("saml_x509_cert", sa.Text(), nullable=True),
        sa.Column("oidc_issuer", sa.String(length=500), nullable=True),
        sa.Column("oidc_client_id", sa.String(length=255), nullable=True),
        sa.Column("oidc_client_secret", sa.String(length=255), nullable=True),
        sa.Column("oidc_redirect_uri", sa.String(length=500), nullable=True),
        sa.Column("auto_provision_users", sa.Boolean(), nullable=False),
        sa.Column("default_role", sa.String(length=50), nullable=False),
        sa.Column("attribute_mapping", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
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

    # Create audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("resource_type", sa.String(length=100), nullable=False),
        sa.Column("resource_id", sa.String(length=255), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("session_id", sa.String(length=255), nullable=True),
        sa.Column("old_values", sa.JSON(), nullable=True),
        sa.Column("new_values", sa.JSON(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_audit_logs_event_type"),
        "audit_logs",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_resource_type"),
        "audit_logs",
        ["resource_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_resource_id"),
        "audit_logs",
        ["resource_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False
    )
    op.create_index(
        op.f("ix_audit_logs_timestamp"),
        "audit_logs",
        ["timestamp"],
        unique=False,
    )

    # Add tenant_id to users table
    op.add_column(
        "users",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "users", sa.Column("sso_provider", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("sso_subject_id", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
    )

    # Make hashed_password nullable for SSO users
    op.alter_column("users", "hashed_password", nullable=True)

    # Add foreign key constraint for tenant_id
    op.create_foreign_key(
        "fk_users_tenant_id", "users", "tenants", ["tenant_id"], ["id"]
    )
    op.create_index(
        "uq_users_sso_provider_subject",
        "users",
        ["sso_provider", "sso_subject_id"],
        unique=True,
    )

    # Remove unique constraint on email (will be unique per tenant)
    op.drop_index("ix_users_email", table_name="users")
    op.create_index(
        "ix_users_email_tenant", "users", ["email", "tenant_id"], unique=True
    )

    # Create default tenant for existing users
    op.execute(
        """
        INSERT INTO tenants (id, name, slug, domain, status, sso_enabled, audit_enabled, audit_retention_days)
        VALUES (gen_random_uuid(), 'Default Tenant', 'default', 'localhost', 'active', false, true, '365')
    """
    )

    # Update existing users to belong to default tenant
    op.execute(
        """
        UPDATE users
        SET tenant_id = (SELECT id FROM tenants WHERE slug = 'default')
        WHERE tenant_id IS NULL
    """
    )

    # Make tenant_id not nullable after updating existing records
    op.alter_column("users", "tenant_id", nullable=False)


def downgrade():
    # Remove foreign key and columns from users table
    op.drop_constraint("fk_users_tenant_id", "users", type_="foreignkey")
    op.drop_index("ix_users_email_tenant", table_name="users")
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.drop_index("uq_users_sso_provider_subject", table_name="users")
    op.drop_column("users", "last_login")
    op.drop_column("users", "sso_subject_id")
    op.drop_column("users", "sso_provider")
    op.drop_column("users", "tenant_id")

    # Make hashed_password not nullable again
    op.alter_column("users", "hashed_password", nullable=False)

    # Drop audit_logs table
    op.drop_index(op.f("ix_audit_logs_timestamp"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_resource_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_resource_type"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_event_type"), table_name="audit_logs")
    op.drop_table("audit_logs")

    # Drop sso_configurations table
    op.drop_table("sso_configurations")

    # Drop tenants table
    op.drop_index(op.f("ix_tenants_domain"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_slug"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_name"), table_name="tenants")
    op.drop_table("tenants")
