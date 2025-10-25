"""CrewAI step executor for workflow integration."""

import asyncio
import logging
from typing import Any, Dict, Optional
import aiohttp
from pydantic import BaseModel

from app.executors.step_executors import StepResult
from app.interfaces.step_executor import StepExecutor
from app.types.workflow import WorkflowNode

logger = logging.getLogger(__name__)


class CrewAIConfig(BaseModel):
    """Configuration for CrewAI execution."""
    crew_id: str
    collaboration_strategy: Optional[str] = "hierarchical"
    max_concurrent_tasks: Optional[int] = 3
    execution_timeout: Optional[int] = 300  # 5 minutes


class CrewAIStepExecutor(StepExecutor):
    """Executes CrewAI collaborative tasks within workflows."""

    def __init__(self, crewai_base_url: str = "http://crewai-service:8003"):
        self.crewai_base_url = crewai_base_url
        self.timeout = aiohttp.ClientTimeout(total=300)  # 5 minute timeout

    async def execute_step(self, node: WorkflowNode, input_data: Dict[str, Any]) -> StepResult:
        """
        Execute a CrewAI collaboration step.

        Args:
            node: Workflow node containing CrewAI configuration
            input_data: Input data from previous workflow steps

        Returns:
            StepResult containing CrewAI execution results
        """
        try:
            # Extract CrewAI configuration from node data
            crew_config = self._extract_crew_config(node)

            # Create or get crew
            crew_id = await self._ensure_crew_exists(crew_config, node)

            # Execute crew collaboration
            execution_result = await self._execute_crew_collaboration(
                crew_id, input_data, crew_config.execution_timeout
            )

            return StepResult(
                success=True,
                output_data=execution_result,
                error_message=None
            )

        except Exception as e:
            logger.error(f"CrewAI step execution failed: {e}")
            return StepResult(
                success=False,
                output_data={},
                error_message=f"CrewAI execution failed: {str(e)}"
            )

    def _extract_crew_config(self, node: WorkflowNode) -> CrewAIConfig:
        """Extract CrewAI configuration from workflow node."""
        node_data = node.data or {}

        # Extract crew configuration
        crew_config_data = node_data.get("crewConfig", {})

        return CrewAIConfig(
            crew_id=crew_config_data.get("crewId", f"workflow-crew-{node.id}"),
            collaboration_strategy=crew_config_data.get("collaborationStrategy", "hierarchical"),
            max_concurrent_tasks=crew_config_data.get("maxConcurrentTasks", 3),
            execution_timeout=node_data.get("timeout", 300)
        )

    async def _ensure_crew_exists(self, config: CrewAIConfig, node: WorkflowNode) -> str:
        """Ensure the crew exists, create if necessary."""
        node_data = node.data or {}
        crew_config_data = node_data.get("crewConfig", {})

        # Check if crew already exists
        if await self._crew_exists(config.crew_id):
            logger.info(f"Using existing crew: {config.crew_id}")
            return config.crew_id

        # Create new crew from node configuration
        agents = crew_config_data.get("agents", [])
        tasks = crew_config_data.get("tasks", [])

        if not agents:
            raise ValueError("No agents configured for CrewAI execution")

        crew_request = {
            "id": config.crew_id,
            "name": node_data.get("label", f"Crew for {node.id}"),
            "description": node_data.get("description", "Workflow-generated crew"),
            "agents": agents,
            "tasks": tasks,
            "goal": node_data.get("goal", "Execute collaborative workflow tasks"),
            "collaboration_strategy": config.collaboration_strategy,
            "max_concurrent_tasks": config.max_concurrent_tasks
        }

        await self._create_crew(crew_request)
        logger.info(f"Created new crew: {config.crew_id}")

        return config.crew_id

    async def _crew_exists(self, crew_id: str) -> bool:
        """Check if a crew exists in CrewAI service."""
        try:
            async with aiohttp.ClientSession(timeout=self.timeout) as session:
                async with session.get(f"{self.crewai_base_url}/crews/{crew_id}") as response:
                    return response.status == 200
        except Exception:
            return False

    async def _create_crew(self, crew_config: Dict[str, Any]) -> None:
        """Create a new crew in CrewAI service."""
        async with aiohttp.ClientSession(timeout=self.timeout) as session:
            async with session.post(
                f"{self.crewai_base_url}/crews",
                json=crew_config
            ) as response:
                if response.status not in [200, 201]:
                    error_text = await response.text()
                    raise Exception(f"Failed to create crew: {error_text}")

    async def _execute_crew_collaboration(
        self,
        crew_id: str,
        input_data: Dict[str, Any],
        timeout: int
    ) -> Dict[str, Any]:
        """Execute crew collaboration with input data."""
        from app.monitoring.performance import performance_monitor

        execution_request = {
            "input_data": input_data,
            "context": {
                "source": "workflow_execution",
                "timestamp": asyncio.get_event_loop().time()
            }
        }

        # Set custom timeout for this execution
        custom_timeout = aiohttp.ClientTimeout(total=timeout)

        async with performance_monitor.measure_ai_service_call("crewai", "crew_execution"):
            async with aiohttp.ClientSession(timeout=custom_timeout) as session:
                async with session.post(
                    f"{self.crewai_base_url}/crews/{crew_id}/execute",
                    json=execution_request
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Crew execution failed: {error_text}")

                    result = await response.json()
                    return result

    async def validate_step(self, node: WorkflowNode) -> Dict[str, Any]:
        """
        Validate CrewAI step configuration.

        Args:
            node: Workflow node to validate

        Returns:
            Validation results
        """
        issues = []

        node_data = node.data or {}
        crew_config = node_data.get("crewConfig", {})

        # Check for required crew configuration
        if not crew_config.get("agents"):
            issues.append("No agents configured for CrewAI execution")

        if not crew_config.get("tasks"):
            issues.append("No tasks configured for CrewAI execution")

        # Validate collaboration strategy
        valid_strategies = ["hierarchical", "democratic", "swarm"]
        strategy = crew_config.get("collaborationStrategy", "hierarchical")
        if strategy not in valid_strategies:
            issues.append(f"Invalid collaboration strategy: {strategy}")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": []
        }
