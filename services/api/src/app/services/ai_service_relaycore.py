"""Enhanced AI service with RelayCore integration and fallback support."""

import asyncio
import json
import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional

import openai
from openai import AsyncOpenAI

from app.exceptions import AIServiceError
from app.services.relaycore_client import RelayCoreChatClient, get_relaycore_client

logger = logging.getLogger(__name__)

# Constants
RELAYCORE_SOURCE = "relaycore"
DIRECT_SOURCE = "direct"
DEFAULT_SYSTEM_MESSAGE = (
    "You are a helpful AI assistant for automotive dealership workflows."
)


class AIModelType(Enum):
    """Supported AI model types."""

    GPT_3_5_TURBO = "gpt-3.5-turbo"
    GPT_4 = "gpt-4"
    GPT_4_TURBO = "gpt-4-turbo-preview"
    CLAUDE_3_HAIKU = "claude-3-haiku"
    CLAUDE_3_SONNET = "claude-3-sonnet"


@dataclass
class AIResponse:
    """Container for AI service responses."""

    content: str
    model: str
    usage: Optional[Dict[str, Any]] = None
    finish_reason: Optional[str] = None
    cost: Optional[float] = None
    provider: Optional[str] = None
    error: Optional[str] = None
    source: str = "relaycore"  # "relaycore" or "direct"

    @property
    def is_success(self) -> bool:
        """Check if the response was successful."""
        return self.error is None


class PromptTemplate:
    """Template system for consistent AI interactions."""

    def __init__(self, template: str, variables: Optional[List[str]] = None):
        self.template = template
        self.variables = variables or []

    def format(self, **kwargs) -> str:
        try:
            missing_vars = [var for var in self.variables if var not in kwargs]
            if missing_vars:
                raise AIServiceError(
                    f"Missing required variables: {missing_vars}"
                )
            return self.template.format(**kwargs)
        except KeyError as e:
            raise AIServiceError(f"Template formatting error: {e}")


