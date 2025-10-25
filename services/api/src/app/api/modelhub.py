"""ModelHub API endpoints for AI/ML analytics and optimization."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.services.ai_model_orchestration_service import AIModelOrchestrationService
from app.middleware.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/modelhub", tags=["modelhub"])


# ============================================================================
# ML ANALYTICS ENDPOINTS
# ============================================================================

@router.get("")
async def get_ml_analytics_overview(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    model_ids: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive ML analytics overview."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)
    if not date_to:
        date_to = datetime.utcnow()

    try:
        # Initialize orchestration service
        orchestration_service = AIModelOrchestrationService(db)

        # Get ML analytics data
        analytics = await _get_ml_analytics_data(
            orchestration_service, date_from, date_to, model_ids
        )

        # Get prompt analytics
        prompt_analytics = await _get_prompt_analytics_data(
            db, current_user.tenant_id, date_from, date_to
        )

        # Get cost optimization data
        cost_optimization = await _get_cost_optimization_data(
            orchestration_service, date_from, date_to
        )

        return {
            "models": analytics.get("models", []),
            "performance": analytics.get("performance", []),
            "promptAnalytics": prompt_analytics,
            "costOptimization": cost_optimization,
            "experiments": analytics.get("experiments", []),
            "summary": analytics.get("summary", {}),
            "timeRange": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat()
            },
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get ML analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get ML analytics: {str(e)}")


@router.get("/models/{model_id}/performance")
async def get_model_performance(
    model_id: str,
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed performance metrics for a specific model."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        orchestration_service = AIModelOrchestrationService(db)

        # Get model performance from orchestration service
        performance_data = await orchestration_service.get_model_performance_metrics(model_id)

        if "error" in performance_data:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        # Get additional analytics
        usage_trends = await _get_model_usage_trends(db, model_id, date_from, date_to)
        cost_analysis = await _get_model_cost_analysis(db, model_id, date_from, date_to)
        quality_metrics = await _get_model_quality_metrics(db, model_id, date_from, date_to)

        return {
            "model_id": model_id,
            "performance": performance_data,
            "usage_trends": usage_trends,
            "cost_analysis": cost_analysis,
            "quality_metrics": quality_metrics,
            "time_range": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat() if date_to else datetime.utcnow().isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model performance: {str(e)}")


@router.get("/prompts/analytics")
async def get_prompt_analytics(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    tags: Optional[List[str]] = Query(None),
    categories: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive prompt analytics and optimization insights."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        prompt_analytics = await _get_prompt_analytics_data(
            db, current_user.tenant_id, date_from, date_to, tags, categories
        )

        # Add additional insights
        optimization_suggestions = await _generate_prompt_optimization_suggestions(
            prompt_analytics
        )

        return {
            "analytics": prompt_analytics,
            "optimization_suggestions": optimization_suggestions,
            "time_range": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat() if date_to else datetime.utcnow().isoformat()
            },
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get prompt analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get prompt analytics: {str(e)}")


@router.post("/prompts/track")
async def track_prompt_output(
    prompt_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Track a prompt and its output for analytics."""

    try:
        # Validate required fields
        required_fields = ['prompt', 'output', 'modelId']
        for field in required_fields:
            if field not in prompt_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Add metadata
        prompt_data.update({
            'user_id': str(current_user.id),
            'tenant_id': str(current_user.tenant_id),
            'tracked_at': datetime.utcnow().isoformat(),
            'session_id': prompt_data.get('sessionId'),
            'tags': prompt_data.get('tags', []),
            'category': prompt_data.get('category'),
            'context': prompt_data.get('context', {})
        })

        # Store in database (would use a dedicated model in production)
        # For now, we'll log it and return a mock ID
        prompt_id = f"prompt_{datetime.utcnow().timestamp()}_{hash(prompt_data['prompt']) % 10000}"

        logger.info(f"Tracked prompt: {prompt_id} for user {current_user.id}")

        return {
            "id": prompt_id,
            "status": "tracked",
            "tracked_at": prompt_data['tracked_at']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to track prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to track prompt: {str(e)}")


@router.post("/feedback")
async def submit_feedback(
    feedback_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submit feedback for a prompt/output pair."""

    try:
        required_fields = ['promptOutputId', 'rating', 'feedbackType']
        for field in required_fields:
            if field not in feedback_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Add metadata
        feedback_data.update({
            'user_id': str(current_user.id),
            'tenant_id': str(current_user.tenant_id),
            'submitted_at': datetime.utcnow().isoformat(),
            'context': feedback_data.get('context', {})
        })

        # Store feedback (would use dedicated model in production)
        feedback_id = f"feedback_{datetime.utcnow().timestamp()}_{hash(str(feedback_data)) % 10000}"

        logger.info(f"Feedback submitted: {feedback_id} for prompt {feedback_data['promptOutputId']}")

        return {
            "feedback_id": feedback_id,
            "status": "submitted",
            "submitted_at": feedback_data['submitted_at']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")


# ============================================================================
# MODEL MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/models")
async def list_models(
    status: Optional[str] = Query(None),
    provider: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all available AI models with their status and capabilities."""

    try:
        orchestration_service = AIModelOrchestrationService(db)

        # Get all models from registry
        all_models = []
        for model_id, model_profile in orchestration_service.model_registry.items():
            if status and model_profile.status.value != status:
                continue
            if provider and model_profile.provider != provider:
                continue

            all_models.append({
                "id": model_profile.model_id,
                "name": model_profile.model_id,
                "provider": model_profile.provider,
                "version": model_profile.version,
                "capabilities": model_profile.capabilities,
                "supported_tasks": model_profile.supported_tasks,
                "status": model_profile.status.value,
                "cost_per_1k_tokens": float(model_profile.cost_per_1k_tokens),
                "max_tokens": model_profile.max_tokens,
                "avg_latency_ms": model_profile.avg_latency_ms,
                "success_rate": model_profile.success_rate,
                "total_requests": model_profile.total_requests,
                "last_used": model_profile.last_used.isoformat() if model_profile.last_used else None
            })

        return {
            "models": all_models,
            "summary": {
                "total_models": len(all_models),
                "active_models": len([m for m in all_models if m['status'] == 'active']),
                "by_provider": _group_models_by_provider(all_models),
                "by_status": _group_models_by_status(all_models)
            }
        }

    except Exception as e:
        logger.error(f"Failed to list models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.get("/models/{model_id}")
async def get_model_details(
    model_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific model."""

    try:
        orchestration_service = AIModelOrchestrationService(db)

        if model_id not in orchestration_service.model_registry:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

        model_profile = orchestration_service.model_registry[model_id]

        # Get performance metrics
        performance_metrics = await orchestration_service.get_model_performance_metrics(model_id)

        return {
            "model": {
                "id": model_profile.model_id,
                "name": model_profile.model_id,
                "provider": model_profile.provider,
                "version": model_profile.version,
                "capabilities": model_profile.capabilities,
                "supported_tasks": model_profile.supported_tasks,
                "status": model_profile.status.value,
                "cost_per_1k_tokens": float(model_profile.cost_per_1k_tokens),
                "max_tokens": model_profile.max_tokens,
                "avg_latency_ms": model_profile.avg_latency_ms,
                "success_rate": model_profile.success_rate,
                "total_requests": model_profile.total_requests,
                "successful_requests": model_profile.successful_requests,
                "total_tokens": model_profile.total_tokens,
                "total_cost": float(model_profile.total_cost),
                "avg_response_time": model_profile.avg_response_time,
                "last_used": model_profile.last_used.isoformat() if model_profile.last_used else None
            },
            "performance": performance_metrics,
            "metadata": model_profile.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get model details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get model details: {str(e)}")


# ============================================================================
# EXPERIMENT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/experiments")
async def list_experiments(
    status: Optional[str] = Query(None),
    experiment_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List A/B testing experiments."""

    try:
        orchestration_service = AIModelOrchestrationService(db)

        experiments = []
        for exp_id, experiment in orchestration_service.active_experiments.items():
            if status and experiment.status != status:
                continue
            if experiment_type and experiment.type.value != experiment_type:
                continue

            experiments.append({
                "id": exp_id,
                "name": experiment.name,
                "type": experiment.type.value,
                "status": experiment.status,
                "variants": experiment.variants,
                "target_metric": experiment.target_metric,
                "traffic_allocation": experiment.traffic_allocation,
                "start_date": experiment.start_date.isoformat(),
                "end_date": experiment.end_date.isoformat() if experiment.end_date else None,
                "total_requests": experiment.total_requests
            })

        return {
            "experiments": experiments,
            "summary": {
                "total_experiments": len(experiments),
                "active_experiments": len([e for e in experiments if e['status'] == 'active']),
                "by_type": _group_experiments_by_type(experiments),
                "by_status": _group_experiments_by_status(experiments)
            }
        }

    except Exception as e:
        logger.error(f"Failed to list experiments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list experiments: {str(e)}")


@router.post("/experiments")
async def create_experiment(
    experiment_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new A/B testing experiment."""

    try:
        required_fields = ['name', 'type', 'variants', 'target_metric']
        for field in required_fields:
            if field not in experiment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        orchestration_service = AIModelOrchestrationService(db)

        # Create experiment using the orchestration service
        from app.services.ai_model_orchestration_service import ExperimentType

        experiment_type = ExperimentType(experiment_data['type'])
        experiment = await orchestration_service.create_experiment(
            name=experiment_data['name'],
            experiment_type=experiment_type,
            variants=experiment_data['variants'],
            target_metric=experiment_data.get('target_metric', 'success_rate'),
            duration_days=experiment_data.get('duration_days', 7)
        )

        return {
            "experiment": {
                "id": experiment.id,
                "name": experiment.name,
                "type": experiment.type.value,
                "status": experiment.status,
                "variants": experiment.variants,
                "traffic_allocation": experiment.traffic_allocation,
                "start_date": experiment.start_date.isoformat(),
                "end_date": experiment.end_date.isoformat() if experiment.end_date else None
            },
            "status": "created"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create experiment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create experiment: {str(e)}")


@router.get("/experiments/{experiment_id}/results")
async def get_experiment_results(
    experiment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed results for a specific experiment."""

    try:
        orchestration_service = AIModelOrchestrationService(db)

        results = await orchestration_service.get_experiment_results(experiment_id)

        if "error" in results:
            raise HTTPException(status_code=404, detail=results["error"])

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment results: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get experiment results: {str(e)}")


# ============================================================================
# COST OPTIMIZATION ENDPOINTS
# ============================================================================

@router.get("/costs")
async def get_cost_analytics(
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    model_ids: Optional[List[str]] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive cost analytics and optimization recommendations."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        orchestration_service = AIModelOrchestrationService(db)

        # Get cost data from orchestration service
        cost_data = await _get_cost_optimization_data(orchestration_service, date_from, date_to)

        # Add optimization suggestions
        suggestions = await _generate_cost_optimization_suggestions(cost_data)

        return {
            "cost_analytics": cost_data,
            "optimization_suggestions": suggestions,
            "time_range": {
                "from": date_from.isoformat(),
                "to": date_to.isoformat() if date_to else datetime.utcnow().isoformat()
            },
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get cost analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get cost analytics: {str(e)}")


@router.get("/optimization/suggestions")
async def get_optimization_suggestions(
    optimization_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered optimization suggestions."""

    try:
        # Generate optimization suggestions based on current data
        suggestions = await _generate_optimization_suggestions(db, optimization_type)

        return {
            "suggestions": suggestions,
            "generated_at": datetime.utcnow().isoformat(),
            "optimization_types": ["performance", "cost", "quality", "reliability"]
        }

    except Exception as e:
        logger.error(f"Failed to get optimization suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get optimization suggestions: {str(e)}")


# ============================================================================
# EXPORT ENDPOINTS
# ============================================================================

@router.get("/export")
async def export_ml_data(
    format: str = Query("json", regex="^(json|csv|pdf)$"),
    data_type: str = Query("analytics", regex="^(analytics|prompts|performance|experiments|costs)$"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export ML analytics data in various formats."""

    if not date_from:
        date_from = datetime.utcnow() - timedelta(days=30)

    try:
        # Generate export data based on type
        export_data = await _generate_export_data(
            db, data_type, date_from, date_to, current_user.tenant_id
        )

        # Format the data
        if format == "json":
            return export_data
        elif format == "csv":
            # Convert to CSV format
            csv_content = _convert_to_csv(export_data)
            return {"format": "csv", "content": csv_content, "filename": f"ml_{data_type}_export.csv"}
        elif format == "pdf":
            # Generate PDF (simplified for now)
            return {"format": "pdf", "content": "PDF generation not implemented", "filename": f"ml_{data_type}_export.pdf"}

    except Exception as e:
        logger.error(f"Failed to export data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export data: {str(e)}")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _get_ml_analytics_data(orchestration_service, date_from, date_to, model_ids):
    """Get ML analytics data from orchestration service."""
    # Mock data - would integrate with actual service
    return {
        "models": [
            {"id": "gpt-4", "name": "GPT-4", "provider": "openai", "status": "active"},
            {"id": "claude-3", "name": "Claude-3", "provider": "anthropic", "status": "active"}
        ],
        "performance": [
            {
                "modelId": "gpt-4",
                "totalRequests": 1250,
                "successRate": 97.6,
                "avgResponseTime": 3200,
                "totalCost": 7.2,
                "avgRating": 4.7
            },
            {
                "modelId": "claude-3",
                "totalRequests": 890,
                "successRate": 98.2,
                "avgResponseTime": 2800,
                "totalCost": 4.8,
                "avgRating": 4.6
            }
        ],
        "experiments": [],
        "summary": {
            "totalModels": 2,
            "activeModels": 2,
            "totalRequests": 2140,
            "avgResponseTime": 3000,
            "totalCost": 15.8,
            "avgRating": 4.6,
            "acceptanceRate": 85.2
        }
    }


async def _get_prompt_analytics_data(db, tenant_id, date_from, date_to, tags=None, categories=None):
    """Get prompt analytics data."""
    # Mock data - would query actual prompt tracking tables
    return {
        "totalPrompts": 1250,
        "uniquePrompts": 890,
        "avgPromptLength": 145,
        "avgOutputLength": 380,
        "categoryPerformance": [],
        "patterns": [],
        "qualityMetrics": {
            "avgRating": 4.6,
            "acceptanceRate": 85.2,
            "rejectionRate": 14.8,
            "improvementSuggestions": []
        },
        "trendingTopics": []
    }


async def _get_cost_optimization_data(orchestration_service, date_from, date_to):
    """Get cost optimization data."""
    return {
        "totalCost": 15.8,
        "projectedSavings": 3.2,
        "optimizationOpportunities": [
            {
                "type": "model_routing",
                "description": "Route creative tasks to Claude-3",
                "potentialSavings": 2400,
                "implementationEffort": "medium",
                "confidence": 0.89
            }
        ],
        "costByModel": [
            {"modelId": "gpt-4", "cost": 7.2, "percentage": 45},
            {"modelId": "claude-3", "cost": 4.8, "percentage": 30}
        ],
        "recommendations": []
    }


async def _get_model_usage_trends(db, model_id, date_from, date_to):
    """Get model usage trends."""
    return [
        {"date": "2024-01-01", "requests": 50, "cost": 0.3},
        {"date": "2024-01-02", "requests": 45, "cost": 0.28}
    ]


async def _get_model_cost_analysis(db, model_id, date_from, date_to):
    """Get model cost analysis."""
    return {
        "totalCost": 7.2,
        "avgCostPerRequest": 0.00576,
        "costTrend": "stable",
        "efficiency": 0.85
    }


async def _get_model_quality_metrics(db, model_id, date_from, date_to):
    """Get model quality metrics."""
    return {
        "avgRating": 4.7,
        "acceptanceRate": 85.2,
        "errorRate": 2.4,
        "userSatisfaction": 4.6
    }


async def _generate_prompt_optimization_suggestions(analytics):
    """Generate prompt optimization suggestions."""
    return [
        {
            "suggestion": "Add context keywords to improve response relevance",
            "impact": "high",
            "confidence": 0.85,
            "expectedImprovement": 15
        }
    ]


async def _generate_cost_optimization_suggestions(cost_data):
    """Generate cost optimization suggestions."""
    return cost_data.get("optimizationOpportunities", [])


async def _generate_optimization_suggestions(db, optimization_type):
    """Generate general optimization suggestions."""
    return [
        {
            "type": "model_routing",
            "title": "Implement Smart Model Routing",
            "description": "Automatically route tasks to optimal models",
            "priority": "high",
            "effort": "medium",
            "expectedImpact": 2400
        }
    ]


def _group_models_by_provider(models):
    """Group models by provider."""
    groups = {}
    for model in models:
        provider = model['provider']
        groups[provider] = groups.get(provider, 0) + 1
    return groups


def _group_models_by_status(models):
    """Group models by status."""
    groups = {}
    for model in models:
        status = model['status']
        groups[status] = groups.get(status, 0) + 1
    return groups


def _group_experiments_by_type(experiments):
    """Group experiments by type."""
    groups = {}
    for exp in experiments:
        exp_type = exp['type']
        groups[exp_type] = groups.get(exp_type, 0) + 1
    return groups


def _group_experiments_by_status(experiments):
    """Group experiments by status."""
    groups = {}
    for exp in experiments:
        status = exp['status']
        groups[status] = groups.get(status, 0) + 1
    return groups


async def _generate_export_data(db, data_type, date_from, date_to, tenant_id):
    """Generate export data."""
    if data_type == "analytics":
        return {"type": "analytics", "data": "export data"}
    elif data_type == "prompts":
        return {"type": "prompts", "data": "prompt export data"}
    elif data_type == "performance":
        return {"type": "performance", "data": "performance export data"}
    elif data_type == "experiments":
        return {"type": "experiments", "data": "experiment export data"}
    elif data_type == "costs":
        return {"type": "costs", "data": "cost export data"}
    else:
        return {"type": data_type, "data": "unknown export type"}


def _convert_to_csv(data):
    """Convert data to CSV format."""
    # Simplified CSV conversion
    return "id,name,value\n1,Sample Data,100\n2,Sample Data 2,200"

