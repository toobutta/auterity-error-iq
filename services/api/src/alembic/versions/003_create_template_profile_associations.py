import sqlalchemy as sa

from alembic import op


def upgrade():
    op.create_table(
        "template_profile_associations",
        sa.Column(
            "template_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("templates.id"),
            primary_key=True,
        ),
        sa.Column(
            "profile_id",
            sa.String(50),
            sa.ForeignKey("industry_profiles.id"),
            primary_key=True,
        ),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("template_profile_associations")
