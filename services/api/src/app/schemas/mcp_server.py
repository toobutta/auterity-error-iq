"""
Pydantic schemas for MCP Server operations.
"""

from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel


class MCPServerStatus(str, Enum):
    STOPPED = "STOPPED"
    STARTING = "STARTING"
    RUNNING = "RUNNING"
    STOPPING = "STOPPING"
    ERROR = "ERROR"


class MCPProtocolVersion(str, Enum):
    V1_0 = "1.0"
    V2_0 = "2.0"


class MCPServerBase(BaseModel):
    name: str
    config: Dict[str, Any]
    protocol_version: MCPProtocolVersion = MCPProtocolVersion.V1_0
    capabilities: Dict[str, Any]
    user_id: UUID


class MCPServerCreate(MCPServerBase):
    pass


class MCPServer(MCPServerBase):
    id: UUID
    status: MCPServerStatus
    created_at: Optional[str]
    updated_at: Optional[str]

    class Config:
        orm_mode = True
