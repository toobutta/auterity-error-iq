"""Correlation Analysis Service - Statistical analysis of cross-system relationships."""

import math
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np

from app.middleware.logging import get_logger

logger = get_logger(__name__)


class CorrelationAnalysisService:
    """Service for calculating statistical correlations between different systems and metrics."""

    def __init__(self):
        self.correlation_cache = {}

    def calculate_pearson_correlation(self, x_values: List[float], y_values: List[float]) -> float:
        """Calculate Pearson correlation coefficient between two datasets."""
        try:
            if len(x_values) != len(y_values) or len(x_values) < 2:
                return 0.0

            # Convert to numpy arrays
            x_array = np.array(x_values)
            y_array = np.array(y_values)

            # Calculate correlation
            correlation_matrix = np.corrcoef(x_array, y_array)
            correlation = correlation_matrix[0, 1]

            # Handle NaN values
            if np.isnan(correlation):
                return 0.0

            return float(correlation)

        except Exception as e:
            logger.error(f"Failed to calculate Pearson correlation: {str(e)}")
            return 0.0

    def calculate_spearman_correlation(self, x_values: List[float], y_values: List[float]) -> float:
        """Calculate Spearman rank correlation coefficient."""
        try:
            if len(x_values) != len(y_values) or len(x_values) < 2:
                return 0.0

            # Convert to numpy arrays and calculate ranks
            x_array = np.array(x_values)
            y_array = np.array(y_values)

            # Get ranks
            x_ranks = np.argsort(np.argsort(x_array)) + 1
            y_ranks = np.argsort(np.argsort(y_array)) + 1

            # Calculate correlation on ranks
            correlation_matrix = np.corrcoef(x_ranks, y_ranks)
            correlation = correlation_matrix[0, 1]

            # Handle NaN values
            if np.isnan(correlation):
                return 0.0

            return float(correlation)

        except Exception as e:
            logger.error(f"Failed to calculate Spearman correlation: {str(e)}")
            return 0.0

    def analyze_user_engagement_ai_quality_correlation(
        self,
        auterity_data: Dict[str, Any],
        neuroweaver_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Analyze correlation between user engagement and AI quality."""

        try:
            # Extract engagement metrics
            engagement_metrics = self._extract_engagement_metrics(auterity_data)
            ai_metrics = self._extract_ai_quality_metrics(neuroweaver_data)

            if not engagement_metrics or not ai_metrics:
                return None

            # Calculate correlation
            correlation = self.calculate_pearson_correlation(engagement_metrics, ai_metrics)

            if abs(correlation) > 0.3:  # Only return significant correlations
                return {
                    "id": "user_engagement_ai_quality",
                    "title": "User Engagement vs AI Quality",
                    "description": "Correlation between user engagement and AI response quality",
                    "correlation": correlation,
                    "confidence": min(0.95, abs(correlation) * 2),
                    "strength": self._get_correlation_strength(correlation),
                    "direction": "positive" if correlation > 0 else "negative",
                    "business_impact": self._calculate_business_impact(correlation, "engagement_quality"),
                    "insights": self._generate_engagement_insights(correlation),
                    "data_points": len(engagement_metrics),
                    "method": "pearson_correlation",
                    "analyzed_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.error(f"Failed to analyze user engagement correlation: {str(e)}")

        return None

    def analyze_performance_cost_correlation(
        self,
        auterity_data: Dict[str, Any],
        neuroweaver_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Analyze correlation between system performance and AI costs."""

        try:
            # Extract performance metrics
            performance_metrics = self._extract_performance_metrics(auterity_data)
            cost_metrics = self._extract_cost_metrics(neuroweaver_data)

            if not performance_metrics or not cost_metrics:
                return None

            # Calculate correlation
            correlation = self.calculate_pearson_correlation(performance_metrics, cost_metrics)

            if abs(correlation) > 0.25:  # Lower threshold for cost analysis
                return {
                    "id": "performance_cost_efficiency",
                    "title": "Performance vs Cost Efficiency",
                    "description": "Correlation between system performance and AI operational costs",
                    "correlation": correlation,
                    "confidence": min(0.90, abs(correlation) * 1.8),
                    "strength": self._get_correlation_strength(correlation),
                    "direction": "positive" if correlation > 0 else "negative",
                    "business_impact": self._calculate_business_impact(correlation, "cost_efficiency"),
                    "insights": self._generate_cost_insights(correlation),
                    "data_points": len(performance_metrics),
                    "method": "pearson_correlation",
                    "analyzed_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.error(f"Failed to analyze performance-cost correlation: {str(e)}")

        return None

    def analyze_workflow_ai_performance_correlation(
        self,
        relaycore_data: Dict[str, Any],
        neuroweaver_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Analyze correlation between workflow and AI performance."""

        try:
            # Extract workflow metrics
            workflow_metrics = self._extract_workflow_metrics(relaycore_data)
            ai_performance_metrics = self._extract_ai_performance_metrics(neuroweaver_data)

            if not workflow_metrics or not ai_performance_metrics:
                return None

            # Calculate correlation
            correlation = self.calculate_pearson_correlation(workflow_metrics, ai_performance_metrics)

            if abs(correlation) > 0.4:  # Higher threshold for workflow analysis
                return {
                    "id": "workflow_ai_performance",
                    "title": "Workflow vs AI Performance",
                    "description": "Correlation between workflow execution and AI processing performance",
                    "correlation": correlation,
                    "confidence": min(0.88, abs(correlation) * 1.5),
                    "strength": self._get_correlation_strength(correlation),
                    "direction": "positive" if correlation > 0 else "negative",
                    "business_impact": self._calculate_business_impact(correlation, "workflow_efficiency"),
                    "insights": self._generate_workflow_insights(correlation),
                    "data_points": len(workflow_metrics),
                    "method": "pearson_correlation",
                    "analyzed_at": datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.error(f"Failed to analyze workflow-AI correlation: {str(e)}")

        return None

    def _extract_engagement_metrics(self, auterity_data: Dict[str, Any]) -> List[float]:
        """Extract user engagement metrics for correlation analysis."""
        metrics = []

        try:
            user_analytics = auterity_data.get('userAnalytics', {})
            system_performance = auterity_data.get('systemPerformance', {})

            # Session duration (normalized)
            session_duration = user_analytics.get('session_duration', 0)
            normalized_session = min(1.0, session_duration / 1800)  # 30 minutes max
            metrics.append(normalized_session)

            # Page views (normalized)
            page_views = user_analytics.get('page_views', 0)
            normalized_views = min(1.0, page_views / 500)  # 500 views max
            metrics.append(normalized_views)

            # Bounce rate (inverted - lower bounce is better)
            bounce_rate = user_analytics.get('bounce_rate', 0)
            engagement_score = 1 - (bounce_rate / 100)
            metrics.append(engagement_score)

            # Response time (inverted - faster is better)
            response_time = system_performance.get('response_time', 0)
            performance_score = max(0, 1 - (response_time / 5000))  # 5 seconds baseline
            metrics.append(performance_score)

        except Exception as e:
            logger.error(f"Failed to extract engagement metrics: {str(e)}")

        return metrics

    def _extract_ai_quality_metrics(self, neuroweaver_data: Dict[str, Any]) -> List[float]:
        """Extract AI quality metrics for correlation analysis."""
        metrics = []

        try:
            performance = neuroweaver_data.get('performance', {})
            summary = neuroweaver_data.get('summary', {})

            # Success rate
            success_rate = performance.get('success_rate', 0) / 100
            metrics.append(success_rate)

            # User rating (normalized)
            avg_rating = summary.get('avg_rating', 0) / 5
            metrics.append(avg_rating)

            # Acceptance rate
            acceptance_rate = summary.get('acceptance_rate', 0) / 100
            metrics.append(acceptance_rate)

            # Response time (inverted - faster is better)
            avg_response_time = performance.get('avg_response_time', 0)
            speed_score = max(0, 1 - (avg_response_time / 10000))  # 10 seconds baseline
            metrics.append(speed_score)

        except Exception as e:
            logger.error(f"Failed to extract AI quality metrics: {str(e)}")

        return metrics

    def _extract_performance_metrics(self, auterity_data: Dict[str, Any]) -> List[float]:
        """Extract system performance metrics."""
        metrics = []

        try:
            system_performance = auterity_data.get('systemPerformance', {})

            # Response time (normalized, inverted)
            response_time = system_performance.get('response_time', 0)
            performance_score = max(0, 1 - (response_time / 5000))
            metrics.append(performance_score)

            # Error rate (inverted)
            error_rate = system_performance.get('error_rate', 0)
            reliability_score = 1 - (error_rate / 100)
            metrics.append(reliability_score)

            # Throughput (normalized)
            throughput = system_performance.get('throughput', 0)
            throughput_score = min(1.0, throughput / 2000)  # 2000 req/min baseline
            metrics.append(throughput_score)

        except Exception as e:
            logger.error(f"Failed to extract performance metrics: {str(e)}")

        return metrics

    def _extract_cost_metrics(self, neuroweaver_data: Dict[str, Any]) -> List[float]:
        """Extract AI cost metrics."""
        metrics = []

        try:
            performance = neuroweaver_data.get('performance', {})

            # Total cost (normalized)
            total_cost = performance.get('total_cost', 0)
            cost_score = min(1.0, total_cost / 50)  # $50 baseline
            metrics.append(cost_score)

            # Requests (normalized)
            total_requests = performance.get('total_requests', 0)
            usage_score = min(1.0, total_requests / 5000)  # 5000 requests baseline
            metrics.append(usage_score)

        except Exception as e:
            logger.error(f"Failed to extract cost metrics: {str(e)}")

        return metrics

    def _extract_workflow_metrics(self, relaycore_data: Dict[str, Any]) -> List[float]:
        """Extract workflow performance metrics."""
        metrics = []

        try:
            workflows = relaycore_data.get('workflows', {})
            executions = relaycore_data.get('executions', {})
            performance = relaycore_data.get('performance', {})

            # Success rate
            success_rate = executions.get('successful', 0) / max(1, executions.get('total', 1))
            metrics.append(success_rate)

            # Execution time (normalized, inverted - faster is better)
            avg_execution_time = performance.get('avgExecutionTime', 0)
            speed_score = max(0, 1 - (avg_execution_time / 300000))  # 5 minutes baseline
            metrics.append(speed_score)

            # Active workflows ratio
            total_workflows = workflows.get('total', 0)
            active_workflows = workflows.get('active', 0)
            utilization_score = active_workflows / max(1, total_workflows)
            metrics.append(utilization_score)

        except Exception as e:
            logger.error(f"Failed to extract workflow metrics: {str(e)}")

        return metrics

    def _extract_ai_performance_metrics(self, neuroweaver_data: Dict[str, Any]) -> List[float]:
        """Extract AI performance metrics for workflow correlation."""
        metrics = []

        try:
            performance = neuroweaver_data.get('performance', {})

            # Success rate
            success_rate = performance.get('success_rate', 0) / 100
            metrics.append(success_rate)

            # Response time (normalized, inverted)
            avg_response_time = performance.get('avg_response_time', 0)
            speed_score = max(0, 1 - (avg_response_time / 10000))
            metrics.append(speed_score)

            # Total requests (normalized)
            total_requests = performance.get('total_requests', 0)
            scale_score = min(1.0, total_requests / 10000)
            metrics.append(scale_score)

        except Exception as e:
            logger.error(f"Failed to extract AI performance metrics: {str(e)}")

        return metrics

    def _get_correlation_strength(self, correlation: float) -> str:
        """Convert correlation coefficient to human-readable strength."""
        abs_corr = abs(correlation)
        if abs_corr >= 0.8:
            return "very_strong"
        elif abs_corr >= 0.6:
            return "strong"
        elif abs_corr >= 0.4:
            return "moderate"
        elif abs_corr >= 0.2:
            return "weak"
        else:
            return "very_weak"

    def _calculate_business_impact(self, correlation: float, analysis_type: str) -> Dict[str, Any]:
        """Calculate business impact of correlation findings."""
        abs_corr = abs(correlation)

        if analysis_type == "engagement_quality":
            impact_value = abs_corr * 50000  # Potential revenue impact
            return {
                "value": impact_value,
                "unit": "USD",
                "description": f"Potential revenue impact of ${impact_value:,.0f}",
                "confidence": min(0.95, abs_corr * 2)
            }
        elif analysis_type == "cost_efficiency":
            savings_value = abs_corr * 30000  # Potential cost savings
            return {
                "value": savings_value,
                "unit": "USD",
                "description": f"Potential cost savings of ${savings_value:,.0f}",
                "confidence": min(0.90, abs_corr * 1.8)
            }
        elif analysis_type == "workflow_efficiency":
            efficiency_gain = abs_corr * 25  # Percentage efficiency gain
            return {
                "value": efficiency_gain,
                "unit": "percentage",
                "description": f"Potential efficiency improvement of {efficiency_gain:.1f}%",
                "confidence": min(0.88, abs_corr * 1.5)
            }

        return {
            "value": abs_corr * 10000,
            "unit": "USD",
            "description": f"Estimated impact of ${abs_corr * 10000:,.0f}",
            "confidence": abs_corr
        }

    def _generate_engagement_insights(self, correlation: float) -> List[str]:
        """Generate insights for engagement-quality correlation."""
        insights = []
        abs_corr = abs(correlation)

        if correlation > 0.5:
            insights.append("Higher AI response quality correlates with increased user engagement")
            insights.append("Investing in AI quality improvements may boost user satisfaction and retention")
            if abs_corr > 0.7:
                insights.append("Strong correlation suggests AI quality is a key driver of user experience")
        elif correlation < -0.5:
            insights.append("AI quality issues may be negatively impacting user engagement")
            insights.append("Consider investigating AI response quality and user feedback")

        insights.append(".3f")
        return insights

    def _generate_cost_insights(self, correlation: float) -> List[str]:
        """Generate insights for performance-cost correlation."""
        insights = []
        abs_corr = abs(correlation)

        if correlation > 0.4:
            insights.append("Better system performance correlates with higher AI costs")
            insights.append("Consider optimizing AI usage patterns to balance performance and cost")
        elif correlation < -0.4:
            insights.append("Cost-effective AI solutions may impact system performance")
            insights.append("Evaluate trade-offs between cost optimization and performance requirements")

        insights.append(".3f")
        return insights

    def _generate_workflow_insights(self, correlation: float) -> List[str]:
        """Generate insights for workflow-AI correlation."""
        insights = []
        abs_corr = abs(correlation)

        if correlation > 0.5:
            insights.append("AI performance improvements enhance workflow execution success")
            insights.append("Coordinating AI and workflow optimizations may yield better results")
        elif correlation < -0.5:
            insights.append("AI performance issues may be impacting workflow reliability")
            insights.append("Consider AI optimization to improve workflow success rates")

        insights.append(".3f")
        return insights

