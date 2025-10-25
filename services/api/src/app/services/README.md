

# Services Documentatio

n

#

# Message Queue Servic

e

#

## Overvie

w

Redis-based message queue service providing reliable message delivery with persistence and delivery guarantees for multi-agent workflow orchestration

.

#

## Locatio

n

`/backend/app/services/message_queue.py`

#

## Key Feature

s

#

### Message Persistenc

e

- Messages stored in Redis with configurable TT

L

- Survives Redis restarts when persistence enable

d

- Automatic cleanup of expired message

s

#

### Delivery Guarantee

s

- **At-least-once delivery

* * through acknowledgment syste

m

- **Automatic retry

* * with exponential backoff (max 3 retries

)

- **Dead letter queue

* * for permanently failed message

s

- **Processing timeout recovery

* * for stale message

s

#

### Core Operation

s

```python
from app.services.message_queue import get_message_queue

mq = get_message_queue()

# Enqueue message

message_id = mq.enqueue(
    queue_name="workflow_tasks",
    payload={"task": "process_data", "data": {...}},
    priority=5,
    delay_seconds=30,
    ttl_seconds=3600
)

# Dequeue and process

message = mq.dequeue("workflow_tasks", timeout=10)
if message:
    try:


# Process message

        result = process_workflow_task(message.payload)
        mq.ack(message)

# Success

    except Exception as e:
        mq.nack(message, str(e))

# Retry or dead letter

```

#

### Message Mode

l

```

python
class QueueMessage(BaseModel):
    id: str

# Unique message ID

    queue_name: str

# Target queue

    payload: Dict[str, Any]

# Message data

    priority: int

# 0-10 priorit

y

    retry_count: int

# Current retry attempt

    max_retries: int

# Maximum retries (default: 3)

    created_at: datetime

# Creation timestamp

    scheduled_at: datetime

# Delayed execution time

    expires_at: datetime

# Message expiration

    status: MessageStatus

# PENDING/PROCESSING/COMPLETED/FAILED/DEAD_LETTER

    error_message: str

# Last error details

```

#

### Advanced Feature

s

**Scheduled Messages

* *

```

python

# Process scheduled messages (run periodically)

processed = mq.process_scheduled_messages()

```

**Recovery Operations

* *

```

python

# Recover stale processing messages

recovered = mq.recover_stale_messages()

```

**Monitoring

* *

```

python

# Queue statistics

stats = mq.get_queue_stats("workflow_tasks")

# Returns: {"pending": 5, "processing": 2, "dead_letter": 1

}

# Health check

health = mq.health_check()

# Returns Redis connection status and metrics

```

#

## Configuratio

n

Uses Redis connection from application settings:

- Default: `redis://localhost:6379

`

- Configurable via `REDIS_URL` environment variabl

e

#

## Usage in MCP Architectur

e

- **Agent Communication**: Reliable message passing between agent

s

- **Workflow Orchestration**: Task distribution and coordinatio

n

- **Error Recovery**: Automatic retry and failure handlin

g

- **Monitoring**: Real-time queue metrics and health statu

s

#

## Integration Point

s

- **Workflow Engine**: Task execution and coordinatio

n

- **Protocol Manager**: Inter-agent message routin

g

- **Context Manager**: State synchronization message

s

- **Monitoring Dashboard**: Queue metrics visualizatio

n

#

# Storage Servic

e

#

## Overvie

w

MinIO-based S3-compatible object storage for workflow artifacts, agent outputs, and file management

.

#

## Locatio

n

`/backend/app/services/storage_service.py`

#

## Usag

e

```

python
from app.services.storage_service import get_storage_service

storage = get_storage_service()

# Upload workflow result

file_path = storage.upload_text("workflows", "result.json", json_data)

# Download file

content = storage.download_file("workflows", "result.json")

# Get shareable URL

url = storage.get_presigned_url("workflows", "result.json")

```

#

# Vector Servic

e

#

## Overvie

w

Qdrant vector database for semantic search, context similarity, and AI-powered workflow recommendations

.

#

## Locatio

n

`/backend/app/services/vector_service.py`

#

## Usag

e

```

python
from app.services.vector_service import get_vector_service

vector_db = get_vector_service()

# Store workflow context

vector_db.store_vector(
    "workflow_contexts",
    "Process customer data and generate report",
    {"workflow_id": "123", "type": "data_processing"}
)

# Find similar workflows

similar = vector_db.search_similar(
    "workflow_contexts",
    "Generate customer analytics",
    limit=3
)

```

#

# Search Servic

e

#

## Overvie

w

Elasticsearch-based search and analytics for workflows, executions, and logs with Kibana visualization

.

#

## Locatio

n

`/backend/app/services/search_service.py`

#

## Usag

e

```

python
from app.services.search_service import get_search_service

search = get_search_service()

# Index workflow

search.index_workflow("workflow_123", {
    "name": "Data Processing",
    "description": "Process customer data",
    "tags": ["data", "etl"]
})

# Search workflows

results = search.search_workflows("customer data", tags=["etl"])

# Search logs

logs = search.search_logs(
    query="error",
    level="ERROR",
    time_range={"from": "2024-01-01", "to": "2024-01-31"}

)

```

#

# ML Monitoring Servic

e

#

## Overvie

w

Evidently.ai-based ML model monitoring for data drift detection, model performance tracking, and data quality validation

.

#

## Locatio

n

`/backend/app/services/ml_monitoring_service.py`

#

## Usag

e

```

python
from app.services.ml_monitoring_service import get_ml_monitoring_service
import pandas as pd

ml_monitor = get_ml_monitoring_service()

# Monitor data drift

drift_report = ml_monitor.create_drift_report(
    reference_data=reference_df,
    current_data=current_df
)

# Monitor model performance

perf_report = ml_monitor.create_model_performance_report(
    reference_data=reference_df,
    current_data=current_df
)

# Run data quality tests

quality_tests = ml_monitor.run_data_quality_tests(data_df)

```

#

# Service Acces

s

- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123

)

- **Qdrant Dashboard**: http://localhost:6333/dashboar

d

- **Ollama API**: http://localhost:1143

4

- **Elasticsearch**: http://localhost:920

0

- **Kibana**: http://localhost:560

1

- **Evidently Dashboard**: http://localhost:808

5
