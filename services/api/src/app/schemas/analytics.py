"""
Pydantic schemas for analytics API endpoints.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field


class MetricDataPoint(BaseModel):
    """Data point for metric visualization."""

    timestamp: datetime
    value: float


class TrendAnalysisResponse(BaseModel):
    """Response model for trend analysis."""

    metric: str
    trend: str  # "increasing", "decreasing", "stable"
    slope: float
    confidence: float
    period_days: int
    data_points: List[MetricDataPoint]


class PredictionResponse(BaseModel):
    """Response model for predictions."""

    metric: str
    predicted_value: float
    confidence_interval: Tuple[float, float]
    confidence_level: float
    model_used: str
    forecast_horizon: int
    forecast_period: str
    historical_data_points: int


class ROIAnalysisResponse(BaseModel):
    """Response model for ROI analysis."""

    total_investment: float
    total_return: float
    roi_percentage: float
    payback_period_days: int
    break_even_date: datetime
    cost_savings: float
    productivity_gains: float
    revenue_increase: float


class AnalyticsDashboardResponse(BaseModel):
    """Complete analytics dashboard response."""

    tenant_id: str
    tenant_name: str
    report_period: str
    generated_at: datetime
    executive_summary: str
    key_metrics: Dict[str, Any]
    trends: List[TrendAnalysisResponse]
    predictions: List[PredictionResponse]
    roi_analysis: Optional[ROIAnalysisResponse] = None
    recommendations: List[str]
    alerts: List[str]


class CustomAnalyticsRequest(BaseModel):
    """Request model for custom analytics."""

    metrics: List[str] = Field(..., description="List of metrics to analyze")
    start_date: datetime = Field(..., description="Start date for analysis")
    end_date: datetime = Field(..., description="End date for analysis")
    granularity: str = Field("daily", description="Time granularity")


class CustomAnalyticsResponse(BaseModel):
    """Response model for custom analytics."""

    tenant_id: str
    time_period: Dict[str, Any]
    data: Dict[str, Any]


class BusinessIntelligenceReportResponse(BaseModel):
    """Response model for business intelligence reports."""

    tenant_id: str
    report_period: str
    generated_at: datetime
    executive_summary: str
    key_metrics: Dict[str, Any]
    trends: List[TrendAnalysisResponse]
    predictions: List[PredictionResponse]
    roi_analysis: Optional[ROIAnalysisResponse] = None
    recommendations: List[str]
    alerts: List[str]
