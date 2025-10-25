

# Service Integration Guid

e

#

# Overvie

w

This guide provides step-by-step instructions for integrating with Auterity's infrastructure services in your application code

.

#

# Quick Start Integratio

n

#

##

 1. Message Queue Integrati

o

n

#

### Basic Setu

p

```python

# app/services/workflow_service.py

from app.services.message_queue import get_message_queue

class WorkflowService:
    def __init__(self):
        self.message_queue = get_message_queue()

    async def execute_workflow_async(self, workflow_id: str, input_data: dict):


# Queue workflow for background processing

        message_id = self.message_queue.enqueue(
            queue_name="workflow_execution",
            payload={
                "workflow_id": workflow_id,
                "input_data": input_data,
                "priority": 5
            },
            delay_seconds=0,
            ttl_seconds=3600
        )
        return {"message_id": message_id, "status": "queued"}

```

#

### Worker Implementatio

n

```

python

# app/workers/workflow_worker.py

import asyncio
from app.services.message_queue import get_message_queue
from app.services.workflow_engine import WorkflowEngine

class WorkflowWorker:
    def __init__(self):
        self.message_queue = get_message_queue()
        self.workflow_engine = WorkflowEngine()

    async def process_workflows(self):
        while True:
            message = self.message_queue.dequeue("workflow_execution", timeout=30)
            if message:
                try:
                    result = await self.workflow_engine.execute_workflow(
                        message.payload["workflow_id"],
                        message.payload["input_data"]
                    )
                    self.message_queue.ack(message)
                except Exception as e:
                    self.message_queue.nack(message, str(e))
            await asyncio.sleep(1)

```

#

##

 2. Storage Service Integrati

o

n

#

### File Upload Handlin

g

```

python

# app/api/endpoints/files.py

from fastapi import APIRouter, UploadFile, File
from app.services.storage_service import get_storage_service

router = APIRouter()
storage = get_storage_service()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):


# Upload to MinIO

    file_path = storage.upload_file(
        bucket_name="user-uploads",

        object_name=f"uploads/{file.filename}",
        file_data=file.file,
        content_type=file.content_type
    )



# Generate shareable URL

    download_url = storage.get_presigned_url(
        "user-uploads",

        f"uploads/{file.filename}"
    )

    return {
        "file_path": file_path,
        "download_url": download_url,
        "filename": file.filename
    }

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    content = storage.download_file("user-uploads", f"uploads/{file_id}")

    return Response(content=content, media_type="application/octet-stream"

)

```

#

### Workflow Artifact Storag

e

```

python

# app/services/workflow_execution_service.py

from app.services.storage_service import get_storage_service

class WorkflowExecutionService:
    def __init__(self):
        self.storage = get_storage_service()

    async def save_execution_result(self, execution_id: str, result_data: dict):


# Store execution result as JSON

        result_json = json.dumps(result_data, indent=2)
        file_path = self.storage.upload_text(
            bucket_name="workflow-artifacts",

            object_name=f"executions/{execution_id}/result.json",
            text=result_json
        )



# Store any generated files

        if "output_files" in result_data:
            for file_info in result_data["output_files"]:
                self.storage.upload_file(
                    bucket_name="workflow-artifacts",

                    object_name=f"executions/{execution_id}/{file_info['name']}",
                    file_data=file_info["content"],
                    content_type=file_info["type"]
                )

        return file_path

```

#

##

 3. Vector Database Integrati

o

n

#

### Semantic Search Implementatio

n

