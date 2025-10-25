"""Workflow engine configuration and factory setup."""

from app.executors.step_executors import (
    AIStepExecutor,
    DataValidationStepExecutor,
    DefaultStepExecutor,
    InputStepExecutor,
    OutputStepExecutor,
    ProcessStepExecutor,
)
from app.interfaces.step_executor import StepExecutorFactory
from app.monitoring.performance import PerformanceMonitor
from app.services.workflow_engine import WorkflowEngine
from app.types.workflow import RetryConfig


def create_workflow_engine() -> WorkflowEngine:
    """Create a configured workflow engine instance."""
    # Create step executor factory
    factory = StepExecutorFactory()
    factory.register_executor("input", InputStepExecutor())
    factory.register_executor("process", ProcessStepExecutor())
    factory.register_executor("output", OutputStepExecutor())
    factory.register_executor("ai", AIStepExecutor())
    factory.register_executor("data_validation", DataValidationStepExecutor())
    factory.register_executor("default", DefaultStepExecutor())

    # Create retry configuration
    retry_config = RetryConfig(
        max_attempts=3,
        delay_seconds=1.0,
        backoff_multiplier=2.0,
        retryable_errors=["ConnectionError", "TimeoutError", "AIServiceError"],
    )

    # Create performance monitor
    performance_monitor = PerformanceMonitor()

    return WorkflowEngine(
        step_factory=factory,
        retry_config=retry_config,
        performance_monitor=performance_monitor,
    )
