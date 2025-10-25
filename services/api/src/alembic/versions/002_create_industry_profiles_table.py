import sqlalchemy as sa

from alembic import op


def upgrade():
    op.create_table(
        "industry_profiles",
        sa.Column("id", sa.String(50), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("template_categories", sa.JSON()),
        sa.Column("ai_model_preferences", sa.JSON()),
        sa.Column("workflow_patterns", sa.JSON()),
        sa.Column("compliance_requirements", sa.JSON()),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("industry_profiles")
