"""Database optimization script"""

import asyncio

from sqlalchemy import text

from app.database import engine


async def optimize_database():
    """Run database optimizations"""
    async with engine.begin() as conn:
        # Add indexes for common queries
        await conn.execute(
            text(
                """
            CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
            CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
            CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
            CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
        """
            )
        )

        # Update table statistics
        await conn.execute(text("ANALYZE;"))

    print("Database optimizations completed")


if __name__ == "__main__":
    asyncio.run(optimize_database())
