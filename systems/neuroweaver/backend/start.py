#!/usr/bin/env python3
"""NeuroWeaver Backend Startup Script"""

import sys
from pathlib import Path

import uvicorn

sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings
from app.core.logging import logger


def main():
    """Start the application"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )


if __name__ == "__main__":
    main()
