"""
Advanced Workflow Coordination Engine
Multi-system orchestration with intelligent adaptation and resilience
"""

import asyncio
from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Dict, List, Optional


class WorkflowStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    CANCELLED = "cancelled"


class StepStatus(Enum):
    WAITING = "waiting"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class WorkflowStep:
    """Represents a workflow step with advanced features"""

    step_id: str
    system_target: str
    action: str
    parameters: Dict[str, Any]
    retry_policy: Dict[str, Any]
    compensation_action: Optional[str] = None
    timeout_seconds: int = 30
    dependencies: List[str] = None
    condition: Optional[str] = None  # Conditional execution


class WorkflowDefinition:
    """Advanced workflow definition with branching and adaptation"""

    def __init__(self, workflow_id: str, name: str):
        self.workflow_id = workflow_id
        self.name = name
        self.steps: List[WorkflowStep] = []
        self.error_handlers: Dict[str, Callable] = {}
        self.adaptation_rules: List[Dict[str, Any]] = []

    def add_step(self, step: WorkflowStep):
        """Add step to workflow"""
        self.steps.append(step)

    def add_error_handler(self, error_type: str, handler: Callable):
        """Add error handling strategy"""
        self.error_handlers[error_type] = handler

    def add_adaptation_rule(
        self, condition: str, action: str, parameters: Dict[str, Any]
    ):
        """Add dynamic adaptation rule"""
        self.adaptation_rules.append(
            {
                "condition": condition,
                "action": action,
                "parameters": parameters,
            }
        )


class WorkflowContext:
    """Runtime context for workflow execution"""

    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        self.variables = {}
        self.step_results = {}
        self.execution_trace = []
        self.start_time = None
        self.current_step = None

    def set_variable(self, key: str, value: Any):
        """Set workflow variable"""
        self.variables[key] = value

    def get_variable(self, key: str, default: Any = None):
        """Get workflow variable"""
        return self.variables.get(key, default)


class CircuitBreaker:
    """Circuit breaker pattern for workflow resilience"""

    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    async def call(self, func: Callable, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        if self.state == "OPEN":
            if self._should_attempt_reset():
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit breaker"""
        import time

        return (time.time() - (self.last_failure_time or 0)) > self.timeout

    def _on_success(self):
        """Handle successful execution"""
        self.failure_count = 0
        self.state = "CLOSED"

    def _on_failure(self):
        """Handle failed execution"""
        import time

        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"


class WorkflowCoordinationEngine:
    """Advanced workflow coordination with intelligent features"""

    def __init__(self):
        self.active_workflows: Dict[str, WorkflowContext] = {}
        self.workflow_definitions: Dict[str, WorkflowDefinition] = {}
        self.system_connectors = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.metrics = {
            "total_workflows": 0,
            "successful_workflows": 0,
            "failed_workflows": 0,
            "average_execution_time": 0,
        }

    def register_system_connector(self, system_id: str, connector: Callable):
        """Register connector for external system"""
        self.system_connectors[system_id] = connector
        self.circuit_breakers[system_id] = CircuitBreaker()

    async def define_workflow(self, definition: WorkflowDefinition):
        """Register workflow definition"""
        self.workflow_definitions[definition.workflow_id] = definition

    async def execute_workflow(
        self, workflow_id: str, input_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute workflow with advanced coordination"""
        if workflow_id not in self.workflow_definitions:
            raise ValueError(f"Workflow {workflow_id} not found")

        definition = self.workflow_definitions[workflow_id]
        context = WorkflowContext(workflow_id)
        context.variables.update(input_data)

        self.active_workflows[workflow_id] = context
        self.metrics["total_workflows"] += 1

        try:
            result = await self._execute_workflow_steps(definition, context)
            self.metrics["successful_workflows"] += 1
            return result
        except Exception as e:
            self.metrics["failed_workflows"] += 1
            await self._handle_workflow_failure(definition, context, e)
            raise e
        finally:
            if workflow_id in self.active_workflows:
                del self.active_workflows[workflow_id]

    async def _execute_workflow_steps(
        self, definition: WorkflowDefinition, context: WorkflowContext
    ):
        """Execute workflow steps with dependency resolution"""
        completed_steps = set()
        pending_steps = definition.steps.copy()

        while pending_steps:
            # Find steps ready to execute
            ready_steps = []
            for step in pending_steps:
                if self._are_dependencies_satisfied(step, completed_steps):
                    ready_steps.append(step)

            if not ready_steps:
                raise Exception(
                    "Circular dependency or missing dependencies detected"
                )

            # Execute ready steps in parallel
            tasks = []
            for step in ready_steps:
                if self._should_execute_step(step, context):
                    task = self._execute_step(step, context)
                    tasks.append(task)
                else:
                    # Skip step based on condition
                    completed_steps.add(step.step_id)
                    pending_steps.remove(step)

            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)

                for i, result in enumerate(results):
                    step = ready_steps[i]
                    if isinstance(result, Exception):
                        await self._handle_step_failure(step, context, result)
                    else:
                        context.step_results[step.step_id] = result
                        completed_steps.add(step.step_id)
                        pending_steps.remove(step)

        return {
            "status": "completed",
            "results": context.step_results,
            "execution_trace": context.execution_trace,
        }

    def _are_dependencies_satisfied(
        self, step: WorkflowStep, completed_steps: set
    ) -> bool:
        """Check if step dependencies are satisfied"""
        if not step.dependencies:
            return True
        return all(dep in completed_steps for dep in step.dependencies)

    def _should_execute_step(
        self, step: WorkflowStep, context: WorkflowContext
    ) -> bool:
        """Check if step should be executed based on conditions"""
        if not step.condition:
            return True

        # Simple condition evaluation (can be enhanced with expression engine)
        condition = step.condition
        for var, value in context.variables.items():
            condition = condition.replace(f"${var}", str(value))

        try:
            return eval(condition)  # Note: Use safer evaluation in production
        except Exception:
            return True

    async def _execute_step(
        self, step: WorkflowStep, context: WorkflowContext
    ):
        """Execute individual workflow step with resilience"""
        context.current_step = step.step_id

        if step.system_target not in self.system_connectors:
            raise ValueError(
                f"System connector for {step.system_target} not found"
            )

        connector = self.system_connectors[step.system_target]
        circuit_breaker = self.circuit_breakers[step.system_target]

        # Execute with circuit breaker protection
        try:
            result = await circuit_breaker.call(
                connector, step.action, step.parameters, context
            )

            context.execution_trace.append(
                {
                    "step_id": step.step_id,
                    "status": "completed",
                    "result": result,
                }
            )

            return result

        except Exception as e:
            context.execution_trace.append(
                {"step_id": step.step_id, "status": "failed", "error": str(e)}
            )
            raise e

    async def _handle_step_failure(
        self, step: WorkflowStep, context: WorkflowContext, error: Exception
    ):
        """Handle step failure with retry and compensation"""
        retry_policy = step.retry_policy
        max_retries = retry_policy.get("max_retries", 0)

        # Implement retry logic
        for attempt in range(max_retries):
            try:
                await asyncio.sleep(retry_policy.get("delay", 1))
                result = await self._execute_step(step, context)
                return result
            except Exception:
                continue

        # If retries exhausted, trigger compensation if available
        if step.compensation_action:
            await self._execute_compensation(step, context)

        raise error

    async def _execute_compensation(
        self, step: WorkflowStep, context: WorkflowContext
    ):
        """Execute compensation action for failed step"""
        print(
            f"Executing compensation for step {step.step_id}: {step.compensation_action}"
        )

    async def _handle_workflow_failure(
        self,
        definition: WorkflowDefinition,
        context: WorkflowContext,
        error: Exception,
    ):
        """Handle overall workflow failure"""
        error_type = type(error).__name__
        if error_type in definition.error_handlers:
            await definition.error_handlers[error_type](context, error)


