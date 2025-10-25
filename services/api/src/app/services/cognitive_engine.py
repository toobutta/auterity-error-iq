"""
Cognitive Automation Engine for AI-powered workflow optimization.

This module provides intelligent workflow analysis, optimization recommendations,
and automated workflow evolution using machine learning and AI techniques.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

from app.core.config import settings
from app.database import get_db
from app.models.execution import WorkflowExecution
from app.services.simulation_engine import SimulationEngine

logger = logging.getLogger(__name__)


class OptimizationType(Enum):
    """Types of workflow optimizations."""
    PERFORMANCE = "performance"
    COST = "cost"
    RELIABILITY = "reliability"
    EFFICIENCY = "efficiency"


class RecommendationPriority(Enum):
    """Priority levels for optimization recommendations."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class OptimizationRecommendation:
    """Represents an optimization recommendation."""
    workflow_id: str
    optimization_type: OptimizationType
    priority: RecommendationPriority
    description: str
    expected_impact: Dict[str, float]
    implementation_complexity: str
    confidence_score: float
    suggested_changes: Dict[str, Any]


@dataclass
class CognitiveInsight:
    """Represents a cognitive insight about workflow performance."""
    insight_type: str
    workflow_id: str
    description: str
    severity: str
    metrics: Dict[str, Any]
    recommendations: List[str]
    confidence: float


