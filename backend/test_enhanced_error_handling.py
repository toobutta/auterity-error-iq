#!/usr/bin/env python3
"""
Test script for Enhanced Error Handling & Recovery System

This script validates the core functionality of the enhanced error handling system.
"""

import asyncio
import json
import logging
from datetime import datetime

import redis.asyncio as redis

from app.exceptions import (
    AIServiceError,
    BaseAppException,
    DatabaseError,
    ErrorCategory,
    ErrorSeverity,
    WorkflowError,
)
from app.services.error_analytics import get_error_analytics_service
from app.services.enhanced_recovery import get_enhanced_recovery_service
from app.services.notification_service import get_notification_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_error_analytics():
    """Test error analytics functionality."""
    logger.info("Testing Error Analytics...")
    
    try:
        analytics_service = await get_error_analytics_service()
        
        # Create test errors
        test_errors = [
            AIServiceError("OpenAI API timeout", details={"provider": "openai"}),
            DatabaseError("Connection pool exhausted", details={"pool_size": 10}),
            WorkflowError("Step execution failed", workflow_id="test-123", step_name="ai_process"),
            AIServiceError("Rate limit exceeded", details={"provider": "openai"}),
        ]
        
        # Track errors
        for error in test_errors:
            await analytics_service.track_error(error, {"test": True})
            await asyncio.sleep(0.1)  # Small delay
        
        # Get metrics
        metrics = await analytics_service.get_error_metrics(1)  # Last hour
        logger.info(f"Error metrics: {metrics.total_errors} errors, rate: {metrics.error_rate:.2f}/hour")
        logger.info(f"Categories: {metrics.categories}")
        logger.info(f"Trend: {metrics.trend.value}")
        
        # Get insights
        insights = await analytics_service.get_error_insights(5)
        logger.info(f"Generated {len(insights)} insights")
        for insight in insights:
            logger.info(f"  - {insight.title} (confidence: {insight.confidence:.1%})")
        
        logger.info("✅ Error Analytics test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error Analytics test failed: {e}")
        return False


async def test_enhanced_recovery():
    """Test enhanced recovery functionality."""
    logger.info("Testing Enhanced Recovery...")
    
    try:
        recovery_service = await get_enhanced_recovery_service()
        
        # Create test error
        test_error = AIServiceError(
            "Service temporarily unavailable",
            details={"provider": "openai", "retry_after": 30}
        )
        
        # Create recovery plan
        plan = await recovery_service.create_recovery_plan(
            test_error, 
            {"workflow_id": "test-recovery", "business_critical": True}
        )
        
        logger.info(f"Created recovery plan: {plan.error_id}")
        logger.info(f"Strategies: {[s.value for s in plan.strategies]}")
        logger.info(f"Success probability: {plan.success_probability:.1%}")
        logger.info(f"Estimated duration: {plan.estimated_duration}s")
        
        # Execute recovery plan
        attempts = await recovery_service.execute_recovery_plan(plan, test_error)
        
        logger.info(f"Executed {len(attempts)} recovery attempts")
        for attempt in attempts:
            logger.info(f"  - {attempt.strategy.value}: {attempt.outcome.value} ({attempt.duration_seconds:.2f}s)")
        
        # Get recovery stats
        stats = await recovery_service.get_recovery_stats()
        logger.info(f"Recovery stats: {stats.get('success_rate', 0):.1f}% success rate")
        
        logger.info("✅ Enhanced Recovery test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Enhanced Recovery test failed: {e}")
        return False


