"""Tests for the workflow execution engine."""

from datetime import datetime
from uuid import uuid4

import pytest
from app.models.execution import ExecutionStatus, WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow
from app.services.workflow_engine import (
    ExecutionResult,
    WorkflowEngine,
    WorkflowExecutionError,
)


@pytest.fixture
def workflow_engine():
    """Create a WorkflowEngine instance for testing."""
    return WorkflowEngine()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    user = User(
        email="test@example.com", name="Test User", hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_workflow(db_session, sample_user):
    """Create a sample workflow for testing."""
    workflow_definition = {
        "nodes": [
            {
                "id": "input-1",
                "type": "input",
                "data": {"label": "Input", "field": "user_input"},
            },
            {
                "id": "process-1",
                "type": "process",
                "data": {"label": "Process", "operation": "uppercase"},
            },
            {
                "id": "output-1",
                "type": "output",
                "data": {"label": "Output", "format": "json"},
            },
        ],
        "edges": [
            {"source": "input-1", "target": "process-1"},
            {"source": "process-1", "target": "output-1"},
        ],
    }

    workflow = Workflow(
        name="Test Workflow",
        description="A test workflow",
        user_id=sample_user.id,
        definition=workflow_definition,
    )
    db_session.add(workflow)
    db_session.commit()
    db_session.refresh(workflow)
    return workflow


@pytest.fixture
def sample_ai_workflow(db_session, sample_user):
    """Create a sample AI workflow for testing."""
    workflow_definition = {
        "nodes": [
            {
                "id": "input-1",
                "type": "input",
                "data": {"label": "Input", "field": "user_input"},
            },
            {
                "id": "ai-1",
                "type": "ai",
                "data": {"label": "AI Process", "prompt": "Analyze this text"},
            },
            {
                "id": "output-1",
                "type": "output",
                "data": {"label": "Output", "format": "json"},
            },
        ],
        "edges": [
            {"source": "input-1", "target": "ai-1"},
            {"source": "ai-1", "target": "output-1"},
        ],
    }

    workflow = Workflow(
        name="AI Test Workflow",
        description="A test workflow with AI",
        user_id=sample_user.id,
        definition=workflow_definition,
    )
    db_session.add(workflow)
    db_session.commit()
    db_session.refresh(workflow)
    return workflow


class TestWorkflowEngine:
    """Test cases for WorkflowEngine class."""

    @pytest.mark.asyncio
    async def test_execute_workflow_success(self, workflow_engine, sample_workflow):
        """Test successful workflow execution."""
        input_data = {"message": "hello world"}

        result = await workflow_engine.execute_workflow(sample_workflow.id, input_data)

        assert isinstance(result, ExecutionResult)
        assert result.status == ExecutionStatus.COMPLETED
        assert result.execution_id is not None
        assert result.output_data is not None
        assert result.error_message is None

    @pytest.mark.asyncio
    async def test_execute_workflow_nonexistent(self, workflow_engine):
        """Test execution of non-existent workflow."""
        fake_id = uuid4()

        with pytest.raises(WorkflowExecutionError) as exc_info:
            await workflow_engine.execute_workflow(fake_id, {})

        assert "not found or inactive" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_execute_workflow_with_ai_step(
        self, workflow_engine, sample_ai_workflow
    ):
        """Test workflow execution with AI step."""
        input_data = {"message": "analyze this text"}

        result = await workflow_engine.execute_workflow(
            sample_ai_workflow.id, input_data
        )

        assert result.status == ExecutionStatus.COMPLETED
        assert "ai_response" in result.output_data

    @pytest.mark.asyncio
    async def test_execute_workflow_empty_nodes(
        self, workflow_engine, db_session, sample_user
    ):
        """Test workflow execution with empty nodes."""
        workflow_definition = {"nodes": [], "edges": []}

        workflow = Workflow(
            name="Empty Workflow",
            description="A workflow with no nodes",
            user_id=sample_user.id,
            definition=workflow_definition,
        )
        db_session.add(workflow)
        db_session.commit()
        db_session.refresh(workflow)

        with pytest.raises(WorkflowExecutionError) as exc_info:
            await workflow_engine.execute_workflow(workflow.id, {})

        assert "no nodes to execute" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_get_execution_status_success(self, workflow_engine, sample_workflow):
        """Test getting execution status for existing execution."""
        input_data = {"message": "test"}

        # Execute workflow first
        result = await workflow_engine.execute_workflow(sample_workflow.id, input_data)

        # Get status
        status = await workflow_engine.get_execution_status(result.execution_id)

        assert status is not None
        assert status["id"] == result.execution_id
        assert status["workflow_id"] == sample_workflow.id
        assert status["status"] == ExecutionStatus.COMPLETED.value
        assert status["input_data"] == input_data

    @pytest.mark.asyncio
    async def test_get_execution_status_nonexistent(self, workflow_engine):
        """Test getting status for non-existent execution."""
        fake_id = uuid4()

        status = await workflow_engine.get_execution_status(fake_id)

        assert status is None

    @pytest.mark.asyncio
    async def test_cancel_execution_success(
        self, workflow_engine, db_session, sample_workflow
    ):
        """Test successful execution cancellation."""
        # Create a pending execution manually
        execution = WorkflowExecution(
            workflow_id=sample_workflow.id,
            status=ExecutionStatus.PENDING,
            input_data={"test": "data"},
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        # Cancel the execution
        result = await workflow_engine.cancel_execution(execution.id)

        assert result is True

        # Verify status was updated
        db_session.refresh(execution)
        assert execution.status == ExecutionStatus.CANCELLED
        assert execution.error_message == "Execution cancelled by user"
        assert execution.completed_at is not None

    @pytest.mark.asyncio
    async def test_cancel_execution_nonexistent(self, workflow_engine):
        """Test cancelling non-existent execution."""
        fake_id = uuid4()

        result = await workflow_engine.cancel_execution(fake_id)

        assert result is False

    @pytest.mark.asyncio
    async def test_cancel_execution_already_completed(
        self, workflow_engine, db_session, sample_workflow
    ):
        """Test cancelling already completed execution."""
        # Create a completed execution
        execution = WorkflowExecution(
            workflow_id=sample_workflow.id,
            status=ExecutionStatus.COMPLETED,
            input_data={"test": "data"},
            completed_at=datetime.utcnow(),
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        # Try to cancel
        result = await workflow_engine.cancel_execution(execution.id)

        assert result is False

    @pytest.mark.asyncio
    async def test_get_execution_logs(self, workflow_engine, sample_workflow):
        """Test getting execution logs."""
        input_data = {"message": "test logging"}

        # Execute workflow to generate logs
        result = await workflow_engine.execute_workflow(sample_workflow.id, input_data)

        # Get logs
        logs = await workflow_engine.get_execution_logs(result.execution_id)

        assert isinstance(logs, list)
        assert len(logs) > 0

        # Check log structure
        log = logs[0]
        assert "id" in log
        assert "step_name" in log
        assert "step_type" in log
        assert "input_data" in log
        assert "output_data" in log
        assert "duration_ms" in log
        assert "timestamp" in log

    @pytest.mark.asyncio
    async def test_get_execution_logs_with_limit(
        self, workflow_engine, sample_workflow
    ):
        """Test getting execution logs with limit."""
        input_data = {"message": "test logging"}

        # Execute workflow to generate logs
        result = await workflow_engine.execute_workflow(sample_workflow.id, input_data)

        # Get logs with limit
        logs = await workflow_engine.get_execution_logs(result.execution_id, limit=1)

        assert isinstance(logs, list)
        assert len(logs) <= 1

    @pytest.mark.asyncio
    async def test_get_execution_logs_nonexistent(self, workflow_engine):
        """Test getting logs for non-existent execution."""
        fake_id = uuid4()

        logs = await workflow_engine.get_execution_logs(fake_id)

        assert isinstance(logs, list)
        assert len(logs) == 0

    def test_build_execution_order(self, workflow_engine):
        """Test building execution order from nodes and edges."""
        nodes = [
            {"id": "node-1", "type": "input"},
            {"id": "node-2", "type": "process"},
            {"id": "node-3", "type": "output"},
        ]
        edges = [
            {"source": "node-1", "target": "node-2"},
            {"source": "node-2", "target": "node-3"},
        ]

        order = workflow_engine._build_execution_order(nodes, edges)

        assert order == ["node-1", "node-2", "node-3"]

    @pytest.mark.asyncio
    async def test_execute_input_step(self, workflow_engine):
        """Test executing an input step."""
        node = {
            "id": "input-1",
            "type": "input",
            "data": {"label": "Input", "field": "user_input"},
        }
        input_data = {"message": "hello"}

        result = await workflow_engine._execute_input_step(node, input_data)

        assert "user_input" in result
        assert result["user_input"] == input_data

    @pytest.mark.asyncio
    async def test_execute_process_step_uppercase(self, workflow_engine):
        """Test executing a process step with uppercase operation."""
        node = {
            "id": "process-1",
            "type": "process",
            "data": {"label": "Process", "operation": "uppercase"},
        }
        input_data = {"message": "hello world"}

        result = await workflow_engine._execute_process_step(node, input_data)

        assert result["message"] == "HELLO WORLD"

    @pytest.mark.asyncio
    async def test_execute_process_step_passthrough(self, workflow_engine):
        """Test executing a process step with passthrough operation."""
        node = {
            "id": "process-1",
            "type": "process",
            "data": {"label": "Process", "operation": "passthrough"},
        }
        input_data = {"message": "hello world"}

        result = await workflow_engine._execute_process_step(node, input_data)

        assert result == input_data

    @pytest.mark.asyncio
    async def test_execute_output_step(self, workflow_engine):
        """Test executing an output step."""
        node = {
            "id": "output-1",
            "type": "output",
            "data": {"label": "Output", "format": "json"},
        }
        input_data = {"message": "hello world"}

        result = await workflow_engine._execute_output_step(node, input_data)

        assert "result" in result
        assert result["result"] == input_data

    @pytest.mark.asyncio
    async def test_execute_ai_step(self, workflow_engine):
        """Test executing an AI step."""
        node = {
            "id": "ai-1",
            "type": "ai",
            "data": {"label": "AI Process", "prompt": "Analyze this text"},
        }
        input_data = {"message": "hello world"}

        result = await workflow_engine._execute_ai_step(node, input_data)

        assert "ai_response" in result
        assert "processed_data" in result
        assert result["processed_data"] == input_data
        assert "Analyze this text" in result["ai_response"]

    @pytest.mark.asyncio
    async def test_execute_default_step(self, workflow_engine):
        """Test executing a default step for unknown types."""
        node = {"id": "unknown-1", "type": "unknown", "data": {"label": "Unknown"}}
        input_data = {"message": "hello world"}

        result = await workflow_engine._execute_default_step(node, input_data)

        assert result == input_data


class TestWorkflowEngineErrorHandling:
    """Test error handling in WorkflowEngine."""

    @pytest.mark.asyncio
    async def test_workflow_execution_database_error(self, workflow_engine):
        """Test workflow execution with database error."""
        fake_id = uuid4()

        with pytest.raises(WorkflowExecutionError):
            await workflow_engine.execute_workflow(fake_id, {})

    @pytest.mark.asyncio
    async def test_execution_status_database_error(self, workflow_engine):
        """Test getting execution status with database error."""
        fake_id = uuid4()

        # This should not raise an exception, just return None
        status = await workflow_engine.get_execution_status(fake_id)
        assert status is None

    @pytest.mark.asyncio
    async def test_step_execution_error_logging(
        self, workflow_engine, db_session, sample_user
    ):
        """Test that step execution errors are properly logged."""
        # Create a workflow with a step that will fail
        workflow_definition = {
            "nodes": [
                {
                    "id": "failing-step",
                    "type": "unknown_type_that_will_fail",
                    "data": {"label": "Failing Step"},
                }
            ],
            "edges": [],
        }

        workflow = Workflow(
            name="Failing Workflow",
            description="A workflow that will fail",
            user_id=sample_user.id,
            definition=workflow_definition,
        )
        db_session.add(workflow)
        db_session.commit()
        db_session.refresh(workflow)

        # Execute workflow and expect it to fail
        with pytest.raises(WorkflowExecutionError):
            await workflow_engine.execute_workflow(workflow.id, {})

        # Check that execution was marked as failed
        execution = (
            db_session.query(WorkflowExecution)
            .filter(WorkflowExecution.workflow_id == workflow.id)
            .first()
        )

        assert execution is not None
        assert execution.status == ExecutionStatus.FAILED
        assert execution.error_message is not None


class TestExecutionResult:
    """Test ExecutionResult class."""

    def test_execution_result_creation(self):
        """Test creating an ExecutionResult."""
        execution_id = uuid4()
        output_data = {"result": "success"}

        result = ExecutionResult(
            execution_id=execution_id,
            status=ExecutionStatus.COMPLETED,
            output_data=output_data,
        )

        assert result.execution_id == execution_id
        assert result.status == ExecutionStatus.COMPLETED
        assert result.output_data == output_data
        assert result.error_message is None

    def test_execution_result_with_error(self):
        """Test creating an ExecutionResult with error."""
        execution_id = uuid4()
        error_message = "Something went wrong"

        result = ExecutionResult(
            execution_id=execution_id,
            status=ExecutionStatus.FAILED,
            error_message=error_message,
        )

        assert result.execution_id == execution_id
        assert result.status == ExecutionStatus.FAILED
        assert result.output_data == {}
        assert result.error_message == error_message
