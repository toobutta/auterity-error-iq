"""
Comprehensive FastAPI routers for MCP services.
Includes endpoints for MCP servers, agents, tools, workflows, and executions.
"""

import logging
from dataclasses import asdict
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.agent import Agent, AgentCreate
from app.schemas.mcp_server import MCPServerCreate
from app.services.agent_registry import AgentRegistry
from app.services.execution_manager import (
    ExecutionManager,
    ExecutionPriority,
    ExecutionStatus,
    ExecutionType,
)
from app.services.mcp_server_manager import MCPServerManager
from app.services.protocol_manager import ProtocolManager
from app.services.tool_registry import Tool, ToolRegistry, ToolStatus, ToolType

logger = logging.getLogger(__name__)

# Initialize service instances
execution_manager = ExecutionManager()
tool_registry = ToolRegistry()
protocol_manager = ProtocolManager()

# MCP Server Router
mcp_router = APIRouter(prefix="/mcp", tags=["mcp-servers"])


@mcp_router.post(
    "/servers", response_model=dict, status_code=status.HTTP_201_CREATED
)
async def create_mcp_server(
    server_data: MCPServerCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Create and start a new MCP server."""
    try:
        manager = MCPServerManager(db)

        # Start the server in background
        server_id = server_data.id
        background_tasks.add_task(
            manager.start_server, server_id, server_data.config
        )

        return {"server_id": str(server_id), "status": "starting"}
    except Exception as e:
        logger.error(f"Failed to create MCP server: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/servers/{server_id}/health")
async def check_server_health(server_id: UUID, db: Session = Depends(get_db)):
    """Check the health of an MCP server."""
    try:
        manager = MCPServerManager(db)
        health_status = await manager.health_check(server_id)
        return health_status
    except Exception:
        raise HTTPException(status_code=404, detail="Server not found")


@mcp_router.post("/servers/{server_id}/restart")
async def restart_server(
    server_id: UUID,
    config: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Restart an MCP server."""
    try:
        manager = MCPServerManager(db)
        background_tasks.add_task(manager.restart_server, server_id, config)
        return {"server_id": str(server_id), "status": "restarting"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.delete("/servers/{server_id}")
async def stop_server(server_id: UUID, db: Session = Depends(get_db)):
    """Stop an MCP server."""
    try:
        manager = MCPServerManager(db)
        success = await manager.stop_server(server_id)
        if success:
            return {"server_id": str(server_id), "status": "stopped"}
        else:
            raise HTTPException(
                status_code=404, detail="Server not found or not running"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@mcp_router.get("/servers/{server_id}/tools")
async def discover_server_tools(
    server_id: UUID, db: Session = Depends(get_db)
):
    """Discover tools available on an MCP server."""
    try:
        manager = MCPServerManager(db)
        tools = await manager.discover_tools(server_id)
        return {"server_id": str(server_id), "tools": tools}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Agent Registry Router
agent_router = APIRouter(prefix="/agents", tags=["agents"])


@agent_router.post(
    "/register", response_model=Agent, status_code=status.HTTP_201_CREATED
)
async def register_agent(
    agent_data: AgentCreate, db: Session = Depends(get_db)
):
    """Register a new agent."""
    try:
        registry = AgentRegistry(db)
        agent = registry.register_agent(agent_data)
        return agent
    except Exception as e:
        logger.error(f"Failed to register agent: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@agent_router.get("/{agent_id}", response_model=Agent)
async def get_agent(agent_id: UUID, db: Session = Depends(get_db)):
    """Get an agent by ID."""
    registry = AgentRegistry(db)
    agent = registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@agent_router.get("/", response_model=List[Agent])
async def list_agents(
    status_filter: Optional[str] = None, db: Session = Depends(get_db)
):
    """List all agents with optional status filtering."""
    registry = AgentRegistry(db)
    agents = registry.list_agents(status=status_filter)
    return agents


@agent_router.get("/discover/{capability_name}", response_model=List[Agent])
async def discover_agents_by_capability(
    capability_name: str, db: Session = Depends(get_db)
):
    """Discover agents by capability."""
    registry = AgentRegistry(db)
    agents = registry.discover_agents_by_capability(capability_name)
    return agents


@agent_router.get("/{agent_id}/health")
async def check_agent_health(agent_id: UUID, db: Session = Depends(get_db)):
    """Check the health of an agent."""
    registry = AgentRegistry(db)
    health_status = registry.health_check(agent_id)
    return health_status


@agent_router.post("/{agent_id}/validate")
async def validate_agent_config(agent_id: UUID, db: Session = Depends(get_db)):
    """Validate an agent's configuration."""
    registry = AgentRegistry(db)
    is_valid = registry.validate_agent_config(agent_id)
    return {"agent_id": str(agent_id), "valid": is_valid}


# Tool Registry Router
tool_router = APIRouter(prefix="/tools", tags=["tools"])


@tool_router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_tool(tool_data: dict):
    """Register a new tool."""
    try:
        tool = Tool(
            name=tool_data["name"],
            tool_type=ToolType(tool_data["type"]),
            description=tool_data["description"],
            server_id=UUID(tool_data["server_id"]),
            schema=tool_data["schema"],
            capabilities=tool_data["capabilities"],
            metadata=tool_data.get("metadata", {}),
        )

        success = tool_registry.register_tool(tool)
        if success:
            return {"tool_id": str(tool.id), "status": "registered"}
        else:
            raise HTTPException(
                status_code=400, detail="Failed to register tool"
            )
    except Exception as e:
        logger.error(f"Failed to register tool: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@tool_router.get("/{tool_id}")
async def get_tool(tool_id: UUID):
    """Get a tool by ID."""
    tool = tool_registry.get_tool(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool.to_dict()


@tool_router.get("/")
async def list_tools(
    server_id: Optional[UUID] = None,
    tool_type: Optional[ToolType] = None,
    capability: Optional[str] = None,
    status_filter: Optional[ToolStatus] = None,
):
    """List tools with optional filtering."""
    capabilities = [capability] if capability else None
    tools = tool_registry.list_tools(
        server_id=server_id,
        tool_type=tool_type,
        capabilities=capabilities,
        status=status_filter,
    )
    return [tool.to_dict() for tool in tools]


@tool_router.get("/discover/{capability}")
async def discover_tools_by_capability(capability: str):
    """Discover tools by capability."""
    tools = tool_registry.discover_tools_by_capability(capability)
    return [tool.to_dict() for tool in tools]


@tool_router.delete("/{tool_id}")
async def unregister_tool(tool_id: UUID):
    """Unregister a tool."""
    success = tool_registry.unregister_tool(tool_id)
    if success:
        return {"tool_id": str(tool_id), "status": "unregistered"}
    else:
        raise HTTPException(status_code=404, detail="Tool not found")


@tool_router.post("/{tool_id}/status")
async def update_tool_status(tool_id: UUID, status_data: dict):
    """Update tool status."""
    try:
        new_status = ToolStatus(status_data["status"])
        success = tool_registry.update_tool_status(tool_id, new_status)
        if success:
            return {"tool_id": str(tool_id), "status": new_status.value}
        else:
            raise HTTPException(status_code=404, detail="Tool not found")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")


@tool_router.get("/stats/registry")
async def get_registry_stats():
    """Get tool registry statistics."""
    return tool_registry.get_registry_stats()


# Execution Manager Router
execution_router = APIRouter(prefix="/executions", tags=["executions"])


@execution_router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_execution(execution_data: dict):
    """Start a new execution."""
    try:
        execution_id = await execution_manager.start_execution(
            execution_type=ExecutionType(execution_data["execution_type"]),
            target_id=execution_data["target_id"],
            target_name=execution_data["target_name"],
            user_id=UUID(execution_data["user_id"]),
            input_data=execution_data.get("input_data"),
            priority=ExecutionPriority(
                execution_data.get("priority", "normal")
            ),
            parent_execution_id=(
                UUID(execution_data["parent_execution_id"])
                if execution_data.get("parent_execution_id")
                else None
            ),
            metadata=execution_data.get("metadata"),
        )
        return {"execution_id": str(execution_id), "status": "started"}
    except Exception as e:
        logger.error(f"Failed to start execution: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@execution_router.get("/{execution_id}")
async def get_execution(execution_id: UUID):
    """Get execution details."""
    execution = execution_manager.get_execution(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return asdict(execution)


@execution_router.get("/")
async def list_executions(
    user_id: Optional[UUID] = None,
    execution_type: Optional[ExecutionType] = None,
    status_filter: Optional[ExecutionStatus] = None,
    limit: int = 100,
):
    """List executions with optional filtering."""
    executions = execution_manager.list_executions(
        user_id=user_id,
        execution_type=execution_type,
        status=status_filter,
        limit=limit,
    )
    return [asdict(execution) for execution in executions]


@execution_router.post("/{execution_id}/complete")
async def complete_execution(execution_id: UUID, result_data: dict):
    """Complete an execution with results."""
    try:
        success = await execution_manager.complete_execution(
            execution_id, result_data["output_data"]
        )
        if success:
            return {"execution_id": str(execution_id), "status": "completed"}
        else:
            raise HTTPException(status_code=404, detail="Execution not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@execution_router.post("/{execution_id}/fail")
async def fail_execution(execution_id: UUID, error_data: dict):
    """Fail an execution with error details."""
    try:
        success = await execution_manager.fail_execution(
            execution_id, error_data["error_details"]
        )
        if success:
            return {"execution_id": str(execution_id), "status": "failed"}
        else:
            raise HTTPException(status_code=404, detail="Execution not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@execution_router.post("/{execution_id}/cancel")
async def cancel_execution(execution_id: UUID):
    """Cancel an execution."""
    success = await execution_manager.cancel_execution(execution_id)
    if success:
        return {"execution_id": str(execution_id), "status": "cancelled"}
    else:
        raise HTTPException(
            status_code=404,
            detail="Execution not found or cannot be cancelled",
        )


@execution_router.get("/{execution_id}/children")
async def get_child_executions(execution_id: UUID):
    """Get child executions for a parent execution."""
    child_executions = execution_manager.get_child_executions(execution_id)
    return [asdict(execution) for execution in child_executions]


@execution_router.get("/stats/performance/{target_id}")
async def get_performance_stats(target_id: str, execution_type: ExecutionType):
    """Get performance statistics for a target."""
    stats = execution_manager.get_performance_stats(target_id, execution_type)
    return stats


@execution_router.get("/stats/analytics")
async def get_execution_analytics(
    start_date: Optional[str] = None, end_date: Optional[str] = None
):
    """Get execution analytics."""
    from datetime import datetime

    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None

    analytics = execution_manager.get_execution_analytics(start_dt, end_dt)
    return analytics


@execution_router.get("/stats/system")
async def get_system_stats():
    """Get system execution statistics."""
    return execution_manager.get_system_stats()


# Protocol Router
protocol_router = APIRouter(prefix="/protocol", tags=["protocol"])


@protocol_router.post("/message")
async def process_protocol_message(message_data: dict):
    """Process a protocol message."""
    try:
        connection_id = UUID(message_data["connection_id"])
        raw_message = message_data["message"]

        response = await protocol_manager.process_message(
            raw_message, connection_id
        )

        if response:
            return response.to_dict()
        else:
            return {"status": "processed"}
    except Exception as e:
        logger.error(f"Failed to process protocol message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@protocol_router.post("/connections/{connection_id}/register")
async def register_connection(connection_id: UUID):
    """Register a new protocol connection."""
    protocol_manager.register_connection(
        connection_id, None
    )  # Placeholder connection
    return {"connection_id": str(connection_id), "status": "registered"}


@protocol_router.delete("/connections/{connection_id}")
async def unregister_connection(connection_id: UUID):
    """Unregister a protocol connection."""
    protocol_manager.unregister_connection(connection_id)
    return {"connection_id": str(connection_id), "status": "unregistered"}


# Main router that includes all sub-routers
main_router = APIRouter()

main_router.include_router(mcp_router)
main_router.include_router(agent_router)
main_router.include_router(tool_router)
main_router.include_router(execution_router)
main_router.include_router(protocol_router)


@main_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "mcp_server_manager": "operational",
            "agent_registry": "operational",
            "tool_registry": "operational",
            "execution_manager": "operational",
            "protocol_manager": "operational",
        },
    }


@main_router.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Auterity MCP API",
        "version": "1.0.0",
        "description": "Model Context Protocol (MCP) implementation for Auterity",
        "endpoints": {
            "mcp": "/mcp",
            "agents": "/agents",
            "tools": "/tools",
            "executions": "/executions",
            "protocol": "/protocol",
            "health": "/health",
        },
    }
