"""AI Model Orchestration & Routing Service - Dynamic model selection and \
    A/B testing."""

import hashlib
import logging
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.core.saas_config import SaaSConfig
from app.services.ai_cost_optimization_service import AICostOptimizationService

logger = logging.getLogger(__name__)


class RoutingStrategy(str, Enum):
    """AI model routing strategies."""

    PERFORMANCE_OPTIMIZED = "performance_optimized"
    COST_OPTIMIZED = "cost_optimized"
    BALANCED = "balanced"
    RELIABILITY_FOCUSED = "reliability_focused"
    ADAPTIVE = "adaptive"


class ExperimentType(str, Enum):
    """A/B testing experiment types."""

    MODEL_COMPARISON = "model_comparison"
    PARAMETER_TUNING = "parameter_tuning"
    PROMPT_OPTIMIZATION = "prompt_optimization"
    ROUTING_STRATEGY = "routing_strategy"


class ModelStatus(str, Enum):
    """AI model operational status."""

    ACTIVE = "active"
    DEPRECATED = "deprecated"
    MAINTENANCE = "maintenance"
    EXPERIMENTAL = "experimental"


@dataclass
class ModelProfile:
    """AI model profile with capabilities and performance metrics."""

    model_id: str
    provider: str
    version: str
    capabilities: List[str] = field(default_factory=list)
    supported_tasks: List[str] = field(default_factory=list)
    cost_per_1k_tokens: Decimal = Decimal("0.002")
    max_tokens: int = 4096
    avg_latency_ms: int = 500
    success_rate: float = 0.99
    status: ModelStatus = ModelStatus.ACTIVE
    metadata: Dict[str, Any] = field(default_factory=dict)

    # Performance tracking
    total_requests: int = 0
    successful_requests: int = 0
    total_tokens: int = 0
    total_cost: Decimal = Decimal("0")
    avg_response_time: float = 0.0
    last_used: Optional[datetime] = None


@dataclass
class RoutingDecision:
    """AI model routing decision."""

    model_id: str
    provider: str
    confidence: float
    reasoning: str
    estimated_cost: Decimal
    estimated_latency: int
    fallback_models: List[str] = field(default_factory=list)
    experiment_id: Optional[str] = None


@dataclass
class Experiment:
    """A/B testing experiment configuration."""

    id: str
    name: str
    type: ExperimentType
    status: str = "active"
    variants: List[Dict[str, Any]] = field(default_factory=list)
    target_metric: str = "success_rate"
    start_date: datetime = field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    traffic_allocation: Dict[str, float] = field(default_factory=dict)
    results: Dict[str, Any] = field(default_factory=dict)

    # Statistical tracking
    total_requests: int = 0
    variant_performance: Dict[str, Dict[str, Any]] = field(
        default_factory=dict
    )


@dataclass
class OrchestrationMetrics:
    """Orchestration performance metrics."""

    total_requests: int = 0
    successful_requests: int = 0
    avg_response_time: float = 0.0
    total_cost: Decimal = Decimal("0")
    cache_hit_rate: float = 0.0
    experiment_participation_rate: float = 0.0
    model_distribution: Dict[str, int] = field(default_factory=dict)


