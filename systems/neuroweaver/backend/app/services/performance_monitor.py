"""
NeuroWeaver Performance Monitor Service
Tracks model accuracy, latency, and triggers automatic switching
"""

import asyncio
import logging
import json
import hashlib
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class PerformanceThresholds:
    min_accuracy: float = 0.85
    max_latency_ms: int = 2000
    min_throughput_rps: float = 10.0
    max_cost_per_request: float = 0.01

@dataclass
class ModelMetrics:
    accuracy_score: float
    latency_ms: int
    throughput_rps: float
    cost_per_request: float
    timestamp: datetime

class PerformanceMonitor:
    def __init__(self):
        self.thresholds: Dict[str, PerformanceThresholds] = {}
        self.monitoring_active = False
        
    async def track_model_performance(self, model_id: str, metrics: ModelMetrics) -> None:
        """Record performance metrics for a model"""
        # Evaluate performance
        health_status = await self._evaluate_model_health(model_id, metrics)
        
        # Check for degradation
        if health_status['needs_switch']:
            await self._trigger_model_switch(model_id, health_status['reason'])
            
    async def _evaluate_model_health(self, model_id: str, current_metrics: ModelMetrics) -> Dict:
        """Evaluate if model performance is healthy"""
        thresholds = self.thresholds.get(model_id, PerformanceThresholds())
        
        issues = []
        needs_switch = False
        
        # Check thresholds
        if current_metrics.accuracy_score < thresholds.min_accuracy:
            issues.append(f"Accuracy {current_metrics.accuracy_score:.3f} below threshold")
            needs_switch = True
            
        if current_metrics.latency_ms > thresholds.max_latency_ms:
            issues.append(f"Latency {current_metrics.latency_ms}ms above threshold")
            needs_switch = True
            
        # Calculate performance score
        performance_score = min(current_metrics.accuracy_score / thresholds.min_accuracy, 1.0)
        
        return {
            'performance_score': performance_score,
            'needs_switch': needs_switch,
            'reason': '; '.join(issues) if issues else 'Healthy',
            'status': 'degraded' if needs_switch else 'healthy'
        }
        
    async def _trigger_model_switch(self, model_id: str, reason: str) -> None:
        """Trigger automatic model switch due to performance degradation"""
        backup_model = self._get_backup_model(model_id)
        
        if backup_model:
            logger.warning(f"Triggered model switch: {model_id} -> {backup_model} ({reason})")
            # Send switch request to RelayCore
            await self._notify_relaycore_switch(model_id, backup_model, reason)
        else:
            logger.critical(f"No backup model available for {model_id}: {reason}")
            
    def _get_backup_model(self, failing_model: str) -> Optional[str]:
        """Get backup model for failing model"""
        backup_models = {
            'automotive-sales-v1': 'gpt-4-turbo',
            'service-advisor-v1': 'gpt-3.5-turbo',
            'parts-specialist-v1': 'gpt-3.5-turbo'
        }
        return backup_models.get(failing_model)
        
    async def _notify_relaycore_switch(self, current_model: str, target_model: str, reason: str):
        """Notify RelayCore of model switch"""
        # Placeholder for RelayCore notification
        logger.info(f"Notifying RelayCore: switch {current_model} -> {target_model}")
        
    def set_performance_thresholds(self, model_id: str, thresholds: PerformanceThresholds):
        """Set performance thresholds for a model"""
        self.thresholds[model_id] = thresholds


class ABTestStatus(Enum):
    """A/B test status enumeration"""
    CREATED = "created"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class ABTestVariant:
    """A/B test variant configuration"""
    model_id: str
    weight: float  # Traffic allocation weight (0-1)
    name: str
    description: str = ""


@dataclass
class ABTestConfiguration:
    """A/B test configuration"""
    test_id: str
    name: str
    description: str
    variants: List[ABTestVariant]
    traffic_split: Dict[str, float]  # model_id -> weight
    start_time: datetime
    end_time: Optional[datetime] = None
    status: ABTestStatus = ABTestStatus.CREATED
    created_by: str = ""
    target_metric: str = "accuracy"  # accuracy, latency, throughput, cost
    minimum_sample_size: int = 1000
    confidence_level: float = 0.95
    statistical_significance_threshold: float = 0.05


