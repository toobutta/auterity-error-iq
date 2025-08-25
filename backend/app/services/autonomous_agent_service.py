"""Autonomous Agent Service - Domain-specific AI agents with memory and coordination."""

import hashlib
import json
import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.models.agent import Agent, AgentStatus, AgentType
from app.models.auterity_expansion import AgentMemory
from app.models.tenant import Tenant
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class AgentConfig:
    """Configuration for autonomous agents."""

    def __init__(
        self,
        name: str,
        agent_type: str,
        capabilities: List[str],
        memory_config: Optional[Dict[str, Any]] = None,
        coordination_rules: Optional[Dict[str, Any]] = None,
        escalation_policy: Optional[Dict[str, Any]] = None,
    ):
        self.name = name
        self.agent_type = agent_type
        self.capabilities = capabilities
        self.memory_config = memory_config or {}
        self.coordination_rules = coordination_rules or {}
        self.escalation_policy = escalation_policy or {}


class AgentInstance:
    """Instance of a deployed autonomous agent."""

    def __init__(
        self,
        agent_id: UUID,
        name: str,
        status: str,
        capabilities: List[str],
        memory_enabled: bool,
        coordination_enabled: bool,
        deployment_time_ms: int,
    ):
        self.agent_id = agent_id
        self.name = name
        self.status = status
        self.capabilities = capabilities
        self.memory_enabled = memory_enabled
        self.coordination_enabled = coordination_enabled
        self.deployment_time_ms = deployment_time_ms


class TaskAssignment:
    """Task assignment for autonomous agents."""

    def __init__(
        self,
        task_id: str,
        task_type: str,
        priority: int,
        description: str,
        assigned_agent: UUID,
        status: str,
        created_at: datetime,
    ):
        self.task_id = task_id
        self.task_type = task_type
        self.priority = priority
        self.description = description
        self.assigned_agent = assigned_agent
        self.status = status
        self.created_at = created_at


