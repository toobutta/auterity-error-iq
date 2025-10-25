"""Dashboard management API endpoints."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.dashboard import Dashboard, DashboardWidget, DashboardShare, DashboardTemplate, DashboardAnalytics
from app.models.user import User
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardResponse,
    DashboardListResponse,
    DashboardWidgetCreate,
    DashboardWidgetUpdate,
    DashboardWidgetResponse,
    DashboardShareCreate,
    DashboardShareResponse,
    DashboardTemplateResponse,
    DashboardAnalyticsResponse,
)

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


@router.post("/", response_model=DashboardResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard_data: DashboardCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new dashboard for the authenticated user."""

    # Create new dashboard
    db_dashboard = Dashboard(
        name=dashboard_data.name,
        description=dashboard_data.description,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        layout=dashboard_data.layout or {},
        theme=dashboard_data.theme or "default",
        is_public=dashboard_data.is_public or False,
        tags=dashboard_data.tags or [],
        category=dashboard_data.category,
    )

    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)

    # Create initial analytics entry
    analytics = DashboardAnalytics(
        dashboard_id=db_dashboard.id,
        user_id=current_user.id,
        first_viewed_at=db_dashboard.created_at,
    )
    db.add(analytics)
    db.commit()

    return db_dashboard


@router.get("/", response_model=DashboardListResponse)
async def list_dashboards(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Number of dashboards per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    include_public: bool = Query(True, description="Include public dashboards"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List dashboards accessible to the authenticated user."""

    # Build query for user's own dashboards and shared dashboards
    user_dashboards_query = db.query(Dashboard).filter(
        and_(
            Dashboard.user_id == current_user.id,
            Dashboard.is_active == True
        )
    )

    # Add public dashboards if requested
    if include_public:
        public_dashboards_query = db.query(Dashboard).filter(
            and_(
                Dashboard.is_public == True,
                Dashboard.is_active == True
            )
        )
        user_dashboards_query = user_dashboards_query.union(public_dashboards_query)

    # Apply filters
    if category:
        user_dashboards_query = user_dashboards_query.filter(Dashboard.category == category)

    if search:
        search_filter = f"%{search}%"
        user_dashboards_query = user_dashboards_query.filter(
            or_(
                Dashboard.name.ilike(search_filter),
                Dashboard.description.ilike(search_filter)
            )
        )

    # Get total count
    total_count = user_dashboards_query.count()

    # Apply pagination
    dashboards = (
        user_dashboards_query
        .order_by(Dashboard.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "dashboards": dashboards,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size,
    }


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get a specific dashboard by ID."""

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check access permissions
    if not dashboard.is_public and dashboard.user_id != current_user.id:
        # Check if user has shared access
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user"
            )
        ).first()

        if not share or not share.can_view:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    # Update last accessed time
    dashboard.last_accessed_at = db.func.now()
    db.commit()

    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardResponse)
async def update_dashboard(
    dashboard_id: UUID,
    dashboard_data: DashboardUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a dashboard."""

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check edit permissions
    if dashboard.user_id != current_user.id:
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user",
                DashboardShare.can_edit == True
            )
        ).first()

        if not share:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Edit access denied"
            )

    # Update dashboard
    update_data = dashboard_data.dict(exclude_unset=True)
    update_data["updated_at"] = db.func.now()

    for field, value in update_data.items():
        setattr(dashboard, field, value)

    db.commit()
    db.refresh(dashboard)

    return dashboard


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a dashboard."""

    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()

    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check delete permissions
    if dashboard.user_id != current_user.id:
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user",
                DashboardShare.can_delete == True
            )
        ).first()

        if not share:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Delete access denied"
            )

    # Soft delete by marking as inactive
    dashboard.is_active = False
    db.commit()


