"""Tests for workflow execution engine"""

import asyncio
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from app.services.workflow_execution_engine import (
    ExecutionContext,
    ExecutionStatus,
    RetryManager,
    TopologicalExecutor,
    WorkflowExecutionEngine,
)


class TestTopologicalExecutor:
    """Test topological sorting and execution planning"""

    def test_simple_linear_workflow(self):
        """Test linear workflow with sequential dependencies"""
        executor = TopologicalExecutor()
        workflow = {
            "id": "test_workflow",
            "steps": {
                "step1": {"type": "input", "depends_on": []},
                "step2": {"type": "process", "depends_on": ["step1"]},
                "step3": {"type": "output", "depends_on": ["step2"]},
            },
        }

        plan = executor.create_execution_plan(workflow)

        assert plan.workflow_id == "test_workflow"
        assert len(plan.execution_order) == 3
        assert plan.execution_order[0] == ["step1"]
        assert plan.execution_order[1] == ["step2"]
        assert plan.execution_order[2] == ["step3"]

    def test_parallel_workflow(self):
        """Test workflow with parallel execution opportunities"""
        executor = TopologicalExecutor()
        workflow = {
            "id": "parallel_workflow",
            "steps": {
                "step1": {"type": "input", "depends_on": []},
                "step2": {"type": "process", "depends_on": ["step1"]},
                "step3": {"type": "process", "depends_on": ["step1"]},
                "step4": {"type": "output", "depends_on": ["step2", "step3"]},
            },
        }

        plan = executor.create_execution_plan(workflow)

        assert len(plan.execution_order) == 3
        assert plan.execution_order[0] == ["step1"]
        assert set(plan.execution_order[1]) == {"step2", "step3"}
        assert plan.execution_order[2] == ["step4"]

    def test_complex_dependencies(self):
        """Test complex dependency graph"""
        executor = TopologicalExecutor()
        workflow = {
            "id": "complex_workflow",
            "steps": {
                "A": {"type": "input", "depends_on": []},
                "B": {"type": "input", "depends_on": []},
                "C": {"type": "process", "depends_on": ["A"]},
                "D": {"type": "process", "depends_on": ["B"]},
                "E": {"type": "process", "depends_on": ["C", "D"]},
                "F": {"type": "output", "depends_on": ["E"]},
            },
        }

        plan = executor.create_execution_plan(workflow)

        # Verify correct batching
        assert set(plan.execution_order[0]) == {"A", "B"}
        assert set(plan.execution_order[1]) == {"C", "D"}
        assert plan.execution_order[2] == ["E"]
        assert plan.execution_order[3] == ["F"]


class TestRetryManager:
    """Test retry logic and exponential backoff"""

    @pytest.mark.asyncio
    async def test_should_retry_logic(self):
        """Test retry decision logic"""
        retry_manager = RetryManager()
        context = ExecutionContext(
            workflow_id="test",
            step_id="step1",
            step_type="process",
            input_data={},
            start_time=datetime.now(),
            status=ExecutionStatus.FAILED,
            max_retries=3,
        )

        # Should retry on first failure
        assert await retry_manager.should_retry(context, Exception("test error"))

        # Should not retry after max retries
        context.retry_count = 3
        assert not await retry_manager.should_retry(context, Exception("test error"))

        # Should not retry validation errors
        context.retry_count = 0
        assert not await retry_manager.should_retry(
            context, ValueError("validation error")
        )

    @pytest.mark.asyncio
    async def test_exponential_backoff(self):
        """Test exponential backoff calculation"""
        retry_manager = RetryManager(base_delay=1.0, max_delay=10.0)

        delay1 = await retry_manager.get_retry_delay(0)
        delay2 = await retry_manager.get_retry_delay(1)
        delay3 = await retry_manager.get_retry_delay(2)

        assert delay1 == 1.0
        assert delay2 == 2.0
        assert delay3 == 4.0

        # Test max delay cap
        delay_high = await retry_manager.get_retry_delay(10)
        assert delay_high == 10.0