```

python

# app/services/workflow_search_service.py

from app.services.vector_service import get_vector_service

class WorkflowSearchService:
    def __init__(self):
        self.vector_db = get_vector_service()

    async def index_workflow(self, workflow: dict):


# Create searchable text from workflow

        searchable_text = f"{workflow['name']} {workflow['description']}"



# Store with metadata

        vector_id = self.vector_db.store_vector(
            collection_name="workflows",
            text=searchable_text,
            metadata={
                "workflow_id": workflow["id"],
                "name": workflow["name"],
                "tags": workflow.get("tags", []),
                "created_at": workflow["created_at"],
                "category": workflow.get("category", "general")
            }
        )

        return vector_id

    async def find_similar_workflows(self, query: str, limit: int = 5):
        results = self.vector_db.search_similar(
            collection_name="workflows",
            query_text=query,
            limit=limit,
            score_threshold=0.7

        )

        return [
            {
                "workflow_id": result["metadata"]["workflow_id"],
                "name": result["metadata"]["name"],
                "similarity_score": result["score"],
                "tags": result["metadata"]["tags"]
            }
            for result in results
        ]

```

#

### Context-Aware Recommendatio

n

s

```

python

# app/services/recommendation_service.py

from app.services.vector_service import get_vector_service

class RecommendationService:
    def __init__(self):
        self.vector_db = get_vector_service()

    async def get_workflow_recommendations(self, user_context: dict):


# Build context query from user's recent activities

        context_text = f"User interested in {' '.join(user_context.get('interests', []))}"



# Find similar workflows

        similar_workflows = self.vector_db.search_similar(
            collection_name="workflows",
            query_text=context_text,
            limit=10,
            score_threshold=0.6

        )



# Filter by user's skill level and preferences

        filtered_recommendations = []
        for workflow in similar_workflows:
            if self._matches_user_preferences(workflow["metadata"], user_context):
                filtered_recommendations.append(workflow)

        return filtered_recommendations[:5]

```

#

##

 4. Search Service Integrati

o

n

#

### Application Searc

h

```

python

# app/api/endpoints/search.py

from fastapi import APIRouter, Query
from app.services.search_service import get_search_service

router = APIRouter()
search = get_search_service()

@router.get("/search/workflows")
async def search_workflows(
    q: str = Query(..., description="Search query"),
    tags: List[str] = Query([], description="Filter by tags"),
    limit: int = Query(10, le=50)
):
    results = search.search_workflows(
        query=q,
        tags=tags if tags else None,
        limit=limit
    )

    return {
        "query": q,
        "total": len(results),
        "results": results
    }

@router.get("/search/executions")
async def search_executions(
    workflow_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    date_range = None
    if date_from and date_to:
        date_range = {"from": date_from, "to": date_to}

    results = search.search_executions(
        workflow_id=workflow_id,
        status=status,
        date_range=date_range
    )

    return {"results": results}

```

#

### Automated Indexin

g

```

python

# app/services/indexing_service.py

from app.services.search_service import get_search_service

class IndexingService:
    def __init__(self):
        self.search = get_search_service()

    async def index_workflow_execution(self, execution: dict):


# Index execution for search

        indexed = self.search.index_execution(
            execution_id=execution["id"],
            execution_data={
                "workflow_id": execution["workflow_id"],
                "status": execution["status"],
                "started_at": execution["started_at"],
                "completed_at": execution.get("completed_at"),
                "error_message": execution.get("error_message"),
                "input_data": execution["input_data"],
                "output_data": execution.get("output_data", {})
            }
        )



# Also index any logs generated

        if "logs" in execution:
            for log_entry in execution["logs"]:
                self.search.index_log({
                    "timestamp": log_entry["timestamp"],
                    "level": log_entry["level"],
                    "message": log_entry["message"],
                    "service": "workflow_engine",
                    "execution_id": execution["id"]
                })

        return indexed

```

#

# Advanced Integration Pattern

s

#

##

 1. Event-Driven Architect

u

r

e

