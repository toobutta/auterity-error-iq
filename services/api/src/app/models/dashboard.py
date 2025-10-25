"""Dashboard models for user-created dashboards."""

from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import uuid4

from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base


class Dashboard(Base):
    """User-created dashboard model."""

    __tablename__ = "dashboards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Dashboard configuration
    layout = Column(JSON, nullable=False, default=dict)  # Grid layout configuration
    theme = Column(String(50), nullable=False, default="default")
    is_public = Column(Boolean, nullable=False, default=False)
    is_template = Column(Boolean, nullable=False, default=False)

    # Metadata
    tags = Column(JSON, nullable=False, default=list)  # List of tags
    category = Column(String(100), nullable=True)
    version = Column(Integer, nullable=False, default=1)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_accessed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="dashboards")
    widgets = relationship("DashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")
    shares = relationship("DashboardShare", back_populates="dashboard", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_dashboard_user_id', 'user_id'),
        Index('idx_dashboard_tenant_id', 'tenant_id'),
        Index('idx_dashboard_category', 'category'),
        Index('idx_dashboard_public', 'is_public'),
        Index('idx_dashboard_template', 'is_template'),
    )

    def __repr__(self):
        return f"<Dashboard(id={self.id}, name='{self.name}', user_id={self.user_id})>"


class DashboardWidget(Base):
    """Individual widgets within a dashboard."""

    __tablename__ = "dashboard_widgets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id"), nullable=False)

    # Widget configuration
    widget_type = Column(String(100), nullable=False)  # chart, metric, table, text, etc.
    title = Column(String(255), nullable=False)
    position = Column(JSON, nullable=False)  # { x, y, width, height }
    config = Column(JSON, nullable=False, default=dict)  # Widget-specific configuration

    # Data source
    data_source_type = Column(String(50), nullable=False)  # api, database, realtime, static
    data_source_config = Column(JSON, nullable=False, default=dict)

    # Styling
    style = Column(JSON, nullable=False, default=dict)

    # State
    is_visible = Column(Boolean, nullable=False, default=True)
    refresh_interval = Column(Integer, nullable=True)  # seconds, null = no auto-refresh

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")

    # Indexes
    __table_args__ = (
        Index('idx_widget_dashboard_id', 'dashboard_id'),
        Index('idx_widget_type', 'widget_type'),
        Index('idx_widget_visible', 'is_visible'),
    )

    def __repr__(self):
        return f"<DashboardWidget(id={self.id}, type='{self.widget_type}', title='{self.title}')>"


class DashboardShare(Base):
    """Dashboard sharing permissions."""

    __tablename__ = "dashboard_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id"), nullable=False)

    # Share target
    share_type = Column(String(20), nullable=False)  # user, role, team, public
    target_id = Column(UUID(as_uuid=True), nullable=True)  # user/role/team ID, null for public

    # Permissions
    can_view = Column(Boolean, nullable=False, default=True)
    can_edit = Column(Boolean, nullable=False, default=False)
    can_delete = Column(Boolean, nullable=False, default=False)
    can_share = Column(Boolean, nullable=False, default=False)

    # Share metadata
    shared_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_accessed_at = Column(DateTime, nullable=True)

    # Relationships
    dashboard = relationship("Dashboard", back_populates="shares")
    shared_by = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_share_dashboard_id', 'dashboard_id'),
        Index('idx_share_target', 'share_type', 'target_id'),
        Index('idx_share_expires', 'expires_at'),
    )

    def __repr__(self):
        return f"<DashboardShare(id={self.id}, type='{self.share_type}', dashboard_id={self.dashboard_id})>"


class DashboardTemplate(Base):
    """Pre-built dashboard templates."""

    __tablename__ = "dashboard_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)

    # Template configuration
    layout = Column(JSON, nullable=False)
    widgets = Column(JSON, nullable=False)  # Array of widget configurations
    theme = Column(String(50), nullable=False, default="default")

    # Metadata
    tags = Column(JSON, nullable=False, default=list)
    preview_image_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)

    # Usage statistics
    usage_count = Column(Integer, nullable=False, default=0)
    rating = Column(Integer, nullable=True)  # 1-5 stars
    review_count = Column(Integer, nullable=False, default=0)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_template_category', 'category'),
        Index('idx_template_featured', 'is_featured'),
        Index('idx_template_usage', 'usage_count'),
    )

    def __repr__(self):
        return f"<DashboardTemplate(id={self.id}, name='{self.name}', category='{self.category}')>"


class DashboardAnalytics(Base):
    """Analytics and usage tracking for dashboards."""

    __tablename__ = "dashboard_analytics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Analytics data
    view_count = Column(Integer, nullable=False, default=0)
    edit_count = Column(Integer, nullable=False, default=0)
    share_count = Column(Integer, nullable=False, default=0)
    export_count = Column(Integer, nullable=False, default=0)

    # Time tracking
    total_view_time = Column(Integer, nullable=False, default=0)  # seconds
    last_viewed_at = Column(DateTime, nullable=True)
    first_viewed_at = Column(DateTime, nullable=True)

    # Widget interactions
    widget_interactions = Column(JSON, nullable=False, default=dict)  # { widget_id: count }

    # Performance metrics
    load_times = Column(JSON, nullable=False, default=list)  # Array of load times
    error_count = Column(Integer, nullable=False, default=0)

    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    dashboard = relationship("Dashboard")
    user = relationship("User")

    # Indexes
    __table_args__ = (
        Index('idx_analytics_dashboard_id', 'dashboard_id'),
        Index('idx_analytics_user_id', 'user_id'),
        Index('idx_analytics_last_viewed', 'last_viewed_at'),
    )

    def __repr__(self):
        return f"<DashboardAnalytics(dashboard_id={self.dashboard_id}, user_id={self.user_id}, views={self.view_count})>"
