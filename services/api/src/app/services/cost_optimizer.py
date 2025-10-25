"""Cost Optimization Service for AI Service Requests."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from enum import Enum

from app.database import get_db_session
from app.models.user import User
from app.monitoring.performance import performance_monitor

logger = logging.getLogger(__name__)


class CostOptimizationStrategy(Enum):
    """Cost optimization strategy types."""
    AGGRESSIVE = "aggressive"  # Maximize cost savings, may impact quality
    BALANCED = "balanced"      # Balance cost and quality
    CONSERVATIVE = "conservative"  # Minimize cost impact on quality
    BUDGET_BASED = "budget_based"  # Strict budget enforcement


@dataclass
class CostAnalysis:
    """Cost analysis result."""
    request_cost: float
    optimized_cost: float
    savings_percentage: float
    alternative_providers: List[Dict[str, Any]]
    recommendation: str
    enforced: bool


@dataclass
class BudgetLimit:
    """Budget limit configuration."""
    user_id: str
    daily_limit: float
    monthly_limit: float
    current_daily_usage: float
    current_monthly_usage: float
    alert_threshold: float  # Percentage of limit
    enforcement_enabled: bool


class CostOptimizer:
    """Global cost optimization service."""

    def __init__(self):
        self.budgets: Dict[str, BudgetLimit] = {}
        self.cost_history: Dict[str, List[Dict[str, Any]]] = {}
        self.optimization_rules: Dict[str, Dict[str, Any]] = {}

    async def initialize(self):
        """Initialize the cost optimizer."""
        await self._load_budget_limits()
        await self._load_optimization_rules()
        await self._start_budget_monitoring()

        logger.info("Cost Optimizer initialized")

    async def _load_budget_limits(self):
        """Load user budget limits from database."""
        try:
            async with get_db_session() as session:
                budgets = await session.execute(
                    "SELECT user_id, daily_limit, monthly_limit, alert_threshold FROM user_budgets WHERE active = true"
                )
                for budget in budgets:
                    self.budgets[budget.user_id] = BudgetLimit(
                        user_id=budget.user_id,
                        daily_limit=budget.daily_limit,
                        monthly_limit=budget.monthly_limit,
                        current_daily_usage=0.0,  # Would load from usage history
                        current_monthly_usage=0.0,
                        alert_threshold=budget.alert_threshold,
                        enforcement_enabled=True
                    )
        except Exception as e:
            logger.error(f"Failed to load budget limits: {e}")

    async def _load_optimization_rules(self):
        """Load cost optimization rules."""
        # Default optimization rules
        self.optimization_rules = {
            "aggressive": {
                "max_cost_increase": 0.0,  # No cost increase allowed
                "quality_threshold": 0.7,  # Accept lower quality for cost savings
                "fallback_chain": ["gpt-3.5-turbo", "claude-3-haiku", "gpt-3.5-turbo-16k"]
            },
            "balanced": {
                "max_cost_increase": 0.1,  # Max 10% cost increase
                "quality_threshold": 0.85,
                "fallback_chain": ["gpt-4", "claude-3-opus", "gpt-3.5-turbo"]
            },
            "conservative": {
                "max_cost_increase": 0.25,  # Max 25% cost increase
                "quality_threshold": 0.95,
                "fallback_chain": ["gpt-4-turbo", "gpt-4", "claude-3-opus"]
            }
        }

    async def _start_budget_monitoring(self):
        """Start background budget monitoring."""
        asyncio.create_task(self._budget_monitor_loop())

    async def _budget_monitor_loop(self):
        """Background budget monitoring loop."""
        while True:
            try:
                await self._check_budget_limits()
                await asyncio.sleep(3600)  # Check every hour
            except Exception as e:
                logger.error(f"Budget monitoring error: {e}")
                await asyncio.sleep(300)

    async def _check_budget_limits(self):
        """Check and enforce budget limits."""
        for user_id, budget in self.budgets.items():
            if not budget.enforcement_enabled:
                continue

            # Check daily limit
            if budget.current_daily_usage >= budget.daily_limit:
                await self._enforce_budget_limit(user_id, "daily", budget.daily_limit)
                logger.warning(f"Daily budget limit reached for user {user_id}")

            # Check monthly limit
            if budget.current_monthly_usage >= budget.monthly_limit:
                await self._enforce_budget_limit(user_id, "monthly", budget.monthly_limit)
                logger.warning(f"Monthly budget limit reached for user {user_id}")

            # Send alerts for approaching limits
            daily_percentage = budget.current_daily_usage / budget.daily_limit
            monthly_percentage = budget.current_monthly_usage / budget.monthly_limit

            if daily_percentage >= budget.alert_threshold:
                await self._send_budget_alert(user_id, "daily", daily_percentage)

            if monthly_percentage >= budget.alert_threshold:
                await self._send_budget_alert(user_id, "monthly", monthly_percentage)

    async def _enforce_budget_limit(self, user_id: str, period: str, limit: float):
        """Enforce budget limit for user."""
        # Implementation would block or throttle requests
        # For now, just log the enforcement
        logger.info(f"Enforcing {period} budget limit of ${limit} for user {user_id}")

    async def _send_budget_alert(self, user_id: str, period: str, percentage: float):
        """Send budget alert notification."""
        # Implementation would send email/Slack notification
        logger.info(f"Sending {period} budget alert for user {user_id}: {percentage:.1%} used")

    async def analyze_request_cost(self, request: Dict[str, Any], user_id: str) -> CostAnalysis:
        """Analyze and optimize cost for an AI request."""
        start_time = time.time()

        try:
            # Estimate current request cost
            current_cost = self._estimate_request_cost(request)

            # Find cost optimization opportunities
            optimization_result = await self._find_cost_optimization(request, user_id)

            # Calculate savings
            savings_percentage = 0.0
            if optimization_result['optimized_cost'] < current_cost:
                savings_percentage = ((current_cost - optimization_result['optimized_cost']) / current_cost) * 100

            # Check if optimization should be enforced
            enforced = await self._should_enforce_optimization(request, user_id, optimization_result)

            analysis = CostAnalysis(
                request_cost=current_cost,
                optimized_cost=optimization_result['optimized_cost'],
                savings_percentage=savings_percentage,
                alternative_providers=optimization_result['alternatives'],
                recommendation=optimization_result['recommendation'],
                enforced=enforced
            )

            # Record metrics
            await performance_monitor.record_cost_analysis(
                analysis=analysis,
                request=request,
                user_id=user_id,
                duration=time.time() - start_time
            )

            return analysis

        except Exception as e:
            logger.error(f"Cost analysis failed: {e}")
            return CostAnalysis(
                request_cost=0.0,
                optimized_cost=0.0,
                savings_percentage=0.0,
                alternative_providers=[],
                recommendation="Cost analysis unavailable",
                enforced=False
            )

    def _estimate_request_cost(self, request: Dict[str, Any]) -> float:
        """Estimate cost for an AI request."""
        model = request.get('model', 'gpt-4')
        prompt_length = len(request.get('prompt', ''))
        expected_output_length = request.get('max_tokens', 1000)

        # Simple cost estimation based on model and token counts
        cost_per_token = {
            'gpt-4': 0.03,
            'gpt-4-turbo': 0.01,
            'gpt-3.5-turbo': 0.002,
            'claude-3-opus': 0.015,
            'claude-3-haiku': 0.00025
        }.get(model, 0.01)

        estimated_tokens = (prompt_length / 4) + expected_output_length  # Rough estimation
        return estimated_tokens * cost_per_token

    async def _find_cost_optimization(self, request: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Find cost optimization opportunities."""
        model = request.get('model', 'gpt-4')
        current_cost = self._estimate_request_cost(request)

        alternatives = []

        # Find cheaper alternatives
        model_alternatives = {
            'gpt-4': ['gpt-4-turbo', 'claude-3-opus', 'gpt-3.5-turbo'],
            'gpt-4-turbo': ['claude-3-opus', 'gpt-3.5-turbo'],
            'claude-3-opus': ['gpt-4-turbo', 'gpt-3.5-turbo'],
            'gpt-3.5-turbo': ['claude-3-haiku']  # Already cheapest
        }

        for alt_model in model_alternatives.get(model, []):
            alt_request = {**request, 'model': alt_model}
            alt_cost = self._estimate_request_cost(alt_request)
            if alt_cost < current_cost:
                alternatives.append({
                    'model': alt_model,
                    'estimated_cost': alt_cost,
                    'savings': current_cost - alt_cost,
                    'savings_percentage': ((current_cost - alt_cost) / current_cost) * 100
                })

        # Sort by savings
        alternatives.sort(key=lambda x: x['savings_percentage'], reverse=True)

        best_alternative = alternatives[0] if alternatives else None

        return {
            'optimized_cost': best_alternative['estimated_cost'] if best_alternative else current_cost,
            'alternatives': alternatives,
            'recommendation': f"Switch to {best_alternative['model']} for {best_alternative['savings_percentage']:.1f}% savings" if best_alternative else "No cost optimization available"
        }

    async def _should_enforce_optimization(self, request: Dict[str, Any], user_id: str, optimization: Dict[str, Any]) -> bool:
        """Determine if cost optimization should be enforced."""
        # Check user budget status
        if user_id in self.budgets:
            budget = self.budgets[user_id]
            daily_usage_pct = budget.current_daily_usage / budget.daily_limit
            monthly_usage_pct = budget.current_monthly_usage / budget.monthly_limit

            # Enforce optimization if approaching budget limits
            if daily_usage_pct > 0.8 or monthly_usage_pct > 0.8:
                return True

        # Check request priority/importance
        if request.get('high_priority', False):
            return False  # Don't optimize high-priority requests

        # Check if significant savings available
        if optimization.get('savings_percentage', 0) > 15:  # 15%+ savings
            return True

        return False

    async def enforce_cost_optimization(self, request: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Enforce cost optimization on a request."""
        analysis = await self.analyze_request_cost(request, user_id)

        if analysis.enforced and analysis.alternative_providers:
            # Apply the best alternative
            best_alt = analysis.alternative_providers[0]
            optimized_request = {**request, 'model': best_alt['model']}

            logger.info(f"Enforced cost optimization for user {user_id}: {analysis.recommendation}")

            return {
                'optimized_request': optimized_request,
                'original_cost': analysis.request_cost,
                'optimized_cost': analysis.optimized_cost,
                'savings': analysis.savings_percentage,
                'enforced': True
            }

        return {
            'optimized_request': request,
            'original_cost': analysis.request_cost,
            'optimized_cost': analysis.request_cost,
            'savings': 0.0,
            'enforced': False
        }

    async def record_usage(self, user_id: str, cost: float, timestamp: Optional[datetime] = None):
        """Record usage for budget tracking."""
        if timestamp is None:
            timestamp = datetime.utcnow()

        # Update budget tracking
        if user_id in self.budgets:
            budget = self.budgets[user_id]

            # Reset daily usage at midnight UTC
            if timestamp.date() != datetime.utcnow().date():
                budget.current_daily_usage = 0.0

            budget.current_daily_usage += cost
            budget.current_monthly_usage += cost

        # Store in cost history
        if user_id not in self.cost_history:
            self.cost_history[user_id] = []

        self.cost_history[user_id].append({
            'cost': cost,
            'timestamp': timestamp.isoformat(),
            'model': 'unknown'  # Would be passed from request
        })

        # Keep only last 1000 entries per user
        if len(self.cost_history[user_id]) > 1000:
            self.cost_history[user_id] = self.cost_history[user_id][-1000:]

    async def get_cost_analytics(self, user_id: str, period: str = '30d') -> Dict[str, Any]:
        """Get cost analytics for a user."""
        if user_id not in self.cost_history:
            return {
                'total_cost': 0.0,
                'average_daily_cost': 0.0,
                'cost_trend': [],
                'budget_status': {}
            }

        history = self.cost_history[user_id]
        now = datetime.utcnow()

        # Filter by period
        if period == '7d':
            cutoff = now - timedelta(days=7)
        elif period == '30d':
            cutoff = now - timedelta(days=30)
        else:
            cutoff = now - timedelta(days=30)

        filtered_history = [
            entry for entry in history
            if datetime.fromisoformat(entry['timestamp']) > cutoff
        ]

        total_cost = sum(entry['cost'] for entry in filtered_history)
        days_in_period = (now - cutoff).days or 1
        average_daily_cost = total_cost / days_in_period

        budget_info = {}
        if user_id in self.budgets:
            budget = self.budgets[user_id]
            budget_info = {
                'daily_limit': budget.daily_limit,
                'monthly_limit': budget.monthly_limit,
                'current_daily_usage': budget.current_daily_usage,
                'current_monthly_usage': budget.current_monthly_usage,
                'daily_remaining': budget.daily_limit - budget.current_daily_usage,
                'monthly_remaining': budget.monthly_limit - budget.current_monthly_usage
            }

        return {
            'total_cost': total_cost,
            'average_daily_cost': average_daily_cost,
            'request_count': len(filtered_history),
            'budget_status': budget_info,
            'period': period
        }


# Global cost optimizer instance
cost_optimizer = CostOptimizer()


async def get_cost_optimizer() -> CostOptimizer:
    """Get the global cost optimizer instance."""
    if not cost_optimizer.budgets:  # Check if initialized
        await cost_optimizer.initialize()
    return cost_optimizer
