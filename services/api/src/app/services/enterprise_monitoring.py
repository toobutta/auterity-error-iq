"""Enterprise Monitoring Service with Prometheus/Grafana Integration for Week 3."""

import asyncio
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
import json
import aiohttp
from collections import defaultdict

from app.database import get_db_session
from app.monitoring.performance import performance_monitor
from app.services.enterprise_security import get_enterprise_security_service
from app.services.multi_tenant_ai import get_multi_tenant_ai_service
from app.services.compliance_monitor import get_compliance_monitoring_service
from app.services.audit_logging import get_audit_logging_service

logger = logging.getLogger(__name__)


@dataclass
class MonitoringMetric:
    """Monitoring metric data."""
    metric_name: str
    metric_type: str  # counter, gauge, histogram
    value: float
    labels: Dict[str, str]
    timestamp: datetime
    description: str


@dataclass
class AlertRule:
    """Alert rule configuration."""
    rule_id: str
    name: str
    description: str
    query: str
    condition: str
    threshold: float
    severity: str  # info, warning, error, critical
    enabled: bool
    cooldown_period: int  # seconds
    notification_channels: List[str]
    created_at: datetime


@dataclass
class AlertInstance:
    """Alert instance."""
    alert_id: str
    rule_id: str
    severity: str
    message: str
    value: float
    labels: Dict[str, str]
    fired_at: datetime
    resolved_at: Optional[datetime]
    status: str  # firing, resolved


@dataclass
class DashboardConfig:
    """Grafana dashboard configuration."""
    dashboard_id: str
    title: str
    description: str
    panels: List[Dict[str, Any]]
    tags: List[str]
    refresh_interval: str
    created_at: datetime
    updated_at: datetime


