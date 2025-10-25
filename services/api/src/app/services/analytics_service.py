"""Advanced analytics and reporting service."""

import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from uuid import uuid4
import pandas as pd
import numpy as np

from sqlalchemy import func, and_, or_, desc, text
from sqlalchemy.orm import Session

from app.middleware.logging import get_logger
from app.database import get_db
from app.models.analytics import (
    AnalyticsEvent,
    PerformanceMetric,
    UserSession,
    ReportTemplate,
    ScheduledReport,
    ReportExecution,
    DashboardAnalytics,
    BusinessMetric,
)
from app.models.user import User

logger = get_logger(__name__)


class AnalyticsService:
    """Comprehensive analytics and reporting service."""

    def __init__(self, db: Session):
        self.db = db

    async def track_event(
        self,
        event_type: str,
        event_category: str,
        event_action: str,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        session_id: Optional[str] = None,
        event_label: Optional[str] = None,
        event_value: Optional[float] = None,
        properties: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Track a user or system event."""

        event = AnalyticsEvent(
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=session_id or str(uuid4()),
            event_type=event_type,
            event_category=event_category,
            event_action=event_action,
            event_label=event_label,
            event_value=event_value,
            properties=properties or {},
            page_url=context.get('page_url') if context else None,
            page_title=context.get('page_title') if context else None,
            referrer=context.get('referrer') if context else None,
            user_agent=context.get('user_agent') if context else None,
            ip_address=context.get('ip_address') if context else None,
            device_type=context.get('device_type') if context else None,
            browser=context.get('browser') if context else None,
            os=context.get('os') if context else None,
            screen_resolution=context.get('screen_resolution') if context else None,
        )

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        logger.info(f"Tracked event: {event_type}.{event_action} for user {user_id}")
        return str(event.id)

    async def track_performance_metric(
        self,
        metric_type: str,
        metric_name: str,
        value: float,
        unit: Optional[str] = None,
        service_name: Optional[str] = None,
        endpoint: Optional[str] = None,
        tags: Optional[Dict[str, Any]] = None
    ) -> str:
        """Track a performance metric."""

        # Determine time bucket (5-minute intervals)
        now = datetime.utcnow()
        bucket_start = now.replace(minute=now.minute - (now.minute % 5), second=0, microsecond=0)
        bucket_end = bucket_start + timedelta(minutes=5)

        metric = PerformanceMetric(
            metric_type=metric_type,
            metric_name=metric_name,
            metric_value=value,
            unit=unit,
            service_name=service_name,
            endpoint=endpoint,
            time_bucket="5m",
            bucket_start=bucket_start,
            bucket_end=bucket_end,
            tags=tags or {},
        )

        self.db.add(metric)
        self.db.commit()
        self.db.refresh(metric)

        return str(metric.id)

    async def start_user_session(
        self,
        user_id: Optional[str],
        tenant_id: str,
        session_id: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Start tracking a user session."""

        session = UserSession(
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=session_id,
            ip_address=context.get('ip_address') if context else None,
            user_agent=context.get('user_agent') if context else None,
            device_type=context.get('device_type') if context else None,
            browser=context.get('browser') if context else None,
            os=context.get('os') if context else None,
            screen_resolution=context.get('screen_resolution') if context else None,
            country=context.get('country') if context else None,
            region=context.get('region') if context else None,
            city=context.get('city') if context else None,
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return str(session.id)

    async def update_user_session(
        self,
        session_id: str,
        page_views: Optional[int] = None,
        events_count: Optional[int] = None,
        duration: Optional[int] = None
    ) -> bool:
        """Update user session metrics."""

        session = self.db.query(UserSession).filter(
            UserSession.session_id == session_id
        ).first()

        if not session:
            return False

        if page_views is not None:
            session.page_views = page_views
        if events_count is not None:
            session.events_count = events_count
        if duration is not None:
            session.session_duration = duration

        session.last_activity = datetime.utcnow()
        self.db.commit()

        return True

    async def end_user_session(self, session_id: str) -> bool:
        """End a user session."""

        session = self.db.query(UserSession).filter(
            UserSession.session_id == session_id
        ).first()

        if not session:
            return False

        session.ended_at = datetime.utcnow()

        # Calculate final metrics
        if session.started_at and session.ended_at:
            duration = (session.ended_at - session.started_at).total_seconds()
            session.session_duration = int(duration)

        self.db.commit()
        return True

    async def get_user_analytics(
        self,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        event_types: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get comprehensive user analytics."""

        query = self.db.query(AnalyticsEvent)

        if user_id:
            query = query.filter(AnalyticsEvent.user_id == user_id)
        if tenant_id:
            query = query.filter(AnalyticsEvent.tenant_id == tenant_id)
        if date_from:
            query = query.filter(AnalyticsEvent.timestamp >= date_from)
        if date_to:
            query = query.filter(AnalyticsEvent.timestamp <= date_to)
        if event_types:
            query = query.filter(AnalyticsEvent.event_type.in_(event_types))

        events = query.all()

        # Aggregate analytics
        total_events = len(events)
        event_types_count = {}
        event_categories_count = {}
        page_views = []
        user_journey = []

        for event in events:
            # Count event types
            event_types_count[event.event_type] = event_types_count.get(event.event_type, 0) + 1
            event_categories_count[event.event_category] = event_categories_count.get(event.event_category, 0) + 1

            # Track page views
            if event.event_type == 'page_view' and event.page_url:
                page_views.append({
                    'url': event.page_url,
                    'title': event.page_title,
                    'timestamp': event.timestamp.isoformat()
                })

            # Build user journey
            user_journey.append({
                'timestamp': event.timestamp.isoformat(),
                'event_type': event.event_type,
                'action': event.event_action,
                'page': event.page_url
            })

        return {
            'total_events': total_events,
            'event_types': event_types_count,
            'event_categories': event_categories_count,
            'page_views': page_views,
            'user_journey': user_journey,
            'time_range': {
                'from': date_from.isoformat() if date_from else None,
                'to': date_to.isoformat() if date_to else None
            }
        }

    async def get_performance_analytics(
        self,
        service_name: Optional[str] = None,
        metric_types: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get performance analytics and metrics."""

        query = self.db.query(PerformanceMetric)

        if service_name:
            query = query.filter(PerformanceMetric.service_name == service_name)
        if metric_types:
            query = query.filter(PerformanceMetric.metric_type.in_(metric_types))
        if date_from:
            query = query.filter(PerformanceMetric.bucket_start >= date_from)
        if date_to:
            query = query.filter(PerformanceMetric.bucket_end <= date_to)

        metrics = query.order_by(PerformanceMetric.bucket_start).all()

        # Aggregate by metric type and time
        aggregated_metrics = {}
        time_series = {}

        for metric in metrics:
            metric_key = f"{metric.metric_type}.{metric.metric_name}"

            if metric_key not in aggregated_metrics:
                aggregated_metrics[metric_key] = {
                    'type': metric.metric_type,
                    'name': metric.metric_name,
                    'unit': metric.unit,
                    'values': [],
                    'avg': 0,
                    'min': float('inf'),
                    'max': float('-inf'),
                    'count': 0
                }

            # Update aggregations
            agg = aggregated_metrics[metric_key]
            agg['values'].append(metric.metric_value)
            agg['count'] += 1
            agg['min'] = min(agg['min'], metric.metric_value)
            agg['max'] = max(agg['max'], metric.metric_value)

            # Time series data
            bucket_key = metric.bucket_start.isoformat()
            if bucket_key not in time_series:
                time_series[bucket_key] = {}
            time_series[bucket_key][metric_key] = metric.metric_value

        # Calculate averages
        for agg in aggregated_metrics.values():
            if agg['values']:
                agg['avg'] = sum(agg['values']) / len(agg['values'])
            del agg['values']  # Remove raw values for cleaner response

        return {
            'metrics': aggregated_metrics,
            'time_series': time_series,
            'summary': {
                'total_metrics': len(metrics),
                'unique_metric_types': len(set(m.metric_type for m in metrics)),
                'time_range': {
                    'from': date_from.isoformat() if date_from else None,
                    'to': date_to.isoformat() if date_to else None
                }
            }
        }

    async def get_dashboard_analytics(
        self,
        dashboard_id: str,
        user_id: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get dashboard-specific analytics."""

        query = self.db.query(DashboardAnalytics).filter(
            DashboardAnalytics.dashboard_id == dashboard_id
        )

        if user_id:
            query = query.filter(DashboardAnalytics.user_id == user_id)
        if date_from:
            query = query.filter(DashboardAnalytics.last_viewed_at >= date_from)
        if date_to:
            query = query.filter(DashboardAnalytics.last_viewed_at <= date_to)

        analytics = query.all()

        if not analytics:
            return {
                'dashboard_id': dashboard_id,
                'total_views': 0,
                'total_edits': 0,
                'unique_users': 0,
                'avg_session_time': 0,
                'most_viewed_widgets': [],
                'usage_over_time': {}
            }

        # Aggregate data
        total_views = sum(a.view_count for a in analytics)
        total_edits = sum(a.edit_count for a in analytics)
        total_view_time = sum(a.total_view_time for a in analytics)
        unique_users = len(set(str(a.user_id) for a in analytics if a.user_id))

        avg_session_time = total_view_time / total_views if total_views > 0 else 0

        # Aggregate widget interactions
        widget_interactions = {}
        for analytics_record in analytics:
            for widget_id, count in analytics_record.widget_interactions.items():
                widget_interactions[widget_id] = widget_interactions.get(widget_id, 0) + count

        most_viewed_widgets = sorted(
            widget_interactions.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        return {
            'dashboard_id': dashboard_id,
            'total_views': total_views,
            'total_edits': total_edits,
            'unique_users': unique_users,
            'avg_session_time': avg_session_time,
            'most_viewed_widgets': most_viewed_widgets,
            'usage_over_time': {},  # Could be populated with time-series data
            'time_range': {
                'from': date_from.isoformat() if date_from else None,
                'to': date_to.isoformat() if date_to else None
            }
        }

    async def create_report_template(
        self,
        name: str,
        description: str,
        report_type: str,
        config: Dict[str, Any],
        filters: Dict[str, Any],
        chart_config: Dict[str, Any],
        layout_config: Dict[str, Any],
        created_by: str,
        tenant_id: str,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """Create a report template."""

        template = ReportTemplate(
            name=name,
            description=description,
            report_type=report_type,
            config=config,
            filters=filters,
            chart_config=chart_config,
            layout_config=layout_config,
            category=category,
            tags=tags or [],
            created_by=created_by,
            tenant_id=tenant_id
        )

        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)

        return str(template.id)

    async def generate_report(
        self,
        template_id: str,
        parameters: Dict[str, Any],
        generated_by: str,
        format: str = 'json'
    ) -> Dict[str, Any]:
        """Generate a report from a template."""

        template = self.db.query(ReportTemplate).filter(
            ReportTemplate.id == template_id
        ).first()

        if not template:
            raise ValueError(f"Template {template_id} not found")

        # Create execution record
        execution = ReportExecution(
            template_id=template_id,
            status='running',
            parameters=parameters,
            generated_by=generated_by,
            started_at=datetime.utcnow()
        )

        self.db.add(execution)
        self.db.commit()

        try:
            # Generate report data based on template type
            if template.report_type == 'user_analytics':
                report_data = await self._generate_user_analytics_report(template, parameters)
            elif template.report_type == 'performance':
                report_data = await self._generate_performance_report(template, parameters)
            elif template.report_type == 'dashboard':
                report_data = await self._generate_dashboard_report(template, parameters)
            else:
                report_data = await self._generate_custom_report(template, parameters)

            # Update execution record
            execution.status = 'success'
            execution.completed_at = datetime.utcnow()
            execution.execution_time = (execution.completed_at - execution.started_at).total_seconds()
            execution.report_url = f"/reports/{execution.id}.{format}"

            self.db.commit()

            return {
                'execution_id': str(execution.id),
                'status': 'success',
                'data': report_data,
                'format': format,
                'generated_at': execution.completed_at.isoformat()
            }

        except Exception as e:
            execution.status = 'failed'
            execution.error_message = str(e)
            execution.completed_at = datetime.utcnow()
            self.db.commit()

            raise e

    async def _generate_user_analytics_report(
        self,
        template: ReportTemplate,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate user analytics report."""

        date_from = parameters.get('date_from')
        date_to = parameters.get('date_to')
        user_id = parameters.get('user_id')

        analytics = await self.get_user_analytics(
            user_id=user_id,
            tenant_id=str(template.tenant_id),
            date_from=date_from,
            date_to=date_to
        )

        return {
            'title': f"User Analytics Report - {template.name}",
            'generated_at': datetime.utcnow().isoformat(),
            'parameters': parameters,
            'data': analytics
        }

    async def _generate_performance_report(
        self,
        template: ReportTemplate,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate performance analytics report."""

        service_name = parameters.get('service_name')
        date_from = parameters.get('date_from')
        date_to = parameters.get('date_to')

        analytics = await self.get_performance_analytics(
            service_name=service_name,
            date_from=date_from,
            date_to=date_to
        )

        return {
            'title': f"Performance Analytics Report - {template.name}",
            'generated_at': datetime.utcnow().isoformat(),
            'parameters': parameters,
            'data': analytics
        }

    async def _generate_dashboard_report(
        self,
        template: ReportTemplate,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate dashboard analytics report."""

        dashboard_id = parameters.get('dashboard_id')
        date_from = parameters.get('date_from')
        date_to = parameters.get('date_to')

        analytics = await self.get_dashboard_analytics(
            dashboard_id=dashboard_id,
            date_from=date_from,
            date_to=date_to
        )

        return {
            'title': f"Dashboard Analytics Report - {template.name}",
            'generated_at': datetime.utcnow().isoformat(),
            'parameters': parameters,
            'data': analytics
        }

    async def _generate_custom_report(
        self,
        template: ReportTemplate,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate custom report."""

        # This would implement custom report logic based on template config
        return {
            'title': f"Custom Report - {template.name}",
            'generated_at': datetime.utcnow().isoformat(),
            'parameters': parameters,
            'data': {
                'custom_config': template.config,
                'message': 'Custom report generation not yet implemented'
            }
        }

    async def get_business_metrics(
        self,
        tenant_id: str,
        categories: Optional[List[str]] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get business intelligence metrics."""

        query = self.db.query(BusinessMetric).filter(
            BusinessMetric.tenant_id == tenant_id
        )

        if categories:
            query = query.filter(BusinessMetric.metric_category.in_(categories))
        if date_from:
            query = query.filter(BusinessMetric.period_start >= date_from)
        if date_to:
            query = query.filter(BusinessMetric.period_end <= date_to)

        metrics = query.order_by(BusinessMetric.calculated_at.desc()).all()

        # Group by category
        metrics_by_category = {}
        for metric in metrics:
            category = metric.metric_category
            if category not in metrics_by_category:
                metrics_by_category[category] = []

            metrics_by_category[category].append({
                'id': str(metric.id),
                'name': metric.metric_name,
                'current_value': metric.current_value,
                'previous_value': metric.previous_value,
                'target_value': metric.target_value,
                'change_percentage': metric.change_percentage,
                'trend_direction': metric.trend_direction,
                'time_period': metric.time_period,
                'unit': metric.unit
            })

        return {
            'categories': metrics_by_category,
            'summary': {
                'total_metrics': len(metrics),
                'categories_count': len(metrics_by_category),
                'time_range': {
                    'from': date_from.isoformat() if date_from else None,
                    'to': date_to.isoformat() if date_to else None
                }
            }
        }
