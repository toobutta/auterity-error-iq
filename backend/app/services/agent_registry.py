"""
AgentRegistry service for agent registration, discovery, capability matching, health checks, and config validation.
"""

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentCapability, AgentStatus
from app.schemas.agent import AgentCreate


class AgentRegistry:
    def __init__(self, db: Session):
        self.db = db

    def register_agent(self, agent_data: AgentCreate) -> Agent:
        # Register a new agent and its capabilities
        agent = Agent(
            name=agent_data.name,
            type=agent_data.type,
            capabilities=[cap.dict() for cap in agent_data.capabilities],
            config=agent_data.config,
            status=agent_data.status,
            health_url=agent_data.health_url,
            mcp_server_id=agent_data.mcp_server_id,
            user_id=agent_data.user_id,
        )
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        for cap in agent_data.capabilities:
            capability = AgentCapability(
                agent_id=agent.id,
                capability_name=cap.capability_name,
                capability_data=cap.capability_data,
                is_active=cap.is_active,
            )
            self.db.add(capability)
        self.db.commit()
        return agent

    def get_agent(self, agent_id: UUID) -> Optional[Agent]:
        return self.db.query(Agent).filter(Agent.id == agent_id).first()

    def list_agents(self, status: Optional[AgentStatus] = None) -> List[Agent]:
        query = self.db.query(Agent)
        if status:
            query = query.filter(Agent.status == status)
        return query.all()

    def discover_agents_by_capability(self, capability_name: str) -> List[Agent]:
        agents = (
            self.db.query(Agent)
            .join(AgentCapability)
            .filter(
                AgentCapability.capability_name == capability_name,
                AgentCapability.is_active == True,
            )
            .all()
        )
        return agents

    def health_check(self, agent_id: UUID) -> Dict[str, Any]:
        agent = self.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        # Placeholder for actual health check logic (e.g., HTTP request to health_url)
        return {"agent_id": str(agent_id), "status": agent.status.name}

    def validate_agent_config(self, agent_id: UUID) -> bool:
        agent = self.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        # Placeholder for config validation logic
        return True

    def update_agent_status(self, agent_id: UUID, status: AgentStatus) -> Agent:
        agent = self.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        agent.status = status
        self.db.commit()
        self.db.refresh(agent)
        return agent
