"""Service discovery and registration for the API gateway."""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
import redis
from datetime import datetime, timedelta

from app.middleware.logging import get_logger

logger = get_logger(__name__)


class ServiceStatus(Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    MAINTENANCE = "maintenance"
    DOWN = "down"


@dataclass
class ServiceInstance:
    """Service instance information."""
    service_id: str
    service_type: str
    host: str
    port: int
    protocol: str = "http"
    version: str = "1.0.0"
    status: ServiceStatus = ServiceStatus.HEALTHY
    metadata: Dict[str, Any] = None
    registered_at: float = 0
    last_heartbeat: float = 0
    ttl: int = 300  # 5 minutes

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        self.registered_at = time.time()
        self.last_heartbeat = time.time()

    @property
    def base_url(self) -> str:
        """Get the base URL for this service instance."""
        return f"{self.protocol}://{self.host}:{self.port}"

    @property
    def is_expired(self) -> bool:
        """Check if service instance has expired."""
        return time.time() - self.last_heartbeat > self.ttl

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data['status'] = self.status.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ServiceInstance':
        """Create instance from dictionary."""
        data['status'] = ServiceStatus(data['status'])
        return cls(**data)


@dataclass
class ServiceHealth:
    """Service health information."""
    service_id: str
    status: ServiceStatus
    response_time: float
    last_check: float
    consecutive_failures: int = 0
    total_checks: int = 0
    uptime_percentage: float = 100.0


class ServiceDiscovery:
    """Service discovery and health monitoring system."""

    def __init__(self, redis_url: str = "redis://localhost:6379/2"):
        self.redis = redis.Redis.from_url(redis_url, decode_responses=True)
        self.services: Dict[str, List[ServiceInstance]] = {}
        self.health_checks: Dict[str, ServiceHealth] = {}
        self.health_check_interval = 30  # seconds
        self._running = False
        self._health_check_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start the service discovery system."""
        self._running = True
        # Load existing services from Redis
        await self._load_services_from_redis()
        # Start health check loop
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        logger.info("Service discovery started")

    async def stop(self):
        """Stop the service discovery system."""
        self._running = False
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
        logger.info("Service discovery stopped")

    async def register_service(self, instance: ServiceInstance) -> bool:
        """Register a service instance."""
        try:
            # Add to local cache
            if instance.service_type not in self.services:
                self.services[instance.service_type] = []
            self.services[instance.service_type].append(instance)

            # Save to Redis
            key = f"service:{instance.service_type}:{instance.service_id}"
            self.redis.setex(key, instance.ttl, json.dumps(instance.to_dict()))

            # Initialize health tracking
            self.health_checks[instance.service_id] = ServiceHealth(
                service_id=instance.service_id,
                status=ServiceStatus.HEALTHY,
                response_time=0.0,
                last_check=time.time()
            )

            logger.info(f"Service registered: {instance.service_type}/{instance.service_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to register service {instance.service_id}: {str(e)}")
            return False

    async def deregister_service(self, service_type: str, service_id: str) -> bool:
        """Deregister a service instance."""
        try:
            # Remove from local cache
            if service_type in self.services:
                self.services[service_type] = [
                    s for s in self.services[service_type]
                    if s.service_id != service_id
                ]

            # Remove from Redis
            key = f"service:{service_type}:{service_id}"
            self.redis.delete(key)

            # Remove health tracking
            if service_id in self.health_checks:
                del self.health_checks[service_id]

            logger.info(f"Service deregistered: {service_type}/{service_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to deregister service {service_id}: {str(e)}")
            return False

    def get_service_instances(self, service_type: str) -> List[ServiceInstance]:
        """Get all instances of a service type."""
        return self.services.get(service_type, [])

    def get_healthy_instances(self, service_type: str) -> List[ServiceInstance]:
        """Get healthy instances of a service type."""
        instances = self.services.get(service_type, [])
        healthy_instances = []

        for instance in instances:
            health = self.health_checks.get(instance.service_id)
            if health and health.status == ServiceStatus.HEALTHY and not instance.is_expired:
                healthy_instances.append(instance)

        return healthy_instances

    def get_service_health(self, service_id: str) -> Optional[ServiceHealth]:
        """Get health information for a service."""
        return self.health_checks.get(service_id)

    def get_all_services_health(self) -> Dict[str, List[ServiceHealth]]:
        """Get health information for all services."""
        result = {}
        for service_type, instances in self.services.items():
            result[service_type] = [
                self.health_checks.get(instance.service_id)
                for instance in instances
                if instance.service_id in self.health_checks
            ]
        return result

    async def _load_services_from_redis(self):
        """Load service instances from Redis."""
        try:
            # Get all service keys
            keys = self.redis.keys("service:*")
            for key in keys:
                try:
                    data = self.redis.get(key)
                    if data:
                        instance = ServiceInstance.from_dict(json.loads(data))

                        # Only load if not expired
                        if not instance.is_expired:
                            if instance.service_type not in self.services:
                                self.services[instance.service_type] = []
                            self.services[instance.service_type].append(instance)

                            # Initialize health tracking
                            self.health_checks[instance.service_id] = ServiceHealth(
                                service_id=instance.service_id,
                                status=ServiceStatus.HEALTHY,
                                response_time=0.0,
                                last_check=time.time()
                            )
                except Exception as e:
                    logger.error(f"Failed to load service from Redis key {key}: {str(e)}")

        except Exception as e:
            logger.error(f"Failed to load services from Redis: {str(e)}")

    async def _health_check_loop(self):
        """Periodic health check loop."""
        while self._running:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                logger.error(f"Health check loop error: {str(e)}")
                await asyncio.sleep(5)  # Wait before retrying

    async def _perform_health_checks(self):
        """Perform health checks on all service instances."""
        for service_type, instances in self.services.items():
            for instance in instances:
                await self._check_service_health(instance)

    async def _check_service_health(self, instance: ServiceInstance):
        """Check health of a single service instance."""
        health = self.health_checks.get(instance.service_id)
        if not health:
            return

        start_time = time.time()

        try:
            # Check if service has expired
            if instance.is_expired:
                health.status = ServiceStatus.DOWN
                health.consecutive_failures += 1
                logger.warning(f"Service {instance.service_id} has expired")
                return

            # Perform health check
            timeout = aiohttp.ClientTimeout(total=10)
            health_endpoint = instance.metadata.get('health_endpoint', '/health')

            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(f"{instance.base_url}{health_endpoint}") as response:
                    response_time = time.time() - start_time

                    # Update health metrics
                    health.response_time = response_time
                    health.last_check = time.time()
                    health.total_checks += 1

                    if response.status == 200:
                        health.status = ServiceStatus.HEALTHY
                        health.consecutive_failures = 0
                        health.uptime_percentage = (
                            (health.total_checks - health.consecutive_failures) /
                            health.total_checks * 100
                        )
                    else:
                        health.status = ServiceStatus.UNHEALTHY
                        health.consecutive_failures += 1
                        logger.warning(f"Service {instance.service_id} health check failed: {response.status}")

        except Exception as e:
            response_time = time.time() - start_time
            health.response_time = response_time
            health.last_check = time.time()
            health.total_checks += 1
            health.consecutive_failures += 1
            health.status = ServiceStatus.UNHEALTHY

            logger.warning(f"Service {instance.service_id} health check error: {str(e)}")

            # Mark as down after 3 consecutive failures
            if health.consecutive_failures >= 3:
                health.status = ServiceStatus.DOWN
                logger.error(f"Service {instance.service_id} marked as DOWN after {health.consecutive_failures} failures")

    async def send_heartbeat(self, service_type: str, service_id: str):
        """Update service heartbeat."""
        if service_type in self.services:
            for instance in self.services[service_type]:
                if instance.service_id == service_id:
                    instance.last_heartbeat = time.time()

                    # Update Redis TTL
                    key = f"service:{service_type}:{service_id}"
                    self.redis.expire(key, instance.ttl)
                    break

    def get_service_stats(self) -> Dict[str, Any]:
        """Get service discovery statistics."""
        total_services = sum(len(instances) for instances in self.services.values())
        healthy_services = sum(
            1 for instances in self.services.values()
            for instance in instances
            if self.health_checks.get(instance.service_id, ServiceHealth("", ServiceStatus.DOWN, 0, 0)).status == ServiceStatus.HEALTHY
        )

        return {
            "total_services": total_services,
            "healthy_services": healthy_services,
            "service_types": list(self.services.keys()),
            "health_check_interval": self.health_check_interval,
            "uptime": time.time()  # Service discovery uptime
        }


# Global service discovery instance
service_discovery = ServiceDiscovery()


async def get_service_discovery() -> ServiceDiscovery:
    """Dependency injection for service discovery."""
    return service_discovery
