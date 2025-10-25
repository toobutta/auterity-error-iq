"""Process Mining API endpoints for workflow pattern analysis."""

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.process_mining_engine import ProcessMiningEngine
from app.schemas.process_mining import (
    ProcessMiningRequest,
    ProcessMiningResponse,
    ProcessPattern,
    BottleneckAnalysis
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process-mining", tags=["process-mining"])


@router.post("/analyze/{workflow_id}", response_model=ProcessMiningResponse)
async def analyze_workflow_patterns(
    workflow_id: UUID,
    request: Optional[ProcessMiningRequest] = None,
    db: Session = Depends(get_db)
):
    """Analyze workflow execution patterns using process mining techniques.

    This endpoint leverages the Process Mining Engine to:
    - Discover frequent execution patterns
    - Identify performance bottlenecks
    - Calculate workflow efficiency scores
    - Generate optimization recommendations

    Args:
        workflow_id: UUID of the workflow to analyze
        request: Optional request parameters for analysis customization
        db: Database session dependency

    Returns:
        ProcessMiningResponse: Complete analysis results with patterns, bottlenecks, and recommendations
    """
    try:
        # Initialize the process mining engine
        engine = ProcessMiningEngine(db)

        # Use default parameters if not provided
        if request is None:
            request = ProcessMiningRequest()

        # Perform the analysis
        result = await engine.analyze_workflow_patterns(
            workflow_id=workflow_id,
            days_back=request.days_back,
            min_support=request.min_support,
            min_confidence=request.min_confidence
        )

        # Convert to response schema
        response = ProcessMiningResponse(
            workflow_id=result.workflow_id,
            analysis_period=result.analysis_period,
            total_executions=result.total_executions,
            patterns_discovered=[
                ProcessPattern(
                    pattern_id=pattern.pattern_id,
                    pattern_type=pattern.pattern_type,
                    steps=pattern.steps,
                    frequency=pattern.frequency,
                    avg_duration=pattern.avg_duration,
                    success_rate=pattern.success_rate,
                    confidence=pattern.confidence,
                    support=pattern.support,
                    first_seen=pattern.first_seen,
                    last_seen=pattern.last_seen,
                    metadata=pattern.metadata
                )
                for pattern in result.patterns_discovered
            ],
            bottlenecks=[
                BottleneckAnalysis(
                    step_name=bottleneck.step_name,
                    avg_duration=bottleneck.avg_duration,
                    max_duration=bottleneck.max_duration,
                    frequency=bottleneck.frequency,
                    impact_score=bottleneck.impact_score,
                    recommendations=bottleneck.recommendations
                )
                for bottleneck in result.bottlenecks
            ],
            efficiency_score=result.efficiency_score,
            optimization_opportunities=result.optimization_opportunities,
            generated_at=result.generated_at
        )

        logger.info(f"Process mining analysis completed for workflow {workflow_id}")
        return response

    except Exception as e:
        logger.error(f"Process mining analysis failed for workflow {workflow_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Process mining analysis failed: {str(e)}"
        )


@router.get("/analyze/{workflow_id}/cached", response_model=Optional[ProcessMiningResponse])
async def get_cached_analysis(
    workflow_id: UUID,
    db: Session = Depends(get_db)
):
    """Get cached process mining analysis results if available.

    This endpoint provides quick access to previously computed analysis results
    without re-running the expensive mining algorithms.

    Args:
        workflow_id: UUID of the workflow to retrieve cached analysis for
        db: Database session dependency

    Returns:
        Optional[ProcessMiningResponse]: Cached analysis results or None if not available
    """
    try:
        engine = ProcessMiningEngine(db)
        cached_result = await engine.get_cached_analysis(workflow_id)

        if cached_result is None:
            return None

        # Convert to response schema
        response = ProcessMiningResponse(
            workflow_id=cached_result.workflow_id,
            analysis_period=cached_result.analysis_period,
            total_executions=cached_result.total_executions,
            patterns_discovered=[
                ProcessPattern(
                    pattern_id=pattern.pattern_id,
                    pattern_type=pattern.pattern_type,
                    steps=pattern.steps,
                    frequency=pattern.frequency,
                    avg_duration=pattern.avg_duration,
                    success_rate=pattern.success_rate,
                    confidence=pattern.confidence,
                    support=pattern.support,
                    first_seen=pattern.first_seen,
                    last_seen=pattern.last_seen,
                    metadata=pattern.metadata
                )
                for pattern in cached_result.patterns_discovered
            ],
            bottlenecks=[
                BottleneckAnalysis(
                    step_name=bottleneck.step_name,
                    avg_duration=bottleneck.avg_duration,
                    max_duration=bottleneck.max_duration,
                    frequency=bottleneck.frequency,
                    impact_score=bottleneck.impact_score,
                    recommendations=bottleneck.recommendations
                )
                for bottleneck in cached_result.bottlenecks
            ],
            efficiency_score=cached_result.efficiency_score,
            optimization_opportunities=cached_result.optimization_opportunities,
            generated_at=cached_result.generated_at
        )

        return response

    except Exception as e:
        logger.error(f"Failed to retrieve cached analysis for workflow {workflow_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cached analysis: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint for the process mining service.

    Returns:
        dict: Service health status
    """
    return {
        "status": "healthy",
        "service": "process-mining-engine",
        "version": "1.0.0"
    }
