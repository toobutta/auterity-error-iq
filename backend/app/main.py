import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, logs, monitoring, templates, workflows
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.error_handler import GlobalErrorHandlerMiddleware, ErrorReportingMiddleware

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
app.add_middleware(ErrorReportingMiddleware, enable_reporting=ENVIRONMENT == "production")

# Add structured logging middleware
app.add_middleware(StructuredLoggingMiddleware)

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
app.include_router(workflows.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "AutoMatrix AI Hub Workflow Engine MVP"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