```

python

# app/events/workflow_events.py

from app.services.message_queue import get_message_queue
from app.services.search_service import get_search_service
from app.services.vector_service import get_vector_service

class WorkflowEventHandler:
    def __init__(self):
        self.message_queue = get_message_queue()
        self.search = get_search_service()
        self.vector_db = get_vector_service()

    async def handle_workflow_created(self, workflow: dict):


# Queue for indexing

        self.message_queue.enqueue(
            queue_name="indexing_tasks",
            payload={
                "action": "index_workflow",
                "workflow": workflow
            }
        )



# Queue for vector embedding

        self.message_queue.enqueue(
            queue_name="vector_tasks",
            payload={
                "action": "embed_workflow",
                "workflow": workflow
            }
        )

    async def handle_execution_completed(self, execution: dict):


# Index execution results

        self.search.index_execution(execution["id"], execution)



# Update workflow usage statistics

        self.message_queue.enqueue(
            queue_name="analytics_tasks",
            payload={
                "action": "update_workflow_stats",
                "workflow_id": execution["workflow_id"],
                "execution": execution
            }
        )

```

#

##

 2. Caching Strate

g

y

```

python

# app/services/cache_service.py

import json
from typing import Optional, Any
from app.services.message_queue import get_message_queue

class CacheService:
    def __init__(self):


# Use Redis from message queue service for caching

        self.redis_client = get_message_queue().redis_client
        self.default_ttl = 3600

# 1 hou

r

    async def get(self, key: str) -> Optional[Any]:

        try:
            value = self.redis_client.get(f"cache:{key}")
            return json.loads(value) if value else None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = None) -> bool:

        try:
            ttl = ttl or self.default_ttl
            self.redis_client.setex(
                f"cache:{key}",
                ttl,
                json.dumps(value, default=str)
            )
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> bool:

        try:
            self.redis_client.delete(f"cache:{key}")
            return True
        except Exception:
            return False

# Usage in services

class WorkflowService:
    def __init__(self):
        self.cache = CacheService()
        self.search = get_search_service()

    async def get_workflow_with_cache(self, workflow_id: str):


# Try cache first

        cached = await self.cache.get(f"workflow:{workflow_id}")
        if cached:
            return cached



# Fetch from database/search

        workflow = await self.fetch_workflow(workflow_id)



# Cache for future requests

        await self.cache.set(f"workflow:{workflow_id}", workflow, ttl=1800)

        return workflow

```

#

##

 3. Health Monitoring Integrati

o

n

```

python

# app/monitoring/health_service.py

from app.services.message_queue import get_message_queue
from app.services.storage_service import get_storage_service
from app.services.vector_service import get_vector_service
from app.services.search_service import get_search_service

class HealthService:
    def __init__(self):
        self.services = {
            "message_queue": get_message_queue(),
            "storage": get_storage_service(),
            "vector_db": get_vector_service(),
            "search": get_search_service()
        }

    async def check_all_services(self) -> dict:

        health_status = {}

        for service_name, service in self.services.items():
            try:
                health = service.health_check()
                health_status[service_name] = health
            except Exception as e:
                health_status[service_name] = {
                    "status": "unhealthy",
                    "error": str(e)
                }

        overall_status = "healthy" if all(
            status.get("status") == "healthy"
            for status in health_status.values()
        ) else "degraded"

        return {
            "overall_status": overall_status,
            "services": health_status,
            "timestamp": datetime.utcnow().isoformat()
        }

# FastAPI health endpoint

@router.get("/health")
async def health_check():
    health_service = HealthService()
    return await health_service.check_all_services()

```

#

# Error Handling and Resilienc

e

#

##

 1. Circuit Breaker Patte

r

n

