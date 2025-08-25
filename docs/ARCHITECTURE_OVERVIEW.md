# Architecture Overview

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   RelayCore     │    │  NeuroWeaver    │
│   React/TS      │    │   AI Router     │    │  Model Mgmt     │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │   FastAPI       │
                    │   Port: 8000    │
                    └─────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                       │                        │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ PostgreSQL  │    │   Redis     │    │   MinIO     │
│ Port: 5432  │    │ Port: 6379  │    │ Port: 9000  │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Data Flow

1. **Request** → Frontend → Backend API
2. **Processing** → Celery Workers → AI Services
3. **Storage** → PostgreSQL/MinIO/Qdrant
4. **Monitoring** → OpenTelemetry → Prometheus/Grafana

## Service Layers

### **Presentation Layer**

- React Frontend (Port 3000)
- NeuroWeaver UI (Port 3002)

### **API Layer**

- FastAPI Backend (Port 8000)
- RelayCore Router (Port 3001)

### **Processing Layer**

- Celery Workers (Background)
- Kafka Streams (Port 9092)

### **Data Layer**

- PostgreSQL (Port 5432)
- Redis (Port 6379)
- MinIO (Port 9000)
- Qdrant (Port 6333)

### **Observability Layer**

- Prometheus (Port 9090)
- Grafana (Port 3003)
- Jaeger (Port 16686)
- Loki (Port 3100)

## Security

- JWT Authentication
- Vault Secrets (Port 8200)
- CORS Protection
- Rate Limiting
