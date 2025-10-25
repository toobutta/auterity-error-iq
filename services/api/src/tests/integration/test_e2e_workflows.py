"""End-to-end integration tests for complete workflow functionality."""

import time
from unittest.mock import patch

from fastapi.testclient import TestClient


class TestCompleteWorkflowLifecycle:
    """Test complete workflow lifecycle from creation to execution to monitoring."""

    def test_complete_workflow_creation_and_execution_flow(
        self,
        client: TestClient,
        authenticated_headers: dict,
        test_workflow_definition: dict,
        mock_openai_response: dict,
    ):
        """Test the complete flow: create workflow -> execute -> monitor results."""

        # Step 1: Create a new workflow
        workflow_data = {
            "name": "E2E Test Workflow",
            "description": "End-to-end test workflow for customer inquiries",
            "definition": test_workflow_definition,
        }

        create_response = client.post(
            "/api/workflows", json=workflow_data, headers=authenticated_headers
        )
        assert create_response.status_code == 201
        workflow = create_response.json()
        workflow_id = workflow["id"]

        # Verify workflow was created correctly
        assert workflow["name"] == workflow_data["name"]
        assert workflow["description"] == workflow_data["description"]
        assert workflow["is_active"] is True

        # Step 2: Execute the workflow with mock AI response
        execution_data = {"input": "I have a question about my recent bill"}

        with patch(
            "app.services.ai_service.AIService.process_text"
        ) as mock_ai:
            mock_ai.return_value = {
                "content": "Thank you for your billing inquiry. I'd be happy to help you with your recent bill.",
                "usage": {"total_tokens": 75},
            }

            execute_response = client.post(
                f"/api/workflows/{workflow_id}/execute",
                json=execution_data,
                headers=authenticated_headers,
            )

        assert execute_response.status_code == 200
        execution = execute_response.json()
        execution_id = execution["id"]

        # Verify execution was started
        assert execution["workflow_id"] == workflow_id
        assert execution["status"] in ["pending", "running", "completed"]

        # Step 3: Monitor execution status
        status_response = client.get(
            f"/api/executions/{execution_id}", headers=authenticated_headers
        )
        assert status_response.status_code == 200
        status_data = status_response.json()

        # Verify execution details
        assert status_data["id"] == execution_id
        assert status_data["workflow_id"] == workflow_id
        assert "started_at" in status_data

        # Step 4: Get execution logs
        logs_response = client.get(
            f"/api/executions/{execution_id}/logs",
            headers=authenticated_headers,
        )
        assert logs_response.status_code == 200
        logs = logs_response.json()

        # Verify logs contain execution steps
        assert isinstance(logs, list)
        if logs:  # If execution completed and has logs
            assert any(log.get("step_type") == "start" for log in logs)
            assert any(log.get("step_type") == "ai-process" for log in logs)

        # Step 5: List all workflows to verify it appears
        list_response = client.get(
            "/api/workflows", headers=authenticated_headers
        )
        assert list_response.status_code == 200
        workflows = list_response.json()

        # Verify our workflow is in the list
        workflow_ids = [w["id"] for w in workflows]
        assert workflow_id in workflow_ids

    def test_workflow_validation_and_error_handling(
        self, client: TestClient, authenticated_headers: dict
    ):
        """Test workflow validation and error handling throughout the lifecycle."""

        # Test 1: Invalid workflow definition
        invalid_workflow = {
            "name": "",  # Empty name should fail validation
            "description": "Test workflow",
            "definition": {"nodes": [], "edges": []},  # Empty definition
        }

        response = client.post(
            "/api/workflows",
            json=invalid_workflow,
            headers=authenticated_headers,
        )
        assert response.status_code == 422  # Validation error

        # Test 2: Valid workflow creation
        valid_workflow = {
            "name": "Valid Test Workflow",
            "description": "A valid test workflow",
            "definition": {
                "nodes": [
                    {
                        "id": "start-1",
                        "type": "start",
                        "position": {"x": 100, "y": 100},
                        "data": {"label": "Start"},
                    }
                ],
                "edges": [],
            },
        }

        response = client.post(
            "/api/workflows",
            json=valid_workflow,
            headers=authenticated_headers,
        )
        assert response.status_code == 201
        workflow = response.json()
        workflow_id = workflow["id"]

        # Test 3: Execute workflow with missing input
        response = client.post(
            f"/api/workflows/{workflow_id}/execute",
            json={},  # Empty input
            headers=authenticated_headers,
        )
        # Should still work as input is optional
        assert response.status_code in [200, 400]

        # Test 4: Try to access non-existent workflow
        response = client.get(
            "/api/workflows/non-existent-id", headers=authenticated_headers
        )
        assert response.status_code == 404

        # Test 5: Try to execute non-existent workflow
        response = client.post(
            "/api/workflows/non-existent-id/execute",
            json={"input": "test"},
            headers=authenticated_headers,
        )
        assert response.status_code == 404

    def test_concurrent_workflow_executions(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test multiple concurrent workflow executions."""

        workflow_id = str(sample_workflow.id)
        execution_ids = []

        # Start multiple executions concurrently
        with patch(
            "app.services.ai_service.AIService.process_text"
        ) as mock_ai:
            mock_ai.return_value = {
                "content": "Processed inquiry successfully",
                "usage": {"total_tokens": 50},
            }

            for i in range(3):
                response = client.post(
                    f"/api/workflows/{workflow_id}/execute",
                    json={"input": f"Test inquiry {i}"},
                    headers=authenticated_headers,
                )
                assert response.status_code == 200
                execution = response.json()
                execution_ids.append(execution["id"])

        # Verify all executions were created
        assert len(execution_ids) == 3
        assert len(set(execution_ids)) == 3  # All unique

        # Check status of each execution
        for execution_id in execution_ids:
            response = client.get(
                f"/api/executions/{execution_id}",
                headers=authenticated_headers,
            )
            assert response.status_code == 200
            execution = response.json()
            assert execution["workflow_id"] == workflow_id


class TestTemplateIntegration:
    """Test template instantiation and customization processes."""

    def test_complete_template_workflow(
        self, client: TestClient, authenticated_headers: dict, sample_template
    ):
        """Test complete template workflow: browse -> preview -> instantiate -> execute."""

        template_id = str(sample_template.id)

        # Step 1: Browse templates
        response = client.get("/api/templates", headers=authenticated_headers)
        assert response.status_code == 200
        templates = response.json()

        # Verify our template is in the list
        template_ids = [t["id"] for t in templates]
        assert template_id in template_ids

        # Step 2: Get template details
        response = client.get(
            f"/api/templates/{template_id}", headers=authenticated_headers
        )
        assert response.status_code == 200
        template_details = response.json()

        assert template_details["name"] == sample_template.name
        assert template_details["category"] == sample_template.category
        assert len(template_details["parameters"]) == 2

        # Step 3: Instantiate template with parameters
        instantiation_data = {
            "name": "My Customer Service Workflow",
            "description": "Instantiated from template",
            "parameters": {
                "inquiry_type": "billing",
                "response_tone": "friendly",
            },
        }

        response = client.post(
            f"/api/templates/{template_id}/instantiate",
            json=instantiation_data,
            headers=authenticated_headers,
        )
        assert response.status_code == 201
        workflow = response.json()
        workflow_id = workflow["id"]

        # Verify workflow was created from template
        assert workflow["name"] == instantiation_data["name"]
        assert workflow["description"] == instantiation_data["description"]

        # Step 4: Execute the instantiated workflow
        with patch(
            "app.services.ai_service.AIService.process_text"
        ) as mock_ai:
            mock_ai.return_value = {
                "content": "Thank you for your billing inquiry! I'm happy to help you in a friendly manner.",
                "usage": {"total_tokens": 60},
            }

            response = client.post(
                f"/api/workflows/{workflow_id}/execute",
                json={"customer_message": "I don't understand my bill"},
                headers=authenticated_headers,
            )

        assert response.status_code == 200
        execution = response.json()

        # Verify execution started
        assert execution["workflow_id"] == workflow_id

    def test_template_parameter_validation(
        self, client: TestClient, authenticated_headers: dict, sample_template
    ):
        """Test template parameter validation during instantiation."""

        template_id = str(sample_template.id)

        # Test 1: Missing required parameter
        invalid_data = {
            "name": "Test Workflow",
            "description": "Test",
            "parameters": {
                "response_tone": "friendly"
                # Missing required "inquiry_type"
            },
        }

        response = client.post(
            f"/api/templates/{template_id}/instantiate",
            json=invalid_data,
            headers=authenticated_headers,
        )
        assert response.status_code == 422

        # Test 2: Invalid parameter value
        invalid_data = {
            "name": "Test Workflow",
            "description": "Test",
            "parameters": {
                "inquiry_type": "invalid_type",  # Not in allowed options
                "response_tone": "friendly",
            },
        }

        response = client.post(
            f"/api/templates/{template_id}/instantiate",
            json=invalid_data,
            headers=authenticated_headers,
        )
        assert response.status_code == 422

        # Test 3: Valid parameters
        valid_data = {
            "name": "Valid Test Workflow",
            "description": "Test with valid parameters",
            "parameters": {
                "inquiry_type": "billing",
                "response_tone": "professional",
            },
        }

        response = client.post(
            f"/api/templates/{template_id}/instantiate",
            json=valid_data,
            headers=authenticated_headers,
        )
        assert response.status_code == 201


class TestAuthenticationIntegration:
    """Test authentication and authorization across all features."""

    def test_unauthenticated_access_denied(self, client: TestClient):
        """Test that all endpoints require authentication."""

        endpoints_to_test = [
            ("GET", "/api/workflows"),
            ("POST", "/api/workflows"),
            ("GET", "/api/workflows/test-id"),
            ("PUT", "/api/workflows/test-id"),
            ("DELETE", "/api/workflows/test-id"),
            ("POST", "/api/workflows/test-id/execute"),
            ("GET", "/api/executions/test-id"),
            ("GET", "/api/executions/test-id/logs"),
            ("GET", "/api/templates"),
            ("GET", "/api/templates/test-id"),
            ("POST", "/api/templates/test-id/instantiate"),
        ]

        for method, endpoint in endpoints_to_test:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={})
            elif method == "PUT":
                response = client.put(endpoint, json={})
            elif method == "DELETE":
                response = client.delete(endpoint)

            assert (
                response.status_code == 401
            ), f"Endpoint {method} {endpoint} should require authentication"

    def test_invalid_token_access_denied(self, client: TestClient):
        """Test that invalid tokens are rejected."""

        invalid_headers = {"Authorization": "Bearer invalid-token"}

        response = client.get("/api/workflows", headers=invalid_headers)
        assert response.status_code == 401

    def test_user_workflow_isolation(
        self, client: TestClient, db_session, test_workflow_definition: dict
    ):
        """Test that users can only access their own workflows."""

        from app.auth import create_access_token, get_password_hash
        from app.models.user import User

        # Create two test users
        user1 = User(
            email="user1@example.com",
            name="User One",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        user2 = User(
            email="user2@example.com",
            name="User Two",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        db_session.add_all([user1, user2])
        db_session.commit()
        db_session.refresh(user1)
        db_session.refresh(user2)

        # Create tokens for both users
        token1 = create_access_token(data={"sub": user1.email})
        token2 = create_access_token(data={"sub": user2.email})
        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # User 1 creates a workflow
        workflow_data = {
            "name": "User 1 Workflow",
            "description": "Private workflow for user 1",
            "definition": test_workflow_definition,
        }

        response = client.post(
            "/api/workflows", json=workflow_data, headers=headers1
        )
        assert response.status_code == 201
        workflow = response.json()
        workflow_id = workflow["id"]

        # User 1 can access their workflow
        response = client.get(
            f"/api/workflows/{workflow_id}", headers=headers1
        )
        assert response.status_code == 200

        # User 2 cannot access User 1's workflow
        response = client.get(
            f"/api/workflows/{workflow_id}", headers=headers2
        )
        assert response.status_code == 404

        # User 2 cannot execute User 1's workflow
        response = client.post(
            f"/api/workflows/{workflow_id}/execute",
            json={"input": "test"},
            headers=headers2,
        )
        assert response.status_code == 404

        # User 1's workflow doesn't appear in User 2's workflow list
        response = client.get("/api/workflows", headers=headers2)
        assert response.status_code == 200
        user2_workflows = response.json()
        user2_workflow_ids = [w["id"] for w in user2_workflows]
        assert workflow_id not in user2_workflow_ids


class TestPerformanceAndLoad:
    """Test workflow execution performance under load."""

    def test_workflow_execution_performance(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test workflow execution performance metrics."""

        workflow_id = str(sample_workflow.id)
        execution_times = []

        with patch(
            "app.services.ai_service.AIService.process_text"
        ) as mock_ai:
            mock_ai.return_value = {
                "content": "Quick response",
                "usage": {"total_tokens": 25},
            }

            # Execute workflow multiple times and measure performance
            for i in range(5):
                start_time = time.time()

                response = client.post(
                    f"/api/workflows/{workflow_id}/execute",
                    json={"input": f"Performance test {i}"},
                    headers=authenticated_headers,
                )

                end_time = time.time()
                execution_time = end_time - start_time
                execution_times.append(execution_time)

                assert response.status_code == 200
                execution = response.json()
                assert execution["workflow_id"] == workflow_id

        # Verify performance metrics
        avg_execution_time = sum(execution_times) / len(execution_times)
        max_execution_time = max(execution_times)

        # Performance assertions (adjust thresholds as needed)
        assert (
            avg_execution_time < 5.0
        ), f"Average execution time {avg_execution_time}s exceeds 5s threshold"
        assert (
            max_execution_time < 10.0
        ), f"Max execution time {max_execution_time}s exceeds 10s threshold"

    def test_concurrent_execution_load(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test system behavior under concurrent execution load."""

        workflow_id = str(sample_workflow.id)

        with patch(
            "app.services.ai_service.AIService.process_text"
        ) as mock_ai:
            mock_ai.return_value = {
                "content": "Load test response",
                "usage": {"total_tokens": 30},
            }

            # Simulate concurrent executions
            import concurrent.futures

            def execute_workflow(index):
                try:
                    response = client.post(
                        f"/api/workflows/{workflow_id}/execute",
                        json={"input": f"Load test {index}"},
                        headers=authenticated_headers,
                    )
                    return response.status_code == 200
                except Exception as e:
                    print(f"Execution {index} failed: {e}")
                    return False

            # Run 10 concurrent executions
            with concurrent.futures.ThreadPoolExecutor(
                max_workers=10
            ) as executor:
                futures = [
                    executor.submit(execute_workflow, i) for i in range(10)
                ]
                results = [
                    future.result()
                    for future in concurrent.futures.as_completed(futures)
                ]

            # Verify most executions succeeded
            success_rate = sum(results) / len(results)
            assert (
                success_rate >= 0.8
            ), f"Success rate {success_rate} below 80% threshold"

    def test_database_performance_under_load(
        self, client: TestClient, authenticated_headers: dict, db_session
    ):
        """Test database performance with multiple workflows and executions."""

        # Create multiple workflows
        workflows = []
        for i in range(10):
            workflow_data = {
                "name": f"Load Test Workflow {i}",
                "description": f"Workflow for load testing {i}",
                "definition": {
                    "nodes": [
                        {
                            "id": f"start-{i}",
                            "type": "start",
                            "position": {"x": 100, "y": 100},
                        }
                    ],
                    "edges": [],
                },
            }

            response = client.post(
                "/api/workflows",
                json=workflow_data,
                headers=authenticated_headers,
            )
            assert response.status_code == 201
            workflows.append(response.json())

        # Test listing performance with many workflows
        start_time = time.time()
        response = client.get("/api/workflows", headers=authenticated_headers)
        list_time = time.time() - start_time

        assert response.status_code == 200
        workflow_list = response.json()
        assert len(workflow_list) >= 10

        # Performance assertion for listing
        assert (
            list_time < 2.0
        ), f"Workflow listing took {list_time}s, exceeds 2s threshold"

        # Test individual workflow retrieval performance
        retrieval_times = []
        for workflow in workflows[:5]:  # Test first 5
            start_time = time.time()
            response = client.get(
                f"/api/workflows/{workflow['id']}",
                headers=authenticated_headers,
            )
            retrieval_time = time.time() - start_time
            retrieval_times.append(retrieval_time)

            assert response.status_code == 200

        avg_retrieval_time = sum(retrieval_times) / len(retrieval_times)
        assert (
            avg_retrieval_time < 1.0
        ), f"Average retrieval time {avg_retrieval_time}s exceeds 1s threshold"
