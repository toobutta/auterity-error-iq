#!/usr/bin/env python3
"""Simple integration test for workflow engine with AI service."""

import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

# Mock dependencies
sys.modules["openai"] = MagicMock()
sys.modules["openai.RateLimitError"] = Exception
sys.modules["openai.APIError"] = Exception
sys.modules["sqlalchemy"] = MagicMock()
sys.modules["sqlalchemy.orm"] = MagicMock()
sys.modules["sqlalchemy.exc"] = MagicMock()

# Mock database models
mock_workflow = MagicMock()
mock_execution = MagicMock()
mock_execution_log = MagicMock()

sys.modules["app.models.workflow"] = MagicMock()
sys.modules["app.models.execution"] = MagicMock()
sys.modules["app.database"] = MagicMock()

# Import after mocking
from app.services.ai_service import AIResponse, AIService  # noqa: E402
from app.services.workflow_engine import (  # noqa: E402
    ExecutionResult,
    ExecutionStatus,
    WorkflowEngine,
)


async def test_workflow_ai_integration():
    """Test workflow engine integration with AI service."""
    print("Testing workflow engine AI integration...")

    # Create mock AI service
    mock_ai_service = AsyncMock(spec=AIService)
    mock_ai_response = AIResponse(
        content="AI processed the customer inquiry successfully",
        model="gpt-3.5-turbo",
        usage={"total_tokens": 100},
        finish_reason="stop",
    )
    mock_ai_service.process_text.return_value = mock_ai_response
    mock_ai_service.process_with_template.return_value = mock_ai_response
    mock_ai_service.validate_response.return_value = True

    # Create workflow engine
    engine = WorkflowEngine()

    # Mock database session and models
    with patch("services.workflow_engine.get_db_session") as mock_db_session:
        mock_db = MagicMock()
        mock_db_session.return_value.__enter__.return_value = mock_db

        # Mock workflow
        mock_workflow = MagicMock()
        mock_workflow.id = uuid4()
        mock_workflow.definition = {
            "nodes": [
                {
                    "id": "input_node",
                    "type": "input",
                    "data": {
                        "label": "Customer Input",
                        "field": "customer_inquiry",
                    },
                },
                {
                    "id": "ai_node",
                    "type": "ai",
                    "data": {
                        "label": "AI Processing",
                        "prompt": (
                            "Process customer inquiry: {customer_inquiry}"
                        ),
                        "model": "gpt-3.5-turbo",
                    },
                },
                {
                    "id": "output_node",
                    "type": "output",
                    "data": {"label": "Response", "format": "json"},
                },
            ],
            "edges": [
                {"source": "input_node", "target": "ai_node"},
                {"source": "ai_node", "target": "output_node"},
            ],
        }
        mock_workflow.is_active = True

        mock_db.query.return_value.filter.return_value.first.\
            return_value = mock_workflow

        # Mock execution
        mock_execution = MagicMock()
        mock_execution.id = uuid4()
        mock_execution.workflow_id = mock_workflow.id
        mock_execution.status = ExecutionStatus.PENDING

        mock_db.add.return_value = None
        mock_db.commit.return_value = None
        mock_db.refresh.return_value = None

        # Test workflow execution
        input_data = {"customer_inquiry": "What are your business hours?"}

        # Mock the get_ai_service function at the import location
        with patch(
            "app.services.ai_service.get_ai_service",
            return_value=mock_ai_service
        ):
            try:
                result = await engine.execute_workflow(
                    mock_workflow.id, input_data
                )

                # Verify the result
                assert isinstance(result, ExecutionResult)
                assert result.status == ExecutionStatus.COMPLETED
                assert "ai_response" in result.output_data

                # Verify AI service was called
                mock_ai_service.process_text.assert_called()

                print("✓ Basic AI workflow execution test passed")

            except Exception as e:
                print(f"❌ Basic AI workflow execution test failed: {e}")
                raise


async def test_workflow_ai_template_integration():
    """Test workflow engine with AI template processing."""
    print("Testing workflow engine AI template integration...")

    # Create mock AI service
    mock_ai_service = AsyncMock(spec=AIService)
    mock_ai_response = AIResponse(
        content="Template processed response",
        model="gpt-3.5-turbo",
        usage={"total_tokens": 75},
        finish_reason="stop",
    )
    mock_ai_service.process_with_template.return_value = mock_ai_response
    mock_ai_service.validate_response.return_value = True

    # Create workflow engine
    engine = WorkflowEngine()

    # Test AI step with template
    node = {
        "id": "ai_template_node",
        "type": "ai",
        "data": {
            "label": "AI Template Processing",
            "template": "customer_inquiry",
            "template_variables": {
                "context": "Dealership hours and contact info"
            },
        },
    }

    input_data = {"inquiry": "When are you open?"}

    # Mock the get_ai_service function at the import location
    with patch(
        "app.services.ai_service.get_ai_service", return_value=mock_ai_service
    ):
        try:
            result = await engine._execute_ai_step(node, input_data)

            # Verify the result
            assert "ai_response" in result
            assert result["ai_response"] == "Template processed response"
            assert result["ai_model"] == "gpt-3.5-turbo"
            assert result["ai_usage"] == {"total_tokens": 75}

            # Verify template was used
            mock_ai_service.process_with_template.assert_called_with(
                template_name="customer_inquiry",
                variables={
                    "inquiry": "When are you open?",
                    "context": "Dealership hours and contact info",
                },
                context=input_data,
                model=None,
            )

            print("✓ AI template workflow step test passed")

        except Exception as e:
            print(f"❌ AI template workflow step test failed: {e}")
            raise


async def test_workflow_ai_error_handling():
    """Test workflow engine AI error handling."""
    print("Testing workflow engine AI error handling...")

    # Create mock AI service that returns error
    mock_ai_service = AsyncMock(spec=AIService)
    mock_ai_response = AIResponse(
        content="", model="gpt-3.5-turbo", error="API rate limit exceeded"
    )
    mock_ai_service.process_text.return_value = mock_ai_response

    # Create workflow engine
    engine = WorkflowEngine()

    # Test AI step with error
    node = {
        "id": "ai_error_node",
        "type": "ai",
        "data": {"label": "AI Error Processing", "prompt": "Process this data"},
    }

    input_data = {"test": "data"}

    # Mock the get_ai_service function at the import location
    with patch(
        "app.services.ai_service.get_ai_service", return_value=mock_ai_service
    ):
        try:
            await engine._execute_ai_step(node, input_data)
            assert False, "Should have raised WorkflowStepError"

        except Exception as e:
            assert "AI processing failed" in str(e)
            print("✓ AI error handling test passed")


async def main():
    """Run all integration tests."""
    print("Running Workflow Engine AI Integration tests...\n")

    try:
        await test_workflow_ai_integration()
        await test_workflow_ai_template_integration()
        await test_workflow_ai_error_handling()

        print("\n🎉 All integration tests passed!")
        return 0

    except Exception as e:
        print(f"\n❌ Integration test failed: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
