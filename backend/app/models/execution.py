"""Workflow execution models for tracking execution state and logs."""

import enum
import uuid

from sqlalchemy import (
    JSON,
    UUID,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class ExecutionStatus(enum.Enum):
    """Enumeration for workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowExecution(Base):
    """Model for tracking workflow execution instances."""

    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    status = Column(
        Enum(ExecutionStatus), default=ExecutionStatus.PENDING, nullable=False
    )
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    started_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True))

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    logs = relationship(
        "ExecutionLog", back_populates="execution", cascade="all, delete-orphan"
    )
    metrics = relationship(
        "ExecutionMetric", back_populates="execution", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<WorkflowExecution(id={self.id}, workflow_id={self.workflow_id}, status={self.status})>"


class ExecutionLog(Base):
    """Model for storing detailed step-by-step execution logs."""

    __tablename__ = "execution_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    execution_id = Column(
        UUID(as_uuid=True), ForeignKey("workflow_executions.id"), nullable=False
    )
    step_name = Column(String(255), nullable=False)
    step_type = Column(String(100), nullable=False)
    input_data = Column(JSON)
    output_data = Column(JSON)
    duration_ms = Column(Integer)
    error_message = Column(Text)
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    execution = relationship("WorkflowExecution", back_populates="logs")

    def __repr__(self):
        return f"<ExecutionLog(id={self.id}, execution_id={self.execution_id}, step_name='{self.step_name}')>"
