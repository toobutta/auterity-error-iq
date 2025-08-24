"""Step executor factory for creating appropriate executors"""

from typing import Dict, Type

from .ai_executor import AIStepExecutor
from .base_executor import BaseStepExecutor, StepType
from .input_executor import InputStepExecutor
from .output_executor import OutputStepExecutor
from .process_executor import ProcessStepExecutor


class StepExecutorFactory:
    """Factory for creating step executors based on step type"""

    _executors: Dict[StepType, Type[BaseStepExecutor]] = {
        StepType.INPUT: InputStepExecutor,
        StepType.PROCESS: ProcessStepExecutor,
        StepType.AI: AIStepExecutor,
        StepType.OUTPUT: OutputStepExecutor,
    }

    @classmethod
    def create_executor(cls, step_type: str) -> BaseStepExecutor:
        """Create executor instance for given step type"""
        try:
            step_enum = StepType(step_type.lower())
            executor_class = cls._executors.get(step_enum)

            if not executor_class:
                raise ValueError(f"No executor found for step type: {step_type}")

            return executor_class()

        except ValueError as e:
            raise ValueError(f"Invalid step type: {step_type}") from e

    @classmethod
    def register_executor(
        cls, step_type: StepType, executor_class: Type[BaseStepExecutor]
    ):
        """Register a new executor for a step type"""
        cls._executors[step_type] = executor_class

    @classmethod
    def get_supported_types(cls) -> list:
        """Get list of supported step types"""
        return [step_type.value for step_type in cls._executors.keys()]
