"""
Response caching system for Agent API read-heavy operations.
Implements both in-memory and Redis caching with TTL support.
"""

import asyncio
import hashlib
import json
import logging
import time
from functools import wraps
from typing import Any, Dict, Optional, Union

from fastapi import Request, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

from cachetools import LRUCache, TTLCache


class CacheConfig:
    """Configuration for caching system"""

    # Memory cache settings
    MEMORY_CACHE_SIZE = 1000
    DEFAULT_TTL = 300  # 5 minutes

    # Redis settings
    REDIS_URL = "redis://localhost:6379"
    REDIS_DB = 0
    REDIS_PREFIX = "agents_cache:"

    # Cache TTL for different operations
    CACHE_TTLS = {
        "agent_status": 60,  # 1 minute
        "health_check": 30,  # 30 seconds
        "compliance_validation": 600,  # 10 minutes
        "rag_query": 300,  # 5 minutes (for identical queries)
        "service_metrics": 60,  # 1 minute
    }


class AgentCacheManager:
    """Advanced caching manager with fallback strategies"""

    def __init__(self):
        # Initialize memory cache
        self.memory_cache = TTLCache(
            maxsize=CacheConfig.MEMORY_CACHE_SIZE, ttl=CacheConfig.DEFAULT_TTL
        )

        # Initialize Redis client if available
        self.redis_client = None
        if REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(
                    CacheConfig.REDIS_URL,
                    db=CacheConfig.REDIS_DB,
                    decode_responses=True,
                )
            except Exception as e:
                logger.warning(
                    f"Redis connection failed: {e}. Using memory cache only."
                )

        self.stats = {"hits": 0, "misses": 0, "sets": 0, "errors": 0}

    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from arguments"""
        key_data = {"args": args, "kwargs": sorted(kwargs.items()) if kwargs else {}}
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{CacheConfig.REDIS_PREFIX}{prefix}:{key_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis first, then memory)"""
        try:
            # Try Redis first
            if self.redis_client:
                try:
                    value = await self.redis_client.get(key)
                    if value:
                        self.stats["hits"] += 1
                        return json.loads(value)
                except Exception as e:
                    logger.warning(f"Redis get error: {e}")

            # Fallback to memory cache
            if key in self.memory_cache:
                self.stats["hits"] += 1
                return self.memory_cache[key]

            self.stats["misses"] += 1
            return None

        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.stats["errors"] += 1
            return None

    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            ttl = ttl or CacheConfig.DEFAULT_TTL
            serialized_value = json.dumps(value, default=str)

            # Set in Redis
            if self.redis_client:
                try:
                    await self.redis_client.setex(key, ttl, serialized_value)
                except Exception as e:
                    logger.warning(f"Redis set error: {e}")

            # Set in memory cache
            self.memory_cache[key] = value
            self.stats["sets"] += 1
            return True

        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self.stats["errors"] += 1
            return False

    async def delete(self, key: str) -> bool:
        """Delete from both caches"""
        try:
            deleted = False

            # Delete from Redis
            if self.redis_client:
                try:
                    await self.redis_client.delete(key)
                    deleted = True
                except Exception as e:
                    logger.warning(f"Redis delete error: {e}")

            # Delete from memory cache
            if key in self.memory_cache:
                del self.memory_cache[key]
                deleted = True

            return deleted

        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            self.stats["errors"] += 1
            return False

    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            cleared = 0

            # Clear from Redis
            if self.redis_client:
                try:
                    keys = await self.redis_client.keys(f"{pattern}*")
                    if keys:
                        await self.redis_client.delete(*keys)
                        cleared += len(keys)
                except Exception as e:
                    logger.warning(f"Redis pattern clear error: {e}")

            # Clear from memory cache (approximate pattern matching)
            memory_keys_to_delete = [
                k for k in self.memory_cache.keys() if pattern in k
            ]
            for key in memory_keys_to_delete:
                del self.memory_cache[key]
                cleared += 1

            return cleared

        except Exception as e:
            logger.error(f"Cache pattern clear error: {e}")
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        hit_rate = (
            self.stats["hits"] / (self.stats["hits"] + self.stats["misses"])
            if (self.stats["hits"] + self.stats["misses"]) > 0
            else 0
        )

        return {
            **self.stats,
            "hit_rate": round(hit_rate, 3),
            "memory_cache_size": len(self.memory_cache),
            "redis_available": self.redis_client is not None,
        }


# Global cache manager instance
cache_manager = AgentCacheManager()


def cached_response(cache_key_prefix: str, ttl: int = None, vary_by: list = None):
    """
    Decorator for caching API responses

    Args:
        cache_key_prefix: Prefix for cache key
        ttl: Time to live in seconds
        vary_by: List of request attributes to vary cache by (e.g., ['user_id', 'tenant_id'])
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request and user info from kwargs
            request = None
            user_info = None

            for key, value in kwargs.items():
                if isinstance(value, Request):
                    request = value
                elif isinstance(value, dict) and "user_id" in value:
                    user_info = value

            # Build cache key
            cache_key_parts = [cache_key_prefix]

            if vary_by:
                for vary_param in vary_by:
                    if user_info and vary_param in user_info:
                        cache_key_parts.append(f"{vary_param}:{user_info[vary_param]}")
                    elif request and hasattr(request, vary_param):
                        cache_key_parts.append(
                            f"{vary_param}:{getattr(request, vary_param)}"
                        )

            # Add function arguments to cache key
            cache_key = cache_manager._generate_cache_key(
                "_".join(cache_key_parts),
                *args,
                **{
                    k: v
                    for k, v in kwargs.items()
                    if not isinstance(v, (Request, dict))
                },
            )

            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key_prefix}")
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Cache the result
            cache_ttl = ttl or CacheConfig.CACHE_TTLS.get(
                cache_key_prefix, CacheConfig.DEFAULT_TTL
            )
            await cache_manager.set(cache_key, result, cache_ttl)

            logger.debug(f"Cache miss and set for {cache_key_prefix}")
            return result

        return wrapper

    return decorator


def invalidate_cache_on_mutation(cache_patterns: list):
    """
    Decorator to invalidate cache patterns when data is mutated

    Args:
        cache_patterns: List of cache key patterns to invalidate
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)

            # Invalidate related cache entries
            for pattern in cache_patterns:
                cleared = await cache_manager.clear_pattern(pattern)
                logger.debug(f"Cleared {cleared} cache entries for pattern: {pattern}")

            return result

        return wrapper

    return decorator


class CacheMiddleware:
    """Middleware for automatic cache header management"""

    def __init__(self):
        self.cacheable_paths = {
            "/api/agents/status": 60,
            "/api/agents/health": 30,
        }

    async def __call__(self, request: Request, call_next):
        response = await call_next(request)

        # Add cache headers for cacheable endpoints
        if request.url.path in self.cacheable_paths:
            max_age = self.cacheable_paths[request.url.path]
            response.headers["Cache-Control"] = f"public, max-age={max_age}"
            response.headers["ETag"] = hashlib.md5(
                f"{request.url.path}:{int(time.time() // max_age)}".encode()
            ).hexdigest()[:16]
        else:
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

        return response


# Create middleware instance
cache_middleware = CacheMiddleware()
