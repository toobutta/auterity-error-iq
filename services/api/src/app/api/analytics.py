"""Analytics and reporting API endpoints."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


# Event Tracking Endpoints
@router.post("/events")
async def track_event(
    event_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track a user interaction event."""

    analytics_service = AnalyticsService(db)

    event_id = await analytics_service.track_event(
        event_type=event_data.get('event_type', 'custom'),
        event_category=event_data.get('event_category', 'ui'),
        event_action=event_data.get('event_action', 'interaction'),
        user_id=str(current_user.id),
        tenant_id=str(current_user.tenant_id),
        session_id=event_data.get('session_id'),
        event_label=event_data.get('event_label'),
        event_value=event_data.get('event_value'),
        properties=event_data.get('properties', {}),
        context=event_data.get('context', {})
    )

    return {"event_id": event_id, "status": "tracked"}


@router.post("/performance")
async def track_performance_metric(
    metric_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track a performance metric."""

    analytics_service = AnalyticsService(db)

    metric_id = await analytics_service.track_performance_metric(
        metric_type=metric_data['metric_type'],
        metric_name=metric_data['metric_name'],
        value=metric_data['value'],
        unit=metric_data.get('unit'),
        service_name=metric_data.get('service_name'),
        endpoint=metric_data.get('endpoint'),
        tags=metric_data.get('tags', {})
    )

    return {"metric_id": metric_id, "status": "tracked"}


# Analytics Query Endpoints
@router.get("/user")
async def get_user_analytics(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    event_types: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user analytics data."""

    analytics_service = AnalyticsService(db)

    analytics = await analytics_service.get_user_analytics(
        user_id=str(current_user.id),
        tenant_id=str(current_user.tenant_id),
        date_from=date_from,
        date_to=date_to,
        event_types=event_types
    )

    return analytics


@router.get("/performance")
async def get_performance_analytics(
    service_name: Optional[str] = Query(None),
    metric_types: Optional[List[str]] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get performance analytics data."""

    analytics_service = AnalyticsService(db)

    analytics = await analytics_service.get_performance_analytics(
        service_name=service_name,
        metric_types=metric_types,
        date_from=date_from,
        date_to=date_to
    )

    return analytics


@router.get("/summary")
async def get_analytics_summary(
    days: int = Query(30, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics summary."""

    from app.models.analytics import AnalyticsEvent, UserSession, PerformanceMetric

    date_from = datetime.utcnow() - timedelta(days=days)

    # User activity summary
    total_events = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.tenant_id == current_user.tenant_id,
        AnalyticsEvent.timestamp >= date_from
    ).count()

    unique_users = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.tenant_id == current_user.tenant_id,
        AnalyticsEvent.timestamp >= date_from
    ).distinct(AnalyticsEvent.user_id).count()

    total_sessions = db.query(UserSession).filter(
        UserSession.tenant_id == current_user.tenant_id,
        UserSession.started_at >= date_from
    ).count()

    return {
        "period_days": days,
        "user_activity": {
            "total_events": total_events,
            "unique_users": unique_users,
            "total_sessions": total_sessions,
            "avg_events_per_user": total_events / unique_users if unique_users > 0 else 0,
        },
        "generated_at": datetime.utcnow().isoformat()
    }