class AutonomousAgentService:
    """Service for managing autonomous AI agents with memory and coordination."""

    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIService()
        self.vector_service = VectorService()
        self._agent_cache: Dict[UUID, Agent] = {}

    async def deploy_agent(
        self, agent_config: AgentConfig, tenant_id: UUID
    ) -> AgentInstance:
        """Deploy a new autonomous agent."""
        start_time = time.time()

        try:
            # Validate tenant
            tenant = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Create agent record
            agent = Agent(
                name=agent_config.name,
                type=AgentType.CUSTOM,
                capabilities=agent_config.capabilities,
                config={
                    "memory_config": agent_config.memory_config,
                    "coordination_rules": agent_config.coordination_rules,
                    "escalation_policy": agent_config.escalation_policy,
                    "deployment_time": datetime.utcnow().isoformat(),
                },
                status=AgentStatus.ACTIVE,
                user_id=tenant_id,  # Using tenant_id as user_id for now
            )

            self.db.add(agent)
            self.db.commit()
            self.db.refresh(agent)

            # Initialize memory system if configured
            memory_enabled = await self._initialize_agent_memory(
                agent, agent_config.memory_config
            )

            # Initialize coordination if configured
            coordination_enabled = await self._initialize_coordination(
                agent, agent_config.coordination_rules
            )

            deployment_time = int((time.time() - start_time) * 1000)

            return AgentInstance(
                agent_id=agent.id,
                name=agent.name,
                status=agent.status.value,
                capabilities=agent.capabilities,
                memory_enabled=memory_enabled,
                coordination_enabled=coordination_enabled,
                deployment_time_ms=deployment_time,
            )

        except Exception as e:
            logger.error(f"Agent deployment failed: {str(e)}")
            self.db.rollback()
            raise

    async def assign_task(
        self, agent_id: UUID, task_data: Dict[str, Any], tenant_id: UUID
    ) -> Optional[TaskAssignment]:
        """Assign a task to an autonomous agent."""
        try:
            # Validate agent
            agent = (
                self.db.query(Agent)
                .filter(and_(Agent.id == agent_id, Agent.status == AgentStatus.ACTIVE))
                .first()
            )

            if not agent:
                raise ValueError(f"Active agent {agent_id} not found")

            # Create task assignment
            task_id = f"task_{int(time.time())}_{hash(str(task_data)) % 10000}"
            task = TaskAssignment(
                task_id=task_id,
                task_type=task_data.get("type", "general"),
                priority=task_data.get("priority", 1),
                description=task_data.get("description", ""),
                assigned_agent=agent_id,
                status="assigned",
                created_at=datetime.utcnow(),
            )

            # Store task in agent's memory
            await self._store_task_in_memory(agent_id, task, tenant_id)

            # Execute task if agent is autonomous
            if self._is_autonomous_task(task_data):
                await self._execute_autonomous_task(agent, task, task_data)

            return task

        except Exception as e:
            logger.error(f"Task assignment failed: {str(e)}")
            return None

    async def get_agent_memory(
        self, agent_id: UUID, context_key: Optional[str] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieve agent memory for context awareness."""
        try:
            query = self.db.query(AgentMemory).filter(AgentMemory.agent_id == agent_id)

            if context_key:
                # Filter by context if provided
                query = query.filter(AgentMemory.context_hash.like(f"%{context_key}%"))

            memories = (
                query.order_by(
                    AgentMemory.importance_score.desc(),
                    AgentMemory.accessed_at.desc().nullslast(),
                )
                .limit(limit)
                .all()
            )

            # Update access time for retrieved memories
            for memory in memories:
                memory.accessed_at = datetime.utcnow()

            self.db.commit()

            return [
                {
                    "id": str(memory.id),
                    "context_hash": memory.context_hash,
                    "memory_data": memory.memory_data,
                    "importance_score": float(memory.importance_score),
                    "created_at": memory.created_at.isoformat(),
                    "accessed_at": (
                        memory.accessed_at.isoformat() if memory.accessed_at else None
                    ),
                }
                for memory in memories
            ]

        except Exception as e:
            logger.error(f"Failed to retrieve agent memory: {str(e)}")
            return []

    async def store_memory(
        self,
        agent_id: UUID,
        context_key: str,
        memory_data: Dict[str, Any],
        importance_score: float = 0.5,
    ) -> Optional[AgentMemory]:
        """Store new memory for an agent."""
        try:
            # Create context hash
            context_hash = hashlib.sha256(
                f"{context_key}_{json.dumps(memory_data, sort_keys=True)}".encode()
            ).hexdigest()

            # Check if similar memory already exists
            existing = (
                self.db.query(AgentMemory)
                .filter(
                    and_(
                        AgentMemory.agent_id == agent_id,
                        AgentMemory.context_hash == context_hash,
                    )
                )
                .first()
            )

            if existing:
                # Update existing memory
                existing.memory_data.update(memory_data)
                existing.importance_score = max(
                    existing.importance_score, importance_score
                )
                existing.accessed_at = datetime.utcnow()
                self.db.commit()
                return existing

            # Create new memory
            memory = AgentMemory(
                agent_id=agent_id,
                context_hash=context_hash,
                memory_data=memory_data,
                importance_score=importance_score,
            )

            self.db.add(memory)
            self.db.commit()
            self.db.refresh(memory)

            return memory

        except Exception as e:
            logger.error(f"Failed to store agent memory: {str(e)}")
            self.db.rollback()
            return None

    async def coordinate_agents(
        self, primary_agent_id: UUID, coordination_task: Dict[str, Any], tenant_id: UUID
    ) -> Dict[str, Any]:
        """Coordinate multiple agents for complex tasks."""
        try:
            # Get primary agent
            primary_agent = (
                self.db.query(Agent)
                .filter(
                    and_(
                        Agent.id == primary_agent_id, Agent.status == AgentStatus.ACTIVE
                    )
                )
                .first()
            )

            if not primary_agent:
                raise ValueError(f"Primary agent {primary_agent_id} not found")

            # Get coordination rules
            coordination_rules = primary_agent.config.get("coordination_rules", {})

            # Find agents to coordinate with
            coordination_agents = await self._find_coordination_agents(
                primary_agent, coordination_task, tenant_id
            )

            if not coordination_agents:
                return {
                    "status": "no_coordination_needed",
                    "message": "No coordination agents found for this task",
                }

            # Execute coordinated task
            coordination_result = await self._execute_coordinated_task(
                primary_agent, coordination_agents, coordination_task
            )

            # Store coordination memory
            await self.store_memory(
                agent_id=primary_agent_id,
                context_key="coordination",
                memory_data={
                    "task": coordination_task,
                    "agents_involved": [str(agent.id) for agent in coordination_agents],
                    "result": coordination_result,
                    "timestamp": datetime.utcnow().isoformat(),
                },
                importance_score=0.8,
            )

            return coordination_result

        except Exception as e:
            logger.error(f"Agent coordination failed: {str(e)}")
            return {"status": "error", "message": f"Coordination failed: {str(e)}"}

    async def get_agent_performance(
        self, agent_id: UUID, days: int = 30
    ) -> Dict[str, Any]:
        """Get performance metrics for an agent."""
        try:
            from datetime import datetime, timedelta

            cutoff_date = datetime.utcnow() - timedelta(days=days)

            # Get memory usage
            memory_count = (
                self.db.query(func.count(AgentMemory.id))
                .filter(
                    and_(
                        AgentMemory.agent_id == agent_id,
                        AgentMemory.created_at >= cutoff_date,
                    )
                )
                .scalar()
            )

            # Get task assignments (if stored in memory)
            task_memories = (
                self.db.query(AgentMemory)
                .filter(
                    and_(
                        AgentMemory.agent_id == agent_id,
                        AgentMemory.created_at >= cutoff_date,
                        AgentMemory.memory_data.has_key("task"),
                    )
                )
                .all()
            )

            completed_tasks = sum(
                1
                for memory in task_memories
                if memory.memory_data.get("task", {}).get("status") == "completed"
            )

            total_tasks = len(task_memories)
            completion_rate = (
                (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            )

            # Get average memory importance
            avg_importance = (
                self.db.query(func.avg(AgentMemory.importance_score))
                .filter(
                    and_(
                        AgentMemory.agent_id == agent_id,
                        AgentMemory.created_at >= cutoff_date,
                    )
                )
                .scalar()
                or 0.0
            )

            return {
                "agent_id": str(agent_id),
                "period_days": days,
                "memory_entries": memory_count,
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "completion_rate": round(completion_rate, 2),
                "avg_memory_importance": round(float(avg_importance), 3),
            }

        except Exception as e:
            logger.error(f"Failed to get agent performance: {str(e)}")
            return {
                "agent_id": str(agent_id),
                "period_days": days,
                "memory_entries": 0,
                "total_tasks": 0,
                "completed_tasks": 0,
                "completion_rate": 0.0,
                "avg_memory_importance": 0.0,
            }

    async def _initialize_agent_memory(
        self, agent: Agent, memory_config: Dict[str, Any]
    ) -> bool:
        """Initialize memory system for an agent."""
        try:
            if not memory_config:
                return False

            # Create initial memory entry
            initial_memory = {
                "deployment": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "config": memory_config,
                    "status": "initialized",
                }
            }

            await self.store_memory(
                agent_id=agent.id,
                context_key="system",
                memory_data=initial_memory,
                importance_score=1.0,
            )

            return True

        except Exception as e:
            logger.error(f"Failed to initialize agent memory: {str(e)}")
            return False

    async def _initialize_coordination(
        self, agent: Agent, coordination_rules: Dict[str, Any]
    ) -> bool:
        """Initialize coordination system for an agent."""
        try:
            if not coordination_rules:
                return False

            # Store coordination rules in memory
            await self.store_memory(
                agent_id=agent.id,
                context_key="coordination_rules",
                memory_data=coordination_rules,
                importance_score=0.9,
            )

            return True

        except Exception as e:
            logger.error(f"Failed to initialize coordination: {str(e)}")
            return False

    async def _store_task_in_memory(
        self, agent_id: UUID, task: TaskAssignment, tenant_id: UUID
    ) -> None:
        """Store task assignment in agent memory."""
        try:
            task_memory = {
                "task_id": task.task_id,
                "type": task.task_type,
                "priority": task.priority,
                "description": task.description,
                "status": task.status,
                "assigned_at": task.created_at.isoformat(),
            }

            await self.store_memory(
                agent_id=agent_id,
                context_key=f"task_{task.task_id}",
                memory_data=task_memory,
                importance_score=0.7,
            )

        except Exception as e:
            logger.error(f"Failed to store task in memory: {str(e)}")

    def _is_autonomous_task(self, task_data: Dict[str, Any]) -> bool:
        """Check if a task can be executed autonomously."""
        return task_data.get("autonomous", False)

    async def _execute_autonomous_task(
        self, agent: Agent, task: TaskAssignment, task_data: Dict[str, Any]
    ) -> None:
        """Execute a task autonomously using AI."""
        try:
            # Get agent context from memory
            context_memories = await self.get_agent_memory(
                agent_id=agent.id, context_key="context", limit=10
            )

            # Build execution prompt
            prompt = self._build_task_execution_prompt(
                task, task_data, context_memories
            )

            # Execute with AI
            ai_response = await self.ai_service.generate_completion(
                prompt=prompt, model="gpt-4", max_tokens=1000, temperature=0.1
            )

            # Store execution result in memory
            execution_result = {
                "task_id": task.task_id,
                "ai_response": ai_response,
                "execution_time": datetime.utcnow().isoformat(),
                "status": "completed",
            }

            await self.store_memory(
                agent_id=agent.id,
                context_key=f"execution_{task.task_id}",
                memory_data=execution_result,
                importance_score=0.8,
            )

        except Exception as e:
            logger.error(f"Autonomous task execution failed: {str(e)}")

            # Store error in memory
            error_result = {
                "task_id": task.task_id,
                "error": str(e),
                "execution_time": datetime.utcnow().isoformat(),
                "status": "failed",
            }

            await self.store_memory(
                agent_id=agent.id,
                context_key=f"execution_{task.task_id}",
                memory_data=error_result,
                importance_score=0.9,
            )

    async def _find_coordination_agents(
        self, primary_agent: Agent, coordination_task: Dict[str, Any], tenant_id: UUID
    ) -> List[Agent]:
        """Find agents to coordinate with for a task."""
        try:
            # Get coordination rules
            coordination_rules = primary_agent.config.get("coordination_rules", {})
            required_capabilities = coordination_task.get("required_capabilities", [])

            # Find agents with required capabilities
            coordination_agents = []

            if required_capabilities:
                agents = (
                    self.db.query(Agent)
                    .filter(
                        and_(
                            Agent.status == AgentStatus.ACTIVE,
                            Agent.id != primary_agent.id,
                        )
                    )
                    .all()
                )

                for agent in agents:
                    agent_capabilities = agent.capabilities or []
                    if any(cap in agent_capabilities for cap in required_capabilities):
                        coordination_agents.append(agent)

            return coordination_agents

        except Exception as e:
            logger.error(f"Failed to find coordination agents: {str(e)}")
            return []

    async def _execute_coordinated_task(
        self,
        primary_agent: Agent,
        coordination_agents: List[Agent],
        coordination_task: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute a coordinated task across multiple agents."""
        try:
            # Build coordination prompt
            prompt = self._build_coordination_prompt(
                primary_agent, coordination_agents, coordination_task
            )

            # Execute coordination with AI
            ai_response = await self.ai_service.generate_completion(
                prompt=prompt, model="gpt-4", max_tokens=1500, temperature=0.1
            )

            return {
                "status": "coordinated",
                "primary_agent": str(primary_agent.id),
                "agents_involved": len(coordination_agents),
                "ai_response": ai_response,
                "coordination_time": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Coordinated task execution failed: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "coordination_time": datetime.utcnow().isoformat(),
            }

    def _build_task_execution_prompt(
        self,
        task: TaskAssignment,
        task_data: Dict[str, Any],
        context_memories: List[Dict[str, Any]],
    ) -> str:
        """Build prompt for autonomous task execution."""
        context_summary = "\n".join(
            [
                f"- {memory.get('memory_data', {}).get('description', 'No description')}"
                for memory in context_memories[:5]
            ]
        )

        prompt = f"""You are an autonomous AI agent executing a task. Use your context and capabilities to complete the task effectively.

Task: {task.description}
Type: {task.task_type}
Priority: {task.priority}

Recent Context:
{context_summary}

Instructions:
1. Analyze the task requirements
2. Use your context and capabilities
3. Execute the task step by step
4. Provide a detailed response of what was accomplished
5. Suggest any follow-up actions if needed

Execute the task and respond with your results:"""

        return prompt

    def _build_coordination_prompt(
        self,
        primary_agent: Agent,
        coordination_agents: List[Agent],
        coordination_task: Dict[str, Any],
    ) -> str:
        """Build prompt for agent coordination."""
        agent_summaries = "\n".join(
            [
                f"- {agent.name}: {', '.join(agent.capabilities or [])}"
                for agent in coordination_agents
            ]
        )

        prompt = f"""You are coordinating multiple AI agents to complete a complex task.

Primary Agent: {primary_agent.name}
Coordination Agents:
{agent_summaries}

Task: {coordination_task.get('description', 'No description')}
Required Capabilities: {', '.join(coordination_task.get('required_capabilities', []))}

Instructions:
1. Analyze the task requirements
2. Assign roles to each agent based on their capabilities
3. Coordinate the execution plan
4. Provide a detailed coordination strategy
5. Suggest monitoring and communication protocols

Develop a coordination strategy:"""

        return prompt
