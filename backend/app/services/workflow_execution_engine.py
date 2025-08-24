"""
Workflow Execution Engine Implementation
Handles parallel execution, dependency resolution, and error recovery
"""

import asyncio
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

from .step_executors.factory import StepExecutorFactory

logger = logging.getLogger(__name__)


class ExecutionStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"


@dataclass
class ExecutionPlan:
    """Execution plan with topological ordering"""

    workflow_id: str
    execution_order: List[List[str]]  # Batches of steps that can run in parallel
    dependencies: Dict[str, List[str]]
    step_configs: Dict[str, Dict[str, Any]]
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class ExecutionContext:
    workflow_id: str
    step_id: str
    step_type: str
    input_data: Dict[str, Any]
    start_time: datetime
    status: ExecutionStatus
    dependencies: List[str] = field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3


class RetryManager:
    """Manages retry logic with exponential backoff"""

    def __init__(self, base_delay: float = 1.0, max_delay: float = 60.0):
        self.base_delay = base_delay
        self.max_delay = max_delay

    async def should_retry(self, context: ExecutionContext, error: Exception) -> bool:
        """Determine if step should be retried"""
        if context.retry_count >= context.max_retries:
            return False

        # Don't retry validation errors
        if isinstance(error, ValueError):
            return False

        return True

    async def get_retry_delay(self, retry_count: int) -> float:
        """Calculate exponential backoff delay"""
        delay = self.base_delay * (2**retry_count)
        return min(delay, self.max_delay)

    async def handle_retry(
        self, context: ExecutionContext, error: Exception
    ) -> Tuple[ExecutionStatus, Dict[str, Any]]:
        """Handle retry logic for failed execution"""
        if await self.should_retry(context, error):
            context.retry_count += 1
            delay = await self.get_retry_delay(context.retry_count)
            await asyncio.sleep(delay)
            return ExecutionStatus.RETRYING, {
                "retry_count": context.retry_count,
                "delay": delay,
            }

        return ExecutionStatus.FAILED, {
            "error": str(error),
            "final_retry_count": context.retry_count,
        }


