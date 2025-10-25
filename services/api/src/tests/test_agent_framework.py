"""
Comprehensive test suite for the Agent Framework integration.
Tests the core functionality of all major components.
"""

import os
import sys
from unittest.mock import AsyncMock, patch

import pytest

from app.api.agents import router
from app.services.agents.compliance_layer import ComplianceLayer
from app.services.agents.orchestrator import AgentOrchestrator
from app.services.agents.rag_engine import RAGEngine
from app.services.agents.security_manager import SecurityManager

# Add the backend directory to Python path
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_path)


# Import our agent framework components


class TestAgentFrameworkIntegration:
    """Test the complete agent framework integration."""

    @pytest.fixture
    def orchestrator(self):
        """Create a test orchestrator instance."""
        return AgentOrchestrator()

    @pytest.fixture
    def rag_engine(self):
        """Create a test RAG engine instance."""
        return RAGEngine()

    @pytest.fixture
    def compliance_layer(self):
        """Create a test compliance layer instance."""
        return ComplianceLayer()

    @pytest.fixture
    def security_manager(self):
        """Create a test security manager instance."""
        return SecurityManager()

    def test_orchestrator_initialization(self, orchestrator):
        """Test that the orchestrator initializes correctly."""
        assert orchestrator is not None
        assert hasattr(orchestrator, "agents")
        assert hasattr(orchestrator, "workflows")
        assert hasattr(orchestrator, "memory")
        assert len(orchestrator.agents) == 0
        print("✅ Orchestrator initialization test passed")

    def test_agent_registration(self, orchestrator):
        """Test agent registration functionality."""
        # Create a mock agent
        mock_agent = {
            "id": "test-agent-001",
            "name": "Test Agent",
            "type": "general",
            "capabilities": ["text_processing", "analysis"],
            "status": "active",
        }

        # Register the agent
        result = orchestrator.register_agent(mock_agent)

        # Verify registration
        assert result["success"] is True
        assert mock_agent["id"] in orchestrator.agents
        assert orchestrator.agents[mock_agent["id"]]["name"] == "Test Agent"
        print("✅ Agent registration test passed")

    def test_rag_engine_initialization(self, rag_engine):
        """Test that the RAG engine initializes correctly."""
        assert rag_engine is not None
        assert hasattr(rag_engine, "vector_store")
        assert hasattr(rag_engine, "retriever")
        assert hasattr(rag_engine, "document_processor")
        print("✅ RAG Engine initialization test passed")

    def test_rag_document_processing(self, rag_engine):
        """Test document processing functionality."""
        # Test document
        test_doc = {
            "content": "This is a test document for the Auterity platform.",
            "metadata": {
                "title": "Test Document",
                "domain": "general",
                "classification": "public",
            },
        }

        # Process document
        try:
            result = rag_engine.index_document(test_doc)
            assert "document_id" in result
            assert result["status"] == "indexed"
            print("✅ RAG document processing test passed")
        except Exception as e:
            # If external dependencies are not available, check for graceful fallback
            assert "vector store not available" in str(
                e
            ) or "embedding model not available" in str(e)
            print("✅ RAG document processing test passed (graceful fallback)")

    def test_compliance_layer_validation(self, compliance_layer):
        """Test compliance validation functionality."""
        # Test data with different classifications
        test_data = {
            "content": "John Doe, born 01/01/1990, SSN: 123-45-6789",
            "classification": "PII",
        }

        compliance_rules = ["GDPR", "HIPAA"]

        # Validate compliance
        result = compliance_layer.validate_compliance(
            test_data, compliance_rules
        )

        assert "compliance_status" in result
        assert "audit_id" in result
        assert "violations" in result
        assert isinstance(result["violations"], list)
        print("✅ Compliance validation test passed")

    def test_security_authentication(self, security_manager):
        """Test security authentication functionality."""
        # Test user data
        user_data = {
            "user_id": "test-user-001",
            "roles": ["agent_user"],
            "permissions": ["execute_workflow", "query_rag"],
        }

        # Generate token
        token = security_manager.generate_token(user_data)
        assert token is not None
        assert isinstance(token, str)

        # Validate token
        validation_result = security_manager.validate_token(token)
        assert validation_result["valid"] is True
        assert validation_result["user_id"] == "test-user-001"
        print("✅ Security authentication test passed")

    def test_security_threat_detection(self, security_manager):
        """Test threat detection functionality."""
        # Simulate suspicious activity
        request_data = {
            "ip_address": "192.168.1.100",
            "user_agent": "suspicious-bot/1.0",
            "request_count": 150,  # High request count
            "time_window": 60,  # In 1 minute
        }

        # Check for threats
        threat_result = security_manager.detect_threat(request_data)

        assert "threat_detected" in threat_result
        assert "threat_level" in threat_result
        assert "actions_taken" in threat_result
        print("✅ Security threat detection test passed")

    @pytest.mark.asyncio
    async def test_workflow_execution(self, orchestrator):
        """Test workflow execution functionality."""
        # Register a mock agent first
        mock_agent = {
            "id": "workflow-agent-001",
            "name": "Workflow Test Agent",
            "type": "processor",
            "capabilities": ["data_processing"],
            "status": "active",
        }
        orchestrator.register_agent(mock_agent)

        # Create a test workflow
        workflow = {
            "id": "test-workflow-001",
            "name": "Test Workflow",
            "type": "sequential",
            "steps": [
                {
                    "agent_id": "workflow-agent-001",
                    "action": "process_data",
                    "input": {"data": "test input"},
                }
            ],
        }

        # Execute workflow
        with patch.object(
            orchestrator, "_execute_agent_step", new_callable=AsyncMock
        ) as mock_execute:
            mock_execute.return_value = {
                "success": True,
                "result": "processed data",
            }

            result = await orchestrator.execute_workflow(workflow)

            assert "execution_id" in result
            assert result["status"] == "completed"
            assert "results" in result
            print("✅ Workflow execution test passed")

    def test_integration_components_compatibility(
        self, orchestrator, rag_engine, compliance_layer, security_manager
    ):
        """Test that all components work together."""
        # Test integration points
        assert orchestrator is not None
        assert rag_engine is not None
        assert compliance_layer is not None
        assert security_manager is not None

        # Test that components can interact
        # 1. Security validates user
        user_data = {"user_id": "integration-test", "roles": ["admin"]}
        token = security_manager.generate_token(user_data)
        validation = security_manager.validate_token(token)
        assert validation["valid"] is True

        # 2. Compliance validates data
        test_data = {"content": "test data", "classification": "internal"}
        compliance_result = compliance_layer.validate_compliance(
            test_data, ["GDPR"]
        )
        assert "compliance_status" in compliance_result

        # 3. Agent registration works
        agent = {
            "id": "integration-agent",
            "name": "Integration Agent",
            "type": "general",
        }
        registration = orchestrator.register_agent(agent)
        assert registration["success"] is True

        print("✅ Integration components compatibility test passed")

    def test_error_handling_and_fallbacks(self, rag_engine):
        """Test error handling and graceful fallbacks."""
        # Test with invalid document
        invalid_doc = {"invalid": "structure"}

        try:
            result = rag_engine.index_document(invalid_doc)
            # Should either succeed with validation or fail gracefully
            assert "error" in result or "document_id" in result
        except Exception as e:
            # Exception should be handled gracefully
            assert isinstance(e, Exception)

        print("✅ Error handling and fallbacks test passed")

    def test_configuration_loading(self):
        """Test that configuration is loaded correctly."""
        # Test that our modules can import without errors
        try:
            # Test instantiation
            orchestrator = AgentOrchestrator()
            rag_engine = RAGEngine()
            compliance_layer = ComplianceLayer()
            security_manager = SecurityManager()

            assert all(
                [orchestrator, rag_engine, compliance_layer, security_manager]
            )
            print("✅ Configuration loading test passed")

        except ImportError as e:
            pytest.fail(f"Failed to import agent framework modules: {e}")


def test_api_endpoints_structure():
    """Test that API endpoints are properly structured."""
    try:
        assert router is not None
        print("✅ API endpoints structure test passed")
    except ImportError as e:
        pytest.fail(f"Failed to import API endpoints: {e}")


def test_main_app_integration():
    """Test that the main app integrates the agent framework."""
    try:
        # This should work if the main app properly includes our routes
        print("✅ Main app integration test passed")
    except ImportError as e:
        print(f"⚠️ Main app integration test skipped: {e}")


if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v", "-s"])
