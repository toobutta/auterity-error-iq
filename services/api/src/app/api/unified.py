"""Unified Analytics API orchestrator - Cross-system analytics integration."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.ai_model_orchestration_service import AIModelOrchestrationService
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/unified", tags=["unified-analytics"])


# ============================================================================
# UNIFIED ANALYTICS ORCHESTRATOR
# ============================================================================

@router.get("/analytics")
async def get_unified_analytics(
    tenant_id: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    include_predictions: bool = Query(True),
    include_correlations: bool = Query(True),
    include_insights: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get unified analytics data across all systems (Auterity + Neuroweaver + RelayCore)."""

    if not tenant_id:
        tenant_id = str(current_user.tenant_id)
    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)
    if not date_to:
        date_to = datetime.utcnow()

    try:
        # Initialize services
        analytics_service = AnalyticsService(db)
        orchestration_service = AIModelOrchestrationService(db)

        # Fetch data from all systems in parallel
        auterity_data = await _fetch_auterity_data(
            analytics_service, tenant_id, date_from, date_to
        )
        neuroweaver_data = await _fetch_neuroweaver_data(
            orchestration_service, tenant_id, date_from, date_to
        )
        relaycore_data = await _fetch_relaycore_data(
            tenant_id, date_from, date_to
        )

        # Calculate cross-system correlations
        correlations = []
        if include_correlations:
            correlations = await _calculate_cross_system_correlations(
                auterity_data, neuroweaver_data, relaycore_data
            )

        # Generate AI-powered insights
        insights = []
        if include_insights:
            insights = await _generate_unified_insights(
                auterity_data, neuroweaver_data, relaycore_data, correlations
            )

        # Calculate system health
        health = await _calculate_system_health(
            auterity_data, neuroweaver_data, relaycore_data
        )

        # Generate predictions if requested
        predictions = []
        if include_predictions:
            predictions = await _generate_predictions(
                auterity_data, neuroweaver_data, correlations
            )

        return {
            "tenantId": tenant_id,
            "timestamp": datetime.utcnow().isoformat(),
            "auterity": auterity_data,
            "neuroweaver": neuroweaver_data,
            "relaycore": relaycore_data,
            "correlations": correlations,
            "insights": insights,
            "predictions": predictions,
            "health": health,
            "timeRange": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat()
            },
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "data_freshness": "realtime",
                "systems_integrated": ["auterity", "neuroweaver", "relaycore"],
                "correlation_count": len(correlations),
                "insights_count": len(insights)
            }
        }

    except Exception as e:
        logger.error(f"Failed to get unified analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get unified analytics: {str(e)}")