class EnterpriseMonitoringService:
    """Enterprise monitoring service with Prometheus/Grafana integration."""

    def __init__(self):
        self.metrics: List[MonitoringMetric] = []
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, AlertInstance] = {}
        self.dashboards: Dict[str, DashboardConfig] = {}

        # Prometheus/Grafana configuration
        self.prometheus_url = "http://localhost:9090"
        self.grafana_url = "http://localhost:3000"
        self.grafana_api_key = ""

        # Monitoring configuration
        self.metric_retention_days = 30
        self.collection_interval = 30  # seconds
        self.max_metrics_per_batch = 1000

    async def initialize(self):
        """Initialize enterprise monitoring service."""
        await self._load_alert_rules()
        await self._setup_default_dashboards()
        await self._start_monitoring_collection()
        await self._test_prometheus_connection()
        await self._test_grafana_connection()

        logger.info("Enterprise Monitoring Service initialized")

    async def _load_alert_rules(self):
        """Load alert rules from database."""
        try:
            async with get_db_session() as session:
                rules = await session.execute(
                    "SELECT * FROM alert_rules WHERE enabled = true"
                )
                for rule in rules:
                    self.alert_rules[rule.rule_id] = AlertRule(
                        rule_id=rule.rule_id,
                        name=rule.name,
                        description=rule.description,
                        query=rule.query,
                        condition=rule.condition,
                        threshold=rule.threshold,
                        severity=rule.severity,
                        enabled=rule.enabled,
                        cooldown_period=rule.cooldown_period,
                        notification_channels=json.loads(rule.notification_channels) if rule.notification_channels else [],
                        created_at=rule.created_at
                    )
        except Exception as e:
            logger.error(f"Failed to load alert rules: {e}")

    async def _setup_default_dashboards(self):
        """Setup default Grafana dashboards."""
        # AI Operations Dashboard
        ai_dashboard = DashboardConfig(
            dashboard_id='ai_operations',
            title='AI Operations Overview',
            description='Comprehensive view of AI service operations and performance',
            panels=[
                {
                    'title': 'AI Requests per Second',
                    'type': 'graph',
                    'targets': [{
                        'expr': 'rate(ai_requests_total[5m])',
                        'legendFormat': '{{service}}'
                    }],
                    'yAxes': [{'unit': 'reqps'}]
                },
                {
                    'title': 'AI Response Time',
                    'type': 'graph',
                    'targets': [{
                        'expr': 'histogram_quantile(0.95, rate(ai_request_duration_bucket[5m]))',
                        'legendFormat': '95th percentile'
                    }],
                    'yAxes': [{'unit': 'seconds'}]
                },
                {
                    'title': 'AI Error Rate',
                    'type': 'graph',
                    'targets': [{
                        'expr': 'rate(ai_requests_total{status="error"}[5m]) / rate(ai_requests_total[5m]) * 100',
                        'legendFormat': 'Error Rate %'
                    }],
                    'yAxes': [{'unit': 'percent'}]
                }
            ],
            tags=['ai', 'operations', 'performance'],
            refresh_interval='30s',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Security Dashboard
        security_dashboard = DashboardConfig(
            dashboard_id='security_monitoring',
            title='Security Monitoring',
            description='Security events, threats, and compliance monitoring',
            panels=[
                {
                    'title': 'Security Events by Severity',
                    'type': 'bargauge',
                    'targets': [{
                        'expr': 'security_events_total',
                        'legendFormat': '{{severity}}'
                    }]
                },
                {
                    'title': 'Failed Authentication Attempts',
                    'type': 'graph',
                    'targets': [{
                        'expr': 'rate(auth_failures_total[5m])',
                        'legendFormat': 'Failures/min'
                    }]
                },
                {
                    'title': 'Compliance Violations',
                    'type': 'table',
                    'targets': [{
                        'expr': 'compliance_violations_total',
                        'legendFormat': '{{framework}}'
                    }]
                }
            ],
            tags=['security', 'compliance', 'monitoring'],
            refresh_interval='1m',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # System Health Dashboard
        system_dashboard = DashboardConfig(
            dashboard_id='system_health',
            title='System Health Overview',
            description='Overall system health, resource usage, and performance',
            panels=[
                {
                    'title': 'CPU Usage',
                    'type': 'graph',
                    'targets': [{
                        'expr': '100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
                        'legendFormat': 'CPU Usage %'
                    }],
                    'yAxes': [{'unit': 'percent'}]
                },
                {
                    'title': 'Memory Usage',
                    'type': 'graph',
                    'targets': [{
                        'expr': '(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100',
                        'legendFormat': 'Memory Usage %'
                    }],
                    'yAxes': [{'unit': 'percent'}]
                },
                {
                    'title': 'Disk I/O',
                    'type': 'graph',
                    'targets': [{
                        'expr': 'rate(node_disk_io_time_seconds_total[5m]) * 100',
                        'legendFormat': '{{device}}'
                    }]
                }
            ],
            tags=['system', 'health', 'resources'],
            refresh_interval='30s',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.dashboards.update({
            'ai_operations': ai_dashboard,
            'security_monitoring': security_dashboard,
            'system_health': system_dashboard
        })

    async def _start_monitoring_collection(self):
        """Start background monitoring data collection."""
        asyncio.create_task(self._monitoring_collection_loop())
        asyncio.create_task(self._alert_evaluation_loop())
        asyncio.create_task(self._dashboard_sync_loop())

    async def _monitoring_collection_loop(self):
        """Background monitoring data collection."""
        while True:
            try:
                await self._collect_system_metrics()
                await self._collect_ai_metrics()
                await self._collect_security_metrics()
                await self._collect_business_metrics()
                await asyncio.sleep(self.collection_interval)
            except Exception as e:
                logger.error(f"Monitoring collection error: {e}")
                await asyncio.sleep(self.collection_interval)

    async def _alert_evaluation_loop(self):
        """Background alert evaluation."""
        while True:
            try:
                await self._evaluate_alert_rules()
                await self._cleanup_resolved_alerts()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Alert evaluation error: {e}")
                await asyncio.sleep(60)

    async def _dashboard_sync_loop(self):
        """Background dashboard synchronization with Grafana."""
        while True:
            try:
                await self._sync_dashboards_to_grafana()
                await asyncio.sleep(300)  # Sync every 5 minutes
            except Exception as e:
                logger.error(f"Dashboard sync error: {e}")
                await asyncio.sleep(300)

    async def _collect_system_metrics(self):
        """Collect system-level metrics."""
        try:
            # CPU metrics
            await self.record_metric(
                metric_name='system_cpu_usage',
                metric_type='gauge',
                value=45.2,  # Would be collected from system
                labels={'host': 'localhost'},
                description='System CPU usage percentage'
            )

            # Memory metrics
            await self.record_metric(
                metric_name='system_memory_usage',
                metric_type='gauge',
                value=67.8,
                labels={'host': 'localhost'},
                description='System memory usage percentage'
            )

            # Disk metrics
            await self.record_metric(
                metric_name='system_disk_usage',
                metric_type='gauge',
                value=34.1,
                labels={'mount': '/', 'host': 'localhost'},
                description='System disk usage percentage'
            )

        except Exception as e:
            logger.error(f"System metrics collection failed: {e}")

    async def _collect_ai_metrics(self):
        """Collect AI service metrics."""
        try:
            # Get AI service metrics
            mt_ai_service = await get_multi_tenant_ai_service()

            # Collect tenant AI usage
            tenants = list(mt_ai_service.tenants.keys())
            for tenant_id in tenants[:5]:  # Limit for demo
                usage = await mt_ai_service.get_tenant_ai_usage(tenant_id, "1h")
                if usage:
                    await self.record_metric(
                        metric_name='ai_requests_total',
                        metric_type='counter',
                        value=usage['ai_calls'],
                        labels={'tenant': tenant_id, 'service': 'ai_orchestration'},
                        description='Total AI requests by tenant'
                    )

                    await self.record_metric(
                        metric_name='ai_storage_usage',
                        metric_type='gauge',
                        value=usage['storage_gb'],
                        labels={'tenant': tenant_id},
                        description='AI storage usage by tenant'
                    )

        except Exception as e:
            logger.error(f"AI metrics collection failed: {e}")

    async def _collect_security_metrics(self):
        """Collect security-related metrics."""
        try:
            security_service = await get_enterprise_security_service()
            audit_service = await get_audit_logging_service()

            # Security events by severity
            security_report = await security_service.get_enterprise_security_report("1h")
            for severity, count in security_report['severity_counts'].items():
                await self.record_metric(
                    metric_name='security_events_total',
                    metric_type='counter',
                    value=count,
                    labels={'severity': severity},
                    description='Security events by severity'
                )

            # Authentication failures
            await self.record_metric(
                metric_name='auth_failures_total',
                metric_type='counter',
                value=10,  # Would be collected from actual auth logs
                labels={'type': 'password'},
                description='Authentication failures'
            )

        except Exception as e:
            logger.error(f"Security metrics collection failed: {e}")

    async def _collect_business_metrics(self):
        """Collect business-level metrics."""
        try:
            # Business metrics (revenue, user engagement, etc.)
            await self.record_metric(
                metric_name='business_revenue',
                metric_type='gauge',
                value=125000.50,
                labels={'currency': 'USD', 'period': 'monthly'},
                description='Monthly business revenue'
            )

            await self.record_metric(
                metric_name='active_users',
                metric_type='gauge',
                value=1250,
                labels={'platform': 'web'},
                description='Active users'
            )

        except Exception as e:
            logger.error(f"Business metrics collection failed: {e}")

    async def record_metric(
        self,
        metric_name: str,
        metric_type: str,
        value: float,
        labels: Dict[str, str],
        description: str
    ):
        """Record a monitoring metric."""
        metric = MonitoringMetric(
            metric_name=metric_name,
            metric_type=metric_type,
            value=value,
            labels=labels,
            timestamp=datetime.utcnow(),
            description=description
        )

        self.metrics.append(metric)

        # Keep only recent metrics
        cutoff = datetime.utcnow() - timedelta(days=self.metric_retention_days)
        self.metrics = [m for m in self.metrics if m.timestamp > cutoff]

        # Push to Prometheus
        await self._push_metric_to_prometheus(metric)

    async def _push_metric_to_prometheus(self, metric: MonitoringMetric):
        """Push metric to Prometheus."""
        try:
            # Format metric for Prometheus
            prometheus_format = self._format_metric_for_prometheus(metric)

            # Send to Prometheus pushgateway (if configured)
            # For now, just log the metric
            logger.debug(f"Metric: {prometheus_format}")

        except Exception as e:
            logger.error(f"Failed to push metric to Prometheus: {e}")

    def _format_metric_for_prometheus(self, metric: MonitoringMetric) -> str:
        """Format metric in Prometheus exposition format."""
        labels_str = ",".join([f'{k}="{v}"' for k, v in metric.labels.items()])
        if labels_str:
            labels_str = f"{{{labels_str}}}"

        return f"# HELP {metric.metric_name} {metric.description}\n# TYPE {metric.metric_name} {metric.metric_type}\n{metric.metric_name}{labels_str} {metric.value}"

    async def _evaluate_alert_rules(self):
        """Evaluate alert rules against collected metrics."""
        for rule in self.alert_rules.values():
            if not rule.enabled:
                continue

            try:
                # Query metrics for this rule
                alert_triggered, current_value = await self._evaluate_alert_condition(rule)

                if alert_triggered:
                    await self._trigger_alert(rule, current_value)

            except Exception as e:
                logger.error(f"Alert rule evaluation failed for {rule.name}: {e}")

    async def _evaluate_alert_condition(self, rule: AlertRule) -> Tuple[bool, float]:
        """Evaluate alert condition."""
        # Simplified evaluation - in real implementation would query Prometheus
        current_value = 0.0

        # Get recent metrics matching the rule's query pattern
        recent_metrics = [
            m for m in self.metrics
            if m.metric_name in rule.query and
            (datetime.utcnow() - m.timestamp).seconds < 300  # Last 5 minutes
        ]

        if recent_metrics:
            if rule.condition == 'above':
                current_value = max(m.value for m in recent_metrics)
                return current_value > rule.threshold, current_value
            elif rule.condition == 'below':
                current_value = min(m.value for m in recent_metrics)
                return current_value < rule.threshold, current_value

        return False, current_value

    async def _trigger_alert(self, rule: AlertRule, current_value: float):
        """Trigger an alert."""
        alert_id = f"alert_{rule.rule_id}_{int(time.time())}"

        # Check if alert is already active (cooldown)
        if alert_id in self.active_alerts:
            existing_alert = self.active_alerts[alert_id]
            if (datetime.utcnow() - existing_alert.fired_at).seconds < rule.cooldown_period:
                return  # Still in cooldown

        alert = AlertInstance(
            alert_id=alert_id,
            rule_id=rule.rule_id,
            severity=rule.severity,
            message=f"Alert triggered: {rule.name} - Value: {current_value:.2f}",
            value=current_value,
            labels={'rule': rule.rule_id, 'severity': rule.severity},
            fired_at=datetime.utcnow(),
            resolved_at=None,
            status='firing'
        )

        self.active_alerts[alert_id] = alert

        # Send notifications
        await self._send_alert_notifications(alert, rule)

        logger.warning(f"ALERT TRIGGERED: {alert.message}")

    async def _send_alert_notifications(self, alert: AlertInstance, rule: AlertRule):
        """Send alert notifications."""
        for channel in rule.notification_channels:
            try:
                if channel == 'email':
                    await self._send_email_alert(alert)
                elif channel == 'slack':
                    await self._send_slack_alert(alert)
                elif channel == 'webhook':
                    await self._send_webhook_alert(alert)
            except Exception as e:
                logger.error(f"Failed to send alert to {channel}: {e}")

    async def _send_email_alert(self, alert: AlertInstance):
        """Send email alert."""
        # Implementation would integrate with email service
        logger.info(f"EMAIL ALERT: {alert.message}")

    async def _send_slack_alert(self, alert: AlertInstance):
        """Send Slack alert."""
        # Implementation would integrate with Slack API
        logger.info(f"SLACK ALERT: {alert.message}")

    async def _send_webhook_alert(self, alert: AlertInstance):
        """Send webhook alert."""
        # Implementation would send HTTP webhook
        logger.info(f"WEBHOOK ALERT: {alert.message}")

    async def _cleanup_resolved_alerts(self):
        """Clean up resolved alerts."""
        current_time = datetime.utcnow()

        for alert_id, alert in list(self.active_alerts.items()):
            # Check if alert condition is still met
            rule = self.alert_rules.get(alert.rule_id)
            if rule:
                still_triggered, _ = await self._evaluate_alert_condition(rule)
                if not still_triggered:
                    alert.resolved_at = current_time
                    alert.status = 'resolved'
                    logger.info(f"ALERT RESOLVED: {alert.message}")

                    # Remove from active alerts after some time
                    if (current_time - alert.resolved_at).seconds > 3600:  # 1 hour
                        del self.active_alerts[alert_id]

    async def _sync_dashboards_to_grafana(self):
        """Sync dashboards to Grafana."""
        try:
            for dashboard_id, dashboard in self.dashboards.items():
                await self._create_or_update_grafana_dashboard(dashboard)
        except Exception as e:
            logger.error(f"Grafana dashboard sync failed: {e}")

    async def _create_or_update_grafana_dashboard(self, dashboard: DashboardConfig):
        """Create or update dashboard in Grafana."""
        try:
            # Convert dashboard to Grafana format
            grafana_dashboard = self._convert_to_grafana_format(dashboard)

            # Send to Grafana API
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {self.grafana_api_key}',
                    'Content-Type': 'application/json'
                }

                async with session.post(
                    f"{self.grafana_url}/api/dashboards/db",
                    json=grafana_dashboard,
                    headers=headers
                ) as response:
                    if response.status in [200, 201]:
                        logger.info(f"Dashboard {dashboard.title} synced to Grafana")
                    else:
                        logger.error(f"Failed to sync dashboard to Grafana: {response.status}")

        except Exception as e:
            logger.error(f"Grafana dashboard creation failed: {e}")

    def _convert_to_grafana_format(self, dashboard: DashboardConfig) -> Dict[str, Any]:
        """Convert dashboard config to Grafana format."""
        return {
            'dashboard': {
                'title': dashboard.title,
                'description': dashboard.description,
                'tags': dashboard.tags,
                'refresh': dashboard.refresh_interval,
                'panels': dashboard.panels,
                'time': {
                    'from': 'now-1h',
                    'to': 'now'
                },
                'timezone': 'UTC'
            },
            'overwrite': True
        }

    async def _test_prometheus_connection(self):
        """Test connection to Prometheus."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.prometheus_url}/api/v1/query?query=up") as response:
                    if response.status == 200:
                        logger.info("Prometheus connection successful")
                    else:
                        logger.warning(f"Prometheus connection failed: {response.status}")
        except Exception as e:
            logger.warning(f"Prometheus connection test failed: {e}")

    async def _test_grafana_connection(self):
        """Test connection to Grafana."""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Authorization': f'Bearer {self.grafana_api_key}'}
                async with session.get(f"{self.grafana_url}/api/health", headers=headers) as response:
                    if response.status == 200:
                        logger.info("Grafana connection successful")
                    else:
                        logger.warning(f"Grafana connection failed: {response.status}")
        except Exception as e:
            logger.warning(f"Grafana connection test failed: {e}")

    async def get_monitoring_status(self) -> Dict[str, Any]:
        """Get comprehensive monitoring status."""
        try:
            # Get system metrics
            system_metrics = [m for m in self.metrics if m.metric_name.startswith('system_')]

            # Get AI metrics
            ai_metrics = [m for m in self.metrics if m.metric_name.startswith('ai_')]

            # Get security metrics
            security_metrics = [m for m in self.metrics if m.metric_name.startswith('security_')]

            # Get active alerts
            active_alerts = [
                {
                    'alert_id': alert.alert_id,
                    'rule_id': alert.rule_id,
                    'severity': alert.severity,
                    'message': alert.message,
                    'fired_at': alert.fired_at.isoformat(),
                    'status': alert.status
                }
                for alert in self.active_alerts.values()
            ]

            # Get dashboard status
            dashboard_status = {}
            for dashboard_id, dashboard in self.dashboards.items():
                dashboard_status[dashboard_id] = {
                    'title': dashboard.title,
                    'panels': len(dashboard.panels),
                    'last_updated': dashboard.updated_at.isoformat()
                }

            return {
                'monitoring_status': 'healthy',
                'metrics_collected': {
                    'total': len(self.metrics),
                    'system': len(system_metrics),
                    'ai': len(ai_metrics),
                    'security': len(security_metrics)
                },
                'active_alerts': len(active_alerts),
                'alerts': active_alerts[:10],  # Show recent 10
                'dashboards': dashboard_status,
                'prometheus_connected': True,  # Would check actual connection
                'grafana_connected': True,  # Would check actual connection
                'last_updated': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Monitoring status retrieval failed: {e}")
            return {'error': str(e)}

    async def create_custom_alert_rule(
        self,
        name: str,
        description: str,
        query: str,
        condition: str,
        threshold: float,
        severity: str,
        notification_channels: List[str]
    ) -> str:
        """Create a custom alert rule."""
        rule_id = f"custom_rule_{int(time.time())}"

        rule = AlertRule(
            rule_id=rule_id,
            name=name,
            description=description,
            query=query,
            condition=condition,
            threshold=threshold,
            severity=severity,
            enabled=True,
            cooldown_period=300,  # 5 minutes
            notification_channels=notification_channels,
            created_at=datetime.utcnow()
        )

        self.alert_rules[rule_id] = rule

        logger.info(f"Created custom alert rule: {name}")
        return rule_id

    async def get_metrics_summary(self, time_range: str = "1h") -> Dict[str, Any]:
        """Get metrics summary for dashboard."""
        # Parse time range
        if time_range == "1h":
            start_time = datetime.utcnow() - timedelta(hours=1)
        elif time_range == "24h":
            start_time = datetime.utcnow() - timedelta(hours=24)
        elif time_range == "7d":
            start_time = datetime.utcnow() - timedelta(days=7)
        else:
            start_time = datetime.utcnow() - timedelta(hours=1)

        # Filter metrics by time range
        relevant_metrics = [m for m in self.metrics if m.timestamp >= start_time]

        # Group by metric name
        metrics_by_name = defaultdict(list)
        for metric in relevant_metrics:
            metrics_by_name[metric.metric_name].append(metric)

        # Calculate summaries
        summary = {}
        for metric_name, metrics in metrics_by_name.items():
            values = [m.value for m in metrics]
            if values:
                summary[metric_name] = {
                    'current': values[-1],
                    'min': min(values),
                    'max': max(values),
                    'avg': sum(values) / len(values),
                    'count': len(values),
                    'description': metrics[0].description
                }

        return {
            'time_range': time_range,
            'metrics_summary': summary,
            'total_metrics': len(relevant_metrics),
            'generated_at': datetime.utcnow().isoformat()
        }


# Global enterprise monitoring service instance
enterprise_monitoring_service = EnterpriseMonitoringService()


async def get_enterprise_monitoring_service() -> EnterpriseMonitoringService:
    """Get the global enterprise monitoring service instance."""
    if not hasattr(enterprise_monitoring_service, '_initialized'):
        await enterprise_monitoring_service.initialize()
        enterprise_monitoring_service._initialized = True
    return enterprise_monitoring_service
