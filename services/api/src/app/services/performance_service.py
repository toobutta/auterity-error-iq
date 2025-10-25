"""Performance Optimization Service for Analytics Platform."""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass
import json
import redis.asyncio as redis
from sqlalchemy import text, func
from sqlalchemy.orm import Session

from app.middleware.logging import get_logger

logger = get_logger(__name__)


@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    key: str
    data: Any
    created_at: datetime
    ttl_seconds: int
    access_count: int = 0
    last_accessed: datetime = None

    @property
    def is_expired(self) -> bool:
        """Check if cache entry is expired."""
        return (datetime.utcnow() - self.created_at).total_seconds() > self.ttl_seconds

    @property
    def age_seconds(self) -> float:
        """Get cache entry age in seconds."""
        return (datetime.utcnow() - self.created_at).total_seconds()


@dataclass
class QueryMetrics:
    """Database query performance metrics."""
    query: str
    execution_time: float
    rows_affected: int
    timestamp: datetime
    slow_query: bool = False


class PerformanceService:
    """Enterprise performance optimization service."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: Dict[str, CacheEntry] = {}
        self.query_metrics: List[QueryMetrics] = []
        self.slow_query_threshold = 1.0  # seconds
        self.max_query_metrics = 1000

    # ============================================================================
    # CACHE MANAGEMENT
    # ============================================================================

    async def initialize_cache(self):
        """Initialize Redis cache connection."""
        try:
            self.redis_client = redis.Redis.from_url(self.redis_url, decode_responses=True)
            await self.redis_client.ping()
            logger.info("Redis cache connection established")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {str(e)}. Using memory cache only.")
            self.redis_client = None

    async def set_cache(self, key: str, data: Any, ttl_seconds: int = 300) -> bool:
        """Set data in cache with TTL."""
        try:
            # Always set in memory cache
            self.memory_cache[key] = CacheEntry(
                key=key,
                data=data,
                created_at=datetime.utcnow(),
                ttl_seconds=ttl_seconds,
                last_accessed=datetime.utcnow()
            )

            # Also set in Redis if available
            if self.redis_client:
                serialized_data = json.dumps(data, default=str)
                await self.redis_client.setex(key, ttl_seconds, serialized_data)

            return True

        except Exception as e:
            logger.error(f"Failed to set cache for key {key}: {str(e)}")
            return False

    async def get_cache(self, key: str) -> Optional[Any]:
        """Get data from cache."""
        try:
            # Try Redis first
            if self.redis_client:
                cached_data = await self.redis_client.get(key)
                if cached_data:
                    data = json.loads(cached_data)
                    # Also update memory cache
                    if key in self.memory_cache:
                        self.memory_cache[key].access_count += 1
                        self.memory_cache[key].last_accessed = datetime.utcnow()
                    return data

            # Fall back to memory cache
            if key in self.memory_cache:
                entry = self.memory_cache[key]
                if not entry.is_expired:
                    entry.access_count += 1
                    entry.last_accessed = datetime.utcnow()
                    return entry.data
                else:
                    # Remove expired entry
                    del self.memory_cache[key]

            return None

        except Exception as e:
            logger.error(f"Failed to get cache for key {key}: {str(e)}")
            return None

    async def invalidate_cache(self, pattern: str = "*") -> int:
        """Invalidate cache entries matching pattern."""
        invalidated_count = 0

        try:
            # Invalidate Redis cache
            if self.redis_client:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    await self.redis_client.delete(*keys)
                    invalidated_count += len(keys)

            # Invalidate memory cache
            keys_to_delete = []
            for key in self.memory_cache.keys():
                if pattern == "*" or pattern.replace("*", "") in key:
                    keys_to_delete.append(key)

            for key in keys_to_delete:
                del self.memory_cache[key]

            invalidated_count += len(keys_to_delete)

            logger.info(f"Invalidated {invalidated_count} cache entries matching pattern: {pattern}")
            return invalidated_count

        except Exception as e:
            logger.error(f"Failed to invalidate cache pattern {pattern}: {str(e)}")
            return 0

    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics."""
        stats = {
            "memory_cache": {
                "entries": len(self.memory_cache),
                "total_accesses": sum(entry.access_count for entry in self.memory_cache.values()),
                "avg_age_seconds": sum(entry.age_seconds for entry in self.memory_cache.values()) / len(self.memory_cache) if self.memory_cache else 0
            },
            "redis_connected": self.redis_client is not None
        }

        if self.redis_client:
            try:
                redis_info = await self.redis_client.info()
                stats["redis"] = {
                    "used_memory": redis_info.get("used_memory_human", "unknown"),
                    "connected_clients": redis_info.get("connected_clients", 0),
                    "total_connections_received": redis_info.get("total_connections_received", 0)
                }
            except Exception as e:
                logger.error(f"Failed to get Redis stats: {str(e)}")

        return stats

    # ============================================================================
    # DATABASE OPTIMIZATION
    # ============================================================================

    async def execute_optimized_query(
        self,
        db: Session,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_ttl: int = 300
    ) -> Tuple[Any, QueryMetrics]:
        """Execute database query with optimization and metrics."""
        start_time = time.time()
        params = params or {}

        try:
            # Check cache first
            if use_cache:
                cache_key = f"query_{hash(query + str(sorted(params.items())))}"
                cached_result = await self.get_cache(cache_key)
                if cached_result:
                    execution_time = time.time() - start_time
                    metrics = QueryMetrics(
                        query=query,
                        execution_time=execution_time,
                        rows_affected=0,  # Not available for cached queries
                        timestamp=datetime.utcnow()
                    )
                    return cached_result, metrics

            # Execute query
            result = db.execute(text(query), params)
            execution_time = time.time() - start_time

            # Get result data
            if result.returns_rows:
                data = result.fetchall()
                rows_affected = len(data)
            else:
                data = result.rowcount
                rows_affected = result.rowcount

            # Create metrics
            metrics = QueryMetrics(
                query=query,
                execution_time=execution_time,
                rows_affected=rows_affected,
                timestamp=datetime.utcnow(),
                slow_query=execution_time > self.slow_query_threshold
            )

            # Store metrics
            self.query_metrics.append(metrics)
            if len(self.query_metrics) > self.max_query_metrics:
                self.query_metrics = self.query_metrics[-self.max_query_metrics:]

            # Cache result if appropriate
            if use_cache and result.returns_rows and rows_affected > 0:
                await self.set_cache(cache_key, data, cache_ttl)

            return data, metrics

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Query execution failed: {str(e)}")

            metrics = QueryMetrics(
                query=query,
                execution_time=execution_time,
                rows_affected=0,
                timestamp=datetime.utcnow(),
                slow_query=True
            )

            raise e

    async def create_optimized_indexes(self, db: Session) -> Dict[str, Any]:
        """Create optimized database indexes for analytics queries."""
        indexes_created = []

        try:
            # Index for analytics events by timestamp and user
            await self.execute_optimized_query(
                db,
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_time_user
                ON analytics_events (timestamp DESC, user_id)
                WHERE timestamp > NOW() - INTERVAL '90 days'
                """,
                use_cache=False
            )
            indexes_created.append("idx_analytics_events_time_user")

            # Index for performance metrics by time bucket
            await self.execute_optimized_query(
                db,
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_bucket_time
                ON performance_metrics (time_bucket, bucket_start DESC, bucket_end DESC)
                """,
                use_cache=False
            )
            indexes_created.append("idx_performance_metrics_bucket_time")

            # Composite index for user sessions
            await self.execute_optimized_query(
                db,
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_tenant_started
                ON user_sessions (tenant_id, started_at DESC)
                WHERE ended_at IS NULL OR ended_at > NOW() - INTERVAL '30 days'
                """,
                use_cache=False
            )
            indexes_created.append("idx_user_sessions_tenant_started")

            logger.info(f"Created {len(indexes_created)} optimized indexes")
            return {
                "success": True,
                "indexes_created": indexes_created,
                "message": f"Successfully created {len(indexes_created)} database indexes"
            }

        except Exception as e:
            logger.error(f"Failed to create optimized indexes: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "indexes_created": indexes_created
            }

    async def analyze_query_performance(self, db: Session) -> Dict[str, Any]:
        """Analyze database query performance and provide optimization recommendations."""
        try:
            # Get slow queries
            slow_queries = [q for q in self.query_metrics if q.slow_query]

            # Analyze query patterns
            query_patterns = {}
            for metric in self.query_metrics[-100:]:  # Last 100 queries
                pattern = self._extract_query_pattern(metric.query)
                if pattern not in query_patterns:
                    query_patterns[pattern] = {
                        "count": 0,
                        "total_time": 0,
                        "avg_time": 0,
                        "slow_count": 0
                    }

                query_patterns[pattern]["count"] += 1
                query_patterns[pattern]["total_time"] += metric.execution_time
                if metric.slow_query:
                    query_patterns[pattern]["slow_count"] += 1

            # Calculate averages
            for pattern_data in query_patterns.values():
                if pattern_data["count"] > 0:
                    pattern_data["avg_time"] = pattern_data["total_time"] / pattern_data["count"]

            # Generate recommendations
            recommendations = []

            for pattern, data in query_patterns.items():
                if data["slow_count"] > data["count"] * 0.3:  # 30% slow queries
                    recommendations.append({
                        "type": "slow_query_pattern",
                        "pattern": pattern,
                        "severity": "high",
                        "description": f"Query pattern '{pattern}' has {data['slow_count']}/{data['count']} slow executions",
                        "recommendation": "Consider adding database indexes or optimizing query structure"
                    })

            return {
                "total_queries": len(self.query_metrics),
                "slow_queries": len(slow_queries),
                "query_patterns": query_patterns,
                "recommendations": recommendations,
                "avg_query_time": sum(q.execution_time for q in self.query_metrics) / len(self.query_metrics) if self.query_metrics else 0
            }

        except Exception as e:
            logger.error(f"Failed to analyze query performance: {str(e)}")
            return {"error": str(e)}

    def _extract_query_pattern(self, query: str) -> str:
        """Extract query pattern for analysis."""
        # Simple pattern extraction - replace literals with placeholders
        pattern = query
        pattern = pattern.replace("'", "?").replace('"', "?")
        pattern = " ".join(pattern.split()[:10])  # First 10 words
        return pattern

    # ============================================================================
    # DATA AGGREGATION & MATERIALIZED VIEWS
    # ============================================================================

    async def create_materialized_views(self, db: Session) -> Dict[str, Any]:
        """Create materialized views for common analytics queries."""
        views_created = []

        try:
            # Daily analytics summary
            await self.execute_optimized_query(
                db,
                """
                CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics_summary AS
                SELECT
                    DATE(timestamp) as date,
                    tenant_id,
                    COUNT(*) as total_events,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT session_id) as total_sessions,
                    AVG(EXTRACT(EPOCH FROM (LEAD(timestamp) OVER (ORDER BY timestamp) - timestamp))) as avg_session_time
                FROM analytics_events
                WHERE timestamp > NOW() - INTERVAL '30 days'
                GROUP BY DATE(timestamp), tenant_id
                ORDER BY date DESC, tenant_id
                """,
                use_cache=False
            )
            views_created.append("daily_analytics_summary")

            # Performance metrics aggregation
            await self.execute_optimized_query(
                db,
                """
                CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_performance_metrics AS
                SELECT
                    DATE_TRUNC('hour', bucket_start) as hour,
                    service_name,
                    metric_type,
                    AVG(metric_value) as avg_value,
                    MIN(metric_value) as min_value,
                    MAX(metric_value) as max_value,
                    COUNT(*) as sample_count
                FROM performance_metrics
                WHERE bucket_start > NOW() - INTERVAL '7 days'
                GROUP BY DATE_TRUNC('hour', bucket_start), service_name, metric_type
                ORDER BY hour DESC
                """,
                use_cache=False
            )
            views_created.append("hourly_performance_metrics")

            # User engagement metrics
            await self.execute_optimized_query(
                db,
                """
                CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_metrics AS
                SELECT
                    tenant_id,
                    user_id,
                    COUNT(*) as total_events,
                    COUNT(DISTINCT DATE(timestamp)) as active_days,
                    MAX(timestamp) as last_activity,
                    AVG(EXTRACT(EPOCH FROM (LEAD(timestamp) OVER (PARTITION BY session_id ORDER BY timestamp) - timestamp))) as avg_session_time
                FROM analytics_events
                WHERE timestamp > NOW() - INTERVAL '30 days' AND user_id IS NOT NULL
                GROUP BY tenant_id, user_id
                HAVING COUNT(*) > 5  -- Only users with meaningful activity
                """,
                use_cache=False
            )
            views_created.append("user_engagement_metrics")

            # Create refresh function for views
            await self.execute_optimized_query(
                db,
                """
                CREATE OR REPLACE FUNCTION refresh_analytics_views()
                RETURNS void AS $$
                BEGIN
                    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics_summary;
                    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_performance_metrics;
                    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_metrics;
                END;
                $$ LANGUAGE plpgsql;
                """,
                use_cache=False
            )

            logger.info(f"Created {len(views_created)} materialized views")
            return {
                "success": True,
                "views_created": views_created,
                "refresh_function": "refresh_analytics_views",
                "message": f"Successfully created {len(views_created)} materialized views"
            }

        except Exception as e:
            logger.error(f"Failed to create materialized views: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "views_created": views_created
            }

    async def refresh_materialized_views(self, db: Session) -> Dict[str, Any]:
        """Refresh all materialized views."""
        try:
            start_time = time.time()

            await self.execute_optimized_query(
                db,
                "SELECT refresh_analytics_views()",
                use_cache=False
            )

            refresh_time = time.time() - start_time

            logger.info(f"Refreshed materialized views in {refresh_time:.2f} seconds")
            return {
                "success": True,
                "refresh_time": refresh_time,
                "message": f"Materialized views refreshed successfully in {refresh_time:.2f} seconds"
            }

        except Exception as e:
            logger.error(f"Failed to refresh materialized views: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    # ============================================================================
    # LAZY LOADING & PAGINATION
    # ============================================================================

    async def get_paginated_data(
        self,
        db: Session,
        query: str,
        params: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 50,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Get paginated data with optimized queries."""
        try:
            # Calculate offset
            offset = (page - 1) * page_size

            # Build count query
            count_query = f"SELECT COUNT(*) FROM ({query}) AS subquery"
            count_result, _ = await self.execute_optimized_query(
                db, count_query, params, use_cache=True, cache_ttl=300
            )
            total_count = count_result[0][0] if count_result else 0

            # Build paginated query
            order_clause = ""
            if sort_by:
                order_clause = f"ORDER BY {sort_by} {sort_order.upper()}"

            paginated_query = f"""
                {query}
                {order_clause}
                LIMIT {page_size} OFFSET {offset}
            """

            data_result, query_metrics = await self.execute_optimized_query(
                db, paginated_query, params, use_cache=False  # Don't cache paginated results
            )

            # Calculate pagination metadata
            total_pages = (total_count + page_size - 1) // page_size
            has_next = page < total_pages
            has_prev = page > 1

            return {
                "data": data_result,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_count": total_count,
                    "total_pages": total_pages,
                    "has_next": has_next,
                    "has_prev": has_prev,
                    "next_page": page + 1 if has_next else None,
                    "prev_page": page - 1 if has_prev else None
                },
                "performance": {
                    "query_time": query_metrics.execution_time,
                    "slow_query": query_metrics.slow_query
                }
            }

        except Exception as e:
            logger.error(f"Failed to get paginated data: {str(e)}")
            return {
                "data": [],
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total_count": 0,
                    "total_pages": 0,
                    "has_next": False,
                    "has_prev": False
                },
                "error": str(e)
            }

    # ============================================================================
    # PERFORMANCE MONITORING
    # ============================================================================

    async def get_performance_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive performance dashboard data."""
        try:
            cache_stats = await self.get_cache_stats()

            # Analyze query performance
            query_analysis = {
                "total_queries": len(self.query_metrics),
                "slow_queries": len([q for q in self.query_metrics if q.slow_query]),
                "avg_query_time": sum(q.execution_time for q in self.query_metrics) / len(self.query_metrics) if self.query_metrics else 0,
                "slow_query_percentage": len([q for q in self.query_metrics if q.slow_query]) / len(self.query_metrics) * 100 if self.query_metrics else 0
            }

            # Memory usage (simplified)
            memory_usage = {
                "cache_entries": len(self.memory_cache),
                "query_metrics_stored": len(self.query_metrics),
                "estimated_memory_mb": (len(self.memory_cache) * 0.1) + (len(self.query_metrics) * 0.01)  # Rough estimate
            }

            return {
                "cache_performance": cache_stats,
                "query_performance": query_analysis,
                "memory_usage": memory_usage,
                "recommendations": self._generate_performance_recommendations(
                    cache_stats, query_analysis
                ),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Failed to get performance dashboard: {str(e)}")
            return {"error": str(e)}

    def _generate_performance_recommendations(
        self,
        cache_stats: Dict[str, Any],
        query_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate performance optimization recommendations."""
        recommendations = []

        # Cache recommendations
        memory_entries = cache_stats.get("memory_cache", {}).get("entries", 0)
        if memory_entries > 1000:
            recommendations.append({
                "type": "cache_optimization",
                "priority": "medium",
                "title": "High Memory Cache Usage",
                "description": f"Memory cache has {memory_entries} entries. Consider increasing Redis usage.",
                "action": "Implement Redis cache invalidation strategy"
            })

        # Query performance recommendations
        slow_percentage = query_analysis.get("slow_query_percentage", 0)
        if slow_percentage > 20:
            recommendations.append({
                "type": "query_optimization",
                "priority": "high",
                "title": "High Slow Query Percentage",
                "description": ".1f",
                "action": "Add database indexes and optimize slow queries"
            })

        avg_query_time = query_analysis.get("avg_query_time", 0)
        if avg_query_time > 0.5:
            recommendations.append({
                "type": "query_optimization",
                "priority": "medium",
                "title": "Slow Average Query Time",
                "description": ".3f",
                "action": "Implement query result caching and optimize database queries"
            })

        return recommendations

    async def cleanup_performance_data(self, max_age_days: int = 30):
        """Clean up old performance data."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=max_age_days)

            # Clean old query metrics
            old_metrics = [m for m in self.query_metrics if m.timestamp < cutoff_date]
            for metric in old_metrics:
                self.query_metrics.remove(metric)

            # Clean expired memory cache
            expired_keys = [key for key, entry in self.memory_cache.items() if entry.is_expired]
            for key in expired_keys:
                del self.memory_cache[key]

            logger.info(f"Cleaned up {len(old_metrics)} old metrics and {len(expired_keys)} expired cache entries")

            return {
                "success": True,
                "metrics_cleaned": len(old_metrics),
                "cache_entries_cleaned": len(expired_keys)
            }

        except Exception as e:
            logger.error(f"Failed to cleanup performance data: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

