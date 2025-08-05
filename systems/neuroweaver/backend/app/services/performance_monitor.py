"""
NeuroWeaver Performance Monitor Service
Tracks model accuracy, latency, and triggers automatic switching
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class PerformanceThresholds:
    min_accuracy: float = 0.85
    max_latency_ms: int = 2000
    min_throughput_rps: float = 10.0
    max_cost_per_request: float = 0.01

@dataclass
class ModelMetrics:
    accuracy_score: float
    latency_ms: int
    throughput_rps: float
    cost_per_request: float
    timestamp: datetime

class PerformanceMonitor:
    def __init__(self):
        self.thresholds: Dict[str, PerformanceThresholds] = {}
        self.monitoring_active = False
        
    async def track_model_performance(self, model_id: str, metrics: ModelMetrics) -> None:
        """Record performance metrics for a model"""
        # Evaluate performance
        health_status = await self._evaluate_model_health(model_id, metrics)
        
        # Check for degradation
        if health_status['needs_switch']:
            await self._trigger_model_switch(model_id, health_status['reason'])
            
    async def _evaluate_model_health(self, model_id: str, current_metrics: ModelMetrics) -> Dict:
        """Evaluate if model performance is healthy"""
        thresholds = self.thresholds.get(model_id, PerformanceThresholds())
        
        issues = []
        needs_switch = False
        
        # Check thresholds
        if current_metrics.accuracy_score < thresholds.min_accuracy:
            issues.append(f"Accuracy {current_metrics.accuracy_score:.3f} below threshold")
            needs_switch = True
            
        if current_metrics.latency_ms > thresholds.max_latency_ms:
            issues.append(f"Latency {current_metrics.latency_ms}ms above threshold")
            needs_switch = True
            
        # Calculate performance score
        performance_score = min(current_metrics.accuracy_score / thresholds.min_accuracy, 1.0)
        
        return {
            'performance_score': performance_score,
            'needs_switch': needs_switch,
            'reason': '; '.join(issues) if issues else 'Healthy',
            'status': 'degraded' if needs_switch else 'healthy'
        }
        
    async def _trigger_model_switch(self, model_id: str, reason: str) -> None:
        """Trigger automatic model switch due to performance degradation"""
        backup_model = self._get_backup_model(model_id)
        
        if backup_model:
            logger.warning(f"Triggered model switch: {model_id} -> {backup_model} ({reason})")
            # Send switch request to RelayCore
            await self._notify_relaycore_switch(model_id, backup_model, reason)
        else:
            logger.critical(f"No backup model available for {model_id}: {reason}")
            
    def _get_backup_model(self, failing_model: str) -> Optional[str]:
        """Get backup model for failing model"""
        backup_models = {
            'automotive-sales-v1': 'gpt-4-turbo',
            'service-advisor-v1': 'gpt-3.5-turbo',
            'parts-specialist-v1': 'gpt-3.5-turbo'
        }
        return backup_models.get(failing_model)
        
    async def _notify_relaycore_switch(self, current_model: str, target_model: str, reason: str):
        """Notify RelayCore of model switch"""
        # Placeholder for RelayCore notification
        logger.info(f"Notifying RelayCore: switch {current_model} -> {target_model}")
        
    def set_performance_thresholds(self, model_id: str, thresholds: PerformanceThresholds):
        """Set performance thresholds for a model"""
        self.thresholds[model_id] = thresholds