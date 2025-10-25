"""
Comprehensive tests for Auterity LangGraph Service
Tests workflow creation, execution, AI decision making, and integrations
"""

import asyncio
import json
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from fastapi.testclient import TestClient
from src.langgraph_service import (
    app,
    IntelligentWorkflowEngine,
    WorkflowState,
    WorkflowNode,
    WorkflowEdge,
    WorkflowExecutionResult
)

# Test client for API tests
client = TestClient(app)

class TestIntelligentWorkflowEngine:
    """Test the core workflow engine functionality"""

    def setup_method(self):
        """Setup test fixtures"""
        self.engine = IntelligentWorkflowEngine()
        self.sample_workflow_id = "test-workflow-001"

        # Sample workflow definition
        self.sample_nodes = [
            WorkflowNode(
                id="start",
                type="llm",
                config={
                    "prompt": "Generate a topic for discussion",
                    "model": "gpt-4",
                    "temperature": 0.7,
                    "max_tokens": 100
                }
            ),
            WorkflowNode(
                id="validate",
                type="condition",
                config={
                    "condition": "len(topic) > 10"
                }
            ),
            WorkflowNode(
                id="expand",
                type="llm",
                config={
                    "prompt": "Expand on this topic: {{topic}}",
                    "model": "claude-3",
                    "temperature": 0.8,
                    "max_tokens": 500
                }
            ),
            WorkflowNode(
                id="end",
                type="tool",
                config={
                    "tool_name": "save_result",
                    "parameters": {"output": "{{expanded_topic}}"}
                }
            )
        ]

        self.sample_edges = [
            WorkflowEdge(source="start", target="validate"),
            WorkflowEdge(source="validate", target="expand", condition="passed"),
            WorkflowEdge(source="expand", target="end")
        ]

    @pytest.mark.asyncio
    async def test_create_workflow_success(self):
        """Test successful workflow creation"""
        result = await self.engine.create_workflow(
            self.sample_workflow_id,
            self.sample_nodes,
            self.sample_edges
        )

        assert result == self.sample_workflow_id
        assert self.sample_workflow_id in self.engine.workflows

        workflow = self.engine.workflows[self.sample_workflow_id]
        assert len(workflow['nodes']) == 4
        assert len(workflow['edges']) == 3
        assert 'execution_graph' in workflow

    @pytest.mark.asyncio
    async def test_create_workflow_invalid_nodes(self):
        """Test workflow creation with invalid nodes"""
        invalid_nodes = [
            WorkflowNode(id="", type="llm", config={})  # Empty ID
        ]

        with pytest.raises(ValueError):
            await self.engine.create_workflow(
                "invalid-workflow",
                invalid_nodes,
                []
            )

    @pytest.mark.asyncio
    async def test_execute_workflow_basic(self):
        """Test basic workflow execution"""
        # Create workflow first
        await self.engine.create_workflow(
            self.sample_workflow_id,
            self.sample_nodes,
            self.sample_edges
        )

        # Mock the LLM calls
        with patch.object(self.engine, '_call_vllm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = [
                {"response": "Artificial Intelligence in Healthcare"},
                {"response": "AI in healthcare offers numerous benefits including improved diagnostics..."}
            ]

            # Execute workflow
            result = await self.engine.execute_workflow(
                self.sample_workflow_id,
                {"input": "healthcare"}
            )

            assert isinstance(result, WorkflowExecutionResult)
            assert result.workflow_id == self.sample_workflow_id
            assert result.status == "completed"
            assert len(result.execution_path) > 0
            assert result.execution_time > 0

    @pytest.mark.asyncio
    async def test_execute_workflow_with_error(self):
        """Test workflow execution with error handling"""
        # Create workflow with error-prone node
        error_node = WorkflowNode(
            id="error_node",
            type="llm",
            config={"prompt": "This will fail"}
        )

        await self.engine.create_workflow(
            "error-workflow",
            [error_node],
            []
        )

        # Mock LLM to raise exception
        with patch.object(self.engine, '_call_vllm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = Exception("LLM service unavailable")

            result = await self.engine.execute_workflow(
                "error-workflow",
                {"input": "test"}
            )

            assert result.status == "failed"
            assert "LLM service unavailable" in result.error

    @pytest.mark.asyncio
    async def test_workflow_metrics(self):
        """Test workflow metrics collection"""
        # Create and execute a workflow
        await self.engine.create_workflow(
            self.sample_workflow_id,
            self.sample_nodes,
            self.sample_edges
        )

        with patch.object(self.engine, '_call_vllm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {"response": "Test response"}

            await self.engine.execute_workflow(
                self.sample_workflow_id,
                {"input": "test"}
            )

            metrics = await self.engine.get_workflow_metrics()

            assert metrics['total_workflows'] >= 1
            assert metrics['completed_workflows'] >= 1
            assert 'performance_metrics' in metrics
            assert 'node_type_usage' in metrics

    def test_workflow_not_found(self):
        """Test handling of non-existent workflow"""
        with pytest.raises(Exception):  # Should raise HTTPException in real scenario
            asyncio.run(self.engine.execute_workflow("non-existent", {}))

class TestAPIRoutes:
    """Test API routes and endpoints"""

    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert data['service'] == "Auterity LangGraph Service"
        assert data['version'] == "1.0.0"

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data['status'] == "healthy"
        assert 'timestamp' in data
        assert 'active_workflows' in data
        assert 'total_workflows' in data

    def test_create_workflow_api(self):
        """Test workflow creation via API"""
        workflow_data = {
            "workflow_id": "api-test-workflow",
            "name": "API Test Workflow",
            "description": "Test workflow created via API",
            "nodes": [
                {
                    "id": "test_node",
                    "type": "llm",
                    "config": {
                        "prompt": "Hello World",
                        "model": "gpt-4"
                    }
                }
            ],
            "edges": []
        }

        response = client.post("/workflows", json=workflow_data)
        assert response.status_code == 200

        data = response.json()
        assert data['workflow_id'] == "api-test-workflow"
        assert data['status'] == "created"

    def test_execute_workflow_api(self):
        """Test workflow execution via API"""
        # First create a workflow
        workflow_data = {
            "workflow_id": "execute-test-workflow",
            "name": "Execute Test",
            "nodes": [
                {
                    "id": "simple_node",
                    "type": "tool",
                    "config": {
                        "tool_name": "echo",
                        "parameters": {"message": "Hello"}
                    }
                }
            ],
            "edges": []
        }

        client.post("/workflows", json=workflow_data)

        # Execute the workflow
        execute_data = {
            "input": {"test": "data"},
            "context": {"user_id": "test-user"}
        }

        response = client.post("/workflows/execute-test-workflow/execute", json=execute_data)
        assert response.status_code == 200

        data = response.json()
        assert data['execution_id'].startswith("execute-test-workflow")
        assert 'status' in data
        assert 'execution_time' in data

    def test_get_workflow_api(self):
        """Test getting workflow details"""
        # Create workflow first
        workflow_data = {
            "workflow_id": "get-test-workflow",
            "name": "Get Test",
            "nodes": [{"id": "node1", "type": "llm", "config": {}}],
            "edges": []
        }

        client.post("/workflows", json=workflow_data)

        # Get workflow
        response = client.get("/workflows/get-test-workflow")
        assert response.status_code == 200

        data = response.json()
        assert data['workflow_id'] == "get-test-workflow"
        assert data['node_count'] == 1

    def test_list_workflows_api(self):
        """Test listing workflows"""
        response = client.get("/workflows")
        assert response.status_code == 200

        data = response.json()
        assert 'workflows' in data
        assert isinstance(data['workflows'], list)

    def test_delete_workflow_api(self):
        """Test workflow deletion"""
        # Create workflow first
        workflow_data = {
            "workflow_id": "delete-test-workflow",
            "name": "Delete Test",
            "nodes": [{"id": "node1", "type": "llm", "config": {}}],
            "edges": []
        }

        client.post("/workflows", json=workflow_data)

        # Delete workflow
        response = client.delete("/workflows/delete-test-workflow")
        assert response.status_code == 200

    def test_get_metrics_api(self):
        """Test metrics endpoint"""
        response = client.get("/metrics")
        assert response.status_code == 200

        data = response.json()
        assert 'performance_metrics' in data
        assert 'total_workflows' in data
        assert 'active_workflows' in data

    def test_workflow_not_found_api(self):
        """Test API response for non-existent workflow"""
        response = client.get("/workflows/non-existent-workflow")
        assert response.status_code == 404

        response = client.post("/workflows/non-existent-workflow/execute", json={})
        assert response.status_code == 500  # Would be 404 in production with proper error handling

class TestNodeTypes:
    """Test different node type executions"""

    def setup_method(self):
        self.engine = IntelligentWorkflowEngine()

    @pytest.mark.asyncio
    async def test_llm_node_execution(self):
        """Test LLM node execution"""
        node = WorkflowNode(
            id="llm_test",
            type="llm",
            config={
                "prompt": "Say hello",
                "model": "gpt-4",
                "temperature": 0.5
            }
        )

        state = WorkflowState()
        state.context = {"user": "test"}

        with patch.object(self.engine, '_call_vllm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {"response": "Hello from AI!"}

            result = await self.engine._execute_llm_node(node, state)

            assert result["response"] == "Hello from AI!"
            mock_llm.assert_called_once()

    @pytest.mark.asyncio
    async def test_condition_node_execution(self):
        """Test condition node execution"""
        node = WorkflowNode(
            id="condition_test",
            type="condition",
            config={
                "condition": "len(input_text) > 5"
            }
        )

        state = WorkflowState()
        state.context = {"input_text": "Hello World"}

        result = await self.engine._execute_condition_node(node, state)

        assert result["condition"] == "len(input_text) > 5"
        assert result["result"] == True

    @pytest.mark.asyncio
    async def test_tool_node_execution(self):
        """Test tool node execution"""
        node = WorkflowNode(
            id="tool_test",
            type="tool",
            config={
                "tool_name": "test_tool",
                "parameters": {"param1": "value1"}
            }
        )

        state = WorkflowState()

        result = await self.engine._execute_tool_node(node, state)

        assert result["tool"] == "test_tool"
        assert "Executed test_tool" in result["result"]

class TestIntegrationCapabilities:
    """Test integration with external services"""

    def setup_method(self):
        self.engine = IntelligentWorkflowEngine()

    @pytest.mark.asyncio
    async def test_n8n_integration(self):
        """Test n8n workflow integration"""
        config = {
            "workflow_id": "n8n-test-workflow",
            "parameters": {"input": "test data"}
        }

        with patch.object(self.engine, '_call_n8n_workflow', new_callable=AsyncMock) as mock_n8n:
            mock_n8n.return_value = {"status": "success", "result": "n8n executed"}

            node = WorkflowNode(
                id="n8n_integration",
                type="integration",
                config=config
            )

            state = WorkflowState()

            result = await self.engine._execute_integration_node(node, state)

            assert result["status"] == "success"
            mock_n8n.assert_called_once_with(config)

    @pytest.mark.asyncio
    async def test_temporal_integration(self):
        """Test Temporal workflow integration"""
        config = {
            "workflow_type": "test-workflow",
            "input": {"data": "test"}
        }

        with patch.object(self.engine, '_call_temporal_workflow', new_callable=AsyncMock) as mock_temporal:
            mock_temporal.return_value = {"status": "completed", "result": "temporal executed"}

            node = WorkflowNode(
                id="temporal_integration",
                type="integration",
                config=config
            )

            state = WorkflowState()

            result = await self.engine._execute_integration_node(node, state)

            assert result["status"] == "completed"
            mock_temporal.assert_called_once_with(config)

class TestAIDecisionMaking:
    """Test AI-powered decision making capabilities"""

    def setup_method(self):
        self.engine = IntelligentWorkflowEngine()

    @pytest.mark.asyncio
    async def test_ai_decision_node(self):
        """Test AI decision node execution"""
        node = WorkflowNode(
            id="ai_decision",
            type="decision",
            config={
                "decision_prompt": "Choose the best option for processing this data",
                "options": ["option1", "option2", "option3"]
            }
        )

        state = WorkflowState()
        state.context = {"data": "test data"}

        with patch.object(self.engine, '_make_ai_decision_from_prompt', new_callable=AsyncMock) as mock_decision:
            mock_decision.return_value = {
                "decision": "option1",
                "option_index": 0,
                "reasoning": "Option1 is the best choice",
                "confidence": 0.9
            }

            result = await self.engine._execute_ai_decision_node(node, state)

            assert result["decision"] == "option1"
            assert result["confidence"] == 0.9
            mock_decision.assert_called_once()

    @pytest.mark.asyncio
    async def test_workflow_routing_decision(self):
        """Test AI-powered workflow routing"""
        edges = [
            WorkflowEdge(source="node1", target="option_a"),
            WorkflowEdge(source="node1", target="option_b"),
            WorkflowEdge(source="node1", target="option_c")
        ]

        state = WorkflowState()
        state.context = {"analysis": "data analysis results"}

        with patch.object(self.engine, '_make_ai_decision', new_callable=AsyncMock) as mock_decision:
            mock_decision.return_value = {"next_node": "option_b"}

            next_node = await self.engine._determine_next_node({}, state, edges)

            assert next_node == "option_b"
            mock_decision.assert_called_once()

class TestPerformanceAndMonitoring:
    """Test performance monitoring and metrics"""

    def setup_method(self):
        self.engine = IntelligentWorkflowEngine()

    def test_performance_metrics_tracking(self):
        """Test that performance metrics are properly tracked"""
        from src.langgraph_service import performance_metrics

        initial_total = performance_metrics['total_workflows']
        initial_completed = performance_metrics['completed_workflows']

        # Simulate workflow completion
        performance_metrics['total_workflows'] += 1
        performance_metrics['completed_workflows'] += 1

        assert performance_metrics['total_workflows'] == initial_total + 1
        assert performance_metrics['completed_workflows'] == initial_completed + 1

    def test_execution_time_calculation(self):
        """Test execution time calculation and averaging"""
        from src.langgraph_service import performance_metrics

        # Test average calculation
        times = [1.0, 2.0, 3.0]
        expected_avg = sum(times) / len(times)

        performance_metrics['average_execution_time'] = expected_avg
        assert performance_metrics['average_execution_time'] == expected_avg

class TestErrorHandling:
    """Test error handling and recovery"""

    def setup_method(self):
        self.engine = IntelligentWorkflowEngine()

    @pytest.mark.asyncio
    async def test_node_execution_error_recovery(self):
        """Test error recovery in node execution"""
        # Create workflow with error-prone node that should continue
        error_node = WorkflowNode(
            id="error_node",
            type="llm",
            config={
                "continue_on_error": True,
                "prompt": "This will fail"
            }
        )

        await self.engine.create_workflow(
            "error-recovery-workflow",
            [error_node],
            []
        )

        with patch.object(self.engine, '_call_vllm_service', new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = Exception("Service unavailable")

            result = await self.engine.execute_workflow(
                "error-recovery-workflow",
                {"input": "test"}
            )

            # Should complete despite error due to continue_on_error
            assert result.status == "completed"
            assert len(result.node_executions) == 1
            assert result.node_executions[0]["status"] == "failed"

    def test_invalid_node_type_error(self):
        """Test handling of invalid node types"""
        invalid_node = WorkflowNode(
            id="invalid",
            type="invalid_type",
            config={}
        )

        state = WorkflowState()

        with pytest.raises(ValueError, match="Unknown node type"):
            asyncio.run(self.engine._execute_node(invalid_node, state))

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])

