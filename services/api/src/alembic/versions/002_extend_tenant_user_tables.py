import sqlalchemy as sa

from alembic import op


def upgrade():
    # Add industry_profile and profile_settings to tenants
    op.add_column(
        "tenants",
        sa.Column(
            "industry_profile",
            sa.String(50),
            sa.ForeignKey("industry_profiles.id"),
        ),
    )
    op.add_column("tenants", sa.Column("profile_settings", sa.JSON()))

    # Add preferred_profile and profile_customizations to users
    op.add_column(
        "users",
        sa.Column(
            "preferred_profile",
            sa.String(50),
            sa.ForeignKey("industry_profiles.id"),
        ),
    )
    op.add_column("users", sa.Column("profile_customizations", sa.JSON()))

    # Add profile_categories to templates
    op.add_column("templates", sa.Column("profile_categories", sa.JSON()))


def downgrade():
    # Remove columns in reverse order
    op.drop_column("templates", "profile_categories")
    op.drop_column("users", "profile_customizations")
    op.drop_column("users", "preferred_profile")
    op.drop_column("tenants", "profile_settings")
    op.drop_column("tenants", "industry_profile")
