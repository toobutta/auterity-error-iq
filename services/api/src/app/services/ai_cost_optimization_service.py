"""AI Cost Optimization Engine - Dynamic model selection."""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

import numpy as np
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.saas_config import SaaSConfig
from app.models.tenant import Tenant, UsageLog

logger = logging.getLogger(__name__)


class OptimizationStrategy(str, Enum):
    """AI model optimization strategies."""

    AGGRESSIVE = "aggressive"  # Always choose cheapest
    BALANCED = "balanced"  # Balance cost vs quality
    QUALITY_FIRST = "quality"  # Prioritize quality
    BUDGET_FOCUSED = "budget"  # Stay within budget constraints


class CostOptimizationLevel(str, Enum):
    """Cost optimization aggressiveness levels."""

    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


@dataclass
class ModelCostProfile:
    """Cost profile for an AI model."""

    model_id: str
    provider: str
    cost_per_1k_tokens: Decimal
    max_tokens: int
    avg_latency_ms: int
    success_rate: float = 1.0
    capabilities: List[str] = field(default_factory=list)
    use_cases: List[str] = field(default_factory=list)


@dataclass
class CostPrediction:
    """Cost prediction result."""

    estimated_cost: Decimal
    confidence: float
    recommended_model: str
    alternative_models: List[str]
    reasoning: str
    cost_breakdown: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OptimizationRecommendation:
    """AI cost optimization recommendation."""

    strategy: OptimizationStrategy
    recommended_model: str
    expected_cost_savings: Decimal
    expected_performance_impact: float
    confidence: float
    reasoning: str
    implementation_steps: List[str] = field(default_factory=list)


@dataclass
class BudgetAnalysis:
    """Budget analysis and forecasting."""

    current_spend: Decimal
    projected_spend: Decimal
    budget_remaining: Decimal
    budget_utilization: float
    recommendations: List[str] = field(default_factory=list)
    alerts: List[str] = field(default_factory=list)


