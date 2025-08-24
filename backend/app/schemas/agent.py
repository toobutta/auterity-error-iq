"""
Pydantic schemas for Agent and AgentCapability.
"""

import enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class AgentType(str, enum.Enum):
    MCP = "MCP"
    OPENAI = "OPENAI"
    CUSTOM = "CUSTOM"
    A2A = "A2A"


class AgentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    UNHEALTHY = "UNHEALTHY"
    MAINTENANCE = "MAINTENANCE"


class AgentCapabilityBase(BaseModel):
    capability_name: str
    capability_data: Dict[str, Any]
    is_active: bool = True


class AgentCapabilityCreate(AgentCapabilityBase):
    pass


class AgentCapability(AgentCapabilityBase):
    id: UUID
    agent_id: UUID
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        orm_mode = True


class AgentBase(BaseModel):
    name: str
    type: AgentType
    capabilities: List[AgentCapabilityBase]
    config: Dict[str, Any]
    status: AgentStatus = AgentStatus.INACTIVE
    health_url: Optional[str]
    mcp_server_id: Optional[UUID]
    user_id: UUID


class AgentCreate(AgentBase):
    pass


class Agent(AgentBase):
    id: UUID
    created_at: Optional[str]
    updated_at: Optional[str]
    capabilities_rel: Optional[List[AgentCapability]]

    class Config:
        orm_mode = True
