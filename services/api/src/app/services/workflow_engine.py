"""Workflow execution engine for processing
workflows step by step."""

import asyncio
import logging
from collections import defaultdict, deque
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.database import get_db_session
from app.exceptions import WorkflowExecutionError
from app.executors.step_executors import (
    AIStepExecutor,
    DataValidationStepExecutor,
    DefaultStepExecutor,
    InputStepExecutor,
    OutputStepExecutor,
    ProcessStepExecutor,
)
from app.executors.crewai_executor import CrewAIStepExecutor
from app.executors.langgraph_executor import LangGraphStepExecutor
from app.handlers.error_handler import ErrorHandler
from app.interfaces.step_executor import StepExecutorFactory
from app.models.execution import ExecutionLog, ExecutionStatus, WorkflowExecution
from app.models.workflow import Workflow
from app.monitoring.performance import PerformanceMonitor
from app.types.workflow import RetryConfig, WorkflowEdge, WorkflowNode

logger = logging.getLogger(__name__)


class WorkflowStepError(Exception):
    """Custom exception for individual workflow step errors."""


class ExecutionResult:
    """Container for workflow execution results."""

    def __init__(
        self,
        execution_id: UUID,
        status: ExecutionStatus,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
    ):
        self.execution_id = execution_id
        self.status = status
        self.output_data = output_data or {}
        self.error_message = error_message


