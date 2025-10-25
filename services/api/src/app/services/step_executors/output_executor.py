"""Output step executor implementation"""

from typing import Any, Dict

from .base_executor import BaseStepExecutor, ExecutionResult, StepType


class OutputStepExecutor(BaseStepExecutor):
    """Executor for output/result delivery steps"""

    def __init__(self):
        super().__init__()
        self.step_type = StepType.OUTPUT

    async def execute(
        self, input_data: Dict[str, Any], context: Dict[str, Any]
    ) -> ExecutionResult:
        """Execute output delivery"""
        try:
            if not self.validate_input(input_data):
                return ExecutionResult(
                    success=False, data={}, error="Invalid output data"
                )

            output_data = input_data.get("data", {})
            destination = input_data.get("destination", "default")

            # Process output delivery
            delivery_result = await self._deliver_output(
                output_data, destination
            )

            return ExecutionResult(
                success=True,
                data={
                    "delivery_status": delivery_result,
                    "destination": destination,
                },
                metadata={"output_size": len(str(output_data))},
            )

        except Exception as e:
            return ExecutionResult(
                success=False,
                data={},
                error=f"Output execution failed: {str(e)}",
            )

    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate output data"""
        return isinstance(input_data, dict) and "data" in input_data

    async def _deliver_output(
        self, data: Dict[str, Any], destination: str
    ) -> str:
        """Deliver output to specified destination"""
        # Placeholder for actual output delivery logic
        return f"Delivered to {destination}"
