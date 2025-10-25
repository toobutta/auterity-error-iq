"""Advanced analytics and reporting models."""

from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, JSON, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base


class AnalyticsEvent(Base):
    """User interaction and system event tracking."""

    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    session_id = Column(String(255), nullable=False)

    # Event details
    event_type = Column(String(100), nullable=False)  # page_view, click, api_call, error, etc.
    event_category = Column(String(100), nullable=False)  # ui, api, system, business
    event_action = Column(String(255), nullable=False)
    event_label = Column(String(500), nullable=True)
    event_value = Column(Float, nullable=True)

    # Context
    page_url = Column(String(1000), nullable=True)
    page_title = Column(String(500), nullable=True)
    referrer = Column(String(1000), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Custom properties
    properties = Column(JSON, nullable=False, default=dict)

    # Technical details
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    screen_resolution = Column(String(20), nullable=True)

    # Timestamps
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_analytics_events_user_id', 'user_id'),
        Index('idx_analytics_events_tenant_id', 'tenant_id'),
        Index('idx_analytics_events_type', 'event_type'),
        Index('idx_analytics_events_category', 'event_category'),
        Index('idx_analytics_events_timestamp', 'timestamp'),
        Index('idx_analytics_events_session', 'session_id'),
    )


class PerformanceMetric(Base):
    """System and application performance metrics."""

    __tablename__ = "performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    metric_type = Column(String(100), nullable=False)  # response_time, throughput, error_rate, etc.
    metric_name = Column(String(255), nullable=False)
    metric_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)  # ms, %, count, etc.

    # Context
    service_name = Column(String(100), nullable=True)
    endpoint = Column(String(500), nullable=True)
    method = Column(String(10), nullable=True)
    status_code = Column(Integer, nullable=True)

    # Aggregation details
    time_bucket = Column(String(50), nullable=False)  # 1m, 5m, 1h, 1d
    bucket_start = Column(DateTime, nullable=False)
    bucket_end = Column(DateTime, nullable=False)

    # Metadata
    tags = Column(JSON, nullable=False, default=dict)
    dimensions = Column(JSON, nullable=False, default=dict)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_performance_metrics_type', 'metric_type'),
        Index('idx_performance_metrics_name', 'metric_name'),
        Index('idx_performance_metrics_service', 'service_name'),
        Index('idx_performance_metrics_bucket', 'time_bucket', 'bucket_start'),
        Index('idx_performance_metrics_created', 'created_at'),
    )


class UserSession(Base):
    """User session tracking and analytics."""

    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Session details
    session_id = Column(String(255), nullable=False, unique=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Device and browser info
    device_type = Column(String(50), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    screen_resolution = Column(String(20), nullable=True)

    # Session metrics
    page_views = Column(Integer, nullable=False, default=0)
    events_count = Column(Integer, nullable=False, default=0)
    session_duration = Column(Integer, nullable=True)  # seconds

    # Engagement metrics
    bounce_rate = Column(Float, nullable=True)  # percentage
    time_on_page_avg = Column(Float, nullable=True)  # seconds

    # Geographic info
    country = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)

    # Timestamps
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_user_sessions_user_id', 'user_id'),
        Index('idx_user_sessions_tenant_id', 'tenant_id'),
        Index('idx_user_sessions_started', 'started_at'),
        Index('idx_user_sessions_session_id', 'session_id'),
    )


class ReportTemplate(Base):
    """Saved report templates and configurations."""

    __tablename__ = "report_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String(50), nullable=False)  # dashboard, user_analytics, performance, custom

    # Template configuration
    config = Column(JSON, nullable=False, default=dict)
    filters = Column(JSON, nullable=False, default=dict)
    date_range = Column(JSON, nullable=True)  # { start: date, end: date, preset: string }

    # Visualization settings
    chart_config = Column(JSON, nullable=False, default=dict)
    layout_config = Column(JSON, nullable=False, default=dict)

    # Metadata
    is_public = Column(Boolean, nullable=False, default=False)
    is_featured = Column(Boolean, nullable=False, default=False)
    category = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=False, default=list)

    # Usage statistics
    usage_count = Column(Integer, nullable=False, default=0)
    last_used = Column(DateTime, nullable=True)

    # Ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    creator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_report_templates_type', 'report_type'),
        Index('idx_report_templates_public', 'is_public'),
        Index('idx_report_templates_featured', 'is_featured'),
        Index('idx_report_templates_category', 'category'),
        Index('idx_report_templates_created_by', 'created_by'),
    )


