# WorkflowEngine Class Improvements

**Target File**: `backend/app/services/workflow_engine.py`  
**Priority**: HIGH  
**Part of**: Amazon Q Backend Foundation Cleanup  

## CURRENT ISSUES IDENTIFIED

### 1. Code Quality Issues
- **Missing Type Hints**: Several methods lack complete type annotations
- **Error Handling**: Inconsistent exception handling patterns
- **Database Session Management**: Inefficient session handling with multiple context managers
- **Logging**: Inconsistent logging patterns and levels
- **Performance**: Synchronous database operations in async methods

### 2. Architecture Issues
- **Tight Coupling**: Direct database access throughout the class
- **Single Responsibility**: Class handles too many concerns (execution, logging, step processing)
- **Extensibility**: Hard to add new step types without modifying core class
- **Testing**: Difficult to test due to tight database coupling

### 3. Functional Issues
- **Execution Order**: Simplistic node ordering (no proper topological sort)
- **Error Recovery**: No retry mechanisms or error recovery strategies
- **Concurrency**: No support for parallel step execution
- **State Management**: Limited workflow state tracking

## SPECIFIC IMPROVEMENTS TO IMPLEMENT

### 1. TYPE SAFETY IMPROVEMENTS

#### Current Issues:
```python
# Missing type hints
async def _execute_workflow_steps(
    self,
    db: Session,
    execution: WorkflowExecution,
    workflow_definition: Dict[str, Any],  # Too generic
    input_data: Dict[str, Any],          # Too generic
) -> Dict[str, Any]:                     # Too generic
```

#### Improved Version:
```python
from typing import Protocol, TypedDict, Union
from dataclasses import dataclass

class WorkflowNodeData(TypedDict, total=False):
    label: str
    field: str
    operation: str
    format: str
    prompt: str
    template: str
    template_variables: Dict[str, Any]
    response_schema: Dict[str, Any]
    required_fields: List[str]
    model: str

class WorkflowNode(TypedDict):
    id: str
    type: str
    data: WorkflowNodeData

class WorkflowEdge(TypedDict):
    id: str
    source: str
    target: str
    type: str

class WorkflowDefinition(TypedDict):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

@dataclass
class StepExecutionResult:
    output_data: Dict[str, Any]
    duration_ms: int
    metadata: Dict[str, Any] = None

async def _execute_workflow_steps(
    self,
    db: Session,
    execution: WorkflowExecution,
    workflow_definition: WorkflowDefinition,
    input_data: Dict[str, Any],
) -> Dict[str, Any]:
```

### 2. DEPENDENCY INJECTION AND SEPARATION OF CONCERNS

#### Current Issues:
```python
class WorkflowEngine:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    async def execute_workflow(self, workflow_id: UUID, input_data: Optional[Dict[str, Any]] = None):
        with get_db_session() as db:  # Direct database access
            # Mixed concerns: execution logic + database operations + logging
```

#### Improved Version:
```python
from abc import ABC, abstractmethod

class WorkflowRepository(ABC):
    @abstractmethod
    async def get_workflow(self, workflow_id: UUID) -> Optional[Workflow]:
        pass
    
    @abstractmethod
    async def create_execution(self, workflow_id: UUID, input_data: Dict[str, Any]) -> WorkflowExecution:
        pass
    
    @abstractmethod
    async def update_execution(self, execution: WorkflowExecution) -> None:
        pass

class ExecutionLogger(ABC):
    @abstractmethod
    async def log_step(self, execution_id: UUID, step_result: StepExecutionResult) -> None:
        pass

class StepExecutor(ABC):
    @abstractmethod
    async def execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepExecutionResult:
        pass

class WorkflowEngine:
    def __init__(
        self,
        repository: WorkflowRepository,
        logger: ExecutionLogger,
        step_executor: StepExecutor,
        error_handler: ErrorHandler
    ):
        self.repository = repository
        self.logger = logger
        self.step_executor = step_executor
        self.error_handler = error_handler
```

### 3. PROPER EXECUTION ORDER WITH TOPOLOGICAL SORT

