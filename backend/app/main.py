import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    auth,
    error_correlation,
    error_management,
    logs,
    monitoring,
    sso,
    tasks,
    templates,
    tenants,
    websockets,
    workflows,
    auterity_expansion,
)
from app.middleware.error_handler import (
    ErrorReportingMiddleware,
    GlobalErrorHandlerMiddleware,
)
from app.middleware.enhanced_error_middleware import (
    EnhancedErrorHandlingMiddleware,
    ErrorMetricsMiddleware,
    HealthCheckMiddleware,
)
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.prometheus import prometheus_middleware
from app.middleware.tracing import setup_tracing
from app.middleware.otel_middleware import setup_opentelemetry
from app.middleware.tenant_middleware import TenantIsolationMiddleware, AuditLoggingMiddleware

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(
    title="AutoMatrix AI Hub Workflow Engine MVP",
    description="A streamlined workflow automation platform for automotive dealerships",
    version="0.1.0",
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if DEBUG else None,  # Disable redoc in production
)

# Add error handling middleware (order matters - add first to catch all errors)
app.add_middleware(GlobalErrorHandlerMiddleware)
app.add_middleware(
    ErrorReportingMiddleware, enable_reporting=ENVIRONMENT == "production"
)

# Add enhanced error handling middleware
app.add_middleware(
    EnhancedErrorHandlingMiddleware, 
    enable_auto_recovery=ENVIRONMENT == "production"
)
app.add_middleware(ErrorMetricsMiddleware)
app.add_middleware(HealthCheckMiddleware)

# Add structured logging middleware
app.add_middleware(StructuredLoggingMiddleware)

# Add tenant isolation and audit logging middleware
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(TenantIsolationMiddleware)

# Add Prometheus metrics middleware
app.middleware("http")(prometheus_middleware)

# Setup distributed tracing
setup_tracing(app)

# Setup OpenTelemetry
setup_opentelemetry(app)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api")
app.include_router(sso.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(error_correlation.router)
app.include_router(error_management.router)

# Include Auterity Expansion routes
app.include_router(auterity_expansion.router)

# Include WebSocket routes (no prefix for WebSocket endpoints)
app.include_router(websockets.router)


@app.get("/")
async def root():
    return {"message": "AutoMatrix AI Hub Workflow Engine MVP"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
