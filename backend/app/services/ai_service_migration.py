"""Migration utility to replace direct OpenAI calls with RelayCore integration."""

import logging
from typing import Any, Dict, List, Optional

from app.services.ai_service import AIService as LegacyAIService
from app.services.ai_service_relaycore import AIModelType, AIResponse, EnhancedAIService

logger = logging.getLogger(__name__)


class AIServiceMigrationWrapper:
    """
    Wrapper class to migrate from legacy AI service to RelayCore-enhanced service.

    This class provides backward compatibility while enabling RelayCore integration.
    It can be used as a drop-in replacement for the legacy AIService.
    """

    def __init__(
        self, use_relaycore: bool = True, fallback_to_legacy: bool = True, **kwargs
    ):
        """
        Initialize the migration wrapper.

        Args:
            use_relaycore: Whether to use RelayCore by default
            fallback_to_legacy: Whether to fallback to legacy service on errors
            **kwargs: Additional arguments passed to EnhancedAIService
        """
        self.use_relaycore = use_relaycore
        self.fallback_to_legacy = fallback_to_legacy

        # Initialize enhanced service
        try:
            self.enhanced_service = EnhancedAIService(
                use_relaycore=use_relaycore, **kwargs
            )
            self.enhanced_available = True
        except Exception as e:
            logger.warning(f"Failed to initialize enhanced AI service: {e}")
            self.enhanced_service = None
            self.enhanced_available = False

        # Initialize legacy service as fallback
        if fallback_to_legacy:
            try:
                self.legacy_service = LegacyAIService(**kwargs)
                self.legacy_available = True
            except Exception as e:
                logger.warning(f"Failed to initialize legacy AI service: {e}")
                self.legacy_service = None
                self.legacy_available = False
        else:
            self.legacy_service = None
            self.legacy_available = False

    async def process_text(
        self,
        prompt: str,
        context: Optional[Dict[str, Any]] = None,
        model: Optional[Any] = None,  # Can be AIModelType or string
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        user_id: Optional[str] = None,
    ) -> AIResponse:
        """
        Process text with automatic service selection and fallback.

        This method maintains compatibility with the legacy AIService interface
        while providing RelayCore integration and intelligent fallback.
        """
        # Convert model parameter if needed
        if isinstance(model, str):
            try:
                model = AIModelType(model)
            except ValueError:
                logger.warning(f"Unknown model type: {model}, using default")
                model = None

        # Try enhanced service first
        if self.enhanced_available and self.enhanced_service:
            try:
                response = await self.enhanced_service.process_text(
                    prompt=prompt,
                    context=context,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    user_id=user_id,
                )

                if response.is_success:
                    logger.debug("Enhanced AI service successful")
                    return response
                else:
                    logger.warning(f"Enhanced AI service failed: {response.error}")

            except Exception as e:
                logger.error(f"Enhanced AI service error: {e}")

        # Fallback to legacy service
        if self.legacy_available and self.legacy_service:
            try:
                logger.info("Falling back to legacy AI service")
                legacy_response = await self.legacy_service.process_text(
                    prompt=prompt,
                    context=context,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

                # Convert legacy response to new format
                return AIResponse(
                    content=legacy_response.content,
                    model=legacy_response.model,
                    usage=legacy_response.usage,
                    finish_reason=legacy_response.finish_reason,
                    error=legacy_response.error,
                    source="legacy",
                )

            except Exception as e:
                logger.error(f"Legacy AI service error: {e}")
                return AIResponse(
                    content="",
                    model=str(model) if model else "unknown",
                    error=f"All AI services failed: {e}",
                    source="error",
                )

        # No services available
        return AIResponse(
            content="",
            model=str(model) if model else "unknown",
            error="No AI services available",
            source="error",
        )

    async def process_with_template(
        self,
        template_name: str,
        variables: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
        model: Optional[Any] = None,
        user_id: Optional[str] = None,
    ) -> AIResponse:
        """Process text using a predefined template with service fallback."""
        # Convert model parameter if needed
        if isinstance(model, str):
            try:
                model = AIModelType(model)
            except ValueError:
                logger.warning(f"Unknown model type: {model}, using default")
                model = None

        # Try enhanced service first
        if self.enhanced_available and self.enhanced_service:
            try:
                response = await self.enhanced_service.process_with_template(
                    template_name=template_name,
                    variables=variables,
                    context=context,
                    model=model,
                    user_id=user_id,
                )

                if response.is_success:
                    return response

            except Exception as e:
                logger.error(f"Enhanced template processing error: {e}")

        # Fallback to legacy service
        if self.legacy_available and self.legacy_service:
            try:
                legacy_response = await self.legacy_service.process_with_template(
                    template_name=template_name,
                    variables=variables,
                    context=context,
                    model=model,
                )

                return AIResponse(
                    content=legacy_response.content,
                    model=legacy_response.model,
                    usage=legacy_response.usage,
                    finish_reason=legacy_response.finish_reason,
                    error=legacy_response.error,
                    source="legacy",
                )

            except Exception as e:
                logger.error(f"Legacy template processing error: {e}")

        return AIResponse(
            content="",
            model=str(model) if model else "unknown",
            error="Template processing failed on all services",
            source="error",
        )

    def get_available_templates(self) -> List[str]:
        """Get available templates from the active service."""
        if self.enhanced_available and self.enhanced_service:
            return self.enhanced_service.get_available_templates()
        elif self.legacy_available and self.legacy_service:
            return self.legacy_service.get_available_templates()
        else:
            return []

    def add_custom_template(self, name: str, template: Any) -> None:
        """Add custom template to both services if available."""
        if self.enhanced_available and self.enhanced_service:
            self.enhanced_service.add_custom_template(name, template)

        if self.legacy_available and self.legacy_service:
            self.legacy_service.add_custom_template(name, template)

    async def get_service_status(self) -> Dict[str, Any]:
        """Get status of all available services."""
        status = {
            "enhanced_service": {
                "available": self.enhanced_available,
                "relaycore_enabled": (
                    self.use_relaycore if self.enhanced_available else False
                ),
            },
            "legacy_service": {"available": self.legacy_available},
        }

        # Get health check from enhanced service if available
        if self.enhanced_available and self.enhanced_service:
            try:
                health = await self.enhanced_service.health_check()
                status["enhanced_service"]["health"] = health
            except Exception as e:
                status["enhanced_service"]["health_error"] = str(e)

        return status

    async def close(self):
        """Close all service connections."""
        if self.enhanced_service:
            try:
                await self.enhanced_service.close()
            except Exception as e:
                logger.error(f"Error closing enhanced service: {e}")

        # Legacy service doesn't have async close method
        # but we can clean up if needed


def create_migrated_ai_service(
    use_relaycore: bool = True, fallback_to_legacy: bool = True, **kwargs
) -> AIServiceMigrationWrapper:
    """
    Factory function to create a migrated AI service instance.

    Args:
        use_relaycore: Whether to use RelayCore by default
        fallback_to_legacy: Whether to fallback to legacy service
        **kwargs: Additional arguments for service initialization

    Returns:
        AIServiceMigrationWrapper instance
    """
    return AIServiceMigrationWrapper(
        use_relaycore=use_relaycore, fallback_to_legacy=fallback_to_legacy, **kwargs
    )


# Global migrated service instance
_migrated_ai_service_instance: Optional[AIServiceMigrationWrapper] = None


def get_migrated_ai_service() -> AIServiceMigrationWrapper:
    """Get the global migrated AI service instance."""
    global _migrated_ai_service_instance

    if _migrated_ai_service_instance is None:
        _migrated_ai_service_instance = create_migrated_ai_service()

    return _migrated_ai_service_instance


def set_migrated_ai_service(service: AIServiceMigrationWrapper) -> None:
    """Set the global migrated AI service instance."""
    global _migrated_ai_service_instance
    _migrated_ai_service_instance = service
