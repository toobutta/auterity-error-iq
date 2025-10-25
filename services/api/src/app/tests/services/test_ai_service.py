"""Tests for the AI service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.exceptions import AIServiceError
from app.services.ai_service import (
    AIResponse,
    AIService,
    PromptTemplate,
    get_ai_service,
    set_ai_service,
)
from app.services.litellm_service import LiteLLMService


@pytest.fixture
def mock_litellm_service():
    """Create a mock LiteLLMService."""
    mock_service = MagicMock(spec=LiteLLMService)
    mock_service.make_completion = AsyncMock()
    mock_service.make_completion.return_value = AIResponse(
        content="Test response",
        model="gpt-3.5-turbo",
        usage={
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30,
        },
        finish_reason="stop",
    )
    return mock_service


@pytest.fixture
def ai_service(mock_litellm_service):
    """Create an AIService with a mock LiteLLMService."""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        return AIService(litellm_service=mock_litellm_service)


@pytest.mark.asyncio
async def test_process_text(ai_service, mock_litellm_service):
    """Test processing text with the AI service."""
    # Arrange
    prompt = "Test prompt"
    context = {"key": "value"}

    # Act
    response = await ai_service.process_text(prompt, context)

    # Assert
    assert response.content == "Test response"
    assert response.model == "gpt-3.5-turbo"
    assert response.is_success is True

    # Verify LiteLLM service was called correctly
    mock_litellm_service.make_completion.assert_called_once()
    args, kwargs = mock_litellm_service.make_completion.call_args

    assert kwargs["model"] == "gpt-3.5-turbo"
    assert len(kwargs["messages"]) == 3  # System, user, and context messages
    assert kwargs["messages"][1]["content"] == prompt
    assert "Additional context" in kwargs["messages"][2]["content"]


@pytest.mark.asyncio
async def test_process_with_template(ai_service, mock_litellm_service):
    """Test processing with a template."""
    # Arrange
    template_name = "customer_inquiry"
    variables = {
        "inquiry": "When are you open?",
        "context": "Dealership hours are 9-5 M-F",
    }

    # Act
    response = await ai_service.process_with_template(
        template_name=template_name, variables=variables
    )

    # Assert
    assert response.content == "Test response"

    # Verify LiteLLM service was called with correct prompt
    mock_litellm_service.make_completion.assert_called_once()
    args, kwargs = mock_litellm_service.make_completion.call_args

    # Check that template was properly formatted
    assert "When are you open?" in kwargs["messages"][1]["content"]
    assert "Dealership hours are 9-5 M-F" in kwargs["messages"][1]["content"]


def test_prompt_template_format():
    """Test formatting a prompt template."""
    # Arrange
    template = PromptTemplate(
        "Hello {name}, welcome to {place}!", variables=["name", "place"]
    )

    # Act
    result = template.format(name="John", place="Earth")

    # Assert
    assert result == "Hello John, welcome to Earth!"


def test_prompt_template_missing_variables():
    """Test prompt template with missing variables."""
    # Arrange
    template = PromptTemplate(
        "Hello {name}, welcome to {place}!", variables=["name", "place"]
    )

    # Act & Assert
    with pytest.raises(AIServiceError):
        template.format(name="John")


def test_get_set_ai_service(mock_litellm_service):
    """Test getting and setting the global AI service instance."""
    # Arrange
    with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
        service = AIService(litellm_service=mock_litellm_service)

    # Act
    set_ai_service(service)
    retrieved_service = get_ai_service()

    # Assert
    assert retrieved_service is service
