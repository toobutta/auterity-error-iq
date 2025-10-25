"""AI service for workflow processing using LiteLLM for multi-model support."""

import json
import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

from app.exceptions import AIServiceError
from app.services.litellm_service import LiteLLMService, get_litellm_service

logger = logging.getLogger(__name__)


class AIModelType(Enum):
    """Supported AI model types."""

    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"


@dataclass
class AIResponse:
    """Container for AI service responses."""

    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    finish_reason: Optional[str] = None
    error: Optional[str] = None

    @property
    def is_success(self) -> bool:
        """Check if the response was successful."""
        return self.error is None


class PromptTemplate:
    """Template system for consistent AI interactions."""

    def __init__(self, template: str, variables: Optional[List[str]] = None):
        """
        Initialize a prompt template.

        Args:
            template: Template string with {variable} placeholders
            variables: List of expected variable names
        """
        self.template = template
        self.variables = variables or []

    def format(self, **kwargs) -> str:
        """
        Format the template with provided variables.

        Args:
            **kwargs: Variable values to substitute

        Returns:
            Formatted prompt string

        Raises:
            AIServiceError: If required variables are missing
        """
        try:
            # Check for required variables
            missing_vars = [var for var in self.variables if var not in kwargs]
            if missing_vars:
                raise AIServiceError(
                    f"Missing required variables: {missing_vars}"
                )

            return self.template.format(**kwargs)
        except KeyError as e:
            raise AIServiceError(f"Template formatting error: {e}")


class AIService:
    """Service for AI-powered workflow processing."""

    # Default prompt templates for common workflow operations
    DEFAULT_TEMPLATES = {
        "customer_inquiry": PromptTemplate(
            "You are a helpful automotive dealership assistant. "
            "A customer has submitted the following inquiry: '{inquiry}'. "
            "Please provide a professional and helpful response that "
            "addresses their needs. Context: {context}",
            variables=["inquiry", "context"],
        ),
        "lead_qualification": PromptTemplate(
            "Analyze the following customer information and determine their "
            "qualification level for automotive sales. Customer info: "
            "{customer_info}. Provide a qualification score (1-10) and reasoning.",
            variables=["customer_info"],
        ),
        "service_recommendation": PromptTemplate(
            "Based on the vehicle information and customer concerns, "
            "recommend appropriate service actions. Vehicle: {vehicle_info}, "
            "Concerns: {concerns}. Provide specific recommendations and "
            "estimated costs if applicable.",
            variables=["vehicle_info", "concerns"],
        ),
        "generic_processing": PromptTemplate(
            "Process the following data according to the instructions: "
            "{instructions}. Data: {data}. Provide a structured response.",
            variables=["instructions", "data"],
        ),
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: AIModelType = AIModelType.GPT_3_5_TURBO,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        litellm_service: Optional[LiteLLMService] = None,
    ):
        """
        Initialize the AI service.

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            model: AI model to use
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
            litellm_service: LiteLLMService instance (uses global instance if None)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise AIServiceError("OpenAI API key not provided")

        self.model = model
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        # Use provided LiteLLM service or get global instance
        self.litellm_service = litellm_service or get_litellm_service()

        self.logger = logging.getLogger(__name__)

    async def process_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: Optional[AIModelType] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AIResponse:
        """
        Process text using AI model.

        Args:
            prompt: Text prompt to process
            context: Optional context data
            model: AI model to use (defaults to instance model)
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens in response

        Returns:
            AIResponse containing the processed result
        """
        model_name = (model or self.model).value
        context = context or {}

        self.logger.info(f"Processing text with model {model_name}")

        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant for automotive dealership workflows.",
            },
            {"role": "user", "content": prompt},
        ]

        # Add context if provided
        if context:
            context_str = (
                f"Additional context: {json.dumps(context, indent=2)}"
            )
            messages.append({"role": "system", "content": context_str})

        # Use LiteLLM service for API call
        return await self.litellm_service.make_completion(
            messages=messages,
            model=model_name,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def process_with_template(
        self,
        template_name: str,
        variables: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        model: Optional[AIModelType] = None,
    ) -> AIResponse:
        """
        Process text using a predefined template.

        Args:
            template_name: Name of the template to use
            variables: Variables to substitute in template
            context: Optional context data
            model: AI model to use

        Returns:
            AIResponse containing the processed result

        Raises:
            AIServiceError: If template not found or variables missing
        """
        if template_name not in self.DEFAULT_TEMPLATES:
            raise AIServiceError(f"Template '{template_name}' not found")

        template = self.DEFAULT_TEMPLATES[template_name]
        prompt = template.format(**variables)

        return await self.process_text(
            prompt=prompt, context=context, model=model
        )

    async def validate_response(
        self,
        response: str,
        schema: Optional[Dict[str, Any]] = None,
        required_fields: Optional[List[str]] = None,
    ) -> bool:
        """
        Validate AI response against schema or required fields.

        Args:
            response: AI response to validate
            schema: JSON schema for validation
            required_fields: List of required fields in JSON response

        Returns:
            True if response is valid, False otherwise
        """
        try:
            # Try to parse as JSON if schema or required fields specified
            if schema or required_fields:
                try:
                    parsed_response = json.loads(response)
                except json.JSONDecodeError:
                    self.logger.warning("Response is not valid JSON")
                    return False

                # Check required fields
                if required_fields:
                    missing_fields = [
                        field
                        for field in required_fields
                        if field not in parsed_response
                    ]
                    if missing_fields:
                        self.logger.warning(
                            f"Missing required fields: {missing_fields}"
                        )
                        return False

                # TODO: Implement JSON schema validation if needed
                # For MVP, we'll just check required fields

            return True

        except Exception as e:
            self.logger.error(f"Response validation error: {e}")
            return False

    def add_custom_template(self, name: str, template: PromptTemplate) -> None:
        """
        Add a custom prompt template.

        Args:
            name: Template name
            template: PromptTemplate instance
        """
        self.DEFAULT_TEMPLATES[name] = template
        self.logger.info(f"Added custom template: {name}")

    def get_available_templates(self) -> List[str]:
        """Get list of available template names."""
        return list(self.DEFAULT_TEMPLATES.keys())

    def get_available_models(self) -> List[str]:
        """Get list of available model names."""
        models = self.litellm_service.get_available_models()
        return [model.name for model in models]


# Global AI service instance
_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
    """
    Get the global AI service instance.

    Returns:
        AIService instance
    """
    global _ai_service_instance

    if _ai_service_instance is None:
        _ai_service_instance = AIService()

    return _ai_service_instance


def set_ai_service(service: AIService) -> None:
    """
    Set the global AI service instance (useful for testing).

    Args:
        service: AIService instance to set
    """
    global _ai_service_instance
    _ai_service_instance = service
