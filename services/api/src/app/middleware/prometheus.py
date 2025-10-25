"""Prometheus metrics middleware for FastAPI."""

import time
from typing import Callable

from fastapi import Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)

# HTTP Metrics
http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)

http_requests_in_flight = Gauge(
    "http_requests_in_flight", "Current HTTP requests in flight"
)

# AI Metrics
ai_requests_total = Counter(
    "ai_requests_total", "Total AI requests", ["provider", "model", "status"]
)

ai_request_cost_total = Counter(
    "ai_request_cost_total",
    "Total AI request costs in dollars",
    ["provider", "model"],
)

ai_response_tokens = Histogram(
    "ai_response_tokens", "AI response token count", ["provider", "model"]
)

# System Metrics
workflow_executions_total = Counter(
    "workflow_executions_total", "Total workflow executions", ["status"]
)

active_users = Gauge("active_users", "Current active users")


async def prometheus_middleware(
    request: Request, call_next: Callable
) -> Response:
    """Prometheus metrics middleware."""
    if request.url.path == "/metrics":
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    http_requests_in_flight.inc()
    start_time = time.time()

    try:
        response = await call_next(request)

        # Record metrics
        duration = time.time() - start_time
        method = request.method
        endpoint = request.url.path
        status = str(response.status_code)

        http_requests_total.labels(
            method=method, endpoint=endpoint, status=status
        ).inc()
        http_request_duration_seconds.labels(
            method=method, endpoint=endpoint
        ).observe(duration)

        return response

    finally:
        http_requests_in_flight.dec()


def record_ai_request(
    provider: str, model: str, cost: float, tokens: int, success: bool
):
    """Record AI request metrics."""
    status = "success" if success else "failed"
    ai_requests_total.labels(
        provider=provider, model=model, status=status
    ).inc()
    if success:
        ai_request_cost_total.labels(provider=provider, model=model).inc(cost)
        ai_response_tokens.labels(provider=provider, model=model).observe(
            tokens
        )


def record_workflow_execution(status: str):
    """Record workflow execution metrics."""
    workflow_executions_total.labels(status=status).inc()
