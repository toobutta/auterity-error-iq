#!/usr/bin/env python3
"""Database Initialization Script"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import init_database
from app.core.logging import logger


async def main():
    """Initialize database"""
    try:
        logger.info("Initializing database...")
        await init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
