"""Performance monitoring for workflow execution with AI orchestration support."""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict
import json


@dataclass
class AIMetrics:
    """AI service performance metrics."""
    service_name: str
    request_count: int = 0
    error_count: int = 0
    total_tokens: int = 0
    total_cost: float = 0.0
    avg_response_time: float = 0.0
    response_times: list = field(default_factory=list)
    last_request_time: Optional[float] = None
    health_status: str = "unknown"  # healthy, degraded, unhealthy

    def record_request(self, response_time: float, tokens: int = 0, cost: float = 0.0, error: bool = False):
        """Record a service request."""
        self.request_count += 1
        if error:
            self.error_count += 1

        self.total_tokens += tokens
        self.total_cost += cost
        self.response_times.append(response_time)
        self.last_request_time = time.time()

        # Keep only last 100 response times for rolling average
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-100:]

        # Update average response time
        self.avg_response_time = sum(self.response_times) / len(self.response_times)

        # Update health status based on error rate
        error_rate = self.error_count / self.request_count if self.request_count > 0 else 0
        if error_rate > 0.5:
            self.health_status = "unhealthy"
        elif error_rate > 0.1:
            self.health_status = "degraded"
        else:
            self.health_status = "healthy"


class PerformanceMonitor:
    """Monitors performance of workflow step execution with AI orchestration support."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.ai_metrics: Dict[str, AIMetrics] = {}
        self.step_metrics: Dict[str, Dict[str, Any]] = defaultdict(dict)

    @asynccontextmanager
    async def measure_step_execution(self, step_type: str, step_name: str):
        """Context manager to measure step execution time."""
        start_time = asyncio.get_event_loop().time()
        try:
            yield
            duration = asyncio.get_event_loop().time() - start_time
            self.logger.info(
                f"Step '{step_name}' ({step_type}) completed in {duration:.3f}s"
            )
            self._record_step_metrics(step_type, step_name, duration, success=True)
        except Exception as e:
            duration = asyncio.get_event_loop().time() - start_time
            self.logger.error(
                f"Step '{step_name}' ({step_type}) failed after {duration:.3f}s: {e}"
            )
            self._record_step_metrics(step_type, step_name, duration, success=False, error=str(e))
            raise

    @asynccontextmanager
    async def measure_ai_service_call(self, service_name: str, operation: str = "call"):
        """Context manager to measure AI service call performance."""
        start_time = time.time()
        try:
            yield
            duration = time.time() - start_time
            self._record_ai_metrics(service_name, duration, success=True, operation=operation)
        except Exception as e:
            duration = time.time() - start_time
            self._record_ai_metrics(service_name, duration, success=False, operation=operation, error=str(e))
            raise

    def _record_step_metrics(self, step_type: str, step_name: str, duration: float,
                           success: bool, error: Optional[str] = None):
        """Record step execution metrics."""
        key = f"{step_type}:{step_name}"
        if key not in self.step_metrics:
            self.step_metrics[key] = {
                "step_type": step_type,
                "step_name": step_name,
                "total_executions": 0,
                "successful_executions": 0,
                "failed_executions": 0,
                "total_duration": 0.0,
                "avg_duration": 0.0,
                "last_execution": None,
                "errors": []
            }

        metrics = self.step_metrics[key]
        metrics["total_executions"] += 1
        metrics["total_duration"] += duration
        metrics["avg_duration"] = metrics["total_duration"] / metrics["total_executions"]
        metrics["last_execution"] = time.time()

        if success:
            metrics["successful_executions"] += 1
        else:
            metrics["failed_executions"] += 1
            if error:
                metrics["errors"].append({
                    "timestamp": time.time(),
                    "error": error[:200]  # Truncate long errors
                })
                # Keep only last 10 errors
                metrics["errors"] = metrics["errors"][-10:]

    def _record_ai_metrics(self, service_name: str, duration: float, success: bool,
                          operation: str = "call", error: Optional[str] = None,
                          tokens: int = 0, cost: float = 0.0):
        """Record AI service metrics."""
        if service_name not in self.ai_metrics:
            self.ai_metrics[service_name] = AIMetrics(service_name=service_name)

        ai_metric = self.ai_metrics[service_name]
        ai_metric.record_request(duration, tokens, cost, error=not success)

        # Log AI service performance
        status = "success" if success else "failed"
        self.logger.info(
            f"AI Service '{service_name}' {operation} {status} in {duration:.3f}s "
            f"(avg: {ai_metric.avg_response_time:.3f}s, health: {ai_metric.health_status})"
        )

    def get_ai_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive AI metrics summary."""
        summary = {
            "total_services": len(self.ai_metrics),
            "services": {},
            "overall_health": "healthy",
            "total_requests": 0,
            "total_errors": 0,
            "total_cost": 0.0,
            "timestamp": time.time()
        }

        unhealthy_services = 0
        for name, metrics in self.ai_metrics.items():
            summary["services"][name] = {
                "request_count": metrics.request_count,
                "error_count": metrics.error_count,
                "error_rate": metrics.error_count / metrics.request_count if metrics.request_count > 0 else 0,
                "avg_response_time": metrics.avg_response_time,
                "total_cost": metrics.total_cost,
                "health_status": metrics.health_status,
                "last_request": metrics.last_request_time
            }

            summary["total_requests"] += metrics.request_count
            summary["total_errors"] += metrics.error_count
            summary["total_cost"] += metrics.total_cost

            if metrics.health_status == "unhealthy":
                unhealthy_services += 1
            elif metrics.health_status == "degraded":
                summary["overall_health"] = "degraded"

        if unhealthy_services > 0:
            summary["overall_health"] = "unhealthy"

        return summary

    def get_step_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive step metrics summary."""
        summary = {
            "total_step_types": len(self.step_metrics),
            "steps": dict(self.step_metrics),
            "timestamp": time.time()
        }

        return summary

    def get_prometheus_metrics(self) -> str:
        """Generate Prometheus-compatible metrics output."""
        lines = []

        # AI Service Metrics
        for name, metrics in self.ai_metrics.items():
            safe_name = name.replace("-", "_").replace(".", "_")
            lines.extend([
                f'# HELP auterity_ai_{safe_name}_requests_total Total requests to {name}',
                f'# TYPE auterity_ai_{safe_name}_requests_total counter',
                f'auterity_ai_{safe_name}_requests_total {metrics.request_count}',
                f'# HELP auterity_ai_{safe_name}_errors_total Total errors from {name}',
                f'# TYPE auterity_ai_{safe_name}_errors_total counter',
                f'auterity_ai_{safe_name}_errors_total {metrics.error_count}',
                f'# HELP auterity_ai_{safe_name}_response_time_avg Average response time for {name}',
                f'# TYPE auterity_ai_{safe_name}_response_time_avg gauge',
                f'auterity_ai_{safe_name}_response_time_avg {metrics.avg_response_time}',
                f'# HELP auterity_ai_{safe_name}_total_cost Total cost for {name}',
                f'# TYPE auterity_ai_{safe_name}_total_cost counter',
                f'auterity_ai_{safe_name}_total_cost {metrics.total_cost}',
            ])

        # Step Execution Metrics
        for key, metrics in self.step_metrics.items():
            safe_key = key.replace(":", "_").replace("-", "_").replace(".", "_")
            lines.extend([
                f'# HELP auterity_step_{safe_key}_executions_total Total executions for {key}',
                f'# TYPE auterity_step_{safe_key}_executions_total counter',
                f'auterity_step_{safe_key}_executions_total {metrics["total_executions"]}',
                f'# HELP auterity_step_{safe_key}_duration_avg Average duration for {key}',
                f'# TYPE auterity_step_{safe_key}_duration_avg gauge',
                f'auterity_step_{safe_key}_duration_avg {metrics["avg_duration"]}',
            ])

        return "\n".join(lines)
