"""
Auterity LangGraph AI-Powered Workflow Orchestration Service
Provides intelligent workflow orchestration with AI-driven decision making
"""

import asyncio
import logging
import json
import time
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
from contextlib import asynccontextmanager

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
redis_client = redis.Redis(host='localhost', port=6379, db=4, decode_responses=True)
workflow_cache = {}
performance_metrics = {
    'total_workflows': 0,
    'active_workflows': 0,
    'completed_workflows': 0,
    'failed_workflows': 0,
    'average_execution_time': 0.0,
    'average_decision_time': 0.0
}

@dataclass
class WorkflowNode:
    """Represents a node in the workflow graph"""
    id: str
    type: str  # 'llm', 'tool', 'condition', 'integration', 'human'
    config: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class WorkflowEdge:
    """Represents an edge between workflow nodes"""
    source: str
    target: str
    condition: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class WorkflowState:
    """Represents the current state of a workflow execution"""
    messages: List[Dict[str, Any]] = None
    context: Dict[str, Any] = None
    current_node: str = ""
    execution_path: List[str] = None
    results: Dict[str, Any] = None
    errors: List[Dict[str, Any]] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.messages is None:
            self.messages = []
        if self.context is None:
            self.context = {}
        if self.execution_path is None:
            self.execution_path = []
        if self.results is None:
            self.results = {}
        if self.errors is None:
            self.errors = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class WorkflowExecutionResult:
    """Result of a workflow execution"""
    workflow_id: str
    execution_id: str
    status: str  # 'completed', 'failed', 'running', 'paused'
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_path: List[str] = None
    execution_time: float = 0.0
    decision_time: float = 0.0
    node_executions: List[Dict[str, Any]] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.execution_path is None:
            self.execution_path = []
        if self.node_executions is None:
            self.node_executions = []
        if self.metadata is None:
            self.metadata = {}

