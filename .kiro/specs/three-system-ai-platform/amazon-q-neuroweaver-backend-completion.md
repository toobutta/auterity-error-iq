# [AMAZON-Q-TASK] NeuroWeaver Backend Infrastructure Completion

## Task Assignment

**Tool**: Amazon Q (Claude 3.7)  
**Priority**: CRITICAL  
**Estimated Time**: 4-6 hours  
**Status**: IMMEDIATE - Required to complete Task 7

## Task Overview

Complete the missing backend infrastructure components for NeuroWeaver that require Amazon Q's expertise in database design, service architecture, and production deployment setup.

## Context

Cline has created the basic NeuroWeaver structure but is missing critical backend infrastructure components that require Amazon Q's specialization in:

- Database schema design and migrations
- Service architecture and API completion
- Production containerization
- System integration and connectivity

## Required Deliverables

### 1. Database Migrations - Alembic Setup and Initial Migration

**Objective**: Create complete database schema with proper migrations

**Files to Create**:

```
systems/neuroweaver/backend/
├── alembic/
│   ├── env.py                    # Alembic environment configuration
│   ├── script.py.mako           # Migration template
│   ├── versions/                # Migration version files
│   │   └── 001_initial_schema.py # Initial database schema
│   └── README
├── alembic.ini                  # Alembic configuration file
└── app/models/                  # SQLAlchemy models
    ├── __init__.py
    ├── base.py                  # Base model class
    ├── model_registry.py        # Model registry models
    ├── training_job.py          # Training job models
    ├── deployment.py            # Deployment models
    └── performance.py           # Performance metrics models
```

**Database Schema Requirements**:

```sql
-- Models table
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    specialization VARCHAR(100) NOT NULL,
    base_model VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'registered',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    model_path VARCHAR(500),
    config JSONB,
    performance_metrics JSONB,
    deployment_config JSONB
);

-- Training jobs table
CREATE TABLE training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    training_config JSONB NOT NULL,
    dataset_path VARCHAR(500),
    output_path VARCHAR(500),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    logs TEXT,
    metrics JSONB,
    error_message TEXT
);

-- Deployments table
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    endpoint_url VARCHAR(500),
    deployment_config JSONB,
    health_check_url VARCHAR(500),
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    replicas INTEGER DEFAULT 1,
    resource_limits JSONB,
    auto_scale_config JSONB
);

-- Performance metrics table
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models(id),
    deployment_id UUID REFERENCES deployments(id),
    metric_type VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB,
    benchmark_name VARCHAR(100),
    test_dataset VARCHAR(255)
);

-- Indexes for performance
CREATE INDEX idx_models_specialization ON models(specialization);
CREATE INDEX idx_models_status ON models(status);
CREATE INDEX idx_training_jobs_status ON training_jobs(status);
CREATE INDEX idx_training_jobs_model ON training_jobs(model_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_model ON deployments(model_id);
CREATE INDEX idx_performance_metrics_model ON performance_metrics(model_id);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
```

### 2. Missing API Services - Complete Auth Service and Metrics Endpoints

**Authentication Service Enhancement**:

```python
# systems/neuroweaver/backend/app/core/auth.py - Complete implementation
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional
import httpx

class AuthService:
    def __init__(self):
        self.security = HTTPBearer()
        self.jwt_secret = settings.JWT_SECRET
        self.jwt_algorithm = "HS256"
        self.autmatrix_auth_url = settings.AUTMATRIX_AUTH_URL

    async def verify_token(self, credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
        """Verify JWT token with AutoMatrix auth service"""
        try:
            # Decode JWT token
            payload = jwt.decode(
                credentials.credentials,
                self.jwt_secret,
                algorithms=[self.jwt_algorithm]
            )

            # Verify with AutoMatrix auth service
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.autmatrix_auth_url}/verify",
                    headers={"Authorization": f"Bearer {credentials.credentials}"}
                )

                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication credentials"
                    )

                return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
```