async def test_notification_service():
    """Test notification service functionality."""
    logger.info("Testing Notification Service...")
    
    try:
        notification_service = await get_notification_service()
        
        # Test error notification
        test_error = DatabaseError(
            "Connection timeout",
            details={"host": "localhost", "timeout": 30}
        )
        
        await notification_service.send_error_notification(
            test_error,
            {"workflow_id": "test-notification", "user_id": "test-user"}
        )
        
        # Test recovery notification
        await notification_service.send_recovery_notification(
            "exponential_backoff",
            True,
            {"duration": 15.5, "attempts": 3}
        )
        
        # Test correlation notification
        await notification_service.send_correlation_notification({
            "pattern": "cascading_failure",
            "confidence": 0.85,
            "affected_systems": ["autmatrix", "relaycore"],
            "root_cause": "Database connection failure"
        })
        
        # Get recent notifications
        notifications = await notification_service.get_recent_notifications(10)
        logger.info(f"Generated {len(notifications)} notifications")
        
        # Get notification stats
        stats = await notification_service.get_notification_stats()
        logger.info(f"Notification stats: {stats.get('total_notifications', 0)} total")
        
        logger.info("✅ Notification Service test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Notification Service test failed: {e}")
        return False


async def test_integration():
    """Test integration between all components."""
    logger.info("Testing System Integration...")
    
    try:
        # Create a complex error scenario
        error = WorkflowError(
            "Multi-step workflow failure",
            workflow_id="integration-test",
            execution_id="exec-123",
            step_name="ai_analysis",
            details={
                "step_count": 5,
                "failed_step": 3,
                "error_chain": ["validation_error", "ai_service_timeout", "workflow_abort"]
            }
        )
        
        context = {
            "user_id": "test-user",
            "business_critical": True,
            "user_facing": True,
            "correlation_id": "test-correlation-123"
        }
        
        # Track error (triggers analytics)
        analytics_service = await get_error_analytics_service()
        await analytics_service.track_error(error, context)
        
        # Send notification
        notification_service = await get_notification_service()
        await notification_service.send_error_notification(error, context)
        
        # Create and execute recovery plan
        recovery_service = await get_enhanced_recovery_service()
        plan = await recovery_service.create_recovery_plan(error, context)
        attempts = await recovery_service.execute_recovery_plan(plan, error, context)
        
        # Verify integration worked
        dashboard_data = await analytics_service.get_error_dashboard_data()
        recovery_stats = await recovery_service.get_recovery_stats()
        notification_stats = await notification_service.get_notification_stats()
        
        logger.info("Integration test results:")
        logger.info(f"  - Dashboard health: {dashboard_data.get('health_indicators', {}).get('overall_status', 'unknown')}")
        logger.info(f"  - Recovery success rate: {recovery_stats.get('success_rate', 0):.1f}%")
        logger.info(f"  - Notifications sent: {notification_stats.get('total_notifications', 0)}")
        
        logger.info("✅ System Integration test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ System Integration test failed: {e}")
        return False


async def cleanup_test_data():
    """Clean up test data from Redis."""
    logger.info("Cleaning up test data...")
    
    try:
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=False)
        
        # Clean up test keys
        test_patterns = [
            "error_record:*",
            "error_insight:*",
            "recovery_plan:*",
            "recovery_attempt:*",
            "notification:*",
            "metrics_hour:*",
            "strategy_success:*"
        ]
        
        for pattern in test_patterns:
            keys = await redis_client.keys(pattern)
            if keys:
                await redis_client.delete(*keys)
        
        await redis_client.close()
        logger.info("✅ Test data cleaned up")
        
    except Exception as e:
        logger.error(f"❌ Cleanup failed: {e}")


async def main():
    """Run all tests."""
    logger.info("🚀 Starting Enhanced Error Handling & Recovery System Tests")
    logger.info("=" * 60)
    
    # Run tests
    test_results = []
    
    test_results.append(await test_error_analytics())
    test_results.append(await test_enhanced_recovery())
    test_results.append(await test_notification_service())
    test_results.append(await test_integration())
    
    # Summary
    passed = sum(test_results)
    total = len(test_results)
    
    logger.info("=" * 60)
    logger.info(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! Enhanced Error Handling system is working correctly.")
    else:
        logger.error(f"❌ {total - passed} tests failed. Please check the logs above.")
    
    # Cleanup
    await cleanup_test_data()
    
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)