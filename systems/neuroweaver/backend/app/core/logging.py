"""
Logging configuration for NeuroWeaver
"""
import logging
import sys
from typing import Optional


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Setup application logging"""

    # Create logger
    logger = logging.getLogger("neuroweaver")
    logger.setLevel(getattr(logging, level.upper()))

    # Create console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(getattr(logging, level.upper()))

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)

    # Add handler to logger
    if not logger.handlers:
        logger.addHandler(handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given name"""
    return logging.getLogger(f"neuroweaver.{name}")


# Create default logger
logger = setup_logging()