**Metrics Endpoint Implementation**:

```python
# systems/neuroweaver/backend/app/api/metrics.py - New file
from fastapi import APIRouter, Depends
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import time

router = APIRouter()

# Prometheus metrics
model_inferences_total = Counter(
    'neuroweaver_model_inferences_total',
    'Total model inferences',
    ['model_id', 'specialization', 'status']
)

inference_duration_seconds = Histogram(
    'neuroweaver_inference_duration_seconds',
    'Model inference duration',
    ['model_id', 'specialization']
)

active_models = Gauge(
    'neuroweaver_active_models',
    'Number of active deployed models'
)

training_jobs_total = Counter(
    'neuroweaver_training_jobs_total',
    'Total training jobs',
    ['status', 'specialization']
)

model_accuracy = Gauge(
    'neuroweaver_model_accuracy',
    'Model accuracy score',
    ['model_id', 'specialization']
)

@router.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with metrics"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "metrics": {
            "active_models": active_models._value._value,
            "total_inferences": model_inferences_total._value.sum(),
            "average_inference_time": inference_duration_seconds._value.sum() / max(inference_duration_seconds._value.count(), 1)
        },
        "dependencies": {
            "database": await check_database_health(),
            "model_storage": await check_storage_health(),
            "relaycore": await check_relaycore_connectivity()
        }
    }
```

### 3. Docker Configuration - Production-Ready Containerization

**Enhanced Dockerfile**:

```dockerfile
# systems/neuroweaver/backend/Dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r neuroweaver && useradd -r -g neuroweaver neuroweaver

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/models /app/logs /app/data && \
    chown -R neuroweaver:neuroweaver /app

# Switch to non-root user
USER neuroweaver

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Expose port
EXPOSE 8001

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]
```

**Docker Compose Integration**:

```yaml
# Add to main docker-compose.yml
services:
  neuroweaver-backend:
    build:
      context: ./systems/neuroweaver/backend
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/neuroweaver
      - REDIS_URL=redis://redis:6379/2
      - AUTMATRIX_AUTH_URL=http://autmatrix-backend:8000/api/auth
      - RELAYCORE_URL=http://relaycore:3001
      - MODEL_STORAGE_PATH=/app/models
      - TRAINING_ENABLED=true
      - DEBUG=false
    volumes:
      - neuroweaver_models:/app/models
      - neuroweaver_logs:/app/logs
    depends_on:
      - postgres
      - redis
      - autmatrix-backend
      - relaycore
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  neuroweaver-frontend:
    build:
      context: ./systems/neuroweaver/frontend
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8001
      - NEXT_PUBLIC_AUTMATRIX_URL=http://localhost:8000
    depends_on:
      - neuroweaver-backend
    networks:
      - app-network

volumes:
  neuroweaver_models:
  neuroweaver_logs:
```

### 4. Service Integration - RelayCore Connector Completion

**Enhanced RelayCore Connector**:

