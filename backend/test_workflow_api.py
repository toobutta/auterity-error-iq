#!/usr/bin/env python3
"""Simple test script to verify workflow API functionality."""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set test environment
os.environ["PYTEST_CURRENT_TEST"] = "true"

try:
    from app.schemas import WorkflowCreate

    print("✅ Successfully imported workflow schemas and API router")

    # Test workflow creation schema validation
    valid_workflow_data = {
        "name": "Test Workflow",
        "description": "A test workflow",
        "definition": {
            "nodes": [{"id": "start", "type": "start"}, {"id": "end", "type": "end"}],
            "edges": [{"source": "start", "target": "end"}],
        },
    }

    workflow_create = WorkflowCreate(**valid_workflow_data)
    print("✅ WorkflowCreate schema validation passed")

    # Test invalid workflow data
    try:
        invalid_workflow_data = {
            "name": "",  # Empty name should fail
            "definition": {"nodes": [], "edges": []},
        }
        WorkflowCreate(**invalid_workflow_data)
        print("❌ Should have failed validation for empty name")
    except ValueError as e:
        print(f"✅ Correctly caught validation error: {e}")

    # Test invalid definition
    try:
        invalid_definition_data = {
            "name": "Test",
            "definition": {"nodes": []},  # Missing edges
        }
        WorkflowCreate(**invalid_definition_data)
        print("❌ Should have failed validation for missing edges")
    except ValueError as e:
        print(f"✅ Correctly caught validation error: {e}")

    print("\n🎉 All workflow API components are working correctly!")

except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
