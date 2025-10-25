"""Enhanced Multi-Tenant Caching & Performance Service - Redis cluster and \
    CDN integration."""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

import redis.asyncio as redis

from app.core.saas_config import SaaSConfig
from app.models.tenant import Tenant
from app.models.user import User

logger = logging.getLogger(__name__)


class CacheType(str, Enum):
    """Types of cache implementations."""

    REDIS = "redis"
    MEMORY = "memory"
    HYBRID = "hybrid"


class CacheStrategy(str, Enum):
    """Caching strategies for multi-tenant environments."""

    PER_TENANT = "per_tenant"
    SHARED = "shared"
    HYBRID = "hybrid"


class CachePriority(str, Enum):
    """Cache priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class CacheEntry:
    """Cache entry with metadata."""

    key: str
    value: Any
    tenant_id: Optional[UUID]
    created_at: datetime
    expires_at: Optional[datetime]
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    priority: CachePriority = CachePriority.MEDIUM
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CacheMetrics:
    """Cache performance metrics."""

    hits: int = 0
    misses: int = 0
    evictions: int = 0
    sets: int = 0
    deletes: int = 0
    total_size: int = 0
    tenant_count: int = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return (self.hits / total * 100) if total > 0 else 0.0

    @property
    def efficiency(self) -> float:
        """Calculate cache efficiency."""
        return self.hit_rate - (self.evictions / max(self.sets, 1) * 100)


@dataclass
class CDNConfig:
    """CDN configuration for asset delivery."""

    provider: str = "cloudflare"
    enabled: bool = True
    custom_domain: Optional[str] = None
    cache_ttl: int = 3600  # 1 hour
    purge_on_update: bool = True
    optimization_level: str = "standard"


@dataclass
class PerformanceMetrics:
    """Performance metrics for tenant operations."""

    tenant_id: UUID
    response_time_ms: float
    cache_hit: bool
    memory_usage: int
    db_queries: int
    timestamp: datetime


class MultiTenantCachingService:
    """Enhanced Multi-Tenant Caching & Performance Service - Redis cluster and \
        CDN integration."""

    def __init__(self, db_session):
        self.db = db_session
        self.config = SaaSConfig()

        # Cache configuration
        self.cache_type = CacheType.REDIS
        self.cache_strategy = CacheStrategy.PER_TENANT
        self.default_ttl = 300  # 5 minutes
        self.max_memory_per_tenant = 100 * 1024 * 1024  # 100MB

        # Redis configuration
        self.redis_client: Optional[redis.Redis] = None
        self.redis_cluster: Optional[redis.RedisCluster] = None

        # Memory cache fallback
        self.memory_cache: Dict[str, CacheEntry] = {}
        self.tenant_metrics: Dict[UUID, CacheMetrics] = {}

        # CDN configuration
        self.cdn_config = CDNConfig()

        # Performance monitoring
        self.performance_metrics: List[PerformanceMetrics] = []

    async def initialize(self):
        """Initialize the caching service."""
        try:
            await self._initialize_redis()
            await self._initialize_cdn()
            logger.info(
                "Multi-tenant caching service initialized successfully"
            )
        except Exception as e:
            logger.error(f"Failed to initialize caching service: {str(e)}")
            raise

    async def _initialize_redis(self):
        """Initialize Redis connection."""
        try:
            # Redis cluster configuration
            redis_config = {
                "host": "localhost",
                "port": 6379,
                "db": 0,
                "decode_responses": True,
                "socket_connect_timeout": 5,
                "socket_timeout": 5,
                "retry_on_timeout": True,
                "max_connections": 50,
            }

            # Check if Redis cluster is available
            if hasattr(self.config, "REDIS_CLUSTER_NODES"):
                # Initialize Redis cluster
                startup_nodes = self.config.REDIS_CLUSTER_NODES
                self.redis_cluster = redis.RedisCluster(
                    startup_nodes=startup_nodes,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                )
                logger.info("Redis cluster initialized")
            else:
                # Initialize single Redis instance
                self.redis_client = redis.Redis(**redis_config)
                await self.redis_client.ping()
                logger.info("Redis client initialized")

        except Exception as e:
            logger.warning(
                f"Redis initialization failed, using memory cache: {str(e)}"
            )
            self.cache_type = CacheType.MEMORY

    async def _initialize_cdn(self):
        """Initialize CDN configuration."""
        try:
            # Load CDN configuration from settings
            if hasattr(self.config, "CDN_CONFIG"):
                cdn_settings = self.config.CDN_CONFIG
                self.cdn_config = CDNConfig(**cdn_settings)

            logger.info(f"CDN initialized: {self.cdn_config.provider}")

        except Exception as e:
            logger.warning(f"CDN initialization failed: {str(e)}")

    @asynccontextmanager
    async def performance_monitor(self, tenant_id: UUID):
        """Context manager for performance monitoring."""
        start_time = asyncio.get_event_loop().time()
        initial_memory = 0  # Would get actual memory usage

        try:
            yield
        finally:
            end_time = asyncio.get_event_loop().time()
            response_time = (end_time - start_time) * 1000

            # Record performance metrics
            metrics = PerformanceMetrics(
                tenant_id=tenant_id,
                response_time_ms=response_time,
                cache_hit=False,  # Would be determined by cache operations
                memory_usage=initial_memory,
                db_queries=0,  # Would be counted by query monitoring
                timestamp=datetime.utcnow(),
            )

            self.performance_metrics.append(metrics)

            # Keep only recent metrics
            if len(self.performance_metrics) > 1000:
                self.performance_metrics = self.performance_metrics[-500:]

    async def get(
        self, key: str, tenant_id: Optional[UUID] = None
    ) -> Optional[Any]:
        """Get value from cache."""
        cache_key = self._build_cache_key(key, tenant_id)

        try:
            if self.cache_type == CacheType.REDIS and self.redis_client:
                value = await self.redis_client.get(cache_key)
                if value:
                    await self._record_cache_hit(tenant_id)
                    return json.loads(value)
                else:
                    await self._record_cache_miss(tenant_id)

            elif self.cache_type == CacheType.MEMORY:
                entry = self.memory_cache.get(cache_key)
                if entry and (
                    not entry.expires_at
                    or entry.expires_at > datetime.utcnow()
                ):
                    entry.access_count += 1
                    entry.last_accessed = datetime.utcnow()
                    await self._record_cache_hit(tenant_id)
                    return entry.value
                else:
                    await self._record_cache_miss(tenant_id)

            return None

        except Exception as e:
            logger.error(f"Cache get failed: {str(e)}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        tenant_id: Optional[UUID] = None,
        ttl: Optional[int] = None,
        priority: CachePriority = CachePriority.MEDIUM,
        tags: List[str] = None,
    ) -> bool:
        """Set value in cache."""
        cache_key = self._build_cache_key(key, tenant_id)
        ttl = ttl or self.default_ttl

        try:
            # Check tenant memory limits
            if tenant_id and await self._check_tenant_memory_limit(tenant_id):
                logger.warning(f"Tenant {tenant_id} exceeded memory limit")
                return False

            cache_entry = CacheEntry(
                key=cache_key,
                value=value,
                tenant_id=tenant_id,
                created_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(seconds=ttl)
                if ttl
                else None,
                priority=priority,
                tags=tags or [],
            )

            if self.cache_type == CacheType.REDIS and self.redis_client:
                serialized_value = json.dumps(value)
                await self.redis_client.setex(cache_key, ttl, serialized_value)
                await self._record_cache_set(tenant_id)

            elif self.cache_type == CacheType.MEMORY:
                self.memory_cache[cache_key] = cache_entry
                await self._record_cache_set(tenant_id)

            return True

        except Exception as e:
            logger.error(f"Cache set failed: {str(e)}")
            return False

    async def delete(self, key: str, tenant_id: Optional[UUID] = None) -> bool:
        """Delete value from cache."""
        cache_key = self._build_cache_key(key, tenant_id)

        try:
            if self.cache_type == CacheType.REDIS and self.redis_client:
                result = await self.redis_client.delete(cache_key)
                if result > 0:
                    await self._record_cache_delete(tenant_id)
                    return True

            elif self.cache_type == CacheType.MEMORY:
                if cache_key in self.memory_cache:
                    del self.memory_cache[cache_key]
                    await self._record_cache_delete(tenant_id)
                    return True

            return False

        except Exception as e:
            logger.error(f"Cache delete failed: {str(e)}")
            return False

    async def clear_tenant_cache(self, tenant_id: UUID) -> int:
        """Clear all cache entries for a specific tenant."""
        try:
            cleared_count = 0

            if self.cache_type == CacheType.REDIS and self.redis_client:
                # Find all keys for the tenant
                tenant_pattern = f"tenant:{tenant_id}:*"
                keys = await self.redis_client.keys(tenant_pattern)
                if keys:
                    cleared_count = await self.redis_client.delete(*keys)

            elif self.cache_type == CacheType.MEMORY:
                # Remove tenant entries from memory cache
                tenant_keys = [
                    k
                    for k in self.memory_cache.keys()
                    if f"tenant:{tenant_id}" in k
                ]
                for key in tenant_keys:
                    del self.memory_cache[key]
                cleared_count = len(tenant_keys)

            # Reset tenant metrics
            if tenant_id in self.tenant_metrics:
                del self.tenant_metrics[tenant_id]

            logger.info(
                f"Cleared {cleared_count} cache entries for tenant {tenant_id}"
            )
            return cleared_count

        except Exception as e:
            logger.error(f"Tenant cache clear failed: {str(e)}")
            return 0

    async def get_tenant_cache_metrics(self, tenant_id: UUID) -> CacheMetrics:
        """Get cache metrics for a specific tenant."""
        return self.tenant_metrics.get(tenant_id, CacheMetrics())

    async def get_global_cache_metrics(self) -> Dict[str, Any]:
        """Get global cache metrics across all tenants."""
        try:
            total_metrics = CacheMetrics()

            for tenant_metrics in self.tenant_metrics.values():
                total_metrics.hits += tenant_metrics.hits
                total_metrics.misses += tenant_metrics.misses
                total_metrics.evictions += tenant_metrics.evictions
                total_metrics.sets += tenant_metrics.sets
                total_metrics.deletes += tenant_metrics.deletes

            total_metrics.tenant_count = len(self.tenant_metrics)

            # Get memory usage
            if self.cache_type == CacheType.MEMORY:
                total_metrics.total_size = sum(
                    len(json.dumps(entry.value))
                    for entry in self.memory_cache.values()
                )
            elif self.cache_type == CacheType.REDIS and self.redis_client:
                info = await self.redis_client.info()
                total_metrics.total_size = info.get("used_memory", 0)

            return {
                "metrics": total_metrics,
                "performance": {
                    "hit_rate": total_metrics.hit_rate,
                    "efficiency": total_metrics.efficiency,
                    "total_size_mb": total_metrics.total_size / (1024 * 1024),
                },
                "tenants": total_metrics.tenant_count,
                "cache_type": self.cache_type.value,
            }

        except Exception as e:
            logger.error(f"Global metrics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def optimize_cache(
        self, tenant_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Optimize cache by removing expired entries and low-priority items."""
        try:
            optimization_results = {
                "expired_removed": 0,
                "low_priority_removed": 0,
                "memory_freed": 0,
            }

            if self.cache_type == CacheType.MEMORY:
                # Clean up expired entries
                expired_keys = [
                    k
                    for k, v in self.memory_cache.items()
                    if v.expires_at and v.expires_at < datetime.utcnow()
                ]

                for key in expired_keys:
                    del self.memory_cache[key]
                optimization_results["expired_removed"] = len(expired_keys)

                # Remove low priority items if memory is tight
                if tenant_id:
                    tenant_entries = [
                        (k, v)
                        for k, v in self.memory_cache.items()
                        if v.tenant_id == tenant_id
                    ]

                    # Sort by priority and last access time
                    tenant_entries.sort(
                        key=lambda x: (
                            x[1].priority.value,
                            x[1].last_accessed or datetime.min,
                        )
                    )

                    # Remove lowest priority items if needed
                    memory_used = sum(
                        len(json.dumps(v.value)) for _, v in tenant_entries
                    )
                    if memory_used > self.max_memory_per_tenant:
                        to_remove = tenant_entries[
                            : len(tenant_entries) // 4
                        ]  # Remove 25%
                        for key, _ in to_remove:
                            if key in self.memory_cache:
                                del self.memory_cache[key]
                        optimization_results["low_priority_removed"] = len(
                            to_remove
                        )

            elif self.cache_type == CacheType.REDIS and self.redis_client:
                # Redis automatically handles expiration
                # We could implement manual optimization here
                pass

            return optimization_results

        except Exception as e:
            logger.error(f"Cache optimization failed: {str(e)}")
            return {"error": str(e)}

    async def preload_tenant_data(
        self, tenant_id: UUID, data_types: List[str]
    ) -> int:
        """Preload frequently accessed tenant data into cache."""
        try:
            preloaded_count = 0

            # Get tenant information
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                return 0

            # Preload tenant configuration
            if "tenant_config" in data_types:
                await self.set(
                    "tenant_config",
                    {
                        "name": tenant.name,
                        "domain": tenant.domain,
                        "plan": tenant.subscription_plan,
                        "features": tenant.get_plan_features(),
                    },
                    tenant_id=tenant_id,
                    ttl=3600,  # 1 hour
                    priority=CachePriority.HIGH,
                )
                preloaded_count += 1

            # Preload user count
            if "user_count" in data_types:
                user_count = (
                    self.db.query(User)
                    .filter(User.tenant_id == tenant_id)
                    .count()
                )
                await self.set(
                    "user_count",
                    user_count,
                    tenant_id=tenant_id,
                    ttl=1800,  # 30 minutes
                    priority=CachePriority.MEDIUM,
                )
                preloaded_count += 1

            # Preload recent usage metrics
            if "usage_metrics" in data_types:
                # This would integrate with the analytics service
                await self.set(
                    "usage_metrics",
                    {"last_updated": datetime.utcnow()},
                    tenant_id=tenant_id,
                    ttl=900,  # 15 minutes
                    priority=CachePriority.MEDIUM,
                )
                preloaded_count += 1

            logger.info(
                f"Preloaded {preloaded_count} data items for tenant {tenant_id}"
            )
            return preloaded_count

        except Exception as e:
            logger.error(f"Data preloading failed: {str(e)}")
            return 0

    async def get_cdn_url(
        self, asset_path: str, tenant_id: Optional[UUID] = None
    ) -> str:
        """Get CDN URL for asset delivery."""
        try:
            if not self.cdn_config.enabled:
                return asset_path

            base_url = (
                self.cdn_config.custom_domain
                or f"https://{self.cdn_config.provider}.com"
            )

            if tenant_id:
                # Tenant-specific CDN path
                cdn_path = f"{base_url}/tenant/{tenant_id}/{asset_path}"
            else:
                # Global CDN path
                cdn_path = f"{base_url}/{asset_path}"

            return cdn_path

        except Exception as e:
            logger.error(f"CDN URL generation failed: {str(e)}")
            return asset_path

    async def purge_cdn_cache(
        self, asset_path: str, tenant_id: Optional[UUID] = None
    ) -> bool:
        """Purge CDN cache for specific asset."""
        try:
            if (
                not self.cdn_config.enabled
                or not self.cdn_config.purge_on_update
            ):
                return True

            # This would implement CDN-specific purge APIs
            # For now, just log the operation
            cdn_url = await self.get_cdn_url(asset_path, tenant_id)
            logger.info(f"Purging CDN cache for: {cdn_url}")

            return True

        except Exception as e:
            logger.error(f"CDN cache purge failed: {str(e)}")
            return False

    async def get_performance_report(
        self, tenant_id: Optional[UUID] = None, hours: int = 24
    ) -> Dict[str, Any]:
        """Generate performance report."""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)

            if tenant_id:
                # Tenant-specific performance
                metrics = [
                    m
                    for m in self.performance_metrics
                    if m.tenant_id == tenant_id and m.timestamp >= cutoff_time
                ]
            else:
                # Global performance
                metrics = [
                    m
                    for m in self.performance_metrics
                    if m.timestamp >= cutoff_time
                ]

            if not metrics:
                return {"message": "No performance data available"}

            # Calculate performance statistics
            response_times = [m.response_time_ms for m in metrics]
            cache_hits = sum(1 for m in metrics if m.cache_hit)

            report = {
                "time_period_hours": hours,
                "total_requests": len(metrics),
                "cache_hit_rate": (cache_hits / len(metrics) * 100)
                if metrics
                else 0,
                "avg_response_time_ms": (
                    sum(response_times) / len(response_times)
                    if response_times
                    else 0
                ),
                "min_response_time_ms": min(response_times)
                if response_times
                else 0,
                "max_response_time_ms": max(response_times)
                if response_times
                else 0,
                "p95_response_time_ms": (
                    self._calculate_percentile(response_times, 95)
                    if response_times
                    else 0
                ),
                "p99_response_time_ms": (
                    self._calculate_percentile(response_times, 99)
                    if response_times
                    else 0
                ),
                "cache_metrics": (
                    await self.get_global_cache_metrics()
                    if not tenant_id
                    else await self.get_tenant_cache_metrics(tenant_id)
                ),
            }

            return report

        except Exception as e:
            logger.error(f"Performance report generation failed: {str(e)}")
            return {"error": str(e)}

    def _calculate_percentile(
        self, data: List[float], percentile: float
    ) -> float:
        """Calculate percentile from data list."""
        if not data:
            return 0.0

        data_sorted = sorted(data)
        index = (len(data_sorted) - 1) * (percentile / 100)
        floor_index = int(index)
        ceil_index = floor_index + 1

        if ceil_index >= len(data_sorted):
            return data_sorted[floor_index]

        # Linear interpolation
        weight = index - floor_index
        return (
            data_sorted[floor_index] * (1 - weight)
            + data_sorted[ceil_index] * weight
        )

    def _build_cache_key(
        self, key: str, tenant_id: Optional[UUID] = None
    ) -> str:
        """Build cache key with tenant isolation."""
        if tenant_id:
            return f"tenant:{tenant_id}:{key}"
        else:
            return f"global:{key}"

    async def _check_tenant_memory_limit(self, tenant_id: UUID) -> bool:
        """Check if tenant has exceeded memory limit."""
        if self.cache_type != CacheType.MEMORY:
            return False

        tenant_entries = [
            v for v in self.memory_cache.values() if v.tenant_id == tenant_id
        ]
        total_size = sum(
            len(json.dumps(entry.value)) for entry in tenant_entries
        )

        return total_size >= self.max_memory_per_tenant

    async def _record_cache_hit(self, tenant_id: Optional[UUID]):
        """Record cache hit."""
        if tenant_id:
            if tenant_id not in self.tenant_metrics:
                self.tenant_metrics[tenant_id] = CacheMetrics()
            self.tenant_metrics[tenant_id].hits += 1

    async def _record_cache_miss(self, tenant_id: Optional[UUID]):
        """Record cache miss."""
        if tenant_id:
            if tenant_id not in self.tenant_metrics:
                self.tenant_metrics[tenant_id] = CacheMetrics()
            self.tenant_metrics[tenant_id].misses += 1

    async def _record_cache_set(self, tenant_id: Optional[UUID]):
        """Record cache set."""
        if tenant_id:
            if tenant_id not in self.tenant_metrics:
                self.tenant_metrics[tenant_id] = CacheMetrics()
            self.tenant_metrics[tenant_id].sets += 1

    async def _record_cache_delete(self, tenant_id: Optional[UUID]):
        """Record cache delete."""
        if tenant_id:
            if tenant_id not in self.tenant_metrics:
                self.tenant_metrics[tenant_id] = CacheMetrics()
            self.tenant_metrics[tenant_id].deletes += 1

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on caching service."""
        try:
            health_status = {
                "status": "healthy",
                "cache_type": self.cache_type.value,
                "redis_connected": False,
                "memory_cache_entries": len(self.memory_cache),
                "tenant_count": len(self.tenant_metrics),
                "cdn_enabled": self.cdn_config.enabled,
            }

            # Test Redis connection
            if self.cache_type == CacheType.REDIS and self.redis_client:
                try:
                    await self.redis_client.ping()
                    health_status["redis_connected"] = True
                except Exception:
                    health_status["redis_connected"] = False
                    health_status["status"] = "degraded"

            # Test basic cache operations
            test_key = "health_check_test"
            test_value = {
                "status": "ok",
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Set test value
            set_result = await self.set(test_key, test_value, ttl=60)
            health_status["cache_set_works"] = set_result

            # Get test value
            retrieved_value = await self.get(test_key)
            health_status["cache_get_works"] = retrieved_value == test_value

            # Clean up
            await self.delete(test_key)

            if not (
                health_status["cache_set_works"]
                and health_status["cache_get_works"]
            ):
                health_status["status"] = "unhealthy"

            return health_status

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "cache_type": self.cache_type.value,
            }