class AICostOptimizationService:
    """AI Cost Optimization Engine - Intelligent model selection."""

    def __init__(self, db: Session):
        self.db = db
        self.config = SaaSConfig(
            DEFAULT_TRIAL_DAYS=30,
            MAX_TRIAL_DAYS=90,
            AUTO_SUSPEND_DAYS=7,
            GRACE_PERIOD_DAYS=5,
            INVOICE_DUE_DAYS=15,
            USAGE_TRACKING_ENABLED=True,
            USAGE_RESET_DAY=1,
            USAGE_ALERT_THRESHOLD=0.8,
            STORAGE_PRICING=Decimal("0.01"),
            WHITE_LABEL_ENABLED=False,
            CUSTOM_DOMAIN_ENABLED=False,
            BRANDING_CUSTOMIZATION_ENABLED=False,
            COMPLIANCE_CHECKS_ENABLED=True,
            GDPR_COMPLIANCE_ENABLED=True,
            SOC2_COMPLIANCE_ENABLED=True,
            HIPAA_COMPLIANCE_ENABLED=False,
            API_RATE_LIMITING_ENABLED=True,
            DEFAULT_RATE_LIMIT=1000,
            MAX_RATE_LIMIT=5000,
            USAGE_MONITORING_ENABLED=True,
            BILLING_MONITORING_ENABLED=True,
            PERFORMANCE_MONITORING_ENABLED=True,
            EMAIL_NOTIFICATIONS_ENABLED=True,
            SLACK_NOTIFICATIONS_ENABLED=False,
            WEBHOOK_NOTIFICATIONS_ENABLED=False,
            USAGE_ANALYTICS_ENABLED=True,
            BILLING_ANALYTICS_ENABLED=True,
            USER_ANALYTICS_ENABLED=True,
            STRIPE_INTEGRATION_ENABLED=True,
            PAYPAL_INTEGRATION_ENABLED=False,
            QUICKBOOKS_INTEGRATION_ENABLED=False,
            TEST_MODE=False,
            MOCK_BILLING_ENABLED=False,
            MOCK_PAYMENTS_ENABLED=False,
        )
        self.model_profiles = self._initialize_model_profiles()

    def _initialize_model_profiles(self) -> Dict[str, ModelCostProfile]:
        """Initialize AI model cost profiles from configuration."""
        profiles = {}

        # Load from model policies configuration
        if hasattr(settings, "MODEL_POLICIES"):
            for provider, provider_data in getattr(
                settings, "MODEL_POLICIES", {}
            ).items():
                for model_id, model_data in provider_data.items():
                    if isinstance(model_data, dict):
                        profiles[model_id] = ModelCostProfile(
                            model_id=model_id,
                            provider=provider,
                            cost_per_1k_tokens=Decimal(
                                str(
                                    model_data.get("cost_per_1k_tokens", 0.002)
                                )
                            ),
                            max_tokens=model_data.get("max_tokens", 4096),
                            avg_latency_ms=model_data.get(
                                "avg_latency_ms", 500
                            ),
                            success_rate=model_data.get("success_rate", 0.99),
                            capabilities=model_data.get("capabilities", []),
                            use_cases=model_data.get("use_cases", []),
                        )

        # Fallback profiles if config not available
        if not profiles:
            profiles = {
                "gpt-3.5-turbo": ModelCostProfile(
                    model_id="gpt-3.5-turbo",
                    provider="openai",
                    cost_per_1k_tokens=Decimal("0.002"),
                    max_tokens=4096,
                    avg_latency_ms=300,
                    success_rate=0.99,
                    capabilities=["text", "chat", "reasoning"],
                    use_cases=[
                        "general",
                        "customer_service",
                        "quick_responses",
                    ],
                ),
                "gpt-4": ModelCostProfile(
                    model_id="gpt-4",
                    provider="openai",
                    cost_per_1k_tokens=Decimal("0.03"),
                    max_tokens=8192,
                    avg_latency_ms=800,
                    success_rate=0.98,
                    capabilities=[
                        "text",
                        "chat",
                        "complex_reasoning",
                        "analysis",
                    ],
                    use_cases=[
                        "complex_analysis",
                        "detailed_responses",
                        "critical_tasks",
                    ],
                ),
                "claude-3-haiku": ModelCostProfile(
                    model_id="claude-3-haiku",
                    provider="anthropic",
                    cost_per_1k_tokens=Decimal("0.0015"),
                    max_tokens=4096,
                    avg_latency_ms=250,
                    success_rate=0.99,
                    capabilities=["text", "chat", "reasoning"],
                    use_cases=["general", "cost_sensitive"],
                ),
                "llama2": ModelCostProfile(
                    model_id="llama2",
                    provider="ollama",
                    cost_per_1k_tokens=Decimal("0.0"),
                    max_tokens=4096,
                    avg_latency_ms=400,
                    success_rate=0.95,
                    capabilities=["text", "chat"],
                    use_cases=["development", "testing", "cost_sensitive"],
                ),
            }

        return profiles

    async def predict_request_cost(
        self,
        tenant_id: UUID,
        model_id: str,
        input_tokens: int,
        output_tokens: Optional[int] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> CostPrediction:
        """Predict the cost of an AI request with confidence interval."""
        try:
            if model_id not in self.model_profiles:
                raise ValueError(f"Unknown model: {model_id}")

            profile = self.model_profiles[model_id]

            # Estimate output tokens if not provided
            if output_tokens is None:
                output_tokens = min(
                    int(input_tokens * 1.5), profile.max_tokens // 2
                )

            # Calculate cost
            total_tokens = input_tokens + output_tokens
            base_cost = (
                Decimal(total_tokens) / Decimal(1000)
            ) * profile.cost_per_1k_tokens

            # Apply context-based adjustments
            adjusted_cost = self._apply_context_adjustments(
                base_cost, context or {}
            )

            # Calculate confidence based on historical data
            confidence = await self._calculate_prediction_confidence(
                tenant_id, model_id, total_tokens
            )

            # Find alternative models
            alternative_models = await self._find_alternative_models(
                tenant_id, model_id, adjusted_cost, input_tokens, output_tokens
            )

            # Generate reasoning
            reasoning = self._generate_cost_reasoning(
                model_id, adjusted_cost, confidence, alternative_models
            )

            return CostPrediction(
                estimated_cost=adjusted_cost,
                confidence=confidence,
                recommended_model=model_id,
                alternative_models=alternative_models,
                reasoning=reasoning,
                cost_breakdown={
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "base_cost": base_cost,
                    "adjustments": adjusted_cost - base_cost,
                    "model_cost_per_1k": profile.cost_per_1k_tokens,
                },
            )

        except Exception as e:
            logger.error(f"Cost prediction failed: {str(e)}")
            raise

    def _apply_context_adjustments(
        self, base_cost: Decimal, context: Dict[str, Any]
    ) -> Decimal:
        """Apply context-based cost adjustments."""
        adjusted_cost = base_cost

        # Priority adjustments
        if context.get("priority") == "high":
            adjusted_cost *= Decimal("1.1")  # 10% premium for high priority

        # Complexity adjustments
        complexity = context.get("complexity", "medium")
        if complexity == "high":
            adjusted_cost *= Decimal("1.2")
        elif complexity == "low":
            adjusted_cost *= Decimal("0.9")

        # Time-based adjustments (peak hours)
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:  # Business hours
            adjusted_cost *= Decimal("1.05")

        return adjusted_cost.quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )

    async def _calculate_prediction_confidence(
        self, tenant_id: UUID, model_id: str, total_tokens: int
    ) -> float:
        """Calculate confidence in cost prediction based on historical data."""
        try:
            # Query historical usage for this tenant and model
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)

            historical_usage = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.resource_type == "ai_request",
                        UsageLog.metadata_json.contains({"model": model_id}),
                        UsageLog.created_at >= thirty_days_ago,
                    )
                )
                .all()
            )

            if not historical_usage:
                return 0.7  # Default confidence for new models

            # Calculate variance in historical costs
            historical_costs = [
                usage.cost_amount
                for usage in historical_usage
                if usage.cost_amount
            ]

            if len(historical_costs) < 5:
                return 0.75

            # Calculate coefficient of variation
            mean_cost = np.mean(historical_costs)
            std_cost = np.std(historical_costs)

            if mean_cost == 0:
                return 0.8

            coefficient_of_variation = std_cost / mean_cost

            # Convert to confidence score (lower variation = higher confidence)
            confidence = max(0.5, min(0.95, 1.0 - coefficient_of_variation))

            return float(confidence)

        except Exception as e:
            logger.warning(f"Confidence calculation failed: {str(e)}")
            return 0.7

    async def _find_alternative_models(
        self,
        tenant_id: UUID,
        current_model: str,
        current_cost: Decimal,
        input_tokens: int,
        output_tokens: int,
    ) -> List[str]:
        """Find alternative models that could handle the same request."""
        alternatives = []

        for model_id, profile in self.model_profiles.items():
            if model_id == current_model:
                continue

            # Check if model has required capabilities
            current_profile = self.model_profiles[current_model]

            # Must have at least one common capability
            if set(profile.capabilities).intersection(
                set(current_profile.capabilities)
            ):
                # Calculate cost for alternative
                alt_cost = (
                    Decimal(input_tokens + output_tokens) / Decimal(1000)
                ) * profile.cost_per_1k_tokens

                # Only include if significantly cheaper or same price range
                cost_ratio = alt_cost / current_cost
                if cost_ratio <= 0.8:  # At least 20% cheaper
                    alternatives.append(model_id)

        return alternatives[:3]  # Return top 3 alternatives

    def _generate_cost_reasoning(
        self,
        model_id: str,
        cost: Decimal,
        confidence: float,
        alternatives: List[str],
    ) -> str:
        """Generate human-readable reasoning for cost prediction."""
        profile = self.model_profiles[model_id]

        reasoning = (
            f"Model {model_id} ({profile.provider}) estimated cost: ${cost}"
        )

        if confidence > 0.9:
            reasoning += " with high confidence"
        elif confidence > 0.7:
            reasoning += " with moderate confidence"
        else:
            reasoning += " with low confidence"

        if alternatives:
            reasoning += (
                f". Cheaper alternatives available: {', '.join(alternatives)}"
            )

        return reasoning

    async def optimize_model_selection(
        self,
        tenant_id: UUID,
        input_tokens: int,
        context: Optional[Dict[str, Any]] = None,
        cost_constraint: Optional[Decimal] = None,
        strategy: OptimizationStrategy = OptimizationStrategy.BALANCED,
    ) -> OptimizationRecommendation:
        """Optimize AI model selection based on cost, performance."""
        try:
            context = context or {}
            cost_constraint = cost_constraint or Decimal("1.0")

            # Get tenant information
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Evaluate all available models
            model_evaluations = []

            for model_id, profile in self.model_profiles.items():
                # Predict cost for this model
                prediction = await self.predict_request_cost(
                    tenant_id, model_id, input_tokens, context=context
                )

                # Skip if over cost constraint
                if prediction.estimated_cost > cost_constraint:
                    continue

                # Calculate performance score (0-100)
                performance_score = self._calculate_performance_score(
                    profile, context
                )

                # Calculate cost efficiency score (0-100)
                cost_efficiency = self._calculate_cost_efficiency_score(
                    prediction.estimated_cost, performance_score
                )

                # Calculate overall score based on strategy
                overall_score = self._calculate_strategy_score(
                    strategy,
                    performance_score,
                    cost_efficiency,
                    prediction.confidence,
                )

                model_evaluations.append(
                    {
                        "model_id": model_id,
                        "prediction": prediction,
                        "performance_score": performance_score,
                        "cost_efficiency": cost_efficiency,
                        "overall_score": overall_score,
                    }
                )

            if not model_evaluations:
                # Fallback to cheapest available model
                cheapest_model = min(
                    self.model_profiles.keys(),
                    key=lambda m: self.model_profiles[m].cost_per_1k_tokens,
                )
                return OptimizationRecommendation(
                    strategy=strategy,
                    recommended_model=cheapest_model,
                    expected_cost_savings=Decimal("0"),
                    expected_performance_impact=0.0,
                    confidence=0.5,
                    reasoning="No models meet cost"
                    "constraint, using cheapest available",
                )

            # Sort by overall score (descending)
            model_evaluations.sort(
                key=lambda x: x["overall_score"], reverse=True
            )
            best_option = model_evaluations[0]

            # Calculate savings and impact compared to default model
            default_model = "gpt-3.5-turbo"  # Default fallback
            if default_model in self.model_profiles:
                default_cost = await self.predict_request_cost(
                    tenant_id, default_model, input_tokens, context=context
                )
                savings = (
                    default_cost.estimated_cost
                    - best_option["prediction"].estimated_cost
                )
                performance_impact = best_option[
                    "performance_score"
                ] - self._calculate_performance_score(
                    self.model_profiles[default_model], context
                )
            else:
                savings = Decimal("0")
                performance_impact = 0.0

            # Generate implementation steps
            steps = self._generate_implementation_steps(
                best_option["model_id"],
                best_option["prediction"].estimated_cost,
                savings,
            )

            return OptimizationRecommendation(
                strategy=strategy,
                recommended_model=best_option["model_id"],
                expected_cost_savings=savings,
                expected_performance_impact=performance_impact,
                confidence=best_option["prediction"].confidence,
                reasoning=self._generate_optimization_reasoning(
                    best_option, strategy
                ),
                implementation_steps=steps,
            )

        except Exception as e:
            logger.error(f"Model optimization failed: {str(e)}")
            raise

    def _calculate_performance_score(
        self, profile: ModelCostProfile, context: Dict[str, Any]
    ) -> float:
        """Calculate performance score for a model (0-100)."""
        base_score = 50.0

        # Latency component (lower latency = higher score)
        if profile.avg_latency_ms < 300:
            base_score += 20
        elif profile.avg_latency_ms < 600:
            base_score += 10
        elif profile.avg_latency_ms > 1000:
            base_score -= 15

        # Success rate component
        success_bonus = (
            profile.success_rate - 0.95
        ) * 200  # Convert to 0-20 point scale
        base_score += success_bonus

        # Max tokens component
        if profile.max_tokens > 8000:
            base_score += 10
        elif profile.max_tokens < 2000:
            base_score -= 10

        # Context-based adjustments
        if (
            context.get("requires_complex_reasoning")
            and "complex_reasoning" in profile.capabilities
        ):
            base_score += 15

        if (
            context.get("requires_analysis")
            and "analysis" in profile.capabilities
        ):
            base_score += 10

        return max(0.0, min(100.0, base_score))

    def _calculate_cost_efficiency_score(
        self, cost: Decimal, performance_score: float
    ) -> float:
        """Calculate cost efficiency score (0-100)."""
        # Lower cost for same performance = higher efficiency
        # This is a simplified model - in practice, you'd use historical data
        if cost <= Decimal("0.01"):
            return 90.0
        elif cost <= Decimal("0.05"):
            return 70.0
        elif cost <= Decimal("0.1"):
            return 50.0
        else:
            return 30.0

    def _calculate_strategy_score(
        self,
        strategy: OptimizationStrategy,
        performance_score: float,
        cost_efficiency: float,
        confidence: float,
    ) -> float:
        """Calculate overall score based on optimization strategy."""
        if strategy == OptimizationStrategy.AGGRESSIVE:
            # 70% cost efficiency, 30% performance
            return (0.7 * cost_efficiency) + (0.3 * performance_score)
        elif strategy == OptimizationStrategy.BALANCED:
            # 50% cost efficiency, 50% performance
            return (0.5 * cost_efficiency) + (0.5 * performance_score)
        elif strategy == OptimizationStrategy.QUALITY_FIRST:
            # 30% cost efficiency, 70% performance
            return (0.3 * cost_efficiency) + (0.7 * performance_score)
        elif strategy == OptimizationStrategy.BUDGET_FOCUSED:
            # 80% cost efficiency, 20% performance
            return (0.8 * cost_efficiency) + (0.2 * performance_score)
        else:
            return (0.5 * cost_efficiency) + (0.5 * performance_score)

    def _generate_optimization_reasoning(
        self, evaluation: Dict, strategy: OptimizationStrategy
    ) -> str:
        """Generate reasoning for optimization recommendation."""
        model_id = evaluation["model_id"]
        self.model_profiles[model_id]

        if strategy == OptimizationStrategy.AGGRESSIVE:
            return (
                f"Selected {model_id} for maximum cost savings. "
                f"Performance score: {evaluation['performance_score']:.1f}/100"
            )
        elif strategy == OptimizationStrategy.BALANCED:
            return (
                f"Selected {model_id} balancing cost and performance. "
                f"Overall score: {evaluation['overall_score']:.1f}/100"
            )
        elif strategy == OptimizationStrategy.QUALITY_FIRST:
            return (
                f"Selected {model_id} prioritizing quality and capabilities. "
                f"Performance score: {evaluation['performance_score']:.1f}/100"
            )
        else:
            return (
                f"Selected {model_id} for budget compliance. "
                f"Cost efficiency: {evaluation['cost_efficiency']:.1f}/100"
            )

    def _generate_implementation_steps(
        self, model_id: str, estimated_cost: Decimal, savings: Decimal
    ) -> List[str]:
        """Generate implementation steps for the optimization."""
        steps = [f"Switch to model: {model_id}", ".4f"]

        if savings > 0:
            steps.append(".4f")

        steps.extend(
            [
                "Monitor performance impact for 24-48 hours",
                "Adjust optimization strategy if needed",
                "Update usage tracking for new model",
            ]
        )

        return steps

    async def analyze_budget_utilization(
        self, tenant_id: UUID, time_period_days: int = 30
    ) -> BudgetAnalysis:
        """Analyze tenant's AI budget utilization."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Calculate current spend
            period_start = datetime.utcnow() - timedelta(days=time_period_days)

            current_spend = self.db.query(
                func.sum(UsageLog.cost_amount)
            ).filter(
                and_(
                    UsageLog.tenant_id == tenant_id,
                    UsageLog.resource_type == "ai_request",
                    UsageLog.created_at >= period_start,
                )
            ).scalar() or Decimal(
                "0"
            )

            # Project monthly spend
            days_in_period = (datetime.utcnow() - period_start).days
            if days_in_period > 0:
                daily_spend = current_spend / Decimal(days_in_period)
                projected_spend = daily_spend * Decimal("30")
            else:
                projected_spend = Decimal("0")

            # Calculate budget metrics
            monthly_budget_val = Decimal(str(tenant.monthly_budget))
            current_spend_val = Decimal(str(current_spend))
            budget_remaining = monthly_budget_val - current_spend_val
            budget_utilization = (
                float(current_spend_val) / float(monthly_budget_val)
                if monthly_budget_val > 0
                else 0.0
            )

            # Generate recommendations
            recommendations = []
            alerts = []

            if budget_utilization > 0.9:
                alerts.append(
                    "Budget utilization over 90% - consider cost optimization"
                )
            elif budget_utilization > 0.8:
                alerts.append("Budget utilization over 80% - monitor closely")

            if (
                projected_spend is not None
                and projected_spend > monthly_budget_val * Decimal("1.1")
            ):
                recommendations.append(
                    "Projected spend exceeds budget by"
                    ">10% - implement aggressive optimization"
                )
            elif (
                projected_spend is not None
                and projected_spend > monthly_budget_val
            ):
                recommendations.append(
                    "Projected spend exceeds budget"
                    "- consider cost optimization measures"
                )

            # Model usage analysis
            model_usage = await self._analyze_model_usage(
                tenant_id, period_start
            )

            if model_usage:
                most_expensive = max(
                    model_usage.items(), key=lambda x: x[1]["total_cost"]
                )
                recommendations.append(
                    f"Consider alternatives to {most_expensive[0]} "
                    f"(cost: ${most_expensive[1]['total_cost']:.2f})"
                )

            return BudgetAnalysis(
                current_spend=current_spend,
                projected_spend=projected_spend,
                budget_remaining=Decimal(str(budget_remaining)),
                budget_utilization=budget_utilization,
                recommendations=recommendations,
                alerts=alerts,
            )

        except Exception as e:
            logger.error(f"Budget analysis failed: {str(e)}")
            raise

    async def _analyze_model_usage(
        self, tenant_id: UUID, period_start: datetime
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze AI model usage patterns for a tenant."""
        try:
            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.resource_type == "ai_request",
                        UsageLog.created_at >= period_start,
                    )
                )
                .all()
            )

            model_stats = {}

            for log in usage_logs:
                model = "unknown"
                if log.metadata_json and "model" in log.metadata_json:
                    model = log.metadata_json["model"]

                if model not in model_stats:
                    model_stats[model] = {
                        "total_cost": Decimal("0"),
                        "request_count": 0,
                        "avg_cost": Decimal("0"),
                    }

                model_stats[model]["total_cost"] += log.cost_amount or Decimal(
                    "0"
                )
                model_stats[model]["request_count"] += 1

            # Calculate averages
            for stats in model_stats.values():
                if stats["request_count"] > 0:
                    stats["avg_cost"] = stats["total_cost"] / Decimal(
                        stats["request_count"]
                    )

            return model_stats

        except Exception as e:
            logger.error(f"Model usage analysis failed: {str(e)}")
            return {}

    async def get_cost_optimization_suggestions(
        self,
        tenant_id: UUID,
        optimization_level: CostOptimizationLevel = CostOptimizationLevel.MODERATE,
    ) -> List[Dict[str, Any]]:
        """Get specific cost optimization suggestions for a tenant."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            suggestions = []

            # Analyze current model usage
            period_start = datetime.utcnow() - timedelta(days=30)
            model_usage = await self._analyze_model_usage(
                tenant_id, period_start
            )

            # Find expensive models
            expensive_models = [
                (model, stats)
                for model, stats in model_usage.items()
                if stats["avg_cost"] > Decimal("0.01")
            ]

            for model, stats in expensive_models:
                # Find cheaper alternatives
                alternatives = await self._find_alternative_models(
                    tenant_id,
                    model,
                    stats["avg_cost"] * Decimal(stats["request_count"]),
                    1000,
                    1000,  # Default token estimates
                )

                if alternatives:
                    potential_savings = stats["total_cost"] * Decimal(
                        "0.3"
                    )  # Estimate 30% savings

                    suggestions.append(
                        {
                            "type": "model_replacement",
                            "current_model": model,
                            "alternatives": alternatives,
                            "current_cost": float(stats["total_cost"]),
                            "potential_savings": float(potential_savings),
                            "impact": (
                                "medium"
                                if optimization_level
                                == CostOptimizationLevel.MODERATE
                                else "high"
                            ),
                            "description": (
                                f"Replace {model} with cheaper alternatives "
                                f"to save ~${potential_savings:.2f}"
                            ),
                        }
                    )

            # Budget-based suggestions
            tenant_monthly_budget = Decimal(str(tenant.monthly_budget))
            if tenant_monthly_budget is not None and tenant_monthly_budget > 0:
                budget_analysis = await self.analyze_budget_utilization(
                    tenant_id
                )

                if budget_analysis.budget_utilization > 0.8:
                    suggestions.append(
                        {
                            "type": "budget_optimization",
                            "current_utilization": budget_analysis.budget_utilization,
                            "recommended_action": "Implement strict cost controls",
                            "potential_savings": float(
                                budget_analysis.budget_remaining
                                * Decimal("0.5")
                            ),
                            "impact": "high",
                            "description": (
                                f"Budget "
                                f"{budget_analysis.budget_utilization:.0%} - "
                                "cost controls"
                            ),
                        }
                    )

            # Usage pattern suggestions
            usage_patterns = await self._analyze_usage_patterns(
                tenant_id, period_start
            )

            if usage_patterns.get("peak_hours_usage", 0) > 0.7:
                suggestions.append(
                    {
                        "type": "usage_optimization",
                        "issue": "Peak hour concentration",
                        "recommended_action": "Distribute usage across hours",
                        "potential_savings": "10-20%",
                        "impact": "medium",
                        "description": (
                            "High usage in peak hours - distribute for savings"
                        ),
                    }
                )

            return suggestions

        except Exception as e:
            logger.error(f"Optimization suggestions failed: {str(e)}")
            return []

    async def _analyze_usage_patterns(
        self, tenant_id: UUID, period_start: datetime
    ) -> Dict[str, Any]:
        """Analyze AI usage patterns for optimization opportunities."""
        try:
            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.resource_type == "ai_request",
                        UsageLog.created_at >= period_start,
                    )
                )
                .all()
            )

            patterns = {
                "total_requests": len(usage_logs),
                "peak_hours_usage": 0.0,
                "avg_cost_per_request": Decimal("0"),
                "cost_variance": 0.0,
            }

            if usage_logs:
                # Analyze peak hours (9-5 business hours)
                peak_hour_requests = sum(
                    1 for log in usage_logs if 9 <= log.created_at.hour <= 17
                )
                patterns["peak_hours_usage"] = peak_hour_requests / len(
                    usage_logs
                )

                # Cost analysis
                costs = [
                    log.cost_amount for log in usage_logs if log.cost_amount
                ]
                if costs:
                    patterns["avg_cost_per_request"] = sum(costs) / len(costs)
                    if len(costs) > 1:
                        patterns["cost_variance"] = np.var(costs)

            return patterns

        except Exception as e:
            logger.error(f"Usage pattern analysis failed: {str(e)}")
            return {}
