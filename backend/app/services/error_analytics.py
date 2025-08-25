"""
Enhanced Error Analytics Service

Provides comprehensive error tracking, analysis, and insights across all systems.
"""

import json
import logging
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

import redis.asyncio as redis
from app.exceptions import BaseAppException


class ErrorTrend(str, Enum):
    """Error trend directions."""

    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    SPIKE = "spike"


@dataclass
class ErrorMetrics:
    """Error metrics for a specific time period."""

    total_errors: int
    error_rate: float
    categories: Dict[str, int]
    severities: Dict[str, int]
    top_errors: List[Dict[str, Any]]
    trend: ErrorTrend
    period_start: datetime
    period_end: datetime


@dataclass
class ErrorInsight:
    """Actionable insight derived from error analysis."""

    id: str
    title: str
    description: str
    category: str
    severity: str
    confidence: float
    affected_systems: List[str]
    recommended_actions: List[str]
    created_at: datetime


class ErrorAnalyticsService:
    """Service for error analytics and insights."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)
        self.metrics_retention = timedelta(days=30)

    async def track_error(
        self, error: BaseAppException, context: Dict[str, Any] = None
    ) -> None:
        """Track an error occurrence for analytics."""
        try:
            error_data = {
                "id": f"error_{datetime.utcnow().timestamp()}",
                "timestamp": datetime.utcnow().isoformat(),
                "code": error.code,
                "message": error.message,
                "category": error.category.value,
                "severity": error.severity.value,
                "retryable": error.retryable,
                "context": context or {},
                "details": error.details,
            }

            # Store individual error
            await self._store_error_record(error_data)

            # Update aggregated metrics
            await self._update_error_metrics(error_data)

            # Check for error patterns
            await self._analyze_error_patterns(error_data)

        except Exception as e:
            self.logger.error(f"Failed to track error: {e}")

    async def _store_error_record(self, error_data: Dict[str, Any]) -> None:
        """Store individual error record."""
        key = f"error_record:{error_data['id']}"
        await self.redis.setex(
            key, int(self.metrics_retention.total_seconds()), json.dumps(error_data)
        )

        # Add to time-based indices
        timestamp = datetime.fromisoformat(error_data["timestamp"])
        hour_key = f"errors_by_hour:{timestamp.strftime('%Y-%m-%d-%H')}"
        day_key = f"errors_by_day:{timestamp.strftime('%Y-%m-%d')}"

        await self.redis.lpush(hour_key, error_data["id"])
        await self.redis.expire(hour_key, int(self.metrics_retention.total_seconds()))

        await self.redis.lpush(day_key, error_data["id"])
        await self.redis.expire(day_key, int(self.metrics_retention.total_seconds()))

    async def _update_error_metrics(self, error_data: Dict[str, Any]) -> None:
        """Update aggregated error metrics."""
        timestamp = datetime.fromisoformat(error_data["timestamp"])

        # Update counters
        await self._increment_counter("total_errors")
        await self._increment_counter(f"errors_by_category:{error_data['category']}")
        await self._increment_counter(f"errors_by_severity:{error_data['severity']}")
        await self._increment_counter(f"errors_by_code:{error_data['code']}")

        # Update hourly metrics
        hour_key = f"metrics_hour:{timestamp.strftime('%Y-%m-%d-%H')}"
        await self._increment_counter(f"{hour_key}:total")
        await self._increment_counter(f"{hour_key}:category:{error_data['category']}")
        await self._increment_counter(f"{hour_key}:severity:{error_data['severity']}")

    async def _increment_counter(self, key: str) -> None:
        """Increment a counter with expiration."""
        await self.redis.incr(key)
        await self.redis.expire(key, int(self.metrics_retention.total_seconds()))

    async def _analyze_error_patterns(self, error_data: Dict[str, Any]) -> None:
        """Analyze error patterns and generate insights."""
        # Check for error spikes
        await self._check_error_spike(error_data)

        # Check for recurring patterns
        await self._check_recurring_patterns(error_data)

        # Check for cascading failures
        await self._check_cascading_failures(error_data)

    async def _check_error_spike(self, error_data: Dict[str, Any]) -> None:
        """Check for error rate spikes."""
        timestamp = datetime.fromisoformat(error_data["timestamp"])
        current_hour = timestamp.strftime("%Y-%m-%d-%H")

        # Get current hour error count
        current_count = await self.redis.get(f"metrics_hour:{current_hour}:total") or 0
        current_count = int(current_count)

        # Get previous hour for comparison
        prev_hour = (timestamp - timedelta(hours=1)).strftime("%Y-%m-%d-%H")
        prev_count = await self.redis.get(f"metrics_hour:{prev_hour}:total") or 0
        prev_count = int(prev_count)

        # Check for spike (>200% increase)
        if prev_count > 0 and current_count > prev_count * 2:
            await self._generate_insight(
                {
                    "title": "Error Rate Spike Detected",
                    "description": f"Error rate increased by {((current_count - prev_count) / prev_count * 100):.1f}% in the last hour",
                    "category": "performance",
                    "severity": "high",
                    "confidence": 0.9,
                    "affected_systems": ["autmatrix"],
                    "recommended_actions": [
                        "investigate_recent_deployments",
                        "check_system_resources",
                        "review_error_logs",
                    ],
                }
            )

    async def _check_recurring_patterns(self, error_data: Dict[str, Any]) -> None:
        """Check for recurring error patterns."""
        # Get recent errors of same type
        recent_errors = await self._get_recent_errors_by_code(
            error_data["code"], hours=24
        )

        if len(recent_errors) >= 10:  # 10+ occurrences in 24 hours
            await self._generate_insight(
                {
                    "title": f"Recurring Error Pattern: {error_data['code']}",
                    "description": f"Error {error_data['code']} occurred {len(recent_errors)} times in the last 24 hours",
                    "category": "reliability",
                    "severity": "medium",
                    "confidence": 0.8,
                    "affected_systems": ["autmatrix"],
                    "recommended_actions": [
                        "investigate_root_cause",
                        "implement_permanent_fix",
                        "add_monitoring_alerts",
                    ],
                }
            )

    async def _check_cascading_failures(self, error_data: Dict[str, Any]) -> None:
        """Check for cascading failure patterns."""
        # Look for multiple different errors in short time window
        timestamp = datetime.fromisoformat(error_data["timestamp"])
        window_start = timestamp - timedelta(minutes=5)

        recent_errors = await self._get_errors_in_window(window_start, timestamp)
        unique_codes = set(error["code"] for error in recent_errors)

        if len(unique_codes) >= 3:  # 3+ different error types in 5 minutes
            await self._generate_insight(
                {
                    "title": "Potential Cascading Failure",
                    "description": f"Multiple error types ({len(unique_codes)}) detected in 5-minute window",
                    "category": "system",
                    "severity": "critical",
                    "confidence": 0.7,
                    "affected_systems": ["autmatrix"],
                    "recommended_actions": [
                        "check_system_health",
                        "investigate_dependencies",
                        "consider_circuit_breakers",
                    ],
                }
            )

    async def _get_recent_errors_by_code(
        self, error_code: str, hours: int = 1
    ) -> List[Dict[str, Any]]:
        """Get recent errors by error code."""
        errors = []
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        # Search through recent error records
        keys = await self.redis.keys("error_record:*")
        for key in keys:
            data = await self.redis.get(key)
            if data:
                error_data = json.loads(data)
                error_time = datetime.fromisoformat(error_data["timestamp"])

                if error_time >= cutoff_time and error_data["code"] == error_code:
                    errors.append(error_data)

        return errors

    async def _get_errors_in_window(
        self, start_time: datetime, end_time: datetime
    ) -> List[Dict[str, Any]]:
        """Get all errors within a time window."""
        errors = []

        keys = await self.redis.keys("error_record:*")
        for key in keys:
            data = await self.redis.get(key)
            if data:
                error_data = json.loads(data)
                error_time = datetime.fromisoformat(error_data["timestamp"])

                if start_time <= error_time <= end_time:
                    errors.append(error_data)

        return errors

    async def _generate_insight(self, insight_data: Dict[str, Any]) -> None:
        """Generate and store an error insight."""
        insight = ErrorInsight(
            id=f"insight_{datetime.utcnow().timestamp()}",
            title=insight_data["title"],
            description=insight_data["description"],
            category=insight_data["category"],
            severity=insight_data["severity"],
            confidence=insight_data["confidence"],
            affected_systems=insight_data["affected_systems"],
            recommended_actions=insight_data["recommended_actions"],
            created_at=datetime.utcnow(),
        )

        # Store insight
        key = f"error_insight:{insight.id}"
        await self.redis.setex(
            key, 86400 * 7, json.dumps(asdict(insight), default=str)
        )  # 7 days

        # Add to insights list
        await self.redis.lpush("error_insights", insight.id)
        await self.redis.ltrim("error_insights", 0, 99)  # Keep last 100 insights

    async def get_error_metrics(self, period_hours: int = 24) -> ErrorMetrics:
        """Get error metrics for specified period."""
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=period_hours)

            # Get errors in period
            errors = await self._get_errors_in_window(start_time, end_time)

            # Calculate metrics
            total_errors = len(errors)
            error_rate = total_errors / period_hours if period_hours > 0 else 0

            # Category distribution
            categories = Counter(error["category"] for error in errors)

            # Severity distribution
            severities = Counter(error["severity"] for error in errors)

            # Top errors by frequency
            error_codes = Counter(error["code"] for error in errors)
            top_errors = [
                {
                    "code": code,
                    "count": count,
                    "percentage": (
                        (count / total_errors * 100) if total_errors > 0 else 0
                    ),
                }
                for code, count in error_codes.most_common(10)
            ]

            # Calculate trend
            trend = await self._calculate_error_trend(period_hours)

            return ErrorMetrics(
                total_errors=total_errors,
                error_rate=error_rate,
                categories=dict(categories),
                severities=dict(severities),
                top_errors=top_errors,
                trend=trend,
                period_start=start_time,
                period_end=end_time,
            )

        except Exception as e:
            self.logger.error(f"Failed to get error metrics: {e}")
            raise

    async def _calculate_error_trend(self, period_hours: int) -> ErrorTrend:
        """Calculate error trend over the period."""
        try:
            # Compare current period with previous period
            current_end = datetime.utcnow()
            current_start = current_end - timedelta(hours=period_hours)
            prev_start = current_start - timedelta(hours=period_hours)

            current_errors = await self._get_errors_in_window(
                current_start, current_end
            )
            prev_errors = await self._get_errors_in_window(prev_start, current_start)

            current_count = len(current_errors)
            prev_count = len(prev_errors)

            if prev_count == 0:
                return ErrorTrend.STABLE if current_count == 0 else ErrorTrend.SPIKE

            change_ratio = (current_count - prev_count) / prev_count

            if change_ratio > 1.0:  # >100% increase
                return ErrorTrend.SPIKE
            elif change_ratio > 0.2:  # >20% increase
                return ErrorTrend.INCREASING
            elif change_ratio < -0.2:  # >20% decrease
                return ErrorTrend.DECREASING
            else:
                return ErrorTrend.STABLE

        except Exception as e:
            self.logger.error(f"Failed to calculate error trend: {e}")
            return ErrorTrend.STABLE

    async def get_error_insights(self, limit: int = 10) -> List[ErrorInsight]:
        """Get recent error insights."""
        try:
            insight_ids = await self.redis.lrange("error_insights", 0, limit - 1)
            insights = []

            for insight_id in insight_ids:
                key = f"error_insight:{insight_id.decode()}"
                data = await self.redis.get(key)
                if data:
                    insight_data = json.loads(data)
                    insight_data["created_at"] = datetime.fromisoformat(
                        insight_data["created_at"]
                    )
                    insights.append(ErrorInsight(**insight_data))

            return insights

        except Exception as e:
            self.logger.error(f"Failed to get error insights: {e}")
            return []

    async def get_error_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive error dashboard data."""
        try:
            # Get metrics for different periods
            metrics_1h = await self.get_error_metrics(1)
            metrics_24h = await self.get_error_metrics(24)
            metrics_7d = await self.get_error_metrics(24 * 7)

            # Get recent insights
            insights = await self.get_error_insights(5)

            # Get system health indicators
            health_indicators = await self._get_health_indicators()

            return {
                "metrics": {
                    "last_hour": asdict(metrics_1h),
                    "last_24_hours": asdict(metrics_24h),
                    "last_7_days": asdict(metrics_7d),
                },
                "insights": [asdict(insight) for insight in insights],
                "health_indicators": health_indicators,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            self.logger.error(f"Failed to get dashboard data: {e}")
            return {"error": str(e)}

    async def _get_health_indicators(self) -> Dict[str, Any]:
        """Get system health indicators based on error patterns."""
        try:
            # Calculate error rates for different categories
            metrics_1h = await self.get_error_metrics(1)

            # Determine health status based on error rates and trends
            health_status = "healthy"
            if metrics_1h.error_rate > 10:  # >10 errors per hour
                health_status = "degraded"
            if metrics_1h.error_rate > 50:  # >50 errors per hour
                health_status = "unhealthy"
            if metrics_1h.trend == ErrorTrend.SPIKE:
                health_status = "critical"

            # Calculate category-specific health
            category_health = {}
            for category, count in metrics_1h.categories.items():
                if count == 0:
                    category_health[category] = "healthy"
                elif count < 5:
                    category_health[category] = "warning"
                else:
                    category_health[category] = "critical"

            return {
                "overall_status": health_status,
                "error_rate": metrics_1h.error_rate,
                "trend": metrics_1h.trend.value,
                "category_health": category_health,
                "last_updated": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            self.logger.error(f"Failed to get health indicators: {e}")
            return {"overall_status": "unknown", "error": str(e)}


# Global service instance
_analytics_service: Optional[ErrorAnalyticsService] = None


async def get_error_analytics_service() -> ErrorAnalyticsService:
    """Get or create error analytics service instance."""
    global _analytics_service

    if _analytics_service is None:
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=False)
        _analytics_service = ErrorAnalyticsService(redis_client)

    return _analytics_service
