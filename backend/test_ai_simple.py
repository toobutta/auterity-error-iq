#!/usr/bin/env python3
"""Simple test script for AI service without pytest dependencies."""

import asyncio
import os
import sys
import traceback
from unittest.mock import AsyncMock, MagicMock, patch

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

# Mock openai module before importing
sys.modules["openai"] = MagicMock()
sys.modules["openai.RateLimitError"] = Exception
sys.modules["openai.APIError"] = Exception

from app.services.ai_service import (  # noqa: E402
    AIModelType,
    AIResponse,
    AIService,
    AIServiceError,
    PromptTemplate,
)


async def test_prompt_template():
    """Test prompt template functionality."""
    print("Testing PromptTemplate...")

    # Test basic template
    template = PromptTemplate(
        "Hello {name}, your order {order_id} is ready.",
        variables=["name", "order_id"]
    )

    result = template.format(name="John", order_id="12345")
    expected = "Hello John, your order 12345 is ready."
    assert result == expected, f"Expected '{expected}', got '{result}'"

    # Test missing variables
    try:
        template.format(name="John")
        assert False, "Should have raised AIServiceError"
    except AIServiceError as e:
        assert "Missing required variables" in str(e)

    print("✓ PromptTemplate tests passed")


async def test_ai_service_init():
    """Test AI service initialization."""
    print("Testing AIService initialization...")

    # Test with API key
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        with patch("services.ai_service.AsyncOpenAI"):
            service = AIService(
                model=AIModelType.GPT_4, max_retries=5, retry_delay=2.0
            )

            assert service.model == AIModelType.GPT_4
            assert service.max_retries == 5
            assert service.retry_delay == 2.0

    # Test without API key
    with patch.dict("os.environ", {}, clear=True):
        try:
            AIService()
            assert False, "Should have raised AIServiceError"
        except AIServiceError as e:
            assert "OpenAI API key not provided" in str(e)

    print("✓ AIService initialization tests passed")


async def test_ai_service_process_text():
    """Test AI service text processing."""
    print("Testing AIService.process_text...")

    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        with patch("services.ai_service.AsyncOpenAI") as mock_client_class:
            # Create mock client
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client

            # Mock OpenAI response
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "AI processed response"
            mock_response.choices[0].finish_reason = "stop"
            mock_response.usage = MagicMock()
            mock_response.usage.model_dump.return_value = {
                "total_tokens": 50
            }

            mock_client.chat.completions.create.return_value = mock_response

            # Create service and test
            service = AIService()
            result = await service.process_text("Test prompt")

            assert isinstance(result, AIResponse)
            assert result.content == "AI processed response"
            assert result.model == "gpt-3.5-turbo"
            assert result.usage == {"total_tokens": 50}
            assert result.finish_reason == "stop"
            assert result.is_success

    print("✓ AIService.process_text tests passed")


async def test_ai_service_templates():
    """Test AI service template processing."""
    print("Testing AIService template processing...")

    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        with patch("services.ai_service.AsyncOpenAI") as mock_client_class:
            # Create mock client
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client

            # Mock OpenAI response
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "Template response"
            mock_response.choices[0].finish_reason = "stop"
            mock_response.usage = None

            mock_client.chat.completions.create.return_value = mock_response

            # Create service and test
            service = AIService()

            # Test with customer inquiry template
            variables = {
                "inquiry": "What are your hours?",
                "context": "Dealership information",
            }

            result = await service.process_with_template(
                "customer_inquiry", variables
            )

            assert result.content == "Template response"
            assert result.is_success

            # Test with non-existent template
            try:
                await service.process_with_template(
                    "nonexistent", {"var": "value"}
                )
                assert False, "Should have raised AIServiceError"
            except AIServiceError as e:
                assert "Template 'nonexistent' not found" in str(e)

    print("✓ AIService template tests passed")


async def test_ai_response():
    """Test AIResponse functionality."""
    print("Testing AIResponse...")

    # Test successful response
    response = AIResponse(
        content="Test content",
        model="gpt-3.5-turbo",
        usage={"total_tokens": 50},
        finish_reason="stop",
    )

    assert response.content == "Test content"
    assert response.model == "gpt-3.5-turbo"
    assert response.usage == {"total_tokens": 50}
    assert response.finish_reason == "stop"
    assert response.error is None
    assert response.is_success

    # Test error response
    error_response = AIResponse(
        content="", model="gpt-3.5-turbo", error="API error occurred"
    )

    assert error_response.content == ""
    assert error_response.error == "API error occurred"
    assert not error_response.is_success

    print("✓ AIResponse tests passed")


async def main():
    """Run all tests."""
    print("Running AI Service tests...\n")

    try:
        await test_prompt_template()
        await test_ai_service_init()
        await test_ai_service_process_text()
        await test_ai_service_templates()
        await test_ai_response()

        print("\n🎉 All tests passed!")
        return 0

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
