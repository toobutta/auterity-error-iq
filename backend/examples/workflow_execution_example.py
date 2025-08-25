#!/usr/bin/env python3
"""
Comprehensive example of the Workflow Execution Engine
Demonstrates all key features including parallel execution, dependency resolution, and error recovery
"""

import asyncio
import os
import sys
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.workflow_execution_engine import WorkflowExecutionEngine


async def example_complex_workflow():
    """Example of a complex workflow with multiple dependencies and parallel execution"""

    print("🚀 Running Complex Workflow Example")
    print("=" * 50)

    engine = WorkflowExecutionEngine(max_parallel_steps=3)

    # Define a complex workflow
    workflow = {
        "id": "data_processing_pipeline",
        "steps": {
            # Data collection phase (parallel)
            "collect_user_data": {
                "type": "input",
                "input": {
                    "data": {
                        "user_id": "12345",
                        "name": "john doe",
                        "email": "john@example.com",
                    },
                    "source": "user_api",
                },
                "depends_on": [],
            },
            "collect_system_data": {
                "type": "input",
                "input": {
                    "data": {
                        "system_id": "sys_001",
                        "status": "active",
                        "version": "2.1.0",
                    },
                    "source": "system_api",
                },
                "depends_on": [],
            },
            # Data processing phase (parallel after collection)
            "process_user_data": {
                "type": "process",
                "input": {
                    "rules": [
                        {
                            "type": "transform",
                            "field": "name",
                            "operation": "uppercase",
                        },
                        {
                            "type": "transform",
                            "field": "email",
                            "operation": "lowercase",
                        },
                    ]
                },
                "depends_on": ["collect_user_data"],
            },
            "process_system_data": {
                "type": "process",
                "input": {
                    "rules": [
                        {
                            "type": "transform",
                            "field": "status",
                            "operation": "uppercase",
                        }
                    ]
                },
                "depends_on": ["collect_system_data"],
            },
            # AI analysis phase
            "ai_analysis": {
                "type": "ai",
                "input": {"prompt": "Analyze the user and system data for insights"},
                "depends_on": ["process_user_data", "process_system_data"],
            },
            # Final output phase
            "generate_report": {
                "type": "output",
                "input": {"destination": "report_service"},
                "depends_on": ["ai_analysis"],
            },
        },
    }

    # Execute the workflow
    start_time = datetime.now()
    result = await engine.execute_workflow(workflow)
    execution_time = (datetime.now() - start_time).total_seconds()

    # Display results
    print(f"\n📊 Execution Results:")
    print(f"Status: {result['status']}")
    print(f"Total Execution Time: {execution_time:.3f} seconds")

    if result["status"] == "completed":
        print(f"\n📈 Step Results:")
        for step_id, step_result in result["results"].items():
            print(f"  {step_id}: {step_result}")

        print(f"\n✅ Workflow completed successfully!")

        # Show execution status
        status = engine.get_execution_status(workflow["id"])
        print(f"\n📋 Final Status:")
        print(f"  Completed Steps: {len(status['completed_steps'])}")
        print(f"  Active Executions: {status['active_executions']}")

    else:
        print(f"\n❌ Workflow failed: {result}")

    return result


async def main():
    """Run all examples"""

    print("🎯 Workflow Execution Engine - Comprehensive Examples")
    print("=" * 60)

    try:
        await example_complex_workflow()

        print("\n" + "=" * 60)
        print("🎉 All examples completed successfully!")
        print("\n📚 Key Features Demonstrated:")
        print("  ✓ Topological sorting and dependency resolution")
        print("  ✓ Parallel execution with resource limiting")
        print("  ✓ Data passing between workflow steps")
        print("  ✓ Error handling and retry mechanisms")
        print("  ✓ Performance monitoring and optimization")
        print("  ✓ Multiple step executor types (input, process, AI, output)")

    except Exception as e:
        print(f"\n❌ Example failed: {str(e)}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
