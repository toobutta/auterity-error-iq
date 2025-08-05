"""RelayCore HTTP client for AutoMatrix backend integration."""

import asyncio
import logging
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import aiohttp
from aiohttp import ClientTimeout

from app.exceptions import AIServiceError

logger = logging.getLogger(__name__)


@dataclass
class RelayCoreCostConstraints:
    """Cost constraints for RelayCore requests."""

    max_cost: float = 1.0
    preferred_provider: Optional[str] = None
    budget_limit: Optional[float] = None


@dataclass
class RelayCoreRequest:
    """RelayCore request structure."""

    prompt: str
    context: Dict[str, Any]
    routing_preferences: Dict[str, Any]
    cost_constraints: RelayCoreCostConstraints
    system_source: str = "autmatrix"


@dataclass
class RelayCoreResponse:
    """RelayCore response structure."""

    content: str
    model_used: str
    provider: str
    cost: float
    latency: int
    confidence: float
    metadata: Dict[str, Any]
    routing_info: Dict[str, Any]


class RelayCoreClient:
    """HTTP client for RelayCore AI proxy service."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ):
        """
        Initialize RelayCore client.

        Args:
            base_url: RelayCore service URL
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
            retry_delay: Delay between retries
        """
        self.base_url = base_url or os.getenv("RELAYCORE_URL", "http://localhost:3001")
        self.timeout = ClientTimeout(total=timeout)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.logger = logging.getLogger(__name__)

    async def chat_completion(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        cost_constraints: Optional[RelayCoreCostConstraints] = None,
        routing_preferences: Optional[Dict[str, Any]] = None,
    ) -> RelayCoreResponse:
        """
        Send chat completion request to RelayCore.

        Args:
            prompt: Text prompt to process
            context: Optional context data
            cost_constraints: Cost and routing constraints
            routing_preferences: Provider/model preferences

        Returns:
            RelayCoreResponse with AI response data

        Raises:
            AIServiceError: If request fails after retries
        """
        request_data = RelayCoreRequest(
            prompt=prompt,
            context=context or {},
            routing_preferences=routing_preferences or {},
            cost_constraints=cost_constraints or RelayCoreCostConstraints(),
            system_source="autmatrix",
        )

        return await self._make_request("/api/v1/ai/chat", request_data)

    async def batch_completion(
        self, requests: List[Dict[str, Any]]
    ) -> List[RelayCoreResponse]:
        """
        Send batch completion requests to RelayCore.

        Args:
            requests: List of request dictionaries

        Returns:
            List of RelayCoreResponse objects
        """
        batch_data = {"requests": requests}
        response = await self._make_request("/api/v1/ai/batch", batch_data)

        # Convert batch response to list of RelayCoreResponse objects
        results = []
        for result in response.get("results", []):
            if "error" not in result:
                results.append(
                    RelayCoreResponse(
                        content=result.get("content", ""),
                        model_used=result.get("model_used", ""),
                        provider=result.get("provider", ""),
                        cost=result.get("cost", 0.0),
                        latency=result.get("latency", 0),
                        confidence=result.get("confidence", 0.0),
                        metadata=result.get("metadata", {}),
                        routing_info={},
                    )
                )
            else:
                # Handle error case
                results.append(
                    RelayCoreResponse(
                        content="",
                        model_used="",
                        provider="",
                        cost=0.0,
                        latency=0,
                        confidence=0.0,
                        metadata={"error": result["error"]},
                        routing_info={},
                    )
                )

        return results

    async def get_providers(self) -> List[Dict[str, Any]]:
        """
        Get available AI providers from RelayCore.

        Returns:
            List of provider configurations
        """
        response = await self._make_request("/api/v1/ai/providers", method="GET")
        return response.get("data", [])

    async def health_check(self) -> bool:
        """
        Check if RelayCore service is available.

        Returns:
            True if service is healthy, False otherwise
        """
        try:
            async with aiohttp.ClientSession(timeout=ClientTimeout(total=5)) as session:
                async with session.get(f"{self.base_url}/health") as response:
                    return response.status == 200
        except Exception as e:
            self.logger.warning(f"RelayCore health check failed: {e}")
            return False

    async def _make_request(
        self, endpoint: str, data: Any = None, method: str = "POST"
    ) -> Dict[str, Any]:
        """
        Make HTTP request to RelayCore with retry logic.

        Args:
            endpoint: API endpoint path
            data: Request data
            method: HTTP method

        Returns:
            Response data dictionary

        Raises:
            AIServiceError: If request fails after retries
        """
        url = f"{self.base_url}{endpoint}"
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                self.logger.debug(
                    f"RelayCore request attempt {attempt + 1}/{self.max_retries + 1}"
                )

                async with aiohttp.ClientSession(timeout=self.timeout) as session:
                    if method.upper() == "GET":
                        async with session.get(url) as response:
                            return await self._handle_response(response)
                    else:
                        request_payload = self._prepare_payload(data)
                        async with session.post(url, json=request_payload) as response:
                            return await self._handle_response(response)

            except aiohttp.ClientTimeout as e:
                last_error = e
                self.logger.warning(f"RelayCore timeout on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay * (2**attempt))
                    continue

            except aiohttp.ClientError as e:
                last_error = e
                self.logger.error(
                    f"RelayCore client error on attempt {attempt + 1}: {e}"
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)
                    continue

            except Exception as e:
                last_error = e
                self.logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.retry_delay)
                    continue

        # All retries failed
        error_msg = f"RelayCore request failed after {self.max_retries + 1} attempts: {last_error}"
        self.logger.error(error_msg)
        raise AIServiceError(error_msg)

    async def _handle_response(
        self, response: aiohttp.ClientResponse
    ) -> Dict[str, Any]:
        """Handle HTTP response from RelayCore."""
        if response.status == 200:
            response_data = await response.json()
            if response_data.get("success"):
                return response_data.get("data", {})
            else:
                error_msg = response_data.get("error", {}).get(
                    "message", "Unknown error"
                )
                raise AIServiceError(f"RelayCore API error: {error_msg}")
        else:
            error_text = await response.text()
            raise AIServiceError(f"RelayCore HTTP {response.status}: {error_text}")

    def _prepare_payload(self, data: Any) -> Dict[str, Any]:
        """Prepare request payload for RelayCore API."""
        if isinstance(data, RelayCoreRequest):
            return {
                "prompt": data.prompt,
                "context": data.context,
                "routing_preferences": data.routing_preferences,
                "cost_constraints": {
                    "max_cost": data.cost_constraints.max_cost,
                    "preferred_provider": data.cost_constraints.preferred_provider,
                    "budget_limit": data.cost_constraints.budget_limit,
                },
                "system_source": data.system_source,
            }
        elif isinstance(data, dict):
            return data
        else:
            return {"data": data}


class RelayCoreAIService:
    """AI service that uses RelayCore with fallback to direct OpenAI."""

    def __init__(
        self,
        relaycore_client: Optional[RelayCoreClient] = None,
        fallback_service: Optional[Any] = None,
        enable_fallback: bool = True,
    ):
        """
        Initialize RelayCore AI service.

        Args:
            relaycore_client: RelayCore client instance
            fallback_service: Fallback AI service (e.g., direct OpenAI)
            enable_fallback: Whether to enable fallback on RelayCore failure
        """
        self.relaycore_client = relaycore_client or RelayCoreClient()
        self.fallback_service = fallback_service
        self.enable_fallback = enable_fallback
        self.logger = logging.getLogger(__name__)

    async def process_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Process text using RelayCore with fallback.

        Args:
            prompt: Text prompt to process
            context: Optional context data
            model: Preferred model (passed as routing preference)
            temperature: Sampling temperature
            max_tokens: Maximum tokens

        Returns:
            AI response dictionary
        """
        # Try RelayCore first
        try:
            # Check if RelayCore is available
            if not await self.relaycore_client.health_check():
                raise AIServiceError("RelayCore service unavailable")

            # Prepare routing preferences
            routing_preferences = {}
            if model:
                routing_preferences["preferred_model"] = model
            if temperature != 0.7:
                routing_preferences["temperature"] = temperature
            if max_tokens:
                routing_preferences["max_tokens"] = max_tokens

            # Make RelayCore request
            response = await self.relaycore_client.chat_completion(
                prompt=prompt,
                context=context,
                routing_preferences=routing_preferences,
            )

            self.logger.info(
                f"RelayCore request successful using {response.provider}/{response.model_used}"
            )

            return {
                "content": response.content,
                "model": response.model_used,
                "provider": response.provider,
                "cost": response.cost,
                "latency": response.latency,
                "confidence": response.confidence,
                "metadata": response.metadata,
                "routing_info": response.routing_info,
                "source": "relaycore",
            }

        except Exception as e:
            self.logger.warning(f"RelayCore request failed: {e}")

            # Fallback to direct service if enabled
            if self.enable_fallback and self.fallback_service:
                self.logger.info("Falling back to direct AI service")
                try:
                    fallback_response = await self.fallback_service.process_text(
                        prompt=prompt,
                        context=context,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )

                    # Add fallback indicator
                    if hasattr(fallback_response, "content"):
                        return {
                            "content": fallback_response.content,
                            "model": fallback_response.model,
                            "provider": "openai_direct",
                            "cost": 0.0,  # Cost tracking not available in fallback
                            "latency": 0,
                            "confidence": 0.95,
                            "metadata": fallback_response.usage or {},
                            "routing_info": {"fallback": True},
                            "source": "fallback",
                        }
                    else:
                        return fallback_response

                except Exception as fallback_error:
                    self.logger.error(f"Fallback service also failed: {fallback_error}")
                    raise AIServiceError(
                        f"Both RelayCore and fallback failed: {e}, {fallback_error}"
                    )
            else:
                raise AIServiceError(
                    f"RelayCore failed and no fallback configured: {e}"
                )

    async def process_with_template(
        self,
        template_name: str,
        variables: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process text using template with RelayCore.

        Args:
            template_name: Template name
            variables: Template variables
            context: Optional context
            model: Preferred model

        Returns:
            AI response dictionary
        """
        # If fallback service supports templates, use it to format the prompt
        if self.fallback_service and hasattr(
            self.fallback_service, "process_with_template"
        ):
            try:
                # Use fallback service just for template formatting
                template_response = await self.fallback_service.process_with_template(
                    template_name=template_name,
                    variables=variables,
                    context=context,
                    model=model,
                )

                # Extract the formatted prompt and use RelayCore
                if hasattr(template_response, "content"):
                    formatted_prompt = template_response.content
                else:
                    formatted_prompt = str(template_response)

                return await self.process_text(
                    prompt=formatted_prompt,
                    context=context,
                    model=model,
                )

            except Exception as e:
                self.logger.error(f"Template processing failed: {e}")
                raise AIServiceError(f"Template processing failed: {e}")
        else:
            raise AIServiceError(
                "Template processing not supported without fallback service"
            )


# Global RelayCore service instance
_relaycore_service_instance: Optional[RelayCoreAIService] = None


def get_relaycore_service(fallback_service: Optional[Any] = None) -> RelayCoreAIService:
    """
    Get the global RelayCore AI service instance.

    Args:
        fallback_service: Optional fallback AI service

    Returns:
        RelayCoreAIService instance
    """
    global _relaycore_service_instance

    if _relaycore_service_instance is None:
        _relaycore_service_instance = RelayCoreAIService(
            fallback_service=fallback_service,
            enable_fallback=True,
        )

    return _relaycore_service_instance


def set_relaycore_service(service: RelayCoreAIService) -> None:
    """
    Set the global RelayCore AI service instance.

    Args:
        service: RelayCoreAIService instance to set
    """
    global _relaycore_service_instance
    _relaycore_service_instance = service
