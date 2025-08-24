"""Step executor interface and implementations."""

from abc import ABC, abstractmethod
from typing import Any, Dict

from app.types.workflow import StepExecutionResult, WorkflowNode


class StepExecutor(ABC):
    """Abstract base class for step executors."""

    @abstractmethod
    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        """Execute a workflow step."""


class StepExecutorFactory:
    """Factory for creating step executors."""

    def __init__(self):
        self._executors: Dict[str, StepExecutor] = {}

    def register_executor(self, step_type: str, executor: StepExecutor) -> None:
        """Register a step executor for a given type."""
        self._executors[step_type] = executor

    def get_executor(self, step_type: str) -> StepExecutor:
        """Get executor for step type."""
        return self._executors.get(step_type, self._executors.get("default"))
