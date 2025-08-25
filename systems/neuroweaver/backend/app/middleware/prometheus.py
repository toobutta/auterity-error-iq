"""
Prometheus Metrics Middleware
Collects application metrics for monitoring
"""

import time
from typing import Callable

from app.core.logging import get_logger
from fastapi import Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)
from starlette.middleware.base import BaseHTTPMiddleware

logger = get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "neuroweaver_requests_total",
    "Total number of requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_DURATION = Histogram(
    "neuroweaver_request_duration_seconds",
    "Request duration in seconds",
    ["method", "endpoint"],
)

ACTIVE_REQUESTS = Gauge("neuroweaver_active_requests", "Number of active requests")

TRAINING_JOBS = Gauge(
    "neuroweaver_training_jobs_active", "Number of active training jobs"
)

MODEL_COUNT = Gauge("neuroweaver_models_total", "Total number of registered models")

INFERENCE_REQUESTS = Counter(
    "neuroweaver_inference_requests_total",
    "Total number of inference requests",
    ["model_id", "status"],
)

INFERENCE_DURATION = Histogram(
    "neuroweaver_inference_duration_seconds",
    "Inference request duration in seconds",
    ["model_id"],
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect Prometheus metrics"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics"""

        # Skip metrics endpoint to avoid recursion
        if request.url.path == "/metrics":
            return await call_next(request)

        # Increment active requests
        ACTIVE_REQUESTS.inc()

        # Record start time
        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration = time.time() - start_time

            # Extract endpoint info
            method = request.method
            endpoint = self._get_endpoint_name(request)
            status_code = str(response.status_code)

            # Record metrics
            REQUEST_COUNT.labels(
                method=method, endpoint=endpoint, status_code=status_code
            ).inc()

            REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)

            return response

        except Exception as e:
            # Record error metrics
            duration = time.time() - start_time
            method = request.method
            endpoint = self._get_endpoint_name(request)

            REQUEST_COUNT.labels(
                method=method, endpoint=endpoint, status_code="500"
            ).inc()

            REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)

            logger.error(f"Request failed: {e}")
            raise

        finally:
            # Decrement active requests
            ACTIVE_REQUESTS.dec()

    def _get_endpoint_name(self, request: Request) -> str:
        """Extract endpoint name from request"""
        path = request.url.path

        # Normalize paths with IDs
        if "/models/" in path and len(path.split("/")) > 4:
            return "/api/v1/models/{id}"
        elif "/training/" in path and len(path.split("/")) > 4:
            return "/api/v1/training/{id}"
        elif "/inference/" in path and len(path.split("/")) > 4:
            return "/api/v1/inference/{id}"

        return path


def update_training_metrics(active_jobs: int):
    """Update training job metrics"""
    TRAINING_JOBS.set(active_jobs)


def update_model_metrics(total_models: int):
    """Update model count metrics"""
    MODEL_COUNT.set(total_models)


def record_inference_request(model_id: str, duration: float, success: bool):
    """Record inference request metrics"""
    status = "success" if success else "error"

    INFERENCE_REQUESTS.labels(model_id=model_id, status=status).inc()

    INFERENCE_DURATION.labels(model_id=model_id).observe(duration)


async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
