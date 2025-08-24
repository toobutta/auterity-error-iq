"""
Tool Registry for managing and discovering available tools across MCP servers.
Implements tool registration, discovery, capability validation, and execution tracking.
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

logger = logging.getLogger(__name__)


class ToolType(str, Enum):
    FUNCTION = "function"
    RESOURCE = "resource"
    PROMPT = "prompt"
    COMMAND = "command"


class ToolStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DEPRECATED = "deprecated"
    ERROR = "error"


class Tool:
    def __init__(
        self,
        name: str,
        tool_type: ToolType,
        description: str,
        server_id: UUID,
        schema: Dict[str, Any],
        capabilities: List[str],
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.id = uuid4()
        self.name = name
        self.tool_type = tool_type
        self.description = description
        self.server_id = server_id
        self.schema = schema
        self.capabilities = capabilities
        self.metadata = metadata or {}
        self.status = ToolStatus.ACTIVE
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.execution_count = 0
        self.last_execution = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.tool_type.value,
            "description": self.description,
            "server_id": str(self.server_id),
            "schema": self.schema,
            "capabilities": self.capabilities,
            "metadata": self.metadata,
            "status": self.status.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "execution_count": self.execution_count,
            "last_execution": (
                self.last_execution.isoformat() if self.last_execution else None
            ),
        }


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[UUID, Tool] = {}
        self.server_tools: Dict[UUID, List[UUID]] = {}
        self.capability_index: Dict[str, List[UUID]] = {}
        self.name_index: Dict[str, UUID] = {}

    def register_tool(self, tool: Tool) -> bool:
        """Register a new tool in the registry."""
        try:
            # Check for name conflicts
            if tool.name in self.name_index:
                existing_tool_id = self.name_index[tool.name]
                existing_tool = self.tools[existing_tool_id]
                if existing_tool.server_id != tool.server_id:
                    logger.warning(
                        f"Tool name conflict: {tool.name} already exists from different server"
                    )
                    return False

            # Register the tool
            self.tools[tool.id] = tool
            self.name_index[tool.name] = tool.id

            # Update server index
            if tool.server_id not in self.server_tools:
                self.server_tools[tool.server_id] = []
            self.server_tools[tool.server_id].append(tool.id)

            # Update capability index
            for capability in tool.capabilities:
                if capability not in self.capability_index:
                    self.capability_index[capability] = []
                self.capability_index[capability].append(tool.id)

            logger.info(
                f"Registered tool: {tool.name} (ID: {tool.id}) from server {tool.server_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Failed to register tool {tool.name}: {str(e)}")
            return False

    def unregister_tool(self, tool_id: UUID) -> bool:
        """Unregister a tool from the registry."""
        try:
            if tool_id not in self.tools:
                logger.warning(f"Tool {tool_id} not found for unregistration")
                return False

            tool = self.tools[tool_id]

            # Remove from name index
            if tool.name in self.name_index:
                del self.name_index[tool.name]

            # Remove from server index
            if tool.server_id in self.server_tools:
                if tool_id in self.server_tools[tool.server_id]:
                    self.server_tools[tool.server_id].remove(tool_id)

            # Remove from capability index
            for capability in tool.capabilities:
                if capability in self.capability_index:
                    if tool_id in self.capability_index[capability]:
                        self.capability_index[capability].remove(tool_id)

            # Remove the tool
            del self.tools[tool_id]

            logger.info(f"Unregistered tool: {tool.name} (ID: {tool_id})")
            return True

        except Exception as e:
            logger.error(f"Failed to unregister tool {tool_id}: {str(e)}")
            return False

    def get_tool(self, tool_id: UUID) -> Optional[Tool]:
        """Get a tool by ID."""
        return self.tools.get(tool_id)

    def get_tool_by_name(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        tool_id = self.name_index.get(name)
        return self.tools.get(tool_id) if tool_id else None

    def list_tools(
        self,
        server_id: Optional[UUID] = None,
        tool_type: Optional[ToolType] = None,
        capabilities: Optional[List[str]] = None,
        status: Optional[ToolStatus] = None,
    ) -> List[Tool]:
        """List tools with optional filtering."""
        tools = list(self.tools.values())

        if server_id:
            tools = [t for t in tools if t.server_id == server_id]

        if tool_type:
            tools = [t for t in tools if t.tool_type == tool_type]

        if capabilities:
            tools = [
                t for t in tools if any(cap in t.capabilities for cap in capabilities)
            ]

        if status:
            tools = [t for t in tools if t.status == status]

        return tools

    def discover_tools_by_capability(self, capability: str) -> List[Tool]:
        """Discover tools that provide a specific capability."""
        tool_ids = self.capability_index.get(capability, [])
        return [self.tools[tool_id] for tool_id in tool_ids if tool_id in self.tools]

    def validate_tool_schema(self, tool: Tool) -> bool:
        """Validate a tool's schema."""
        try:
            # Basic schema validation
            required_fields = ["type", "properties"]
            if not all(field in tool.schema for field in required_fields):
                return False

            # Validate tool type specific requirements
            if tool.tool_type == ToolType.FUNCTION:
                if "parameters" not in tool.schema:
                    return False

            return True

        except Exception as e:
            logger.error(f"Schema validation failed for tool {tool.name}: {str(e)}")
            return False

    def update_tool_execution(self, tool_id: UUID) -> bool:
        """Update tool execution statistics."""
        try:
            if tool_id not in self.tools:
                return False

            tool = self.tools[tool_id]
            tool.execution_count += 1
            tool.last_execution = datetime.utcnow()
            tool.updated_at = datetime.utcnow()

            logger.debug(f"Updated execution stats for tool {tool.name}")
            return True

        except Exception as e:
            logger.error(
                f"Failed to update execution stats for tool {tool_id}: {str(e)}"
            )
            return False

    def update_tool_status(self, tool_id: UUID, status: ToolStatus) -> bool:
        """Update a tool's status."""
        try:
            if tool_id not in self.tools:
                return False

            self.tools[tool_id].status = status
            self.tools[tool_id].updated_at = datetime.utcnow()

            logger.info(f"Updated tool {tool_id} status to {status.value}")
            return True

        except Exception as e:
            logger.error(f"Failed to update tool status: {str(e)}")
            return False

    def get_server_tools(self, server_id: UUID) -> List[Tool]:
        """Get all tools for a specific server."""
        tool_ids = self.server_tools.get(server_id, [])
        return [self.tools[tool_id] for tool_id in tool_ids if tool_id in self.tools]

    def unregister_server_tools(self, server_id: UUID) -> int:
        """Unregister all tools for a specific server."""
        tool_ids = self.server_tools.get(server_id, []).copy()
        count = 0

        for tool_id in tool_ids:
            if self.unregister_tool(tool_id):
                count += 1

        logger.info(f"Unregistered {count} tools for server {server_id}")
        return count

    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics."""
        total_tools = len(self.tools)
        active_tools = len(
            [t for t in self.tools.values() if t.status == ToolStatus.ACTIVE]
        )
        server_count = len(self.server_tools)
        capability_count = len(self.capability_index)

        return {
            "total_tools": total_tools,
            "active_tools": active_tools,
            "inactive_tools": total_tools - active_tools,
            "servers_with_tools": server_count,
            "unique_capabilities": capability_count,
            "tools_by_type": {
                tool_type.value: len(
                    [t for t in self.tools.values() if t.tool_type == tool_type]
                )
                for tool_type in ToolType
            },
        }