class ScheduledReport(Base):
    """Scheduled report generation and delivery."""

    __tablename__ = "scheduled_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)

    # Scheduling configuration
    schedule_type = Column(String(20), nullable=False)  # daily, weekly, monthly, custom
    schedule_config = Column(JSON, nullable=False, default=dict)  # cron expression or simple config

    # Delivery configuration
    delivery_method = Column(String(20), nullable=False)  # email, webhook, s3, internal
    delivery_config = Column(JSON, nullable=False, default=dict)

    # Report parameters
    parameters = Column(JSON, nullable=False, default=dict)
    format = Column(String(20), nullable=False, default='pdf')  # pdf, csv, json, html

    # Status and execution
    is_active = Column(Boolean, nullable=False, default=True)
    last_run = Column(DateTime, nullable=True)
    next_run = Column(DateTime, nullable=True)
    last_status = Column(String(20), nullable=True)  # success, failed, running

    # Ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    template = relationship("ReportTemplate")
    creator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_scheduled_reports_template', 'template_id'),
        Index('idx_scheduled_reports_active', 'is_active'),
        Index('idx_scheduled_reports_next_run', 'next_run'),
        Index('idx_scheduled_reports_created_by', 'created_by'),
    )


class ReportExecution(Base):
    """Report generation execution history."""

    __tablename__ = "report_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    scheduled_report_id = Column(UUID(as_uuid=True), ForeignKey("scheduled_reports.id"), nullable=True)
    template_id = Column(UUID(as_uuid=True), ForeignKey("report_templates.id"), nullable=False)

    # Execution details
    status = Column(String(20), nullable=False)  # pending, running, success, failed
    execution_time = Column(Float, nullable=True)  # seconds
    file_size = Column(Integer, nullable=True)  # bytes

    # Results
    report_url = Column(String(1000), nullable=True)
    error_message = Column(Text, nullable=True)

    # Parameters used
    parameters = Column(JSON, nullable=False, default=dict)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Timestamps
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    scheduled_report = relationship("ScheduledReport")
    template = relationship("ReportTemplate")
    generator = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_report_executions_status', 'status'),
        Index('idx_report_executions_template', 'template_id'),
        Index('idx_report_executions_scheduled', 'scheduled_report_id'),
        Index('idx_report_executions_started', 'started_at'),
    )


class DashboardAnalytics(Base):
    """Dashboard-specific analytics and usage tracking."""

    __tablename__ = "dashboard_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Usage metrics
    view_count = Column(Integer, nullable=False, default=0)
    edit_count = Column(Integer, nullable=False, default=0)
    share_count = Column(Integer, nullable=False, default=0)
    export_count = Column(Integer, nullable=False, default=0)

    # Time tracking
    total_view_time = Column(Integer, nullable=False, default=0)  # seconds
    average_session_time = Column(Float, nullable=True)  # seconds

    # Engagement metrics
    widget_interactions = Column(JSON, nullable=False, default=dict)  # { widget_id: count }
    most_viewed_widgets = Column(JSON, nullable=False, default=list)
    interaction_flow = Column(JSON, nullable=False, default=list)  # user journey

    # Performance metrics
    load_times = Column(JSON, nullable=False, default=list)  # array of load times
    error_count = Column(Integer, nullable=False, default=0)
    average_load_time = Column(Float, nullable=True)  # milliseconds

    # Geographic and device analytics
    device_types = Column(JSON, nullable=False, default=dict)
    browser_types = Column(JSON, nullable=False, default=dict)
    countries = Column(JSON, nullable=False, default=dict)

    # Time-based metrics
    hourly_usage = Column(JSON, nullable=False, default=dict)  # hour -> count
    daily_usage = Column(JSON, nullable=False, default=dict)  # day -> count
    weekly_usage = Column(JSON, nullable=False, default=dict)  # week -> count

    # Timestamps
    first_viewed_at = Column(DateTime, nullable=True)
    last_viewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    dashboard = relationship("Dashboard")
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_dashboard_analytics_dashboard', 'dashboard_id'),
        Index('idx_dashboard_analytics_user', 'user_id'),
        Index('idx_dashboard_analytics_tenant', 'tenant_id'),
        Index('idx_dashboard_analytics_last_viewed', 'last_viewed_at'),
    )


class BusinessMetric(Base):
    """Business intelligence metrics and KPIs."""

    __tablename__ = "business_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    metric_name = Column(String(255), nullable=False)
    metric_category = Column(String(100), nullable=False)  # revenue, users, performance, quality

    # Metric values
    current_value = Column(Float, nullable=True)
    previous_value = Column(Float, nullable=True)
    target_value = Column(Float, nullable=True)
    baseline_value = Column(Float, nullable=True)

    # Calculations
    change_percentage = Column(Float, nullable=True)
    trend_direction = Column(String(20), nullable=True)  # up, down, stable
    growth_rate = Column(Float, nullable=True)  # percentage

    # Time periods
    time_period = Column(String(20), nullable=False)  # daily, weekly, monthly, quarterly
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)

    # Context and metadata
    data_source = Column(String(255), nullable=True)
    calculation_method = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)

    # Additional metadata
    tags = Column(JSON, nullable=False, default=list)
    dimensions = Column(JSON, nullable=False, default=dict)

    # Ownership
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Timestamps
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_business_metrics_name', 'metric_name'),
        Index('idx_business_metrics_category', 'metric_category'),
        Index('idx_business_metrics_period', 'time_period', 'period_start'),
        Index('idx_business_metrics_tenant', 'tenant_id'),
    )
