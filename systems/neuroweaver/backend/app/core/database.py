"""
Database configuration and models for NeuroWeaver
"""
import logging
from typing import AsyncGenerator, Optional

try:
    from datetime import datetime

    from sqlalchemy import JSON, Boolean, DateTime, String, Text
    from sqlalchemy.ext.asyncio import (
        AsyncSession,
        async_sessionmaker,
        create_async_engine,
    )
    from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

logger = logging.getLogger(__name__)


if DB_AVAILABLE:

    class Base(DeclarativeBase):
        pass

    class ModelRecord(Base):
        __tablename__ = "models"

        id: Mapped[str] = mapped_column(String(255), primary_key=True)
        name: Mapped[str] = mapped_column(String(255), nullable=False)
        description: Mapped[Optional[str]] = mapped_column(Text)
        specialization: Mapped[str] = mapped_column(String(100), nullable=False)
        base_model: Mapped[str] = mapped_column(String(255), nullable=False)
        status: Mapped[str] = mapped_column(String(50), nullable=False)
        version: Mapped[str] = mapped_column(String(50), nullable=False)
        created_by: Mapped[str] = mapped_column(String(255), nullable=False)
        created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
        updated_at: Mapped[datetime] = mapped_column(
            DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
        )
        training_config: Mapped[Optional[dict]] = mapped_column(JSON)
        performance_metrics: Mapped[Optional[dict]] = mapped_column(JSON)
        deployment_info: Mapped[Optional[dict]] = mapped_column(JSON)
        is_active: Mapped[bool] = mapped_column(Boolean, default=True)
        auto_deploy: Mapped[bool] = mapped_column(Boolean, default=False)

    # Database engine and session
    engine = None
    AsyncSessionLocal = None

    async def init_database():
        """Initialize database connection"""
        global engine, AsyncSessionLocal

        if not DB_AVAILABLE:
            logger.warning("Database libraries not available")
            return

        try:
            from .config import settings

            engine = create_async_engine(settings.DATABASE_URL)
            AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

            # Create tables
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise

    async def close_database():
        """Close database connection"""
        global engine

        if engine:
            await engine.dispose()
            logger.info("Database connection closed")

    async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not AsyncSessionLocal:
            raise RuntimeError("Database not initialized")

        async with AsyncSessionLocal() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

else:
    # Fallback implementations when database is not available
    class ModelRecord:
        pass

    async def init_database():
        logger.warning("Database not available - using fallback")

    async def close_database():
        pass

    async def get_db_session():
        raise RuntimeError("Database not available")

    AsyncSessionLocal = None
