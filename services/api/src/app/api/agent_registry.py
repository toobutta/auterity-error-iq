"""
from app.schemas.agent import Agent, AgentCreate
from app.schemas.agent import Agent
from app.schemas.agent import AgentCreate
FastAPI router for AgentRegistry endpoints.
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.agent import Agent, AgentCreate
from app.services.agent_registry import AgentRegistry

router = APIRouter(prefix="/agents", tags=["agents"])


@router.post(
    "/register", response_model=Agent, status_code=status.HTTP_201_CREATED
)
def register_agent(agent: AgentCreate, db: Session = Depends(get_db)):
    registry = AgentRegistry(db)
    return registry.register_agent(agent)


@router.get("/{agent_id}", response_model=Agent)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    registry = AgentRegistry(db)
    agent = registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.get("/", response_model=List[Agent])
def list_agents(db: Session = Depends(get_db)):
    registry = AgentRegistry(db)
    return registry.list_agents()


@router.get("/discover/{capability_name}", response_model=List[Agent])
def discover_agents_by_capability(
    capability_name: str, db: Session = Depends(get_db)
):
    registry = AgentRegistry(db)
    return registry.discover_agents_by_capability(capability_name)


@router.get("/health/{agent_id}")
def health_check(agent_id: str, db: Session = Depends(get_db)):
    registry = AgentRegistry(db)
    return registry.health_check(agent_id)


@router.post("/validate/{agent_id}")
def validate_agent_config(agent_id: str, db: Session = Depends(get_db)):
    registry = AgentRegistry(db)
    return {"valid": registry.validate_agent_config(agent_id)}
