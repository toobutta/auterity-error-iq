"""Tests for the LiteLLM service."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.litellm_service import (
    LiteLLMService,
    get_litellm_service,
    set_litellm_service,
)


@pytest.fixture
def mock_acompletion():
    """Mock the litellm.acompletion function."""
    with patch("app.services.litellm_service.acompletion") as mock:
        # Create a mock response
        mock_choice = MagicMock()
        mock_choice.message.content = "Test response"
        mock_choice.finish_reason = "stop"

        mock_usage = MagicMock()
        mock_usage.model_dump.return_value = {
            "prompt_tokens": 10,
            "completion_tokens": 20,
            "total_tokens": 30,
        }

        mock_response = MagicMock()
        mock_response.choices = [mock_choice]
        mock_response.usage = mock_usage

        mock.return_value = mock_response
        yield mock


@pytest.fixture
def litellm_service():
    """Create a LiteLLMService with mocked config loading."""
    with patch("app.services.litellm_service.yaml.safe_load") as mock_yaml:
        # Mock the YAML config
        mock_yaml.return_value = {
            "models": [
                {
                    "name": "gpt-3.5-turbo",
                    "provider": "openai",
                    "max_tokens": 4096,
                    "capabilities": ["text", "chat"],
                },
                {
                    "name": "gpt-4",
                    "provider": "openai",
                    "max_tokens": 8192,
                    "capabilities": ["text", "chat", "reasoning"],
                },
            ]
        }

        with patch(
            "app.services.litellm_service.Path.exists", return_value=True
        ):
            with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
                service = LiteLLMService(config_path="dummy_path")
                yield service


@pytest.mark.asyncio
async def test_make_completion(litellm_service, mock_acompletion):
    """Test making a completion call."""
    # Arrange
    messages = [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello"},
    ]

    # Act
    response = await litellm_service.make_completion(
        messages=messages, model="gpt-3.5-turbo", temperature=0.7
    )

    # Assert
    assert response.content == "Test response"
    assert response.model == "gpt-3.5-turbo"
    assert response.is_success is True

    # Verify acompletion was called correctly
    mock_acompletion.assert_called_once()
    args, kwargs = mock_acompletion.call_args

    assert kwargs["model"] == "gpt-3.5-turbo"
    assert kwargs["messages"] == messages
    assert kwargs["temperature"] == 0.7


@pytest.mark.asyncio
async def test_make_completion_with_fallback(
    litellm_service, mock_acompletion
):
    """Test completion with fallback when primary model fails."""
    # Arrange
    messages = [{"role": "user", "content": "Hello"}]

    # Make the first call fail, then succeed
    mock_acompletion.side_effect = [
        Exception("Model unavailable"),  # First call fails
        MagicMock(  # Second call succeeds with fallback model
            choices=[
                MagicMock(
                    message=MagicMock(content="Fallback response"),
                    finish_reason="stop",
                )
            ],
            usage=MagicMock(model_dump=lambda: {"total_tokens": 15}),
        ),
    ]

    # Set up fallback models
    litellm_service.fallback_models = {"gpt-4": ["gpt-3.5-turbo"]}

    # Act
    response = await litellm_service.make_completion(
        messages=messages, model="gpt-4", use_fallbacks=True
    )

    # Assert
    assert response.content == "Fallback response"
    assert mock_acompletion.call_count == 2


def test_get_available_models(litellm_service):
    """Test getting available models."""
    # Act
    models = litellm_service.get_available_models()

    # Assert
    assert len(models) >= 2  # Allow for more models than expected
    model_names = [model.name for model in models]
    assert "gpt-3.5-turbo" in model_names
    assert "gpt-4" in model_names


def test_get_model_by_capability(litellm_service):
    """Test getting models by capability."""
    # Act
    reasoning_models = litellm_service.get_model_by_capability("reasoning")
    chat_models = litellm_service.get_model_by_capability("chat")

    # Assert
    assert len(reasoning_models) == 1
    assert reasoning_models[0].name == "gpt-4"

    assert len(chat_models) == 2
    assert chat_models[0].name == "gpt-3.5-turbo"
    assert chat_models[1].name == "gpt-4"


def test_get_set_litellm_service():
    """Test getting and setting the global LiteLLM service instance."""
    # Arrange
    service = MagicMock(spec=LiteLLMService)

    # Act
    set_litellm_service(service)
    retrieved_service = get_litellm_service()

    # Assert
    assert retrieved_service is service
