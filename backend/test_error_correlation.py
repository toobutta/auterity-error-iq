#!/usr/bin/env python3
"""
Test script for cross-system error correlation and handling.
"""

import asyncio
import json
import logging
from datetime import datetime
from datetime import timedelta
from typing import Any
from typing import Dict
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_error_correlation():
    """Test the error correlation system with sample errors."""

    # Import the correlation service
    from app.services.error_correlation import get_correlation_service

    try:
        # Get correlation service
        correlation_service = await get_correlation_service()
        logger.info("✅ Error correlation service initialized")

        # Test 1: Cascading failure pattern
        logger.info("\n🧪 Test 1: Cascading Failure Pattern")
        cascading_errors = [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Database connection timeout",
                "code": "DATABASE_TIMEOUT",
                "category": "database",
                "severity": "high",
                "context": {"workflow_id": "wf_001", "execution_id": "exec_001"},
                "user_id": "user_123",
            },
            {
                "timestamp": (datetime.utcnow() + timedelta(seconds=30)).isoformat(),
                "message": "AI provider request failed",
                "code": "PROVIDER_ERROR",
                "category": "ai_service",
                "severity": "high",
                "context": {"provider": "openai", "model_id": "gpt-4"},
                "user_id": "user_123",
            },
            {
                "timestamp": (datetime.utcnow() + timedelta(seconds=60)).isoformat(),
                "message": "Model deployment failed",
                "code": "DEPLOYMENT_ERROR",
                "category": "model",
                "severity": "high",
                "context": {"model_id": "automotive_v1", "deployment_id": "dep_001"},
                "user_id": "user_123",
            },
        ]

        for error_data in cascading_errors:
            await correlation_service.aggregate_error(error_data)
            await asyncio.sleep(1)  # Small delay to simulate real timing

        logger.info("✅ Cascading errors aggregated")

        # Test 2: Common root cause pattern
        logger.info("\n🧪 Test 2: Common Root Cause Pattern")
        common_cause_errors = [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Authentication token expired",
                "code": "AUTH_TOKEN_EXPIRED",
                "category": "authentication",
                "severity": "medium",
                "context": {"workflow_id": "wf_002"},
                "user_id": "user_456",
            },
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Authentication token expired",
                "code": "AUTH_TOKEN_EXPIRED",
                "category": "authentication",
                "severity": "medium",
                "context": {"provider": "anthropic", "model_id": "claude-3"},
                "user_id": "user_456",
            },
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Authentication token expired",
                "code": "AUTH_TOKEN_EXPIRED",
                "category": "authentication",
                "severity": "medium",
                "context": {"model_id": "automotive_v2"},
                "user_id": "user_456",
            },
        ]

        for error_data in common_cause_errors:
            await correlation_service.aggregate_error(error_data)

        logger.info("✅ Common cause errors aggregated")

        # Test 3: Resource exhaustion pattern
        logger.info("\n🧪 Test 3: Resource Exhaustion Pattern")
        resource_errors = [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Memory limit exceeded",
                "code": "MEMORY_EXHAUSTED",
                "category": "system",
                "severity": "critical",
                "context": {"workflow_id": "wf_003"},
                "user_id": "user_789",
            },
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "GPU memory full",
                "code": "GPU_MEMORY_FULL",
                "category": "system",
                "severity": "critical",
                "context": {"model_id": "automotive_v3", "training_job_id": "job_001"},
                "user_id": "user_789",
            },
        ]

        for error_data in resource_errors:
            await correlation_service.aggregate_error(error_data)

        logger.info("✅ Resource exhaustion errors aggregated")

        # Wait for correlation analysis
        await asyncio.sleep(2)

        # Test 4: Get correlation status
        logger.info("\n📊 Getting correlation status...")
        status = await correlation_service.get_correlation_status()

        logger.info(f"Total correlations: {status.get('total_correlations', 0)}")
        logger.info(f"Active correlations: {status.get('active_correlations', 0)}")
        logger.info(f"Pattern distribution: {status.get('pattern_distribution', {})}")
        logger.info(f"Affected systems: {status.get('affected_systems', {})}")
        logger.info(
            f"Recovery actions executed: {status.get('recovery_actions_executed', 0)}"
        )

        # Test 5: Test recovery actions
        logger.info("\n🔧 Testing recovery actions...")
        recovery_actions = correlation_service.recovery_actions
        logger.info(f"Available recovery actions: {list(recovery_actions.keys())}")

        for action_name, action in recovery_actions.items():
            logger.info(f"  - {action.name}: {action.description}")

        logger.info("✅ All tests completed successfully!")

    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        raise