class IntelligentWorkflowEngine:
    """AI-powered workflow execution engine"""

    def __init__(self):
        self.workflows: Dict[str, Dict[str, Any]] = {}
        self.active_executions: Dict[str, WorkflowState] = {}
        self.node_registry: Dict[str, Callable] = {}

        # Register built-in node types
        self._register_builtin_nodes()

    def _register_builtin_nodes(self):
        """Register built-in node types"""
        self.node_registry.update({
            'llm': self._execute_llm_node,
            'tool': self._execute_tool_node,
            'condition': self._execute_condition_node,
            'integration': self._execute_integration_node,
            'human': self._execute_human_node,
            'decision': self._execute_ai_decision_node
        })

    async def create_workflow(self, workflow_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> str:
        """Create a new workflow from nodes and edges"""
        try:
            # Convert to internal format
            workflow_nodes = [WorkflowNode(**node) for node in nodes]
            workflow_edges = [WorkflowEdge(**edge) for edge in edges]

            # Build execution graph
            execution_graph = self._build_execution_graph(workflow_nodes, workflow_edges)

            # Store workflow
            self.workflows[workflow_id] = {
                'nodes': {node.id: node for node in workflow_nodes},
                'edges': workflow_edges,
                'execution_graph': execution_graph,
                'created_at': datetime.now(),
                'version': '1.0'
            }

            logger.info(f"✅ Created workflow {workflow_id} with {len(workflow_nodes)} nodes")
            return workflow_id

        except Exception as e:
            logger.error(f"❌ Failed to create workflow {workflow_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Workflow creation failed: {str(e)}")

    def _build_execution_graph(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> Dict[str, Any]:
        """Build execution graph from nodes and edges"""
        graph = {}

        # Group edges by source node
        edges_by_source = {}
        for edge in edges:
            if edge.source not in edges_by_source:
                edges_by_source[edge.source] = []
            edges_by_source[edge.source].append(edge)

        # Build adjacency list
        for node in nodes:
            node_edges = edges_by_source.get(node.id, [])
            graph[node.id] = {
                'node': node,
                'outgoing': node_edges,
                'incoming': [edge for edge in edges if edge.target == node.id]
            }

        return graph

    async def execute_workflow(self, workflow_id: str, initial_input: Dict[str, Any]) -> WorkflowExecutionResult:
        """Execute a workflow with AI-powered orchestration"""
        if workflow_id not in self.workflows:
            raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")

        execution_id = f"{workflow_id}_{int(time.time())}_{hash(str(initial_input))}"
        start_time = time.time()

        try:
            workflow = self.workflows[workflow_id]
            execution_graph = workflow['execution_graph']

            # Initialize execution state
            state = WorkflowState()
            state.context.update(initial_input)
            state.execution_path = []
            state.current_node = self._find_start_node(execution_graph)

            # Execute workflow
            result = await self._execute_workflow_graph(execution_graph, state, execution_id)

            # Calculate metrics
            execution_time = time.time() - start_time
            decision_time = sum(node.get('decision_time', 0) for node in result.node_executions)

            # Update global metrics
            performance_metrics['total_workflows'] += 1
            performance_metrics['completed_workflows'] += 1
            performance_metrics['average_execution_time'] = (
                performance_metrics['average_execution_time'] + execution_time
            ) / 2
            performance_metrics['average_decision_time'] = (
                performance_metrics['average_decision_time'] + decision_time
            ) / 2

            # Create result
            workflow_result = WorkflowExecutionResult(
                workflow_id=workflow_id,
                execution_id=execution_id,
                status='completed',
                result=result.results,
                execution_path=result.execution_path,
                execution_time=execution_time,
                decision_time=decision_time,
                node_executions=result.node_executions,
                metadata={
                    'completed_at': datetime.now(),
                    'node_count': len(execution_graph),
                    'edge_count': len(workflow['edges'])
                }
            )

            logger.info(".2f"            return workflow_result

        except Exception as e:
            performance_metrics['failed_workflows'] += 1
            logger.error(f"❌ Workflow execution failed {execution_id}: {e}")

            return WorkflowExecutionResult(
                workflow_id=workflow_id,
                execution_id=execution_id,
                status='failed',
                error=str(e),
                execution_time=time.time() - start_time
            )

    def _find_start_node(self, execution_graph: Dict[str, Any]) -> str:
        """Find the starting node in the workflow graph"""
        # Find nodes with no incoming edges
        for node_id, node_data in execution_graph.items():
            if not node_data['incoming']:
                return node_id

        # Fallback to first node
        return list(execution_graph.keys())[0] if execution_graph else ""

    async def _execute_workflow_graph(self, execution_graph: Dict[str, Any], state: WorkflowState, execution_id: str) -> WorkflowState:
        """Execute the workflow graph with AI-powered routing"""
        visited = set()
        node_executions = []

        while state.current_node and state.current_node not in visited:
            visited.add(state.current_node)
            state.execution_path.append(state.current_node)

            node_data = execution_graph.get(state.current_node)
            if not node_data:
                break

            node = node_data['node']

            # Execute current node
            logger.info(f"🎯 Executing node {state.current_node} ({node.type})")

            node_start_time = time.time()
            try:
                result = await self._execute_node(node, state)
                execution_time = time.time() - node_start_time

                node_executions.append({
                    'node_id': state.current_node,
                    'node_type': node.type,
                    'execution_time': execution_time,
                    'status': 'success',
                    'result': result
                })

                state.results[state.current_node] = result

            except Exception as e:
                execution_time = time.time() - node_start_time
                logger.error(f"❌ Node execution failed {state.current_node}: {e}")

                node_executions.append({
                    'node_id': state.current_node,
                    'node_type': node.type,
                    'execution_time': execution_time,
                    'status': 'failed',
                    'error': str(e)
                })

                state.errors.append({
                    'node_id': state.current_node,
                    'error': str(e),
                    'timestamp': datetime.now()
                })

                # Check if we should continue or fail
                if node.config.get('continue_on_error', False):
                    pass  # Continue to next node
                else:
                    break

            # Determine next node with AI-powered routing
            next_node = await self._determine_next_node(
                execution_graph,
                state,
                node_data['outgoing']
            )

            state.current_node = next_node

        state.node_executions = node_executions
        return state

    async def _determine_next_node(self, execution_graph: Dict[str, Any], state: WorkflowState, outgoing_edges: List[WorkflowEdge]) -> Optional[str]:
        """AI-powered decision making for next node selection"""
        if not outgoing_edges:
            return None

        if len(outgoing_edges) == 1:
            return outgoing_edges[0].target

        # Multiple possible paths - use AI to decide
        try:
            decision = await self._make_ai_decision(state, outgoing_edges)
            return decision.get('next_node')
        except Exception as e:
            logger.warning(f"AI decision failed, using fallback: {e}")
            # Fallback to first edge
            return outgoing_edges[0].target

    async def _make_ai_decision(self, state: WorkflowState, edges: List[WorkflowEdge]) -> Dict[str, Any]:
        """Make AI-powered decision for workflow routing"""
        # This would integrate with vLLM or other AI services
        # For now, return a simple decision
        return {
            'next_node': edges[0].target,
            'confidence': 0.8,
            'reasoning': 'Default routing decision'
        }

    async def _execute_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute a workflow node"""
        executor = self.node_registry.get(node.type)
        if not executor:
            raise ValueError(f"Unknown node type: {node.type}")

        return await executor(node, state)

    async def _execute_llm_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute an LLM node by calling vLLM service"""
        try:
            prompt = node.config.get('prompt', '')
            model = node.config.get('model', 'gpt-4')
            temperature = node.config.get('temperature', 0.7)
            max_tokens = node.config.get('max_tokens', 500)

            # Prepare request
            request_data = {
                'prompt': prompt,
                'temperature': temperature,
                'max_tokens': max_tokens,
                'model': model
            }

            # Call vLLM service
            result = await self._call_vllm_service(request_data)
            return result

        except Exception as e:
            logger.error(f"LLM node execution failed: {e}")
            raise

    async def _execute_tool_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute a tool node"""
        tool_name = node.config.get('tool_name')
        tool_params = node.config.get('parameters', {})

        # This would integrate with various tool services
        # For now, return a placeholder
        return {
            'tool': tool_name,
            'result': f'Executed {tool_name} with params {tool_params}',
            'timestamp': datetime.now()
        }

    async def _execute_condition_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute a condition node"""
        condition = node.config.get('condition', 'true')

        # Simple condition evaluation (would be more sophisticated)
        try:
            # Evaluate condition against state
            result = eval(condition, {'state': state, 'len': len, 'str': str})
            return {'condition': condition, 'result': result}
        except Exception as e:
            logger.error(f"Condition evaluation failed: {e}")
            return {'condition': condition, 'result': False, 'error': str(e)}

    async def _execute_integration_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute an integration node (n8n, Temporal, etc.)"""
        integration_type = node.config.get('integration_type')
        integration_config = node.config.get('config', {})

        if integration_type == 'n8n':
            return await self._call_n8n_workflow(integration_config)
        elif integration_type == 'temporal':
            return await self._call_temporal_workflow(integration_config)
        elif integration_type == 'celery':
            return await self._call_celery_task(integration_config)
        else:
            raise ValueError(f"Unknown integration type: {integration_type}")

    async def _execute_human_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute a human-in-the-loop node"""
        # This would typically involve sending a notification
        # and waiting for human input
        return {
            'status': 'pending_human_input',
            'message': node.config.get('message', 'Human input required'),
            'timestamp': datetime.now()
        }

    async def _execute_ai_decision_node(self, node: WorkflowNode, state: WorkflowState) -> Any:
        """Execute an AI decision node"""
        decision_prompt = node.config.get('decision_prompt', '')
        options = node.config.get('options', [])

        # Use AI to make a decision
        decision_result = await self._make_ai_decision_from_prompt(decision_prompt, options, state)
        return decision_result

    async def _call_vllm_service(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Call the vLLM service"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://vllm-server:8001/v1/generate',
                    json=request_data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        raise HTTPException(
                            status_code=response.status,
                            detail=f"vLLM service error: {await response.text()}"
                        )
        except Exception as e:
            logger.error(f"vLLM service call failed: {e}")
            raise

    async def _call_n8n_workflow(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Call an n8n workflow"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"http://workflow-studio:3000/api/workflows/{config['workflow_id']}/execute",
                    json=config.get('parameters', {}),
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    return await response.json()
        except Exception as e:
            logger.error(f"n8n workflow call failed: {e}")
            raise

    async def _call_temporal_workflow(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Temporal workflow"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    'http://temporal:7233/api/namespaces/default/workflows',
                    json=config,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    return await response.json()
        except Exception as e:
            logger.error(f"Temporal workflow call failed: {e}")
            raise

    async def _call_celery_task(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Call a Celery task"""
        # This would integrate with the existing Celery infrastructure
        return {
            'task_id': config.get('task_name'),
            'status': 'queued',
            'timestamp': datetime.now()
        }

    async def _make_ai_decision_from_prompt(self, prompt: str, options: List[str], state: WorkflowState) -> Dict[str, Any]:
        """Make AI decision from prompt"""
        decision_request = {
            'prompt': f"{prompt}\n\nContext: {json.dumps(state.context)}\n\nOptions: {json.dumps(options)}",
            'temperature': 0.3,
            'max_tokens': 100
        }

        result = await self._call_vllm_service(decision_request)

        # Parse decision from result
        response_text = result.get('response', '').strip()

        # Simple parsing - in production this would be more sophisticated
        for i, option in enumerate(options):
            if str(i + 1) in response_text or option.lower() in response_text.lower():
                return {
                    'decision': option,
                    'option_index': i,
                    'reasoning': response_text,
                    'confidence': 0.8
                }

        # Default to first option
        return {
            'decision': options[0] if options else 'default',
            'option_index': 0,
            'reasoning': 'Default decision',
            'confidence': 0.5
        }

    async def get_workflow_metrics(self) -> Dict[str, Any]:
        """Get comprehensive workflow metrics"""
        return {
            'performance_metrics': performance_metrics.copy(),
            'active_workflows': len(self.active_executions),
            'total_workflows': len(self.workflows),
            'workflow_types': self._get_workflow_type_distribution(),
            'node_type_usage': self._get_node_type_usage(),
            'timestamp': datetime.now()
        }

    def _get_workflow_type_distribution(self) -> Dict[str, int]:
        """Get distribution of workflow types"""
        distribution = {}
        for workflow in self.workflows.values():
            for node in workflow['nodes'].values():
                workflow_type = node.config.get('workflow_type', 'general')
                distribution[workflow_type] = distribution.get(workflow_type, 0) + 1
        return distribution

    def _get_node_type_usage(self) -> Dict[str, int]:
        """Get usage statistics for different node types"""
        usage = {}
        for workflow in self.workflows.values():
            for node in workflow['nodes'].values():
                usage[node.type] = usage.get(node.type, 0) + 1
        return usage

# Global workflow engine instance
workflow_engine = IntelligentWorkflowEngine()

# FastAPI models
class WorkflowNodeModel(BaseModel):
    id: str
    type: str
    config: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class WorkflowEdgeModel(BaseModel):
    source: str
    target: str
    condition: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CreateWorkflowRequest(BaseModel):
    workflow_id: str
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None

class ExecuteWorkflowRequest(BaseModel):
    input: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting Auterity LangGraph Service")
    yield
    logger.info("🛑 Shutting down Auterity LangGraph Service")

# Create FastAPI application
app = FastAPI(
    title="Auterity LangGraph Service",
    description="AI-powered workflow orchestration with intelligent decision making",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    """Service information endpoint"""
    return {
        "service": "Auterity LangGraph Service",
        "version": "1.0.0",
        "description": "AI-powered workflow orchestration",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "active_workflows": len(workflow_engine.active_executions),
        "total_workflows": len(workflow_engine.workflows)
    }

@app.post("/workflows")
async def create_workflow(request: CreateWorkflowRequest):
    """Create a new workflow"""
    try:
        workflow_id = await workflow_engine.create_workflow(
            request.workflow_id,
            request.nodes,
            request.edges
        )

        return {
            "workflow_id": workflow_id,
            "status": "created",
            "timestamp": datetime.now()
        }

    except Exception as e:
        logger.error(f"Workflow creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: ExecuteWorkflowRequest):
    """Execute a workflow"""
    try:
        result = await workflow_engine.execute_workflow(workflow_id, request.input)

        return {
            "execution_id": result.execution_id,
            "status": result.status,
            "result": result.result,
            "execution_time": result.execution_time,
            "execution_path": result.execution_path,
            "timestamp": datetime.now()
        }

    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details"""
    if workflow_id not in workflow_engine.workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = workflow_engine.workflows[workflow_id]
    return {
        "workflow_id": workflow_id,
        "node_count": len(workflow['nodes']),
        "edge_count": len(workflow['edges']),
        "created_at": workflow['created_at'],
        "version": workflow['version']
    }

@app.get("/workflows")
async def list_workflows():
    """List all workflows"""
    workflows = []
    for workflow_id, workflow in workflow_engine.workflows.items():
        workflows.append({
            "id": workflow_id,
            "node_count": len(workflow['nodes']),
            "edge_count": len(workflow['edges']),
            "created_at": workflow['created_at']
        })

    return {"workflows": workflows}

@app.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    return await workflow_engine.get_workflow_metrics()

@app.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    if workflow_id not in workflow_engine.workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")

    del workflow_engine.workflows[workflow_id]
    return {"message": f"Workflow {workflow_id} deleted"}

if __name__ == "__main__":
    uvicorn.run(
        "langgraph_service:app",
        host="0.0.0.0",
        port=8002,
        reload=True,
        log_level="info"
    )

