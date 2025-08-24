"""Type definitions for workflow engine."""

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional


@dataclass
class WorkflowNode:
    """Typed workflow node definition."""

    id: str
    type: str
    data: Dict[str, Any]
    position: Optional[Dict[str, float]] = None


@dataclass
class WorkflowEdge:
    """Typed workflow edge definition."""

    id: str
    source: str
    target: str
    type: Optional[str] = None


@dataclass
class StepExecutionResult:
    """Result of step execution."""

    success: bool
    output_data: Dict[str, Any]
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""

    max_attempts: int = 3
    delay_seconds: float = 1.0
    backoff_multiplier: float = 2.0
    retryable_errors: Optional[List[str]] = None


class StepType(Enum):
    """Enumeration of supported step types."""

    INPUT = "input"
    PROCESS = "process"
    OUTPUT = "output"
    AI = "ai"
    DATA_VALIDATION = "data_validation"
    DEFAULT = "default"
