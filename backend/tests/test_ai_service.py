"""Tests for AI service functionality."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.ai_service import (
    AIModelType,
    AIResponse,
    AIService,
    AIServiceError,
    PromptTemplate,
    get_ai_service,
    set_ai_service,
)
from openai import APIError, RateLimitError


class TestPromptTemplate:
    """Test prompt template functionality."""

    def test_template_creation(self):
        """Test creating a prompt template."""
        template = PromptTemplate(
            "Hello {name}, your order {order_id} is ready.",
            variables=["name", "order_id"],
        )

        assert template.template == "Hello {name}, your order {order_id} is ready."
        assert template.variables == ["name", "order_id"]

    def test_template_formatting_success(self):
        """Test successful template formatting."""
        template = PromptTemplate(
            "Hello {name}, your order {order_id} is ready.",
            variables=["name", "order_id"],
        )

        result = template.format(name="John", order_id="12345")
        assert result == "Hello John, your order 12345 is ready."

    def test_template_formatting_missing_variables(self):
        """Test template formatting with missing variables."""
        template = PromptTemplate(
            "Hello {name}, your order {order_id} is ready.",
            variables=["name", "order_id"],
        )

        with pytest.raises(AIServiceError, match="Missing required variables"):
            template.format(name="John")

    def test_template_formatting_extra_variables(self):
        """Test template formatting with extra variables."""
        template = PromptTemplate("Hello {name}!", variables=["name"])

        result = template.format(name="John", extra="ignored")
        assert result == "Hello John!"


class TestAIService:
    """Test AI service functionality."""

    @pytest.fixture
    def mock_openai_client(self):
        """Mock OpenAI client."""
        with patch("app.services.ai_service.AsyncOpenAI") as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            yield mock_client

    @pytest.fixture
    def ai_service(self, mock_openai_client):
        """Create AI service instance with mocked client."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            service = AIService()
            service.client = mock_openai_client
            return service

    def test_ai_service_initialization(self):
        """Test AI service initialization."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            service = AIService(model=AIModelType.GPT_4, max_retries=5, retry_delay=2.0)

            assert service.model == AIModelType.GPT_4
            assert service.max_retries == 5
            assert service.retry_delay == 2.0

    def test_ai_service_no_api_key(self):
        """Test AI service initialization without API key."""
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(AIServiceError, match="OpenAI API key not provided"):
                AIService()

    @pytest.mark.asyncio
    async def test_process_text_success(self, ai_service, mock_openai_client):
        """Test successful text processing."""
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "AI processed response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage = MagicMock()
        mock_response.usage.model_dump.return_value = {"total_tokens": 50}

        mock_openai_client.chat.completions.create.return_value = mock_response

        # Test the method
        result = await ai_service.process_text("Test prompt")

        assert isinstance(result, AIResponse)
        assert result.content == "AI processed response"
        assert result.model == "gpt-3.5-turbo"
        assert result.usage == {"total_tokens": 50}
        assert result.finish_reason == "stop"
        assert result.is_success

        # Verify API call
        mock_openai_client.chat.completions.create.assert_called_once()
        call_args = mock_openai_client.chat.completions.create.call_args
        assert call_args[1]["model"] == "gpt-3.5-turbo"
        assert call_args[1]["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_process_text_with_context(self, ai_service, mock_openai_client):
        """Test text processing with context."""
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Response with context"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage = None

        mock_openai_client.chat.completions.create.return_value = mock_response

        # Test with context
        context = {"customer_id": "12345", "vehicle": "Toyota Camry"}
        result = await ai_service.process_text("Test prompt", context=context)

        assert result.content == "Response with context"
        assert result.is_success

        # Verify context was included in messages
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args[1]["messages"]
        assert len(messages) == 3  # system, user, context
        assert "Additional context" in messages[2]["content"]

    @pytest.mark.asyncio
    async def test_process_with_template_success(self, ai_service, mock_openai_client):
        """Test processing with predefined template."""
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Template response"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage = None

        mock_openai_client.chat.completions.create.return_value = mock_response

        # Test with customer inquiry template
        variables = {
            "inquiry": "What are your hours?",
            "context": "Dealership information",
        }

        result = await ai_service.process_with_template("customer_inquiry", variables)

        assert result.content == "Template response"
        assert result.is_success

        # Verify the template was used
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args[1]["messages"]
        user_message = messages[1]["content"]
        assert "What are your hours?" in user_message
        assert "Dealership information" in user_message

    @pytest.mark.asyncio
    async def test_process_with_template_not_found(self, ai_service):
        """Test processing with non-existent template."""
        with pytest.raises(AIServiceError, match="Template 'nonexistent' not found"):
            await ai_service.process_with_template("nonexistent", {"var": "value"})

    @pytest.mark.asyncio
    async def test_process_with_template_missing_variables(self, ai_service):
        """Test processing with template missing variables."""
        with pytest.raises(AIServiceError, match="Missing required variables"):
            await ai_service.process_with_template(
                "customer_inquiry", {"inquiry": "Test"}  # Missing 'context'
            )

    @pytest.mark.asyncio
    async def test_api_call_rate_limit_retry(self, ai_service, mock_openai_client):
        """Test retry logic for rate limit errors."""
        # Mock rate limit error then success
        rate_limit_error = RateLimitError(
            message="Rate limit exceeded", response=MagicMock(), body={}
        )

        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = "Success after retry"
        mock_response.choices[0].finish_reason = "stop"
        mock_response.usage = None

        mock_openai_client.chat.completions.create.side_effect = [
            rate_limit_error,
            mock_response,
        ]

        # Test with short retry delay
        ai_service.retry_delay = 0.01
        result = await ai_service.process_text("Test prompt")

        assert result.content == "Success after retry"
        assert result.is_success
        assert mock_openai_client.chat.completions.create.call_count == 2

    @pytest.mark.asyncio
    async def test_api_call_max_retries_exceeded(self, ai_service, mock_openai_client):
        """Test behavior when max retries are exceeded."""
        # Mock persistent API error
        api_error = APIError(message="API error", request=MagicMock(), body={})

        mock_openai_client.chat.completions.create.side_effect = api_error

        # Test with short retry delay and low max retries
        ai_service.retry_delay = 0.01
        ai_service.max_retries = 1

        result = await ai_service.process_text("Test prompt")

        assert not result.is_success
        assert "failed after 2 attempts" in result.error
        assert mock_openai_client.chat.completions.create.call_count == 2

    @pytest.mark.asyncio
    async def test_validate_response_json_success(self, ai_service):
        """Test successful JSON response validation."""
        json_response = json.dumps({"result": "success", "data": {"key": "value"}})

        is_valid = await ai_service.validate_response(
            json_response, required_fields=["result", "data"]
        )

        assert is_valid

    @pytest.mark.asyncio
    async def test_validate_response_missing_fields(self, ai_service):
        """Test JSON response validation with missing fields."""
        json_response = json.dumps(
            {
                "result": "success"
                # Missing "data" field
            }
        )

        is_valid = await ai_service.validate_response(
            json_response, required_fields=["result", "data"]
        )

        assert not is_valid

    @pytest.mark.asyncio
    async def test_validate_response_invalid_json(self, ai_service):
        """Test response validation with invalid JSON."""
        invalid_json = "This is not JSON"

        is_valid = await ai_service.validate_response(
            invalid_json, required_fields=["result"]
        )

        assert not is_valid

    @pytest.mark.asyncio
    async def test_validate_response_no_validation(self, ai_service):
        """Test response validation with no validation criteria."""
        response = "Any text response"

        is_valid = await ai_service.validate_response(response)

        assert is_valid

    def test_add_custom_template(self, ai_service):
        """Test adding custom template."""
        custom_template = PromptTemplate(
            "Custom template with {variable}", variables=["variable"]
        )

        ai_service.add_custom_template("custom", custom_template)

        assert "custom" in ai_service.DEFAULT_TEMPLATES
        assert ai_service.DEFAULT_TEMPLATES["custom"] == custom_template

    def test_get_available_templates(self, ai_service):
        """Test getting available template names."""
        templates = ai_service.get_available_templates()

        assert isinstance(templates, list)
        assert "customer_inquiry" in templates
        assert "lead_qualification" in templates
        assert "service_recommendation" in templates
        assert "generic_processing" in templates


class TestAIServiceGlobal:
    """Test global AI service functions."""

    def test_get_ai_service_singleton(self):
        """Test that get_ai_service returns singleton."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            service1 = get_ai_service()
            service2 = get_ai_service()

            assert service1 is service2

    def test_set_ai_service(self):
        """Test setting custom AI service instance."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            custom_service = AIService()
            set_ai_service(custom_service)

            retrieved_service = get_ai_service()
            assert retrieved_service is custom_service


class TestAIResponse:
    """Test AIResponse functionality."""

    def test_ai_response_success(self):
        """Test successful AI response."""
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

    def test_ai_response_error(self):
        """Test AI response with error."""
        response = AIResponse(
            content="", model="gpt-3.5-turbo", error="API error occurred"
        )

        assert response.content == ""
        assert response.error == "API error occurred"
        assert not response.is_success
