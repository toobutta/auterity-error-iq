"""
Cognitive Automation API endpoints.

This module provides REST API endpoints for AI-powered workflow optimization,
cognitive insights, and automated workflow evolution.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import logging

from app.services.cognitive_engine import get_cognitive_engine, OptimizationType, RecommendationPriority

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cognitive", tags=["cognitive"])


# Pydantic models for API requests/responses
class AnalyzeWorkflowRequest(BaseModel):
    """Request model for workflow analysis."""
    workflow_id: str = Field(..., description="ID of the workflow to analyze")


class OptimizeWorkflowRequest(BaseModel):
    """Request model for workflow optimization."""
    workflow_id: str = Field(..., description="ID of the workflow to optimize")
    optimization_type: str = Field(..., description="Type of optimization (performance, cost, reliability, efficiency)")


class EvolveWorkflowRequest(BaseModel):
    """Request model for workflow evolution."""
    workflow_id: str = Field(..., description="ID of the workflow to evolve")
    generations: int = Field(5, description="Number of evolution generations", ge=1, le=20)


class CognitiveInsightResponse(BaseModel):
    """Response model for cognitive insights."""
    insight_type: str
    workflow_id: str
    description: str
    severity: str
    metrics: Dict[str, Any]
    recommendations: List[str]
    confidence: float


class OptimizationRecommendationResponse(BaseModel):
    """Response model for optimization recommendations."""
    workflow_id: str
    optimization_type: str
    priority: str
    description: str
    expected_impact: Dict[str, float]
    implementation_complexity: str
    confidence_score: float
    suggested_changes: Dict[str, Any]


class WorkflowOptimizationResponse(BaseModel):
    """Response model for workflow optimization results."""
    original_workflow: Dict[str, Any]
    optimized_workflow: Dict[str, Any]
    optimization_type: str
    validation_result: Dict[str, Any]
    estimated_improvements: Dict[str, float]


class WorkflowEvolutionResponse(BaseModel):
    """Response model for workflow evolution results."""
    original_workflow: Dict[str, Any]
    evolved_workflow: Dict[str, Any]
    evolution_history: List[Dict[str, Any]]
    final_score: float
    generations_completed: int


@router.post("/analyze", response_model=List[CognitiveInsightResponse])
async def analyze_workflow(request: AnalyzeWorkflowRequest) -> List[Dict[str, Any]]:
    """
    Analyze a workflow and generate cognitive insights.

    This endpoint performs comprehensive analysis of workflow performance,
    detects bottlenecks, recognizes patterns, and provides actionable insights.
    """
    try:
        cognitive_engine = await get_cognitive_engine()
        insights = await cognitive_engine.analyze_workflow(request.workflow_id)

        return [
            {
                "insight_type": insight.insight_type,
                "workflow_id": insight.workflow_id,
                "description": insight.description,
                "severity": insight.severity,
                "metrics": insight.metrics,
                "recommendations": insight.recommendations,
                "confidence": insight.confidence
            }
            for insight in insights
        ]

    except Exception as e:
        logger.error(f"Failed to analyze workflow {request.workflow_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze workflow: {str(e)}"
        )


@router.post("/recommendations", response_model=List[OptimizationRecommendationResponse])
async def get_recommendations(request: AnalyzeWorkflowRequest) -> List[Dict[str, Any]]:
    """
    Generate optimization recommendations for a workflow.

    This endpoint analyzes the workflow and provides prioritized recommendations
    for performance, cost, reliability, and efficiency improvements.
    """
    try:
        cognitive_engine = await get_cognitive_engine()
        recommendations = await cognitive_engine.generate_recommendations(request.workflow_id)

        return [
            {
                "workflow_id": rec.workflow_id,
                "optimization_type": rec.optimization_type.value,
                "priority": rec.priority.value,
                "description": rec.description,
                "expected_impact": rec.expected_impact,
                "implementation_complexity": rec.implementation_complexity,
                "confidence_score": rec.confidence_score,
                "suggested_changes": rec.suggested_changes
            }
            for rec in recommendations
        ]

    except Exception as e:
        logger.error(f"Failed to generate recommendations for {request.workflow_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.post("/optimize", response_model=WorkflowOptimizationResponse)
async def optimize_workflow(
    request: OptimizeWorkflowRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Automatically optimize a workflow.

    This endpoint applies AI-powered optimization to improve workflow
    performance, cost efficiency, reliability, or overall efficiency.
    """
    try:
        # Validate optimization type
        try:
            opt_type = OptimizationType(request.optimization_type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid optimization type: {request.optimization_type}. "
                       f"Valid types: {[t.value for t in OptimizationType]}"
            )

        cognitive_engine = await get_cognitive_engine()
        result = await cognitive_engine.optimize_workflow(request.workflow_id, opt_type)

        # Add background task to update workflow in database if optimization is successful
        if result["validation_result"]["is_valid"]:
            background_tasks.add_task(
                _update_optimized_workflow,
                request.workflow_id,
                result["optimized_workflow"]
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to optimize workflow {request.workflow_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to optimize workflow: {str(e)}"
        )


@router.post("/evolve", response_model=WorkflowEvolutionResponse)
async def evolve_workflow(
    request: EvolveWorkflowRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Evolve a workflow through multiple optimization generations.

    This endpoint uses evolutionary algorithms to progressively improve
    workflow performance through multiple generations of optimization.
    """
    try:
        cognitive_engine = await get_cognitive_engine()
        result = await cognitive_engine.evolve_workflow(request.workflow_id, request.generations)

        # Add background task to save evolved workflow
        background_tasks.add_task(
            _save_evolved_workflow,
            request.workflow_id,
            result["evolved_workflow"],
            result["evolution_history"]
        )

        return result

    except Exception as e:
        logger.error(f"Failed to evolve workflow {request.workflow_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evolve workflow: {str(e)}"
        )


@router.get("/insights/{workflow_id}", response_model=List[CognitiveInsightResponse])
async def get_workflow_insights(workflow_id: str) -> List[Dict[str, Any]]:
    """
    Get cached cognitive insights for a workflow.

    This endpoint returns previously generated insights for faster access.
    """
    try:
        cognitive_engine = await get_cognitive_engine()
        insights = await cognitive_engine.analyze_workflow(workflow_id)

        return [
            {
                "insight_type": insight.insight_type,
                "workflow_id": insight.workflow_id,
                "description": insight.description,
                "severity": insight.severity,
                "metrics": insight.metrics,
                "recommendations": insight.recommendations,
                "confidence": insight.confidence
            }
            for insight in insights
        ]

    except Exception as e:
        logger.error(f"Failed to get insights for workflow {workflow_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get workflow insights: {str(e)}"
        )


@router.get("/health")
async def cognitive_health_check():
    """Health check for cognitive services."""
    try:
        cognitive_engine = await get_cognitive_engine()

        # Check if models are trained
        has_performance_model = hasattr(cognitive_engine, 'performance_model') and cognitive_engine.performance_model is not None
        has_clustering_model = hasattr(cognitive_engine, 'cluster_model') and cognitive_engine.cluster_model is not None

        return {
            "status": "healthy" if (has_performance_model and has_clustering_model) else "initializing",
            "performance_model_trained": has_performance_model,
            "clustering_model_trained": has_clustering_model,
            "insights_cache_size": len(cognitive_engine.insights_cache),
            "recommendations_cache_size": len(cognitive_engine.recommendations_cache),
            "timestamp": "2025-01-31T14:30:00Z"
        }

    except Exception as e:
        logger.error(f"Cognitive health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": "2025-01-31T14:30:00Z"
        }


@router.get("/stats")
async def get_cognitive_stats():
    """Get cognitive engine statistics and performance metrics."""
    try:
        cognitive_engine = await get_cognitive_engine()

        return {
            "insights_generated": len(cognitive_engine.insights_cache),
            "recommendations_generated": len(cognitive_engine.recommendations_cache),
            "performance_model_accuracy": getattr(cognitive_engine, 'performance_model_accuracy', None),
            "clustering_model_silhouette_score": getattr(cognitive_engine, 'clustering_silhouette_score', None),
            "cache_hit_rate": getattr(cognitive_engine, 'cache_hit_rate', 0.0),
            "average_analysis_time": getattr(cognitive_engine, 'avg_analysis_time', 0.0),
            "total_optimizations_performed": getattr(cognitive_engine, 'total_optimizations', 0),
            "timestamp": "2025-01-31T14:30:00Z"
        }

    except Exception as e:
        logger.error(f"Failed to get cognitive stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get cognitive statistics: {str(e)}"
        )


# Background task functions
async def _update_optimized_workflow(workflow_id: str, optimized_workflow: Dict[str, Any]):
    """Background task to update optimized workflow in database."""
    try:
        from app.database import get_db
        import json

        async with get_db() as db:
            await db.execute(
                """
                UPDATE workflows
                SET definition = :definition,
                    updated_at = CURRENT_TIMESTAMP,
                    metadata = json_set(metadata, '$.last_optimized', CURRENT_TIMESTAMP)
                WHERE id = :workflow_id
                """,
                {
                    "workflow_id": workflow_id,
                    "definition": json.dumps(optimized_workflow)
                }
            )
            await db.commit()

        logger.info(f"Updated optimized workflow {workflow_id} in database")

    except Exception as e:
        logger.error(f"Failed to update optimized workflow {workflow_id}: {e}")


async def _save_evolved_workflow(workflow_id: str, evolved_workflow: Dict[str, Any], evolution_history: List[Dict[str, Any]]):
    """Background task to save evolved workflow and history."""
    try:
        from app.database import get_db
        import json

        async with get_db() as db:
            # Save evolved workflow
            await db.execute(
                """
                UPDATE workflows
                SET definition = :definition,
                    updated_at = CURRENT_TIMESTAMP,
                    metadata = json_set(
                        metadata,
                        '$.last_evolved',
                        json_object(
                            'timestamp', CURRENT_TIMESTAMP,
                            'generations', :generations,
                            'final_score', :final_score
                        )
                    )
                WHERE id = :workflow_id
                """,
                {
                    "workflow_id": workflow_id,
                    "definition": json.dumps(evolved_workflow),
                    "generations": len(evolution_history),
                    "final_score": evolution_history[-1]["score"] if evolution_history else 0
                }
            )

            # Save evolution history (could be stored in a separate table)
            await db.execute(
                """
                INSERT INTO workflow_evolution_history
                (workflow_id, evolution_data, created_at)
                VALUES (:workflow_id, :evolution_data, CURRENT_TIMESTAMP)
                """,
                {
                    "workflow_id": workflow_id,
                    "evolution_data": json.dumps({
                        "history": evolution_history,
                        "final_workflow": evolved_workflow
                    })
                }
            )

            await db.commit()

        logger.info(f"Saved evolved workflow {workflow_id} with {len(evolution_history)} generations")

    except Exception as e:
        logger.error(f"Failed to save evolved workflow {workflow_id}: {e}")


# Error handlers
@router.exception_handler(ValueError)
async def validation_exception_handler(request, exc):
    """Handle validation errors with appropriate HTTP status"""
    return {
        "error": "Validation Error",
        "message": str(exc),
        "type": "validation_error"
    }


@router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception in cognitive API: {str(exc)}")
    return {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
        "type": "internal_error"
    }
