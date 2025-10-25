"""LangGraph step executor for workflow integration."""

import asyncio
import logging
from typing import Any, Dict, Optional
import aiohttp
from pydantic import BaseModel

from app.executors.step_executors import StepResult
from app.interfaces.step_executor import StepExecutor
from app.types.workflow import WorkflowNode

logger = logging.getLogger(__name__)


class LangGraphConfig(BaseModel):
    """Configuration for LangGraph execution."""
    workflow_id: str
    execution_timeout: Optional[int] = 300  # 5 minutes
    decision_timeout: Optional[int] = 60  # 1 minute


class LangGraphStepExecutor(StepExecutor):
    """Executes LangGraph workflow orchestration within workflows."""

    def __init__(self, langgraph_base_url: str = "http://langgraph-service:8002"):
        self.langgraph_base_url = langgraph_base_url
        self.timeout = aiohttp.ClientTimeout(total=300)  # 5 minute timeout

    async def execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepResult:
        """
        Execute a LangGraph workflow step.

        Args:
            node: Workflow node containing LangGraph configuration
            input_data: Input data from previous workflow steps

        Returns:
            StepResult containing LangGraph execution results
        """
        try:
            # Extract LangGraph configuration from node data
            langgraph_config = self._extract_langgraph_config(node)

            # Create or get workflow
            workflow_id = await self._ensure_workflow_exists(langgraph_config, node)

            # Execute workflow orchestration
            execution_result = await self._execute_workflow_orchestration(
                workflow_id, input_data, langgraph_config.execution_timeout
            )

            return StepResult(
                success=True,
                output_data=execution_result,
                error_message=None
            )

        except Exception as e:
            logger.error(f"LangGraph step execution failed: {e}")
            return StepResult(
                success=False,
                output_data={},
                error_message=f"LangGraph execution failed: {str(e)}"
            )

    def _extract_langgraph_config(self, node: WorkflowNode) -> LangGraphConfig:
        """Extract LangGraph configuration from workflow node."""
        node_data = node.data or {}

        # Extract workflow configuration
        workflow_config_data = node_data.get("workflowConfig", {})

        return LangGraphConfig(
            workflow_id=workflow_config_data.get("workflowId", f"workflow-{node.id}"),
            execution_timeout=node_data.get("timeout", 300),
            decision_timeout=workflow_config_data.get("decisionTimeout", 60)
        )

    async def _ensure_workflow_exists(self, config: LangGraphConfig, node: WorkflowNode) -> str:
        """Ensure the workflow exists, create if necessary."""
        node_data = node.data or {}
        workflow_config_data = node_data.get("workflowConfig", {})

        # Check if workflow already exists
        if await self._workflow_exists(config.workflow_id):
            logger.info(f"Using existing workflow: {config.workflow_id}")
            return config.workflow_id

        # Create new workflow from node configuration
        nodes = workflow_config_data.get("nodes", [])
        edges = workflow_config_data.get("edges", [])

        if not nodes:
            raise ValueError("No nodes configured for LangGraph execution")

        workflow_request = {
            "workflow_id": config.workflow_id,
            "nodes": nodes,
            "edges": edges
        }

        await self._create_workflow(workflow_request)
        logger.info(f"Created new workflow: {config.workflow_id}")

        return config.workflow_id

    async def _workflow_exists(self, workflow_id: str) -> bool:
        """Check if a workflow exists in LangGraph service."""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(f"{self.langgraph_base_url}/workflows/{workflow_id}") as response:
                    return response.status == 200
        except Exception:
            return False

    async def _create_workflow(self, workflow_config: Dict[str, Any]) -> None:
        """Create a new workflow in LangGraph service."""
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(
                f"{self.langgraph_base_url}/workflows",
                json=workflow_config
            ) as response:
                if response.status not in [200, 201]:
                    error_text = await response.text()
                    raise Exception(f"Failed to create workflow: {error_text}")

    async def _execute_workflow_orchestration(
        self,
        workflow_id: str,
        input_data: Dict[str, Any],
        timeout: int
    ) -> Dict[str, Any]:
        """Execute workflow orchestration with input data."""
        from app.monitoring.performance import performance_monitor

        execution_request = {
            "input": input_data,
            "context": {
                "source": "workflow_execution",
                "timestamp": asyncio.get_event_loop().time()
            }
        }

        # Set custom timeout for this execution
        custom_timeout = aiohttp.ClientTimeout(total=timeout)

        async with performance_monitor.measure_ai_service_call("langgraph", "workflow_execution"):
            async with aiohttp.ClientSession(timeout=custom_timeout) as session:
                async with session.post(
                    f"{self.langgraph_base_url}/workflows/{workflow_id}/execute",
                    json=execution_request
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Workflow execution failed: {error_text}")

                    result = await response.json()
                    return result

    async def validate_step(self, node: WorkflowNode) -> Dict[str, Any]:
        """
        Validate LangGraph step configuration.

        Args:
            node: Workflow node to validate

        Returns:
            Validation results
        """
        issues = []

        node_data = node.data or {}
        workflow_config = node_data.get("workflowConfig", {})

        # Check for required workflow configuration
        if not workflow_config.get("nodes"):
            issues.append("No nodes configured for LangGraph execution")

        if not workflow_config.get("edges"):
            issues.append("No edges configured for LangGraph execution")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": []
        }
