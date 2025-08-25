"""Integration tests for workflow management API endpoints."""

import uuid

import pytest
from app.auth import get_password_hash
from app.main import app
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

client = TestClient(app)


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password=get_password_hash("testpassword"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User):
    """Get authentication headers for test user."""
    login_data = {"email": "test@example.com", "password": "testpassword"}
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_workflow_data():
    """Sample workflow data for testing."""
    return {
        "name": "Test Workflow",
        "description": "A test workflow for integration testing",
        "definition": {
            "nodes": [
                {"id": "start", "type": "start", "data": {"label": "Start"}},
                {
                    "id": "process",
                    "type": "ai_process",
                    "data": {"label": "AI Process", "prompt": "Process this input"},
                },
                {"id": "end", "type": "end", "data": {"label": "End"}},
            ],
            "edges": [
                {"id": "e1", "source": "start", "target": "process"},
                {"id": "e2", "source": "process", "target": "end"},
            ],
        },
    }


class TestWorkflowCreation:
    """Test workflow creation endpoint."""

    def test_create_workflow_success(self, auth_headers, sample_workflow_data):
        """Test successful workflow creation."""
        response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_workflow_data["name"]
        assert data["description"] == sample_workflow_data["description"]
        assert data["definition"] == sample_workflow_data["definition"]
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_workflow_without_auth(self, sample_workflow_data):
        """Test workflow creation without authentication."""
        response = client.post("/api/workflows/", json=sample_workflow_data)
        assert response.status_code == 401

    def test_create_workflow_duplicate_name(self, auth_headers, sample_workflow_data):
        """Test creating workflow with duplicate name."""
        # Create first workflow
        response1 = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        assert response1.status_code == 201

        # Try to create second workflow with same name
        response2 = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        assert response2.status_code == 400
        assert "already exists" in response2.json()["detail"]

    def test_create_workflow_invalid_name(self, auth_headers, sample_workflow_data):
        """Test workflow creation with invalid name."""
        # Empty name
        invalid_data = sample_workflow_data.copy()
        invalid_data["name"] = ""
        response = client.post(
            "/api/workflows/", json=invalid_data, headers=auth_headers
        )
        assert response.status_code == 422

        # Name too long
        invalid_data["name"] = "x" * 256
        response = client.post(
            "/api/workflows/", json=invalid_data, headers=auth_headers
        )
        assert response.status_code == 422

    def test_create_workflow_invalid_definition(
        self, auth_headers, sample_workflow_data
    ):
        """Test workflow creation with invalid definition."""
        # Missing nodes
        invalid_data = sample_workflow_data.copy()
        invalid_data["definition"] = {"edges": []}
        response = client.post(
            "/api/workflows/", json=invalid_data, headers=auth_headers
        )
        assert response.status_code == 422

        # Invalid node structure
        invalid_data["definition"] = {"nodes": [{"invalid": "node"}], "edges": []}
        response = client.post(
            "/api/workflows/", json=invalid_data, headers=auth_headers
        )
        assert response.status_code == 422


