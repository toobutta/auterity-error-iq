"""LiteLLM integration service for multi-model support."""

import asyncio
import logging
import os

# Avoid circular import - define AIResponse locally
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

import litellm
from litellm import ModelResponse, acompletion
from litellm.exceptions import APIError, RateLimitError, ServiceUnavailableError


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


class ModelProvider(Enum):
    """Supported model providers."""

    OPENAI = "openai"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"


@dataclass
class ModelConfig:
    """Configuration for a specific model."""

    name: str
    provider: ModelProvider
    endpoint: Optional[str] = None
    api_key: Optional[str] = None
    max_tokens: Optional[int] = None
    cost_per_token: Optional[float] = None
    capabilities: List[str] = field(default_factory=list)
    is_available: bool = True


class LiteLLMService:
    """Multi-model service using LiteLLM for routing."""

    DEFAULT_CONFIG_PATH = "config/models.yaml"

    def __init__(
        self,
        config_path: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ):
        """
        Initialize LiteLLM service with model configurations.

        Args:
            config_path: Path to model configuration YAML
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
        """
        self.logger = logging.getLogger(__name__)
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        # Load model configurations
        config_path = config_path or os.getenv(
            "MODEL_CONFIG_PATH", self.DEFAULT_CONFIG_PATH
        )
        self.models: Dict[str, ModelConfig] = {}
        self._load_model_configs(config_path)

        # Set up LiteLLM
        litellm.set_verbose = False

        # Configure fallback models
        self.fallback_models = {
            "openai/gpt-4": ["openai/gpt-3.5-turbo"],
            "anthropic/claude-2": ["anthropic/claude-instant-1"],
        }

    def _load_model_configs(self, config_path: str) -> None:
        """
        Load model configurations from YAML file.

        Args:
            config_path: Path to configuration file
        """
        try:
            if Path(config_path).exists():
                with open(config_path, "r") as f:
                    config_data = yaml.safe_load(f)

                for model_data in config_data.get("models", []):
                    model_config = ModelConfig(
                        name=model_data["name"],
                        provider=ModelProvider(model_data["provider"]),
                        endpoint=model_data.get("endpoint"),
                        api_key=model_data.get("api_key")
                        or os.getenv(
                            f"{model_data['provider'].upper()}_API_KEY"
                        ),
                        max_tokens=model_data.get("max_tokens"),
                        cost_per_token=model_data.get("cost_per_token"),
                        capabilities=model_data.get("capabilities", []),
                        is_available=model_data.get("is_available", True),
                    )
                    self.models[model_config.name] = model_config

                self.logger.info(
                    f"Loaded {len(self.models)} model configurations"
                )
            else:
                self.logger.warning(
                    f"Model configuration file not found: {config_path}"
                )
                # Set up default models
                self._setup_default_models()
        except Exception as e:
            self.logger.error(f"Error loading model configurations: {e}")
            # Set up default models as fallback
            self._setup_default_models()

    def _setup_default_models(self) -> None:
        """Set up default model configurations."""
        default_models = [
            ModelConfig(
                name="gpt-3.5-turbo",
                provider=ModelProvider.OPENAI,
                api_key=os.getenv("OPENAI_API_KEY"),
                max_tokens=4096,
                cost_per_token=0.000002,
                capabilities=["text", "chat", "function_calling"],
            ),
            ModelConfig(
                name="gpt-4",
                provider=ModelProvider.OPENAI,
                api_key=os.getenv("OPENAI_API_KEY"),
                max_tokens=8192,
                cost_per_token=0.00003,
                capabilities=["text", "chat", "function_calling", "reasoning"],
            ),
            ModelConfig(
                name="gpt-4-turbo-preview",
                provider=ModelProvider.OPENAI,
                api_key=os.getenv("OPENAI_API_KEY"),
                max_tokens=4096,
                cost_per_token=0.00001,
                capabilities=["text", "chat", "function_calling", "reasoning"],
            ),
        ]

        for model in default_models:
            self.models[model.name] = model

        self.logger.info("Set up default model configurations")

    async def make_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        use_fallbacks: bool = True,
        **kwargs,
    ) -> AIResponse:
        """
        Make completion call through LiteLLM with fallback logic.

        Args:
            messages: List of message dictionaries
            model: Model name to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            use_fallbacks: Whether to try fallback models on failure
            **kwargs: Additional parameters to pass to LiteLLM

        Returns:
            AIResponse containing the result
        """
        last_error = None
        tried_models = []

        # Prepare models to try (primary + fallbacks if enabled)
        models_to_try = [model]
        if use_fallbacks and model in self.fallback_models:
            models_to_try.extend(self.fallback_models[model])

        for current_model in models_to_try:
            tried_models.append(current_model)

            # Get model config if available
            model_config = self.models.get(current_model)
            if model_config and not model_config.is_available:
                self.logger.warning(
                    f"Model {current_model} is marked as unavailable, skipping"
                )
                continue

            # Set model-specific parameters
            if model_config:
                if not max_tokens and model_config.max_tokens:
                    max_tokens = model_config.max_tokens

            # Try with retries
            for attempt in range(self.max_retries + 1):
                try:
                    self.logger.debug(
                        f"API call to {current_model}, attempt {attempt + 1}/{self.max_retries + 1}"
                    )

                    # Make the API call through LiteLLM
                    response: ModelResponse = await acompletion(
                        model=current_model,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                        **kwargs,
                    )

                    # Extract response data
                    choice = response.choices[0]
                    content = choice.message.content

                    self.logger.info(
                        f"LiteLLM API call to {current_model} successful"
                    )

                    return AIResponse(
                        content=content,
                        model=current_model,
                        usage=response.usage.__dict__
                        if response.usage
                        else None,
                        finish_reason=choice.finish_reason,
                    )

                except RateLimitError as e:
                    last_error = e
                    self.logger.warning(
                        f"Rate limit error on attempt {attempt + 1}: {e}"
                    )
                    if attempt < self.max_retries:
                        await asyncio.sleep(
                            self.retry_delay * (2**attempt)
                        )  # Exponential backoff
                        continue

                except (ServiceUnavailableError, APIError) as e:
                    last_error = e
                    self.logger.error(
                        f"API error on attempt {attempt + 1}: {e}"
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

            # All retries failed for this model, try next fallback
            self.logger.warning(
                f"All attempts failed for model {current_model}, trying next fallback"
            )

        # All models failed
        error_msg = (
            f"LiteLLM API call failed for all models {tried_models} after "
            f"{self.max_retries + 1} attempts each: {last_error}"
        )
        self.logger.error(error_msg)

        return AIResponse(content="", model=model, error=error_msg)

    def get_available_models(self) -> List[ModelConfig]:
        """Get list of available models with their configurations."""
        return [model for model in self.models.values() if model.is_available]

    async def health_check(self, model: str) -> bool:
        """
        Check if a specific model is available and responding.

        Args:
            model: Model name to check

        Returns:
            True if model is available, False otherwise
        """
        try:
            # Simple health check message
            messages = [
                {"role": "system", "content": "Health check"},
                {"role": "user", "content": "Hello"},
            ]

            # Set short timeout and no retries for health check
            _ = await acompletion(
                model=model, messages=messages, max_tokens=5, timeout=5
            )

            return True
        except Exception as e:
            self.logger.warning(f"Health check failed for model {model}: {e}")
            return False

    def get_model_by_capability(self, capability: str) -> List[ModelConfig]:
        """
        Get models that have a specific capability.

        Args:
            capability: Capability to search for

        Returns:
            List of models with the specified capability
        """
        return [
            model
            for model in self.models.values()
            if capability in model.capabilities and model.is_available
        ]


# Global LiteLLM service instance
_litellm_service_instance: Optional[LiteLLMService] = None


def get_litellm_service() -> LiteLLMService:
    """
    Get the global LiteLLM service instance.

    Returns:
        LiteLLMService instance
    """
    global _litellm_service_instance

    if _litellm_service_instance is None:
        _litellm_service_instance = LiteLLMService()

    return _litellm_service_instance


def set_litellm_service(service: LiteLLMService) -> None:
    """
    Set the global LiteLLM service instance (useful for testing).

    Args:
        service: LiteLLMService instance to set
    """
    global _litellm_service_instance
    _litellm_service_instance = service
