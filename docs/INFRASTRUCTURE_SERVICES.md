

# Infrastructure Service

s

#

# Overvie

w

Auterity now includes comprehensive infrastructure services for production-ready deployment

:

#

# Service

s

#

##

 1. Loki (Log Aggregation

)

 - Port 31

0

0

- **Purpose**: Centralized log collection and queryin

g

- **Integration**: Promtail collects logs from all container

s

- **Access**: http://localhost:310

0

#

##

 2. Vault (Secrets Management

)

 - Port 82

0

0

- **Purpose**: Secure storage and management of secret

s

- **Integration**: Backend service for API keys and sensitive dat

a

- **Access**: http://localhost:820

0

- **Default Token**: dev-toke

n

#

##

 3. OpenTelemetry (Unified Observability

)

 - Ports 4317/43

1

8

- **Purpose**: Traces, metrics, and logs collectio

n

- **Integration**: Automatic instrumentation of FastAPI, SQLAlchemy, Redi

s

- **Exporters**: Jaeger (traces), Prometheus (metrics), Loki (logs

)

#

##

 4. Kafka (Event Streaming

)

 - Port 90

9

2

- **Purpose**: Event-driven architecture and real-time data streamin

g

- **Topics**: workflow-events, error-events, audit-event

s

- **UI**: Kafka UI available at http://localhost:808

0

#

##

 5. Celery (Task Queu

e

)

- **Purpose**: Asynchronous task processing and workflow executio

n

- **Components**: Worker, Beat schedule

r

- **Integration**: Redis broker, async workflow executio

n

#

##

 6. MLflow (ML Experiment Tracking

)

 - Port 50

0

0

- **Purpose**: Machine learning lifecycle managemen

t

- **Storage**: PostgreSQL metadata, MinIO artifact

s

- **Access**: http://localhost:500

0

#

# Quick Star

t

```bash

# Start all services

docker-compose up -

d

# Initialize services

./scripts/init-services.s

h

# Verify services

docker-compose p

s

```

#

# Service Integratio

n

#

## Backend Integratio

n

- Vault: `app/services/vault_service.py

`

- Kafka: `app/services/kafka_service.py

`

- OpenTelemetry: `app/middleware/otel_middleware.py

`

- Celery: `app/celery_app.py`, `app/tasks.py

`

- MLflow: `app/services/mlflow_service.py

`

#

## Configuratio

n

- Loki: `monitoring/loki/local-config.yaml

`

- Promtail: `monitoring/promtail/config.yml

`

- OpenTelemetry: `monitoring/otel/otel-collector.yaml

`

- Vault: `vault/config/vault.hcl

`

#

# Monitoring Stac

k

- **Prometheus**: Metrics collection (Port 9090

)

- **Grafana**: Visualization dashboard (Port 3003

)

- **Jaeger**: Distributed tracing (Port 16686

)

- **Loki**: Log aggregation (Port 3100

)

- **AlertManager**: Alert routing (Port 9093

)

#

# Success Criteri

a

✅ All services start successfully
✅ Health checks pass
✅ Service integration functional
✅ Monitoring dashboards accessible
✅ Event streaming operational
✅ Task queue processing workflows
✅ ML experiment tracking active
