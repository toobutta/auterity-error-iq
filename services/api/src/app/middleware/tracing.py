"""OpenTelemetry tracing configuration."""

import os

from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_tracing(app):
    """Configure OpenTelemetry tracing."""
    resource = Resource.create(
        {"service.name": "autmatrix-backend", "service.version": "0.1.0"}
    )

    trace.set_tracer_provider(TracerProvider(resource=resource))

    jaeger_exporter = JaegerExporter(
        agent_host_name=os.getenv("JAEGER_HOST", "jaeger"),
        agent_port=int(os.getenv("JAEGER_PORT", "6831")),
    )

    span_processor = BatchSpanProcessor(jaeger_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)

    FastAPIInstrumentor.instrument_app(app)

    return trace.get_tracer(__name__)


tracer = None


def get_tracer():
    """Get the global tracer instance."""
    return tracer
