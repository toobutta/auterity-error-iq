"""Process step executor implementation"""

from typing import Any, Dict

from .base_executor import BaseStepExecutor, ExecutionResult, StepType


class ProcessStepExecutor(BaseStepExecutor):
    """Executor for data processing steps"""

    def __init__(self):
        super().__init__()
        self.step_type = StepType.PROCESS

    async def execute(
        self, input_data: Dict[str, Any], context: Dict[str, Any]
    ) -> ExecutionResult:
        """Execute data processing logic"""
        try:
            if not self.validate_input(input_data):
                return ExecutionResult(
                    success=False, data={}, error="Invalid process input data"
                )

            # Apply processing rules
            processing_rules = input_data.get("rules", [])
            data_to_process = input_data.get("data", {})

            processed_result = self._apply_processing_rules(
                data_to_process, processing_rules
            )

            return ExecutionResult(
                success=True,
                data={"processed_data": processed_result},
                metadata={"rules_applied": len(processing_rules)},
            )

        except Exception as e:
            return ExecutionResult(
                success=False,
                data={},
                error=f"Process execution failed: {str(e)}",
            )

    def validate_input(self, input_data: Dict[str, Any]) -> bool:
        """Validate process input data"""
        return isinstance(input_data, dict) and "data" in input_data

    def _apply_processing_rules(
        self, data: Dict[str, Any], rules: list
    ) -> Dict[str, Any]:
        """Apply processing rules to data"""
        result = data.copy()
        for rule in rules:
            if rule.get("type") == "transform":
                field = rule.get("field")
                operation = rule.get("operation")
                if field in result and operation:
                    result[field] = self._apply_operation(
                        result[field], operation
                    )
        return result

    def _apply_operation(self, value: Any, operation: str) -> Any:
        """Apply a single operation to a value"""
        if operation == "uppercase" and isinstance(value, str):
            return value.upper()
        elif operation == "lowercase" and isinstance(value, str):
            return value.lower()
        return value
