"""
Advanced metrics collection for Agent API endpoints.
Extends existing Prometheus metrics with agent-specific measurements.
"""

import time

from fastapi import Request
from prometheus_client import Counter, Gauge, Histogram

# Agent-specific metrics
agent_requests_total = Counter(
    "agent_requests_total",
    "Total agent API requests",
    ["endpoint", "method", "status_code", "agent_type", "tenant_id"],
)

agent_request_duration_seconds = Histogram(
    "agent_request_duration_seconds",
    "Agent API request duration in seconds",
    ["endpoint", "method", "agent_type"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 25.0, 50.0, 100.0],
)

agent_workflow_executions_total = Counter(
    "agent_workflow_executions_total",
    "Total workflow executions",
    ["workflow_id", "status", "coordination_strategy", "tenant_id"],
)

agent_workflow_duration_seconds = Histogram(
    "agent_workflow_duration_seconds",
    "Workflow execution duration in seconds",
    ["workflow_id", "coordination_strategy"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0, 600.0],
)

agent_rag_queries_total = Counter(
    "agent_rag_queries_total",
    "Total RAG queries",
    ["domain", "use_qa", "status", "tenant_id"],
)

agent_rag_query_duration_seconds = Histogram(
    "agent_rag_query_duration_seconds",
    "RAG query duration in seconds",
    ["domain", "use_qa"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)

agent_compliance_validations_total = Counter(
    "agent_compliance_validations_total",
    "Total compliance validations",
    ["operation", "result", "tenant_id"],
)

agent_active_sessions = Gauge(
    "agent_active_sessions", "Currently active agent sessions", ["tenant_id"]
)

agent_registered_count = Gauge(
    "agent_registered_count",
    "Number of registered agents",
    ["agent_type", "tenant_id"],
)

agent_errors_total = Counter(
    "agent_errors_total",
    "Total agent errors by type",
    ["error_type", "endpoint", "tenant_id"],
)

# System performance metrics
agent_memory_usage_bytes = Gauge(
    "agent_memory_usage_bytes",
    "Memory usage by agent services",
    ["service_name"],
)

agent_service_health = Gauge(
    "agent_service_health",
    "Health status of agent services (1=healthy, 0=unhealthy)",
    ["service_name"],
)

# Rate limiting metrics
agent_rate_limit_hits_total = Counter(
    "agent_rate_limit_hits_total",
    "Total rate limit hits",
    ["endpoint", "client_ip"],
)

# Document indexing metrics
agent_documents_indexed_total = Counter(
    "agent_documents_indexed_total",
    "Total documents indexed",
    ["domain", "tenant_id"],
)

agent_index_size_bytes = Gauge(
    "agent_index_size_bytes",
    "Size of document indices in bytes",
    ["domain", "tenant_id"],
)


class AgentMetricsCollector:
    """Centralized metrics collection for agent operations"""

    @staticmethod
    def record_request(
        endpoint: str,
        method: str,
        status_code: int,
        duration: float,
        agent_type: str = None,
        tenant_id: str = None,
    ):
        """Record HTTP request metrics"""
        agent_requests_total.labels(
            endpoint=endpoint,
            method=method,
            status_code=str(status_code),
            agent_type=agent_type or "unknown",
            tenant_id=tenant_id or "unknown",
        ).inc()

        agent_request_duration_seconds.labels(
            endpoint=endpoint,
            method=method,
            agent_type=agent_type or "unknown",
        ).observe(duration)

    @staticmethod
    def record_workflow_execution(
        workflow_id: str,
        status: str,
        duration: float,
        coordination_strategy: str = None,
        tenant_id: str = None,
    ):
        """Record workflow execution metrics"""
        agent_workflow_executions_total.labels(
            workflow_id=workflow_id,
            status=status,
            coordination_strategy=coordination_strategy or "sequential",
            tenant_id=tenant_id or "unknown",
        ).inc()

        agent_workflow_duration_seconds.labels(
            workflow_id=workflow_id,
            coordination_strategy=coordination_strategy or "sequential",
        ).observe(duration)

    @staticmethod
    def record_rag_query(
        domain: str,
        use_qa: bool,
        status: str,
        duration: float,
        tenant_id: str = None,
    ):
        """Record RAG query metrics"""
        agent_rag_queries_total.labels(
            domain=domain or "general",
            use_qa=str(use_qa),
            status=status,
            tenant_id=tenant_id or "unknown",
        ).inc()

        agent_rag_query_duration_seconds.labels(
            domain=domain or "general", use_qa=str(use_qa)
        ).observe(duration)

    @staticmethod
    def record_compliance_validation(
        operation: str, result: str, tenant_id: str = None
    ):
        """Record compliance validation metrics"""
        agent_compliance_validations_total.labels(
            operation=operation,
            result=result,
            tenant_id=tenant_id or "unknown",
        ).inc()

    @staticmethod
    def record_error(error_type: str, endpoint: str, tenant_id: str = None):
        """Record error metrics"""
        agent_errors_total.labels(
            error_type=error_type,
            endpoint=endpoint,
            tenant_id=tenant_id or "unknown",
        ).inc()

    @staticmethod
    def update_service_health(service_name: str, is_healthy: bool):
        """Update service health metrics"""
        agent_service_health.labels(service_name=service_name).set(
            1 if is_healthy else 0
        )

    @staticmethod
    def record_rate_limit_hit(endpoint: str, client_ip: str):
        """Record rate limit hit"""
        agent_rate_limit_hits_total.labels(
            endpoint=endpoint, client_ip=client_ip
        ).inc()

    @staticmethod
    def record_document_indexing(
        document_count: int, domain: str, tenant_id: str = None
    ):
        """Record document indexing metrics"""
        agent_documents_indexed_total.labels(
            domain=domain, tenant_id=tenant_id or "unknown"
        ).inc(document_count)


def metrics_middleware():
    """Middleware function to collect metrics for all agent requests"""

    async def middleware(request: Request, call_next):
        start_time = time.time()

        # Extract tenant info if available
        tenant_id = getattr(request.state, "tenant_id", None)

        response = await call_next(request)

        duration = time.time() - start_time

        # Record metrics for agent API endpoints
        if request.url.path.startswith("/api/agents"):
            endpoint = request.url.path.replace("/api/agents", "")
            AgentMetricsCollector.record_request(
                endpoint=endpoint,
                method=request.method,
                status_code=response.status_code,
                duration=duration,
                tenant_id=tenant_id,
            )

        return response

    return middleware
