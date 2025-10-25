"""Base model configuration for SQLAlchemy models."""

import os

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/workflow_engine",
)

# SQLAlchemy setup - only create engine if not in test mode
if "pytest" in os.environ.get("_", "") or "PYTEST_CURRENT_TEST" in os.environ:
    # Use SQLite for testing
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
else:
    # Production database with optimized connection pooling
    engine = create_engine(
        DATABASE_URL,
        # Connection pool settings for production performance
        pool_size=10,  # Number of connections to maintain in pool
        max_overflow=20,  # Additional connections beyond pool_size
        pool_timeout=30,  # Seconds to wait for connection from pool
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_pre_ping=True,  # Validate connections before use
        # Performance optimizations
        echo=False,  # Disable SQL logging in production
        future=True,  # Use SQLAlchemy 2.0 style
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

# Naming convention for constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

Base.metadata = MetaData(naming_convention=convention)
