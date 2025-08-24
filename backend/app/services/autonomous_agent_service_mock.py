"""Mock Autonomous Agent Service for testing without heavy ML dependencies."""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List
from uuid import UUID

logger = logging.getLogger(__name__)


class MockAutonomousAgentService:
    """Mock implementation of Autonomous Agent Service for testing."""

    def __init__(self):
        self.logger = logger
        self.logger.info("MockAutonomousAgentService initialized")
        self.mock_agents = {}
        self.mock_tasks = {}
        self.mock_memories = {}

    async def deploy_agent(
        self, tenant_id: UUID, agent_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock deploy an autonomous agent."""
        self.logger.info(f"Mock deploying agent for tenant {tenant_id}")

        agent_id = str(uuid.uuid4())
        agent = {
            "id": agent_id,
            "tenant_id": str(tenant_id),
            "name": agent_config.get("name", "Mock Agent"),
            "agent_type": agent_config.get("agent_type", "workflow_automation"),
            "capabilities": agent_config.get("capabilities", ["triage", "routing"]),
            "status": "active",
            "deployed_at": datetime.utcnow().isoformat(),
            "last_heartbeat": datetime.utcnow().isoformat(),
            "performance_metrics": {
                "tasks_completed": 0,
                "success_rate": 0.0,
                "average_response_time_ms": 0,
            },
        }

        self.mock_agents[agent_id] = agent
        return agent

    async def assign_task(
        self, agent_id: UUID, task_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock assign a task to an agent."""
        self.logger.info(f"Mock assigning task to agent {agent_id}")

        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "agent_id": str(agent_id),
            "task_type": task_data.get("task_type", "triage"),
            "priority": task_data.get("priority", "medium"),
            "content": task_data.get("content", "Mock task content"),
            "status": "assigned",
            "assigned_at": datetime.utcnow().isoformat(),
            "estimated_completion": (
                datetime.utcnow() + timedelta(minutes=5)
            ).isoformat(),
        }

        self.mock_tasks[task_id] = task

        # Update agent metrics
        if str(agent_id) in self.mock_agents:
            self.mock_agents[str(agent_id)]["performance_metrics"][
                "tasks_completed"
            ] += 1

        return task

    async def get_agent_memory(
        self, agent_id: UUID, context_key: str = None
    ) -> List[Dict[str, Any]]:
        """Mock get agent memory."""
        self.logger.info(f"Mock getting memory for agent {agent_id}")

        # Return mock memories
        memories = [
            {
                "id": str(uuid.uuid4()),
                "agent_id": str(agent_id),
                "context_hash": "mock_context_001",
                "memory_data": {
                    "last_triage_pattern": "urgent_issue",
                    "successful_routing": "technical_support",
                    "user_preferences": {"language": "en", "priority": "high"},
                },
                "importance_score": 0.8,
                "created_at": datetime.utcnow().isoformat(),
                "accessed_at": datetime.utcnow().isoformat(),
            }
        ]

        return memories

    async def update_agent_memory(
        self, agent_id: UUID, memory_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock update agent memory."""
        self.logger.info(f"Mock updating memory for agent {agent_id}")

        memory_id = str(uuid.uuid4())
        memory = {
            "id": memory_id,
            "agent_id": str(agent_id),
            "context_hash": memory_data.get("context_hash", "mock_context_002"),
            "memory_data": memory_data.get("memory_data", {}),
            "importance_score": memory_data.get("importance_score", 0.5),
            "created_at": datetime.utcnow().isoformat(),
            "accessed_at": datetime.utcnow().isoformat(),
        }

        self.mock_memories[memory_id] = memory
        return memory

    async def coordinate_agents(
        self, tenant_id: UUID, coordination_request: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Mock coordinate multiple agents."""
        self.logger.info(f"Mock coordinating agents for tenant {tenant_id}")

        # Find available agents
        available_agents = [
            agent
            for agent in self.mock_agents.values()
            if agent["tenant_id"] == str(tenant_id) and agent["status"] == "active"
        ]

        coordination_id = str(uuid.uuid4())
        coordination = {
            "id": coordination_id,
            "tenant_id": str(tenant_id),
            "agents_involved": len(available_agents),
            "coordination_type": coordination_request.get(
                "type", "workflow_orchestration"
            ),
            "status": "coordinated",
            "created_at": datetime.utcnow().isoformat(),
            "agent_assignments": [
                {
                    "agent_id": agent["id"],
                    "role": "primary" if i == 0 else "support",
                    "assigned_tasks": 1,
                }
                for i, agent in enumerate(available_agents[:3])  # Limit to 3 agents
            ],
        }

        return coordination

    async def get_agent_performance(
        self, tenant_id: UUID, agent_id: UUID = None
    ) -> Dict[str, Any]:
        """Mock get agent performance metrics."""
        self.logger.info(f"Mock getting performance for tenant {tenant_id}")

        if agent_id:
            # Return specific agent performance
            agent = self.mock_agents.get(str(agent_id))
            if agent:
                return {
                    "agent_id": str(agent_id),
                    "tenant_id": str(tenant_id),
                    "performance_metrics": agent["performance_metrics"],
                    "last_updated": agent["last_heartbeat"],
                }
            return {}

        # Return aggregate performance for tenant
        tenant_agents = [
            agent
            for agent in self.mock_agents.values()
            if agent["tenant_id"] == str(tenant_id)
        ]

        if not tenant_agents:
            return {
                "tenant_id": str(tenant_id),
                "total_agents": 0,
                "active_agents": 0,
                "average_success_rate": 0.0,
                "total_tasks_completed": 0,
            }

        total_tasks = sum(
            agent["performance_metrics"]["tasks_completed"] for agent in tenant_agents
        )
        active_agents = sum(1 for agent in tenant_agents if agent["status"] == "active")

        return {
            "tenant_id": str(tenant_id),
            "total_agents": len(tenant_agents),
            "active_agents": active_agents,
            "average_success_rate": 0.92,  # Mock value
            "total_tasks_completed": total_tasks,
            "performance_trend": "improving",
        }