class TopologicalExecutor:
    """Handles topological sorting and parallel execution of workflow steps"""

    def __init__(self):
        self.factory = StepExecutorFactory()

    def create_execution_plan(
        self, workflow_definition: Dict[str, Any]
    ) -> ExecutionPlan:
        """Create execution plan with topological ordering"""
        steps = workflow_definition.get("steps", {})
        dependencies = self._extract_dependencies(steps)

        # Perform topological sort
        execution_order = self._topological_sort(steps.keys(), dependencies)

        return ExecutionPlan(
            workflow_id=workflow_definition.get("id", ""),
            execution_order=execution_order,
            dependencies=dependencies,
            step_configs=steps,
        )

    def _extract_dependencies(self, steps: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract dependencies from step definitions"""
        dependencies = {}
        for step_id, step_config in steps.items():
            deps = step_config.get("depends_on", [])
            dependencies[step_id] = (
                deps if isinstance(deps, list) else [deps] if deps else []
            )
        return dependencies

    def _topological_sort(
        self, steps: Set[str], dependencies: Dict[str, List[str]]
    ) -> List[List[str]]:
        """Perform topological sort to determine execution order"""
        # Calculate in-degrees
        in_degree = defaultdict(int)
        for step in steps:
            in_degree[step] = 0

        for step, deps in dependencies.items():
            for dep in deps:
                in_degree[step] += 1

        # Find steps with no dependencies
        queue = deque([step for step in steps if in_degree[step] == 0])
        execution_order = []

        while queue:
            # Process all steps at current level (can run in parallel)
            current_batch = []
            batch_size = len(queue)

            for _ in range(batch_size):
                step = queue.popleft()
                current_batch.append(step)

                # Reduce in-degree for dependent steps
                for dependent_step, deps in dependencies.items():
                    if step in deps:
                        in_degree[dependent_step] -= 1
                        if in_degree[dependent_step] == 0:
                            queue.append(dependent_step)

            execution_order.append(current_batch)

        return execution_order


class WorkflowExecutionEngine:
    """Main workflow execution engine"""

    def __init__(self, max_parallel_steps: int = 10):
        self.active_executions: Dict[str, ExecutionContext] = {}
        self.completed_steps: Dict[str, Set[str]] = defaultdict(set)
        self.step_results: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.retry_manager = RetryManager()
        self.topological_executor = TopologicalExecutor()
        self.max_parallel_steps = max_parallel_steps
        self._semaphore = asyncio.Semaphore(max_parallel_steps)

    async def execute_workflow(
        self, workflow_definition: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute complete workflow with dependency resolution"""
        try:
            # Create execution plan
            plan = self.topological_executor.create_execution_plan(workflow_definition)
            workflow_id = plan.workflow_id

            logger.info(f"Starting workflow execution: {workflow_id}")

            # Execute batches in order
            for batch_index, batch in enumerate(plan.execution_order):
                logger.info(
                    f"Executing batch {batch_index + 1}/{len(plan.execution_order)}: {batch}"
                )

                # Execute steps in current batch in parallel
                batch_results = await self._execute_batch(workflow_id, batch, plan)

                # Check for failures
                failed_steps = [
                    step_id
                    for step_id, (status, _) in batch_results.items()
                    if status == ExecutionStatus.FAILED
                ]

                if failed_steps:
                    logger.error(
                        f"Batch {batch_index + 1} failed. Failed steps: {failed_steps}"
                    )
                    return {"status": "failed", "failed_steps": failed_steps}

            logger.info(f"Workflow {workflow_id} completed successfully")
            return {
                "status": "completed",
                "results": self.step_results[workflow_id],
                "execution_time": (datetime.now() - plan.created_at).total_seconds(),
            }

        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}")
            return {"status": "error", "error": str(e)}

    async def _execute_batch(
        self, workflow_id: str, batch: List[str], plan: ExecutionPlan
    ) -> Dict[str, Tuple[ExecutionStatus, Dict[str, Any]]]:
        """Execute a batch of steps in parallel"""
        tasks = []

        for step_id in batch:
            step_config = plan.step_configs[step_id]
            context = ExecutionContext(
                workflow_id=workflow_id,
                step_id=step_id,
                step_type=step_config.get("type", "process"),
                input_data=self._prepare_step_input(
                    workflow_id, step_id, step_config, plan.dependencies
                ),
                start_time=datetime.now(),
                status=ExecutionStatus.PENDING,
                dependencies=plan.dependencies.get(step_id, []),
                max_retries=step_config.get("max_retries", 3),
            )

            task = asyncio.create_task(self._execute_step_with_semaphore(context))
            tasks.append((step_id, task))

        # Wait for all tasks to complete
        results = {}
        for step_id, task in tasks:
            try:
                status, result = await task
                results[step_id] = (status, result)

                if status == ExecutionStatus.COMPLETED:
                    self.completed_steps[workflow_id].add(step_id)
                    self.step_results[workflow_id][step_id] = result

            except Exception as e:
                logger.error(f"Task for step {step_id} failed: {str(e)}")
                results[step_id] = (ExecutionStatus.FAILED, {"error": str(e)})

        return results

    async def _execute_step_with_semaphore(
        self, context: ExecutionContext
    ) -> Tuple[ExecutionStatus, Dict[str, Any]]:
        """Execute step with resource limiting"""
        async with self._semaphore:
            return await self._execute_step(context)

    async def _execute_step(
        self, context: ExecutionContext
    ) -> Tuple[ExecutionStatus, Dict[str, Any]]:
        """Execute a single workflow step"""
        max_attempts = context.max_retries + 1

        for attempt in range(max_attempts):
            try:
                context.status = ExecutionStatus.RUNNING
                context.start_time = datetime.now()

                # Get executor for step type
                executor = self.topological_executor.factory.create_executor(
                    context.step_type
                )

                # Execute step
                execution_context = {
                    "workflow_id": context.workflow_id,
                    "step_id": context.step_id,
                    "timestamp": context.start_time.isoformat(),
                    "attempt": attempt + 1,
                }

                result = await executor.execute(context.input_data, execution_context)

                if result.success:
                    context.status = ExecutionStatus.COMPLETED
                    context.result = result.data
                    return ExecutionStatus.COMPLETED, result.data
                else:
                    raise ValueError(result.error)

            except Exception as e:
                logger.warning(
                    f"Step {context.step_id} attempt {attempt + 1} failed: {str(e)}"
                )

                if attempt < max_attempts - 1:
                    # Retry with exponential backoff
                    delay = await self.retry_manager.get_retry_delay(attempt)
                    await asyncio.sleep(delay)
                    context.retry_count = attempt + 1
                    context.status = ExecutionStatus.RETRYING
                else:
                    # Final failure
                    context.status = ExecutionStatus.FAILED
                    context.error = str(e)
                    return ExecutionStatus.FAILED, {
                        "error": str(e),
                        "retry_count": attempt,
                    }

        return ExecutionStatus.FAILED, {"error": "Max retries exceeded"}

    def _prepare_step_input(
        self,
        workflow_id: str,
        step_id: str,
        step_config: Dict[str, Any],
        dependencies: Dict[str, List[str]],
    ) -> Dict[str, Any]:
        """Prepare input data for step execution"""
        input_data = step_config.get("input", {}).copy()

        # Add results from dependency steps
        step_dependencies = dependencies.get(step_id, [])
        dependency_results = {}

        for dep_step in step_dependencies:
            if dep_step in self.step_results[workflow_id]:
                dependency_results[dep_step] = self.step_results[workflow_id][dep_step]

        # Merge dependency data into input data
        if dependency_results:
            input_data["dependency_results"] = dependency_results

            # For process steps, merge the collected data from input steps
            if step_config.get("type") == "process" and "data" not in input_data:
                merged_data = {}
                for dep_result in dependency_results.values():
                    if "collected_data" in dep_result:
                        merged_data.update(dep_result["collected_data"])
                    elif "processed_data" in dep_result:
                        merged_data.update(dep_result["processed_data"])
                if merged_data:
                    input_data["data"] = merged_data

            # For output steps, collect all results as data
            elif step_config.get("type") == "output" and "data" not in input_data:
                output_data = {}
                for dep_step, dep_result in dependency_results.items():
                    output_data[dep_step] = dep_result
                if output_data:
                    input_data["data"] = output_data

            # For AI steps, prepare context from dependencies
            elif step_config.get("type") == "ai" and "data" not in input_data:
                ai_context = {}
                for dep_result in dependency_results.values():
                    if "processed_data" in dep_result:
                        ai_context.update(dep_result["processed_data"])
                    elif "collected_data" in dep_result:
                        ai_context.update(dep_result["collected_data"])
                if ai_context:
                    input_data["data"] = ai_context

        return input_data

    def get_execution_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get current execution status for a workflow"""
        return {
            "workflow_id": workflow_id,
            "completed_steps": list(self.completed_steps.get(workflow_id, set())),
            "active_executions": len(
                [
                    ctx
                    for ctx in self.active_executions.values()
                    if ctx.workflow_id == workflow_id
                ]
            ),
            "step_results": self.step_results.get(workflow_id, {}),
        }


class ExecutionError(Exception):
    """Base class for execution errors"""


class ExecutorNotFoundError(ExecutionError):
    """Raised when no executor is found for a step type"""
