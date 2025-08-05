"""RelayCore integration configuration for AutoMatrix."""

from typing import List, Optional

from pydantic import BaseSettings, Field


class RelayCoreCostSettings(BaseSettings):
    """Cost optimization settings for RelayCore."""

    max_cost_per_request: float = Field(0.10, description="Maximum cost per AI request")
    prefer_cheaper_models: bool = Field(
        True, description="Prefer cheaper models when possible"
    )
    fallback_to_cheaper: bool = Field(
        True, description="Fallback to cheaper models on budget limits"
    )
    daily_budget_limit: float = Field(50.0, description="Daily budget limit per user")
    monthly_budget_limit: float = Field(
        1000.0, description="Monthly budget limit per user"
    )

    class Config:
        env_prefix = "RELAYCORE_COST_"


class RelayCoreCacheSettings(BaseSettings):
    """Cache settings for RelayCore requests."""

    enable_cache: bool = Field(True, description="Enable request caching")
    cache_ttl: int = Field(3600, description="Cache TTL in seconds")
    cache_similar_requests: bool = Field(True, description="Cache similar requests")
    redis_url: Optional[str] = Field(None, description="Redis URL for caching")
    max_cache_size: int = Field(1000, description="Maximum cache entries")

    class Config:
        env_prefix = "RELAYCORE_CACHE_"


class RelayCoreSteering(BaseSettings):
    """Model steering and selection settings."""

    preferred_providers: List[str] = Field(
        ["openai", "anthropic"], description="Preferred AI providers in order"
    )
    quality_threshold: float = Field(0.8, description="Minimum quality threshold")
    latency_threshold: float = Field(
        5.0, description="Maximum latency threshold in seconds"
    )

    # Model preferences for different use cases
    customer_inquiry_model: str = Field(
        "gpt-3.5-turbo", description="Model for customer inquiries"
    )
    lead_qualification_model: str = Field(
        "gpt-4", description="Model for lead qualification"
    )
    service_recommendation_model: str = Field(
        "gpt-3.5-turbo", description="Model for service recommendations"
    )
    generic_processing_model: str = Field(
        "gpt-3.5-turbo", description="Model for generic processing"
    )

    class Config:
        env_prefix = "RELAYCORE_STEERING_"


class RelayCoreFallbackSettings(BaseSettings):
    """Fallback configuration for RelayCore unavailability."""

    fallback_mode: str = Field(
        "direct_openai",
        description="Fallback mode: direct_openai, cache_only, fail_fast",
    )
    enable_circuit_breaker: bool = Field(
        True, description="Enable circuit breaker pattern"
    )
    circuit_breaker_failure_threshold: int = Field(
        5, description="Failures before opening circuit"
    )
    circuit_breaker_recovery_timeout: int = Field(
        60, description="Recovery timeout in seconds"
    )
    max_retries: int = Field(3, description="Maximum retry attempts")
    retry_delay: float = Field(1.0, description="Base retry delay in seconds")

    class Config:
        env_prefix = "RELAYCORE_FALLBACK_"


class RelayCoreSecurity(BaseSettings):
    """Security settings for RelayCore integration."""

    api_key: Optional[str] = Field(None, description="RelayCore API key")
    enable_request_signing: bool = Field(False, description="Enable request signing")
    request_timeout: int = Field(30, description="Request timeout in seconds")
    max_concurrent_requests: int = Field(10, description="Maximum concurrent requests")
    rate_limit_requests_per_minute: int = Field(60, description="Rate limit per minute")

    class Config:
        env_prefix = "RELAYCORE_SECURITY_"


class RelayCoreTelemetry(BaseSettings):
    """Telemetry and monitoring settings."""

    enable_metrics: bool = Field(True, description="Enable metrics collection")
    enable_tracing: bool = Field(True, description="Enable request tracing")
    metrics_endpoint: Optional[str] = Field(
        None, description="Metrics collection endpoint"
    )
    log_level: str = Field("INFO", description="Logging level")
    enable_performance_monitoring: bool = Field(
        True, description="Enable performance monitoring"
    )

    class Config:
        env_prefix = "RELAYCORE_TELEMETRY_"


class RelayCoreDevelopment(BaseSettings):
    """Development and testing settings."""

    enable_mock_mode: bool = Field(False, description="Enable mock mode for testing")
    mock_response_delay: float = Field(
        0.1, description="Mock response delay in seconds"
    )
    enable_debug_logging: bool = Field(False, description="Enable debug logging")
    test_api_key: Optional[str] = Field(None, description="Test API key")

    class Config:
        env_prefix = "RELAYCORE_DEV_"


class RelayCoreCoreSettings(BaseSettings):
    """Core RelayCore connection settings."""

    base_url: str = Field(
        "http://localhost:3001", description="RelayCore service base URL"
    )
    api_version: str = Field("v1", description="API version")
    service_name: str = Field(
        "autmatrix", description="Service name for identification"
    )
    environment: str = Field(
        "development", description="Environment: development, staging, production"
    )

    class Config:
        env_prefix = "RELAYCORE_"


class RelayCoreCombinedSettings(BaseSettings):
    """Combined RelayCore configuration."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Initialize all sub-configurations
        self.core = RelayCoreCoreSettings()
        self.cost = RelayCoreCostSettings()
        self.cache = RelayCoreCacheSettings()
        self.steering = RelayCoreSteering()
        self.fallback = RelayCoreFallbackSettings()
        self.security = RelayCoreSecurity()
        self.telemetry = RelayCoreTelemetry()
        self.development = RelayCoreDevelopment()

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.core.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.core.environment.lower() == "development"

    def get_full_api_url(self, endpoint: str = "") -> str:
        """Get full API URL for RelayCore endpoint."""
        base = self.core.base_url.rstrip("/")
        version = self.core.api_version
        endpoint = endpoint.lstrip("/")

        if endpoint:
            return f"{base}/{version}/{endpoint}"
        else:
            return f"{base}/{version}"

    def validate_configuration(self) -> List[str]:
        """Validate RelayCore configuration and return any issues."""
        issues = []

        # Check required settings
        if not self.core.base_url:
            issues.append("RelayCore base URL is required")

        if self.is_production and not self.security.api_key:
            issues.append("API key is required in production")

        if self.cost.max_cost_per_request <= 0:
            issues.append("Max cost per request must be positive")

        if self.cache.cache_ttl <= 0:
            issues.append("Cache TTL must be positive")

        if self.fallback.max_retries < 0:
            issues.append("Max retries cannot be negative")

        if self.security.request_timeout <= 0:
            issues.append("Request timeout must be positive")

        return issues


# Global configuration instance
_relaycore_config: Optional[RelayCoreCombinedSettings] = None


def get_relaycore_config() -> RelayCoreCombinedSettings:
    """Get the global RelayCore configuration instance."""
    global _relaycore_config

    if _relaycore_config is None:
        _relaycore_config = RelayCoreCombinedSettings()

        # Validate configuration
        issues = _relaycore_config.validate_configuration()
        if issues:
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"RelayCore configuration issues: {issues}")

    return _relaycore_config


def set_relaycore_config(config: RelayCoreCombinedSettings) -> None:
    """Set the global RelayCore configuration instance."""
    global _relaycore_config
    _relaycore_config = config
