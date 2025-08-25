# Infrastructure Services

## Overview

Auterity now includes comprehensive infrastructure services for production-ready deployment:

## Services

### 1. Loki (Log Aggregation) - Port 3100

- **Purpose**: Centralized log collection and querying
- **Integration**: Promtail collects logs from all containers
- **Access**: http://localhost:3100

### 2. Vault (Secrets Management) - Port 8200

- **Purpose**: Secure storage and management of secrets
- **Integration**: Backend service for API keys and sensitive data
- **Access**: http://localhost:8200
- **Default Token**: dev-token

### 3. OpenTelemetry (Unified Observability) - Ports 4317/4318

- **Purpose**: Traces, metrics, and logs collection
- **Integration**: Automatic instrumentation of FastAPI, SQLAlchemy, Redis
- **Exporters**: Jaeger (traces), Prometheus (metrics), Loki (logs)

### 4. Kafka (Event Streaming) - Port 9092

- **Purpose**: Event-driven architecture and real-time data streaming
- **Topics**: workflow-events, error-events, audit-events
- **UI**: Kafka UI available at http://localhost:8080

### 5. Celery (Task Queue)

- **Purpose**: Asynchronous task processing and workflow execution
- **Components**: Worker, Beat scheduler
- **Integration**: Redis broker, async workflow execution

### 6. MLflow (ML Experiment Tracking) - Port 5000

- **Purpose**: Machine learning lifecycle management
- **Storage**: PostgreSQL metadata, MinIO artifacts
- **Access**: http://localhost:5000

## Quick Start

```bash
# Start all services
docker-compose up -d

# Initialize services
./scripts/init-services.sh

# Verify services
docker-compose ps
```

## Service Integration

### Backend Integration

- Vault: `app/services/vault_service.py`
- Kafka: `app/services/kafka_service.py`
- OpenTelemetry: `app/middleware/otel_middleware.py`
- Celery: `app/celery_app.py`, `app/tasks.py`
- MLflow: `app/services/mlflow_service.py`

### Configuration

- Loki: `monitoring/loki/local-config.yaml`
- Promtail: `monitoring/promtail/config.yml`
- OpenTelemetry: `monitoring/otel/otel-collector.yaml`
- Vault: `vault/config/vault.hcl`

## Monitoring Stack

- **Prometheus**: Metrics collection (Port 9090)
- **Grafana**: Visualization dashboard (Port 3003)
- **Jaeger**: Distributed tracing (Port 16686)
- **Loki**: Log aggregation (Port 3100)
- **AlertManager**: Alert routing (Port 9093)

## Success Criteria

✅ All services start successfully
✅ Health checks pass
✅ Service integration functional
✅ Monitoring dashboards accessible
✅ Event streaming operational
✅ Task queue processing workflows
✅ ML experiment tracking active