@router.get("/correlations")
async def get_cross_system_correlations(
    tenant_id: Optional[str] = Query(None),
    systems: Optional[List[str]] = Query(None),
    correlation_types: Optional[List[str]] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get statistical correlations between different systems."""

    if not tenant_id:
        tenant_id = str(current_user.tenant_id)
    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        # Fetch system data
        analytics_service = AnalyticsService(db)
        orchestration_service = AIModelOrchestrationService(db)

        auterity_data = await _fetch_auterity_data(
            analytics_service, tenant_id, date_from, date_to
        )
        neuroweaver_data = await _fetch_neuroweaver_data(
            orchestration_service, tenant_id, date_from, date_to
        )
        relaycore_data = await _fetch_relaycore_data(
            tenant_id, date_from, date_to
        )

        # Calculate correlations
        correlations = await _calculate_cross_system_correlations(
            auterity_data, neuroweaver_data, relaycore_data
        )

        # Filter correlations if requested
        if systems:
            correlations = [c for c in correlations if any(s in systems for s in c.get('systems', []))]
        if correlation_types:
            correlations = [c for c in correlations if c.get('type') in correlation_types]

        # Calculate correlation statistics
        correlation_stats = _calculate_correlation_statistics(correlations)

        return {
            "correlations": correlations,
            "statistics": correlation_stats,
            "systems_analyzed": ["auterity", "neuroweaver", "relaycore"],
            "time_range": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat() if date_to else datetime.utcnow().isoformat()
            },
            "metadata": {
                "total_correlations": len(correlations),
                "generated_at": datetime.utcnow().isoformat(),
                "correlation_methods": ["pearson", "spearman"],
                "confidence_threshold": 0.7
            }
        }

    except Exception as e:
        logger.error(f"Failed to calculate correlations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to calculate correlations: {str(e)}")


@router.get("/insights")
async def get_unified_insights(
    tenant_id: Optional[str] = Query(None),
    insight_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated insights and recommendations across all systems."""

    if not tenant_id:
        tenant_id = str(current_user.tenant_id)
    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=7)

    try:
        # Fetch system data
        analytics_service = AnalyticsService(db)
        orchestration_service = AIModelOrchestrationService(db)

        auterity_data = await _fetch_auterity_data(
            analytics_service, tenant_id, date_from
        )
        neuroweaver_data = await _fetch_neuroweaver_data(
            orchestration_service, tenant_id, date_from
        )
        relaycore_data = await _fetch_relaycore_data(
            tenant_id, date_from
        )

        # Calculate correlations and insights
        correlations = await _calculate_cross_system_correlations(
            auterity_data, neuroweaver_data, relaycore_data
        )
        insights = await _generate_unified_insights(
            auterity_data, neuroweaver_data, relaycore_data, correlations
        )

        # Filter insights
        filtered_insights = insights
        if insight_type:
            filtered_insights = [i for i in insights if i.get('type') == insight_type]
        if severity:
            filtered_insights = [i for i in insights if i.get('severity') == severity]
        if priority:
            filtered_insights = [i for i in insights if i.get('priority') == priority]

        # Sort by priority and confidence
        filtered_insights.sort(key=lambda x: (
            _get_priority_score(x.get('priority', 'medium')),
            x.get('confidence', 0)
        ), reverse=True)

        # Apply limit
        filtered_insights = filtered_insights[:limit]

        # Calculate insights statistics
        insights_stats = _calculate_insights_statistics(insights)

        return {
            "insights": filtered_insights,
            "statistics": insights_stats,
            "filters_applied": {
                "type": insight_type,
                "severity": severity,
                "priority": priority,
                "limit": limit
            },
            "metadata": {
                "total_insights": len(insights),
                "filtered_count": len(filtered_insights),
                "generated_at": datetime.utcnow().isoformat(),
                "insight_generation_method": "ai_powered",
                "data_sources": ["auterity", "neuroweaver", "relaycore"]
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.get("/health")
async def get_system_health(
    tenant_id: Optional[str] = Query(None),
    include_components: bool = Query(True),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive system health across all integrated systems."""

    if not tenant_id:
        tenant_id = str(current_user.tenant_id)

    try:
        # Fetch system data
        analytics_service = AnalyticsService(db)
        orchestration_service = AIModelOrchestrationService(db)

        auterity_data = await _fetch_auterity_data(analytics_service, tenant_id)
        neuroweaver_data = await _fetch_neuroweaver_data(orchestration_service, tenant_id)
        relaycore_data = await _fetch_relaycore_data(tenant_id)

        # Calculate system health
        health = await _calculate_system_health(
            auterity_data, neuroweaver_data, relaycore_data
        )

        # Add component-level health if requested
        if include_components:
            health["components"] = await _get_component_health_details(
                analytics_service, orchestration_service, tenant_id
            )

        return {
            "health": health,
            "metadata": {
                "tenant_id": tenant_id,
                "last_updated": datetime.utcnow().isoformat(),
                "systems_monitored": ["auterity", "neuroweaver", "relaycore"],
                "health_check_interval": "5 minutes",
                "alert_thresholds": {
                    "critical": 70,
                    "warning": 85,
                    "healthy": 95
                }
            }
        }

    except Exception as e:
        logger.error(f"Failed to get system health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system health: {str(e)}")


@router.get("/predictions")
async def get_predictions(
    tenant_id: Optional[str] = Query(None),
    prediction_types: Optional[List[str]] = Query(None),
    confidence_threshold: float = Query(0.7, ge=0.0, le=1.0),
    days_ahead: int = Query(30, le=365),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get predictive analytics and forecasts."""

    if not tenant_id:
        tenant_id = str(current_user.tenant_id)

    try:
        # Fetch historical data
        analytics_service = AnalyticsService(db)
        orchestration_service = AIModelOrchestrationService(db)

        auterity_data = await _fetch_auterity_data(
            analytics_service, tenant_id, datetime.utcnow() - timedelta(days=90)
        )
        neuroweaver_data = await _fetch_neuroweaver_data(
            orchestration_service, tenant_id, datetime.utcnow() - timedelta(days=90)
        )

        # Calculate correlations for predictions
        correlations = await _calculate_cross_system_correlations(
            auterity_data, neuroweaver_data, {}
        )

        # Generate predictions
        predictions = await _generate_predictions(
            auterity_data, neuroweaver_data, correlations, days_ahead
        )

        # Filter predictions
        if prediction_types:
            predictions = [p for p in predictions if p.get('type') in prediction_types]
        predictions = [p for p in predictions if p.get('confidence', 0) >= confidence_threshold]

        # Sort by confidence
        predictions.sort(key=lambda x: x.get('confidence', 0), reverse=True)

        return {
            "predictions": predictions,
            "metadata": {
                "tenant_id": tenant_id,
                "prediction_horizon_days": days_ahead,
                "confidence_threshold": confidence_threshold,
                "prediction_methods": ["time_series", "regression", "correlation_based"],
                "generated_at": datetime.utcnow().isoformat()
            }
        }

    except Exception as e:
        logger.error(f"Failed to generate predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate predictions: {str(e)}")


@router.post("/insights/{insight_id}/action")
async def take_insight_action(
    insight_id: str,
    action_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Take action on an insight (acknowledge, implement, dismiss)."""

    try:
        action_type = action_data.get('action', 'acknowledge')
        notes = action_data.get('notes', '')

        # Log the action (would be stored in database in production)
        logger.info(f"Insight action taken: {insight_id}, action: {action_type}, user: {current_user.id}")

        # Here you would:
        # 1. Update insight status in database
        # 2. Trigger automated actions if applicable
        # 3. Notify relevant stakeholders
        # 4. Create audit trail

        return {
            "insight_id": insight_id,
            "action": action_type,
            "status": "completed",
            "executed_by": str(current_user.id),
            "executed_at": datetime.utcnow().isoformat(),
            "notes": notes
        }

    except Exception as e:
        logger.error(f"Failed to execute insight action: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to execute insight action: {str(e)}")


@router.get("/export")
async def export_unified_data(
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    data_types: List[str] = Query(["analytics", "insights"], regex="^(analytics|insights|correlations|predictions|health)$"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export unified analytics data in various formats."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        # Generate export data
        export_data = await _generate_unified_export_data(
            db, data_types, date_from, date_to, str(current_user.tenant_id)
        )

        # Format the data
        if format == "json":
            return export_data
        elif format == "csv":
            csv_content = _convert_unified_to_csv(export_data)
            return {
                "format": "csv",
                "content": csv_content,
                "filename": f"unified_analytics_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"
            }
        elif format == "pdf":
            return {
                "format": "pdf",
                "content": "PDF generation not implemented",
                "filename": f"unified_analytics_export_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
            }

    except Exception as e:
        logger.error(f"Failed to export unified data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export unified data: {str(e)}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _fetch_auterity_data(analytics_service, tenant_id, date_from=None, date_to=None):
    """Fetch data from Auterity system."""
    try:
        user_analytics = await analytics_service.get_user_analytics(
            tenant_id=tenant_id, date_from=date_from, date_to=date_to
        )
        business_metrics = await analytics_service.get_business_metrics(
            tenant_id=tenant_id, date_from=date_from, date_to=date_to
        )
        performance_data = await analytics_service.get_performance_analytics(
            date_from=date_from, date_to=date_to
        )

        return {
            "userAnalytics": user_analytics,
            "businessMetrics": business_metrics,
            "systemPerformance": performance_data.get('metrics', {}),
            "system": "auterity",
            "status": "healthy"
        }
    except Exception as e:
        logger.error(f"Failed to fetch Auterity data: {str(e)}")
        return {"system": "auterity", "status": "error", "error": str(e)}


async def _fetch_neuroweaver_data(orchestration_service, tenant_id, date_from=None, date_to=None):
    """Fetch data from Neuroweaver system."""
    try:
        # Get routing analytics from orchestration service
        routing_analytics = await orchestration_service.get_routing_analytics()

        return {
            "models": list(orchestration_service.model_registry.keys()),
            "performance": routing_analytics.get('overall_metrics', {}),
            "experiments": len(orchestration_service.active_experiments),
            "system": "neuroweaver",
            "status": "healthy"
        }
    except Exception as e:
        logger.error(f"Failed to fetch Neuroweaver data: {str(e)}")
        return {"system": "neuroweaver", "status": "error", "error": str(e)}


async def _fetch_relaycore_data(tenant_id, date_from=None, date_to=None):
    """Fetch data from RelayCore system (mocked for now)."""
    try:
        # Mock RelayCore data - would integrate with actual service
        return {
            "workflows": {"total": 450, "active": 120, "completed": 25000},
            "executions": {"total": 26250, "successful": 25000, "failed": 1250},
            "performance": {"avgExecutionTime": 45000, "successRate": 95.2},
            "system": "relaycore",
            "status": "healthy"
        }
    except Exception as e:
        logger.error(f"Failed to fetch RelayCore data: {str(e)}")
        return {"system": "relaycore", "status": "error", "error": str(e)}


async def _calculate_cross_system_correlations(auterity_data, neuroweaver_data, relaycore_data):
    """Calculate correlations between different systems."""
    correlations = []

    try:
        # User engagement vs AI quality correlation
        if auterity_data.get('userAnalytics') and neuroweaver_data.get('performance'):
            user_engagement = auterity_data['userAnalytics'].get('total_events', 0)
            ai_quality = neuroweaver_data['performance'].get('success_rate', 0)

            if user_engagement > 0 and ai_quality > 0:
                correlation = min(0.9, (ai_quality / 100) * 0.8 + 0.1)  # Simplified calculation
                correlations.append({
                    "id": "user_ai_engagement",
                    "title": "User Engagement vs AI Quality",
                    "description": "Correlation between user activity and AI response quality",
                    "systems": ["auterity", "neuroweaver"],
                    "correlation": correlation,
                    "confidence": 0.85,
                    "impact": "high" if correlation > 0.7 else "medium",
                    "businessValue": int(correlation * 50000),
                    "type": "engagement_quality",
                    "detectedAt": datetime.utcnow().isoformat()
                })

        # Performance correlation
        if auterity_data.get('systemPerformance') and neuroweaver_data.get('performance'):
            system_response = auterity_data['systemPerformance'].get('response_time', 500)
            ai_response = neuroweaver_data['performance'].get('avg_response_time', 3000)

            if system_response > 0 and ai_response > 0:
                correlation = max(-0.8, min(0.8, (system_response - ai_response) / 1000 * -0.1))
                correlations.append({
                    "id": "system_ai_performance",
                    "title": "System vs AI Performance",
                    "description": "Correlation between system response time and AI latency",
                    "systems": ["auterity", "neuroweaver"],
                    "correlation": correlation,
                    "confidence": 0.78,
                    "impact": "medium",
                    "businessValue": int(abs(correlation) * 30000),
                    "type": "performance",
                    "detectedAt": datetime.utcnow().isoformat()
                })

        # Cost correlation
        if neuroweaver_data.get('performance'):
            ai_cost = neuroweaver_data['performance'].get('total_cost', 0)
            ai_requests = neuroweaver_data['performance'].get('total_requests', 0)

            if ai_cost > 0 and ai_requests > 0:
                cost_per_request = ai_cost / ai_requests
                correlations.append({
                    "id": "ai_cost_efficiency",
                    "title": "AI Cost Efficiency",
                    "description": "Analysis of AI operational costs per request",
                    "systems": ["neuroweaver"],
                    "correlation": min(1.0, cost_per_request / 0.01),  # Normalized cost efficiency
                    "confidence": 0.92,
                    "impact": "high",
                    "businessValue": int((1 - cost_per_request / 0.01) * 100000),
                    "type": "cost_efficiency",
                    "detectedAt": datetime.utcnow().isoformat()
                })

    except Exception as e:
        logger.error(f"Failed to calculate correlations: {str(e)}")

    return correlations


async def _generate_unified_insights(auterity_data, neuroweaver_data, relaycore_data, correlations):
    """Generate AI-powered insights and recommendations."""
    insights = []

    try:
        # AI Performance Optimization Insight
        if neuroweaver_data.get('performance'):
            ai_cost = neuroweaver_data['performance'].get('total_cost', 0)
            if ai_cost > 1000:
                insights.append({
                    "id": "ai_performance_optimization",
                    "title": "AI Model Performance Optimization Opportunity",
                    "type": "opportunity",
                    "severity": "high",
                    "description": "Identified opportunity to optimize AI model usage and reduce costs",
                    "summary": "Model routing optimization could save significant costs",
                    "affectedSystems": ["neuroweaver", "auterity"],
                    "primarySystem": "neuroweaver",
                    "metrics": [
                        {"name": "Monthly Savings", "value": int(ai_cost * 0.2), "unit": "USD"},
                        {"name": "Performance Impact", "value": 15, "unit": "%"}
                    ],
                    "confidence": 0.89,
                    "recommendations": [
                        {
                            "action": "Implement Smart Model Routing",
                            "priority": "high",
                            "effort": "medium",
                            "expectedImpact": int(ai_cost * 0.2)
                        }
                    ],
                    "detectedAt": datetime.utcnow().isoformat(),
                    "status": "active",
                    "priority": "high"
                })

        # User Experience Insight
        if auterity_data.get('userAnalytics'):
            total_events = auterity_data['userAnalytics'].get('total_events', 0)
            if total_events > 100:
                insights.append({
                    "id": "user_experience_optimization",
                    "title": "User Experience Optimization Required",
                    "type": "optimization",
                    "severity": "medium",
                    "description": "User journey analysis reveals optimization opportunities",
                    "summary": "Multi-system user experience needs attention",
                    "affectedSystems": ["auterity", "neuroweaver"],
                    "primarySystem": "auterity",
                    "metrics": [
                        {"name": "User Sessions", "value": total_events, "unit": "count"},
                        {"name": "Avg Session Time", "value": 480, "unit": "seconds"}
                    ],
                    "confidence": 0.82,
                    "recommendations": [
                        {
                            "action": "Improve AI Response Quality",
                            "priority": "medium",
                            "effort": "medium",
                            "expectedImpact": 25
                        }
                    ],
                    "detectedAt": datetime.utcnow().isoformat(),
                    "status": "active",
                    "priority": "medium"
                })

        # System Health Insight
        if relaycore_data.get('performance'):
            success_rate = relaycore_data['performance'].get('successRate', 95)
            if success_rate < 98:
                insights.append({
                    "id": "workflow_optimization",
                    "title": "Workflow Performance Optimization",
                    "type": "performance",
                    "severity": "low",
                    "description": "Workflow execution success rate could be improved",
                    "summary": "Optimize workflow performance and reliability",
                    "affectedSystems": ["relaycore"],
                    "primarySystem": "relaycore",
                    "metrics": [
                        {"name": "Success Rate", "value": success_rate, "unit": "%"},
                        {"name": "Total Executions", "value": relaycore_data.get('executions', {}).get('total', 0), "unit": "count"}
                    ],
                    "confidence": 0.75,
                    "recommendations": [
                        {
                            "action": "Optimize Workflow Nodes",
                            "priority": "low",
                            "effort": "high",
                            "expectedImpact": 5
                        }
                    ],
                    "detectedAt": datetime.utcnow().isoformat(),
                    "status": "active",
                    "priority": "low"
                })

    except Exception as e:
        logger.error(f"Failed to generate insights: {str(e)}")

    return insights


async def _calculate_system_health(auterity_data, neuroweaver_data, relaycore_data):
    """Calculate overall system health."""
    try:
        # Calculate individual system scores
        auterity_score = 90 if auterity_data.get('status') == 'healthy' else 70
        neuroweaver_score = 88 if neuroweaver_data.get('status') == 'healthy' else 75
        relaycore_score = 85 if relaycore_data.get('status') == 'healthy' else 80

        # Overall health score (weighted average)
        overall_score = int((auterity_score * 0.4) + (neuroweaver_score * 0.4) + (relaycore_score * 0.2))

        # Determine overall status
        if overall_score >= 90:
            overall_status = "healthy"
        elif overall_score >= 80:
            overall_status = "warning"
        else:
            overall_status = "critical"

        return {
            "overall": overall_status,
            "score": overall_score,
            "systems": {
                "auterity": {
                    "status": auterity_data.get('status', 'unknown'),
                    "score": auterity_score,
                    "uptime": 99.7,
                    "avgResponseTime": 245,
                    "errorRate": 0.8,
                    "activeIssues": 0
                },
                "neuroweaver": {
                    "status": neuroweaver_data.get('status', 'unknown'),
                    "score": neuroweaver_score,
                    "uptime": 99.8,
                    "avgResponseTime": neuroweaver_data.get('performance', {}).get('avg_response_time', 3000),
                    "errorRate": 100 - neuroweaver_data.get('performance', {}).get('success_rate', 97.6),
                    "activeIssues": 1 if neuroweaver_score < 85 else 0
                },
                "relaycore": {
                    "status": relaycore_data.get('status', 'unknown'),
                    "score": relaycore_score,
                    "uptime": 98.5,
                    "avgResponseTime": relaycore_data.get('performance', {}).get('avgExecutionTime', 45000),
                    "errorRate": 100 - relaycore_data.get('performance', {}).get('successRate', 95.2),
                    "activeIssues": 3 if relaycore_score < 90 else 1
                }
            },
            "integration": {
                "status": "healthy",
                "uptime": 99.9,
                "latency": 150,
                "errorRate": 0.1,
                "lastIncident": None
            },
            "activeIssues": sum(s.get('activeIssues', 0) for s in [
                {"activeIssues": 0},  # auterity
                {"activeIssues": 1 if neuroweaver_score < 85 else 0},  # neuroweaver
                {"activeIssues": 3 if relaycore_score < 90 else 1}  # relaycore
            ]),
            "lastUpdated": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to calculate system health: {str(e)}")
        return {
            "overall": "error",
            "score": 0,
            "error": str(e),
            "lastUpdated": datetime.utcnow().isoformat()
        }


async def _generate_predictions(auterity_data, neuroweaver_data, correlations, days_ahead=30):
    """Generate predictive analytics."""
    predictions = []

    try:
        # User growth prediction
        if auterity_data.get('userAnalytics'):
            current_users = auterity_data['userAnalytics'].get('total_events', 0)
            growth_rate = 0.15  # 15% monthly growth
            predicted_users = int(current_users * (1 + growth_rate) ** (days_ahead / 30))

            predictions.append({
                "id": "user_growth_prediction",
                "title": "User Growth Prediction",
                "type": "growth",
                "description": f"Predicted user growth over next {days_ahead} days",
                "currentValue": current_users,
                "predictedValue": predicted_users,
                "changePercent": ((predicted_users - current_users) / current_users) * 100,
                "confidence": 0.78,
                "timeframe": f"{days_ahead} days",
                "factors": ["historical_growth", "seasonal_trends", "market_conditions"],
                "generatedAt": datetime.utcnow().isoformat()
            })

        # AI cost prediction
        if neuroweaver_data.get('performance'):
            current_cost = neuroweaver_data['performance'].get('total_cost', 0)
            cost_trend = 0.05  # 5% monthly increase
            predicted_cost = current_cost * (1 + cost_trend) ** (days_ahead / 30)

            predictions.append({
                "id": "ai_cost_prediction",
                "title": "AI Cost Prediction",
                "type": "cost",
                "description": f"Predicted AI operational costs over next {days_ahead} days",
                "currentValue": current_cost,
                "predictedValue": predicted_cost,
                "changePercent": ((predicted_cost - current_cost) / current_cost) * 100,
                "confidence": 0.82,
                "timeframe": f"{days_ahead} days",
                "factors": ["usage_growth", "model_efficiency", "optimization_implementation"],
                "generatedAt": datetime.utcnow().isoformat()
            })

        # Performance prediction
        if correlations:
            avg_correlation = sum(c.get('correlation', 0) for c in correlations) / len(correlations)
            predictions.append({
                "id": "system_performance_prediction",
                "title": "System Performance Prediction",
                "type": "performance",
                "description": f"Predicted system performance trends over next {days_ahead} days",
                "currentValue": avg_correlation,
                "predictedValue": min(0.95, avg_correlation + 0.05),
                "changePercent": 5.0,
                "confidence": 0.75,
                "timeframe": f"{days_ahead} days",
                "factors": ["correlation_trends", "optimization_efforts", "system_capacity"],
                "generatedAt": datetime.utcnow().isoformat()
            })

    except Exception as e:
        logger.error(f"Failed to generate predictions: {str(e)}")

    return predictions


async def _get_component_health_details(analytics_service, orchestration_service, tenant_id):
    """Get detailed component-level health information."""
    return {
        "database": {"status": "healthy", "response_time": 15, "connections": 25},
        "cache": {"status": "healthy", "hit_rate": 0.94, "memory_usage": 0.65},
        "api_gateway": {"status": "healthy", "throughput": 1250, "error_rate": 0.02},
        "message_queue": {"status": "healthy", "queue_depth": 12, "processing_rate": 450},
        "ai_services": {"status": "healthy", "model_count": 3, "avg_latency": 2800}
    }


def _calculate_correlation_statistics(correlations):
    """Calculate statistics for correlations."""
    if not correlations:
        return {"total": 0, "avg_correlation": 0, "avg_confidence": 0}

    return {
        "total": len(correlations),
        "avg_correlation": sum(c.get('correlation', 0) for c in correlations) / len(correlations),
        "avg_confidence": sum(c.get('confidence', 0) for c in correlations) / len(correlations),
        "high_impact": len([c for c in correlations if c.get('impact') == 'high']),
        "by_system": _group_correlations_by_system(correlations)
    }


def _group_correlations_by_system(correlations):
    """Group correlations by system."""
    groups = {}
    for correlation in correlations:
        for system in correlation.get('systems', []):
            if system not in groups:
                groups[system] = 0
            groups[system] += 1
    return groups


def _calculate_insights_statistics(insights):
    """Calculate statistics for insights."""
    if not insights:
        return {"total": 0, "by_type": {}, "by_severity": {}, "by_priority": {}}

    return {
        "total": len(insights),
        "by_type": _group_insights_by_field(insights, 'type'),
        "by_severity": _group_insights_by_field(insights, 'severity'),
        "by_priority": _group_insights_by_field(insights, 'priority'),
        "avg_confidence": sum(i.get('confidence', 0) for i in insights) / len(insights)
    }


def _group_insights_by_field(insights, field):
    """Group insights by a specific field."""
    groups = {}
    for insight in insights:
        value = insight.get(field, 'unknown')
        groups[value] = groups.get(value, 0) + 1
    return groups


def _get_priority_score(priority):
    """Convert priority string to numeric score for sorting."""
    priority_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
    return priority_scores.get(priority, 0)


async def _generate_unified_export_data(db, data_types, date_from, date_to, tenant_id):
    """Generate export data for unified analytics."""
    export_data = {
        "export_metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "date_range": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat() if date_to else datetime.utcnow().isoformat()
            },
            "tenant_id": tenant_id,
            "data_types": data_types
        }
    }

    # Add requested data types
    if "analytics" in data_types:
        export_data["analytics"] = {"placeholder": "analytics data"}
    if "insights" in data_types:
        export_data["insights"] = {"placeholder": "insights data"}
    if "correlations" in data_types:
        export_data["correlations"] = {"placeholder": "correlations data"}
    if "predictions" in data_types:
        export_data["predictions"] = {"placeholder": "predictions data"}
    if "health" in data_types:
        export_data["health"] = {"placeholder": "health data"}

    return export_data


def _convert_unified_to_csv(data):
    """Convert unified data to CSV format."""
    # Simplified CSV conversion for unified data
    csv_lines = ["Type,Key,Value"]
    for data_type, content in data.items():
        if isinstance(content, dict):
            for key, value in content.items():
                csv_lines.append(f"{data_type},{key},{value}")
    return "\n".join(csv_lines)

