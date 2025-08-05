"""
TuneDev NeuroWeaver Platform - Main API Entry Point
"""

import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional, Dict, Any
import uvicorn

# Import routers
from .routers import (
    auth,
    workflows,
    models,
    datasets,
    monitoring,
    kits,
    inference
)

# Create FastAPI app
app = FastAPI(
    title="NeuroWeaver API",
    description="API for TuneDev NeuroWeaver Platform - AI Model Specialization Framework",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
app.include_router(models.router, prefix="/api/v1/models", tags=["Models"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["Monitoring"])
app.include_router(kits.router, prefix="/api/v1/kits", tags=["Vertical Kits"])
app.include_router(inference.router, prefix="/api/v1/inference", tags=["Inference"])

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint for API health check"""
    return {
        "message": "Welcome to NeuroWeaver API",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "database": "connected",
            "storage": "available"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)