```

python

# app/utils/circuit_breaker.py

import time
from enum import Enum
from typing import Callable, Any

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    async def call(self, func: Callable, *args, **kwargs) -> Any:

        if self.state == CircuitState.OPEN:
            if time.time()

 - self.last_failure_time > self.timeout:

                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")

        try:
            result = await func(*args, **kwargs)

            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failure_count += 1

        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage with services

class ResilientWorkflowService:
    def __init__(self):
        self.search_circuit = CircuitBreaker(failure_threshold=3, timeout=30)
        self.vector_circuit = CircuitBreaker(failure_threshold=3, timeout=30)
        self.search = get_search_service()
        self.vector_db = get_vector_service()

    async def search_workflows_resilient(self, query: str):
        try:
            return await self.search_circuit.call(
                self.search.search_workflows,
                query=query
            )
        except Exception:


# Fallback to basic database search

            return await self.fallback_search(query)

```

#

##

 2. Retry Logic with Exponential Backo

f

f

```

python

# app/utils/retry.py

import asyncio
import random
from typing import Callable, Any

async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    base_delay: float = 1.0,

    max_delay: float = 60.0,

    backoff_factor: float = 2.0,

    jitter: bool = True
) -> Any:

    last_exception = None

    for attempt in range(max_retries

 + 1):

        try:
            return await func()
        except Exception as e:
            last_exception = e

            if attempt == max_retries:
                break



# Calculate delay with exponential backoff

            delay = min(base_delay

 * (backoff_factor

* * attempt), max_delay

)



# Add jitter to prevent thundering herd

            if jitter:
                delay *= (0.

5

 + random.random(

)

 * 0.5

)

            await asyncio.sleep(delay)

    raise last_exception

# Usage in services

class RobustStorageService:
    def __init__(self):
        self.storage = get_storage_service()

    async def upload_with_retry(self, bucket: str, key: str, data: bytes):
        return await retry_with_backoff(
            lambda: self.storage.upload_file(bucket, key, data),
            max_retries=3,
            base_delay=1.0

        )

```

#

# Testing Integratio

n

#

##

 1. Service Mocking for Tes

t

s

```

python

# tests/conftest.py

import pytest
from unittest.mock import Mock, AsyncMock

@pytest.fixture
def mock_message_queue():
    mock = Mock()
    mock.enqueue = Mock(return_value="test-message-id")

    mock.dequeue = Mock(return_value=None)
    mock.ack = Mock(return_value=True)
    mock.nack = Mock(return_value=True)
    return mock

@pytest.fixture
def mock_storage_service():
    mock = Mock()
    mock.upload_file = Mock(return_value="test-bucket/test-file")

    mock.download_file = Mock(return_value=b"test content")
    mock.get_presigned_url = Mock(return_value="https://test-url")

    return mock

@pytest.fixture
def mock_vector_service():
    mock = Mock()
    mock.store_vector = Mock(return_value="test-vector-id")

    mock.search_similar = Mock(return_value=[])
    return mock

```

#

##

 2. Integration Tes

t

s

```

python

# tests/integration/test_service_integration.py

import pytest
from app.services.workflow_service import WorkflowService

@pytest.mark.integration
async def test_workflow_execution_with_services():


# This test requires actual services running

    workflow_service = WorkflowService()



# Test workflow execution with message queue

    result = await workflow_service.execute_workflow_async(
        workflow_id="test-workflow",

        input_data={"test": "data"}
    )

    assert result["status"] == "queued"
    assert "message_id" in result

@pytest.mark.integration
async def test_file_upload_and_search():


# Test file upload and indexing

    from app.services.storage_service import get_storage_service
    from app.services.search_service import get_search_service

    storage = get_storage_service()
    search = get_search_service()



# Upload test file

    file_path = storage.upload_text(
        "test-bucket",

        "test-file.txt",

        "This is test content for search"
    )



# Index for search

    indexed = search.index_log({
        "timestamp": "2024-01-01T00:00:00Z",

        "level": "INFO",
        "message": "Test file uploaded",
        "service": "test",
        "file_path": file_path
    })

    assert indexed



# Search for the log

    results = search.search_logs(query="Test file uploaded")
    assert len(results) > 0

```

This integration guide provides comprehensive examples for working with all infrastructure services in your application code, including error handling, resilience patterns, and testing strategies.