class TestWorkflowRetrieval:
    """Test workflow retrieval endpoints."""

    def test_list_workflows_empty(self, auth_headers):
        """Test listing workflows when none exist."""
        response = client.get("/api/workflows/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["workflows"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 10

    def test_list_workflows_with_data(self, auth_headers, sample_workflow_data):
        """Test listing workflows with existing data."""
        # Create a workflow first
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        assert create_response.status_code == 201

        # List workflows
        response = client.get("/api/workflows/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["workflows"]) == 1
        assert data["total"] == 1
        assert data["workflows"][0]["name"] == sample_workflow_data["name"]

    def test_list_workflows_pagination(self, auth_headers, sample_workflow_data):
        """Test workflow list pagination."""
        # Create multiple workflows
        for i in range(5):
            workflow_data = sample_workflow_data.copy()
            workflow_data["name"] = f"Test Workflow {i}"
            response = client.post(
                "/api/workflows/", json=workflow_data, headers=auth_headers
            )
            assert response.status_code == 201

        # Test pagination
        response = client.get(
            "/api/workflows/?page=1&page_size=2", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["workflows"]) == 2
        assert data["total"] == 5
        assert data["page"] == 1
        assert data["page_size"] == 2

    def test_list_workflows_filtering(self, auth_headers, sample_workflow_data):
        """Test workflow list filtering."""
        # Create workflows with different names
        workflow1 = sample_workflow_data.copy()
        workflow1["name"] = "Sales Workflow"
        workflow2 = sample_workflow_data.copy()
        workflow2["name"] = "Service Workflow"

        client.post("/api/workflows/", json=workflow1, headers=auth_headers)
        client.post("/api/workflows/", json=workflow2, headers=auth_headers)

        # Filter by name
        response = client.get("/api/workflows/?name_filter=Sales", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data["workflows"]) == 1
        assert data["workflows"][0]["name"] == "Sales Workflow"

    def test_get_workflow_by_id(self, auth_headers, sample_workflow_data):
        """Test getting specific workflow by ID."""
        # Create workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        workflow_id = create_response.json()["id"]

        # Get workflow by ID
        response = client.get(f"/api/workflows/{workflow_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == workflow_id
        assert data["name"] == sample_workflow_data["name"]

    def test_get_workflow_not_found(self, auth_headers):
        """Test getting non-existent workflow."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/workflows/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_get_workflow_without_auth(self, sample_workflow_data):
        """Test getting workflow without authentication."""
        fake_id = str(uuid.uuid4())
        response = client.get(f"/api/workflows/{fake_id}")
        assert response.status_code == 401


class TestWorkflowUpdate:
    """Test workflow update endpoint."""

    def test_update_workflow_success(self, auth_headers, sample_workflow_data):
        """Test successful workflow update."""
        # Create workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        workflow_id = create_response.json()["id"]

        # Update workflow
        update_data = {"name": "Updated Workflow", "description": "Updated description"}
        response = client.put(
            f"/api/workflows/{workflow_id}", json=update_data, headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Workflow"
        assert data["description"] == "Updated description"
        assert data["id"] == workflow_id

    def test_update_workflow_not_found(self, auth_headers):
        """Test updating non-existent workflow."""
        fake_id = str(uuid.uuid4())
        update_data = {"name": "Updated Name"}
        response = client.put(
            f"/api/workflows/{fake_id}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 404

    def test_update_workflow_duplicate_name(self, auth_headers, sample_workflow_data):
        """Test updating workflow with duplicate name."""
        # Create two workflows
        workflow1_data = sample_workflow_data.copy()
        workflow1_data["name"] = "Workflow 1"
        workflow2_data = sample_workflow_data.copy()
        workflow2_data["name"] = "Workflow 2"

        response1 = client.post(
            "/api/workflows/", json=workflow1_data, headers=auth_headers
        )
        response2 = client.post(
            "/api/workflows/", json=workflow2_data, headers=auth_headers
        )

        workflow2_id = response2.json()["id"]

        # Try to update workflow2 with workflow1's name
        update_data = {"name": "Workflow 1"}
        response = client.put(
            f"/api/workflows/{workflow2_id}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]


class TestWorkflowDeletion:
    """Test workflow deletion endpoint."""

    def test_delete_workflow_success(self, auth_headers, sample_workflow_data):
        """Test successful workflow deletion."""
        # Create workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        workflow_id = create_response.json()["id"]

        # Delete workflow
        response = client.delete(f"/api/workflows/{workflow_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify workflow is soft deleted (not accessible)
        get_response = client.get(f"/api/workflows/{workflow_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_workflow_not_found(self, auth_headers):
        """Test deleting non-existent workflow."""
        fake_id = str(uuid.uuid4())
        response = client.delete(f"/api/workflows/{fake_id}", headers=auth_headers)
        assert response.status_code == 404


class TestWorkflowDuplication:
    """Test workflow duplication endpoint."""

    def test_duplicate_workflow_success(self, auth_headers, sample_workflow_data):
        """Test successful workflow duplication."""
        # Create original workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        original_id = create_response.json()["id"]

        # Duplicate workflow
        response = client.post(
            f"/api/workflows/{original_id}/duplicate", headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Workflow (Copy)"
        assert data["description"] == "Copy of Test Workflow"
        assert data["definition"] == sample_workflow_data["definition"]
        assert data["id"] != original_id

    def test_duplicate_workflow_multiple_copies(
        self, auth_headers, sample_workflow_data
    ):
        """Test creating multiple duplicates with unique names."""
        # Create original workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=auth_headers
        )
        original_id = create_response.json()["id"]

        # Create first duplicate
        response1 = client.post(
            f"/api/workflows/{original_id}/duplicate", headers=auth_headers
        )
        assert response1.status_code == 201
        assert response1.json()["name"] == "Test Workflow (Copy)"

        # Create second duplicate
        response2 = client.post(
            f"/api/workflows/{original_id}/duplicate", headers=auth_headers
        )
        assert response2.status_code == 201
        assert response2.json()["name"] == "Test Workflow (Copy) 2"

    def test_duplicate_workflow_not_found(self, auth_headers):
        """Test duplicating non-existent workflow."""
        fake_id = str(uuid.uuid4())
        response = client.post(
            f"/api/workflows/{fake_id}/duplicate", headers=auth_headers
        )
        assert response.status_code == 404


class TestWorkflowAccessControl:
    """Test workflow access control and user isolation."""

    def test_user_isolation(self, db_session: Session, sample_workflow_data):
        """Test that users can only access their own workflows."""
        # Create two users
        user1 = User(
            email="user1@example.com",
            name="User 1",
            hashed_password=get_password_hash("password1"),
        )
        user2 = User(
            email="user2@example.com",
            name="User 2",
            hashed_password=get_password_hash("password2"),
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Get auth headers for both users
        login1 = client.post(
            "/api/auth/login",
            json={"email": "user1@example.com", "password": "password1"},
        )
        login2 = client.post(
            "/api/auth/login",
            json={"email": "user2@example.com", "password": "password2"},
        )

        headers1 = {"Authorization": f"Bearer {login1.json()['access_token']}"}
        headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        # User 1 creates a workflow
        create_response = client.post(
            "/api/workflows/", json=sample_workflow_data, headers=headers1
        )
        workflow_id = create_response.json()["id"]

        # User 2 should not be able to access User 1's workflow
        response = client.get(f"/api/workflows/{workflow_id}", headers=headers2)
        assert response.status_code == 404

        # User 2 should not see User 1's workflow in their list
        list_response = client.get("/api/workflows/", headers=headers2)
        assert list_response.status_code == 200
        assert len(list_response.json()["workflows"]) == 0
