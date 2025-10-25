"""Intelligent Router Service for Global AI Service Orchestration."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from enum import Enum

from app.database import get_db_session
from app.models.routing_policy import RoutingPolicy
from app.models.ai_provider import AIProvider
from app.monitoring.performance import performance_monitor

logger = logging.getLogger(__name__)


class RoutingStrategy(Enum):
    """Routing strategy types."""
    COST_OPTIMIZED = "cost_optimized"
    PERFORMANCE_OPTIMIZED = "performance_optimized"
    BALANCED = "balanced"
    CUSTOM = "custom"


@dataclass
class RouteDecision:
    """Routing decision result."""
    provider_id: str
    provider_name: str
    model: str
    strategy: RoutingStrategy
    cost_estimate: float
    performance_score: float
    reasoning: str
    policy_applied: Optional[str] = None
    cost_savings: float = 0.0


@dataclass
class ProviderHealth:
    """Provider health status."""
    provider_id: str
    status: str  # healthy, degraded, unhealthy
    response_time: float
    error_rate: float
    capacity: float
    last_check: datetime
    consecutive_failures: int


class IntelligentRouter:
    """Global intelligent routing service."""

    def __init__(self):
        self.providers: Dict[str, AIProvider] = {}
        self.policies: Dict[str, RoutingPolicy] = {}
        self.provider_health: Dict[str, ProviderHealth] = {}
        self.cache: Dict[str, RouteDecision] = {}
        self.cache_ttl = 300  # 5 minutes

    async def initialize(self):
        """Initialize the router with providers and policies."""
        await self._load_providers()
        await self._load_policies()
        await self._start_health_monitoring()

        logger.info(f"Intelligent Router initialized with {len(self.providers)} providers and {len(self.policies)} policies")

    async def _load_providers(self):
        """Load AI providers from database."""
        try:
            async with get_db_session() as session:
                providers = await session.execute(
                    "SELECT * FROM ai_providers WHERE status = 'healthy'"
                )
                for provider in providers:
                    self.providers[provider.id] = AIProvider(**provider.__dict__)
                    self.provider_health[provider.id] = ProviderHealth(
                        provider_id=provider.id,
                        status=provider.status,
                        response_time=provider.avg_response_time,
                        error_rate=0.0,
                        capacity=provider.capacity,
                        last_check=datetime.utcnow(),
                        consecutive_failures=0
                    )
        except Exception as e:
            logger.error(f"Failed to load providers: {e}")

    async def _load_policies(self):
        """Load routing policies from database."""
        try:
            async with get_db_session() as session:
                policies = await session.execute(
                    "SELECT * FROM routing_policies WHERE status = 'active'"
                )
                for policy in policies:
                    self.policies[policy.id] = RoutingPolicy(**policy.__dict__)
        except Exception as e:
            logger.error(f"Failed to load policies: {e}")

    async def _start_health_monitoring(self):
        """Start background health monitoring."""
        asyncio.create_task(self._health_monitor_loop())

    async def _health_monitor_loop(self):
        """Background health monitoring loop."""
        while True:
            try:
                await self._check_provider_health()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(30)

    async def _check_provider_health(self):
        """Check health of all providers."""
        for provider_id, provider in self.providers.items():
            try:
                # Simulate health check (replace with actual API calls)
                health_score = await self._perform_health_check(provider)
                self.provider_health[provider_id].response_time = health_score['response_time']
                self.provider_health[provider_id].error_rate = health_score['error_rate']
                self.provider_health[provider_id].capacity = health_score['capacity']
                self.provider_health[provider_id].last_check = datetime.utcnow()

                # Update status based on health metrics
                if health_score['error_rate'] > 0.1:
                    self.provider_health[provider_id].status = 'degraded'
                    self.provider_health[provider_id].consecutive_failures += 1
                elif health_score['error_rate'] > 0.3:
                    self.provider_health[provider_id].status = 'unhealthy'
                    self.provider_health[provider_id].consecutive_failures += 1
                else:
                    self.provider_health[provider_id].status = 'healthy'
                    self.provider_health[provider_id].consecutive_failures = 0

            except Exception as e:
                logger.error(f"Health check failed for {provider_id}: {e}")
                self.provider_health[provider_id].consecutive_failures += 1
                if self.provider_health[provider_id].consecutive_failures > 3:
                    self.provider_health[provider_id].status = 'unhealthy'

    async def _perform_health_check(self, provider: AIProvider) -> Dict[str, float]:
        """Perform actual health check on provider."""
        # Mock health check - replace with real API calls
        await asyncio.sleep(0.1)  # Simulate network delay

        return {
            'response_time': provider.avg_response_time * (0.8 + 0.4 * asyncio.get_event_loop().time() % 1),
            'error_rate': min(0.05 + (asyncio.get_event_loop().time() % 1) * 0.1, 0.5),
            'capacity': provider.capacity * (0.9 + 0.2 * (asyncio.get_event_loop().time() % 1))
        }

    async def route_request(self, request: Dict[str, Any]) -> RouteDecision:
        """Route an AI request to the optimal provider."""
        start_time = time.time()

        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request)
            if cache_key in self.cache:
                cached_decision = self.cache[cache_key]
                # Check if cache is still valid
                if time.time() - cached_decision.timestamp < self.cache_ttl:
                    return cached_decision

            # Apply routing logic
            decision = await self._calculate_optimal_route(request)

            # Cache the decision
            self.cache[cache_key] = decision

            # Record metrics
            await performance_monitor.record_routing_decision(
                decision=decision,
                request=request,
                duration=time.time() - start_time
            )

            return decision

        except Exception as e:
            logger.error(f"Routing failed: {e}")
            # Fallback to default provider
            return await self._get_fallback_route(request)

    def _generate_cache_key(self, request: Dict[str, Any]) -> str:
        """Generate cache key for request."""
        key_components = [
            request.get('user_tier', 'standard'),
            request.get('service_type', 'chat'),
            request.get('model_type', 'gpt-4'),
            str(request.get('cost_threshold', '')),
            str(request.get('performance_requirement', ''))
        ]
        return '|'.join(key_components)

    async def _calculate_optimal_route(self, request: Dict[str, Any]) -> RouteDecision:
        """Calculate the optimal route based on policies and provider health."""
        user_tier = request.get('user_tier', 'standard')
        service_type = request.get('service_type', 'chat')
        model_type = request.get('model_type')
        cost_threshold = request.get('cost_threshold')
        performance_req = request.get('performance_requirement', 'medium')

        # Find applicable policies
        applicable_policies = []
        for policy in self.policies.values():
            if self._policy_matches_request(policy, request):
                applicable_policies.append(policy)

        # Sort by priority
        applicable_policies.sort(key=lambda p: p.priority)

        # Apply highest priority policy
        if applicable_policies:
            policy = applicable_policies[0]
            return await self._apply_policy_routing(policy, request)

        # Default routing logic
        return await self._apply_default_routing(request)

    def _policy_matches_request(self, policy: RoutingPolicy, request: Dict[str, Any]) -> bool:
        """Check if a policy matches the request conditions."""
        conditions = policy.conditions

        # Check user tier
        if conditions.get('user_tier') and conditions['user_tier'] != request.get('user_tier'):
            return False

        # Check service type
        if conditions.get('service_type') and conditions['service_type'] != request.get('service_type'):
            return False

        # Check model type
        if conditions.get('model_type') and conditions['model_type'] != request.get('model_type'):
            return False

        # Check cost threshold
        if conditions.get('cost_threshold') and request.get('cost_threshold'):
            if request['cost_threshold'] > conditions['cost_threshold']:
                return False

        return True

    async def _apply_policy_routing(self, policy: RoutingPolicy, request: Dict[str, Any]) -> RouteDecision:
        """Apply routing based on policy configuration."""
        actions = policy.actions
        candidates = []

        # Primary provider
        if actions['primary_provider'] in self.providers:
            primary_provider = self.providers[actions['primary_provider']]
            primary_health = self.provider_health[actions['primary_provider']]

            if primary_health.status == 'healthy':
                candidates.append((primary_provider, primary_health, True))

        # Fallback providers
        for fallback_id in actions.get('fallback_providers', []):
            if fallback_id in self.providers:
                fallback_provider = self.providers[fallback_id]
                fallback_health = self.provider_health[fallback_id]

                if fallback_health.status == 'healthy':
                    candidates.append((fallback_provider, fallback_health, False))

        if not candidates:
            return await self._get_fallback_route(request)

        # Select best candidate based on strategy
        selected_provider, selected_health, is_primary = candidates[0]

        # Calculate cost savings if cost optimization is enabled
        cost_savings = 0.0
        if actions.get('cost_optimization', False):
            baseline_cost = selected_provider.cost_per_token
            optimized_cost = min([p.cost_per_token for p, h, _ in candidates if h.status == 'healthy'])
            cost_savings = baseline_cost - optimized_cost

        return RouteDecision(
            provider_id=selected_provider.id,
            provider_name=selected_provider.name,
            model=request.get('model', 'gpt-4'),
            strategy=RoutingStrategy.COST_OPTIMIZED if actions.get('cost_optimization') else RoutingStrategy.BALANCED,
            cost_estimate=selected_provider.cost_per_token,
            performance_score=selected_health.capacity / 100.0,
            reasoning=f"Policy '{policy.name}' applied with {'primary' if is_primary else 'fallback'} provider",
            policy_applied=policy.id,
            cost_savings=cost_savings
        )

    async def _apply_default_routing(self, request: Dict[str, Any]) -> RouteDecision:
        """Apply default routing logic when no policies match."""
        user_tier = request.get('user_tier', 'standard')
        service_type = request.get('service_type', 'chat')

        # Simple tier-based routing
        provider_preferences = {
            'enterprise': ['gpt-4-turbo', 'claude-3-opus', 'gpt-4'],
            'professional': ['gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'],
            'standard': ['gpt-3.5-turbo', 'gpt-4', 'claude-3-haiku']
        }

        preferred_providers = provider_preferences.get(user_tier, provider_preferences['standard'])

        for provider_id in preferred_providers:
            if provider_id in self.providers and self.provider_health[provider_id].status == 'healthy':
                provider = self.providers[provider_id]
                health = self.provider_health[provider_id]

                return RouteDecision(
                    provider_id=provider.id,
                    provider_name=provider.name,
                    model=request.get('model', 'gpt-4'),
                    strategy=RoutingStrategy.BALANCED,
                    cost_estimate=provider.cost_per_token,
                    performance_score=health.capacity / 100.0,
                    reasoning=f"Default routing for {user_tier} tier"
                )

        # Ultimate fallback
        return await self._get_fallback_route(request)

    async def _get_fallback_route(self, request: Dict[str, Any]) -> RouteDecision:
        """Get fallback route when all else fails."""
        # Find any healthy provider
        for provider_id, health in self.provider_health.items():
            if health.status == 'healthy' and provider_id in self.providers:
                provider = self.providers[provider_id]
                return RouteDecision(
                    provider_id=provider.id,
                    provider_name=provider.name,
                    model=request.get('model', 'gpt-4'),
                    strategy=RoutingStrategy.BALANCED,
                    cost_estimate=provider.cost_per_token,
                    performance_score=health.capacity / 100.0,
                    reasoning="Fallback routing - limited options available"
                )

        # Emergency fallback
        return RouteDecision(
            provider_id='emergency-fallback',
            provider_name='Emergency Fallback',
            model='gpt-3.5-turbo',
            strategy=RoutingStrategy.BALANCED,
            cost_estimate=0.002,
            performance_score=0.5,
            reasoning="Emergency fallback - no healthy providers available"
        )

    async def get_routing_analytics(self, time_range: str = '1h') -> Dict[str, Any]:
        """Get routing analytics and performance metrics."""
        # Mock analytics - replace with real data aggregation
        return {
            'total_requests': 1250,
            'successful_routes': 1200,
            'failed_routes': 50,
            'avg_response_time': 2.3,
            'cost_savings': 45.67,
            'provider_usage': {
                'gpt-4-turbo': 450,
                'claude-3-opus': 380,
                'gpt-3.5-turbo': 420
            },
            'policy_effectiveness': {
                'enterprise-high-priority': 0.95,
                'cost-optimized-standard': 0.88,
                'performance-critical': 0.92
            },
            'time_range': time_range
        }

    async def update_provider_health(self, provider_id: str, health_data: Dict[str, Any]):
        """Manually update provider health status."""
        if provider_id in self.provider_health:
            health = self.provider_health[provider_id]
            health.response_time = health_data.get('response_time', health.response_time)
            health.error_rate = health_data.get('error_rate', health.error_rate)
            health.capacity = health_data.get('capacity', health.capacity)
            health.status = health_data.get('status', health.status)
            health.last_check = datetime.utcnow()

            logger.info(f"Updated health for {provider_id}: {health.status}")


# Global router instance
intelligent_router = IntelligentRouter()


async def get_intelligent_router() -> IntelligentRouter:
    """Get the global intelligent router instance."""
    if not intelligent_router.providers:  # Check if initialized
        await intelligent_router.initialize()
    return intelligent_router
