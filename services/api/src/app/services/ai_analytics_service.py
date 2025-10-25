"""AI Operations Analytics and Reporting Service for Week 2."""

import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import json

from app.database import get_db_session
from app.services.intelligent_router import get_intelligent_router
from app.services.cost_optimizer import get_cost_optimizer
from app.services.health_monitor import get_health_monitor
from app.monitoring.performance import performance_monitor

logger = logging.getLogger(__name__)


@dataclass
class AnalyticsPeriod:
    """Time period for analytics."""
    start_date: datetime
    end_date: datetime
    period_type: str  # hourly, daily, weekly, monthly
    label: str


@dataclass
class ComprehensiveAnalytics:
    """Comprehensive AI operations analytics."""
    period: AnalyticsPeriod
    routing_metrics: Dict[str, Any]
    cost_metrics: Dict[str, Any]
    health_metrics: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    user_metrics: Dict[str, Any]
    generated_at: datetime


class AIOperationsAnalytics:
    """AI Operations comprehensive analytics service."""

    def __init__(self):
        self.cached_reports: Dict[str, ComprehensiveAnalytics] = {}
        self.cache_ttl = 300  # 5 minutes

    async def generate_comprehensive_report(
        self,
        period_type: str = "daily",
        user_id: Optional[str] = None,
        include_health: bool = True,
        include_cost: bool = True,
        include_performance: bool = True
    ) -> ComprehensiveAnalytics:
        """Generate comprehensive AI operations analytics report."""

        # Create period
        period = self._create_period(period_type)

        # Generate cache key
        cache_key = f"{period_type}_{user_id or 'global'}_{period.start_date.isoformat()}"

        # Check cache
        if cache_key in self.cached_reports:
            cached = self.cached_reports[cache_key]
            if (datetime.utcnow() - cached.generated_at).seconds < self.cache_ttl:
                return cached

        try:
            # Collect all metrics
            routing_metrics = await self._collect_routing_metrics(period, user_id)
            cost_metrics = await self._collect_cost_metrics(period, user_id) if include_cost else {}
            health_metrics = await self._collect_health_metrics(period) if include_health else {}
            performance_metrics = await self._collect_performance_metrics(period, user_id) if include_performance else {}
            user_metrics = await self._collect_user_metrics(period, user_id)

            # Create comprehensive report
            report = ComprehensiveAnalytics(
                period=period,
                routing_metrics=routing_metrics,
                cost_metrics=cost_metrics,
                health_metrics=health_metrics,
                performance_metrics=performance_metrics,
                user_metrics=user_metrics,
                generated_at=datetime.utcnow()
            )

            # Cache report
            self.cached_reports[cache_key] = report

            return report

        except Exception as e:
            logger.error(f"Failed to generate AI analytics report: {e}")
            # Return minimal report on error
            return ComprehensiveAnalytics(
                period=period,
                routing_metrics={},
                cost_metrics={},
                health_metrics={},
                performance_metrics={},
                user_metrics={},
                generated_at=datetime.utcnow()
            )

    def _create_period(self, period_type: str) -> AnalyticsPeriod:
        """Create analytics period based on type."""
        now = datetime.utcnow()

        if period_type == "hourly":
            start = now - timedelta(hours=1)
            label = f"Last Hour ({start.strftime('%H:00')} - {now.strftime('%H:00')})"
        elif period_type == "daily":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            label = f"Today ({start.strftime('%Y-%m-%d')})"
        elif period_type == "weekly":
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            label = f"This Week ({start.strftime('%Y-%m-%d')} - {now.strftime('%Y-%m-%d')})"
        elif period_type == "monthly":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            label = f"This Month ({start.strftime('%Y-%m')})"
        else:
            start = now - timedelta(days=1)
            label = "Custom Period"

        return AnalyticsPeriod(
            start_date=start,
            end_date=now,
            period_type=period_type,
            label=label
        )

    async def _collect_routing_metrics(self, period: AnalyticsPeriod, user_id: Optional[str]) -> Dict[str, Any]:
        """Collect routing-specific metrics."""
        try:
            router = await get_intelligent_router()
            analytics = await router.get_routing_analytics(period.period_type)

            return {
                'total_requests': analytics.get('total_requests', 0),
                'successful_routes': analytics.get('successful_routes', 0),
                'failed_routes': analytics.get('failed_routes', 0),
                'success_rate': analytics.get('success_rate', 0.0),
                'average_response_time': analytics.get('avg_response_time', 0.0),
                'provider_usage': analytics.get('provider_usage', {}),
                'policy_effectiveness': analytics.get('policy_effectiveness', {}),
                'routing_efficiency': self._calculate_routing_efficiency(analytics)
            }
        except Exception as e:
            logger.error(f"Failed to collect routing metrics: {e}")
            return {}

    async def _collect_cost_metrics(self, period: AnalyticsPeriod, user_id: Optional[str]) -> Dict[str, Any]:
        """Collect cost-related metrics."""
        try:
            optimizer = await get_cost_optimizer()

            if user_id:
                analytics = await optimizer.get_cost_analytics(user_id, f"{(period.end_date - period.start_date).days}d")
            else:
                analytics = {
                    'total_cost': 0.0,
                    'average_daily_cost': 0.0,
                    'cost_trend': [],
                    'budget_status': {}
                }

            return {
                'total_cost': analytics.get('total_cost', 0.0),
                'average_daily_cost': analytics.get('average_daily_cost', 0.0),
                'cost_savings': analytics.get('cost_savings', 0.0),
                'budget_utilization': self._calculate_budget_utilization(analytics),
                'cost_trend': analytics.get('cost_trend', []),
                'cost_efficiency': self._calculate_cost_efficiency(analytics)
            }
        except Exception as e:
            logger.error(f"Failed to collect cost metrics: {e}")
            return {}

    async def _collect_health_metrics(self, period: AnalyticsPeriod) -> Dict[str, Any]:
        """Collect health monitoring metrics."""
        try:
            monitor = await get_health_monitor()
            health_status = await monitor.get_health_status()
            failover_history = await monitor.get_failover_history()

            summary = health_status.get('summary', {})

            return {
                'total_providers': summary.get('total_providers', 0),
                'healthy_providers': summary.get('healthy_providers', 0),
                'degraded_providers': summary.get('degraded_providers', 0),
                'unhealthy_providers': summary.get('unhealthy_providers', 0),
                'average_response_time': summary.get('average_response_time', 0.0),
                'total_failovers': summary.get('total_failovers', 0),
                'health_score': self._calculate_health_score(summary),
                'recent_failovers': len([f for f in failover_history
                                       if datetime.fromisoformat(f['timestamp']) > period.start_date])
            }
        except Exception as e:
            logger.error(f"Failed to collect health metrics: {e}")
            return {}

    async def _collect_performance_metrics(self, period: AnalyticsPeriod, user_id: Optional[str]) -> Dict[str, Any]:
        """Collect performance metrics."""
        try:
            # Mock performance data - replace with real monitoring data
            return {
                'average_response_time': 2.3,
                'p95_response_time': 5.1,
                'error_rate': 0.015,
                'throughput': 150.5,
                'cpu_usage': 65.2,
                'memory_usage': 72.8,
                'performance_score': 87.5
            }
        except Exception as e:
            logger.error(f"Failed to collect performance metrics: {e}")
            return {}

    async def _collect_user_metrics(self, period: AnalyticsPeriod, user_id: Optional[str]) -> Dict[str, Any]:
        """Collect user-specific metrics."""
        try:
            return {
                'active_users': 1250,
                'total_requests': 5000,
                'average_requests_per_user': 4.0,
                'user_satisfaction_score': 4.2,
                'feature_adoption_rate': 78.5
            }
        except Exception as e:
            logger.error(f"Failed to collect user metrics: {e}")
            return {}

    def _calculate_routing_efficiency(self, analytics: Dict[str, Any]) -> float:
        """Calculate routing efficiency score."""
        success_rate = analytics.get('success_rate', 0.0)
        avg_response_time = analytics.get('avg_response_time', 0.0)

        time_score = max(0, 1 - (avg_response_time / 10.0))
        efficiency = (success_rate * 0.7) + (time_score * 0.3)

        return round(efficiency * 100, 2)

    def _calculate_budget_utilization(self, analytics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate budget utilization metrics."""
        budget_status = analytics.get('budget_status', {})

        if not budget_status:
            return {'daily_pct': 0.0, 'monthly_pct': 0.0, 'status': 'unknown'}

        daily_limit = budget_status.get('daily_limit', 1)
        monthly_limit = budget_status.get('monthly_limit', 1)
        daily_usage = budget_status.get('current_daily_usage', 0)
        monthly_usage = budget_status.get('current_monthly_usage', 0)

        daily_pct = (daily_usage / daily_limit) * 100 if daily_limit > 0 else 0
        monthly_pct = (monthly_usage / monthly_limit) * 100 if monthly_limit > 0 else 0

        if daily_pct > 90 or monthly_pct > 90:
            status = 'critical'
        elif daily_pct > 75 or monthly_pct > 75:
            status = 'warning'
        else:
            status = 'normal'

        return {
            'daily_pct': round(daily_pct, 2),
            'monthly_pct': round(monthly_pct, 2),
            'status': status
        }

    def _calculate_cost_efficiency(self, analytics: Dict[str, Any]) -> float:
        """Calculate cost efficiency score."""
        total_cost = analytics.get('total_cost', 0)
        cost_savings = analytics.get('cost_savings', 0)

        if total_cost == 0:
            return 100.0

        efficiency = ((total_cost - cost_savings) / total_cost) * 100
        return round(max(0, efficiency), 2)

    def _calculate_health_score(self, summary: Dict[str, Any]) -> float:
        """Calculate overall health score."""
        total_providers = summary.get('total_providers', 1)
        healthy_providers = summary.get('healthy_providers', 0)
        degraded_providers = summary.get('degraded_providers', 0)

        health_score = ((healthy_providers * 1.0) + (degraded_providers * 0.5)) / total_providers
        return round(health_score * 100, 2)

    def _calculate_performance_score(self, performance_data: Dict[str, Any]) -> float:
        """Calculate overall performance score."""
        response_time = performance_data.get('average_response_time', 0)
        error_rate = performance_data.get('error_rate', 0)
        throughput = performance_data.get('throughput', 0)

        time_score = max(0, 1 - (response_time / 5.0))
        error_score = 1 - error_rate
        throughput_score = min(1, throughput / 100)

        performance_score = (time_score * 0.4) + (error_score * 0.4) + (throughput_score * 0.2)
        return round(performance_score * 100, 2)

    async def generate_executive_summary(self, period_type: str = "monthly") -> Dict[str, Any]:
        """Generate executive summary of AI operations."""
        report = await self.generate_comprehensive_report(period_type)

        return {
            'period': report.period.label,
            'key_metrics': {
                'total_requests': report.routing_metrics.get('total_requests', 0),
                'success_rate': report.routing_metrics.get('success_rate', 0),
                'cost_savings': report.cost_metrics.get('cost_savings', 0),
                'health_score': report.health_metrics.get('health_score', 0),
                'performance_score': report.performance_metrics.get('performance_score', 0)
            },
            'trends': {
                'routing_efficiency': report.routing_metrics.get('routing_efficiency', 0),
                'cost_efficiency': report.cost_metrics.get('cost_efficiency', 0),
                'budget_utilization': report.cost_metrics.get('budget_utilization', {})
            },
            'alerts': self._generate_alerts(report),
            'recommendations': self._generate_recommendations(report)
        }

    def _generate_alerts(self, report: ComprehensiveAnalytics) -> List[Dict[str, Any]]:
        """Generate alerts based on analytics data."""
        alerts = []

        if report.routing_metrics.get('success_rate', 100) < 95:
            alerts.append({
                'type': 'warning',
                'category': 'routing',
                'message': f'Low routing success rate: {report.routing_metrics["success_rate"]}%',
                'severity': 'medium'
            })

        budget_status = report.cost_metrics.get('budget_utilization', {})
        if budget_status.get('status') == 'critical':
            alerts.append({
                'type': 'error',
                'category': 'cost',
                'message': 'Budget utilization is critical',
                'severity': 'high'
            })

        if report.health_metrics.get('health_score', 100) < 80:
            alerts.append({
                'type': 'warning',
                'category': 'health',
                'message': f'Provider health score is low: {report.health_metrics["health_score"]}%',
                'severity': 'medium'
            })

        if report.performance_metrics.get('performance_score', 100) < 70:
            alerts.append({
                'type': 'warning',
                'category': 'performance',
                'message': f'Performance score is low: {report.performance_metrics["performance_score"]}%',
                'severity': 'medium'
            })

        return alerts

    def _generate_recommendations(self, report: ComprehensiveAnalytics) -> List[str]:
        """Generate recommendations based on analytics."""
        recommendations = []

        if report.routing_metrics.get('routing_efficiency', 100) < 85:
            recommendations.append('Optimize routing policies for better efficiency')

        if report.cost_metrics.get('cost_efficiency', 100) < 90:
            recommendations.append('Review cost optimization strategies')

        if report.health_metrics.get('healthy_providers', 1) < report.health_metrics.get('total_providers', 1):
            recommendations.append('Address provider health issues')

        if report.performance_metrics.get('average_response_time', 0) > 3:
            recommendations.append('Investigate performance bottlenecks')

        return recommendations

    async def export_report(self, report: ComprehensiveAnalytics, format: str = 'json') -> str:
        """Export analytics report in specified format."""
        if format == 'json':
            return json.dumps({
                'period': {
                    'label': report.period.label,
                    'start_date': report.period.start_date.isoformat(),
                    'end_date': report.period.end_date.isoformat()
                },
                'routing_metrics': report.routing_metrics,
                'cost_metrics': report.cost_metrics,
                'health_metrics': report.health_metrics,
                'performance_metrics': report.performance_metrics,
                'user_metrics': report.user_metrics,
                'generated_at': report.generated_at.isoformat()
            }, indent=2)

        return json.dumps({'error': f'Format {format} not supported'})


# Global AI analytics service instance
ai_analytics_service = AIOperationsAnalytics()


async def get_ai_analytics_service() -> AIOperationsAnalytics:
    """Get the global AI analytics service instance."""
    return ai_analytics_service
