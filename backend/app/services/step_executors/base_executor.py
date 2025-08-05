"""Base executor interface for workflow steps"""

from abc import ABC, abstractmethod
from typing import Dict, Any
from dataclasses import dataclass
from enum import Enum


class StepType(Enum):
    INPUT = "input"
    PROCESS = "process"
    AI = "ai"
    OUTPUT = "output"
    CONDITION = "condition"


@dataclass
class ExecutionResult:
    success: bool
    data: Dict[str, Any]
    error: str = None
    metadata: Dict[str, Any] = None


class BaseStepExecutor(ABC):
    """Abstract base class for all step executors"""
    
    def __init__(self):
        self.step_type = None
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any], context: Dict[str, Any]) -> ExecutionResult:
        """Execute the step with given input data and context"""
        pass
    
    @abstractmethod
    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data before execution"""
        pass
    
    def get_step_type(self) -> StepType:
        """Return the step type this executor handles"""
        return self.step_type