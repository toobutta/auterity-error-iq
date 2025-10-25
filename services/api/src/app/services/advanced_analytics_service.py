"""Advanced Analytics & Business Intelligence Service.

Provides predictive analytics and ROI analysis.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.execution import WorkflowExecution
from app.models.tenant import BillingRecord, Tenant, UsageLog
from app.models.user import User

logger = logging.getLogger(__name__)


class AnalyticsMetric(str, Enum):
    """Types of analytics metrics."""

    USAGE = "usage"
    PERFORMANCE = "performance"
    COST = "cost"
    REVENUE = "revenue"
    CHURN = "churn"
    ROI = "roi"
    EFFICIENCY = "efficiency"
    SATISFACTION = "satisfaction"


class PredictionModel(str, Enum):
    """Types of prediction models."""

    LINEAR_REGRESSION = "linear_regression"
    RANDOM_FOREST = "random_forest"
    TIME_SERIES = "time_series"
    NEURAL_NETWORK = "neural_network"


class TimeGranularity(str, Enum):
    """Time granularity for analytics."""

    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


@dataclass
class MetricData:
    """Container for metric data points."""

    metric: str
    value: float
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrendAnalysis:
    """Trend analysis result."""

    metric: str
    trend: str  # "increasing", "decreasing", "stable"
    slope: float
    confidence: float
    period_days: int
    data_points: List[Tuple[datetime, float]] = field(default_factory=list)


@dataclass
class PredictionResult:
    """Prediction result from forecasting models."""

    metric: str
    predicted_value: float
    confidence_interval: Tuple[float, float]
    confidence_level: float
    model_used: PredictionModel
    forecast_horizon: int
    forecast_period: str
    historical_data_points: int


@dataclass
class ROIAnalysis:
    """ROI analysis result."""

    total_investment: Decimal
    total_return: Decimal
    roi_percentage: float
    payback_period_days: int
    break_even_date: datetime
    monthly_benefits: List[Decimal] = field(default_factory=list)
    cost_savings: Decimal = Decimal("0")
    productivity_gains: Decimal = Decimal("0")
    revenue_increase: Decimal = Decimal("0")


@dataclass
class ChurnAnalysis:
    """Churn prediction and analysis."""

    churn_probability: float
    risk_level: str  # "low", "medium", "high", "critical"
    churn_reasons: List[str] = field(default_factory=list)
    retention_recommendations: List[str] = field(default_factory=list)
    predicted_churn_date: Optional[datetime] = None
    confidence_level: float = 0.0


@dataclass
class BusinessIntelligenceReport:
    """Comprehensive business intelligence report."""

    tenant_id: UUID
    report_period: str
    generated_at: datetime
    executive_summary: str
    key_metrics: Dict[str, Any] = field(default_factory=dict)
    trends: List[TrendAnalysis] = field(default_factory=list)
    predictions: List[PredictionResult] = field(default_factory=list)
    roi_analysis: Optional[ROIAnalysis] = None
    churn_analysis: Optional[ChurnAnalysis] = None
    recommendations: List[str] = field(default_factory=list)
    alerts: List[str] = field(default_factory=list)


class CognitiveInsight(str, Enum):
    """Types of cognitive insights."""
    BOTTLENECK = "bottleneck"
    INEFFICIENCY = "inefficiency"
    OPTIMIZATION = "optimization"
    PATTERN = "pattern"
    ANOMALY = "anomaly"


@dataclass
class WorkflowInsight:
    """Cognitive insight about workflow performance."""
    insight_type: CognitiveInsight
    workflow_id: str
    description: str
    severity: str  # "low", "medium", "high", "critical"
    metrics: Dict[str, Any]
    recommendations: List[str]
    confidence: float
    impact_score: float


@dataclass
class SimulationResult:
    """Result from workflow simulation."""
    scenario_name: str
    workflow_id: str
    baseline_metrics: Dict[str, float]
    simulated_metrics: Dict[str, float]
    improvement_percentage: float
    confidence_level: float
    recommendations: List[str]


class AdvancedAnalyticsService:
    """Advanced Analytics & Business Intelligence Service with Cognitive Capabilities.

    Provides predictive analytics, ROI analysis, and AI-powered workflow optimization.
    """

    def __init__(self, db: Session):
        self.db = db
        # Skip SaaSConfig initialization to avoid argument issues
        self.config = None
        self.scaler = StandardScaler()
        self._analytics_cache: Dict[str, Any] = {}
        # Cognitive engine components
        self.performance_model = None
        self.cluster_model = None
        self.insights_cache: Dict[str, Any] = {}

    async def generate_business_intelligence_report(
        self,
        tenant_id: UUID,
        time_period_days: int = 30,
        include_predictions: bool = True,
    ) -> BusinessIntelligenceReport:
        """Generate comprehensive business intelligence report."""
        try:
            tenant = (
                self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            )
            if not tenant:
                raise ValueError(f"Tenant {tenant_id} not found")

            # Gather all analytics data
            key_metrics = await self._calculate_key_metrics(
                tenant_id, time_period_days
            )
            trends = await self._analyze_trends(tenant_id, time_period_days)
            predictions = []
            roi_analysis = None
            churn_analysis = None

            if include_predictions:
                predictions = await self._generate_predictions(
                    tenant_id, time_period_days
                )
                roi_analysis = await self._calculate_roi_analysis(
                    tenant_id, time_period_days
                )
                churn_analysis = await self._analyze_churn_risk(tenant_id)

            recommendations = await self._generate_recommendations(
                tenant_id, key_metrics, trends, predictions
            )
            alerts = await self._generate_alerts(
                tenant_id, key_metrics, predictions
            )

            executive_summary = self._generate_executive_summary(
                str(tenant.name), key_metrics, trends, predictions
            )

            return BusinessIntelligenceReport(
                tenant_id=tenant_id,
                report_period=f"Last {time_period_days} days",
                generated_at=datetime.utcnow(),
                executive_summary=executive_summary,
                key_metrics=key_metrics,
                trends=trends,
                predictions=predictions,
                roi_analysis=roi_analysis,
                churn_analysis=churn_analysis,
                recommendations=recommendations,
                alerts=alerts,
            )

        except Exception as e:
            logger.error(
                f"Business intelligence report generation failed: {str(e)}"
            )
            raise

    async def _calculate_key_metrics(
        self, tenant_id: UUID, time_period_days: int
    ) -> Dict[str, Any]:
        """Calculate key performance metrics."""
        period_start = datetime.utcnow() - timedelta(days=time_period_days)

        # Usage metrics
        usage_logs = (
            self.db.query(UsageLog)
            .filter(
                and_(
                    UsageLog.tenant_id == tenant_id,
                    UsageLog.created_at >= period_start,
                )
            )
            .all()
        )

        # Billing metrics
        billing_records = (
            self.db.query(BillingRecord)
            .filter(
                and_(
                    BillingRecord.tenant_id == tenant_id,
                    BillingRecord.created_at >= period_start,
                )
            )
            .all()
        )

        # User metrics
        active_users = (
            self.db.query(User)
            .filter(
                and_(
                    User.tenant_id == tenant_id,
                    User.last_login >= period_start,
                )
            )
            .count()
        )

        total_users = (
            self.db.query(User).filter(User.tenant_id == tenant_id).count()
        )

        # Workflow metrics
        workflow_executions = (
            self.db.query(WorkflowExecution)
            .filter(
                and_(
                    WorkflowExecution.tenant_id == tenant_id,
                    WorkflowExecution.created_at >= period_start,
                )
            )
            .all()
        )

        # Calculate metrics
        total_requests = len(usage_logs)
        successful_requests = len(
            [log for log in usage_logs if log.status == "success"]
        )
        total_cost = sum(log.cost_amount or Decimal("0") for log in usage_logs)

        # Calculate total billed amount properly
        total_billed = Decimal("0")
        for record in billing_records:
            if hasattr(record, "status") and str(record.status) == "paid":
                total_billed += record.amount

        success_rate = (
            (successful_requests / total_requests * 100)
            if total_requests > 0
            else 0
        )
        avg_cost_per_request = (
            (total_cost / total_requests)
            if total_requests > 0
            else Decimal("0")
        )

        # Workflow efficiency
        total_executions = len(workflow_executions)
        successful_executions = 0
        execution_durations = []

        for execution in workflow_executions:
            if (
                hasattr(execution, "status")
                and str(execution.status) == "completed"
            ):
                successful_executions += 1
            if hasattr(execution, "duration_ms") and execution.duration_ms:
                execution_durations.append(execution.duration_ms)

        avg_execution_time = (
            np.mean(execution_durations) if execution_durations else 0
        )

        return {
            "usage": {
                "total_requests": total_requests,
                "successful_requests": successful_requests,
                "success_rate": round(success_rate, 2),
                "total_cost": float(total_cost),
                "avg_cost_per_request": float(avg_cost_per_request),
            },
            "billing": {
                "total_billed": float(str(total_billed)),
                "billing_records_count": len(billing_records),
            },
            "users": {
                "active_users": active_users,
                "total_users": total_users,
                "user_engagement_rate": (
                    round((active_users / total_users * 100), 2)
                    if total_users > 0
                    else 0
                ),
            },
            "workflows": {
                "total_executions": total_executions,
                "successful_executions": successful_executions,
                "success_rate": (
                    round((successful_executions / total_executions * 100), 2)
                    if total_executions > 0
                    else 0
                ),
                "avg_execution_time_ms": (
                    round(avg_execution_time, 2) if avg_execution_time else 0
                ),
            },
        }

    async def _analyze_trends(
        self, tenant_id: UUID, time_period_days: int
    ) -> List[TrendAnalysis]:
        """Analyze trends in key metrics."""
        trends = []

        # Analyze usage trends
        usage_trend = await self._analyze_metric_trend(
            tenant_id, "usage_requests", time_period_days
        )
        if usage_trend:
            trends.append(usage_trend)

        # Analyze cost trends
        cost_trend = await self._analyze_metric_trend(
            tenant_id, "cost", time_period_days
        )
        if cost_trend:
            trends.append(cost_trend)

        # Analyze performance trends
        performance_trend = await self._analyze_metric_trend(
            tenant_id, "performance", time_period_days
        )
        if performance_trend:
            trends.append(performance_trend)

        return trends

    async def _analyze_metric_trend(
        self, tenant_id: UUID, metric: str, time_period_days: int
    ) -> Optional[TrendAnalysis]:
        """Analyze trend for a specific metric."""
        try:
            period_start = datetime.utcnow() - timedelta(days=time_period_days)

            # Get historical data points
            if metric == "usage_requests":
                data_points = await self._get_usage_data_points(
                    tenant_id, period_start, time_period_days
                )
            elif metric == "cost":
                data_points = await self._get_cost_data_points(
                    tenant_id, period_start, time_period_days
                )
            elif metric == "performance":
                data_points = await self._get_performance_data_points(
                    tenant_id, period_start, time_period_days
                )
            else:
                return None

            if len(data_points) < 3:
                return None

            # Calculate trend using linear regression
            X = np.array(range(len(data_points))).reshape(-1, 1)
            y = np.array([point[1] for point in data_points])

            model = LinearRegression()
            model.fit(X, y)

            slope = model.coef_[0]
            score = model.score(X, y)

            # Determine trend direction
            if slope > 0.1:
                trend = "increasing"
            elif slope < -0.1:
                trend = "decreasing"
            else:
                trend = "stable"

            return TrendAnalysis(
                metric=metric,
                trend=trend,
                slope=slope,
                confidence=float(score),
                period_days=time_period_days,
                data_points=data_points,
            )

        except Exception as e:
            logger.error(f"Trend analysis failed for {metric}: {str(e)}")
            return None

    async def _get_usage_data_points(
        self, tenant_id: UUID, period_start: datetime, days: int
    ) -> List[Tuple[datetime, float]]:
        """Get daily usage data points."""
        data_points = []

        for i in range(days):
            day_start = period_start + timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            count = (
                self.db.query(func.count(UsageLog.id))
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at >= day_start,
                        UsageLog.created_at < day_end,
                    )
                )
                .scalar()
            )

            data_points.append((day_start, float(count)))

        return data_points

    async def _get_cost_data_points(
        self, tenant_id: UUID, period_start: datetime, days: int
    ) -> List[Tuple[datetime, float]]:
        """Get daily cost data points."""
        data_points = []

        for i in range(days):
            day_start = period_start + timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            total_cost = (
                self.db.query(func.sum(UsageLog.cost_amount))
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at >= day_start,
                        UsageLog.created_at < day_end,
                    )
                )
                .scalar()
                or 0
            )

            data_points.append((day_start, float(total_cost)))

        return data_points

    async def _get_performance_data_points(
        self, tenant_id: UUID, period_start: datetime, days: int
    ) -> List[Tuple[datetime, float]]:
        """Get daily performance data points (success rate)."""
        data_points = []

        for i in range(days):
            day_start = period_start + timedelta(days=i)
            day_end = day_start + timedelta(days=1)

            total_executions = (
                self.db.query(func.count(WorkflowExecution.id))
                .filter(
                    and_(
                        WorkflowExecution.tenant_id == tenant_id,
                        WorkflowExecution.created_at >= day_start,
                        WorkflowExecution.created_at < day_end,
                    )
                )
                .scalar()
            )

            successful_executions = (
                self.db.query(func.count(WorkflowExecution.id))
                .filter(
                    and_(
                        WorkflowExecution.tenant_id == tenant_id,
                        WorkflowExecution.status == "completed",
                        WorkflowExecution.created_at >= day_start,
                        WorkflowExecution.created_at < day_end,
                    )
                )
                .scalar()
            )

            success_rate = (
                (successful_executions / total_executions * 100)
                if total_executions > 0
                else 0
            )
            data_points.append((day_start, success_rate))

        return data_points

    async def _generate_predictions(
        self, tenant_id: UUID, time_period_days: int
    ) -> List[PredictionResult]:
        """Generate predictions for key metrics."""
        predictions = []

        # Predict future usage
        usage_prediction = await self._predict_metric(
            tenant_id, "usage_requests", time_period_days, 30
        )
        if usage_prediction:
            predictions.append(usage_prediction)

        # Predict future costs
        cost_prediction = await self._predict_metric(
            tenant_id, "cost", time_period_days, 30
        )
        if cost_prediction:
            predictions.append(cost_prediction)

        return predictions

    async def _predict_metric(
        self,
        tenant_id: UUID,
        metric: str,
        historical_days: int,
        forecast_days: int,
    ) -> Optional[PredictionResult]:
        """Predict future values for a metric."""
        try:
            # Get historical data
            period_start = datetime.utcnow() - timedelta(days=historical_days)

            if metric == "usage_requests":
                data_points = await self._get_usage_data_points(
                    tenant_id, period_start, historical_days
                )
            elif metric == "cost":
                data_points = await self._get_cost_data_points(
                    tenant_id, period_start, historical_days
                )
            else:
                return None

            if len(data_points) < 7:  # Need at least a week of data
                return None

            # Prepare data for prediction
            X = np.array(range(len(data_points))).reshape(-1, 1)
            y = np.array([point[1] for point in data_points])

            # Use Random Forest for better accuracy with small datasets
            model = RandomForestRegressor(n_estimators=100, random_state=42)
            model.fit(X, y)

            # Predict future values
            future_X = np.array(
                range(len(data_points), len(data_points) + forecast_days)
            ).reshape(-1, 1)
            predictions = model.predict(future_X)

            # Calculate confidence interval (simplified)
            confidence_level = 0.85  # 85% confidence
            prediction_std = np.std(y) if len(y) > 1 else 0
            margin_of_error = prediction_std * 1.96  # 95% confidence interval

            predicted_value = float(predictions[-1])  # Predict the last point

            return PredictionResult(
                metric=metric,
                predicted_value=predicted_value,
                confidence_interval=(
                    float(predicted_value - margin_of_error),
                    float(predicted_value + margin_of_error),
                ),
                confidence_level=confidence_level,
                model_used=PredictionModel.RANDOM_FOREST,
                forecast_horizon=forecast_days,
                forecast_period="days",
                historical_data_points=len(data_points),
            )

        except Exception as e:
            logger.error(f"Metric prediction failed for {metric}: {str(e)}")
            return None

    async def _calculate_roi_analysis(
        self, tenant_id: UUID, time_period_days: int
    ) -> ROIAnalysis:
        """Calculate ROI analysis for the tenant."""
        try:
            _ = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()
            period_start = datetime.utcnow() - timedelta(days=time_period_days)

            # Calculate total investment (subscription costs)
            subscription_costs_result = (
                self.db.query(func.sum(BillingRecord.amount))
                .filter(
                    and_(
                        BillingRecord.tenant_id == tenant_id,
                        BillingRecord.status == "paid",
                        BillingRecord.created_at >= period_start,
                    )
                )
                .scalar()
            )

            subscription_costs = subscription_costs_result or Decimal("0")

            # Calculate benefits (value delivered)
            # This is a simplified calculation - in practice, you'd have
            # more sophisticated metrics
            usage_logs = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at >= period_start,
                    )
                )
                .all()
            )

            # Estimate productivity gains (simplified)
            total_requests = len(usage_logs)
            productivity_gain_per_request = Decimal(
                "2.50"
            )  # $2.50 value per request
            productivity_gains = (
                Decimal(total_requests) * productivity_gain_per_request
            )

            # Cost savings from automation
            manual_cost_per_request = Decimal(
                "5.00"
            )  # $5 manual cost per request
            automation_cost_per_request = Decimal(
                "0.50"
            )  # $0.50 automation cost per request
            cost_savings = Decimal(total_requests) * (
                manual_cost_per_request - automation_cost_per_request
            )

            # Total return
            total_return = productivity_gains + cost_savings
            total_investment = subscription_costs

            # Calculate ROI
            roi_percentage = (
                float((total_return / total_investment * 100))
                if total_investment > 0
                else 0
            )

            # Estimate payback period (simplified)
            daily_net_benefit = (productivity_gains + cost_savings) / Decimal(
                time_period_days
            )
            payback_period_days = (
                int(total_investment / daily_net_benefit)
                if daily_net_benefit > 0
                else 0
            )

            break_even_date = datetime.utcnow() + timedelta(
                days=payback_period_days
            )

            return ROIAnalysis(
                total_investment=total_investment,
                total_return=total_return,
                roi_percentage=roi_percentage,
                payback_period_days=payback_period_days,
                break_even_date=break_even_date,
                cost_savings=cost_savings,
                productivity_gains=productivity_gains,
                revenue_increase=Decimal(
                    "0"
                ),  # Not calculated in this simplified version
            )

        except Exception as e:
            logger.error(f"ROI analysis failed: {str(e)}")
            # Return a default analysis
            return ROIAnalysis(
                total_investment=Decimal("0"),
                total_return=Decimal("0"),
                roi_percentage=0.0,
                payback_period_days=0,
                break_even_date=datetime.utcnow(),
            )

    async def _analyze_churn_risk(self, tenant_id: UUID) -> ChurnAnalysis:
        """Analyze churn risk for the tenant."""
        try:
            _ = self.db.query(Tenant).filter(Tenant.id == tenant_id).first()

            # Simple churn risk factors
            # (in a real system, this would be more sophisticated)
            risk_factors = []

            # Usage patterns
            recent_usage = (
                self.db.query(UsageLog)
                .filter(
                    and_(
                        UsageLog.tenant_id == tenant_id,
                        UsageLog.created_at
                        >= datetime.utcnow() - timedelta(days=7),
                    )
                )
                .count()
            )

            if recent_usage == 0:
                risk_factors.append("No recent usage")
            elif recent_usage < 10:
                risk_factors.append("Low recent usage")

            # Billing issues
            failed_payments = (
                self.db.query(BillingRecord)
                .filter(
                    and_(
                        BillingRecord.tenant_id == tenant_id,
                        BillingRecord.status == "failed",
                        BillingRecord.created_at
                        >= datetime.utcnow() - timedelta(days=30),
                    )
                )
                .count()
            )

            if failed_payments > 0:
                risk_factors.append("Recent payment failures")

            # Support tickets (if available)
            # This would integrate with support ticket system

            # Calculate churn probability based on risk factors
            base_probability = 0.1  # 10% base churn rate
            risk_multiplier = (
                len(risk_factors) * 0.15
            )  # Each risk factor adds 15%
            churn_probability = min(base_probability + risk_multiplier, 1.0)

            # Determine risk level
            if churn_probability < 0.3:
                risk_level = "low"
            elif churn_probability < 0.6:
                risk_level = "medium"
            elif churn_probability < 0.8:
                risk_level = "high"
            else:
                risk_level = "critical"

            recommendations = []
            if risk_factors:
                recommendations.extend(
                    [
                        "Increase user engagement",
                        "Address payment issues promptly",
                        "Provide additional training/support",
                        "Review feature utilization",
                    ]
                )

            return ChurnAnalysis(
                churn_probability=churn_probability,
                risk_level=risk_level,
                churn_reasons=risk_factors,
                retention_recommendations=recommendations,
                confidence_level=0.75,
            )

        except Exception as e:
            logger.error(f"Churn analysis failed: {str(e)}")
            return ChurnAnalysis(
                churn_probability=0.1, risk_level="low", confidence_level=0.5
            )

    async def _generate_recommendations(
        self,
        tenant_id: UUID,
        key_metrics: Dict[str, Any],
        trends: List[TrendAnalysis],
        predictions: List[PredictionResult],
    ) -> List[str]:
        """Generate business recommendations based on analytics."""
        recommendations = []

        # Usage-based recommendations
        usage_metrics = key_metrics.get("usage", {})
        if usage_metrics.get("success_rate", 0) < 90:
            recommendations.append(
                "Improve workflow success rate through error handling "
                "and monitoring"
            )

        if usage_metrics.get("total_requests", 0) == 0:
            recommendations.append(
                "Increase user adoption through training and onboarding"
            )

        # Cost-based recommendations
        if usage_metrics.get("avg_cost_per_request", 0) > 1.0:
            recommendations.append(
                "Optimize AI model selection to reduce costs"
            )

        # Trend-based recommendations
        for trend in trends:
            if (
                trend.trend == "decreasing"
                and trend.metric == "usage_requests"
            ):
                recommendations.append(
                    "Implement user engagement initiatives to reverse "
                    "declining usage"
                )

        # Prediction-based recommendations
        for prediction in predictions:
            if (
                prediction.metric == "cost"
                and prediction.predicted_value
                > usage_metrics.get("total_cost", 0) * 1.5
            ):
                recommendations.append(
                    "Implement cost optimization measures to control "
                    "future expenses"
                )

        return recommendations

    async def _generate_alerts(
        self,
        tenant_id: UUID,
        key_metrics: Dict[str, Any],
        predictions: List[PredictionResult],
    ) -> List[str]:
        """Generate alerts based on analytics data."""
        alerts = []

        # Usage alerts
        usage_metrics = key_metrics.get("usage", {})
        if usage_metrics.get("success_rate", 100) < 95:
            alerts.append("Warning: Workflow success rate below 95%")

        # Cost alerts
        if usage_metrics.get("total_cost", 0) > 100:  # Threshold
            alerts.append("High usage costs detected - consider optimization")

        # Prediction alerts
        for prediction in predictions:
            if (
                prediction.metric == "usage_requests"
                and prediction.predicted_value == 0
            ):
                alerts.append(
                    "Critical: Predicted zero usage - immediate attention "
                    "required"
                )

        return alerts

    def _generate_executive_summary(
        self,
        tenant_name: str,
        key_metrics: Dict[str, Any],
        trends: List[TrendAnalysis],
        predictions: List[PredictionResult],
    ) -> str:
        """Generate executive summary for the business intelligence report."""
        usage_metrics = key_metrics.get("usage", {})
        total_requests = usage_metrics.get("total_requests", 0)
        success_rate = usage_metrics.get("success_rate", 0)

        summary = f"Business Intelligence Report for {tenant_name}\n\n"
        summary += "Key Performance Indicators:\n"
        summary += f"- Total Requests: {total_requests}\n"
        summary += f"- Success Rate: {success_rate}%\n"
        summary += ".2f"
        users_data = key_metrics.get("users", {})
        active_users_count = users_data.get("active_users", 0)
        summary += f"- Active Users: {active_users_count}\n\n"

        if trends:
            summary += "Key Trends:\n"
            for trend in trends[:3]:  # Show top 3 trends
                summary += f"- {trend.metric.title()}: {trend.trend} trend\n"

        if predictions:
            summary += "\nForecasts:\n"
            for prediction in predictions[:2]:  # Show top 2 predictions
                metric_title = prediction.metric.title()
                predicted_val = prediction.predicted_value
                horizon = prediction.forecast_horizon
                summary += (
                    f"- {metric_title}: {predicted_val:.2f} "
                    f"(next {horizon} days)\n"
                )

        return summary

    async def get_custom_analytics(
        self,
        tenant_id: UUID,
        metrics: List[str],
        start_date: datetime,
        end_date: datetime,
        granularity: TimeGranularity = TimeGranularity.DAILY,
    ) -> Dict[str, Any]:
        """Get custom analytics for specific metrics and time period."""
        try:
            analytics_data = {}

            for metric in metrics:
                if metric == "usage":
                    analytics_data[metric] = await self._get_usage_analytics(
                        tenant_id, start_date, end_date, granularity
                    )
                elif metric == "cost":
                    analytics_data[metric] = await self._get_cost_analytics(
                        tenant_id, start_date, end_date, granularity
                    )
                elif metric == "performance":
                    analytics_data[
                        metric
                    ] = await self._get_performance_analytics(
                        tenant_id, start_date, end_date, granularity
                    )

            return {
                "tenant_id": tenant_id,
                "time_period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "granularity": granularity.value,
                },
                "data": analytics_data,
            }

        except Exception as e:
            logger.error(f"Custom analytics failed: {str(e)}")
            return {"error": str(e)}

    async def _get_usage_analytics(
        self,
        tenant_id: UUID,
        start_date: datetime,
        end_date: datetime,
        granularity: TimeGranularity,
    ) -> Dict[str, Any]:
        """Get detailed usage analytics."""
        # Implementation would aggregate data based on granularity
        # For now, return basic structure
        return {
            "total_requests": 0,
            "successful_requests": 0,
            "success_rate": 0.0,
            "data_points": [],
        }

    async def _get_cost_analytics(
        self,
        tenant_id: UUID,
        start_date: datetime,
        end_date: datetime,
        granularity: TimeGranularity,
    ) -> Dict[str, Any]:
        """Get detailed cost analytics."""
        return {
            "total_cost": 0.0,
            "avg_cost_per_request": 0.0,
            "cost_trend": "stable",
            "data_points": [],
        }

    async def _get_performance_analytics(
        self,
        tenant_id: UUID,
        start_date: datetime,
        end_date: datetime,
        granularity: TimeGranularity,
    ) -> Dict[str, Any]:
        """Get detailed performance analytics."""
        return {
            "avg_response_time": 0.0,
            "success_rate_trend": "stable",
            "bottlenecks": [],
            "data_points": [],
        }

    # Cognitive Analytics Methods
    async def analyze_workflow_performance(
        self, tenant_id: UUID, workflow_id: str
    ) -> List[WorkflowInsight]:
        """Analyze workflow performance and generate cognitive insights."""
        try:
            insights = []

            # Get workflow execution data
            executions = (
                self.db.query(WorkflowExecution)
                .filter(
                    and_(
                        WorkflowExecution.tenant_id == tenant_id,
                        WorkflowExecution.workflow_id == workflow_id,
                        WorkflowExecution.created_at >= datetime.utcnow() - timedelta(days=30),
                    )
                )
                .all()
            )

            if not executions:
                return insights

            # Calculate performance metrics
            total_executions = len(executions)
            successful_executions = len([e for e in executions if e.status == "completed"])
            success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0

            # Calculate average execution time
            execution_times = [e.duration_ms for e in executions if e.duration_ms]
            avg_execution_time = np.mean(execution_times) if execution_times else 0

            # Detect bottlenecks
            if avg_execution_time > 5000:  # 5 seconds threshold
                insights.append(WorkflowInsight(
                    insight_type=CognitiveInsight.BOTTLENECK,
                    workflow_id=workflow_id,
                    description=f"High average execution time: {avg_execution_time:.2f}ms",
                    severity="medium" if avg_execution_time > 10000 else "low",
                    metrics={"avg_execution_time": avg_execution_time, "threshold": 5000},
                    recommendations=[
                        "Optimize database queries",
                        "Consider caching frequently accessed data",
                        "Review workflow steps for inefficiencies"
                    ],
                    confidence=0.85,
                    impact_score=0.7
                ))

            # Detect success rate issues
            if success_rate < 90:
                insights.append(WorkflowInsight(
                    insight_type=CognitiveInsight.INEFFICIENCY,
                    workflow_id=workflow_id,
                    description=f"Low success rate: {success_rate:.1f}%",
                    severity="high" if success_rate < 70 else "medium",
                    metrics={"success_rate": success_rate, "threshold": 90},
                    recommendations=[
                        "Add error handling and retry mechanisms",
                        "Review input validation",
                        "Monitor external service dependencies"
                    ],
                    confidence=0.9,
                    impact_score=0.8
                ))

            # Detect patterns in execution times
            if len(execution_times) > 10:
                std_dev = np.std(execution_times)
                if std_dev > avg_execution_time * 0.5:  # High variance
                    insights.append(WorkflowInsight(
                        insight_type=CognitiveInsight.PATTERN,
                        workflow_id=workflow_id,
                        description="High variance in execution times detected",
                        severity="low",
                        metrics={"std_dev": std_dev, "avg_time": avg_execution_time},
                        recommendations=[
                            "Investigate causes of execution time variance",
                            "Consider load balancing",
                            "Monitor resource utilization patterns"
                        ],
                        confidence=0.75,
                        impact_score=0.4
                    ))

            return insights

        except Exception as e:
            logger.error(f"Workflow performance analysis failed: {str(e)}")
            return []

    async def detect_process_patterns(
        self, tenant_id: UUID, workflow_id: str
    ) -> Dict[str, Any]:
        """Detect patterns in workflow execution processes."""
        try:
            # Get execution logs
            executions = (
                self.db.query(WorkflowExecution)
                .filter(
                    and_(
                        WorkflowExecution.tenant_id == tenant_id,
                        WorkflowExecution.workflow_id == workflow_id,
                        WorkflowExecution.created_at >= datetime.utcnow() - timedelta(days=30),
                    )
                )
                .order_by(WorkflowExecution.created_at)
                .all()
            )

            if len(executions) < 5:
                return {"patterns": [], "insights": []}

            # Analyze execution patterns
            patterns = []
            insights = []

            # Success rate trends
            success_rates = []
            for i in range(0, len(executions), 10):  # Every 10 executions
                batch = executions[i:i+10]
                success_rate = len([e for e in batch if e.status == "completed"]) / len(batch) * 100
                success_rates.append(success_rate)

            if len(success_rates) > 3:
                # Detect declining success rate
                if len(success_rates) > 1 and success_rates[-1] < success_rates[0] * 0.8:
                    patterns.append({
                        "type": "declining_success_rate",
                        "description": "Success rate declining over time",
                        "severity": "medium",
                        "change_percentage": ((success_rates[-1] - success_rates[0]) / success_rates[0]) * 100
                    })

            # Execution time patterns
            execution_times = [e.duration_ms for e in executions if e.duration_ms]
            if len(execution_times) > 10:
                # Detect increasing execution times
                first_half = execution_times[:len(execution_times)//2]
                second_half = execution_times[len(execution_times)//2:]

                avg_first = np.mean(first_half)
                avg_second = np.mean(second_half)

                if avg_second > avg_first * 1.2:  # 20% increase
                    patterns.append({
                        "type": "increasing_execution_time",
                        "description": "Execution times increasing over time",
                        "severity": "medium",
                        "increase_percentage": ((avg_second - avg_first) / avg_first) * 100
                    })

            # Generate insights
            for pattern in patterns:
                if pattern["type"] == "declining_success_rate":
                    insights.append({
                        "type": "optimization_opportunity",
                        "description": "Consider reviewing recent workflow changes",
                        "action_items": [
                            "Review recent workflow modifications",
                            "Check for external service degradation",
                            "Consider adding circuit breakers"
                        ]
                    })
                elif pattern["type"] == "increasing_execution_time":
                    insights.append({
                        "type": "performance_optimization",
                        "description": "Workflow performance degrading over time",
                        "action_items": [
                            "Profile workflow execution",
                            "Optimize database queries",
                            "Consider caching strategies"
                        ]
                    })

            return {
                "patterns": patterns,
                "insights": insights,
                "analysis_period_days": 30,
                "total_executions_analyzed": len(executions)
            }

        except Exception as e:
            logger.error(f"Process pattern detection failed: {str(e)}")
            return {"patterns": [], "insights": [], "error": str(e)}

    async def run_workflow_simulation(
        self, tenant_id: UUID, workflow_id: str, scenario: Dict[str, Any]
    ) -> SimulationResult:
        """Run simulation for workflow performance under different conditions."""
        try:
            # Get baseline performance data
            baseline_executions = (
                self.db.query(WorkflowExecution)
                .filter(
                    and_(
                        WorkflowExecution.tenant_id == tenant_id,
                        WorkflowExecution.workflow_id == workflow_id,
                        WorkflowExecution.created_at >= datetime.utcnow() - timedelta(days=7),
                    )
                )
                .all()
            )

            if not baseline_executions:
                raise ValueError("Insufficient baseline data for simulation")

            # Calculate baseline metrics
            successful_executions = len([e for e in baseline_executions if e.status == "completed"])
            baseline_success_rate = (successful_executions / len(baseline_executions) * 100)

            execution_times = [e.duration_ms for e in baseline_executions if e.duration_ms]
            baseline_avg_time = np.mean(execution_times) if execution_times else 0

            baseline_metrics = {
                "success_rate": baseline_success_rate,
                "avg_execution_time": baseline_avg_time,
                "total_executions": len(baseline_executions)
            }

            # Apply scenario modifications
            scenario_type = scenario.get("type", "baseline")
            modifications = scenario.get("modifications", {})

            # Simulate different scenarios
            if scenario_type == "load_increase":
                load_multiplier = modifications.get("load_multiplier", 1.5)
                simulated_success_rate = max(0, baseline_success_rate * (1 / load_multiplier))
                simulated_avg_time = baseline_avg_time * load_multiplier
                improvement_percentage = ((baseline_success_rate - simulated_success_rate) / baseline_success_rate) * 100

            elif scenario_type == "optimization":
                optimization_factor = modifications.get("optimization_factor", 0.8)
                simulated_success_rate = min(100, baseline_success_rate / optimization_factor)
                simulated_avg_time = baseline_avg_time * optimization_factor
                improvement_percentage = ((simulated_success_rate - baseline_success_rate) / baseline_success_rate) * 100

            else:  # baseline
                simulated_success_rate = baseline_success_rate
                simulated_avg_time = baseline_avg_time
                improvement_percentage = 0

            simulated_metrics = {
                "success_rate": simulated_success_rate,
                "avg_execution_time": simulated_avg_time,
                "total_executions": int(len(baseline_executions) * modifications.get("execution_multiplier", 1.0))
            }

            # Generate recommendations
            recommendations = []
            if scenario_type == "load_increase" and simulated_success_rate < 80:
                recommendations.extend([
                    "Consider horizontal scaling",
                    "Implement load balancing",
                    "Add request queuing",
                    "Optimize database connections"
                ])
            elif scenario_type == "optimization" and improvement_percentage > 10:
                recommendations.extend([
                    "Implement suggested optimizations",
                    "Monitor performance improvements",
                    "Consider A/B testing for changes"
                ])

            return SimulationResult(
                scenario_name=scenario.get("name", scenario_type),
                workflow_id=workflow_id,
                baseline_metrics=baseline_metrics,
                simulated_metrics=simulated_metrics,
                improvement_percentage=improvement_percentage,
                confidence_level=0.8,
                recommendations=recommendations
            )

        except Exception as e:
            logger.error(f"Workflow simulation failed: {str(e)}")
            # Return a basic result
            return SimulationResult(
                scenario_name="error",
                workflow_id=workflow_id,
                baseline_metrics={"success_rate": 0, "avg_execution_time": 0, "total_executions": 0},
                simulated_metrics={"success_rate": 0, "avg_execution_time": 0, "total_executions": 0},
                improvement_percentage=0,
                confidence_level=0,
                recommendations=["Simulation failed - check system logs"]
            )

    async def get_workflow_optimization_recommendations(
        self, tenant_id: UUID, workflow_id: str
    ) -> Dict[str, Any]:
        """Get comprehensive optimization recommendations for a workflow."""
        try:
            # Get all insights
            insights = await self.analyze_workflow_performance(tenant_id, workflow_id)

            # Get process patterns
            patterns = await self.detect_process_patterns(tenant_id, workflow_id)

            # Generate optimization recommendations
            recommendations = {
                "immediate_actions": [],
                "short_term_improvements": [],
                "long_term_optimizations": [],
                "estimated_impact": {},
                "implementation_priority": []
            }

            # Process insights for recommendations
            for insight in insights:
                if insight.severity == "high":
                    recommendations["immediate_actions"].extend(insight.recommendations)
                elif insight.severity == "medium":
                    recommendations["short_term_improvements"].extend(insight.recommendations)
                else:
                    recommendations["long_term_optimizations"].extend(insight.recommendations)

            # Process patterns for recommendations
            for pattern in patterns.get("patterns", []):
                if pattern["severity"] == "high":
                    recommendations["immediate_actions"].append(
                        f"Address {pattern['type']}: {pattern['description']}"
                    )
                elif pattern["severity"] == "medium":
                    recommendations["short_term_improvements"].append(
                        f"Address {pattern['type']}: {pattern['description']}"
                    )

            # Calculate estimated impact
            high_severity_count = len([i for i in insights if i.severity == "high"])
            total_insights = len(insights)

            if total_insights > 0:
                impact_score = high_severity_count / total_insights
                recommendations["estimated_impact"] = {
                    "performance_improvement": min(impact_score * 30, 25),  # Up to 25% improvement
                    "cost_reduction": min(impact_score * 20, 15),  # Up to 15% cost reduction
                    "reliability_improvement": min(impact_score * 40, 30),  # Up to 30% reliability improvement
                    "confidence_level": 0.75
                }

            # Set implementation priority
            if recommendations["immediate_actions"]:
                recommendations["implementation_priority"].append("immediate_actions")
            if recommendations["short_term_improvements"]:
                recommendations["implementation_priority"].append("short_term_improvements")
            if recommendations["long_term_optimizations"]:
                recommendations["implementation_priority"].append("long_term_optimizations")

            return {
                "workflow_id": workflow_id,
                "recommendations": recommendations,
                "insights_count": len(insights),
                "patterns_count": len(patterns.get("patterns", [])),
                "generated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Optimization recommendations failed: {str(e)}")
            return {
                "workflow_id": workflow_id,
                "error": str(e),
                "recommendations": {
                    "immediate_actions": [],
                    "short_term_improvements": [],
                    "long_term_optimizations": [],
                    "estimated_impact": {},
                    "implementation_priority": []
                }
            }