```python
# systems/neuroweaver/backend/app/services/relaycore_connector.py - Complete implementation
import httpx
import asyncio
from typing import Dict, List, Optional
from app.core.config import settings
from app.core.logging import logger

class RelayCoreConnector:
    def __init__(self):
        self.relaycore_url = settings.RELAYCORE_URL
        self.service_id = "neuroweaver-backend"
        self.registration_data = {
            "service_id": self.service_id,
            "name": "NeuroWeaver Backend",
            "type": "model_service",
            "url": f"http://neuroweaver-backend:8001",
            "health_check": "/health",
            "capabilities": [
                "automotive_specialization",
                "model_training",
                "model_deployment",
                "inference_serving"
            ],
            "specializations": [
                {
                    "name": "automotive-sales",
                    "description": "Specialized for automotive sales conversations",
                    "endpoint": "/api/v1/inference/automotive-sales",
                    "cost_per_1k_tokens": 0.002,
                    "avg_latency_ms": 1200
                },
                {
                    "name": "service-advisor",
                    "description": "Specialized for service department interactions",
                    "endpoint": "/api/v1/inference/service-advisor",
                    "cost_per_1k_tokens": 0.002,
                    "avg_latency_ms": 1100
                },
                {
                    "name": "parts-specialist",
                    "description": "Specialized for parts department queries",
                    "endpoint": "/api/v1/inference/parts-specialist",
                    "cost_per_1k_tokens": 0.002,
                    "avg_latency_ms": 1000
                }
            ]
        }

    async def register_service(self) -> bool:
        """Register NeuroWeaver with RelayCore"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.relaycore_url}/api/services/register",
                    json=self.registration_data
                )

                if response.status_code == 201:
                    logger.info("Successfully registered with RelayCore")
                    return True
                else:
                    logger.error(f"Failed to register with RelayCore: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Error registering with RelayCore: {e}")
            return False

    async def update_model_performance(self, model_id: str, metrics: Dict):
        """Update model performance metrics in RelayCore"""
        try:
            async with httpx.AsyncClient() as client:
                await client.put(
                    f"{self.relaycore_url}/api/models/{model_id}/performance",
                    json=metrics
                )
        except Exception as e:
            logger.error(f"Failed to update model performance: {e}")

    async def notify_model_deployment(self, model_id: str, deployment_info: Dict):
        """Notify RelayCore of new model deployment"""
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{self.relaycore_url}/api/models/{model_id}/deployed",
                    json=deployment_info
                )
        except Exception as e:
            logger.error(f"Failed to notify model deployment: {e}")
```

## Success Criteria

### Database Infrastructure

- [ ] Alembic configuration complete and functional
- [ ] Initial migration creates all required tables
- [ ] All SQLAlchemy models properly defined
- [ ] Database indexes optimized for performance
- [ ] Migration can be run successfully

### API Services

- [ ] Authentication service integrates with AutoMatrix
- [ ] Metrics endpoint returns Prometheus format data
- [ ] Detailed health check includes dependency status
- [ ] All API endpoints properly secured
- [ ] Error handling comprehensive and logged

### Docker Configuration

- [ ] Production-ready Dockerfile with security best practices
- [ ] Docker Compose integration complete
- [ ] Health checks functional
- [ ] Volume mounts for persistent data
- [ ] Non-root user configuration

### Service Integration

- [ ] RelayCore connector successfully registers service
- [ ] Model performance updates work
- [ ] Deployment notifications functional
- [ ] Service discovery integration complete
- [ ] Error handling and retry logic implemented

## Quality Gates

### Code Quality

- [ ] All Python code follows PEP 8 standards
- [ ] Type hints used throughout
- [ ] Comprehensive error handling
- [ ] Logging implemented for all operations
- [ ] No security vulnerabilities

### Integration Testing

- [ ] Database migrations run successfully
- [ ] Authentication works with AutoMatrix
- [ ] Metrics endpoint accessible
- [ ] RelayCore registration successful
- [ ] Docker containers start and pass health checks

### Performance Requirements

- [ ] Database queries optimized with proper indexes
- [ ] API response times < 200ms
- [ ] Health checks respond within 5 seconds
- [ ] Container startup time < 60 seconds
- [ ] Memory usage < 2GB under normal load

## Dependencies

- **AutoMatrix authentication service** must be running
- **RelayCore service** must be accessible
- **PostgreSQL database** must be available
- **Redis cache** must be running

## Handoff to Cline

After Amazon Q completes this backend infrastructure, Cline can focus on:

- Frontend React components implementation
- Tool communication system (`.kiro/communication/`)
- User interface and user experience
- Frontend integration with completed backend APIs

---

**Amazon Q**: This task leverages your expertise in database design, service architecture, and production deployment. Complete these backend infrastructure components to enable Cline to focus on frontend development and tool communication systems.
