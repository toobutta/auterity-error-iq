"""Performance and load testing for workflow execution."""

import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch

from fastapi.testclient import TestClient


class TestWorkflowPerformance:
    """Performance tests for workflow execution under various load conditions."""

    def test_single_workflow_execution_performance(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test performance of single workflow execution."""

        workflow_id = str(sample_workflow.id)
        execution_times = []

        with patch("app.services.ai_service.AIService.process_text") as mock_ai:
            mock_ai.return_value = {
                "content": "Performance test response",
                "usage": {"total_tokens": 50},
            }

            # Run multiple executions to get average performance
            for i in range(10):
                start_time = time.perf_counter()

                response = client.post(
                    f"/api/workflows/{workflow_id}/execute",
                    json={"input": f"Performance test execution {i}"},
                    headers=authenticated_headers,
                )

                end_time = time.perf_counter()
                execution_time = end_time - start_time
                execution_times.append(execution_time)

                assert response.status_code == 200
                execution = response.json()
                assert execution["workflow_id"] == workflow_id

        # Calculate performance metrics
        avg_time = statistics.mean(execution_times)
        median_time = statistics.median(execution_times)
        max_time = max(execution_times)
        min_time = min(execution_times)
        std_dev = statistics.stdev(execution_times) if len(execution_times) > 1 else 0

        # Performance assertions (adjust based on requirements)
        assert (
            avg_time < 2.0
        ), f"Average execution time {avg_time:.3f}s exceeds 2s threshold"
        assert (
            max_time < 5.0
        ), f"Maximum execution time {max_time:.3f}s exceeds 5s threshold"
        assert (
            std_dev < 1.0
        ), f"Standard deviation {std_dev:.3f}s indicates inconsistent performance"

        # Log performance metrics for monitoring
        print(f"\nPerformance Metrics:")
        print(f"  Average: {avg_time:.3f}s")
        print(f"  Median:  {median_time:.3f}s")
        print(f"  Min:     {min_time:.3f}s")
        print(f"  Max:     {max_time:.3f}s")
        print(f"  Std Dev: {std_dev:.3f}s")

    def test_concurrent_workflow_execution_load(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test system performance under concurrent workflow execution load."""

        workflow_id = str(sample_workflow.id)
        num_concurrent = 20

        with patch("app.services.ai_service.AIService.process_text") as mock_ai:
            mock_ai.return_value = {
                "content": "Concurrent load test response",
                "usage": {"total_tokens": 40},
            }

            def execute_workflow(execution_index):
                """Execute a single workflow and return timing data."""
                start_time = time.perf_counter()
                try:
                    response = client.post(
                        f"/api/workflows/{workflow_id}/execute",
                        json={"input": f"Concurrent test {execution_index}"},
                        headers=authenticated_headers,
                    )
                    end_time = time.perf_counter()

                    return {
                        "success": response.status_code == 200,
                        "execution_time": end_time - start_time,
                        "status_code": response.status_code,
                        "execution_id": (
                            response.json().get("id")
                            if response.status_code == 200
                            else None
                        ),
                    }
                except Exception as e:
                    end_time = time.perf_counter()
                    return {
                        "success": False,
                        "execution_time": end_time - start_time,
                        "error": str(e),
                        "execution_id": None,
                    }

            # Execute workflows concurrently
            start_time = time.perf_counter()

            with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
                futures = [
                    executor.submit(execute_workflow, i) for i in range(num_concurrent)
                ]
                results = [future.result() for future in as_completed(futures)]

            total_time = time.perf_counter() - start_time

            # Analyze results
            successful_executions = [r for r in results if r["success"]]
            failed_executions = [r for r in results if not r["success"]]

            success_rate = len(successful_executions) / len(results)
            avg_execution_time = statistics.mean(
                [r["execution_time"] for r in successful_executions]
            )
            throughput = len(successful_executions) / total_time

            # Performance assertions
            assert (
                success_rate >= 0.90
            ), f"Success rate {success_rate:.2%} below 90% threshold"
            assert (
                avg_execution_time < 3.0
            ), f"Average execution time {avg_execution_time:.3f}s exceeds 3s under load"
            assert (
                throughput >= 5.0
            ), f"Throughput {throughput:.2f} executions/sec below 5/sec threshold"

            # Log load test metrics
            print(f"\nConcurrent Load Test Results:")
            print(f"  Total executions: {len(results)}")
            print(f"  Successful: {len(successful_executions)}")
            print(f"  Failed: {len(failed_executions)}")
            print(f"  Success rate: {success_rate:.2%}")
            print(f"  Total time: {total_time:.3f}s")
            print(f"  Average execution time: {avg_execution_time:.3f}s")
            print(f"  Throughput: {throughput:.2f} executions/sec")

    def test_database_performance_under_load(
        self, client: TestClient, authenticated_headers: dict, db_session
    ):
        """Test database performance with high volume of workflows and executions."""

        # Create multiple workflows for testing
        workflow_ids = []

        for i in range(50):
            workflow_data = {
                "name": f"Load Test Workflow {i}",
                "description": f"Workflow {i} for database load testing",
                "definition": {
                    "nodes": [
                        {
                            "id": f"start-{i}",
                            "type": "start",
                            "position": {"x": 100, "y": 100},
                            "data": {"label": "Start"},
                        }
                    ],
                    "edges": [],
                },
            }

            response = client.post(
                "/api/workflows", json=workflow_data, headers=authenticated_headers
            )
            assert response.status_code == 201
            workflow_ids.append(response.json()["id"])

        # Test workflow listing performance
        start_time = time.perf_counter()
        response = client.get("/api/workflows", headers=authenticated_headers)
        list_time = time.perf_counter() - start_time

        assert response.status_code == 200
        workflows = response.json()
        assert len(workflows) >= 50

        # Test individual workflow retrieval performance
        retrieval_times = []
        for workflow_id in workflow_ids[:10]:  # Test first 10
            start_time = time.perf_counter()
            response = client.get(
                f"/api/workflows/{workflow_id}", headers=authenticated_headers
            )
            retrieval_time = time.perf_counter() - start_time
            retrieval_times.append(retrieval_time)

            assert response.status_code == 200

        avg_retrieval_time = statistics.mean(retrieval_times)

        # Performance assertions
        assert (
            list_time < 2.0
        ), f"Workflow listing took {list_time:.3f}s, exceeds 2s threshold"
        assert (
            avg_retrieval_time < 0.5
        ), f"Average retrieval time {avg_retrieval_time:.3f}s exceeds 0.5s threshold"

        print(f"\nDatabase Performance Results:")
        print(f"  Workflow listing time: {list_time:.3f}s")
        print(f"  Average retrieval time: {avg_retrieval_time:.3f}s")
        print(f"  Total workflows tested: {len(workflow_ids)}")

    def test_memory_usage_under_load(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test memory usage during intensive workflow operations."""

        import os

        import psutil

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        workflow_id = str(sample_workflow.id)

        with patch("app.services.ai_service.AIService.process_text") as mock_ai:
            mock_ai.return_value = {
                "content": "Memory test response",
                "usage": {"total_tokens": 30},
            }

            # Execute many workflows to test memory usage
            for i in range(100):
                response = client.post(
                    f"/api/workflows/{workflow_id}/execute",
                    json={"input": f"Memory test {i}"},
                    headers=authenticated_headers,
                )
                assert response.status_code == 200

                # Check memory every 10 executions
                if i % 10 == 0:
                    current_memory = process.memory_info().rss / 1024 / 1024  # MB
                    memory_increase = current_memory - initial_memory

                    # Memory should not increase excessively
                    assert (
                        memory_increase < 100
                    ), f"Memory usage increased by {memory_increase:.2f}MB after {i} executions"

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        total_memory_increase = final_memory - initial_memory

        print(f"\nMemory Usage Results:")
        print(f"  Initial memory: {initial_memory:.2f}MB")
        print(f"  Final memory: {final_memory:.2f}MB")
        print(f"  Total increase: {total_memory_increase:.2f}MB")

        # Final memory assertion
        assert (
            total_memory_increase < 50
        ), f"Total memory increase {total_memory_increase:.2f}MB exceeds 50MB threshold"

    def test_api_response_time_consistency(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test API response time consistency across different endpoints."""

        workflow_id = str(sample_workflow.id)

        # Test different API endpoints
        endpoints_to_test = [
            ("GET", "/api/workflows", {}),
            ("GET", f"/api/workflows/{workflow_id}", {}),
            ("GET", "/api/templates", {}),
        ]

        endpoint_performance = {}

        for method, endpoint, data in endpoints_to_test:
            response_times = []

            for i in range(20):  # Test each endpoint 20 times
                start_time = time.perf_counter()

                if method == "GET":
                    response = client.get(endpoint, headers=authenticated_headers)
                elif method == "POST":
                    response = client.post(
                        endpoint, json=data, headers=authenticated_headers
                    )

                end_time = time.perf_counter()
                response_time = end_time - start_time
                response_times.append(response_time)

                assert response.status_code in [200, 201]

            # Calculate statistics for this endpoint
            avg_time = statistics.mean(response_times)
            median_time = statistics.median(response_times)
            std_dev = statistics.stdev(response_times) if len(response_times) > 1 else 0

            endpoint_performance[endpoint] = {
                "average": avg_time,
                "median": median_time,
                "std_dev": std_dev,
                "max": max(response_times),
                "min": min(response_times),
            }

            # Performance assertions per endpoint
            assert (
                avg_time < 1.0
            ), f"Average response time for {endpoint} is {avg_time:.3f}s, exceeds 1s"
            assert (
                std_dev < 0.5
            ), f"Response time std dev for {endpoint} is {std_dev:.3f}s, indicates inconsistency"

        # Log performance results
        print(f"\nAPI Response Time Consistency Results:")
        for endpoint, metrics in endpoint_performance.items():
            print(f"  {endpoint}:")
            print(f"    Average: {metrics['average']:.3f}s")
            print(f"    Median:  {metrics['median']:.3f}s")
            print(f"    Std Dev: {metrics['std_dev']:.3f}s")
            print(f"    Range:   {metrics['min']:.3f}s - {metrics['max']:.3f}s")


class TestScalabilityLimits:
    """Test system behavior at scalability limits."""

    def test_maximum_concurrent_executions(
        self, client: TestClient, authenticated_headers: dict, sample_workflow
    ):
        """Test system behavior with maximum concurrent executions."""

        workflow_id = str(sample_workflow.id)
        max_concurrent = 50  # Adjust based on system capabilities

        with patch("app.services.ai_service.AIService.process_text") as mock_ai:
            mock_ai.return_value = {
                "content": "Max concurrency test",
                "usage": {"total_tokens": 25},
            }

            def execute_workflow(index):
                try:
                    response = client.post(
                        f"/api/workflows/{workflow_id}/execute",
                        json={"input": f"Max concurrency test {index}"},
                        headers=authenticated_headers,
                        timeout=30,  # Longer timeout for high load
                    )
                    return {
                        "success": response.status_code == 200,
                        "status_code": response.status_code,
                        "index": index,
                    }
                except Exception as e:
                    return {"success": False, "error": str(e), "index": index}

            # Execute maximum concurrent workflows
            with ThreadPoolExecutor(max_workers=max_concurrent) as executor:
                futures = [
                    executor.submit(execute_workflow, i) for i in range(max_concurrent)
                ]
                results = [future.result() for future in as_completed(futures)]

            successful = [r for r in results if r["success"]]
            failed = [r for r in results if not r["success"]]

            success_rate = len(successful) / len(results)

            # At maximum load, we expect some degradation but not complete failure
            assert (
                success_rate >= 0.70
            ), f"Success rate {success_rate:.2%} below 70% at maximum load"

            print(f"\nMaximum Concurrency Test Results:")
            print(f"  Total executions: {len(results)}")
            print(f"  Successful: {len(successful)}")
            print(f"  Failed: {len(failed)}")
            print(f"  Success rate: {success_rate:.2%}")

    def test_large_workflow_definition_handling(
        self, client: TestClient, authenticated_headers: dict
    ):
        """Test handling of large workflow definitions."""

        # Create a large workflow definition with many nodes
        large_definition = {"nodes": [], "edges": []}

        # Add 100 nodes
        for i in range(100):
            large_definition["nodes"].append(
                {
                    "id": f"node-{i}",
                    "type": "ai-process" if i % 2 == 0 else "start",
                    "position": {"x": (i % 10) * 100, "y": (i // 10) * 100},
                    "data": {
                        "label": f"Node {i}",
                        "prompt": (
                            f"Process step {i} with input: {{input}}"
                            if i % 2 == 0
                            else "Start"
                        ),
                    },
                }
            )

        # Add edges to connect nodes
        for i in range(99):
            large_definition["edges"].append(
                {"id": f"edge-{i}", "source": f"node-{i}", "target": f"node-{i+1}"}
            )

        # Test creating workflow with large definition
        workflow_data = {
            "name": "Large Workflow Test",
            "description": "Testing large workflow definition handling",
            "definition": large_definition,
        }

        start_time = time.perf_counter()
        response = client.post(
            "/api/workflows", json=workflow_data, headers=authenticated_headers
        )
        creation_time = time.perf_counter() - start_time

        assert response.status_code == 201
        workflow = response.json()

        # Test retrieving large workflow
        start_time = time.perf_counter()
        response = client.get(
            f"/api/workflows/{workflow['id']}", headers=authenticated_headers
        )
        retrieval_time = time.perf_counter() - start_time

        assert response.status_code == 200
        retrieved_workflow = response.json()
        assert len(retrieved_workflow["definition"]["nodes"]) == 100

        # Performance assertions for large workflows
        assert (
            creation_time < 5.0
        ), f"Large workflow creation took {creation_time:.3f}s, exceeds 5s"
        assert (
            retrieval_time < 2.0
        ), f"Large workflow retrieval took {retrieval_time:.3f}s, exceeds 2s"

        print(f"\nLarge Workflow Handling Results:")
        print(f"  Nodes: {len(large_definition['nodes'])}")
        print(f"  Edges: {len(large_definition['edges'])}")
        print(f"  Creation time: {creation_time:.3f}s")
        print(f"  Retrieval time: {retrieval_time:.3f}s")
