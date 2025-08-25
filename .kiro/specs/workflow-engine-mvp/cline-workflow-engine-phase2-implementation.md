# [CLINE-TASK] Workflow Engine Phase 2: Advanced Features Implementation

## Task Overview

Implement advanced workflow engine features including topological sort execution, step executor factory pattern, and retry mechanisms. This builds on Amazon Q's Phase 1 work (type safety, async operations, dependency injection).

## Prerequisites (Amazon Q Completion Required)

- ✅ Type safety with comprehensive data classes
- ✅ Async database operations fully converted
- ✅ Basic dependency injection implemented
- ✅ WorkflowNode, WorkflowEdge, StepExecutionResult typed structures

## Implementation Scope

### 1. Topological Sort Execution Engine

**File**: `backend/app/services/workflow_execution_engine.py`

Replace sequential execution with dependency-aware execution:

```python
from typing import List, Dict, Set, Optional
from collections import defaultdict, deque
from dataclasses import dataclass

@dataclass
class ExecutionPlan:
    execution_order: List[List[str]]  # Batches of parallel-executable steps
    dependencies: Dict[str, Set[str]]
    has_cycles: bool
    cycle_nodes: Optional[List[str]] = None

class TopologicalExecutor:
    async def create_execution_plan(self, workflow_data: WorkflowData) -> ExecutionPlan:
        """Create topologically sorted execution plan with cycle detection"""
        pass

    async def execute_batch(self, step_batch: List[str], context: ExecutionContext) -> Dict[str, StepExecutionResult]:
        """Execute steps in parallel where possible"""
        pass
```

**Requirements**:

- Implement Kahn's algorithm for topological sorting
- Detect and report dependency cycles with specific node identification
- Create execution batches for parallel processing opportunities
- Handle conditional branches and merge points
- Validate execution plan before workflow starts

### 2. Step Executor Factory Pattern

**File**: `backend/app/services/step_executors/`

Create extensible step executor system:

```
step_executors/
├── __init__.py
├── base_executor.py          # Abstract base class
├── input_executor.py         # User input collection
├── process_executor.py       # Data processing steps
├── ai_executor.py           # AI/LLM integration
├── data_validation_executor.py  # Validation logic
├── output_executor.py       # Result output
├── conditional_executor.py  # Branching logic
└── factory.py              # Executor factory
```

**Base Executor Interface**:

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseStepExecutor(ABC):
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    @abstractmethod
    async def execute(self, context: ExecutionContext) -> StepExecutionResult:
        """Execute step with given context"""
        pass

    @abstractmethod
    def validate_config(self) -> bool:
        """Validate step configuration"""
        pass

    async def pre_execute(self, context: ExecutionContext) -> None:
        """Pre-execution setup"""
        pass

    async def post_execute(self, result: StepExecutionResult) -> None:
        """Post-execution cleanup"""
        pass
```

**Factory Implementation**:

```python
class StepExecutorFactory:
    _executors: Dict[str, Type[BaseStepExecutor]] = {}

    @classmethod
    def register(cls, step_type: str, executor_class: Type[BaseStepExecutor]):
        """Register new step executor"""
        cls._executors[step_type] = executor_class

    @classmethod
    def create(cls, step_type: str, config: Dict[str, Any]) -> BaseStepExecutor:
        """Create executor instance"""
        if step_type not in cls._executors:
            raise ValueError(f"Unknown step type: {step_type}")
        return cls._executors[step_type](config)
```

### 3. Retry Logic & Error Recovery

**File**: `backend/app/services/retry_manager.py`

Implement configurable retry mechanisms:

```python
@dataclass
class RetryConfig:
    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_errors: Set[Type[Exception]] = None

class RetryManager:
    async def execute_with_retry(
        self,
        step_executor: BaseStepExecutor,
        context: ExecutionContext,
        retry_config: RetryConfig
    ) -> StepExecutionResult:
        """Execute step with retry logic"""
        pass

    def calculate_delay(self, attempt: int, config: RetryConfig) -> float:
        """Calculate exponential backoff delay with jitter"""
        pass

    def is_retryable_error(self, error: Exception, config: RetryConfig) -> bool:
        """Determine if error should trigger retry"""
        pass
```

**Error Classification**:

```python
class ErrorClassifier:
    RETRYABLE_ERRORS = {
        ConnectionError,
        TimeoutError,
        HTTPError,  # 5xx only
        TemporaryFailure
    }

    NON_RETRYABLE_ERRORS = {
        ValidationError,
        AuthenticationError,
        PermissionError,
        ConfigurationError
    }
```

### 4. Enhanced Execution Context

**File**: `backend/app/models/execution_context.py`

Extend execution context for advanced features:

```python
@dataclass
class ExecutionContext:
    workflow_id: str
    execution_id: str
    user_id: str
    step_data: Dict[str, Any]
    global_variables: Dict[str, Any]
    execution_metadata: Dict[str, Any]

    # New fields for Phase 2
    retry_count: int = 0
    execution_plan: Optional[ExecutionPlan] = None
    parallel_results: Dict[str, StepExecutionResult] = field(default_factory=dict)
    error_history: List[ExecutionError] = field(default_factory=list)

    def get_step_dependencies(self, step_id: str) -> Set[str]:
        """Get dependencies for specific step"""
        pass

    def is_step_ready(self, step_id: str) -> bool:
        """Check if step dependencies are satisfied"""
        pass
