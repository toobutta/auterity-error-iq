"""
SQLAlchemy models for MCP Server functionality.
Based on the Alembic migration created earlier.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Enum, String
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class MCPServerStatus(enum.Enum):
    STOPPED = "STOPPED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    STOPPING = "STOPPING"
    ERROR = "ERROR"


class MCPProtocolVersion(enum.Enum):
    V1_0 = "1.0"
    V2_0 = "2.0"


class MCPServer(Base):
    __tablename__ = "mcp_servers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    config = Column(JSON, nullable=False)
    status: Column[MCPServerStatus] = Column(
        Enum(MCPServerStatus), nullable=False, default=MCPServerStatus.STOPPED
    )
    protocol_version: Column[MCPProtocolVersion] = Column(
        Enum(MCPProtocolVersion),
        nullable=False,
        default=MCPProtocolVersion.V1_0,
    )
    capabilities = Column(JSON, nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
