#!/usr/bin/env python3
"""Simple test script to validate workflow execution endpoints."""

from uuid import uuid4

from app.models.execution import ExecutionStatus
from app.schemas import ExecutionResultResponse
from app.schemas import WorkflowExecuteRequest
from app.services.workflow_engine import ExecutionResult
from app.services.workflow_engine import WorkflowEngine


# Test the basic structure and imports
def test_imports():
    """Test that all required imports work."""
    try:
        print("✓ All imports successful")
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False


def test_schema_validation():
    """Test that schemas can be instantiated."""
    try:
        # Test WorkflowExecuteRequest
        request = WorkflowExecuteRequest(input_data={"test": "data"})
        assert request.input_data == {"test": "data"}

        # Test ExecutionResultResponse
        result = ExecutionResultResponse(
            execution_id=uuid4(),
            status="completed",
            output_data={"result": "test"},
            error_message=None,
        )
        assert result.status == "completed"

        print("✓ Schema validation successful")
        return True
    except Exception as e:
        print(f"✗ Schema validation error: {e}")
        return False


def test_execution_result():
    """Test ExecutionResult class."""
    try:
        result = ExecutionResult(
            execution_id=uuid4(),
            status=ExecutionStatus.COMPLETED,
            output_data={"test": "data"},
            error_message=None,
        )

        assert result.status == ExecutionStatus.COMPLETED
        assert result.status.value == "completed"
        assert result.output_data == {"test": "data"}

        print("✓ ExecutionResult class works correctly")
        return True
    except Exception as e:
        print(f"✗ ExecutionResult test error: {e}")
        return False


def test_workflow_engine_structure():
    """Test WorkflowEngine class structure."""
    try:
        engine = WorkflowEngine()

        # Check that required methods exist
        assert hasattr(engine, "execute_workflow")
        assert hasattr(engine, "get_execution_status")
        assert hasattr(engine, "cancel_execution")
        assert hasattr(engine, "get_execution_logs")

        print("✓ WorkflowEngine structure is correct")
        return True
    except Exception as e:
        print(f"✗ WorkflowEngine structure test error: {e}")
        return False


def main():
    """Run all tests."""
    print("Testing workflow execution endpoints implementation...")
    print("=" * 60)

    tests = [
        test_imports,
        test_schema_validation,
        test_execution_result,
        test_workflow_engine_structure,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 60)
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! Implementation looks good.")
        return True
    else:
        print("❌ Some tests failed. Check the errors above.")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
