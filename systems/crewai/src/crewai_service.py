"""
Auterity CrewAI Multi-Agent Collaborative System Service
Provides intelligent multi-agent orchestration with role-based collaboration
"""

import asyncio
import logging
import json
import uuid
import time
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, asdict, field
from datetime import datetime
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
import threading

import uvicorn
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import redis
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
redis_client = redis.Redis(host='localhost', port=6379, db=5, decode_responses=True)
agent_registry = {}
crew_executions = {}
performance_metrics = {
    'total_crews': 0,
    'active_crews': 0,
    'completed_crews': 0,
    'failed_crews': 0,
    'total_agents': 0,
    'active_agents': 0,
    'average_execution_time': 0.0,
    'collaboration_efficiency': 0.0,
    'agent_utilization_rate': 0.0
}

@dataclass
class AgentCapability:
    """Represents a capability that an agent can perform"""
    name: str
    description: str
    parameters: Dict[str, Any] = None
    required_tools: List[str] = None
    cost_per_use: float = 0.0
    success_rate: float = 1.0

    def __post_init__(self):
        if self.parameters is None:
            self.parameters = {}
        if self.required_tools is None:
            self.required_tools = []

@dataclass
class AgentRole:
    """Represents an agent's role and responsibilities"""
    name: str
    description: str
    capabilities: List[AgentCapability] = None
    expertise_areas: List[str] = None
    collaboration_patterns: List[str] = None
    priority_level: int = 1

    def __post_init__(self):
        if self.capabilities is None:
            self.capabilities = []
        if self.expertise_areas is None:
            self.expertise_areas = []
        if self.collaboration_patterns is None:
            self.collaboration_patterns = []

@dataclass
class CrewAgent:
    """Represents an individual agent in the crew"""
    id: str
    name: str
    role: AgentRole
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2000
    memory_size: int = 100
    current_task: Optional[str] = None
    performance_score: float = 1.0
    collaboration_history: List[Dict[str, Any]] = None
    status: str = "idle"  # idle, busy, error

    def __post_init__(self):
        if self.collaboration_history is None:
            self.collaboration_history = []

@dataclass
class Task:
    """Represents a task to be executed by the crew"""
    id: str
    description: str
    assigned_agent: Optional[str] = None
    status: str = "pending"  # pending, in_progress, completed, failed
    priority: int = 1
    dependencies: List[str] = None
    estimated_duration: float = 0.0
    actual_duration: float = 0.0
    result: Optional[Any] = None
    error: Optional[str] = None
    context: Dict[str, Any] = None
    created_at: datetime = None
    completed_at: Optional[datetime] = None

    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []
        if self.context is None:
            self.context = {}
        if self.created_at is None:
            self.created_at = datetime.now()

@dataclass
class Crew:
    """Represents a collaborative crew of agents"""
    id: str
    name: str
    description: str
    agents: List[CrewAgent] = None
    tasks: List[Task] = None
    goal: str = ""
    status: str = "initialized"  # initialized, active, completed, failed
    collaboration_strategy: str = "hierarchical"  # hierarchical, democratic, swarm
    max_concurrent_tasks: int = 3
    created_at: datetime = None
    completed_at: Optional[datetime] = None
    performance_metrics: Dict[str, Any] = None

    def __post_init__(self):
        if self.agents is None:
            self.agents = []
        if self.tasks is None:
            self.tasks = []
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.performance_metrics is None:
            self.performance_metrics = {}

@dataclass
class CollaborationResult:
    """Result of a crew collaboration"""
    crew_id: str
    execution_id: str
    status: str  # completed, failed, partial_success
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float = 0.0
    task_results: List[Dict[str, Any]] = None
    collaboration_metrics: Dict[str, Any] = None
    agent_performance: Dict[str, Any] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.task_results is None:
            self.task_results = []
        if self.collaboration_metrics is None:
            self.collaboration_metrics = {}
        if self.agent_performance is None:
            self.agent_performance = {}
        if self.metadata is None:
            self.metadata = {}