class WorkflowEngine:
    """Core workflow execution engine."""

    def __init__(
        self,
        step_factory: Optional[StepExecutorFactory] = None,
        retry_config: Optional[RetryConfig] = None,
        performance_monitor: Optional[PerformanceMonitor] = None,
    ):
        self.logger = logging.getLogger(__name__)
        self.step_factory = step_factory or self._create_default_factory()
        self.error_handler = ErrorHandler(retry_config or RetryConfig())
        self.performance_monitor = performance_monitor or PerformanceMonitor()

    def _create_default_factory(self) -> StepExecutorFactory:
        """Create default step executor factory."""
        factory = StepExecutorFactory()
        factory.register_executor("input", InputStepExecutor())
        factory.register_executor("process", ProcessStepExecutor())
        factory.register_executor("output", OutputStepExecutor())
        factory.register_executor("ai", AIStepExecutor())
        factory.register_executor(
            "data_validation", DataValidationStepExecutor()
        )
        factory.register_executor("crewai", CrewAIStepExecutor())
        factory.register_executor("langgraph", LangGraphStepExecutor())
        factory.register_executor("default", DefaultStepExecutor())
        return factory

    async def execute_workflow(
        self, workflow_id: UUID, input_data: Optional[Dict[str, Any]] = None
    ) -> ExecutionResult:
        """
        Execute a workflow with the given input data.

        Args:
            workflow_id: UUID of the workflow to execute
            input_data: Optional input data for the workflow

        Returns:
            ExecutionResult containing execution details

        Raises:
            WorkflowExecutionError: If workflow execution fails
        """
        input_data = input_data or {}
        execution_id = None

        try:
            with get_db_session() as db:
                # Get workflow definition
                workflow = (
                    db.query(Workflow)
                    .filter(Workflow.id == workflow_id, Workflow.is_active)
                    .first()
                )

                if not workflow:
                    raise WorkflowExecutionError(
                        f"Workflow {workflow_id} not found or inactive"
                    )

                # Create execution record
                execution = WorkflowExecution(
                    workflow_id=workflow_id,
                    status=ExecutionStatus.PENDING,
                    input_data=input_data,
                )
                db.add(execution)
                db.commit()
                db.refresh(execution)
                execution_id = execution.id

                self.logger.info(
                    f"Starting workflow execution {execution_id} for workflow "
                    f"{workflow_id}"
                )

                # Update status to running
                execution.status = ExecutionStatus.RUNNING
                db.commit()

                # Execute workflow steps
                output_data = await self._execute_workflow_steps(
                    db, execution, workflow.definition, input_data
                )

                # Mark as completed
                execution.status = ExecutionStatus.COMPLETED
                execution.output_data = output_data
                execution.completed_at = datetime.utcnow()
                db.commit()

                self.logger.info(
                    f"Workflow execution {execution_id} completed successfully"
                )

                return ExecutionResult(
                    execution_id=execution_id,
                    status=ExecutionStatus.COMPLETED,
                    output_data=output_data,
                )

        except Exception as e:
            self.logger.error(
                f"Workflow execution {execution_id} failed: {str(e)}"
            )

            # Update execution status to failed
            if execution_id:
                try:
                    with get_db_session() as db:
                        execution = (
                            db.query(WorkflowExecution)
                            .filter(WorkflowExecution.id == execution_id)
                            .first()
                        )
                        if execution:
                            execution.status = ExecutionStatus.FAILED
                            execution.error_message = str(e)
                            execution.completed_at = datetime.utcnow()
                            db.commit()
                except Exception as db_error:
                    self.logger.error(
                        f"Failed to update execution status: {db_error}"
                    )

            if isinstance(e, WorkflowExecutionError):
                raise
            else:
                raise WorkflowExecutionError(
                    f"Workflow execution failed: {str(e)}"
                )

    async def get_execution_status(
        self, execution_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Get the current status of a workflow execution.

        Args:
            execution_id: UUID of the execution to check

        Returns:
            Dictionary containing execution status information
        """
        try:
            with get_db_session() as db:
                execution = (
                    db.query(WorkflowExecution)
                    .filter(WorkflowExecution.id == execution_id)
                    .first()
                )

                if not execution:
                    return None

                return {
                    "id": execution.id,
                    "workflow_id": execution.workflow_id,
                    "status": execution.status.value,
                    "input_data": execution.input_data,
                    "output_data": execution.output_data,
                    "error_message": execution.error_message,
                    "started_at": execution.started_at,
                    "completed_at": execution.completed_at,
                }

        except Exception as e:
            self.logger.error(
                f"Failed to get execution status for {execution_id}: {e}"
            )
            raise WorkflowExecutionError(
                f"Failed to get execution status: {str(e)}"
            )

    async def cancel_execution(self, execution_id: UUID) -> bool:
        """
        Cancel a running workflow execution.

        Args:
            execution_id: UUID of the execution to cancel

        Returns:
            True if cancellation was successful, False otherwise
        """
        try:
            with get_db_session() as db:
                execution = (
                    db.query(WorkflowExecution)
                    .filter(WorkflowExecution.id == execution_id)
                    .first()
                )

                if not execution:
                    self.logger.warning(
                        f"Execution {execution_id} not found for cancellation"
                    )
                    return False

                if execution.status not in [
                    ExecutionStatus.PENDING,
                    ExecutionStatus.RUNNING,
                ]:
                    self.logger.warning(
                        f"Cannot cancel execution {execution_id} with status {execution.status}"
                    )
                    return False

                execution.status = ExecutionStatus.CANCELLED
                execution.completed_at = datetime.utcnow()
                execution.error_message = "Execution cancelled by user"
                db.commit()

                self.logger.info(
                    f"Execution {execution_id} cancelled successfully"
                )
                return True

        except Exception as e:
            self.logger.error(
                f"Failed to cancel execution {execution_id}: {e}"
            )
            return False

    async def get_execution_logs(
        self, execution_id: UUID, limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get execution logs for a workflow execution.

        Args:
            execution_id: UUID of the execution
            limit: Optional limit on number of logs to return

        Returns:
            List of execution log dictionaries
        """
        try:
            with get_db_session() as db:
                query = (
                    db.query(ExecutionLog)
                    .filter(ExecutionLog.execution_id == execution_id)
                    .order_by(ExecutionLog.timestamp)
                )

                if limit:
                    query = query.limit(limit)

                logs = query.all()

                return [
                    {
                        "id": log.id,
                        "step_name": log.step_name,
                        "step_type": log.step_type,
                        "input_data": log.input_data,
                        "output_data": log.output_data,
                        "duration_ms": log.duration_ms,
                        "error_message": log.error_message,
                        "timestamp": log.timestamp,
                    }
                    for log in logs
                ]

        except Exception as e:
            self.logger.error(
                f"Failed to get execution logs for {execution_id}: {e}"
            )
            raise WorkflowExecutionError(
                f"Failed to get execution logs: {str(e)}"
            )

    async def _execute_workflow_steps(
        self,
        db: Session,
        execution: WorkflowExecution,
        workflow_definition: Dict[str, Any],
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute workflow steps sequentially based on the workflow definition.

        Args:
            db: Database session
            execution: WorkflowExecution instance
            workflow_definition: Workflow definition containing nodes and edges
            input_data: Input data for the workflow

        Returns:
            Final output data from workflow execution
        """
        raw_nodes = workflow_definition.get("nodes", [])
        raw_edges = workflow_definition.get("edges", [])

        if not raw_nodes:
            raise WorkflowExecutionError("Workflow has no nodes to execute")

        # Convert to typed objects
        nodes = [
            WorkflowNode(id=n["id"], type=n["type"], data=n.get("data", {}))
            for n in raw_nodes
        ]
        edges = [
            WorkflowEdge(id=e["id"], source=e["source"], target=e["target"])
            for e in raw_edges
        ]

        # Build execution order based on edges
        execution_order = self._build_execution_order(nodes, edges)

        # Execute steps in order
        current_data = input_data.copy()

        for node_id in execution_order:
            node = next((n for n in nodes if n.id == node_id), None)
            if not node:
                raise WorkflowExecutionError(
                    f"Node {node_id} not found in workflow definition"
                )

            # Execute the step with retry logic
            step_output = await self._execute_step_with_retry(
                db, execution, node, current_data
            )

            # Update current data with step output
            current_data.update(step_output)

        return current_data

    def _build_execution_order(
        self, nodes: List[WorkflowNode], edges: List[WorkflowEdge]
    ) -> List[str]:
        """Build execution order using topological sort."""
        # Build adjacency list and in-degree count
        graph = defaultdict(list)
        in_degree = defaultdict(int)

        # Initialize all nodes with 0 in-degree
        for node in nodes:
            in_degree[node.id] = 0

        # Build graph and calculate in-degrees
        for edge in edges:
            source, target = edge.source, edge.target
            graph[source].append(target)
            in_degree[target] += 1

        # Find nodes with no incoming edges (start nodes)
        queue = deque(
            [node_id for node_id, degree in in_degree.items() if degree == 0]
        )
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
            raise WorkflowExecutionError(
                "Workflow contains cycles and cannot be executed"
            )

        return execution_order

    async def _execute_step_with_retry(
        self,
        db: Session,
        execution: WorkflowExecution,
        node: WorkflowNode,
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Execute step with retry logic."""
        last_error = None

        for attempt in range(
            1, self.error_handler.retry_config.max_attempts + 1
        ):
            try:
                return await self._execute_step(
                    db, execution, node, input_data
                )
            except Exception as e:
                last_error = e
                self.logger.warning(
                    f"Step {node.id} failed on attempt {attempt}: {e}"
                )

                should_retry = await self.error_handler.handle_step_error(
                    e, node, attempt
                )
                if not should_retry:
                    break

        raise WorkflowStepError(
            f"Step {node.id} failed after {attempt} attempts: {last_error}"
        )

    async def _execute_step(
        self,
        db: Session,
        execution: WorkflowExecution,
        node: WorkflowNode,
        input_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute a single workflow step.

        Args:
            db: Database session
            execution: WorkflowExecution instance
            node: Node definition
            input_data: Input data for the step

        Returns:
            Output data from the step
        """
        step_name = node.data.get("label", node.id)
        step_type = node.type

        start_time = asyncio.get_event_loop().time()

        try:
            self.logger.info(
                f"Executing step '{step_name}' of type '{step_type}'"
            )

            # Execute step using factory pattern with performance monitoring
            async with self.performance_monitor.measure_step_execution(
                step_type, step_name
            ):
                executor = self.step_factory.get_executor(step_type)
                result = await executor.execute_step(node, input_data)

            if not result.success:
                raise WorkflowStepError(
                    result.error_message or "Step execution failed"
                )

            # Calculate duration
            duration_ms = int(
                (asyncio.get_event_loop().time() - start_time) * 1000
            )

            # Log successful step execution
            log_entry = ExecutionLog(
                execution_id=execution.id,
                step_name=step_name,
                step_type=step_type,
                input_data=input_data,
                output_data=result.output_data,
                duration_ms=duration_ms,
            )
            db.add(log_entry)
            db.commit()

            return result.output_data

        except Exception as e:
            # Calculate duration even for failed steps
            duration_ms = int(
                (asyncio.get_event_loop().time() - start_time) * 1000
            )

            error_message = str(e)
            self.logger.error(
                f"Step '{step_name}' failed after {duration_ms}ms: {error_message}"
            )

            # Log failed step execution
            log_entry = ExecutionLog(
                execution_id=execution.id,
                step_name=step_name,
                step_type=step_type,
                input_data=input_data,
                output_data={},
                duration_ms=duration_ms,
                error_message=error_message,
            )
            db.add(log_entry)
            db.commit()

            raise WorkflowStepError(
                f"Step '{step_name}' failed: {error_message}"
            )
