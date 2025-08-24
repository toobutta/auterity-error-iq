"""Database models for model configuration and usage tracking."""

import uuid

from sqlalchemy import JSON, UUID, Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from .base import Base


class ModelUsage(Base):
    """Track model usage and costs."""

    __tablename__ = "model_usage"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(100), nullable=False)
    provider = Column(String(50), nullable=False)
    tokens_used = Column(Integer, nullable=False)
    cost = Column(Float, nullable=False)
    execution_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ModelConfiguration(Base):
    """Store dynamic model configurations."""

    __tablename__ = "model_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    provider = Column(String(50), nullable=False)
    config = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
