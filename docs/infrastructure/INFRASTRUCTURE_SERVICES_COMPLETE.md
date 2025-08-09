# Infrastructure Services - Complete Documentation

## Overview

Auterity's infrastructure stack provides a comprehensive foundation for multi-agent workflow orchestration, featuring message queuing, object storage, vector search, local AI models, search analytics, and monitoring.

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Monitoring    │    │   Storage       │
│                 │    │                 │    │                 │
│ • Backend API   │    │ • Prometheus    │    │ • PostgreSQL    │
│ • Frontend UI   │    │ • Grafana       │    │ • Redis         │
│ • RelayCore     │    │ • Jaeger        │    │ • MinIO         │
│ • NeuroWeaver   │    │ • Alertmanager  │    │ • Elasticsearch │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   Search        │    │   Messaging     │
│                 │    │                 │    │                 │
│ • Ollama        │    │ • Elasticsearch │    │ • Redis Queue   │
│ • Qdrant        │    │ • Kibana        │    │ • Message Queue │
│ • Vector DB     │    │ • Full-text     │    │ • Event Stream  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Services

### 1. Message Queue Service (Redis)

**Purpose**: Reliable message delivery with persistence and delivery guarantees
**Location**: `/backend/app/services/message_queue.py`
**Port**: 6379

#### Features
- **At-least-once delivery** through acknowledgment system
- **Automatic retry** with exponential backoff (max 3 retries)
- **Dead letter queue** for permanently failed messages
- **Processing timeout recovery** for stale messages
- **Scheduled message processing** with delay support
- **Message persistence** with configurable TTL

#### Usage
```python
from app.services.message_queue import get_message_queue

mq = get_message_queue()

# Enqueue with priority and delay
message_id = mq.enqueue(
    queue_name="workflow_tasks",
    payload={"task": "process_data", "data": {...}},
    priority=5,
    delay_seconds=30,
    ttl_seconds=3600
)

# Process messages
message = mq.dequeue("workflow_tasks", timeout=10)
if message:
    try:
        result = process_task(message.payload)
        mq.ack(message)  # Success
    except Exception as e:
        mq.nack(message, str(e))  # Retry or dead letter
```

#### Configuration
```yaml
# Environment Variables
REDIS_URL: redis://redis:6379/0

# Queue Settings
DEFAULT_TTL: 86400  # 24 hours
PROCESSING_TIMEOUT: 300  # 5 minutes
MAX_RETRIES: 3
```

### 2. Object Storage Service (MinIO)

**Purpose**: S3-compatible object storage for workflow artifacts and file management
**Location**: `/backend/app/services/storage_service.py`
**Ports**: 9000 (API), 9001 (Console)

#### Features
- **S3-compatible API** for seamless integration
- **Presigned URLs** for secure file sharing
- **Bucket management** with automatic creation
- **File versioning** and metadata support
- **Web console** for administration

#### Usage
```python
from app.services.storage_service import get_storage_service

storage = get_storage_service()

# Upload workflow result
file_path = storage.upload_text("workflows", "result.json", json_data)

# Download file
content = storage.download_file("workflows", "result.json")

# Get shareable URL (expires in 1 hour)
url = storage.get_presigned_url("workflows", "result.json")

# List files
files = storage.list_files("workflows", prefix="2024/")
```

#### Configuration
```yaml
# Environment Variables
MINIO_ENDPOINT: minio:9000
MINIO_ACCESS_KEY: minioadmin
MINIO_SECRET_KEY: minioadmin123

# Default Buckets
- workflow-artifacts
- agent-outputs
- user-uploads
```

### 3. Vector Database Service (Qdrant)

**Purpose**: Semantic search and similarity matching for AI-powered features
**Location**: `/backend/app/services/vector_service.py`
**Port**: 6333

#### Features
- **Semantic search** with cosine similarity
- **Automatic embeddings** using SentenceTransformers
- **Collection management** with custom schemas
- **Metadata filtering** and hybrid search
- **Real-time indexing** and updates

