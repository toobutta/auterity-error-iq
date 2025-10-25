"""
SQLAlchemy models for Agent and AgentCapability.
"""

import enum
import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class AgentType(enum.Enum):
    MCP = "MCP"
    OPENAI = "OPENAI"
    CUSTOM = "CUSTOM"
    A2A = "A2A"


class AgentStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    UNHEALTHY = "UNHEALTHY"
    MAINTENANCE = "MAINTENANCE"


class Agent(Base):
    __tablename__ = "agents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type: Column[AgentType] = Column(Enum(AgentType), nullable=False)
    capabilities = Column(JSON, nullable=False)
    config = Column(JSON, nullable=False)
    status: Column[AgentStatus] = Column(
        Enum(AgentStatus), nullable=False, default=AgentStatus.INACTIVE
    )
    health_url = Column(String(512))
    mcp_server_id = Column(UUID(as_uuid=True), ForeignKey("mcp_servers.id"))
    user_id = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
    capabilities_rel = relationship("AgentCapability", back_populates="agent")

    # Auterity Expansion Relationships
    memories = relationship(
        "AgentMemory", back_populates="agent", cascade="all, delete-orphan"
    )


class AgentCapability(Base):
    __tablename__ = "agent_capabilities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(
        UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False
    )
    capability_name = Column(String(255), nullable=False)
    capability_data = Column(JSON, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True))
    agent = relationship("Agent", back_populates="capabilities_rel")