#### Current Issues:
```python
def _build_execution_order(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> List[str]:
    # For MVP, execute nodes in the order they appear
    # In a full implementation, this would do topological sorting
    return [node["id"] for node in nodes]
```

#### Improved Version:
```python
from collections import defaultdict, deque

def _build_execution_order(self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]) -> List[str]:
    """Build execution order using topological sort."""
    # Build adjacency list and in-degree count
    graph = defaultdict(list)
    in_degree = defaultdict(int)
    
    # Initialize all nodes with 0 in-degree
    for node in nodes:
        in_degree[node["id"]] = 0
    
    # Build graph and calculate in-degrees
    for edge in edges:
        source, target = edge["source"], edge["target"]
        graph[source].append(target)
        in_degree[target] += 1
    
    # Find nodes with no incoming edges (start nodes)
    queue = deque([node_id for node_id, degree in in_degree.items() if degree == 0])
    execution_order = []
    
    while queue:
        current = queue.popleft()
        execution_order.append(current)
        
        # Reduce in-degree for all neighbors
        for neighbor in graph[current]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # Check for cycles
    if len(execution_order) != len(nodes):
        raise WorkflowExecutionError("Workflow contains cycles and cannot be executed")
    
    return execution_order
```

### 4. ASYNC DATABASE OPERATIONS

#### Current Issues:
```python
async def execute_workflow(self, workflow_id: UUID, input_data: Optional[Dict[str, Any]] = None):
    with get_db_session() as db:  # Synchronous session in async method
        workflow = db.query(Workflow).filter(...).first()  # Synchronous query
```

#### Improved Version:
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

async def execute_workflow(self, workflow_id: UUID, input_data: Optional[Dict[str, Any]] = None):
    async with self.repository.get_session() as db:
        # Use async queries
        result = await db.execute(
            select(Workflow).where(
                Workflow.id == workflow_id,
                Workflow.is_active == True
            )
        )
        workflow = result.scalar_one_or_none()
```

### 5. ERROR HANDLING AND RECOVERY

#### Current Issues:
```python
except Exception as e:
    self.logger.error(f"Workflow execution {execution_id} failed: {str(e)}")
    # Basic error handling, no recovery strategies
```

#### Improved Version:
```python
@dataclass
class RetryConfig:
    max_attempts: int = 3
    delay_seconds: float = 1.0
    backoff_multiplier: float = 2.0
    retryable_errors: List[Type[Exception]] = None

class ErrorHandler:
    def __init__(self, retry_config: RetryConfig):
        self.retry_config = retry_config
    
    async def handle_step_error(
        self, 
        error: Exception, 
        node: WorkflowNode, 
        attempt: int
    ) -> bool:
        """Return True if step should be retried."""
        if attempt >= self.retry_config.max_attempts:
            return False
        
        if self.retry_config.retryable_errors:
            if not any(isinstance(error, err_type) for err_type in self.retry_config.retryable_errors):
                return False
        
        # Calculate delay with exponential backoff
        delay = self.retry_config.delay_seconds * (self.retry_config.backoff_multiplier ** (attempt - 1))
        await asyncio.sleep(delay)
        
        return True

async def _execute_step_with_retry(
    self,
    node: WorkflowNode,
    input_data: Dict[str, Any]
) -> StepExecutionResult:
    """Execute step with retry logic."""
    last_error = None
    
    for attempt in range(1, self.error_handler.retry_config.max_attempts + 1):
        try:
            return await self.step_executor.execute_step(node, input_data)
        except Exception as e:
            last_error = e
            self.logger.warning(f"Step {node['id']} failed on attempt {attempt}: {e}")
            
            should_retry = await self.error_handler.handle_step_error(e, node, attempt)
            if not should_retry:
                break
    
    raise WorkflowStepError(f"Step {node['id']} failed after {attempt} attempts: {last_error}")
