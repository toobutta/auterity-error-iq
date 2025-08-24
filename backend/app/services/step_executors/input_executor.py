"""Input step executor implementation"""

from typing import Any, Dict

from .base_executor import BaseStepExecutor, ExecutionResult, StepType


class InputStepExecutor(BaseStepExecutor):
    """Executor for input data collection steps"""

    def __init__(self):
        super().__init__()
        self.step_type = StepType.INPUT

    async def execute(
        self, input_data: Dict[str, Any], context: Dict[str, Any]
    ) -> ExecutionResult:
        """Execute input data collection"""
        try:
            if not self.validate_input(input_data):
                return ExecutionResult(
                    success=False, data={}, error="Invalid input data format"
                )

            # Process input data
            processed_data = {
                "collected_data": input_data.get("data", {}),
                "timestamp": context.get("timestamp"),
                "source": input_data.get("source", "manual"),
            }

            return ExecutionResult(
                success=True,
                data=processed_data,
                metadata={
                    "step_type": "input",
                    "processed_fields": len(processed_data),
                },
            )

        except Exception as e:
            return ExecutionResult(
                success=False, data={}, error=f"Input execution failed: {str(e)}"
            )

    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate input data structure"""
        return isinstance(input_data, dict) and "data" in input_data
