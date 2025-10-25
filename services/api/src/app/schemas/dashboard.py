"""Dashboard API schemas."""

from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# Dashboard Schemas
class DashboardBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    layout: Dict[str, Any] = Field(default_factory=dict)
    theme: str = Field(default="default")
    is_public: bool = Field(default=False)
    tags: List[str] = Field(default_factory=list)
    category: Optional[str] = None


class DashboardCreate(DashboardBase):
    pass


class DashboardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None
    theme: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None


class DashboardResponse(DashboardBase):
    id: UUID
    user_id: UUID
    tenant_id: UUID
    version: int
    created_at: datetime
    updated_at: datetime
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardListResponse(BaseModel):
    dashboards: List[DashboardResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Widget Schemas
class DashboardWidgetBase(BaseModel):
    widget_type: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    position: Dict[str, Any] = Field(...)  # { x, y, width, height }
    config: Dict[str, Any] = Field(default_factory=dict)
    data_source_type: str = Field(..., min_length=1, max_length=50)
    data_source_config: Dict[str, Any] = Field(default_factory=dict)
    style: Dict[str, Any] = Field(default_factory=dict)
    is_visible: bool = Field(default=True)
    refresh_interval: Optional[int] = Field(None, ge=1)  # seconds


class DashboardWidgetCreate(DashboardWidgetBase):
    pass


class DashboardWidgetUpdate(BaseModel):
    widget_type: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    data_source_type: Optional[str] = Field(None, min_length=1, max_length=50)
    data_source_config: Optional[Dict[str, Any]] = None
    style: Optional[Dict[str, Any]] = None
    is_visible: Optional[bool] = None
    refresh_interval: Optional[int] = Field(None, ge=1)


class DashboardWidgetResponse(DashboardWidgetBase):
    id: UUID
    dashboard_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Share Schemas
class DashboardShareBase(BaseModel):
    share_type: str = Field(..., regex="^(user|role|team|public)$")
    target_id: Optional[UUID] = None
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_delete: bool = Field(default=False)
    can_share: bool = Field(default=False)
    message: Optional[str] = None
    expires_at: Optional[datetime] = None


class DashboardShareCreate(DashboardShareBase):
    pass


class DashboardShareResponse(DashboardShareBase):
    id: UUID
    dashboard_id: UUID
    shared_by_user_id: UUID
    created_at: datetime
    last_accessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Template Schemas
class DashboardTemplateResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    category: str
    layout: Dict[str, Any]
    widgets: List[Dict[str, Any]]
    theme: str
    tags: List[str]
    preview_image_url: Optional[str] = None
    is_featured: bool
    usage_count: int
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas
class DashboardAnalyticsResponse(BaseModel):
    id: UUID
    dashboard_id: UUID
    user_id: UUID
    view_count: int
    edit_count: int
    share_count: int
    export_count: int
    total_view_time: int
    last_viewed_at: Optional[datetime] = None
    first_viewed_at: Optional[datetime] = None
    widget_interactions: Dict[str, int]
    load_times: List[float]
    error_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Data Source Schemas
class DataSourceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., regex="^(rest|database|stream|file)$")
    config: Dict[str, Any]


class DataSourceCreate(DataSourceBase):
    pass


class DataSourceResponse(DataSourceBase):
    id: UUID
    user_id: UUID
    tenant_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Widget Data Response Schemas
class WidgetDataResponse(BaseModel):
    data: Any
    timestamp: datetime
    source: str
    cache_hit: bool = False
    execution_time_ms: Optional[float] = None


# Dashboard Categories
DASHBOARD_CATEGORIES = [
    "analytics",
    "monitoring",
    "business",
    "technical",
    "financial",
    "operational",
    "compliance",
    "custom"
]

# Widget Types
WIDGET_TYPES = [
    "chart",
    "metric",
    "table",
    "text",
    "image",
    "map",
    "timeline",
    "gauge",
    "progress",
    "list"
]

# Data Source Types
DATA_SOURCE_TYPES = [
    "rest",
    "database",
    "stream",
    "file",
    "static"
]
