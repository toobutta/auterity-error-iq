"""Prometheus metrics middleware for NeuroWeaver."""

import time
from typing import Callable
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Model Metrics
model_deployments_total = Counter(
    'model_deployments_total',
    'Total model deployments',
    ['model_name', 'status']
)

model_inference_requests = Counter(
    'model_inference_requests',
    'Total model inference requests',
    ['model_name', 'status']
)

model_training_duration = Histogram(
    'model_training_duration_seconds',
    'Model training duration in seconds',
    ['model_name']
)

active_models = Gauge(
    'active_models',
    'Number of active models'
)


async def prometheus_middleware(request: Request, call_next: Callable) -> Response:
    """Prometheus metrics middleware."""
    if request.url.path == "/metrics":
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    
    start_time = time.time()
    
    response = await call_next(request)
    
    # Record metrics
    duration = time.time() - start_time
    method = request.method
    endpoint = request.url.path
    status = str(response.status_code)
    
    http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
    
    return response


def record_model_deployment(model_name: str, success: bool):
    """Record model deployment metrics."""
    status = "success" if success else "failed"
    model_deployments_total.labels(model_name=model_name, status=status).inc()


def record_model_inference(model_name: str, success: bool):
    """Record model inference metrics."""
    status = "success" if success else "failed"
    model_inference_requests.labels(model_name=model_name, status=status).inc()


def record_training_duration(model_name: str, duration: float):
    """Record model training duration."""
    model_training_duration.labels(model_name=model_name).observe(duration)