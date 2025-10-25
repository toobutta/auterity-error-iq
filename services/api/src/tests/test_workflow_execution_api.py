"""Integration tests for workflow execution API endpoints."""

from datetime import datetime
from unittest.mock import patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.execution import ExecutionStatus, WorkflowExecution
from app.models.user import User
from app.models.workflow import Workflow
from app.services.workflow_engine import ExecutionResult, WorkflowEngine


class TestWorkflowExecutionAPI:
    """Test suite for workflow execution API endpoints."""

    @pytest.fixture
    def test_workflow_definition(self):
        """Sample workflow definition for testing."""
        return {
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

    @pytest.fixture
    def test_workflow(
        self, db_session: Session, test_user: User, test_workflow_definition
    ):
        """Create a test workflow."""
        workflow = Workflow(
            name="Test Execution Workflow",
            description="Workflow for testing execution",
            user_id=test_user.id,
            definition=test_workflow_definition,
        )
        db_session.add(workflow)
        db_session.commit()
        db_session.refresh(workflow)
        return workflow

    def test_execute_workflow_success(
        self, client: TestClient, auth_headers: dict, test_workflow: Workflow
    ):
        """Test successful workflow execution."""
        execution_data = {"input_data": {"message": "hello world"}}

        with patch.object(WorkflowEngine, "execute_workflow") as mock_execute:
            # Mock successful execution
            mock_result = ExecutionResult(
                execution_id=uuid4(),
                status=ExecutionStatus.COMPLETED,
                output_data={"result": {"message": "HELLO WORLD"}},
            )
            mock_execute.return_value = mock_result

            response = client.post(
                f"/api/workflows/{test_workflow.id}/execute",
                json=execution_data,
                headers=auth_headers,
            )

            assert response.status_code == 202
            data = response.json()
            assert data["status"] == "completed"
            assert data["execution_id"] == str(mock_result.execution_id)
            assert data["output_data"]["result"]["message"] == "HELLO WORLD"
            assert data["error_message"] is None

            # Verify engine was called with correct parameters
            mock_execute.assert_called_once_with(
                workflow_id=test_workflow.id,
                input_data=execution_data["input_data"],
            )

    def test_execute_workflow_with_empty_input(
        self, client: TestClient, auth_headers: dict, test_workflow: Workflow
    ):
        """Test workflow execution with empty input data."""
        execution_data = {}

        with patch.object(WorkflowEngine, "execute_workflow") as mock_execute:
            mock_result = ExecutionResult(
                execution_id=uuid4(),
                status=ExecutionStatus.COMPLETED,
                output_data={"result": {}},
            )
            mock_execute.return_value = mock_result

            response = client.post(
                f"/api/workflows/{test_workflow.id}/execute",
                json=execution_data,
                headers=auth_headers,
            )

            assert response.status_code == 202
            # Verify engine was called with None input_data
            mock_execute.assert_called_once_with(
                workflow_id=test_workflow.id, input_data=None
            )

    def test_execute_workflow_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        """Test executing non-existent workflow."""
        fake_workflow_id = uuid4()
        execution_data = {"input_data": {"message": "test"}}

        response = client.post(
            f"/api/workflows/{fake_workflow_id}/execute",
            json=execution_data,
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "Workflow not found" in response.json()["detail"]

    def test_execute_workflow_execution_error(
        self, client: TestClient, auth_headers: dict, test_workflow: Workflow
    ):
        """Test workflow execution with engine error."""
        execution_data = {"input_data": {"message": "test"}}

        with patch.object(WorkflowEngine, "execute_workflow") as mock_execute:
            from app.services.workflow_engine import WorkflowExecutionError

            mock_execute.side_effect = WorkflowExecutionError(
                "Execution failed"
            )

            response = client.post(
                f"/api/workflows/{test_workflow.id}/execute",
                json=execution_data,
                headers=auth_headers,
            )

            assert response.status_code == 400
            assert "Workflow execution failed" in response.json()["detail"]

    def test_execute_workflow_unauthorized(
        self, client: TestClient, test_workflow: Workflow
    ):
        """Test workflow execution without authentication."""
        execution_data = {"input_data": {"message": "test"}}

        response = client.post(
            f"/api/workflows/{test_workflow.id}/execute",
            json=execution_data,
        )

        assert response.status_code == 401

    def test_get_execution_status_success(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test getting execution status successfully."""
        # Create test execution
        execution = WorkflowExecution(
            workflow_id=test_workflow.id,
            status=ExecutionStatus.COMPLETED,
            input_data={"message": "test"},
            output_data={"result": "TEST"},
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        response = client.get(
            f"/api/workflows/executions/{execution.id}",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(execution.id)
        assert data["workflow_id"] == str(test_workflow.id)
        assert data["status"] == "completed"
        assert data["input_data"]["message"] == "test"
        assert data["output_data"]["result"] == "TEST"
        assert data["error_message"] is None

    def test_get_execution_status_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        """Test getting status for non-existent execution."""
        fake_execution_id = uuid4()

        response = client.get(
            f"/api/workflows/executions/{fake_execution_id}",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "Execution not found" in response.json()["detail"]

    def test_get_execution_logs_success(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test getting execution logs successfully."""
        from app.models.execution import ExecutionLog

        # Create test execution
        execution = WorkflowExecution(
            workflow_id=test_workflow.id,
            status=ExecutionStatus.COMPLETED,
            input_data={"message": "test"},
            output_data={"result": "TEST"},
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        # Create test logs
        log1 = ExecutionLog(
            execution_id=execution.id,
            step_name="Input Step",
            step_type="input",
            input_data={"message": "test"},
            output_data={"user_input": {"message": "test"}},
            duration_ms=100,
        )
        log2 = ExecutionLog(
            execution_id=execution.id,
            step_name="Process Step",
            step_type="process",
            input_data={"user_input": {"message": "test"}},
            output_data={"message": "TEST"},
            duration_ms=200,
        )
        db_session.add_all([log1, log2])
        db_session.commit()

        response = client.get(
            f"/api/workflows/executions/{execution.id}/logs",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["step_name"] == "Input Step"
        assert data[0]["step_type"] == "input"
        assert data[0]["duration_ms"] == 100
        assert data[1]["step_name"] == "Process Step"
        assert data[1]["step_type"] == "process"
        assert data[1]["duration_ms"] == 200

    def test_get_execution_logs_with_filters(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test getting execution logs with filters."""
        from app.models.execution import ExecutionLog

        # Create test execution
        execution = WorkflowExecution(
            workflow_id=test_workflow.id,
            status=ExecutionStatus.FAILED,
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        # Create test logs with different types and errors
        logs = [
            ExecutionLog(
                execution_id=execution.id,
                step_name="Input Step",
                step_type="input",
                duration_ms=100,
            ),
            ExecutionLog(
                execution_id=execution.id,
                step_name="Process Step",
                step_type="process",
                duration_ms=200,
                error_message="Processing failed",
            ),
            ExecutionLog(
                execution_id=execution.id,
                step_name="AI Step",
                step_type="ai",
                duration_ms=300,
            ),
        ]
        db_session.add_all(logs)
        db_session.commit()

        # Test filter by step type
        response = client.get(
            f"/api/workflows/executions/{execution.id}/logs?step_type=process",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["step_type"] == "process"

        # Test filter by error status
        response = client.get(
            f"/api/workflows/executions/{execution.id}/logs?has_error=true",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["error_message"] == "Processing failed"

        # Test filter by step name
        response = client.get(
            f"/api/workflows/executions/{execution.id}/logs?step_name=AI",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["step_name"] == "AI Step"

        # Test limit
        response = client.get(
            f"/api/workflows/executions/{execution.id}/logs?limit=2",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_cancel_execution_success(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test successful execution cancellation."""
        # Create running execution
        execution = WorkflowExecution(
            workflow_id=test_workflow.id,
            status=ExecutionStatus.RUNNING,
            input_data={"message": "test"},
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        with patch.object(WorkflowEngine, "cancel_execution") as mock_cancel:
            mock_cancel.return_value = True

            response = client.post(
                f"/api/workflows/executions/{execution.id}/cancel",
                headers=auth_headers,
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Execution cancelled successfully"

            mock_cancel.assert_called_once_with(execution.id)

    def test_cancel_execution_failure(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test execution cancellation failure."""
        # Create completed execution (cannot be cancelled)
        execution = WorkflowExecution(
            workflow_id=test_workflow.id,
            status=ExecutionStatus.COMPLETED,
            input_data={"message": "test"},
        )
        db_session.add(execution)
        db_session.commit()
        db_session.refresh(execution)

        with patch.object(WorkflowEngine, "cancel_execution") as mock_cancel:
            mock_cancel.return_value = False

            response = client.post(
                f"/api/workflows/executions/{execution.id}/cancel",
                headers=auth_headers,
            )

            assert response.status_code == 400
            assert "cannot be cancelled" in response.json()["detail"]

    def test_cancel_execution_not_found(
        self, client: TestClient, auth_headers: dict
    ):
        """Test cancelling non-existent execution."""
        fake_execution_id = uuid4()

        response = client.post(
            f"/api/workflows/executions/{fake_execution_id}/cancel",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "Execution not found" in response.json()["detail"]

    def test_list_executions_success(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test listing executions successfully."""
        # Create test executions
        executions = [
            WorkflowExecution(
                workflow_id=test_workflow.id,
                status=ExecutionStatus.COMPLETED,
                input_data={"message": "test1"},
            ),
            WorkflowExecution(
                workflow_id=test_workflow.id,
                status=ExecutionStatus.FAILED,
                input_data={"message": "test2"},
                error_message="Test error",
            ),
            WorkflowExecution(
                workflow_id=test_workflow.id,
                status=ExecutionStatus.RUNNING,
                input_data={"message": "test3"},
            ),
        ]
        db_session.add_all(executions)
        db_session.commit()

        response = client.get(
            "/api/workflows/executions",
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Should be ordered by started_at desc (most recent first)
        assert data[0]["status"] == "running"
        assert data[1]["status"] == "failed"
        assert data[2]["status"] == "completed"

    def test_list_executions_with_filters(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
        test_user: User,
    ):
        """Test listing executions with filters."""
        # Create another workflow for testing
        other_workflow = Workflow(
            name="Other Workflow",
            description="Another workflow",
            user_id=test_user.id,
            definition={"nodes": [], "edges": []},
        )
        db_session.add(other_workflow)
        db_session.commit()
        db_session.refresh(other_workflow)

        # Create executions for both workflows
        executions = [
            WorkflowExecution(
                workflow_id=test_workflow.id,
                status=ExecutionStatus.COMPLETED,
            ),
            WorkflowExecution(
                workflow_id=test_workflow.id,
                status=ExecutionStatus.FAILED,
            ),
            WorkflowExecution(
                workflow_id=other_workflow.id,
                status=ExecutionStatus.COMPLETED,
            ),
        ]
        db_session.add_all(executions)
        db_session.commit()

        # Test filter by workflow_id
        response = client.get(
            f"/api/workflows/executions?workflow_id={test_workflow.id}",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(
            exec["workflow_id"] == str(test_workflow.id) for exec in data
        )

        # Test filter by status
        response = client.get(
            "/api/workflows/executions?status_filter=completed",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(exec["status"] == "completed" for exec in data)

        # Test limit and offset
        response = client.get(
            "/api/workflows/executions?limit=2&offset=1",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_list_executions_invalid_status_filter(
        self, client: TestClient, auth_headers: dict
    ):
        """Test listing executions with invalid status filter."""
        response = client.get(
            "/api/workflows/executions?status_filter=invalid_status",
            headers=auth_headers,
        )

        assert response.status_code == 400
        assert "Invalid status filter" in response.json()["detail"]

    def test_list_executions_invalid_workflow_id(
        self, client: TestClient, auth_headers: dict
    ):
        """Test listing executions with non-existent workflow ID."""
        fake_workflow_id = uuid4()

        response = client.get(
            f"/api/workflows/executions?workflow_id={fake_workflow_id}",
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert "Workflow not found" in response.json()["detail"]

    def test_execution_endpoints_user_isolation(
        self,
        client: TestClient,
        auth_headers: dict,
        db_session: Session,
        test_workflow: Workflow,
    ):
        """Test that users can only access their own executions."""
        # Create another user and workflow
        other_user = User(
            email="other@example.com",
            name="Other User",
            hashed_password="hashed_password",
        )
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        other_workflow = Workflow(
            name="Other User Workflow",
            description="Workflow belonging to other user",
            user_id=other_user.id,
            definition={"nodes": [], "edges": []},
        )
        db_session.add(other_workflow)
        db_session.commit()
        db_session.refresh(other_workflow)

        # Create execution for other user's workflow
        other_execution = WorkflowExecution(
            workflow_id=other_workflow.id,
            status=ExecutionStatus.COMPLETED,
        )
        db_session.add(other_execution)
        db_session.commit()
        db_session.refresh(other_execution)

        # Try to access other user's execution
        response = client.get(
            f"/api/workflows/executions/{other_execution.id}",
            headers=auth_headers,
        )
        assert response.status_code == 404

        # Try to get logs for other user's execution
        response = client.get(
            f"/api/workflows/executions/{other_execution.id}/logs",
            headers=auth_headers,
        )
        assert response.status_code == 404

        # Try to cancel other user's execution
        response = client.post(
            f"/api/workflows/executions/{other_execution.id}/cancel",
            headers=auth_headers,
        )
        assert response.status_code == 404

        # Try to execute other user's workflow
        response = client.post(
            f"/api/workflows/{other_workflow.id}/execute",
            json={"input_data": {"test": "data"}},
            headers=auth_headers,
        )
        assert response.status_code == 404