class TestWorkflowExecutionEngine:
    """Test main workflow execution engine"""

    @pytest.mark.asyncio
    async def test_simple_workflow_execution(self):
        """Test execution of simple workflow"""
        engine = WorkflowExecutionEngine()

        workflow = {
            "id": "simple_test",
            "steps": {
                "input_step": {
                    "type": "input",
                    "input": {"data": {"message": "hello"}},
                    "depends_on": [],
                },
                "output_step": {
                    "type": "output",
                    "input": {"destination": "console"},
                    "depends_on": ["input_step"],
                },
            },
        }

        result = await engine.execute_workflow(workflow)

        assert result["status"] == "completed"
        assert "results" in result
        assert "execution_time" in result

    @pytest.mark.asyncio
    async def test_parallel_execution(self):
        """Test parallel execution of independent steps"""
        engine = WorkflowExecutionEngine()

        workflow = {
            "id": "parallel_test",
            "steps": {
                "step1": {
                    "type": "process",
                    "input": {"data": {"value": 1}},
                    "depends_on": [],
                },
                "step2": {
                    "type": "process",
                    "input": {"data": {"value": 2}},
                    "depends_on": [],
                },
                "merge": {
                    "type": "process",
                    "input": {"operation": "merge"},
                    "depends_on": ["step1", "step2"],
                },
            },
        }

        start_time = datetime.now()
        result = await engine.execute_workflow(workflow)
        execution_time = (datetime.now() - start_time).total_seconds()

        assert result["status"] == "completed"
        # Parallel execution should be faster than sequential
        assert execution_time < 3.0  # Assuming each step takes ~1 second

    @pytest.mark.asyncio
    async def test_failure_handling(self):
        """Test workflow failure handling"""
        engine = WorkflowExecutionEngine()

        # Mock a failing executor
        with patch(
            "app.services.step_executors.factory.StepExecutorFactory.create_executor"
        ) as mock_factory:
            mock_executor = Mock()
            mock_executor.execute.side_effect = Exception("Simulated failure")
            mock_factory.return_value = mock_executor

            workflow = {
                "id": "failure_test",
                "steps": {
                    "failing_step": {
                        "type": "process",
                        "input": {"data": {}},
                        "depends_on": [],
                        "max_retries": 1,
                    }
                },
            }

            result = await engine.execute_workflow(workflow)

            assert result["status"] == "failed"
            assert "failed_steps" in result
            assert "failing_step" in result["failed_steps"]

    @pytest.mark.asyncio
    async def test_dependency_data_passing(self):
        """Test that dependency results are passed to dependent steps"""
        engine = WorkflowExecutionEngine()

        workflow = {
            "id": "dependency_test",
            "steps": {
                "producer": {
                    "type": "input",
                    "input": {"data": {"produced_value": "test_data"}},
                    "depends_on": [],
                },
                "consumer": {
                    "type": "process",
                    "input": {"operation": "consume"},
                    "depends_on": ["producer"],
                },
            },
        }

        result = await engine.execute_workflow(workflow)

        assert result["status"] == "completed"
        # Verify that consumer step received producer's output
        consumer_result = result["results"]["consumer"]
        assert "processed_data" in consumer_result

    def test_execution_status_tracking(self):
        """Test execution status tracking"""
        engine = WorkflowExecutionEngine()
        workflow_id = "status_test"

        # Simulate some completed steps
        engine.completed_steps[workflow_id].add("step1")
        engine.completed_steps[workflow_id].add("step2")
        engine.step_results[workflow_id]["step1"] = {"result": "data1"}
        engine.step_results[workflow_id]["step2"] = {"result": "data2"}

        status = engine.get_execution_status(workflow_id)

        assert status["workflow_id"] == workflow_id
        assert set(status["completed_steps"]) == {"step1", "step2"}
        assert len(status["step_results"]) == 2


@pytest.mark.asyncio
async def test_resource_limiting():
    """Test that parallel execution respects resource limits"""
    engine = WorkflowExecutionEngine(max_parallel_steps=2)

    # Create workflow with many parallel steps
    steps = {}
    for i in range(5):
        steps[f"step{i}"] = {
            "type": "process",
            "input": {"data": {"value": i}},
            "depends_on": [],
        }

    workflow = {"id": "resource_test", "steps": steps}

    # Mock executor to track concurrent executions
    concurrent_count = 0
    max_concurrent = 0

    async def mock_execute(input_data, context):
        nonlocal concurrent_count, max_concurrent
        concurrent_count += 1
        max_concurrent = max(max_concurrent, concurrent_count)
        await asyncio.sleep(0.1)  # Simulate work
        concurrent_count -= 1
        return Mock(success=True, data={"result": "done"})

    with patch(
        "app.services.step_executors.factory.StepExecutorFactory.create_executor"
    ) as mock_factory:
        mock_executor = Mock()
        mock_executor.execute = mock_execute
        mock_factory.return_value = mock_executor

        result = await engine.execute_workflow(workflow)

        assert result["status"] == "completed"
        assert max_concurrent <= 2  # Should not exceed limit


if __name__ == "__main__":
    pytest.main([__file__])
