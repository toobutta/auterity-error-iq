# Auterity Infrastructure - Complete Documentation

## 🏗️ Infrastructure Overview

Auterity provides a comprehensive, production-ready infrastructure stack for multi-agent workflow orchestration with enterprise-grade monitoring, search, storage, and AI capabilities.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq

# Start all services
docker-compose up -d

# Verify services
docker-compose ps
```

## 📋 Service Stack

### Core Application Services
- **Backend API** (FastAPI) - Port 8000
- **Frontend UI** (React) - Port 3000
- **RelayCore** (AI Routing) - Port 3001
- **NeuroWeaver** (Model Management) - Port 8001/3002

### Infrastructure Services
- **PostgreSQL** - Primary database - Port 5432
- **Redis** - Cache & message queue - Port 6379
- **MinIO** - S3-compatible storage - Ports 9000/9001
- **Qdrant** - Vector database - Port 6333
- **Elasticsearch** - Search engine - Port 9200
- **Kibana** - Search UI - Port 5601
- **Ollama** - Local LLM hosting - Port 11434

### Monitoring Stack
- **Prometheus** - Metrics collection - Port 9090
- **Grafana** - Dashboards - Port 3003
- **Jaeger** - Distributed tracing - Port 16686
- **Alertmanager** - Alert routing - Port 9093

## 🔧 Service Capabilities

### Message Queue Service (Redis)
```python
from app.services.message_queue import get_message_queue

mq = get_message_queue()
message_id = mq.enqueue("tasks", {"action": "process"}, priority=5)
```
- At-least-once delivery guarantees
- Automatic retry with exponential backoff
- Dead letter queue for failed messages
- Scheduled message processing

### Object Storage Service (MinIO)
```python
from app.services.storage_service import get_storage_service

storage = get_storage_service()
file_path = storage.upload_text("bucket", "file.json", data)
url = storage.get_presigned_url("bucket", "file.json")
```
- S3-compatible API
- Presigned URLs for secure sharing
- Automatic bucket management
- Web console at localhost:9001

### Vector Database Service (Qdrant)
```python
from app.services.vector_service import get_vector_service

vector_db = get_vector_service()
vector_db.store_vector("contexts", "workflow description", metadata)
similar = vector_db.search_similar("contexts", "query", limit=5)
```
- Semantic search with embeddings
- Automatic text vectorization
- Metadata filtering
- Dashboard at localhost:6333

### Search & Analytics Service (Elasticsearch)
```python
from app.services.search_service import get_search_service

search = get_search_service()
search.index_workflow("id", workflow_data)
results = search.search_workflows("query", tags=["etl"])
```
- Full-text search across all data
- Advanced analytics and aggregations
- Real-time indexing
- Kibana UI at localhost:5601

## 🌐 Service Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Application** | http://localhost:3000 | - |
| **API Docs** | http://localhost:8000/docs | - |
| **MinIO Console** | http://localhost:9001 | minioadmin/minioadmin123 |
| **Qdrant Dashboard** | http://localhost:6333/dashboard | - |
| **Kibana** | http://localhost:5601 | - |
| **Grafana** | http://localhost:3003 | admin/admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Jaeger** | http://localhost:16686 | - |

## 📊 Monitoring & Observability

### Metrics Collection
- **Application metrics**: Request rates, response times, errors
- **Infrastructure metrics**: CPU, memory, disk, network
- **Service metrics**: Queue depths, cache hits, DB connections
- **Business metrics**: Workflow executions, success rates

### Dashboards Available
- **System Overview**: Infrastructure health
- **Application Performance**: API and service metrics
- **Workflow Analytics**: Execution statistics
- **Error Tracking**: Failure analysis

### Alerting Rules
- High error rates (>5% for 5 minutes)
- Service downtime (health check failures)
- Resource exhaustion (>90% CPU/memory)
- Queue backlog (>1000 pending messages)

## 🔒 Security Features

### Network Security
- Internal Docker network isolation
- Firewall rules for external access
- SSL/TLS termination at proxy level

### Data Security
- Encrypted connections between services
- Secure credential management
- Input validation and sanitization
- Audit logging for sensitive operations

### Access Control
- Role-based authentication
- API key management
- Service-to-service authentication
- Admin interface protection

## 📈 Performance & Scaling

### Resource Optimization
```yaml
# Production resource limits
elasticsearch:
  deploy:
    resources:
      limits: { memory: 8G, cpus: '2.0' }
      
