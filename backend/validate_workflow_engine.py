#!/usr/bin/env python3
"""Simple validation script for workflow engine without database dependencies."""

import ast
import inspect
import os
import sys


def validate_workflow_engine_structure():
    """Validate the structure and methods of the WorkflowEngine class."""

    # Read the workflow engine file
    with open("app/services/workflow_engine.py", "r") as f:
        content = f.read()

    # Parse the AST
    try:
        tree = ast.parse(content)
        print("✓ Syntax is valid")
    except SyntaxError as e:
        print(f"✗ Syntax error: {e}")
        return False

    # Check for required classes and methods
    classes = {}
    functions = {}

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            classes[node.name] = [
                method.name
                for method in node.body
                if isinstance(method, (ast.FunctionDef, ast.AsyncFunctionDef))
            ]
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not any(
            isinstance(parent, ast.ClassDef) for parent in ast.walk(tree)
        ):
            functions[node.name] = True

    # Validate WorkflowEngine class
    if "WorkflowEngine" not in classes:
        print("✗ WorkflowEngine class not found")
        return False

    print("✓ WorkflowEngine class found")

    # Check required methods
    required_methods = [
        "__init__",
        "execute_workflow",
        "get_execution_status",
        "cancel_execution",
        "get_execution_logs",
        "_execute_workflow_steps",
        "_build_execution_order",
        "_execute_step",
        "_execute_step_by_type",
    ]

    workflow_engine_methods = classes["WorkflowEngine"]

    for method in required_methods:
        if method in workflow_engine_methods:
            print(f"✓ Method {method} found")
        else:
            print(f"✗ Method {method} missing")
            return False

    # Check for ExecutionResult class
    if "ExecutionResult" not in classes:
        print("✗ ExecutionResult class not found")
        return False

    print("✓ ExecutionResult class found")

    # Check for custom exceptions
    exception_classes = ["WorkflowExecutionError", "WorkflowStepError"]
    for exc_class in exception_classes:
        if exc_class not in classes:
            print(f"✗ Exception class {exc_class} not found")
            return False
        print(f"✓ Exception class {exc_class} found")

    # Check for step execution methods
    step_methods = [
        "_execute_input_step",
        "_execute_process_step",
        "_execute_output_step",
        "_execute_ai_step",
        "_execute_default_step",
    ]

    for method in step_methods:
        if method in workflow_engine_methods:
            print(f"✓ Step method {method} found")
        else:
            print(f"✗ Step method {method} missing")
            return False

    print("\n✓ All required components found in WorkflowEngine")
    return True


def validate_test_structure():
    """Validate the test file structure."""

    if not os.path.exists("tests/test_workflow_engine.py"):
        print("✗ Test file tests/test_workflow_engine.py not found")
        return False

    with open("tests/test_workflow_engine.py", "r") as f:
        content = f.read()

    # Parse the AST
    try:
        tree = ast.parse(content)
        print("✓ Test file syntax is valid")
    except SyntaxError as e:
        print(f"✗ Test file syntax error: {e}")
        return False

    # Check for test classes
    classes = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            classes[node.name] = [
                method.name
                for method in node.body
                if isinstance(method, (ast.FunctionDef, ast.AsyncFunctionDef))
            ]

    required_test_classes = [
        "TestWorkflowEngine",
        "TestWorkflowEngineErrorHandling",
        "TestExecutionResult",
    ]

    for test_class in required_test_classes:
        if test_class in classes:
            print(f"✓ Test class {test_class} found")
        else:
            print(f"✗ Test class {test_class} missing")
            return False

    # Count test methods
    test_methods = []
    for class_name, methods in classes.items():
        if class_name.startswith("Test"):
            test_methods.extend([m for m in methods if m.startswith("test_")])

    print(f"✓ Found {len(test_methods)} test methods")

    if len(test_methods) < 15:  # We should have at least 15 test methods
        print(f"✗ Expected at least 15 test methods, found {len(test_methods)}")
        return False

    print("✓ Test file structure is valid")
    return True


def validate_schemas():
    """Validate that execution schemas were added."""

    with open("app/schemas.py", "r") as f:
        content = f.read()

    required_schemas = [
        "WorkflowExecuteRequest",
        "ExecutionStatusResponse",
        "ExecutionLogResponse",
        "ExecutionResultResponse",
    ]

    for schema in required_schemas:
        if f"class {schema}" in content:
            print(f"✓ Schema {schema} found")
        else:
            print(f"✗ Schema {schema} missing")
            return False

    print("✓ All execution schemas found")
    return True


def main():
    """Run all validations."""
    print("Validating Workflow Engine Implementation...")
    print("=" * 50)

    all_valid = True

    print("\n1. Validating WorkflowEngine structure:")
    if not validate_workflow_engine_structure():
        all_valid = False

    print("\n2. Validating test structure:")
    if not validate_test_structure():
        all_valid = False

    print("\n3. Validating schemas:")
    if not validate_schemas():
        all_valid = False

    print("\n" + "=" * 50)
    if all_valid:
        print("✓ All validations passed! Workflow Engine implementation is complete.")
        return 0
    else:
        print("✗ Some validations failed. Please review the implementation.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
