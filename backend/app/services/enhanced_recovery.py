"""
Enhanced Recovery Service

Provides intelligent error recovery with machine learning-based decision making.
"""

import asyncio
import json
import logging
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import redis.asyncio as redis
from app.exceptions import BaseAppException, ErrorCategory
from app.services.notification_service import get_notification_service
from app.utils.retry_utils import RetryConfig


class RecoveryStrategy(str, Enum):
    """Recovery strategy types."""

    IMMEDIATE_RETRY = "immediate_retry"
    EXPONENTIAL_BACKOFF = "exponential_backoff"
    CIRCUIT_BREAKER = "circuit_breaker"
    FALLBACK_SERVICE = "fallback_service"
    RESOURCE_SCALING = "resource_scaling"
    SERVICE_RESTART = "service_restart"
    GRACEFUL_DEGRADATION = "graceful_degradation"


class RecoveryOutcome(str, Enum):
    """Recovery attempt outcomes."""

    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILURE = "failure"
    TIMEOUT = "timeout"
    SKIPPED = "skipped"


@dataclass
class RecoveryAttempt:
    """Record of a recovery attempt."""

    id: str
    error_id: str
    strategy: RecoveryStrategy
    started_at: datetime
    completed_at: Optional[datetime]
    outcome: RecoveryOutcome
    details: Dict[str, Any]
    duration_seconds: Optional[float] = None
    retry_count: int = 0


@dataclass
class RecoveryPlan:
    """Plan for recovering from an error."""

    error_id: str
    error_category: str
    strategies: List[RecoveryStrategy]
    priority: int
    estimated_duration: int
    success_probability: float
    created_at: datetime