class IntelligentCrewOrchestrator:
    """AI-powered crew orchestration and collaboration system"""

    def __init__(self):
        self.crews: Dict[str, Crew] = {}
        self.active_executions: Dict[str, asyncio.Task] = {}
        self.agent_pool: Dict[str, CrewAgent] = {}
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.collaboration_executor = ThreadPoolExecutor(max_workers=10)

    async def create_crew(self, crew_config: Dict[str, Any]) -> str:
        """Create a new collaborative crew"""
        try:
            crew_id = crew_config.get('id', f"crew-{int(time.time())}")

            # Create agents from configuration
            agents = []
            for agent_config in crew_config.get('agents', []):
                agent = await self._create_agent_from_config(agent_config)
                agents.append(agent)
                self.agent_pool[agent.id] = agent

            # Create tasks from configuration
            tasks = []
            for task_config in crew_config.get('tasks', []):
                task = Task(**task_config)
                tasks.append(task)

            # Create crew
            crew = Crew(
                id=crew_id,
                name=crew_config['name'],
                description=crew_config.get('description', ''),
                agents=agents,
                tasks=tasks,
                goal=crew_config.get('goal', ''),
                collaboration_strategy=crew_config.get('collaboration_strategy', 'hierarchical'),
                max_concurrent_tasks=crew_config.get('max_concurrent_tasks', 3)
            )

            self.crews[crew_id] = crew

            logger.info(f"✅ Created crew {crew_id} with {len(agents)} agents and {len(tasks)} tasks")
            return crew_id

        except Exception as e:
            logger.error(f"❌ Failed to create crew: {e}")
            raise HTTPException(status_code=500, detail=f"Crew creation failed: {str(e)}")

    async def execute_crew(self, crew_id: str, input_data: Dict[str, Any]) -> CollaborationResult:
        """Execute a crew with intelligent collaboration"""
        if crew_id not in self.crews:
            raise HTTPException(status_code=404, detail=f"Crew {crew_id} not found")

        execution_id = f"{crew_id}_{int(time.time())}_{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        try:
            crew = self.crews[crew_id]
            crew.status = "active"

            # Initialize execution tracking
            execution_result = CollaborationResult(
                crew_id=crew_id,
                execution_id=execution_id,
                status="in_progress"
            )

            # Execute crew tasks with intelligent orchestration
            result = await self._execute_crew_tasks(crew, input_data, execution_result)

            # Calculate final metrics
            execution_time = time.time() - start_time
            execution_result.execution_time = execution_time
            execution_result.status = "completed"

            # Update global metrics
            performance_metrics['total_crews'] += 1
            performance_metrics['completed_crews'] += 1
            performance_metrics['average_execution_time'] = (
                performance_metrics['average_execution_time'] + execution_time
            ) / 2

            crew.status = "completed"
            crew.completed_at = datetime.now()

            logger.info(".2f"            return execution_result

        except Exception as e:
            performance_metrics['failed_crews'] += 1
            logger.error(f"❌ Crew execution failed {execution_id}: {e}")

            return CollaborationResult(
                crew_id=crew_id,
                execution_id=execution_id,
                status="failed",
                error=str(e),
                execution_time=time.time() - start_time
            )

    async def _execute_crew_tasks(self, crew: Crew, input_data: Dict[str, Any], result: CollaborationResult) -> Any:
        """Execute crew tasks with intelligent collaboration"""
        # Initialize task execution tracking
        pending_tasks = crew.tasks.copy()
        completed_tasks = []
        running_tasks = []

        # Task dependency graph
        task_graph = self._build_task_dependency_graph(crew.tasks)

        # Execute tasks based on collaboration strategy
        if crew.collaboration_strategy == "hierarchical":
            return await self._execute_hierarchical(crew, pending_tasks, task_graph, input_data, result)
        elif crew.collaboration_strategy == "democratic":
            return await self._execute_democratic(crew, pending_tasks, task_graph, input_data, result)
        elif crew.collaboration_strategy == "swarm":
            return await self._execute_swarm(crew, pending_tasks, task_graph, input_data, result)
        else:
            # Default to hierarchical
            return await self._execute_hierarchical(crew, pending_tasks, task_graph, input_data, result)

    async def _execute_hierarchical(self, crew: Crew, tasks: List[Task], task_graph: Dict[str, List[str]],
                                   input_data: Dict[str, Any], result: CollaborationResult) -> Any:
        """Execute tasks in hierarchical manner with manager-agent coordination"""
        # Find the manager agent (usually the first agent or one with management capabilities)
        manager_agent = next((agent for agent in crew.agents if "manager" in agent.role.name.lower()), crew.agents[0])

        # Execute tasks through the manager
        final_result = input_data

        for task in tasks:
            # Manager assigns task to appropriate agent
            assigned_agent = await self._assign_task_to_agent(task, crew.agents, manager_agent)

            if assigned_agent:
                task.assigned_agent = assigned_agent.id
                task.status = "in_progress"
                task_start = time.time()

                try:
                    # Execute task
                    task_result = await self._execute_agent_task(assigned_agent, task, final_result)

                    task.status = "completed"
                    task.result = task_result
                    task.actual_duration = time.time() - task_start
                    task.completed_at = datetime.now()

                    final_result = task_result

                    # Record collaboration
                    result.task_results.append({
                        'task_id': task.id,
                        'agent_id': assigned_agent.id,
                        'result': task_result,
                        'duration': task.actual_duration
                    })

                except Exception as e:
                    task.status = "failed"
                    task.error = str(e)
                    task.actual_duration = time.time() - task_start

                    logger.error(f"Task {task.id} failed: {e}")

        return final_result

    async def _execute_democratic(self, crew: Crew, tasks: List[Task], task_graph: Dict[str, List[str]],
                                 input_data: Dict[str, Any], result: CollaborationResult) -> Any:
        """Execute tasks democratically with agent consensus"""
        # All agents vote on task assignments and execution
        final_result = input_data

        for task in tasks:
            # Agents vote on who should execute the task
            votes = await self._get_agent_votes(crew.agents, task)

            # Assign to agent with most votes
            assigned_agent_id = max(votes, key=votes.get)
            assigned_agent = next(agent for agent in crew.agents if agent.id == assigned_agent_id)

            task.assigned_agent = assigned_agent.id
            task.status = "in_progress"

            try:
                task_result = await self._execute_agent_task(assigned_agent, task, final_result)
                final_result = task_result

                result.task_results.append({
                    'task_id': task.id,
                    'agent_id': assigned_agent.id,
                    'votes': votes,
                    'result': task_result
                })

            except Exception as e:
                logger.error(f"Democratic task execution failed: {e}")

        return final_result

    async def _execute_swarm(self, crew: Crew, tasks: List[Task], task_graph: Dict[str, List[str]],
                            input_data: Dict[str, Any], result: CollaborationResult) -> Any:
        """Execute tasks in swarm mode with parallel processing"""
        # Execute tasks in parallel across all available agents
        semaphore = asyncio.Semaphore(crew.max_concurrent_tasks)

        async def execute_task_parallel(task: Task):
            async with semaphore:
                # Find best agent for this task
                best_agent = await self._find_best_agent_for_task(task, crew.agents)

                if best_agent:
                    task.assigned_agent = best_agent.id
                    return await self._execute_agent_task(best_agent, task, input_data)
                return None

        # Execute all tasks in parallel
        parallel_results = await asyncio.gather(
            *[execute_task_parallel(task) for task in tasks],
            return_exceptions=True
        )

        # Combine results
        final_result = {}
        for i, task_result in enumerate(parallel_results):
            if not isinstance(task_result, Exception):
                final_result[f"task_{i}"] = task_result
                result.task_results.append({
                    'task_id': tasks[i].id,
                    'result': task_result,
                    'execution_mode': 'parallel'
                })

        return final_result

    def _build_task_dependency_graph(self, tasks: List[Task]) -> Dict[str, List[str]]:
        """Build task dependency graph"""
        graph = {}
        for task in tasks:
            graph[task.id] = task.dependencies or []
        return graph

    async def _assign_task_to_agent(self, task: Task, agents: List[CrewAgent], manager_agent: CrewAgent) -> Optional[CrewAgent]:
        """Assign task to most suitable agent"""
        # Simple assignment logic - can be enhanced with AI
        best_agent = None
        best_score = 0

        for agent in agents:
            score = self._calculate_agent_task_fit(agent, task)
            if score > best_score:
                best_score = score
                best_agent = agent

        return best_agent

    def _calculate_agent_task_fit(self, agent: CrewAgent, task: Task) -> float:
        """Calculate how well an agent fits a task"""
        score = 0

        # Check capabilities match
        task_keywords = task.description.lower().split()
        for capability in agent.role.capabilities:
            for keyword in task_keywords:
                if keyword in capability.name.lower() or keyword in capability.description.lower():
                    score += 1

        # Check expertise areas
        for expertise in agent.role.expertise_areas:
            for keyword in task_keywords:
                if keyword in expertise.lower():
                    score += 2

        # Factor in agent performance
        score *= agent.performance_score

        return score

    async def _execute_agent_task(self, agent: CrewAgent, task: Task, context: Dict[str, Any]) -> Any:
        """Execute a task using an agent"""
        agent.status = "busy"
        agent.current_task = task.id

        try:
            # Prepare prompt for AI execution
            prompt = self._build_agent_prompt(agent, task, context)

            # Call AI service (vLLM or other)
            result = await self._call_ai_service({
                'prompt': prompt,
                'model': agent.model,
                'temperature': agent.temperature,
                'max_tokens': agent.max_tokens
            })

            # Update agent performance
            agent.performance_score = min(1.0, agent.performance_score + 0.1)
            agent.collaboration_history.append({
                'task_id': task.id,
                'result': 'success',
                'timestamp': datetime.now()
            })

            return result

        except Exception as e:
            agent.performance_score = max(0.1, agent.performance_score - 0.2)
            agent.collaboration_history.append({
                'task_id': task.id,
                'result': 'failure',
                'error': str(e),
                'timestamp': datetime.now()
            })
            raise

        finally:
            agent.status = "idle"
            agent.current_task = None

    def _build_agent_prompt(self, agent: CrewAgent, task: Task, context: Dict[str, Any]) -> str:
        """Build prompt for agent task execution"""
        role_description = f"You are {agent.name}, a {agent.role.name}. {agent.role.description}"

        capabilities = "\n".join([
            f"- {cap.name}: {cap.description}"
            for cap in agent.role.capabilities
        ])

        prompt = f"""{role_description}

Your capabilities:
{capabilities}

Task: {task.description}

Context: {json.dumps(context, indent=2)}

Please execute this task using your expertise and capabilities.
Provide a detailed, actionable response."""

        return prompt

    async def _get_agent_votes(self, agents: List[CrewAgent], task: Task) -> Dict[str, int]:
        """Get votes from agents on task assignment"""
        votes = {}

        for agent in agents:
            # Simple voting logic - can be enhanced with AI
            if self._calculate_agent_task_fit(agent, task) > 0:
                votes[agent.id] = votes.get(agent.id, 0) + 1

        return votes

    async def _find_best_agent_for_task(self, task: Task, agents: List[CrewAgent]) -> Optional[CrewAgent]:
        """Find the best agent for a task"""
        best_agent = None
        best_score = 0

        for agent in agents:
            score = self._calculate_agent_task_fit(agent, task)
            if score > best_score:
                best_score = score
                best_agent = agent

        return best_agent

    async def _create_agent_from_config(self, config: Dict[str, Any]) -> CrewAgent:
        """Create an agent from configuration"""
        role = AgentRole(
            name=config['role']['name'],
            description=config['role']['description'],
            capabilities=[
                AgentCapability(**cap) for cap in config['role'].get('capabilities', [])
            ],
            expertise_areas=config['role'].get('expertise_areas', []),
            collaboration_patterns=config['role'].get('collaboration_patterns', [])
        )

        agent = CrewAgent(
            id=config['id'],
            name=config['name'],
            role=role,
            model=config.get('model', 'gpt-4'),
            temperature=config.get('temperature', 0.7),
            max_tokens=config.get('max_tokens', 2000)
        )

        return agent

    async def _call_ai_service(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Call AI service (vLLM or other)"""
        try:
            # Try vLLM first
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://vllm-server:8001/v1/generate',
                    json=request_data,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get('response', result)

        except Exception as e:
            logger.warning(f"vLLM call failed, trying OpenAI: {e}")

        # Fallback to OpenAI or other provider
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'https://api.openai.com/v1/chat/completions',
                    json={
                        'model': request_data.get('model', 'gpt-4'),
                        'messages': [{'role': 'user', 'content': request_data['prompt']}],
                        'temperature': request_data.get('temperature', 0.7),
                        'max_tokens': request_data.get('max_tokens', 2000)
                    },
                    headers={'Authorization': f"Bearer {os.getenv('OPENAI_API_KEY', '')}"},
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result['choices'][0]['message']['content']

        except Exception as e:
            logger.error(f"AI service call failed: {e}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

    async def get_crew_metrics(self) -> Dict[str, Any]:
        """Get comprehensive crew performance metrics"""
        total_agents = len(self.agent_pool)
        active_agents = len([a for a in self.agent_pool.values() if a.status == "busy"])

        return {
            'performance_metrics': performance_metrics.copy(),
            'total_crews': len(self.crews),
            'active_crews': len([c for c in self.crews.values() if c.status == "active"]),
            'total_agents': total_agents,
            'active_agents': active_agents,
            'agent_utilization_rate': active_agents / max(total_agents, 1),
            'collaboration_efficiency': self._calculate_collaboration_efficiency(),
            'timestamp': datetime.now()
        }

    def _calculate_collaboration_efficiency(self) -> float:
        """Calculate overall collaboration efficiency"""
        if not self.crews:
            return 0.0

        total_tasks = sum(len(crew.tasks) for crew in self.crews.values())
        completed_tasks = sum(
            len([t for t in crew.tasks if t.status == "completed"])
            for crew in self.crews.values()
        )

        return completed_tasks / max(total_tasks, 1)

# Global crew orchestrator instance
crew_orchestrator = IntelligentCrewOrchestrator()

# FastAPI models
class AgentRoleModel(BaseModel):
    name: str
    description: str
    capabilities: List[Dict[str, Any]] = []
    expertise_areas: List[str] = []
    collaboration_patterns: List[str] = []

class CrewAgentModel(BaseModel):
    id: str
    name: str
    role: AgentRoleModel
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2000

class TaskModel(BaseModel):
    id: str
    description: str
    priority: int = 1
    dependencies: List[str] = []
    estimated_duration: float = 0.0
    context: Dict[str, Any] = {}

class CreateCrewRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: str = ""
    agents: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    goal: str = ""
    collaboration_strategy: str = "hierarchical"
    max_concurrent_tasks: int = 3

class ExecuteCrewRequest(BaseModel):
    input_data: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Auterity CrewAI Service")
    yield
    logger.info("🛑 Shutting down Auterity CrewAI Service")

# Create FastAPI application
app = FastAPI(
    title="Auterity CrewAI Service",
    description="Intelligent multi-agent collaborative systems with AI-powered orchestration",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    """Service information endpoint"""
    return {
        "service": "Auterity CrewAI Service",
        "version": "1.0.0",
        "description": "Multi-agent collaborative systems",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "active_crews": len([c for c in crew_orchestrator.crews.values() if c.status == "active"]),
        "total_crews": len(crew_orchestrator.crews),
        "total_agents": len(crew_orchestrator.agent_pool),
        "active_agents": len([a for a in crew_orchestrator.agent_pool.values() if a.status == "busy"])
    }

@app.post("/crews")
async def create_crew(request: CreateCrewRequest):
    """Create a new collaborative crew"""
    try:
        crew_config = request.dict()
        crew_id = await crew_orchestrator.create_crew(crew_config)

        return {
            "crew_id": crew_id,
            "status": "created",
            "timestamp": datetime.now()
        }

    except Exception as e:
        logger.error(f"Crew creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/crews/{crew_id}/execute")
async def execute_crew(crew_id: str, request: ExecuteCrewRequest):
    """Execute a crew collaboration"""
    try:
        result = await crew_orchestrator.execute_crew(crew_id, request.input_data)

        return {
            "execution_id": result.execution_id,
            "status": result.status,
            "result": result.result,
            "execution_time": result.execution_time,
            "task_results": result.task_results,
            "timestamp": datetime.now()
        }

    except Exception as e:
        logger.error(f"Crew execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/crews/{crew_id}")
async def get_crew(crew_id: str):
    """Get crew details"""
    if crew_id not in crew_orchestrator.crews:
        raise HTTPException(status_code=404, detail="Crew not found")

    crew = crew_orchestrator.crews[crew_id]
    return {
        "crew_id": crew_id,
        "name": crew.name,
        "description": crew.description,
        "status": crew.status,
        "agent_count": len(crew.agents),
        "task_count": len(crew.tasks),
        "collaboration_strategy": crew.collaboration_strategy,
        "created_at": crew.created_at,
        "performance_metrics": crew.performance_metrics
    }

@app.get("/crews")
async def list_crews():
    """List all crews"""
    crews = []
    for crew_id, crew in crew_orchestrator.crews.items():
        crews.append({
            "id": crew_id,
            "name": crew.name,
            "status": crew.status,
            "agent_count": len(crew.agents),
            "task_count": len(crew.tasks),
            "created_at": crew.created_at
        })

    return {"crews": crews}

@app.get("/agents")
async def list_agents():
    """List all agents in the pool"""
    agents = []
    for agent_id, agent in crew_orchestrator.agent_pool.items():
        agents.append({
            "id": agent_id,
            "name": agent.name,
            "role": agent.role.name,
            "status": agent.status,
            "performance_score": agent.performance_score,
            "current_task": agent.current_task
        })

    return {"agents": agents}

@app.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    return await crew_orchestrator.get_crew_metrics()

@app.delete("/crews/{crew_id}")
async def delete_crew(crew_id: str):
    """Delete a crew"""
    if crew_id not in crew_orchestrator.crews:
        raise HTTPException(status_code=404, detail="Crew not found")

    # Remove agents from pool
    crew = crew_orchestrator.crews[crew_id]
    for agent in crew.agents:
        if agent.id in crew_orchestrator.agent_pool:
            del crew_orchestrator.agent_pool[agent.id]

    del crew_orchestrator.crews[crew_id]
    return {"message": f"Crew {crew_id} deleted"}

if __name__ == "__main__":
    uvicorn.run(
        "crewai_service:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )

