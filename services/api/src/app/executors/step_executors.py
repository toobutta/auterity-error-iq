"""Concrete step executor implementations."""

from typing import Any, Dict

from jsonschema import Draft7Validator

from app.interfaces.step_executor import StepExecutor
from app.types.workflow import StepExecutionResult, WorkflowNode


class WorkflowStepError(Exception):
    """Custom exception for individual workflow step errors."""


class InputStepExecutor(StepExecutor):
    """Executor for input steps."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        field_name = node.data.get("field", "input")
        return StepExecutionResult(
            success=True, output_data={field_name: input_data}
        )


class ProcessStepExecutor(StepExecutor):
    """Executor for process steps."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        operation = node.data.get("operation", "passthrough")

        if operation == "passthrough":
            output_data = input_data
        elif operation == "uppercase":
            output_data = {
                key: value.upper() if isinstance(value, str) else value
                for key, value in input_data.items()
            }
        else:
            output_data = input_data

        return StepExecutionResult(success=True, output_data=output_data)


class OutputStepExecutor(StepExecutor):
    """Executor for output steps."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        format_type = node.data.get("format", "json")

        if format_type == "json":
            output_data = {"result": input_data}
        else:
            output_data = input_data

        return StepExecutionResult(success=True, output_data=output_data)


class AIStepExecutor(StepExecutor):
    """Executor for AI steps."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        try:
            from app.services.ai_service import get_ai_service

            prompt = node.data.get("prompt", "Process this data")
            template_name = node.data.get("template")
            model = node.data.get("model")

            ai_service = get_ai_service()

            if template_name:
                template_vars = node.data.get("template_variables", {})
                all_vars = {**input_data, **template_vars}
                response = await ai_service.process_with_template(
                    template_name=template_name,
                    variables=all_vars,
                    context=input_data,
                    model=model,
                )
            else:
                formatted_prompt = (
                    prompt.format(**input_data) if "{" in prompt else prompt
                )
                response = await ai_service.process_text(
                    prompt=formatted_prompt, context=input_data, model=model
                )

            if not response.is_success:
                return StepExecutionResult(
                    success=False,
                    output_data={},
                    error_message=f"AI processing failed: {response.error}",
                )

            return StepExecutionResult(
                success=True,
                output_data={
                    "ai_response": response.content,
                    "ai_model": response.model,
                    "ai_usage": response.usage,
                    "processed_data": input_data,
                },
            )

        except Exception as e:
            return StepExecutionResult(
                success=False,
                output_data={},
                error_message=f"AI step execution failed: {str(e)}",
            )


class DataValidationStepExecutor(StepExecutor):
    """Executor for data validation steps."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        validation_schema = node.data.get("validation_schema")

        if not validation_schema:
            return StepExecutionResult(
                success=False,
                output_data={},
                error_message="No validation schema defined for data validation step",
            )

        try:
            validator = Draft7Validator(validation_schema)
            if not validator.is_valid(input_data):
                errors = sorted(
                    validator.iter_errors(input_data),
                    key=lambda e: e.absolute_path,
                )
                error_messages = [
                    f"Field {list(error.absolute_path)}: {error.message}"
                    for error in errors
                ]
                return StepExecutionResult(
                    success=False,
                    output_data={},
                    error_message=f"Data validation failed: {'; '.join(error_messages)}",
                )

            return StepExecutionResult(
                success=True,
                output_data={
                    "validation_result": "success",
                    "validated_data": input_data,
                },
            )

        except Exception as e:
            return StepExecutionResult(
                success=False,
                output_data={},
                error_message=f"Data validation step failed: {str(e)}",
            )


class DefaultStepExecutor(StepExecutor):
    """Default executor for unknown step types."""

    async def execute_step(
        self, node: WorkflowNode, input_data: Dict[str, Any]
    ) -> StepExecutionResult:
        return StepExecutionResult(success=True, output_data=input_data)