# Example usage and demonstration
async def demonstrate_advanced_workflow():
    """Demonstrate advanced workflow coordination"""

    engine = WorkflowCoordinationEngine()

    # Register system connectors
    async def user_service_connector(
        action: str, params: Dict[str, Any], context: WorkflowContext
    ):
        print(f"User Service: {action} with {params}")
        return {"user_id": params.get("user_id"), "status": "processed"}

    async def notification_service_connector(
        action: str, params: Dict[str, Any], context: WorkflowContext
    ):
        print(f"Notification Service: {action} with {params}")
        return {"notification_sent": True}

    engine.register_system_connector("user_service", user_service_connector)
    engine.register_system_connector(
        "notification_service", notification_service_connector
    )

    # Define advanced workflow
    workflow = WorkflowDefinition(
        "user_onboarding", "Advanced User Onboarding"
    )

    # Add steps with dependencies and conditions
    workflow.add_step(
        WorkflowStep(
            step_id="validate_user",
            system_target="user_service",
            action="validate",
            parameters={"user_id": "${user_id}"},
            retry_policy={"max_retries": 3, "delay": 1},
        )
    )

    workflow.add_step(
        WorkflowStep(
            step_id="create_profile",
            system_target="user_service",
            action="create_profile",
            parameters={"user_id": "${user_id}", "profile_data": "${profile}"},
            dependencies=["validate_user"],
            retry_policy={"max_retries": 2, "delay": 2},
        )
    )

    workflow.add_step(
        WorkflowStep(
            step_id="send_welcome_notification",
            system_target="notification_service",
            action="send_welcome",
            parameters={"user_id": "${user_id}"},
            dependencies=["create_profile"],
            condition="${send_notifications} == True",
            retry_policy={"max_retries": 1, "delay": 1},
        )
    )

    await engine.define_workflow(workflow)

    # Execute workflow
    input_data = {
        "user_id": "user-123",
        "profile": {"name": "John Doe", "email": "john@example.com"},
        "send_notifications": True,
    }

    result = await engine.execute_workflow("user_onboarding", input_data)
    print(f"Workflow result: {result}")
    print(f"Engine metrics: {engine.metrics}")


if __name__ == "__main__":
    asyncio.run(demonstrate_advanced_workflow())