```

### 6. STEP EXECUTOR FACTORY PATTERN

#### Current Issues:
```python
async def _execute_step_by_type(self, step_type: str, node: Dict[str, Any], input_data: Dict[str, Any]):
    # Large if-elif chain, hard to extend
    if step_type == "input":
        return await self._execute_input_step(node, input_data)
    elif step_type == "process":
        return await self._execute_process_step(node, input_data)
    # ... many more elif statements
```

#### Improved Version:
```python
class StepExecutorFactory:
    def __init__(self):
        self._executors: Dict[str, StepExecutor] = {}
    
    def register_executor(self, step_type: str, executor: StepExecutor):
        self._executors[step_type] = executor
    
    def get_executor(self, step_type: str) -> StepExecutor:
        if step_type not in self._executors:
            return self._executors.get("default", DefaultStepExecutor())
        return self._executors[step_type]

class InputStepExecutor(StepExecutor):
    async def execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepExecutionResult:
        # Specialized input step logic
        pass

class AIStepExecutor(StepExecutor):
    def __init__(self, ai_service: AIService):
        self.ai_service = ai_service
    
    async def execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepExecutionResult:
        # Specialized AI step logic with proper error handling
        pass

# Usage in WorkflowEngine
class WorkflowEngine:
    def __init__(self, step_factory: StepExecutorFactory):
        self.step_factory = step_factory
    
    async def _execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepExecutionResult:
        executor = self.step_factory.get_executor(node["type"])
        return await executor.execute_step(node, input_data)
```

### 7. PERFORMANCE MONITORING AND METRICS

#### Current Issues:
```python
start_time = time.time()
# ... step execution
duration_ms = int((time.time() - start_time) * 1000)
```

#### Improved Version:
```python
from contextlib import asynccontextmanager
import asyncio

class PerformanceMonitor:
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics = metrics_collector
    
    @asynccontextmanager
    async def measure_step_execution(self, step_type: str, step_name: str):
        start_time = asyncio.get_event_loop().time()
        try:
            yield
            duration = asyncio.get_event_loop().time() - start_time
            await self.metrics.record_step_success(step_type, step_name, duration)
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            await self.metrics.record_step_failure(step_type, step_name, duration, str(e))
            raise

# Usage
async def _execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepExecutionResult:
    async with self.performance_monitor.measure_step_execution(node["type"], node["data"]["label"]):
        return await self.step_executor.execute_step(node, input_data)
```

## IMPLEMENTATION PRIORITY

### Phase 1: Core Architecture (Amazon Q)
1. **Type Safety**: Add comprehensive type hints and data classes
2. **Dependency Injection**: Separate concerns with proper interfaces
3. **Async Operations**: Convert to proper async database operations
4. **Error Handling**: Implement structured error handling

### Phase 2: Advanced Features (Cline)
1. **Execution Order**: Implement topological sort for proper node ordering
2. **Step Factory**: Implement extensible step executor pattern
3. **Retry Logic**: Add configurable retry mechanisms
4. **Performance Monitoring**: Add comprehensive metrics collection

### Phase 3: Integration (Kiro)
1. **Cross-System Integration**: Connect with RelayCore and NeuroWeaver
2. **Monitoring**: Integrate with unified monitoring stack
3. **Security**: Add proper authorization and audit logging
4. **Testing**: Comprehensive test suite with mocking

## SUCCESS CRITERIA

### Code Quality:
- [ ] Complete type hints with mypy compliance
- [ ] Zero linting violations
- [ ] Proper separation of concerns
- [ ] Comprehensive error handling

### Performance:
- [ ] Async database operations throughout
- [ ] Efficient execution order calculation
- [ ] Proper resource management
- [ ] Performance metrics collection

### Maintainability:
- [ ] Extensible step executor pattern
- [ ] Dependency injection for testability
- [ ] Clear interfaces and abstractions
- [ ] Comprehensive logging

### Reliability:
- [ ] Retry mechanisms for transient failures
- [ ] Proper error recovery strategies
- [ ] Graceful degradation
- [ ] Comprehensive monitoring

These improvements will transform the WorkflowEngine from a monolithic, tightly-coupled class into a modular, testable, and maintainable system that can handle complex workflows reliably at scale.