class EnhancedRecoveryService:
    """Service for intelligent error recovery."""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.logger = logging.getLogger(__name__)

        # Recovery strategy configurations
        self.strategy_configs = self._initialize_strategy_configs()

        # Success rate tracking for ML-based optimization
        self.success_rates = defaultdict(lambda: {"attempts": 0, "successes": 0})

    def _initialize_strategy_configs(self) -> Dict[RecoveryStrategy, Dict[str, Any]]:
        """Initialize recovery strategy configurations."""
        return {
            RecoveryStrategy.IMMEDIATE_RETRY: {
                "max_attempts": 3,
                "delay_seconds": 0,
                "applicable_categories": [
                    ErrorCategory.AI_SERVICE,
                    ErrorCategory.EXTERNAL_API,
                ],
                "success_threshold": 0.7,
            },
            RecoveryStrategy.EXPONENTIAL_BACKOFF: {
                "max_attempts": 5,
                "base_delay": 1.0,
                "max_delay": 60.0,
                "applicable_categories": [
                    ErrorCategory.DATABASE,
                    ErrorCategory.EXTERNAL_API,
                ],
                "success_threshold": 0.8,
            },
            RecoveryStrategy.CIRCUIT_BREAKER: {
                "failure_threshold": 5,
                "reset_timeout": 300,
                "applicable_categories": [
                    ErrorCategory.AI_SERVICE,
                    ErrorCategory.EXTERNAL_API,
                ],
                "success_threshold": 0.6,
            },
            RecoveryStrategy.FALLBACK_SERVICE: {
                "timeout_seconds": 30,
                "applicable_categories": [
                    ErrorCategory.AI_SERVICE,
                    ErrorCategory.EXTERNAL_API,
                ],
                "success_threshold": 0.9,
            },
            RecoveryStrategy.RESOURCE_SCALING: {
                "scale_factor": 1.5,
                "cooldown_minutes": 10,
                "applicable_categories": [ErrorCategory.SYSTEM, ErrorCategory.DATABASE],
                "success_threshold": 0.8,
            },
            RecoveryStrategy.SERVICE_RESTART: {
                "graceful_timeout": 30,
                "force_timeout": 60,
                "applicable_categories": [ErrorCategory.SYSTEM, ErrorCategory.DATABASE],
                "success_threshold": 0.85,
            },
            RecoveryStrategy.GRACEFUL_DEGRADATION: {
                "degradation_level": 0.5,
                "applicable_categories": [
                    ErrorCategory.AI_SERVICE,
                    ErrorCategory.WORKFLOW,
                ],
                "success_threshold": 0.95,
            },
        }

    async def create_recovery_plan(
        self, error: BaseAppException, context: Dict[str, Any] = None
    ) -> RecoveryPlan:
        """Create an intelligent recovery plan for an error."""
        try:
            context = context or {}

            # Analyze error characteristics
            error_analysis = await self._analyze_error(error, context)

            # Select optimal strategies based on ML insights
            strategies = await self._select_recovery_strategies(error, error_analysis)

            # Estimate success probability and duration
            success_probability = await self._estimate_success_probability(
                error, strategies
            )
            estimated_duration = await self._estimate_recovery_duration(strategies)

            # Determine priority based on error severity and impact
            priority = self._calculate_recovery_priority(error, context)

            plan = RecoveryPlan(
                error_id=f"error_{datetime.utcnow().timestamp()}",
                error_category=error.category.value,
                strategies=strategies,
                priority=priority,
                estimated_duration=estimated_duration,
                success_probability=success_probability,
                created_at=datetime.utcnow(),
            )

            # Store recovery plan
            await self._store_recovery_plan(plan)

            return plan

        except Exception as e:
            self.logger.error(f"Failed to create recovery plan: {e}")
            raise

    async def execute_recovery_plan(
        self,
        plan: RecoveryPlan,
        error: BaseAppException,
        context: Dict[str, Any] = None,
    ) -> List[RecoveryAttempt]:
        """Execute a recovery plan."""
        attempts = []
        context = context or {}

        try:
            self.logger.info(f"Executing recovery plan for error {plan.error_id}")

            # Notify about recovery start
            notification_service = await get_notification_service()
            await notification_service.send_recovery_notification(
                "recovery_plan_started",
                True,
                {
                    "plan_id": plan.error_id,
                    "strategies": [s.value for s in plan.strategies],
                    "estimated_duration": plan.estimated_duration,
                },
            )

            for i, strategy in enumerate(plan.strategies):
                attempt = await self._execute_recovery_strategy(
                    strategy, error, context, plan.error_id
                )
                attempts.append(attempt)

                # Update success rate tracking
                await self._update_success_rates(strategy, attempt.outcome)

                if attempt.outcome == RecoveryOutcome.SUCCESS:
                    self.logger.info(f"Recovery successful with strategy {strategy}")
                    break
                elif attempt.outcome == RecoveryOutcome.PARTIAL_SUCCESS:
                    # Continue with next strategy but log partial success
                    self.logger.info(
                        f"Partial recovery with strategy {strategy}, continuing"
                    )
                else:
                    self.logger.warning(f"Recovery failed with strategy {strategy}")

                    # If not the last strategy, wait before next attempt
                    if i < len(plan.strategies) - 1:
                        await asyncio.sleep(2)

            # Determine overall outcome
            overall_success = any(
                a.outcome == RecoveryOutcome.SUCCESS for a in attempts
            )

            # Send final notification
            await notification_service.send_recovery_notification(
                "recovery_plan_completed",
                overall_success,
                {
                    "plan_id": plan.error_id,
                    "attempts": len(attempts),
                    "successful_strategy": next(
                        (
                            a.strategy.value
                            for a in attempts
                            if a.outcome == RecoveryOutcome.SUCCESS
                        ),
                        None,
                    ),
                },
            )

            return attempts

        except Exception as e:
            self.logger.error(f"Failed to execute recovery plan: {e}")

            # Send failure notification
            notification_service = await get_notification_service()
            await notification_service.send_recovery_notification(
                "recovery_plan_failed",
                False,
                {"plan_id": plan.error_id, "error": str(e)},
            )

            raise

    async def _analyze_error(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze error characteristics for recovery planning."""
        analysis = {
            "category": error.category.value,
            "severity": error.severity.value,
            "retryable": error.retryable,
            "error_code": error.code,
            "context": context,
        }

        # Add historical analysis
        historical_data = await self._get_historical_error_data(error.code)
        analysis["historical"] = historical_data

        # Add system state analysis
        system_state = await self._analyze_system_state()
        analysis["system_state"] = system_state

        return analysis

    async def _get_historical_error_data(self, error_code: str) -> Dict[str, Any]:
        """Get historical data for this error type."""
        try:
            # Get recent occurrences of this error
            keys = await self.redis.keys(f"recovery_attempt:*")
            historical_attempts = []

            for key in keys:
                data = await self.redis.get(key)
                if data:
                    attempt_data = json.loads(data)
                    if attempt_data.get("error_code") == error_code:
                        historical_attempts.append(attempt_data)

            if not historical_attempts:
                return {"occurrences": 0, "success_rate": 0.0, "common_strategies": []}

            # Calculate success rate
            successful_attempts = [
                a for a in historical_attempts if a.get("outcome") == "success"
            ]
            success_rate = len(successful_attempts) / len(historical_attempts)

            # Find most successful strategies
            strategy_success = defaultdict(lambda: {"attempts": 0, "successes": 0})
            for attempt in historical_attempts:
                strategy = attempt.get("strategy")
                if strategy:
                    strategy_success[strategy]["attempts"] += 1
                    if attempt.get("outcome") == "success":
                        strategy_success[strategy]["successes"] += 1

            # Sort strategies by success rate
            common_strategies = sorted(
                strategy_success.items(),
                key=lambda x: (
                    x[1]["successes"] / x[1]["attempts"] if x[1]["attempts"] > 0 else 0
                ),
                reverse=True,
            )[:3]

            return {
                "occurrences": len(historical_attempts),
                "success_rate": success_rate,
                "common_strategies": [s[0] for s in common_strategies],
            }

        except Exception as e:
            self.logger.error(f"Failed to get historical error data: {e}")
            return {"occurrences": 0, "success_rate": 0.0, "common_strategies": []}

    async def _analyze_system_state(self) -> Dict[str, Any]:
        """Analyze current system state for recovery planning."""
        try:
            # Get system metrics
            cpu_usage = await self._get_system_metric("cpu_usage", 75.0)  # Default 75%
            memory_usage = await self._get_system_metric(
                "memory_usage", 80.0
            )  # Default 80%
            error_rate = await self._get_system_metric(
                "error_rate", 5.0
            )  # Default 5/hour

            # Determine system health
            health_score = 100.0
            if cpu_usage > 90:
                health_score -= 30
            elif cpu_usage > 75:
                health_score -= 15

            if memory_usage > 90:
                health_score -= 30
            elif memory_usage > 80:
                health_score -= 15

            if error_rate > 20:
                health_score -= 25
            elif error_rate > 10:
                health_score -= 10

            return {
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "error_rate": error_rate,
                "health_score": max(0, health_score),
                "under_stress": health_score < 70,
            }

        except Exception as e:
            self.logger.error(f"Failed to analyze system state: {e}")
            return {"health_score": 50, "under_stress": True}

    async def _get_system_metric(self, metric_name: str, default_value: float) -> float:
        """Get system metric from Redis or return default."""
        try:
            value = await self.redis.get(f"system_metric:{metric_name}")
            return float(value) if value else default_value
        except:
            return default_value

    async def _select_recovery_strategies(
        self, error: BaseAppException, analysis: Dict[str, Any]
    ) -> List[RecoveryStrategy]:
        """Select optimal recovery strategies using ML insights."""
        strategies = []

        # Get applicable strategies for error category
        applicable_strategies = [
            strategy
            for strategy, config in self.strategy_configs.items()
            if error.category in config["applicable_categories"]
        ]

        # Use historical data to prioritize strategies
        historical = analysis.get("historical", {})
        common_strategies = historical.get("common_strategies", [])

        # Prioritize historically successful strategies
        prioritized_strategies = []
        for strategy_name in common_strategies:
            try:
                strategy = RecoveryStrategy(strategy_name)
                if strategy in applicable_strategies:
                    prioritized_strategies.append(strategy)
            except ValueError:
                continue

        # Add remaining applicable strategies
        for strategy in applicable_strategies:
            if strategy not in prioritized_strategies:
                prioritized_strategies.append(strategy)

        # Consider system state for strategy selection
        system_state = analysis.get("system_state", {})
        if system_state.get("under_stress", False):
            # Prefer less resource-intensive strategies when under stress
            low_impact_strategies = [
                RecoveryStrategy.GRACEFUL_DEGRADATION,
                RecoveryStrategy.FALLBACK_SERVICE,
                RecoveryStrategy.CIRCUIT_BREAKER,
            ]
            strategies = [
                s for s in low_impact_strategies if s in prioritized_strategies
            ]
            strategies.extend(
                [s for s in prioritized_strategies if s not in low_impact_strategies]
            )
        else:
            strategies = prioritized_strategies

        # Limit to top 3 strategies to avoid excessive recovery time
        return strategies[:3]

    async def _estimate_success_probability(
        self, error: BaseAppException, strategies: List[RecoveryStrategy]
    ) -> float:
        """Estimate overall success probability for the recovery plan."""
        if not strategies:
            return 0.0

        # Calculate combined probability (assuming strategies are independent)
        failure_probability = 1.0

        for strategy in strategies:
            # Get strategy-specific success rate
            strategy_success_rate = await self._get_strategy_success_rate(
                strategy, error.category
            )
            failure_probability *= 1.0 - strategy_success_rate

        return 1.0 - failure_probability

    async def _get_strategy_success_rate(
        self, strategy: RecoveryStrategy, category: ErrorCategory
    ) -> float:
        """Get success rate for a specific strategy and error category."""
        key = f"strategy_success:{strategy.value}:{category.value}"

        # Get from tracking data
        tracking_data = self.success_rates.get(key, {"attempts": 0, "successes": 0})

        if tracking_data["attempts"] == 0:
            # Use default from configuration
            return self.strategy_configs[strategy].get("success_threshold", 0.5)

        return tracking_data["successes"] / tracking_data["attempts"]

    async def _estimate_recovery_duration(
        self, strategies: List[RecoveryStrategy]
    ) -> int:
        """Estimate total recovery duration in seconds."""
        total_duration = 0

        for strategy in strategies:
            if strategy == RecoveryStrategy.IMMEDIATE_RETRY:
                total_duration += 5  # 5 seconds
            elif strategy == RecoveryStrategy.EXPONENTIAL_BACKOFF:
                total_duration += 30  # 30 seconds average
            elif strategy == RecoveryStrategy.CIRCUIT_BREAKER:
                total_duration += 10  # 10 seconds
            elif strategy == RecoveryStrategy.FALLBACK_SERVICE:
                total_duration += 15  # 15 seconds
            elif strategy == RecoveryStrategy.RESOURCE_SCALING:
                total_duration += 120  # 2 minutes
            elif strategy == RecoveryStrategy.SERVICE_RESTART:
                total_duration += 60  # 1 minute
            elif strategy == RecoveryStrategy.GRACEFUL_DEGRADATION:
                total_duration += 5  # 5 seconds

        return total_duration

    def _calculate_recovery_priority(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> int:
        """Calculate recovery priority (1-10, higher is more urgent)."""
        priority = 5  # Base priority

        # Adjust based on severity
        if error.severity.value == "critical":
            priority += 3
        elif error.severity.value == "high":
            priority += 2
        elif error.severity.value == "medium":
            priority += 1

        # Adjust based on category
        if error.category in [ErrorCategory.SYSTEM, ErrorCategory.DATABASE]:
            priority += 2
        elif error.category in [ErrorCategory.AI_SERVICE, ErrorCategory.WORKFLOW]:
            priority += 1

        # Adjust based on context
        if context.get("user_facing", False):
            priority += 1
        if context.get("business_critical", False):
            priority += 2

        return min(10, max(1, priority))

    async def _execute_recovery_strategy(
        self,
        strategy: RecoveryStrategy,
        error: BaseAppException,
        context: Dict[str, Any],
        error_id: str,
    ) -> RecoveryAttempt:
        """Execute a specific recovery strategy."""
        attempt = RecoveryAttempt(
            id=f"attempt_{datetime.utcnow().timestamp()}",
            error_id=error_id,
            strategy=strategy,
            started_at=datetime.utcnow(),
            completed_at=None,
            outcome=RecoveryOutcome.FAILURE,
            details={},
        )

        try:
            self.logger.info(f"Executing recovery strategy: {strategy}")

            if strategy == RecoveryStrategy.IMMEDIATE_RETRY:
                outcome = await self._execute_immediate_retry(error, context)
            elif strategy == RecoveryStrategy.EXPONENTIAL_BACKOFF:
                outcome = await self._execute_exponential_backoff(error, context)
            elif strategy == RecoveryStrategy.CIRCUIT_BREAKER:
                outcome = await self._execute_circuit_breaker(error, context)
            elif strategy == RecoveryStrategy.FALLBACK_SERVICE:
                outcome = await self._execute_fallback_service(error, context)
            elif strategy == RecoveryStrategy.RESOURCE_SCALING:
                outcome = await self._execute_resource_scaling(error, context)
            elif strategy == RecoveryStrategy.SERVICE_RESTART:
                outcome = await self._execute_service_restart(error, context)
            elif strategy == RecoveryStrategy.GRACEFUL_DEGRADATION:
                outcome = await self._execute_graceful_degradation(error, context)
            else:
                outcome = RecoveryOutcome.SKIPPED

            attempt.outcome = outcome
            attempt.completed_at = datetime.utcnow()
            attempt.duration_seconds = (
                attempt.completed_at - attempt.started_at
            ).total_seconds()

        except Exception as e:
            self.logger.error(f"Recovery strategy {strategy} failed: {e}")
            attempt.outcome = RecoveryOutcome.FAILURE
            attempt.completed_at = datetime.utcnow()
            attempt.details["error"] = str(e)
            attempt.duration_seconds = (
                attempt.completed_at - attempt.started_at
            ).total_seconds()

        # Store attempt
        await self._store_recovery_attempt(attempt)

        return attempt

    async def _execute_immediate_retry(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute immediate retry strategy."""
        config = self.strategy_configs[RecoveryStrategy.IMMEDIATE_RETRY]

        # Simulate retry logic (in real implementation, this would retry the actual operation)
        for attempt in range(config["max_attempts"]):
            await asyncio.sleep(0.1)  # Small delay

            # Simulate success probability
            import random

            if random.random() < 0.7:  # 70% success rate
                return RecoveryOutcome.SUCCESS

        return RecoveryOutcome.FAILURE

    async def _execute_exponential_backoff(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute exponential backoff retry strategy."""
        config = self.strategy_configs[RecoveryStrategy.EXPONENTIAL_BACKOFF]

        retry_config = RetryConfig(
            max_attempts=config["max_attempts"],
            base_delay=config["base_delay"],
            max_delay=config["max_delay"],
        )

        try:
            # In real implementation, this would retry the actual failed operation
            await asyncio.sleep(1)  # Simulate operation
            return RecoveryOutcome.SUCCESS
        except:
            return RecoveryOutcome.FAILURE

    async def _execute_circuit_breaker(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute circuit breaker strategy."""
        # Set circuit breaker state
        await self.redis.setex(f"circuit_breaker:{error.category.value}", 300, "open")
        return RecoveryOutcome.SUCCESS

    async def _execute_fallback_service(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute fallback service strategy."""
        # Activate fallback service
        await self.redis.setex(f"fallback:{error.category.value}", 3600, "active")
        return RecoveryOutcome.SUCCESS

    async def _execute_resource_scaling(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute resource scaling strategy."""
        # Trigger resource scaling (placeholder)
        self.logger.info("Triggering resource scaling")
        await asyncio.sleep(2)  # Simulate scaling time
        return RecoveryOutcome.SUCCESS

    async def _execute_service_restart(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute service restart strategy."""
        # Trigger service restart (placeholder)
        self.logger.info("Triggering service restart")
        await asyncio.sleep(3)  # Simulate restart time
        return RecoveryOutcome.SUCCESS

    async def _execute_graceful_degradation(
        self, error: BaseAppException, context: Dict[str, Any]
    ) -> RecoveryOutcome:
        """Execute graceful degradation strategy."""
        # Enable degraded mode
        await self.redis.setex("degraded_mode", 3600, "active")
        return RecoveryOutcome.SUCCESS

    async def _store_recovery_plan(self, plan: RecoveryPlan) -> None:
        """Store recovery plan in Redis."""
        key = f"recovery_plan:{plan.error_id}"
        data = asdict(plan)
        data["strategies"] = [s.value for s in plan.strategies]
        data["created_at"] = plan.created_at.isoformat()

        await self.redis.setex(key, 86400, json.dumps(data, default=str))

    async def _store_recovery_attempt(self, attempt: RecoveryAttempt) -> None:
        """Store recovery attempt in Redis."""
        key = f"recovery_attempt:{attempt.id}"
        data = asdict(attempt)
        data["strategy"] = attempt.strategy.value
        data["outcome"] = attempt.outcome.value
        data["started_at"] = attempt.started_at.isoformat()
        if attempt.completed_at:
            data["completed_at"] = attempt.completed_at.isoformat()

        await self.redis.setex(key, 86400 * 7, json.dumps(data, default=str))

    async def _update_success_rates(
        self, strategy: RecoveryStrategy, outcome: RecoveryOutcome
    ) -> None:
        """Update success rate tracking for ML optimization."""
        key = f"strategy_success:{strategy.value}"

        # Increment attempt counter
        await self.redis.incr(f"{key}:attempts")

        # Increment success counter if successful
        if outcome == RecoveryOutcome.SUCCESS:
            await self.redis.incr(f"{key}:successes")

        # Set expiration
        await self.redis.expire(f"{key}:attempts", 86400 * 30)  # 30 days
        await self.redis.expire(f"{key}:successes", 86400 * 30)

    async def get_recovery_stats(self) -> Dict[str, Any]:
        """Get recovery statistics and insights."""
        try:
            # Get recent recovery attempts
            keys = await self.redis.keys("recovery_attempt:*")
            attempts = []

            for key in keys:
                data = await self.redis.get(key)
                if data:
                    attempts.append(json.loads(data))

            if not attempts:
                return {"total_attempts": 0, "success_rate": 0.0}

            # Calculate overall statistics
            total_attempts = len(attempts)
            successful_attempts = len(
                [a for a in attempts if a["outcome"] == "success"]
            )
            success_rate = successful_attempts / total_attempts * 100

            # Strategy performance
            strategy_stats = defaultdict(lambda: {"attempts": 0, "successes": 0})
            for attempt in attempts:
                strategy = attempt["strategy"]
                strategy_stats[strategy]["attempts"] += 1
                if attempt["outcome"] == "success":
                    strategy_stats[strategy]["successes"] += 1

            # Calculate strategy success rates
            strategy_performance = {}
            for strategy, stats in strategy_stats.items():
                strategy_performance[strategy] = {
                    "attempts": stats["attempts"],
                    "successes": stats["successes"],
                    "success_rate": (
                        (stats["successes"] / stats["attempts"] * 100)
                        if stats["attempts"] > 0
                        else 0
                    ),
                }

            # Average recovery time
            completed_attempts = [a for a in attempts if a.get("duration_seconds")]
            avg_duration = (
                sum(a["duration_seconds"] for a in completed_attempts)
                / len(completed_attempts)
                if completed_attempts
                else 0
            )

            return {
                "total_attempts": total_attempts,
                "successful_attempts": successful_attempts,
                "success_rate": success_rate,
                "average_duration_seconds": avg_duration,
                "strategy_performance": strategy_performance,
                "last_updated": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            self.logger.error(f"Failed to get recovery stats: {e}")
            return {"error": str(e)}


# Global service instance
_recovery_service: Optional[EnhancedRecoveryService] = None


async def get_enhanced_recovery_service() -> EnhancedRecoveryService:
    """Get or create enhanced recovery service instance."""
    global _recovery_service

    if _recovery_service is None:
        redis_client = redis.from_url("redis://localhost:6379", decode_responses=False)
        _recovery_service = EnhancedRecoveryService(redis_client)

    return _recovery_service
