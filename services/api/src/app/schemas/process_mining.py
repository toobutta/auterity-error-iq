"""Pydantic schemas for Process Mining API."""

from datetime import datetime
from typing import Dict, List, Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProcessMiningRequest(BaseModel):
    """Request schema for process mining analysis."""

    days_back: int = Field(
        default=30,
        ge=1,
        le=365,
        description="Number of days to analyze (1-365)"
    )
    min_support: float = Field(
        default=0.1,
        ge=0.01,
        le=1.0,
        description="Minimum support threshold for pattern discovery (0.01-1.0)"
    )
    min_confidence: float = Field(
        default=0.7,
        ge=0.1,
        le=1.0,
        description="Minimum confidence threshold for pattern validation (0.1-1.0)"
    )


class ProcessPattern(BaseModel):
    """Schema for discovered process patterns."""

    pattern_id: str = Field(..., description="Unique identifier for the pattern")
    pattern_type: str = Field(
        ...,
        description="Type of pattern (sequence, parallel, choice, loop)"
    )
    steps: List[str] = Field(..., description="Steps in the pattern")
    frequency: int = Field(..., description="How often this pattern occurs")
    avg_duration: float = Field(..., description="Average duration in milliseconds")
    success_rate: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Success rate as percentage (0-100)"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0-1)"
    )
    support: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Support score (0-1)"
    )
    first_seen: datetime = Field(..., description="When this pattern was first observed")
    last_seen: datetime = Field(..., description="When this pattern was last observed")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional pattern metadata"
    )


class BottleneckAnalysis(BaseModel):
    """Schema for bottleneck analysis results."""

    step_name: str = Field(..., description="Name of the workflow step")
    avg_duration: float = Field(
        ...,
        description="Average execution duration in milliseconds"
    )
    max_duration: float = Field(
        ...,
        description="Maximum execution duration in milliseconds"
    )
    frequency: int = Field(..., description="How often this step is executed")
    impact_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Impact score indicating bottleneck severity (0-1)"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Suggested improvements for this bottleneck"
    )


class ProcessMiningResponse(BaseModel):
    """Response schema for process mining analysis."""

    workflow_id: UUID = Field(..., description="UUID of the analyzed workflow")
    analysis_period: str = Field(
        ...,
        description="Time period covered by the analysis"
    )
    total_executions: int = Field(
        ...,
        description="Total number of workflow executions analyzed"
    )
    patterns_discovered: List[ProcessPattern] = Field(
        default_factory=list,
        description="List of discovered process patterns"
    )
    bottlenecks: List[BottleneckAnalysis] = Field(
        default_factory=list,
        description="List of identified bottlenecks"
    )
    efficiency_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall workflow efficiency score (0-1)"
    )
    optimization_opportunities: List[str] = Field(
        default_factory=list,
        description="List of recommended optimization opportunities"
    )
    generated_at: datetime = Field(
        ...,
        description="Timestamp when the analysis was generated"
    )


class ProcessMiningSummary(BaseModel):
    """Summary schema for process mining results."""

    workflow_id: UUID
    efficiency_score: float
    total_patterns: int
    total_bottlenecks: int
    optimization_count: int
    last_analyzed: datetime


class ProcessMiningHealth(BaseModel):
    """Health check response for process mining service."""

    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")
    last_analysis: Optional[datetime] = Field(
        None,
        description="Timestamp of last successful analysis"
    )