# Widget Management Endpoints
@router.post("/{dashboard_id}/widgets", response_model=DashboardWidgetResponse, status_code=status.HTTP_201_CREATED)
async def create_widget(
    dashboard_id: UUID,
    widget_data: DashboardWidgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new widget for a dashboard."""

    # Verify dashboard exists and user has access
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    # Check permissions
    if dashboard.user_id != current_user.id:
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user",
                DashboardShare.can_edit == True
            )
        ).first()

        if not share:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Edit access denied"
            )

    # Create widget
    db_widget = DashboardWidget(
        dashboard_id=dashboard_id,
        widget_type=widget_data.widget_type,
        title=widget_data.title,
        position=widget_data.position,
        config=widget_data.config or {},
        data_source_type=widget_data.data_source_type,
        data_source_config=widget_data.data_source_config or {},
        style=widget_data.style or {},
        refresh_interval=widget_data.refresh_interval,
    )

    db.add(db_widget)
    db.commit()
    db.refresh(db_widget)

    return db_widget


@router.get("/{dashboard_id}/widgets", response_model=List[DashboardWidgetResponse])
async def list_widgets(
    dashboard_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get all widgets for a dashboard."""

    # Verify dashboard access
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    if not dashboard.is_public and dashboard.user_id != current_user.id:
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user",
                DashboardShare.can_view == True
            )
        ).first()

        if not share:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

    widgets = db.query(DashboardWidget).filter(
        and_(
            DashboardWidget.dashboard_id == dashboard_id,
            DashboardWidget.is_visible == True
        )
    ).order_by(DashboardWidget.position).all()

    return widgets


# Template Management Endpoints
@router.get("/templates", response_model=List[DashboardTemplateResponse])
async def list_templates(
    category: Optional[str] = Query(None, description="Filter by category"),
    featured_only: bool = Query(False, description="Show only featured templates"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List available dashboard templates."""

    query = db.query(DashboardTemplate)

    if category:
        query = query.filter(DashboardTemplate.category == category)

    if featured_only:
        query = query.filter(DashboardTemplate.is_featured == True)

    templates = query.order_by(DashboardTemplate.usage_count.desc()).all()

    return templates


@router.post("/{dashboard_id}/templates/{template_id}/apply", response_model=DashboardResponse)
async def apply_template(
    dashboard_id: UUID,
    template_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Apply a template to an existing dashboard."""

    # Verify dashboard and template exist
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    template = db.query(DashboardTemplate).filter(DashboardTemplate.id == template_id).first()

    if not dashboard or not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard or template not found"
        )

    # Check permissions
    if dashboard.user_id != current_user.id:
        share = db.query(DashboardShare).filter(
            and_(
                DashboardShare.dashboard_id == dashboard_id,
                DashboardShare.target_id == current_user.id,
                DashboardShare.share_type == "user",
                DashboardShare.can_edit == True
            )
        ).first()

        if not share:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Edit access denied"
            )

    # Apply template (this would involve copying widgets, layout, etc.)
    # Implementation would depend on the specific template structure

    # Update usage count
    template.usage_count += 1
    db.commit()

    return dashboard


# Analytics Endpoints
@router.get("/{dashboard_id}/analytics", response_model=DashboardAnalyticsResponse)
async def get_dashboard_analytics(
    dashboard_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get analytics for a dashboard."""

    # Verify dashboard exists and user has access
    dashboard = db.query(Dashboard).filter(Dashboard.id == dashboard_id).first()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    if dashboard.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    analytics = db.query(DashboardAnalytics).filter(
        and_(
            DashboardAnalytics.dashboard_id == dashboard_id,
            DashboardAnalytics.user_id == current_user.id
        )
    ).first()

    if not analytics:
        # Create analytics entry if it doesn't exist
        analytics = DashboardAnalytics(
            dashboard_id=dashboard_id,
            user_id=current_user.id,
        )
        db.add(analytics)
        db.commit()
        db.refresh(analytics)

    return analytics


@router.post("/{dashboard_id}/analytics/view")
async def track_dashboard_view(
    dashboard_id: UUID,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Track dashboard view for analytics."""

    analytics = db.query(DashboardAnalytics).filter(
        and_(
            DashboardAnalytics.dashboard_id == dashboard_id,
            DashboardAnalytics.user_id == current_user.id
        )
    ).first()

    if not analytics:
        analytics = DashboardAnalytics(
            dashboard_id=dashboard_id,
            user_id=current_user.id,
            first_viewed_at=db.func.now(),
        )
        db.add(analytics)
    else:
        analytics.view_count += 1
        analytics.last_viewed_at = db.func.now()

    db.commit()

    return {"success": True}