#### Usage
```python
from app.services.vector_service import get_vector_service

vector_db = get_vector_service()

# Store workflow context with embeddings
vector_db.store_vector(
    "workflow_contexts",
    "Process customer data and generate analytics report",
    {"workflow_id": "123", "type": "data_processing", "tags": ["etl", "analytics"]}
)

# Find similar workflows
similar = vector_db.search_similar(
    "workflow_contexts",
    "Generate customer analytics dashboard",
    limit=5,
    score_threshold=0.7
)
```

#### Configuration
```yaml
# Environment Variables
QDRANT_HOST: qdrant
QDRANT_PORT: 6333

# Vector Settings
EMBEDDING_MODEL: all-MiniLM-L6-v2
VECTOR_SIZE: 384
DISTANCE_METRIC: cosine
```

### 4. Search & Analytics Service (Elasticsearch + Kibana)

**Purpose**: Full-text search, log analysis, and business intelligence
**Location**: `/backend/app/services/search_service.py`
**Ports**: 9200 (Elasticsearch), 5601 (Kibana)

#### Features
- **Full-text search** across workflows, executions, and logs
- **Advanced analytics** with aggregations and visualizations
- **Real-time indexing** of application data
- **Custom dashboards** in Kibana
- **Log correlation** and error tracking

#### Usage
```python
from app.services.search_service import get_search_service

search = get_search_service()

# Index workflow for search
search.index_workflow("workflow_123", {
    "name": "Customer Data Pipeline",
    "description": "ETL pipeline for customer analytics",
    "tags": ["etl", "analytics", "customer"]
})

# Search workflows
results = search.search_workflows(
    query="customer analytics",
    tags=["etl"],
    limit=10
)

# Search execution logs
logs = search.search_logs(
    query="error",
    level="ERROR",
    service="workflow_engine",
    time_range={"from": "2024-01-01", "to": "2024-01-31"}
)
```

#### Indices
```yaml
# Automatic Index Creation
workflows:
  mappings:
    name: text (analyzed)
    description: text (analyzed)
    tags: keyword
    created_at: date

executions:
  mappings:
    workflow_id: keyword
    status: keyword
    started_at: date
    error_message: text

logs:
  mappings:
    timestamp: date
    level: keyword
    message: text
    service: keyword
```

### 5. Local AI Service (Ollama)

**Purpose**: Local LLM hosting for cost-effective AI operations
**Port**: 11434

#### Features
- **Local model hosting** without API costs
- **Multiple model support** (Llama, Mistral, CodeLlama)
- **REST API** compatible with OpenAI format
- **Model management** and switching
- **GPU acceleration** support

#### Usage
```bash
# Pull and run models
curl -X POST http://localhost:11434/api/pull -d '{"name": "llama2"}'

# Generate completions
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama2", "prompt": "Explain workflow automation"}'
```

#### Model Management
```bash
# List available models
ollama list

# Pull new model
ollama pull mistral

# Remove model
ollama rm llama2
```

## Monitoring Stack

### Prometheus + Grafana

**Purpose**: Metrics collection and visualization
**Ports**: 9090 (Prometheus), 3003 (Grafana)

#### Metrics Collected
- **Application metrics**: Request rates, response times, error rates
- **Infrastructure metrics**: CPU, memory, disk, network
- **Service metrics**: Queue depths, cache hit rates, database connections
- **Business metrics**: Workflow executions, success rates, processing times

#### Dashboards
- **System Overview**: Infrastructure health and performance
- **Application Performance**: API metrics and service health
- **Workflow Analytics**: Execution statistics and trends
- **Error Tracking**: Error rates and failure analysis

### Jaeger Tracing

**Purpose**: Distributed tracing for request flow analysis
**Port**: 16686

#### Features
- **Request tracing** across microservices
- **Performance bottleneck** identification
- **Error correlation** with traces
- **Service dependency** mapping

### Alertmanager

**Purpose**: Alert routing and notification management
**Port**: 9093

#### Alert Rules
- **High error rates** (>5% for 5 minutes)
- **Service downtime** (health check failures)
- **Resource exhaustion** (>90% CPU/memory for 10 minutes)
- **Queue backlog** (>1000 pending messages)

