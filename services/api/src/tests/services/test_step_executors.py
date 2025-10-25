"""Tests for step executors"""

from datetime import datetime

import pytest

from app.services.step_executors.ai_executor import AIStepExecutor
from app.services.step_executors.base_executor import StepType
from app.services.step_executors.factory import StepExecutorFactory
from app.services.step_executors.input_executor import InputStepExecutor
from app.services.step_executors.output_executor import OutputStepExecutor
from app.services.step_executors.process_executor import ProcessStepExecutor


class TestStepExecutorFactory:
    """Test step executor factory"""

    def test_create_input_executor(self):
        """Test creating input executor"""
        executor = StepExecutorFactory.create_executor("input")
        assert isinstance(executor, InputStepExecutor)
        assert executor.get_step_type() == StepType.INPUT

    def test_create_process_executor(self):
        """Test creating process executor"""
        executor = StepExecutorFactory.create_executor("process")
        assert isinstance(executor, ProcessStepExecutor)
        assert executor.get_step_type() == StepType.PROCESS

    def test_create_ai_executor(self):
        """Test creating AI executor"""
        executor = StepExecutorFactory.create_executor("ai")
        assert isinstance(executor, AIStepExecutor)
        assert executor.get_step_type() == StepType.AI

    def test_create_output_executor(self):
        """Test creating output executor"""
        executor = StepExecutorFactory.create_executor("output")
        assert isinstance(executor, OutputStepExecutor)
        assert executor.get_step_type() == StepType.OUTPUT

    def test_invalid_step_type(self):
        """Test handling of invalid step type"""
        with pytest.raises(ValueError, match="Invalid step type"):
            StepExecutorFactory.create_executor("invalid_type")

    def test_get_supported_types(self):
        """Test getting supported step types"""
        types = StepExecutorFactory.get_supported_types()
        expected_types = ["input", "process", "ai", "output"]
        assert set(types) == set(expected_types)


class TestInputStepExecutor:
    """Test input step executor"""

    @pytest.mark.asyncio
    async def test_valid_input_execution(self):
        """Test successful input execution"""
        executor = InputStepExecutor()
        input_data = {"data": {"name": "test", "value": 123}, "source": "api"}
        context = {"timestamp": datetime.now().isoformat()}

        result = await executor.execute(input_data, context)

        assert result.success is True
        assert "collected_data" in result.data
        assert result.data["collected_data"] == input_data["data"]
        assert result.data["source"] == "api"
        assert result.metadata["step_type"] == "input"

    @pytest.mark.asyncio
    async def test_invalid_input_data(self):
        """Test handling of invalid input data"""
        executor = InputStepExecutor()
        invalid_input = {"invalid": "structure"}
        context = {}

        result = await executor.execute(invalid_input, context)

        assert result.success is False
        assert "Invalid input data format" in result.error

    def test_input_validation(self):
        """Test input validation logic"""
        executor = InputStepExecutor()

        # Valid input
        valid_input = {"data": {"key": "value"}}
        assert executor.validate_input(valid_input) is True

        # Invalid input - missing data key
        invalid_input = {"other": "value"}
        assert executor.validate_input(invalid_input) is False

        # Invalid input - not a dict
        assert executor.validate_input("not_a_dict") is False


class TestProcessStepExecutor:
    """Test process step executor"""

    @pytest.mark.asyncio
    async def test_process_execution_with_rules(self):
        """Test process execution with transformation rules"""
        executor = ProcessStepExecutor()
        input_data = {
            "data": {"name": "test", "description": "TEST DESCRIPTION"},
            "rules": [
                {
                    "type": "transform",
                    "field": "name",
                    "operation": "uppercase",
                },
                {
                    "type": "transform",
                    "field": "description",
                    "operation": "lowercase",
                },
            ],
        }
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is True
        processed_data = result.data["processed_data"]
        assert processed_data["name"] == "TEST"
        assert processed_data["description"] == "test description"
        assert result.metadata["rules_applied"] == 2

    @pytest.mark.asyncio
    async def test_process_execution_no_rules(self):
        """Test process execution without rules"""
        executor = ProcessStepExecutor()
        input_data = {"data": {"key": "value"}}
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is True
        assert result.data["processed_data"] == {"key": "value"}
        assert result.metadata["rules_applied"] == 0

    def test_operation_application(self):
        """Test individual operation application"""
        executor = ProcessStepExecutor()

        # Test uppercase
        result = executor._apply_operation("hello", "uppercase")
        assert result == "HELLO"

        # Test lowercase
        result = executor._apply_operation("WORLD", "lowercase")
        assert result == "world"

        # Test unknown operation
        result = executor._apply_operation("test", "unknown")
        assert result == "test"  # Should return unchanged


class TestAIStepExecutor:
    """Test AI step executor"""

    @pytest.mark.asyncio
    async def test_ai_execution(self):
        """Test AI step execution"""
        executor = AIStepExecutor()
        input_data = {
            "prompt": "Analyze this data",
            "data": {"key1": "value1", "key2": "value2"},
        }
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is True
        assert "ai_response" in result.data
        assert "Analyze this data" in result.data["ai_response"]
        assert result.metadata["prompt_length"] == len(input_data["prompt"])

    @pytest.mark.asyncio
    async def test_ai_execution_missing_prompt(self):
        """Test AI execution with missing prompt"""
        executor = AIStepExecutor()
        input_data = {"data": {"key": "value"}}
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is False
        assert "Invalid AI input data" in result.error

    def test_ai_input_validation(self):
        """Test AI input validation"""
        executor = AIStepExecutor()

        # Valid input
        valid_input = {"prompt": "test prompt", "data": {}}
        assert executor.validate_input(valid_input) is True

        # Invalid input - missing prompt
        invalid_input = {"data": {"key": "value"}}
        assert executor.validate_input(invalid_input) is False


class TestOutputStepExecutor:
    """Test output step executor"""

    @pytest.mark.asyncio
    async def test_output_execution(self):
        """Test output step execution"""
        executor = OutputStepExecutor()
        input_data = {
            "data": {"result": "final output", "status": "success"},
            "destination": "file",
        }
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is True
        assert result.data["destination"] == "file"
        assert "delivery_status" in result.data
        assert result.metadata["output_size"] > 0

    @pytest.mark.asyncio
    async def test_output_execution_default_destination(self):
        """Test output execution with default destination"""
        executor = OutputStepExecutor()
        input_data = {"data": {"result": "test"}}
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is True
        assert result.data["destination"] == "default"

    @pytest.mark.asyncio
    async def test_output_execution_invalid_data(self):
        """Test output execution with invalid data"""
        executor = OutputStepExecutor()
        input_data = {"invalid": "structure"}
        context = {}

        result = await executor.execute(input_data, context)

        assert result.success is False
        assert "Invalid output data" in result.error


if __name__ == "__main__":
    pytest.main([__file__])
