"""Provider Health Monitoring and Failover Service."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import aiohttp

from app.database import get_db_session
from app.monitoring.performance import performance_monitor

logger = logging.getLogger(__name__)


@dataclass
class HealthCheckResult:
    """Result of a health check."""
    provider_id: str
    status: str  # healthy, degraded, unhealthy
    response_time: float
    error_rate: float
    capacity: float
    last_check: datetime
    consecutive_failures: int
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


@dataclass
class FailoverEvent:
    """Record of a failover event."""
    provider_id: str
    from_provider: str
    to_provider: str
    reason: str
    timestamp: datetime
    recovery_time: Optional[float] = None


class HealthMonitor:
    """Comprehensive health monitoring and failover service."""

    def __init__(self):
        self.providers_health: Dict[str, HealthCheckResult] = {}
        self.failover_history: List[FailoverEvent] = []
        self.alert_thresholds = {
            'response_time': 5.0,  # seconds
            'error_rate': 0.1,     # 10%
            'capacity': 20.0       # 20% remaining
        }
        self.check_interval = 30  # seconds
        self.max_consecutive_failures = 3

    async def initialize(self):
        """Initialize the health monitor."""
        await self._load_provider_configs()
        await self._start_monitoring_loop()

        logger.info(f"Health Monitor initialized for {len(self.providers_health)} providers")

    async def _load_provider_configs(self):
        """Load provider configurations from database."""
        try:
            async with get_db_session() as session:
                providers = await session.execute(
                    "SELECT id, name, type, cost_per_token, avg_response_time, capacity FROM ai_providers"
                )
                for provider in providers:
                    self.providers_health[provider.id] = HealthCheckResult(
                        provider_id=provider.id,
                        status='unknown',
                        response_time=provider.avg_response_time,
                        error_rate=0.0,
                        capacity=provider.capacity,
                        last_check=datetime.utcnow(),
                        consecutive_failures=0
                    )
        except Exception as e:
            logger.error(f"Failed to load provider configs: {e}")

    async def _start_monitoring_loop(self):
        """Start the background monitoring loop."""
        asyncio.create_task(self._monitoring_loop())

    async def _monitoring_loop(self):
        """Main monitoring loop."""
        while True:
            try:
                await self._perform_health_checks()
                await self._check_failover_conditions()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(self.check_interval)

    async def _perform_health_checks(self):
        """Perform health checks on all providers."""
        for provider_id in self.providers_health.keys():
            try:
                health_result = await self._check_provider_health(provider_id)
                self.providers_health[provider_id] = health_result

                # Log health status changes
                if health_result.status != 'healthy':
                    logger.warning(f"Provider {provider_id} health degraded: {health_result.status}")

            except Exception as e:
                logger.error(f"Health check failed for {provider_id}: {e}")
                # Mark as unhealthy on check failure
                current = self.providers_health[provider_id]
                self.providers_health[provider_id] = HealthCheckResult(
                    provider_id=provider_id,
                    status='unhealthy',
                    response_time=current.response_time,
                    error_rate=min(current.error_rate + 0.1, 1.0),
                    capacity=current.capacity,
                    last_check=datetime.utcnow(),
                    consecutive_failures=current.consecutive_failures + 1,
                    error_message=str(e)
                )

    async def _check_provider_health(self, provider_id: str) -> HealthCheckResult:
        """Perform detailed health check on a specific provider."""
        start_time = time.time()
        current = self.providers_health[provider_id]

        try:
            # Simulate health check (replace with actual provider API calls)
            health_data = await self._perform_actual_health_check(provider_id)
            response_time = time.time() - start_time

            # Determine status based on metrics
            status = 'healthy'
            error_rate = health_data.get('error_rate', 0.0)

            if error_rate > 0.3 or response_time > 10.0:
                status = 'unhealthy'
            elif error_rate > 0.1 or response_time > 5.0:
                status = 'degraded'

            # Update consecutive failures
            consecutive_failures = 0 if status == 'healthy' else current.consecutive_failures + 1

            return HealthCheckResult(
                provider_id=provider_id,
                status=status,
                response_time=response_time,
                error_rate=error_rate,
                capacity=health_data.get('capacity', 100.0),
                last_check=datetime.utcnow(),
                consecutive_failures=consecutive_failures,
                details=health_data
            )

        except Exception as e:
            return HealthCheckResult(
                provider_id=provider_id,
                status='unhealthy',
                response_time=time.time() - start_time,
                error_rate=min(current.error_rate + 0.1, 1.0),
                capacity=current.capacity,
                last_check=datetime.utcnow(),
                consecutive_failures=current.consecutive_failures + 1,
                error_message=str(e)
            )

    async def _perform_actual_health_check(self, provider_id: str) -> Dict[str, Any]:
        """Perform actual health check against provider APIs."""
        # Mock implementation - replace with real provider API calls
        await asyncio.sleep(0.1)  # Simulate network delay

        # Simulate realistic health data
        base_error_rate = 0.02 + (asyncio.get_event_loop().time() % 1) * 0.05
        capacity = 85 + (asyncio.get_event_loop().time() % 1) * 30

        return {
            'error_rate': min(base_error_rate, 0.5),
            'capacity': capacity,
            'last_successful_request': datetime.utcnow().isoformat(),
            'total_requests': int(1000 + (asyncio.get_event_loop().time() % 1) * 5000),
            'active_connections': int(10 + (asyncio.get_event_loop().time() % 1) * 40)
        }

    async def _check_failover_conditions(self):
        """Check for conditions requiring failover."""
        for provider_id, health in self.providers_health.items():
            if health.status == 'unhealthy' and health.consecutive_failures >= self.max_consecutive_failures:
                await self._trigger_failover(provider_id, "unhealthy_provider")

            elif health.status == 'degraded' and health.error_rate > 0.2:
                await self._trigger_failover(provider_id, "high_error_rate")

    async def _trigger_failover(self, failing_provider_id: str, reason: str):
        """Trigger failover for a failing provider."""
        # Find healthy alternative providers
        healthy_providers = [
            pid for pid, health in self.providers_health.items()
            if pid != failing_provider_id and health.status == 'healthy'
        ]

        if not healthy_providers:
            logger.error(f"No healthy providers available for failover from {failing_provider_id}")
            return

        # Select best alternative (could be based on cost, performance, etc.)
        alternative_provider = healthy_providers[0]

        # Record failover event
        failover_event = FailoverEvent(
            provider_id=failing_provider_id,
            from_provider=failing_provider_id,
            to_provider=alternative_provider,
            reason=reason,
            timestamp=datetime.utcnow()
        )

        self.failover_history.append(failover_event)

        # Update routing policies to use alternative
        await self._update_routing_policies(failing_provider_id, alternative_provider)

        logger.info(f"Failover triggered: {failing_provider_id} -> {alternative_provider} (reason: {reason})")

        # Send alert
        await self._send_failover_alert(failover_event)

    async def _update_routing_policies(self, failing_provider: str, alternative_provider: str):
        """Update routing policies to use alternative provider."""
        try:
            async with get_db_session() as session:
                # Find policies using the failing provider
                affected_policies = await session.execute(
                    "SELECT id FROM routing_policies WHERE actions->>'primary_provider' = :provider",
                    {"provider": failing_provider}
                )

                # Update policies to use alternative
                for policy in affected_policies:
                    await session.execute(
                        "UPDATE routing_policies SET actions = jsonb_set(actions, '{primary_provider}', :alternative) WHERE id = :policy_id",
                        {"alternative": f'"{alternative_provider}"', "policy_id": policy.id}
                    )

                await session.commit()

        except Exception as e:
            logger.error(f"Failed to update routing policies: {e}")

    async def _send_failover_alert(self, failover: FailoverEvent):
        """Send alert about failover event."""
        # Implementation would send email/Slack alerts
        logger.warning(f"FAILOVER ALERT: {failover.from_provider} -> {failover.to_provider} ({failover.reason})")

    async def get_health_status(self, provider_id: Optional[str] = None) -> Dict[str, Any]:
        """Get current health status."""
        if provider_id:
            health = self.providers_health.get(provider_id)
            return {
                'provider_id': provider_id,
                'status': health.status if health else 'unknown',
                'response_time': health.response_time if health else 0.0,
                'error_rate': health.error_rate if health else 0.0,
                'capacity': health.capacity if health else 0.0,
                'last_check': health.last_check.isoformat() if health else None,
                'consecutive_failures': health.consecutive_failures if health else 0
            }

        # Return all providers' health
        return {
            'providers': {
                pid: {
                    'status': health.status,
                    'response_time': health.response_time,
                    'error_rate': health.error_rate,
                    'capacity': health.capacity,
                    'last_check': health.last_check.isoformat(),
                    'consecutive_failures': health.consecutive_failures
                }
                for pid, health in self.providers_health.items()
            },
            'summary': {
                'total_providers': len(self.providers_health),
                'healthy_providers': sum(1 for h in self.providers_health.values() if h.status == 'healthy'),
                'degraded_providers': sum(1 for h in self.providers_health.values() if h.status == 'degraded'),
                'unhealthy_providers': sum(1 for h in self.providers_health.values() if h.status == 'unhealthy'),
                'average_response_time': sum(h.response_time for h in self.providers_health.values()) / len(self.providers_health),
                'total_failovers': len(self.failover_history)
            }
        }

    async def get_failover_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent failover events."""
        recent_failovers = self.failover_history[-limit:]

        return [
            {
                'provider_id': f.provider_id,
                'from_provider': f.from_provider,
                'to_provider': f.to_provider,
                'reason': f.reason,
                'timestamp': f.timestamp.isoformat(),
                'recovery_time': f.recovery_time
            }
            for f in recent_failovers
        ]

    async def manual_health_check(self, provider_id: str) -> Dict[str, Any]:
        """Perform manual health check on demand."""
        try:
            health_result = await self._check_provider_health(provider_id)
            self.providers_health[provider_id] = health_result

            return {
                'success': True,
                'provider_id': provider_id,
                'status': health_result.status,
                'response_time': health_result.response_time,
                'error_rate': health_result.error_rate,
                'capacity': health_result.capacity,
                'details': health_result.details
            }
        except Exception as e:
            return {
                'success': False,
                'provider_id': provider_id,
                'error': str(e)
            }

    async def force_failover(self, from_provider: str, to_provider: str, reason: str = "manual"):
        """Manually trigger a failover."""
        if from_provider not in self.providers_health:
            raise ValueError(f"Provider {from_provider} not found")

        if to_provider not in self.providers_health:
            raise ValueError(f"Alternative provider {to_provider} not found")

        failover_event = FailoverEvent(
            provider_id=from_provider,
            from_provider=from_provider,
            to_provider=to_provider,
            reason=reason,
            timestamp=datetime.utcnow()
        )

        self.failover_history.append(failover_event)
        await self._update_routing_policies(from_provider, to_provider)

        logger.info(f"Manual failover executed: {from_provider} -> {to_provider}")

        return {
            'success': True,
            'failover_event': {
                'from_provider': from_provider,
                'to_provider': to_provider,
                'reason': reason,
                'timestamp': failover_event.timestamp.isoformat()
            }
        }


# Global health monitor instance
health_monitor = HealthMonitor()


async def get_health_monitor() -> HealthMonitor:
    """Get the global health monitor instance."""
    if not health_monitor.providers_health:  # Check if initialized
        await health_monitor.initialize()
    return health_monitor
