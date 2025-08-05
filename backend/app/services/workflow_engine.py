"""Workflow execution engine for processing workflows step by step."""

import logging
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.database import get_db_session
from app.exceptions import WorkflowExecutionError
from app.models.execution import ExecutionLog, ExecutionStatus, WorkflowExecution
from app.models.workflow import Workflow

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

    def __init__(self):
        self.logger = logging.getLogger(__name__)

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
            self.logger.error(f"Workflow execution {execution_id} failed: {str(e)}")

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
                    self.logger.error(f"Failed to update execution status: {db_error}")

            if isinstance(e, WorkflowExecutionError):
                raise
            else:
                raise WorkflowExecutionError(f"Workflow execution failed: {str(e)}")

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
            self.logger.error(f"Failed to get execution status for {execution_id}: {e}")
            raise WorkflowExecutionError(f"Failed to get execution status: {str(e)}")

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

                self.logger.info(f"Execution {execution_id} cancelled successfully")
                return True

        except Exception as e:
            self.logger.error(f"Failed to cancel execution {execution_id}: {e}")
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
            self.logger.error(f"Failed to get execution logs for {execution_id}: {e}")
            raise WorkflowExecutionError(f"Failed to get execution logs: {str(e)}")

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
        nodes = workflow_definition.get("nodes", [])
        edges = workflow_definition.get("edges", [])

        if not nodes:
            raise WorkflowExecutionError("Workflow has no nodes to execute")

        # Build execution order based on edges
        execution_order = self._build_execution_order(nodes, edges)

        # Execute steps in order
        current_data = input_data.copy()

        for node_id in execution_order:
            node = next((n for n in nodes if n["id"] == node_id), None)
            if not node:
                raise WorkflowExecutionError(
                    f"Node {node_id} not found in workflow definition"
                )

            # Execute the step
            step_output = await self._execute_step(db, execution, node, current_data)

            # Update current data with step output
            current_data.update(step_output)

        return current_data

    def _build_execution_order(
        self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Build the execution order for workflow nodes based on edges.
        For MVP, we'll use a simple sequential approach based on node order.

        Args:
            nodes: List of workflow nodes
            edges: List of workflow edges

        Returns:
            List of node IDs in execution order
        """
        # For MVP, execute nodes in the order they appear
        # In a full implementation, this would do topological sorting
        return [node["id"] for node in nodes]

    async def _execute_step(
        self,
        db: Session,
        execution: WorkflowExecution,
        node: Dict[str, Any],
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
        step_name = node.get("data", {}).get("label", node["id"])
        step_type = node.get("type", "unknown")

        start_time = time.time()

        try:
            self.logger.info(f"Executing step '{step_name}' of type '{step_type}'")

            # Execute step based on type
            output_data = await self._execute_step_by_type(step_type, node, input_data)

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Log successful step execution
            log_entry = ExecutionLog(
                execution_id=execution.id,
                step_name=step_name,
                step_type=step_type,
                input_data=input_data,
                output_data=output_data,
                duration_ms=duration_ms,
            )
            db.add(log_entry)
            db.commit()

            self.logger.info(f"Step '{step_name}' completed in {duration_ms}ms")

            return output_data

        except Exception as e:
            # Calculate duration even for failed steps
            duration_ms = int((time.time() - start_time) * 1000)

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

            raise WorkflowStepError(f"Step '{step_name}' failed: {error_message}")

    async def _execute_step_by_type(
        self, step_type: str, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute a step based on its type.

        Args:
            step_type: Type of the step
            node: Node definition
            input_data: Input data for the step

        Returns:
            Output data from the step
        """
        # For MVP, implement basic step types
        if step_type == "input":
            return await self._execute_input_step(node, input_data)
        elif step_type == "process":
            return await self._execute_process_step(node, input_data)
        elif step_type == "output":
            return await self._execute_output_step(node, input_data)
        elif step_type == "ai":
            return await self._execute_ai_step(node, input_data)
        else:
            # Default processing for unknown types
            return await self._execute_default_step(node, input_data)

    async def _execute_input_step(
        self, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an input step."""
        # Input steps typically just pass through data
        node_data = node.get("data", {})
        field_name = node_data.get("field", "input")

        return {field_name: input_data}

    async def _execute_process_step(
        self, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a processing step."""
        # Basic processing step - could transform data
        node_data = node.get("data", {})
        operation = node_data.get("operation", "passthrough")

        if operation == "passthrough":
            return input_data
        elif operation == "uppercase":
            # Example transformation
            result = {}
            for key, value in input_data.items():
                if isinstance(value, str):
                    result[key] = value.upper()
                else:
                    result[key] = value
            return result
        else:
            return input_data

    async def _execute_output_step(
        self, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an output step."""
        # Output steps format the final result
        node_data = node.get("data", {})
        format_type = node_data.get("format", "json")

        if format_type == "json":
            return {"result": input_data}
        else:
            return input_data

    async def _execute_ai_step(
        self, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an AI processing step."""
        from app.services.ai_service import AIServiceError, get_ai_service

        node_data = node.get("data", {})
        prompt = node_data.get("prompt", "Process this data")
        template_name = node_data.get("template")
        model = node_data.get("model")

        try:
            ai_service = get_ai_service()

            # Use template if specified, otherwise use direct prompt
            if template_name:
                # Extract template variables from input_data
                template_vars = node_data.get("template_variables", {})
                # Merge with input_data for dynamic variables
                all_vars = {**input_data, **template_vars}

                response = await ai_service.process_with_template(
                    template_name=template_name,
                    variables=all_vars,
                    context=input_data,
                    model=model,
                )
            else:
                # Format prompt with input data
                formatted_prompt = (
                    prompt.format(**input_data) if "{" in prompt else prompt
                )

                response = await ai_service.process_text(
                    prompt=formatted_prompt, context=input_data, model=model
                )

            if not response.is_success:
                raise WorkflowStepError(f"AI processing failed: {response.error}")

            # Validate response if schema provided
            response_schema = node_data.get("response_schema")
            required_fields = node_data.get("required_fields")

            if response_schema or required_fields:
                is_valid = await ai_service.validate_response(
                    response.content,
                    schema=response_schema,
                    required_fields=required_fields,
                )
                if not is_valid:
                    self.logger.warning(
                        "AI response validation failed, proceeding anyway"
                    )

            return {
                "ai_response": response.content,
                "ai_model": response.model,
                "ai_usage": response.usage,
                "processed_data": input_data,
            }

        except AIServiceError as e:
            raise WorkflowStepError(f"AI service error: {str(e)}")
        except Exception as e:
            raise WorkflowStepError(f"AI step execution failed: {str(e)}")

    async def _execute_default_step(
        self, node: Dict[str, Any], input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a default step for unknown types."""
        # Default behavior - pass through data
        return input_data
