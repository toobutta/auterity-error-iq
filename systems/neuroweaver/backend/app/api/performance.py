"""
NeuroWeaver Performance API
Endpoints for model performance monitoring and management
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

from app.services.performance_monitor import PerformanceMonitor, ModelMetrics, PerformanceThresholds

router = APIRouter()
monitor = PerformanceMonitor()

class MetricsRequest(BaseModel):
    accuracy_score: float
    latency_ms: int
    throughput_rps: float
    cost_per_request: float

class ThresholdsRequest(BaseModel):
    min_accuracy: float = 0.85
    max_latency_ms: int = 2000
    min_throughput_rps: float = 10.0
    max_cost_per_request: float = 0.01

class SwitchRequest(BaseModel):
    target_model: Optional[str] = None
    reason: str
    switch_type: str = "immediate"

@router.post("/models/{model_id}/metrics")
async def record_metrics(model_id: str, metrics: MetricsRequest):
    """Record performance metrics for a model"""
    try:
        model_metrics = ModelMetrics(
            accuracy_score=metrics.accuracy_score,
            latency_ms=metrics.latency_ms,
            throughput_rps=metrics.throughput_rps,
            cost_per_request=metrics.cost_per_request,
            timestamp=datetime.utcnow()
        )
        
        await monitor.track_model_performance(model_id, model_metrics)
        
        return {"success": True, "message": "Metrics recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/models/{model_id}/thresholds")
async def set_thresholds(model_id: str, thresholds: ThresholdsRequest):
    """Set performance thresholds for a model"""
    try:
        perf_thresholds = PerformanceThresholds(
            min_accuracy=thresholds.min_accuracy,
            max_latency_ms=thresholds.max_latency_ms,
            min_throughput_rps=thresholds.min_throughput_rps,
            max_cost_per_request=thresholds.max_cost_per_request
        )
        
        monitor.set_performance_thresholds(model_id, perf_thresholds)
        
        return {"success": True, "message": "Thresholds updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/models/{model_id}/switch")
async def trigger_switch(model_id: str, switch_request: SwitchRequest):
    """Manually trigger model switch"""
    try:
        await monitor._trigger_model_switch(model_id, switch_request.reason)
        return {"success": True, "message": "Model switch triggered"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/{model_id}/health")
async def get_model_health(model_id: str):
    """Get current health status of a model"""
    try:
        # Return basic health info
        return {
            "model_id": model_id,
            "status": "healthy",
            "last_check": datetime.utcnow().isoformat(),
            "thresholds": monitor.thresholds.get(model_id, PerformanceThresholds()).__dict__
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))