@dataclass
class ABTestMetrics:
    """Metrics collected during A/B test"""
    variant: str
    requests: int
    successful_requests: int
    failed_requests: int
    total_latency_ms: int
    average_latency_ms: float
    accuracy_score: float
    cost_per_request: float
    timestamp: datetime


class ABTestEngine:
    """A/B testing engine for model comparison"""

    def __init__(self):
        self.active_tests: Dict[str, ABTestConfiguration] = {}
        self.test_metrics: Dict[str, List[ABTestMetrics]] = defaultdict(list)
        self.user_assignments: Dict[str, Dict[str, str]] = defaultdict(dict)  # user_id -> test_id -> variant

    async def create_ab_test(self, config: ABTestConfiguration) -> ABTestConfiguration:
        """Create a new A/B test"""
        try:
            # Validate configuration
            self._validate_test_config(config)

            # Store test configuration
            self.active_tests[config.test_id] = config

            logger.info(f"Created A/B test {config.test_id}: {config.name}")
            return config

        except Exception as e:
            logger.error(f"Failed to create A/B test {config.test_id}: {e}")
            raise

    def _validate_test_config(self, config: ABTestConfiguration) -> None:
        """Validate A/B test configuration"""
        if not config.variants:
            raise ValueError("Test must have at least one variant")

        if not config.traffic_split:
            raise ValueError("Traffic split configuration is required")

        # Check traffic split adds up to 1.0
        total_weight = sum(config.traffic_split.values())
        if abs(total_weight - 1.0) > 0.01:  # Allow small floating point errors
            raise ValueError(f"Traffic split weights must sum to 1.0, got {total_weight}")

        # Check variant weights match traffic split
        for variant in config.variants:
            if variant.model_id not in config.traffic_split:
                raise ValueError(f"Variant {variant.model_id} not found in traffic split")

            if abs(variant.weight - config.traffic_split[variant.model_id]) > 0.01:
                raise ValueError(f"Variant weight mismatch for {variant.model_id}")

    async def start_ab_test(self, test_id: str) -> bool:
        """Start an A/B test"""
        try:
            if test_id not in self.active_tests:
                raise ValueError(f"A/B test {test_id} not found")

            test = self.active_tests[test_id]
            if test.status != ABTestStatus.CREATED:
                raise ValueError(f"Test {test_id} is not in created state")

            test.status = ABTestStatus.RUNNING
            test.start_time = datetime.utcnow()

            logger.info(f"Started A/B test {test_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to start A/B test {test_id}: {e}")
            return False

    async def pause_ab_test(self, test_id: str) -> bool:
        """Pause an A/B test"""
        try:
            if test_id not in self.active_tests:
                raise ValueError(f"A/B test {test_id} not found")

            test = self.active_tests[test_id]
            if test.status != ABTestStatus.RUNNING:
                raise ValueError(f"Test {test_id} is not running")

            test.status = ABTestStatus.PAUSED

            logger.info(f"Paused A/B test {test_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to pause A/B test {test_id}: {e}")
            return False

    async def stop_ab_test(self, test_id: str) -> bool:
        """Stop an A/B test"""
        try:
            if test_id not in self.active_tests:
                raise ValueError(f"A/B test {test_id} not found")

            test = self.active_tests[test_id]
            if test.status not in [ABTestStatus.RUNNING, ABTestStatus.PAUSED]:
                raise ValueError(f"Test {test_id} cannot be stopped")

            test.status = ABTestStatus.COMPLETED
            test.end_time = datetime.utcnow()

            logger.info(f"Stopped A/B test {test_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to stop A/B test {test_id}: {e}")
            return False

    def assign_user_to_variant(self, user_id: str, test_id: str) -> Optional[str]:
        """Assign a user to a test variant"""
        try:
            if test_id not in self.active_tests:
                return None

            test = self.active_tests[test_id]
            if test.status != ABTestStatus.RUNNING:
                return None

            # Check if user already assigned
            if user_id in self.user_assignments and test_id in self.user_assignments[user_id]:
                return self.user_assignments[user_id][test_id]

            # Assign based on consistent hashing for reproducibility
            variant = self._consistent_hash_assignment(user_id, test.traffic_split)
            self.user_assignments[user_id][test_id] = variant

            return variant

        except Exception as e:
            logger.error(f"Error assigning user {user_id} to test {test_id}: {e}")
            return None

    def _consistent_hash_assignment(self, user_id: str, traffic_split: Dict[str, float]) -> str:
        """Assign user to variant using consistent hashing"""
        try:
            # Create hash of user_id
            hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)

            # Normalize to 0-1 range
            normalized_value = (hash_value % 10000) / 10000.0

            # Find variant based on cumulative weights
            cumulative_weight = 0.0
            for model_id, weight in traffic_split.items():
                cumulative_weight += weight
                if normalized_value <= cumulative_weight:
                    return model_id

            # Fallback to first variant
            return list(traffic_split.keys())[0]

        except Exception as e:
            logger.error(f"Error in consistent hash assignment: {e}")
            return list(traffic_split.keys())[0]

    async def record_test_metrics(self, test_id: str, variant: str, metrics: Dict[str, Any]) -> None:
        """Record metrics for an A/B test variant"""
        try:
            if test_id not in self.active_tests:
                return

            test_metrics = ABTestMetrics(
                variant=variant,
                requests=metrics.get('requests', 0),
                successful_requests=metrics.get('successful_requests', 0),
                failed_requests=metrics.get('failed_requests', 0),
                total_latency_ms=metrics.get('total_latency_ms', 0),
                average_latency_ms=metrics.get('average_latency_ms', 0.0),
                accuracy_score=metrics.get('accuracy_score', 0.0),
                cost_per_request=metrics.get('cost_per_request', 0.0),
                timestamp=datetime.utcnow()
            )

            self.test_metrics[test_id].append(test_metrics)

            # Clean old metrics to prevent memory issues
            await self._cleanup_old_metrics(test_id)

        except Exception as e:
            logger.error(f"Error recording test metrics for {test_id}: {e}")

    async def _cleanup_old_metrics(self, test_id: str, max_age_days: int = 30) -> None:
        """Clean up old test metrics"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(days=max_age_days)

            if test_id in self.test_metrics:
                self.test_metrics[test_id] = [
                    m for m in self.test_metrics[test_id]
                    if m.timestamp > cutoff_time
                ]

        except Exception as e:
            logger.error(f"Error cleaning up metrics for {test_id}: {e}")

    async def analyze_ab_test(self, test_id: str) -> Dict[str, Any]:
        """Analyze A/B test results and determine winner"""
        try:
            if test_id not in self.active_tests:
                raise ValueError(f"A/B test {test_id} not found")

            test = self.active_tests[test_id]
            if test.status not in [ABTestStatus.RUNNING, ABTestStatus.COMPLETED]:
                raise ValueError(f"Test {test_id} is not in analyzable state")

            # Get metrics for each variant
            variant_metrics = await self._aggregate_variant_metrics(test_id)

            if len(variant_metrics) < 2:
                return {
                    "status": "insufficient_data",
                    "message": "Need at least 2 variants with metrics to analyze",
                    "variants": variant_metrics
                }

            # Perform statistical analysis
            analysis_result = await self._perform_statistical_analysis(
                variant_metrics,
                test.target_metric,
                test.minimum_sample_size
            )

            return {
                "test_id": test_id,
                "test_name": test.name,
                "status": test.status.value,
                "analysis": analysis_result,
                "variants": variant_metrics,
                "recommendation": self._generate_test_recommendation(analysis_result, test)
            }

        except Exception as e:
            logger.error(f"Error analyzing A/B test {test_id}: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    async def _aggregate_variant_metrics(self, test_id: str) -> Dict[str, Dict[str, Any]]:
        """Aggregate metrics for each variant"""
        try:
            if test_id not in self.test_metrics:
                return {}

            metrics_list = self.test_metrics[test_id]
            variant_aggregates = {}

            for metrics in metrics_list:
                if metrics.variant not in variant_aggregates:
                    variant_aggregates[metrics.variant] = {
                        "total_requests": 0,
                        "total_successful": 0,
                        "total_latency": 0,
                        "accuracy_sum": 0.0,
                        "cost_sum": 0.0,
                        "data_points": 0
                    }

                agg = variant_aggregates[metrics.variant]
                agg["total_requests"] += metrics.requests
                agg["total_successful"] += metrics.successful_requests
                agg["total_latency"] += metrics.total_latency_ms
                agg["accuracy_sum"] += metrics.accuracy_score * metrics.requests
                agg["cost_sum"] += metrics.cost_per_request * metrics.requests
                agg["data_points"] += 1

            # Calculate averages
            for variant, agg in variant_aggregates.items():
                if agg["total_requests"] > 0:
                    agg["average_accuracy"] = agg["accuracy_sum"] / agg["total_requests"]
                    agg["average_cost"] = agg["cost_sum"] / agg["total_requests"]
                    agg["success_rate"] = agg["total_successful"] / agg["total_requests"]
                if agg["data_points"] > 0:
                    agg["average_latency"] = agg["total_latency"] / agg["data_points"]

            return variant_aggregates

        except Exception as e:
            logger.error(f"Error aggregating variant metrics for {test_id}: {e}")
            return {}

    async def _perform_statistical_analysis(
        self,
        variant_metrics: Dict[str, Dict[str, Any]],
        target_metric: str,
        min_sample_size: int
    ) -> Dict[str, Any]:
        """Perform statistical analysis on A/B test results"""
        try:
            analysis = {
                "target_metric": target_metric,
                "has_sufficient_data": True,
                "variants_analyzed": len(variant_metrics),
                "sample_sizes": {},
                "metric_values": {},
                "statistical_significance": False,
                "winner": None,
                "confidence_level": 0.0
            }

            # Check sample sizes
            for variant, metrics in variant_metrics.items():
                sample_size = metrics.get("total_requests", 0)
                analysis["sample_sizes"][variant] = sample_size

                if sample_size < min_sample_size:
                    analysis["has_sufficient_data"] = False

                # Extract target metric value
                if target_metric == "accuracy":
                    analysis["metric_values"][variant] = metrics.get("average_accuracy", 0.0)
                elif target_metric == "latency":
                    analysis["metric_values"][variant] = metrics.get("average_latency", 0.0)
                elif target_metric == "cost":
                    analysis["metric_values"][variant] = metrics.get("average_cost", 0.0)
                else:
                    analysis["metric_values"][variant] = 0.0

            # Simple statistical significance test (z-test approximation)
            if analysis["has_sufficient_data"] and len(variant_metrics) == 2:
                variants = list(variant_metrics.keys())
                values = [analysis["metric_values"][v] for v in variants]

                # Calculate improvement
                baseline_value = values[0]
                challenger_value = values[1]

                if baseline_value > 0:
                    improvement = (challenger_value - baseline_value) / baseline_value
                    analysis["improvement_percentage"] = improvement * 100

                    # Determine if statistically significant (simplified)
                    # In production, use proper statistical tests
                    if abs(improvement) > 0.05:  # 5% improvement threshold
                        analysis["statistical_significance"] = True
                        analysis["confidence_level"] = 0.95

                        if improvement > 0:
                            analysis["winner"] = variants[1]  # Challenger wins
                        else:
                            analysis["winner"] = variants[0]  # Baseline wins

            return analysis

        except Exception as e:
            logger.error(f"Error in statistical analysis: {e}")
            return {"error": str(e)}

    def _generate_test_recommendation(self, analysis: Dict[str, Any], test: ABTestConfiguration) -> str:
        """Generate recommendation based on analysis results"""
        try:
            if not analysis.get("has_sufficient_data", False):
                return "Continue running test - insufficient data collected"

            if analysis.get("statistical_significance", False):
                winner = analysis.get("winner")
                if winner:
                    improvement = analysis.get("improvement_percentage", 0)
                    return ".1f"
                else:
                    return "No clear winner - consider running test longer or checking for issues"
            else:
                return "No statistically significant difference - consider running test longer"

        except Exception as e:
            logger.error(f"Error generating recommendation: {e}")
            return "Unable to generate recommendation due to analysis error"

    async def list_active_tests(self) -> List[ABTestConfiguration]:
        """List all active A/B tests"""
        return [
            test for test in self.active_tests.values()
            if test.status in [ABTestStatus.RUNNING, ABTestStatus.PAUSED]
        ]

    async def get_test_results(self, test_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed results for an A/B test"""
        try:
            if test_id not in self.active_tests:
                return None

            test = self.active_tests[test_id]
            analysis = await self.analyze_ab_test(test_id)

            return {
                "test": {
                    "id": test.test_id,
                    "name": test.name,
                    "description": test.description,
                    "status": test.status.value,
                    "start_time": test.start_time.isoformat(),
                    "end_time": test.end_time.isoformat() if test.end_time else None,
                    "target_metric": test.target_metric
                },
                "analysis": analysis
            }

        except Exception as e:
            logger.error(f"Error getting test results for {test_id}: {e}")
            return None