class EnhancedAIService:
    """Enhanced AI service with RelayCore integration and intelligent fallback."""

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
        relaycore_client: Optional[RelayCoreChatClient] = None,
        openai_api_key: Optional[str] = None,
        model: AIModelType = AIModelType.GPT_3_5_TURBO,
        max_retries: int = 3,
        retry_delay: float = 1.0,
        use_relaycore: bool = True,
        cost_limit_per_request: float = 0.10,
    ):
        """
        Initialize the enhanced AI service.

        Args:
            relaycore_client: RelayCore client instance
            openai_api_key: OpenAI API key for fallback
            model: Default AI model to use
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
            use_relaycore: Whether to use RelayCore by default
            cost_limit_per_request: Maximum cost per request
        """
        self.model = model
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.use_relaycore = use_relaycore
        self.cost_limit_per_request = cost_limit_per_request

        # Initialize RelayCore client
        if relaycore_client:
            self.relaycore_client = relaycore_client
        else:
            self.relaycore_client = get_relaycore_client()

        # Initialize direct OpenAI client for fallback
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.openai_client = AsyncOpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None

        self.logger = logging.getLogger(__name__)

    async def process_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: Optional[AIModelType] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        user_id: Optional[str] = None,
        force_direct: bool = False,
    ) -> AIResponse:
        """
        Process text using AI model with RelayCore integration.

        Args:
            prompt: Text prompt to process
            context: Optional context data
            model: AI model to use (defaults to instance model)
            temperature: Sampling temperature (0.0 to 2.0)
            max_tokens: Maximum tokens in response
            user_id: User identifier for tracking
            force_direct: Force direct OpenAI call (bypass RelayCore)

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
                "content": "You are a helpful AI assistant for automotive "
                "dealership workflows.",
            },
            {"role": "user", "content": prompt},
        ]

        # Add context if provided
        if context:
            context_str = (
                f"Additional context: {json.dumps(context, indent=2)}"
            )
            messages.append({"role": "system", "content": context_str})

        # Choose processing method
        if self.use_relaycore and not force_direct:
            return await self._process_with_relaycore(
                messages=messages,
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                user_id=user_id,
            )
        else:
            return await self._process_with_openai_direct(
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
        user_id: Optional[str] = None,
    ) -> AIResponse:
        """
        Process text using a predefined template.

        Args:
            template_name: Name of the template to use
            variables: Variables to substitute in template
            context: Optional context data
            model: AI model to use
            user_id: User identifier for tracking

        Returns:
            AIResponse containing the processed result
        """
        if template_name not in self.DEFAULT_TEMPLATES:
            raise AIServiceError(f"Template '{template_name}' not found")

        template = self.DEFAULT_TEMPLATES[template_name]
        prompt = template.format(**variables)

        return await self.process_text(
            prompt=prompt, context=context, model=model, user_id=user_id
        )

    async def _process_with_relaycore(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> AIResponse:
        """Process request using RelayCore."""
        try:
            response = await self.relaycore_client.chat_completion(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                user_id=user_id,
                cost_limit=self.cost_limit_per_request,
            )

            if response.is_success:
                self.logger.info(
                    f"RelayCore request successful, cost: {response.cost}"
                )
                return AIResponse(
                    content=response.content,
                    model=response.model,
                    usage=response.usage,
                    finish_reason=response.finish_reason,
                    cost=response.cost,
                    provider=response.provider,
                    source="relaycore",
                )
            else:
                self.logger.warning(
                    f"RelayCore request failed: {response.error}"
                )
                # Fallback to direct OpenAI
                return await self._process_with_openai_direct(
                    messages=messages,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

        except Exception as e:
            self.logger.error(f"RelayCore processing error: {e}")
            # Fallback to direct OpenAI
            return await self._process_with_openai_direct(
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
            )

    async def _process_with_openai_direct(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AIResponse:
        """Process request using direct OpenAI API."""
        if not self.openai_client:
            return AIResponse(
                content="",
                model=model,
                error="No OpenAI client available for fallback",
                source="direct",
            )

        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                self.logger.debug(f"Direct OpenAI call attempt {attempt + 1}")

                response = await self.openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                choice = response.choices[0]
                content = choice.message.content

                self.logger.info("Direct OpenAI API call successful")

                return AIResponse(
                    content=content,
                    model=model,
                    usage=response.usage.model_dump()
                    if response.usage
                    else None,
                    finish_reason=choice.finish_reason,
                    source="direct",
                )

            except openai.RateLimitError as e:
                last_error = e
                self.logger.warning(
                    f"Rate limit error on attempt {attempt + 1}: {e}"
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay * (2**attempt))
                    continue

            except openai.APIError as e:
                last_error = e
                self.logger.exception(
                    f"OpenAI API error on attempt {attempt + 1}: {e}"
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)
                    continue

            except Exception as e:
                last_error = e
                self.logger.error(
                    f"Unexpected error on attempt {attempt + 1}: {e}"
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)
                    continue

        error_msg = (
            f"Direct OpenAI call failed after {self.max_retries + 1} attempts: "
            f"{last_error}"
        )
        self.logger.error(error_msg)

        return AIResponse(
            content="", model=model, error=error_msg, source="direct"
        )

    async def get_usage_metrics(
        self, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get usage metrics from RelayCore."""
        try:
            return await self.relaycore_client.get_usage_metrics(
                user_id=user_id
            )
        except Exception as e:
            self.logger.error(f"Error getting usage metrics: {e}")
            return {}

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available models from RelayCore."""
        try:
            return await self.relaycore_client.get_available_models()
        except Exception as e:
            self.logger.error(f"Error getting available models: {e}")
            return []

    async def health_check(self) -> Dict[str, bool]:
        """Check health of both RelayCore and direct OpenAI."""
        health_status = {"relaycore": False, "openai_direct": False}

        # Check RelayCore
        try:
            health_status[
                "relaycore"
            ] = await self.relaycore_client.health_check()
        except Exception as e:
            self.logger.error(f"RelayCore health check error: {e}")

        # Check direct OpenAI
        if self.openai_client:
            try:
                # Simple test request
                await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "test"}],
                    max_tokens=1,
                )
                health_status["openai_direct"] = True
            except Exception as e:
                self.logger.error(f"OpenAI direct health check error: {e}")

        return health_status

    def add_custom_template(self, name: str, template: PromptTemplate) -> None:
        """Add a custom prompt template."""
        self.DEFAULT_TEMPLATES[name] = template
        self.logger.info(f"Added custom template: {name}")

    def get_available_templates(self) -> List[str]:
        """Get list of available template names."""
        return list(self.DEFAULT_TEMPLATES.keys())

    async def close(self):
        """Close all client connections."""
        if self.relaycore_client:
            await self.relaycore_client.close()
        if self.openai_client:
            await self.openai_client.close()


# Global enhanced AI service instance
_enhanced_ai_service_instance: Optional[EnhancedAIService] = None


def get_enhanced_ai_service() -> EnhancedAIService:
    """Get the global enhanced AI service instance."""
    global _enhanced_ai_service_instance

    if _enhanced_ai_service_instance is None:
        _enhanced_ai_service_instance = EnhancedAIService()

    return _enhanced_ai_service_instance


def set_enhanced_ai_service(service: EnhancedAIService) -> None:
    """Set the global enhanced AI service instance."""
    global _enhanced_ai_service_instance
    _enhanced_ai_service_instance = service