class AIModelOrchestrationService:
    """AI Model Orchestration & Routing Service - Dynamic model selection and \
        A/B testing."""

    def __init__(self, db_session):
        self.db = db_session
        self.config = SaaSConfig()
        self.cost_optimizer = AICostOptimizationService(db_session)

        # Model registry
        self.model_registry: Dict[str, ModelProfile] = {}
        self._initialize_model_registry()

        # Experiment management
        self.active_experiments: Dict[str, Experiment] = {}
        self.experiment_results: Dict[str, Dict[str, Any]] = {}

        # Performance tracking
        self.metrics = OrchestrationMetrics()
        self.performance_history: List[Dict[str, Any]] = []

        # Routing configuration
        self.default_strategy = RoutingStrategy.BALANCED
        self.fallback_chain = ["gpt-3.5-turbo", "claude-3-haiku", "llama2"]

        # A/B testing
        self.experiment_traffic_percentage = (
            10.0  # 10% of traffic goes to experiments
        )

    def _initialize_model_registry(self):
        """Initialize the AI model registry with known models."""
        self.model_registry = {
            "gpt-3.5-turbo": ModelProfile(
                model_id="gpt-3.5-turbo",
                provider="openai",
                version="0613",
                capabilities=["text", "chat", "reasoning"],
                supported_tasks=[
                    "general",
                    "customer_service",
                    "content_generation",
                ],
                cost_per_1k_tokens=Decimal("0.002"),
                max_tokens=4096,
                avg_latency_ms=300,
                success_rate=0.99,
            ),
            "gpt-4": ModelProfile(
                model_id="gpt-4",
                provider="openai",
                version="0613",
                capabilities=[
                    "text",
                    "chat",
                    "complex_reasoning",
                    "analysis",
                    "code",
                ],
                supported_tasks=[
                    "complex_analysis",
                    "detailed_responses",
                    "code_generation",
                ],
                cost_per_1k_tokens=Decimal("0.03"),
                max_tokens=8192,
                avg_latency_ms=800,
                success_rate=0.98,
            ),
            "claude-3-haiku": ModelProfile(
                model_id="claude-3-haiku",
                provider="anthropic",
                version="20240307",
                capabilities=["text", "chat", "reasoning"],
                supported_tasks=["general", "analysis", "cost_sensitive"],
                cost_per_1k_tokens=Decimal("0.0015"),
                max_tokens=4096,
                avg_latency_ms=250,
                success_rate=0.99,
            ),
            "claude-3-sonnet": ModelProfile(
                model_id="claude-3-sonnet",
                provider="anthropic",
                version="20240229",
                capabilities=["text", "chat", "complex_reasoning", "analysis"],
                supported_tasks=[
                    "complex_analysis",
                    "creative_writing",
                    "detailed_responses",
                ],
                cost_per_1k_tokens=Decimal("0.015"),
                max_tokens=4096,
                avg_latency_ms=400,
                success_rate=0.98,
            ),
            "llama2": ModelProfile(
                model_id="llama2",
                provider="ollama",
                version="7b-chat",
                capabilities=["text", "chat"],
                supported_tasks=["general", "development", "offline"],
                cost_per_1k_tokens=Decimal("0.0"),
                max_tokens=4096,
                avg_latency_ms=400,
                success_rate=0.95,
            ),
        }

    async def route_request(
        self,
        tenant_id: UUID,
        request_data: Dict[str, Any],
        context: Dict[str, Any] = None,
    ) -> RoutingDecision:
        """Route AI request to the most appropriate model."""
        try:
            context = context or {}
            user_id = request_data.get("user_id")
            prompt = request_data.get("prompt", "")
            input_tokens = self._estimate_token_count(prompt)

            # Check if request should participate in experiment
            experiment_id = None
            if self._should_participate_in_experiment(user_id):
                experiment = await self._get_active_experiment_for_request(
                    request_data
                )
                if experiment:
                    experiment_id = experiment.id
                    return await self._route_to_experiment(
                        experiment, request_data, context
                    )

            # Use AI cost optimization for intelligent routing
            optimization_result = (
                await self.cost_optimizer.optimize_model_selection(
                    tenant_id=tenant_id,
                    input_tokens=input_tokens,
                    context=context,
                    strategy=self._map_routing_to_optimization_strategy(
                        context.get("routing_strategy")
                    ),
                )
            )

            recommended_model = optimization_result.recommended_model

            # Get model profile
            model_profile = self.model_registry.get(recommended_model)
            if not model_profile:
                # Fallback to default model
                recommended_model = "gpt-3.5-turbo"
                model_profile = self.model_registry[recommended_model]

            # Calculate estimated cost and latency
            estimated_cost = await self._calculate_request_cost(
                recommended_model, input_tokens, context
            )
            estimated_latency = model_profile.avg_latency_ms

            # Determine fallback models
            fallback_models = await self._get_fallback_models(
                recommended_model, context
            )

            # Generate reasoning
            reasoning = self._generate_routing_reasoning(
                recommended_model, optimization_result, context
            )

            decision = RoutingDecision(
                model_id=recommended_model,
                provider=model_profile.provider,
                confidence=optimization_result.confidence,
                reasoning=reasoning,
                estimated_cost=estimated_cost,
                estimated_latency=estimated_latency,
                fallback_models=fallback_models,
                experiment_id=experiment_id,
            )

            # Record routing decision for analytics
            await self._record_routing_decision(
                tenant_id, decision, request_data
            )

            return decision

        except Exception as e:
            logger.error(f"Request routing failed: {str(e)}")
            # Return safe fallback
            return RoutingDecision(
                model_id="gpt-3.5-turbo",
                provider="openai",
                confidence=0.5,
                reasoning="Fallback due to routing error",
                estimated_cost=Decimal("0.002"),
                estimated_latency=300,
                fallback_models=["claude-3-haiku"],
            )

    def _map_routing_to_optimization_strategy(
        self, routing_strategy: Optional[str]
    ) -> str:
        """Map routing strategy to cost optimization strategy."""
        strategy_mapping = {
            RoutingStrategy.COST_OPTIMIZED: "cost_optimized",
            RoutingStrategy.PERFORMANCE_OPTIMIZED: "performance_optimized",
            RoutingStrategy.RELIABILITY_FOCUSED: "reliability_focused",
            RoutingStrategy.BALANCED: "balanced",
        }
        return strategy_mapping.get(routing_strategy, "balanced")

    def _should_participate_in_experiment(
        self, user_id: Optional[str]
    ) -> bool:
        """Determine if request should participate in A/B testing."""
        if not user_id or not self.active_experiments:
            return False

        # Use consistent hashing for traffic allocation
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        traffic_percentage = (hash_value % 100) / 100.0

        return traffic_percentage < (
            self.experiment_traffic_percentage / 100.0
        )

    async def _get_active_experiment_for_request(
        self, request_data: Dict[str, Any]
    ) -> Optional[Experiment]:
        """Find active experiment that matches the request."""
        task_type = request_data.get("task_type", "general")
        request_data.get("complexity", "medium")

        for experiment in self.active_experiments.values():
            if experiment.status != "active":
                continue

            # Check if experiment applies to this request type
            if experiment.type == ExperimentType.MODEL_COMPARISON:
                # Model comparison experiments apply to all requests
                return experiment
            elif experiment.type == ExperimentType.PROMPT_OPTIMIZATION:
                if task_type in experiment.metadata.get(
                    "applicable_tasks", []
                ):
                    return experiment

        return None

    async def _route_to_experiment(
        self,
        experiment: Experiment,
        request_data: Dict[str, Any],
        context: Dict[str, Any],
    ) -> RoutingDecision:
        """Route request to experiment variant."""
        # Determine which variant to use
        user_id = request_data.get("user_id", "anonymous")
        variant = self._select_experiment_variant(experiment, user_id)

        variant_config = next(
            (v for v in experiment.variants if v["id"] == variant),
            experiment.variants[0],  # Fallback to first variant
        )

        model_id = variant_config.get("model_id", "gpt-3.5-turbo")
        model_profile = self.model_registry.get(model_id)

        if not model_profile:
            model_id = "gpt-3.5-turbo"
            model_profile = self.model_registry[model_id]

        return RoutingDecision(
            model_id=model_id,
            provider=model_profile.provider,
            confidence=0.8,
            reasoning=f"Experiment {experiment.id}: Testing {model_id}",
            estimated_cost=model_profile.cost_per_1k_tokens,
            estimated_latency=model_profile.avg_latency_ms,
            fallback_models=self.fallback_chain,
            experiment_id=experiment.id,
        )

    def _select_experiment_variant(
        self, experiment: Experiment, user_id: str
    ) -> str:
        """Select experiment variant using consistent hashing."""
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        variant_index = hash_value % len(experiment.variants)
        return experiment.variants[variant_index]["id"]

    async def create_experiment(
        self,
        name: str,
        experiment_type: ExperimentType,
        variants: List[Dict[str, Any]],
        target_metric: str = "success_rate",
        duration_days: int = 7,
    ) -> Experiment:
        """Create a new A/B testing experiment."""
        try:
            experiment_id = f"exp_{datetime.utcnow().timestamp()}_{random.randint(1000, 9999)}"

            # Equal traffic allocation by default
            traffic_allocation = {}
            equal_share = 1.0 / len(variants)
            for variant in variants:
                traffic_allocation[variant["id"]] = equal_share

            experiment = Experiment(
                id=experiment_id,
                name=name,
                type=experiment_type,
                variants=variants,
                target_metric=target_metric,
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=duration_days),
                traffic_allocation=traffic_allocation,
            )

            self.active_experiments[experiment_id] = experiment

            logger.info(f"Created experiment: {experiment_id}")
            return experiment

        except Exception as e:
            logger.error(f"Experiment creation failed: {str(e)}")
            raise

    async def record_experiment_result(
        self,
        experiment_id: str,
        variant_id: str,
        metrics: Dict[str, Any],
        success: bool,
    ) -> None:
        """Record experiment result for analysis."""
        try:
            if experiment_id not in self.active_experiments:
                return

            experiment = self.active_experiments[experiment_id]

            # Initialize variant tracking if needed
            if variant_id not in experiment.variant_performance:
                experiment.variant_performance[variant_id] = {
                    "requests": 0,
                    "successes": 0,
                    "total_cost": Decimal("0"),
                    "total_response_time": 0.0,
                    "metrics": {},
                }

            # Update variant performance
            variant_stats = experiment.variant_performance[variant_id]
            variant_stats["requests"] += 1
            variant_stats["successes"] += 1 if success else 0

            if "cost" in metrics:
                variant_stats["total_cost"] += Decimal(str(metrics["cost"]))
            if "response_time" in metrics:
                variant_stats["total_response_time"] += metrics[
                    "response_time"
                ]

            # Update experiment totals
            experiment.total_requests += 1

        except Exception as e:
            logger.error(f"Experiment result recording failed: {str(e)}")

    async def get_experiment_results(
        self, experiment_id: str
    ) -> Dict[str, Any]:
        """Get comprehensive experiment results and analysis."""
        try:
            if experiment_id not in self.active_experiments:
                return {"error": "Experiment not found"}

            experiment = self.active_experiments[experiment_id]

            results = {
                "experiment_id": experiment.id,
                "name": experiment.name,
                "type": experiment.type.value,
                "status": experiment.status,
                "total_requests": experiment.total_requests,
                "start_date": experiment.start_date.isoformat(),
                "end_date": (
                    experiment.end_date.isoformat()
                    if experiment.end_date
                    else None
                ),
                "variants": [],
            }

            # Analyze each variant
            for variant in experiment.variants:
                variant_id = variant["id"]
                if variant_id in experiment.variant_performance:
                    stats = experiment.variant_performance[variant_id]

                    success_rate = (
                        stats["successes"] / stats["requests"]
                        if stats["requests"] > 0
                        else 0
                    )
                    avg_cost = (
                        float(stats["total_cost"] / stats["requests"])
                        if stats["requests"] > 0
                        else 0
                    )
                    avg_response_time = (
                        stats["total_response_time"] / stats["requests"]
                        if stats["requests"] > 0
                        else 0
                    )

                    variant_result = {
                        "variant_id": variant_id,
                        "variant_config": variant,
                        "requests": stats["requests"],
                        "success_rate": success_rate,
                        "avg_cost": avg_cost,
                        "avg_response_time": avg_response_time,
                    }

                    results["variants"].append(variant_result)

            # Statistical analysis
            if len(results["variants"]) >= 2:
                results[
                    "statistical_analysis"
                ] = self._perform_statistical_analysis(results["variants"])

            return results

        except Exception as e:
            logger.error(f"Experiment results retrieval failed: {str(e)}")
            return {"error": str(e)}

    def _perform_statistical_analysis(
        self, variants: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform statistical analysis on experiment variants."""
        try:
            # Simple statistical comparison
            analysis = {
                "significant_difference": False,
                "best_performing_variant": None,
                "confidence_level": 0.0,
            }

            if len(variants) >= 2:
                # Find variant with highest success rate
                best_variant = max(variants, key=lambda v: v["success_rate"])
                analysis["best_performing_variant"] = best_variant[
                    "variant_id"
                ]

                # Calculate confidence (simplified)
                success_rates = [v["success_rate"] for v in variants]
                if len(set(success_rates)) > 1:  # Different success rates
                    analysis["significant_difference"] = True
                    analysis["confidence_level"] = 0.85  # Simplified

            return analysis

        except Exception as e:
            logger.error(f"Statistical analysis failed: {str(e)}")
            return {"error": str(e)}

    async def get_model_performance_metrics(
        self, model_id: str
    ) -> Dict[str, Any]:
        """Get comprehensive performance metrics for a model."""
        try:
            model_profile = self.model_registry.get(model_id)
            if not model_profile:
                return {"error": "Model not found"}

            metrics = {
                "model_id": model_id,
                "provider": model_profile.provider,
                "version": model_profile.version,
                "status": model_profile.status.value,
                "performance": {
                    "total_requests": model_profile.total_requests,
                    "successful_requests": model_profile.successful_requests,
                    "success_rate": (
                        (
                            model_profile.successful_requests
                            / model_profile.total_requests
                            * 100
                        )
                        if model_profile.total_requests > 0
                        else 0
                    ),
                    "avg_response_time": model_profile.avg_response_time,
                    "total_tokens": model_profile.total_tokens,
                    "total_cost": float(model_profile.total_cost),
                },
                "capabilities": model_profile.capabilities,
                "supported_tasks": model_profile.supported_tasks,
                "pricing": {
                    "cost_per_1k_tokens": float(
                        model_profile.cost_per_1k_tokens
                    ),
                    "max_tokens": model_profile.max_tokens,
                },
                "last_used": (
                    model_profile.last_used.isoformat()
                    if model_profile.last_used
                    else None
                ),
            }

            return metrics

        except Exception as e:
            logger.error(f"Model metrics retrieval failed: {str(e)}")
            return {"error": str(e)}

    async def update_model_performance(
        self,
        model_id: str,
        success: bool,
        response_time: float,
        tokens_used: int,
        cost: Decimal,
    ) -> None:
        """Update model performance metrics."""
        try:
            if model_id not in self.model_registry:
                return

            model_profile = self.model_registry[model_id]

            model_profile.total_requests += 1
            model_profile.successful_requests += 1 if success else 0
            model_profile.total_tokens += tokens_used
            model_profile.total_cost += cost
            model_profile.last_used = datetime.utcnow()

            # Update average response time
            if model_profile.total_requests == 1:
                model_profile.avg_response_time = response_time
            else:
                # Running average
                model_profile.avg_response_time = (
                    (
                        model_profile.avg_response_time
                        * (model_profile.total_requests - 1)
                    )
                    + response_time
                ) / model_profile.total_requests

            # Update success rate
            model_profile.success_rate = (
                model_profile.successful_requests
                / model_profile.total_requests
            )

        except Exception as e:
            logger.error(f"Model performance update failed: {str(e)}")

    async def get_routing_analytics(
        self, tenant_id: Optional[UUID] = None, days: int = 30
    ) -> Dict[str, Any]:
        """Get comprehensive routing analytics."""
        try:
            analytics = {
                "period_days": days,
                "overall_metrics": {
                    "total_requests": self.metrics.total_requests,
                    "successful_requests": self.metrics.successful_requests,
                    "success_rate": (
                        (
                            self.metrics.successful_requests
                            / self.metrics.total_requests
                            * 100
                        )
                        if self.metrics.total_requests > 0
                        else 0
                    ),
                    "avg_response_time": self.metrics.avg_response_time,
                    "total_cost": float(self.metrics.total_cost),
                    "cache_hit_rate": self.metrics.cache_hit_rate,
                    "experiment_participation_rate": self.metrics.experiment_participation_rate,
                },
                "model_distribution": self.metrics.model_distribution,
                "active_experiments": len(self.active_experiments),
                "model_performance": {},
            }

            # Get individual model performance
            for model_id in self.model_registry.keys():
                model_metrics = await self.get_model_performance_metrics(
                    model_id
                )
                if "error" not in model_metrics:
                    analytics["model_performance"][model_id] = model_metrics[
                        "performance"
                    ]

            return analytics

        except Exception as e:
            logger.error(f"Routing analytics retrieval failed: {str(e)}")
            return {"error": str(e)}

    def _estimate_token_count(self, text: str) -> int:
        """Estimate token count for text (simplified)."""
        # Rough estimation: ~4 characters per token for English text
        return len(text) // 4

    async def _calculate_request_cost(
        self, model_id: str, input_tokens: int, context: Dict[str, Any]
    ) -> Decimal:
        """Calculate estimated cost for request."""
        model_profile = self.model_registry.get(model_id)
        if not model_profile:
            return Decimal("0")

        # Estimate output tokens
        output_tokens = min(input_tokens * 2, model_profile.max_tokens // 2)
        total_tokens = input_tokens + output_tokens

        cost = (
            Decimal(total_tokens) / Decimal(1000)
        ) * model_profile.cost_per_1k_tokens
        return cost.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    async def _get_fallback_models(
        self, primary_model: str, context: Dict[str, Any]
    ) -> List[str]:
        """Get fallback models for request."""
        return self.fallback_chain

    def _generate_routing_reasoning(
        self, model_id: str, optimization_result: Any, context: Dict[str, Any]
    ) -> str:
        """Generate reasoning for routing decision."""
        reasoning_parts = [f"Selected {model_id}"]

        if hasattr(optimization_result, "reasoning"):
            reasoning_parts.append(optimization_result.reasoning)

        if context.get("priority") == "high":
            reasoning_parts.append("for high priority request")

        if context.get("cost_sensitive"):
            reasoning_parts.append("optimizing for cost")

        return ". ".join(reasoning_parts)

    async def _record_routing_decision(
        self,
        tenant_id: UUID,
        decision: RoutingDecision,
        request_data: Dict[str, Any],
    ) -> None:
        """Record routing decision for analytics."""
        try:
            # Update metrics
            self.metrics.total_requests += 1
            if decision.model_id not in self.metrics.model_distribution:
                self.metrics.model_distribution[decision.model_id] = 0
            self.metrics.model_distribution[decision.model_id] += 1

            # Store decision for performance analysis
            decision_record = {
                "tenant_id": str(tenant_id),
                "model_id": decision.model_id,
                "confidence": decision.confidence,
                "estimated_cost": float(decision.estimated_cost),
                "experiment_id": decision.experiment_id,
                "timestamp": datetime.utcnow().isoformat(),
            }

            self.performance_history.append(decision_record)

            # Keep only recent history
            if len(self.performance_history) > 10000:
                self.performance_history = self.performance_history[-5000:]

        except Exception as e:
            logger.error(f"Routing decision recording failed: {str(e)}")

    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on orchestration service."""
        try:
            health_status = {
                "status": "healthy",
                "models_registered": len(self.model_registry),
                "active_models": len(
                    [
                        m
                        for m in self.model_registry.values()
                        if m.status == ModelStatus.ACTIVE
                    ]
                ),
                "active_experiments": len(self.active_experiments),
                "total_requests": self.metrics.total_requests,
                "success_rate": (
                    (
                        self.metrics.successful_requests
                        / self.metrics.total_requests
                        * 100
                    )
                    if self.metrics.total_requests > 0
                    else 0
                ),
            }

            # Check if we have at least one active model
            if health_status["active_models"] == 0:
                health_status["status"] = "unhealthy"
                health_status["error"] = "No active models available"

            return health_status

        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