```

### 5. Performance Monitoring Integration

**File**: `backend/app/services/workflow_metrics.py`

Add comprehensive metrics collection:

```python
from contextlib import asynccontextmanager
import time
from typing import AsyncGenerator

class WorkflowMetrics:
    @asynccontextmanager
    async def measure_execution(self, step_id: str, workflow_id: str) -> AsyncGenerator[None, None]:
        """Async context manager for step execution timing"""
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            await self.record_step_duration(step_id, workflow_id, duration)

    async def record_step_duration(self, step_id: str, workflow_id: str, duration: float):
        """Record step execution duration"""
        pass

    async def record_retry_attempt(self, step_id: str, attempt: int, error: str):
        """Record retry attempt"""
        pass

    async def record_parallel_efficiency(self, batch_size: int, actual_duration: float, sequential_estimate: float):
        """Record parallel execution efficiency"""
        pass
```

## Integration Points

### Database Schema Updates

Update workflow execution tables to support new features:

```sql
-- Add to existing workflow_executions table
ALTER TABLE workflow_executions ADD COLUMN execution_plan JSONB;
ALTER TABLE workflow_executions ADD COLUMN parallel_batches INTEGER DEFAULT 0;
ALTER TABLE workflow_executions ADD COLUMN retry_attempts INTEGER DEFAULT 0;

-- New table for step dependencies
CREATE TABLE step_dependencies (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    step_id VARCHAR(255) NOT NULL,
    depends_on_step_id VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoint Updates

**File**: `backend/app/api/workflows.py`

Add endpoints for advanced features:

```python
@router.get("/workflows/{workflow_id}/execution-plan")
async def get_execution_plan(workflow_id: int) -> ExecutionPlan:
    """Get topological execution plan for workflow"""
    pass

@router.post("/workflows/{workflow_id}/validate-dependencies")
async def validate_dependencies(workflow_id: int) -> Dict[str, Any]:
    """Validate workflow for dependency cycles"""
    pass

@router.get("/executions/{execution_id}/metrics")
async def get_execution_metrics(execution_id: str) -> Dict[str, Any]:
    """Get detailed execution metrics"""
    pass
```

## Testing Requirements

### Unit Tests

**File**: `backend/tests/test_workflow_engine_phase2.py`

```python
class TestTopologicalExecutor:
    async def test_simple_linear_workflow(self):
        """Test basic sequential workflow"""
        pass

    async def test_parallel_execution_opportunities(self):
        """Test identification of parallel execution batches"""
        pass

    async def test_cycle_detection(self):
        """Test dependency cycle detection"""
        pass

    async def test_complex_branching_workflow(self):
        """Test conditional branches and merges"""
        pass

class TestStepExecutorFactory:
    def test_executor_registration(self):
        """Test dynamic executor registration"""
        pass

    def test_unknown_step_type_handling(self):
        """Test handling of unknown step types"""
        pass

class TestRetryManager:
    async def test_exponential_backoff(self):
        """Test retry delay calculation"""
        pass

    async def test_error_classification(self):
        """Test retryable vs non-retryable errors"""
        pass

    async def test_max_retry_limit(self):
        """Test retry limit enforcement"""
        pass
```

### Integration Tests

**File**: `backend/tests/test_workflow_integration_phase2.py`

```python
class TestWorkflowEngineIntegration:
    async def test_end_to_end_parallel_execution(self):
        """Test complete workflow with parallel steps"""
        pass

    async def test_retry_recovery_scenario(self):
        """Test workflow recovery after step failures"""
        pass

    async def test_performance_metrics_collection(self):
        """Test metrics collection during execution"""
        pass
```

## Success Criteria

### Functional Requirements

- ✅ Workflows execute in topologically correct order
- ✅ Parallel execution opportunities identified and utilized
- ✅ Dependency cycles detected and reported with specific nodes
- ✅ Step executors dynamically registered and created
- ✅ Failed steps retry according to configuration
- ✅ Non-retryable errors fail immediately
- ✅ Execution metrics collected and stored

### Performance Requirements

- ✅ Parallel execution reduces total workflow time by 20%+ where applicable
- ✅ Retry logic adds <100ms overhead per attempt
- ✅ Topological sort completes in <50ms for workflows with <100 steps
- ✅ Memory usage remains stable during parallel execution

### Quality Requirements

- ✅ 95%+ test coverage for new components
- ✅ Zero mypy type errors
- ✅ All async operations properly awaited
- ✅ Comprehensive error handling and logging
- ✅ Backward compatibility with existing workflows

## Delivery Timeline

- **Week 1**: Topological sort implementation and testing
- **Week 2**: Step executor factory pattern and registration
- **Week 3**: Retry logic and error recovery system
- **Week 4**: Performance monitoring and integration testing

## Dependencies

- Amazon Q Phase 1 completion (type safety, async operations)
- Database migration scripts for new schema
- Updated API documentation for new endpoints

## Risk Mitigation

- Implement feature flags for gradual rollout
- Maintain backward compatibility with existing workflows
- Comprehensive testing before production deployment
- Rollback plan for reverting to Phase 1 implementation

## Documentation Requirements

- Update API documentation with new endpoints
- Create developer guide for custom step executors
- Document retry configuration options
- Performance tuning guide for parallel execution

This task builds directly on Amazon Q's foundational work and creates a production-ready workflow engine with advanced execution capabilities.