## Service Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| MinIO Console | http://localhost:9001 | minioadmin/minioadmin123 |
| Qdrant Dashboard | http://localhost:6333/dashboard | None |
| Elasticsearch API | http://localhost:9200 | None |
| Kibana | http://localhost:5601 | None |
| Grafana | http://localhost:3003 | admin/admin123 |
| Prometheus | http://localhost:9090 | None |
| Jaeger UI | http://localhost:16686 | None |
| Ollama API | http://localhost:11434 | None |

## Deployment Commands

### Start All Services
```bash
# Full stack
docker-compose up

# Specific services
docker-compose up postgres redis minio qdrant elasticsearch

# With logs
docker-compose up -d && docker-compose logs -f
```

### Health Checks
```bash
# Check all services
docker-compose ps

# Individual health checks
curl http://localhost:9200/_cluster/health  # Elasticsearch
curl http://localhost:6333/health           # Qdrant
curl http://localhost:9000/minio/health/live # MinIO
```

### Data Persistence

All services use Docker volumes for data persistence:

```yaml
volumes:
  postgres_data:      # Database data
  redis_data:         # Cache and queue data
  minio_data:         # Object storage
  qdrant_data:        # Vector embeddings
  elasticsearch_data: # Search indices
  grafana_data:       # Dashboards and config
  prometheus_data:    # Metrics history
```

## Performance Tuning

### Resource Allocation
```yaml
# Production recommendations
elasticsearch:
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '1.0'
      reservations:
        memory: 1G

qdrant:
  deploy:
    resources:
      limits:
        memory: 1G
        cpus: '0.5'
```

### Optimization Settings
```yaml
# Elasticsearch
ES_JAVA_OPTS: "-Xms1g -Xmx1g"

# Redis
maxmemory: 512mb
maxmemory-policy: allkeys-lru

# PostgreSQL
shared_buffers: 256MB
effective_cache_size: 1GB
```

## Security Configuration

### Network Security
```yaml
# Internal network isolation
networks:
  ai-platform:
    driver: bridge
    internal: false  # Set to true for production
```

### Access Control
```yaml
# Service authentication
elasticsearch:
  environment:
    xpack.security.enabled: true  # Enable in production
    
vault:  # Future implementation
  environment:
    VAULT_DEV_ROOT_TOKEN_ID: ${VAULT_TOKEN}
```

## Backup and Recovery

### Automated Backups
```bash
# Database backup
docker exec postgres pg_dump -U postgres workflow_engine > backup.sql

# MinIO backup
mc mirror minio/workflow-artifacts ./backups/minio/

# Elasticsearch backup
curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_1"
```

### Recovery Procedures
```bash
# Restore database
docker exec -i postgres psql -U postgres workflow_engine < backup.sql

# Restore MinIO
mc mirror ./backups/minio/ minio/workflow-artifacts/

# Restore Elasticsearch
curl -X POST "localhost:9200/_snapshot/backup_repo/snapshot_1/_restore"
```

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service_name

# Check resource usage
docker stats

# Restart service
docker-compose restart service_name
```

#### Performance Issues
```bash
# Monitor resource usage
docker exec service_name top

# Check service health
curl http://localhost:port/health

# Review metrics in Grafana
```

#### Data Issues
```bash
# Check data volumes
docker volume ls
docker volume inspect volume_name

# Verify data integrity
docker exec service_name service_specific_check
```

## Development Workflow

### Local Development
```bash
# Start development stack
docker-compose up postgres redis minio

# Run application locally
cd backend && python -m app.main
cd frontend && npm run dev
```

### Testing
```bash
# Integration tests with services
docker-compose -f docker-compose.test.yml up

# Service-specific tests
pytest tests/services/test_message_queue.py
pytest tests/services/test_storage_service.py
```

### Production Deployment
```bash
# Production configuration
docker-compose -f docker-compose.prod.yml up -d

# Health verification
./scripts/health-check.sh

# Monitoring setup
./scripts/setup-monitoring.sh
```

This infrastructure provides a robust, scalable foundation for the Auterity multi-agent workflow platform with comprehensive monitoring, search, and AI capabilities.