postgres:
  deploy:
    resources:
      limits: { memory: 4G, cpus: '2.0' }
```

### Scaling Strategies
- **Horizontal scaling**: Multiple backend instances
- **Database scaling**: Read replicas, connection pooling
- **Cache optimization**: Redis clustering
- **Storage scaling**: MinIO distributed mode

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Daily backup script
./scripts/backup.sh

# Backup includes:
# - PostgreSQL database dump
# - MinIO object storage
# - Elasticsearch indices
# - Configuration files
```

### Recovery Procedures
```bash
# Restore from backup
./scripts/restore.sh 2024-01-15

# Point-in-time recovery available
# Zero-downtime updates supported
```

## 🚀 Deployment Options

### Development
```bash
# Start core services only
docker-compose up postgres redis minio

# Run application locally
cd backend && python -m app.main
cd frontend && npm run dev
```

### Production
```bash
# Full production deployment
docker-compose -f docker-compose.prod.yml up -d

# With SSL and domain configuration
# Includes nginx reverse proxy
# Automated certificate management
```

### Cloud Deployment
- **AWS**: ECS, RDS, ElastiCache, S3
- **GCP**: Cloud Run, Cloud SQL, Memorystore
- **Azure**: Container Instances, Database, Cache

## 📚 Documentation Links

### Infrastructure Guides
- [Complete Infrastructure Services](docs/infrastructure/INFRASTRUCTURE_SERVICES_COMPLETE.md)
- [Service Integration Guide](docs/development/SERVICE_INTEGRATION_GUIDE.md)
- [Production Deployment](docs/deployment/PRODUCTION_DEPLOYMENT_COMPLETE.md)

### API Documentation
- [Backend API Reference](docs/BACKEND_API_DOCUMENTATION.md)
- [Workflow Engine](docs/WORKFLOW_ENGINE_IMPLEMENTATION.md)
- [Authentication](docs/AUTHENTICATION_IMPLEMENTATION.md)

### Development Guides
- [Development Setup](docs/DEVELOPMENT_SETUP.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Code Quality Guide](docs/code-quality-guide.md)

## 🛠️ Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check logs
docker-compose logs service_name

# Check resources
docker stats

# Restart service
docker-compose restart service_name
```

#### Performance Issues
```bash
# Monitor resources
docker exec service_name top

# Check service health
curl http://localhost:port/health

# Review Grafana dashboards
```

#### Data Issues
```bash
# Check volumes
docker volume ls
docker volume inspect volume_name

# Verify data integrity
./scripts/health-check.sh
```

### Support Resources
- **Health Checks**: `./scripts/health-check.sh`
- **Log Analysis**: Centralized in Kibana
- **Metrics**: Real-time in Grafana
- **Tracing**: Request flows in Jaeger

## 🔮 Future Enhancements

### Planned Additions
- **Vault** - Secrets management
- **Loki** - Log aggregation
- **OpenTelemetry** - Unified observability
- **Kafka** - Event streaming

### Advanced Features
- **Celery** - Advanced task queue
- **MLflow** - ML experiment tracking
- **Temporal** - Durable workflows
- **Airflow** - Complex scheduling

## 📞 Getting Help

### Quick Commands
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose restart

# Clean reset
docker-compose down -v && docker-compose up -d
```

### Health Verification
```bash
# Run comprehensive health check
./scripts/health-check.sh

# Check individual services
curl http://localhost:9200/_cluster/health  # Elasticsearch
curl http://localhost:6333/health           # Qdrant
curl http://localhost:8000/health           # Backend API
```

---

**Auterity Infrastructure** provides enterprise-grade reliability, scalability, and observability for multi-agent workflow automation. All services are production-ready with comprehensive monitoring, backup, and security features.

**Repository**: https://github.com/toobutta/auterity-error-iq  
**Documentation**: Complete guides in `/docs` directory  
**Support**: Health checks, monitoring dashboards, and troubleshooting tools included