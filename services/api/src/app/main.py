import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    agents,
    ai_advanced,
    ai_core,
    analytics,
    analytics_websocket,
    auterity_expansion,
    auth,
    cognitive,
    collaboration,
    dashboard,
    dashboards,
    data_connectors,
    ecosystem_management,
    enhanced_analytics,
    error_correlation,
    error_management,
    gateway,
    kafka,
    logs,
    management,
    metrics,
    modelhub,
    models,
    monitoring,
    process_mining,
    routing,
    service_status_enhanced,
    simulation,
    sso,
    tasks,
    templates,
    tenants,
    unified,
    websockets,
    workflows,
)
from app.api.enterprise import router as enterprise_router
from app.middleware.enhanced_error_middleware import (
    EnhancedErrorHandlingMiddleware,
    ErrorMetricsMiddleware,
    HealthCheckMiddleware,
)
from app.middleware.error_handler import (
    ErrorReportingMiddleware,
    GlobalErrorHandlerMiddleware,
)
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.otel_middleware import setup_opentelemetry
from app.middleware.prometheus import prometheus_middleware
from app.middleware.security_middleware import (
    AnalyticsSecurityMiddleware,
    RateLimitMiddleware,
    DataPrivacyMiddleware,
    AuditLoggingMiddleware as SecurityAuditMiddleware,
)
from app.middleware.tenant_middleware import (
    AuditLoggingMiddleware,
    TenantIsolationMiddleware,
)
from app.middleware.tracing import setup_tracing
from app.startup.ai_ecosystem_startup import (
    ecosystem_manager,
    shutdown_event,
    startup_event,
)

# Environment configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Security guardrails for production
_secret_key = os.getenv("SECRET_KEY")
if ENVIRONMENT == "production":
    if not _secret_key or _secret_key == "your-secret-key-change-in-production":
        raise RuntimeError(
            "SECURITY: SECRET_KEY must be set to a strong value in production."
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await startup_event()

    # Start analytics WebSocket manager
    from app.database import get_db
    from app.api.analytics_websocket import startup_analytics_websocket
    db = next(get_db())
    await startup_analytics_websocket(db)

    yield

    # Shutdown
    from app.api.analytics_websocket import shutdown_analytics_websocket
    await shutdown_analytics_websocket()
    await shutdown_event()


app = FastAPI(
    title="AutoMatrix AI Hub Workflow Engine MVP - Enhanced with AI Ecosystem",
    description=(
        "A streamlined workflow automation platform with AI-driven "
        "service orchestration, predictive analytics, and autonomous "
        "optimization"
    ),
    version="0.2.0",
    debug=DEBUG,
    docs_url="/docs" if DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if DEBUG else None,  # Disable redoc in production
    lifespan=lifespan,
)

# Add error handling middleware (order matters - add first to catch all errors)
app.add_middleware(GlobalErrorHandlerMiddleware)
app.add_middleware(
    ErrorReportingMiddleware, enable_reporting=ENVIRONMENT == "production"
)

# Add enhanced error handling middleware
app.add_middleware(
    EnhancedErrorHandlingMiddleware,
    enable_auto_recovery=ENVIRONMENT == "production",
)
app.add_middleware(ErrorMetricsMiddleware)
app.add_middleware(HealthCheckMiddleware)

# Add structured logging middleware
app.add_middleware(StructuredLoggingMiddleware)

# Add security middleware (must come before other middleware)
app.add_middleware(AnalyticsSecurityMiddleware, jwt_secret=_secret_key or "default-secret-key", encryption_key=os.getenv("ENCRYPTION_KEY"))
app.add_middleware(RateLimitMiddleware, security_service=None)  # Will be initialized properly later
app.add_middleware(DataPrivacyMiddleware, security_service=None)  # Will be initialized properly later

# Add tenant isolation and audit logging middleware
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(TenantIsolationMiddleware)
app.add_middleware(SecurityAuditMiddleware, security_service=None)  # Will be initialized properly later

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
app.include_router(agents.router)
app.include_router(ai_core.router, prefix="/api")
app.include_router(ai_advanced.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(enhanced_analytics.router, prefix="/api")
app.include_router(modelhub.router, prefix="/api")
app.include_router(models.router)
app.include_router(routing.router, prefix="/api")
app.include_router(unified.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(collaboration.router, prefix="/api")
app.include_router(data_connectors.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(dashboards.router, prefix="/api")
app.include_router(gateway.router, prefix="/api")
app.include_router(sso.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(management.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(kafka.router, prefix="/api")
app.include_router(process_mining.router)
app.include_router(error_correlation.router)
app.include_router(error_management.router)

# Include Auterity Expansion routes
app.include_router(auterity_expansion.router)

# Include Enhanced AI Service Management routes
app.include_router(service_status_enhanced.router)
app.include_router(ecosystem_management.router)

# Include Enterprise Platform routes
app.include_router(enterprise_router)

# Include WebSocket routes (no prefix for WebSocket endpoints)
app.include_router(websockets.router)
app.include_router(analytics_websocket.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": (
            "AutoMatrix AI Hub Workflow Engine MVP - "
            "Enhanced with AI Ecosystem"
        ),
        "version": "0.2.0",
        "features": [
            "AI Service Orchestration",
            "Predictive Analytics",
            "Autonomous Optimization",
            "Real-time Monitoring",
            "RelayCore Message Routing",
            "NeuroWeaver ML Pipeline",
        ],
        "ecosystem_status": ecosystem_manager.get_ecosystem_status(),
    }


@app.get("/health")
async def health_check():
    ecosystem_status = ecosystem_manager.get_ecosystem_status()

    return {
        "status": (
            (
                "healthy"
                if ecosystem_status.get("ready_for_production")
                else "starting"
            )
        ),
        "ecosystem": ecosystem_status,
        "components": {
            "ai_orchestrator": (
                "healthy"
                if ecosystem_status.get("components_status", {}).get(
                    "ai_orchestrator"
                )
                else "offline"
            ),
            "relay_core": (
                "healthy"
                if ecosystem_status.get("components_status", {}).get(
                    "relay_core"
                )
                else "offline"
            ),
            "neuro_weaver": (
                "healthy"
                if ecosystem_status.get("components_status", {}).get(
                    "neuro_weaver"
                )
                else "offline"
            ),
            "service_registry": (
                "healthy"
                if ecosystem_status.get("components_status", {}).get(
                    "service_registry"
                )
                else "offline"
            ),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ai-ecosystem/status")
async def ai_ecosystem_detailed_status():
    """Detailed AI ecosystem status endpoint"""
    return ecosystem_manager.get_ecosystem_status()
