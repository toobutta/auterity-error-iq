"""Test script for RelayCore integration with AutoMatrix."""

import asyncio
import logging
import os
import sys
from typing import Any
from typing import Dict

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.config.relaycore import get_relaycore_config
from app.services.ai_service_migration import AIServiceMigrationWrapper
from app.services.ai_service_relaycore import AIModelType
from app.services.ai_service_relaycore import EnhancedAIService
from app.services.relaycore_client import RelayCoreChatClient
from app.services.relaycore_client import RelayCoreFallbackHandler
from app.services.relaycore_client import RelayCoreFallbackMode

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_relaycore_client():
    """Test basic RelayCore client functionality."""
    logger.info("Testing RelayCore client...")

    client = RelayCoreChatClient(base_url="http://localhost:3001", timeout=10)

    try:
        # Test health check
        is_healthy = await client.health_check()
        logger.info(f"RelayCore health check: {'✓' if is_healthy else '✗'}")

        if is_healthy:
            # Test chat completion
            response = await client.chat_completion(
                messages=[{"role": "user", "content": "Say hello from AutoMatrix"}],
                model="gpt-3.5-turbo",
                user_id="test-user",
            )

            if response.is_success:
                logger.info(f"Chat completion successful: {response.content[:50]}...")
                logger.info(f"Model used: {response.model}, Cost: ${response.cost}")
            else:
                logger.error(f"Chat completion failed: {response.error}")

        # Test available models
        models = await client.get_available_models()
        logger.info(f"Available models: {len(models)} found")

    except Exception as e:
        logger.error(f"RelayCore client test failed: {e}")
    finally:
        await client.close()


async def test_enhanced_ai_service():
    """Test enhanced AI service with RelayCore integration."""
    logger.info("Testing Enhanced AI Service...")

    service = EnhancedAIService(use_relaycore=True, cost_limit_per_request=0.05)

    try:
        # Test health check
        health = await service.health_check()
        logger.info(
            f"Service health: RelayCore={health['relaycore']}, Direct={health['openai_direct']}"
        )

        # Test text processing
        response = await service.process_text(
            prompt="Explain the benefits of automotive workflow automation",
            user_id="test-user",
        )

        if response.is_success:
            logger.info(f"Text processing successful via {response.source}")
            logger.info(f"Response: {response.content[:100]}...")
        else:
            logger.error(f"Text processing failed: {response.error}")

        # Test template processing
        template_response = await service.process_with_template(
            template_name="customer_inquiry",
            variables={
                "inquiry": "I'm interested in a new sedan",
                "context": "Customer is looking for fuel-efficient vehicles",
            },
            user_id="test-user",
        )

        if template_response.is_success:
            logger.info(
                f"Template processing successful via {template_response.source}"
            )
            logger.info(f"Template response: {template_response.content[:100]}...")
        else:
            logger.error(f"Template processing failed: {template_response.error}")

        # Test direct fallback
        direct_response = await service.process_text(
            prompt="Test direct OpenAI fallback", user_id="test-user", force_direct=True
        )

        if direct_response.is_success:
            logger.info(f"Direct fallback successful: {direct_response.source}")
        else:
            logger.error(f"Direct fallback failed: {direct_response.error}")

    except Exception as e:
        logger.error(f"Enhanced AI service test failed: {e}")
    finally:
        await service.close()


async def test_migration_wrapper():
    """Test migration wrapper for backward compatibility."""
    logger.info("Testing Migration Wrapper...")

    wrapper = AIServiceMigrationWrapper(use_relaycore=True, fallback_to_legacy=True)

    try:
        # Test service status
        status = await wrapper.get_service_status()
        logger.info(f"Service status: {status}")

        # Test text processing with migration wrapper
        response = await wrapper.process_text(
            prompt="Test migration wrapper functionality", user_id="test-user"
        )

        if response.is_success:
            logger.info(f"Migration wrapper successful via {response.source}")
            logger.info(f"Response: {response.content[:100]}...")
        else:
            logger.error(f"Migration wrapper failed: {response.error}")

        # Test available templates
        templates = wrapper.get_available_templates()
        logger.info(f"Available templates: {templates}")

    except Exception as e:
        logger.error(f"Migration wrapper test failed: {e}")
    finally:
        await wrapper.close()


async def test_configuration():
    """Test RelayCore configuration."""
    logger.info("Testing RelayCore Configuration...")

    try:
        config = get_relaycore_config()

        logger.info(f"Base URL: {config.core.base_url}")
        logger.info(f"Environment: {config.core.environment}")
        logger.info(f"Max cost per request: ${config.cost.max_cost_per_request}")
        logger.info(f"Cache enabled: {config.cache.enable_cache}")
        logger.info(f"Preferred providers: {config.steering.preferred_providers}")

        # Validate configuration
        issues = config.validate_configuration()
        if issues:
            logger.warning(f"Configuration issues: {issues}")
        else:
            logger.info("Configuration validation passed ✓")

        # Test URL generation
        api_url = config.get_full_api_url("chat/completions")
        logger.info(f"Full API URL: {api_url}")

    except Exception as e:
        logger.error(f"Configuration test failed: {e}")


async def test_fallback_scenarios():
    """Test various fallback scenarios."""
    logger.info("Testing Fallback Scenarios...")

    # Test with RelayCore unavailable
    client = RelayCoreChatClient(
        base_url="http://localhost:9999",  # Invalid URL
        timeout=2,
        fallback_handler=RelayCoreFallbackHandler(
            mode=RelayCoreFallbackMode.DIRECT_OPENAI
        ),
    )

    try:
        response = await client.chat_completion(
            messages=[{"role": "user", "content": "Test fallback"}], user_id="test-user"
        )

        logger.info(f"Fallback test result: Success={response.is_success}")
        if response.error:
            logger.info(f"Expected fallback error: {response.error}")

    except Exception as e:
        logger.error(f"Fallback test failed: {e}")
    finally:
        await client.close()


async def run_all_tests():
    """Run all RelayCore integration tests."""
    logger.info("=" * 60)
    logger.info("STARTING RELAYCORE INTEGRATION TESTS")
    logger.info("=" * 60)

    tests = [
        ("Configuration Test", test_configuration),
        ("RelayCore Client Test", test_relaycore_client),
        ("Enhanced AI Service Test", test_enhanced_ai_service),
        ("Migration Wrapper Test", test_migration_wrapper),
        ("Fallback Scenarios Test", test_fallback_scenarios),
    ]

    results = {}

    for test_name, test_func in tests:
        logger.info(f"\n--- {test_name} ---")
        try:
            await test_func()
            results[test_name] = "PASSED"
            logger.info(f"{test_name}: PASSED ✓")
        except Exception as e:
            results[test_name] = f"FAILED: {e}"
            logger.error(f"{test_name}: FAILED ✗ - {e}")

    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)

    for test_name, result in results.items():
        status = "✓" if result == "PASSED" else "✗"
        logger.info(f"{status} {test_name}: {result}")

    passed = sum(1 for r in results.values() if r == "PASSED")
    total = len(results)
    logger.info(f"\nOverall: {passed}/{total} tests passed")

    return results


if __name__ == "__main__":
    # Set environment variables for testing if not already set
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY not set - some tests may fail")

    if not os.getenv("RELAYCORE_API_KEY"):
        logger.info("RELAYCORE_API_KEY not set - using default configuration")

    # Run tests
    asyncio.run(run_all_tests())