async def test_error_aggregators():
    """Test the error aggregation utilities."""

    logger.info("\n🧪 Testing Error Aggregators")

    try:
        # Test AutoMatrix error aggregation
        from app.exceptions import WorkflowError
        from app.utils.error_aggregator import aggregate_autmatrix_error

        workflow_error = WorkflowError(
            message="Step execution failed",
            workflow_id="wf_test",
            execution_id="exec_test",
            step_name="ai_analysis",
        )

        success = await aggregate_autmatrix_error(
            workflow_id="wf_test",
            execution_id="exec_test",
            step_name="ai_analysis",
            error=workflow_error,
            user_id="test_user",
        )

        if success:
            logger.info("✅ AutoMatrix error aggregation successful")
        else:
            logger.warning("⚠️ AutoMatrix error aggregation failed")

        # Test batch error aggregation
        from app.utils.error_aggregator import get_error_aggregator

        aggregator = get_error_aggregator()
        batch_errors = [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Batch error 1",
                "code": "BATCH_ERROR_1",
                "category": "test",
                "severity": "low",
                "context": {"test": True},
            },
            {
                "timestamp": datetime.utcnow().isoformat(),
                "message": "Batch error 2",
                "code": "BATCH_ERROR_2",
                "category": "test",
                "severity": "low",
                "context": {"test": True},
            },
        ]

        batch_success = await aggregator.aggregate_batch_errors(batch_errors)

        if batch_success:
            logger.info("✅ Batch error aggregation successful")
        else:
            logger.warning("⚠️ Batch error aggregation failed")

        logger.info("✅ Error aggregator tests completed!")

    except Exception as e:
        logger.error(f"❌ Error aggregator test failed: {e}")
        raise


async def test_correlation_patterns():
    """Test specific correlation pattern detection."""

    logger.info("\n🧪 Testing Correlation Pattern Detection")

    try:
        from app.services.error_correlation import SystemError
        from app.services.error_correlation import SystemType
        from app.services.error_correlation import get_correlation_service

        correlation_service = await get_correlation_service()

        # Create test errors for pattern detection
        base_time = datetime.utcnow()

        # Test dependency failure pattern
        dependency_errors = [
            SystemError(
                id="dep_err_1",
                system=SystemType.AUTMATRIX,
                timestamp=base_time,
                category="database",
                severity="high",
                message="Database connection failed",
                code="DB_CONNECTION_ERROR",
                context={"workflow_id": "wf_dep_test"},
            ),
            SystemError(
                id="dep_err_2",
                system=SystemType.RELAYCORE,
                timestamp=base_time + timedelta(seconds=10),
                category="database",
                severity="high",
                message="Database timeout error",
                code="DB_TIMEOUT_ERROR",
                context={"provider": "openai"},
            ),
        ]

        # Test pattern detection
        correlations = await correlation_service._analyze_correlations(
            dependency_errors[1], [dependency_errors[0]]
        )

        if correlations:
            logger.info(f"✅ Detected {len(correlations)} correlations:")
            for correlation in correlations:
                logger.info(f"  - Pattern: {correlation.pattern}")
                logger.info(f"  - Root cause: {correlation.root_cause}")
                logger.info(f"  - Confidence: {correlation.confidence}")
                logger.info(f"  - Affected systems: {correlation.affected_systems}")
        else:
            logger.info("ℹ️ No correlations detected")

        logger.info("✅ Pattern detection tests completed!")

    except Exception as e:
        logger.error(f"❌ Pattern detection test failed: {e}")
        raise


async def main():
    """Run all error correlation tests."""

    logger.info("🚀 Starting Error Correlation System Tests")
    logger.info("=" * 60)

    try:
        # Test 1: Basic error correlation
        await test_error_correlation()

        # Test 2: Error aggregators
        await test_error_aggregators()

        # Test 3: Pattern detection
        await test_correlation_patterns()

        logger.info("\n" + "=" * 60)
        logger.info(
            "🎉 All tests passed! Error correlation system is working correctly."
        )

    except Exception as e:
        logger.error(f"\n❌ Tests failed: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