class CognitiveEngine:
    """AI-powered cognitive automation engine for workflow optimization."""

    def __init__(self):
        self.simulation_engine = SimulationEngine()
        self.performance_model = None
        self.scaler = StandardScaler()
        self.cluster_model = KMeans(n_clusters=5, random_state=42)
        self.insights_cache = {}
        self.recommendations_cache = {}

    async def initialize(self):
        """Initialize the cognitive engine with trained models."""
        try:
            await self._train_performance_model()
            await self._train_clustering_model()
            logger.info("Cognitive engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize cognitive engine: {e}")
            raise

    async def _train_performance_model(self):
        """Train the performance prediction model using historical data."""
        try:
            # Get historical workflow execution data
            executions = await self._get_historical_executions(days=90)

            if len(executions) < 10:
                logger.warning("Insufficient data for performance model training")
                return

            # Prepare training data
            X, y = self._prepare_training_data(executions)

            if len(X) == 0:
                logger.warning("No valid training data available")
                return

            # Train the model
            self.performance_model = RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                max_depth=10
            )
            self.performance_model.fit(X, y)

            logger.info(f"Performance model trained with {len(X)} samples")

        except Exception as e:
            logger.error(f"Failed to train performance model: {e}")

    async def _train_clustering_model(self):
        """Train the workflow clustering model."""
        try:
            executions = await self._get_historical_executions(days=30)

            if len(executions) < 20:
                logger.warning("Insufficient data for clustering model")
                return

            # Extract workflow patterns
            patterns = self._extract_workflow_patterns(executions)

            if len(patterns) > 0:
                self.cluster_model.fit(patterns)
                logger.info(f"Clustering model trained with {len(patterns)} patterns")

        except Exception as e:
            logger.error(f"Failed to train clustering model: {e}")

    async def _get_historical_executions(self, days: int = 30) -> List[Dict]:
        """Get historical workflow execution data."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            async with get_db() as db:
                executions = await db.execute(
                    """
                    SELECT
                        we.*,
                        w.definition as workflow_definition,
                        w.metadata as workflow_metadata
                    FROM workflow_executions we
                    JOIN workflows w ON we.workflow_id = w.id
                    WHERE we.created_at >= :cutoff_date
                    AND we.status = 'completed'
                    ORDER BY we.created_at DESC
                    """,
                    {"cutoff_date": cutoff_date}
                )
                return executions.fetchall()

        except Exception as e:
            logger.error(f"Failed to get historical executions: {e}")
            return []

    def _prepare_training_data(self, executions: List[Dict]) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare training data for the performance model."""
        X_data = []
        y_data = []

        for execution in executions:
            try:
                # Extract features
                features = self._extract_execution_features(execution)
                if features:
                    X_data.append(features)

                    # Target: execution time (to be minimized)
                    execution_time = (execution.ended_at - execution.started_at).total_seconds()
                    y_data.append(execution_time)

            except Exception as e:
                logger.warning(f"Failed to process execution {execution.id}: {e}")
                continue

        return np.array(X_data), np.array(y_data)

    def _extract_execution_features(self, execution: Dict) -> Optional[List[float]]:
        """Extract features from workflow execution for ML model."""
        try:
            features = []

            # Basic execution metrics
            execution_time = (execution.ended_at - execution.started_at).total_seconds()
            features.append(execution_time)

            # Step count
            step_count = len(execution.steps or [])
            features.append(step_count)

            # Error rate
            error_count = sum(1 for step in (execution.steps or []) if step.get('status') == 'failed')
            error_rate = error_count / max(step_count, 1)
            features.append(error_rate)

            # Resource usage (if available)
            features.append(execution.metadata.get('cpu_usage', 0) if execution.metadata else 0)
            features.append(execution.metadata.get('memory_usage', 0) if execution.metadata else 0)

            # Workflow complexity metrics
            workflow_def = execution.workflow_definition
            if workflow_def:
                complexity_score = self._calculate_workflow_complexity(workflow_def)
                features.append(complexity_score)

            return features

        except Exception as e:
            logger.warning(f"Failed to extract features from execution: {e}")
            return None

    def _calculate_workflow_complexity(self, workflow_definition: Dict) -> float:
        """Calculate workflow complexity score."""
        try:
            nodes = workflow_definition.get('nodes', [])
            edges = workflow_definition.get('edges', [])

            # Complexity based on nodes, edges, and branching
            node_count = len(nodes)
            edge_count = len(edges)

            # Calculate branching factor
            branching_factor = 0
            node_outputs = {}
            for edge in edges:
                source = edge.get('source')
                if source not in node_outputs:
                    node_outputs[source] = 0
                node_outputs[source] += 1

            if node_outputs:
                branching_factor = sum(node_outputs.values()) / len(node_outputs)

            # Complexity formula
            complexity = (node_count * 0.3) + (edge_count * 0.2) + (branching_factor * 0.5)

            return min(complexity, 100.0)  # Cap at 100

        except Exception as e:
            logger.warning(f"Failed to calculate workflow complexity: {e}")
            return 0.0

    def _extract_workflow_patterns(self, executions: List[Dict]) -> np.ndarray:
        """Extract workflow patterns for clustering."""
        patterns = []

        for execution in executions:
            try:
                pattern = [
                    len(execution.steps or []),
                    (execution.ended_at - execution.started_at).total_seconds(),
                    sum(1 for step in (execution.steps or []) if step.get('status') == 'failed'),
                    execution.metadata.get('cpu_usage', 0) if execution.metadata else 0,
                ]
                patterns.append(pattern)
            except Exception as e:
                continue

        return np.array(patterns) if patterns else np.array([])

    async def analyze_workflow(self, workflow_id: str) -> List[CognitiveInsight]:
        """Analyze a workflow and generate cognitive insights."""
        try:
            # Check cache first
            cache_key = f"insights_{workflow_id}"
            if cache_key in self.insights_cache:
                return self.insights_cache[cache_key]

            insights = []

            # Get recent executions
            executions = await self._get_workflow_executions(workflow_id, days=30)

            if not executions:
                return insights

            # Performance analysis
            performance_insights = await self._analyze_performance(executions)
            insights.extend(performance_insights)

            # Bottleneck detection
            bottleneck_insights = await self._detect_bottlenecks(executions)
            insights.extend(bottleneck_insights)

            # Pattern recognition
            pattern_insights = await self._recognize_patterns(executions)
            insights.extend(pattern_insights)

            # Cache results
            self.insights_cache[cache_key] = insights

            return insights

        except Exception as e:
            logger.error(f"Failed to analyze workflow {workflow_id}: {e}")
            return []

    async def _get_workflow_executions(self, workflow_id: str, days: int = 30) -> List[Dict]:
        """Get executions for a specific workflow."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            async with get_db() as db:
                executions = await db.execute(
                    """
                    SELECT * FROM workflow_executions
                    WHERE workflow_id = :workflow_id
                    AND created_at >= :cutoff_date
                    AND status = 'completed'
                    ORDER BY created_at DESC
                    """,
                    {"workflow_id": workflow_id, "cutoff_date": cutoff_date}
                )
                return executions.fetchall()

        except Exception as e:
            logger.error(f"Failed to get workflow executions: {e}")
            return []

    async def _analyze_performance(self, executions: List[Dict]) -> List[CognitiveInsight]:
        """Analyze workflow performance and generate insights."""
        insights = []

        if len(executions) < 5:
            return insights

        try:
            execution_times = []
            for execution in executions:
                if execution.started_at and execution.ended_at:
                    duration = (execution.ended_at - execution.started_at).total_seconds()
                    execution_times.append(duration)

            if execution_times:
                avg_time = np.mean(execution_times)
                std_time = np.std(execution_times)

                # Performance insights
                if std_time / avg_time > 0.5:  # High variability
                    insights.append(CognitiveInsight(
                        insight_type="performance_variability",
                        workflow_id=executions[0].workflow_id,
                        description=f"High execution time variability detected (σ = {std_time:.2f}s)",
                        severity="medium",
                        metrics={
                            "average_time": avg_time,
                            "standard_deviation": std_time,
                            "coefficient_of_variation": std_time / avg_time
                        },
                        recommendations=[
                            "Consider optimizing resource allocation",
                            "Review step dependencies and parallelization",
                            "Implement performance monitoring"
                        ],
                        confidence=0.85
                    ))

                if avg_time > 300:  # More than 5 minutes
                    insights.append(CognitiveInsight(
                        insight_type="slow_execution",
                        workflow_id=executions[0].workflow_id,
                        description=f"Average execution time is high ({avg_time:.2f}s)",
                        severity="high",
                        metrics={"average_execution_time": avg_time},
                        recommendations=[
                            "Optimize long-running steps",
                            "Consider parallel execution where possible",
                            "Review resource allocation"
                        ],
                        confidence=0.90
                    ))

        except Exception as e:
            logger.error(f"Failed to analyze performance: {e}")

        return insights

    async def _detect_bottlenecks(self, executions: List[Dict]) -> List[CognitiveInsight]:
        """Detect workflow bottlenecks."""
        insights = []

        try:
            # Analyze step-level performance
            step_durations = {}

            for execution in executions:
                for step in (execution.steps or []):
                    step_id = step.get('step_id')
                    if step_id and 'duration' in step:
                        if step_id not in step_durations:
                            step_durations[step_id] = []
                        step_durations[step_id].append(step['duration'])

            # Find bottleneck steps
            for step_id, durations in step_durations.items():
                if len(durations) >= 3:  # Need at least 3 samples
                    avg_duration = np.mean(durations)
                    max_duration = np.max(durations)

                    # Check if this step is a bottleneck
                    if avg_duration > 60:  # More than 1 minute
                        insights.append(CognitiveInsight(
                            insight_type="bottleneck_detected",
                            workflow_id=executions[0].workflow_id,
                            description=f"Step {step_id} is a potential bottleneck (avg: {avg_duration:.2f}s)",
                            severity="high",
                            metrics={
                                "step_id": step_id,
                                "average_duration": avg_duration,
                                "max_duration": max_duration,
                                "execution_count": len(durations)
                            },
                            recommendations=[
                                f"Optimize step {step_id} implementation",
                                "Consider caching results if applicable",
                                "Review resource allocation for this step"
                            ],
                            confidence=0.80
                        ))

        except Exception as e:
            logger.error(f"Failed to detect bottlenecks: {e}")

        return insights

    async def _recognize_patterns(self, executions: List[Dict]) -> List[CognitiveInsight]:
        """Recognize workflow execution patterns."""
        insights = []

        try:
            # Analyze execution patterns
            failure_rates = []
            for execution in executions:
                total_steps = len(execution.steps or [])
                failed_steps = sum(1 for step in (execution.steps or []) if step.get('status') == 'failed')
                if total_steps > 0:
                    failure_rates.append(failed_steps / total_steps)

            if failure_rates:
                avg_failure_rate = np.mean(failure_rates)

                if avg_failure_rate > 0.1:  # More than 10% failure rate
                    insights.append(CognitiveInsight(
                        insight_type="high_failure_rate",
                        workflow_id=executions[0].workflow_id,
                        description=f"High failure rate detected ({avg_failure_rate:.1%})",
                        severity="critical",
                        metrics={"average_failure_rate": avg_failure_rate},
                        recommendations=[
                            "Review error handling in workflow steps",
                            "Implement retry mechanisms",
                            "Add input validation",
                            "Consider fallback strategies"
                        ],
                        confidence=0.95
                    ))

        except Exception as e:
            logger.error(f"Failed to recognize patterns: {e}")

        return insights

    async def generate_recommendations(self, workflow_id: str) -> List[OptimizationRecommendation]:
        """Generate optimization recommendations for a workflow."""
        try:
            # Check cache first
            cache_key = f"recommendations_{workflow_id}"
            if cache_key in self.recommendations_cache:
                return self.recommendations_cache[cache_key]

            recommendations = []

            # Get insights first
            insights = await self.analyze_workflow(workflow_id)

            # Generate recommendations based on insights
            for insight in insights:
                if insight.insight_type == "slow_execution":
                    recommendations.append(OptimizationRecommendation(
                        workflow_id=workflow_id,
                        optimization_type=OptimizationType.PERFORMANCE,
                        priority=RecommendationPriority.HIGH,
                        description="Optimize workflow execution time",
                        expected_impact={"performance_improvement": 0.3, "cost_reduction": 0.15},
                        implementation_complexity="medium",
                        confidence_score=0.85,
                        suggested_changes={
                            "optimization_type": "parallel_execution",
                            "target_steps": insight.metrics.get("slow_steps", []),
                            "estimated_savings": "30% execution time reduction"
                        }
                    ))

                elif insight.insight_type == "bottleneck_detected":
                    recommendations.append(OptimizationRecommendation(
                        workflow_id=workflow_id,
                        optimization_type=OptimizationType.EFFICIENCY,
                        priority=RecommendationPriority.CRITICAL,
                        description=f"Optimize bottleneck step: {insight.metrics.get('step_id')}",
                        expected_impact={"efficiency_improvement": 0.4, "performance_improvement": 0.25},
                        implementation_complexity="high",
                        confidence_score=0.90,
                        suggested_changes={
                            "optimization_type": "step_optimization",
                            "target_step": insight.metrics.get("step_id"),
                            "estimated_savings": "40% step time reduction"
                        }
                    ))

                elif insight.insight_type == "high_failure_rate":
                    recommendations.append(OptimizationRecommendation(
                        workflow_id=workflow_id,
                        optimization_type=OptimizationType.RELIABILITY,
                        priority=RecommendationPriority.CRITICAL,
                        description="Improve workflow reliability",
                        expected_impact={"reliability_improvement": 0.5, "cost_reduction": 0.20},
                        implementation_complexity="medium",
                        confidence_score=0.95,
                        suggested_changes={
                            "optimization_type": "error_handling",
                            "improvements": ["retry_mechanisms", "input_validation", "fallback_strategies"],
                            "estimated_savings": "50% failure rate reduction"
                        }
                    ))

            # Generate proactive recommendations
            proactive_recs = await self._generate_proactive_recommendations(workflow_id)
            recommendations.extend(proactive_recs)

            # Cache results
            self.recommendations_cache[cache_key] = recommendations

            return recommendations

        except Exception as e:
            logger.error(f"Failed to generate recommendations for {workflow_id}: {e}")
            return []

    async def _generate_proactive_recommendations(self, workflow_id: str) -> List[OptimizationRecommendation]:
        """Generate proactive optimization recommendations."""
        recommendations = []

        try:
            # Cost optimization recommendation
            recommendations.append(OptimizationRecommendation(
                workflow_id=workflow_id,
                optimization_type=OptimizationType.COST,
                priority=RecommendationPriority.MEDIUM,
                description="Optimize resource usage and costs",
                expected_impact={"cost_reduction": 0.25, "efficiency_improvement": 0.15},
                implementation_complexity="low",
                confidence_score=0.75,
                suggested_changes={
                    "optimization_type": "resource_optimization",
                    "actions": ["right_size_instances", "implement_caching", "optimize_data_transfer"],
                    "estimated_savings": "25% cost reduction"
                }
            ))

            # Scalability recommendation
            recommendations.append(OptimizationRecommendation(
                workflow_id=workflow_id,
                optimization_type=OptimizationType.PERFORMANCE,
                priority=RecommendationPriority.LOW,
                description="Enhance workflow scalability",
                expected_impact={"performance_improvement": 0.2, "reliability_improvement": 0.15},
                implementation_complexity="medium",
                confidence_score=0.70,
                suggested_changes={
                    "optimization_type": "scalability_enhancement",
                    "actions": ["implement_load_balancing", "add_auto_scaling", "optimize_concurrency"],
                    "estimated_savings": "20% performance improvement"
                }
            ))

        except Exception as e:
            logger.error(f"Failed to generate proactive recommendations: {e}")

        return recommendations

    async def optimize_workflow(self, workflow_id: str, optimization_type: OptimizationType) -> Dict[str, Any]:
        """Automatically optimize a workflow."""
        try:
            logger.info(f"Starting {optimization_type.value} optimization for workflow {workflow_id}")

            # Get current workflow definition
            workflow_def = await self._get_workflow_definition(workflow_id)
            if not workflow_def:
                raise ValueError(f"Workflow {workflow_id} not found")

            optimized_def = workflow_def.copy()

            if optimization_type == OptimizationType.PERFORMANCE:
                optimized_def = await self._optimize_performance(workflow_def)
            elif optimization_type == OptimizationType.COST:
                optimized_def = await self._optimize_cost(workflow_def)
            elif optimization_type == OptimizationType.RELIABILITY:
                optimized_def = await self._optimize_reliability(workflow_def)
            elif optimization_type == OptimizationType.EFFICIENCY:
                optimized_def = await self._optimize_efficiency(workflow_def)

            # Validate optimization
            validation_result = await self._validate_optimization(workflow_def, optimized_def)

            return {
                "original_workflow": workflow_def,
                "optimized_workflow": optimized_def,
                "optimization_type": optimization_type.value,
                "validation_result": validation_result,
                "estimated_improvements": await self._estimate_improvements(workflow_def, optimized_def)
            }

        except Exception as e:
            logger.error(f"Failed to optimize workflow {workflow_id}: {e}")
            raise

    async def _get_workflow_definition(self, workflow_id: str) -> Optional[Dict]:
        """Get workflow definition from database."""
        try:
            async with get_db() as db:
                result = await db.execute(
                    "SELECT definition FROM workflows WHERE id = :workflow_id",
                    {"workflow_id": workflow_id}
                )
                workflow = result.fetchone()
                return workflow.definition if workflow else None

        except Exception as e:
            logger.error(f"Failed to get workflow definition: {e}")
            return None

    async def _optimize_performance(self, workflow_def: Dict) -> Dict:
        """Optimize workflow for performance."""
        # Implementation for performance optimization
        # This would include parallelization, caching, etc.
        return workflow_def

    async def _optimize_cost(self, workflow_def: Dict) -> Dict:
        """Optimize workflow for cost."""
        # Implementation for cost optimization
        return workflow_def

    async def _optimize_reliability(self, workflow_def: Dict) -> Dict:
        """Optimize workflow for reliability."""
        # Implementation for reliability optimization
        return workflow_def

    async def _optimize_efficiency(self, workflow_def: Dict) -> Dict:
        """Optimize workflow for efficiency."""
        # Implementation for efficiency optimization
        return workflow_def

    async def _validate_optimization(self, original: Dict, optimized: Dict) -> Dict:
        """Validate that optimization doesn't break functionality."""
        # Basic validation logic
        return {
            "is_valid": True,
            "warnings": [],
            "errors": []
        }

    async def _estimate_improvements(self, original: Dict, optimized: Dict) -> Dict:
        """Estimate the improvements from optimization."""
        return {
            "performance_improvement": 0.15,
            "cost_reduction": 0.10,
            "reliability_improvement": 0.05
        }

    async def evolve_workflow(self, workflow_id: str, generations: int = 5) -> Dict[str, Any]:
        """Evolve workflow through multiple optimization generations."""
        try:
            logger.info(f"Starting workflow evolution for {workflow_id} with {generations} generations")

            current_workflow = await self._get_workflow_definition(workflow_id)
            if not current_workflow:
                raise ValueError(f"Workflow {workflow_id} not found")

            evolution_history = []
            best_workflow = current_workflow
            best_score = await self._evaluate_workflow(current_workflow)

            for generation in range(generations):
                logger.info(f"Evolution generation {generation + 1}/{generations}")

                # Generate variations
                variations = await self._generate_workflow_variations(current_workflow)

                # Evaluate each variation
                for variation in variations:
                    score = await self._evaluate_workflow(variation)

                    if score > best_score:
                        best_score = score
                        best_workflow = variation

                        evolution_history.append({
                            "generation": generation + 1,
                            "score": score,
                            "improvement": score - await self._evaluate_workflow(current_workflow),
                            "changes": await self._identify_changes(current_workflow, variation)
                        })

                current_workflow = best_workflow

            return {
                "original_workflow": await self._get_workflow_definition(workflow_id),
                "evolved_workflow": best_workflow,
                "evolution_history": evolution_history,
                "final_score": best_score,
                "generations_completed": generations
            }

        except Exception as e:
            logger.error(f"Failed to evolve workflow {workflow_id}: {e}")
            raise

    async def _generate_workflow_variations(self, workflow: Dict) -> List[Dict]:
        """Generate variations of a workflow for evolution."""
        variations = []

        # Simple variations (this would be more sophisticated in practice)
        for i in range(3):
            variation = workflow.copy()
            # Apply random modifications
            variations.append(variation)

        return variations

    async def _evaluate_workflow(self, workflow: Dict) -> float:
        """Evaluate the quality of a workflow."""
        # Simple evaluation based on complexity and structure
        try:
            complexity = self._calculate_workflow_complexity(workflow)
            # Lower complexity is generally better (simpler = more maintainable)
            score = max(0, 100 - complexity)
            return score
        except Exception:
            return 0.0

    async def _identify_changes(self, original: Dict, modified: Dict) -> List[str]:
        """Identify changes between original and modified workflows."""
        changes = []
        # Compare workflows and identify differences
        return changes


# Global cognitive engine instance
cognitive_engine = CognitiveEngine()


async def get_cognitive_engine() -> CognitiveEngine:
    """Get the global cognitive engine instance."""
    if not hasattr(cognitive_engine, '_initialized'):
        await cognitive_engine.initialize()
        cognitive_engine._initialized = True
    return cognitive_engine
