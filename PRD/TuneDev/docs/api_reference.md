# NeuroWeaver API Reference

This document provides a comprehensive reference for the NeuroWeaver API, allowing developers to programmatically interact with the platform for AI model specialization and deployment.

## API Overview

The NeuroWeaver API is a RESTful API that provides access to all platform features, including workflow management, model training, deployment, and monitoring. The API is organized around resources and uses standard HTTP methods for operations.

**Base URL**: `https://api.neuroweaver.auterity.com/api/v1`

## Authentication

All API requests require authentication using either JWT tokens or API keys.

### JWT Authentication

```http
GET /api/v1/models
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key Authentication

```http
GET /api/v1/models
X-API-Key: sk_neuroweaver_123456789
```

## Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Maximum number of items to return (default: 20, max: 100) |
| `offset` | integer | Number of items to skip (default: 0) |
| `sort` | string | Field to sort by (e.g., `created_at`) |
| `order` | string | Sort order (`asc` or `desc`, default: `desc`) |
| `fields` | string | Comma-separated list of fields to include in the response |

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests. Error responses include a JSON object with details about the error.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid parameter: limit must be between 1 and 100",
    "details": {
      "parameter": "limit",
      "constraint": "1-100"
    }
  }
}
```

## Rate Limiting

API requests are subject to rate limiting to ensure fair usage. Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1625097600
```

## API Endpoints

### Authentication

#### Get Access Token

```http
POST /auth/token
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Create API Key

```http
POST /auth/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Production API Key",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

**Response**:

```json
{
  "id": "apk_123456789",
  "name": "Production API Key",
  "key": "sk_neuroweaver_123456789",
  "created_at": "2025-08-01T12:00:00Z",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

### Workflows

#### List Workflows

```http
GET /workflows
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "wf_123456789",
      "name": "Automotive Service Advisor",
      "description": "Fine-tuned model for automotive service department applications",
      "workflow_type": "fine-tuning",
      "status": "completed",
      "created_at": "2025-08-01T12:00:00Z",
      "updated_at": "2025-08-01T14:30:00Z"
    },
    {
      "id": "wf_987654321",
      "name": "Sales Assistant",
      "description": "Fine-tuned model for automotive sales applications",
      "workflow_type": "fine-tuning",
      "status": "in_progress",
      "created_at": "2025-08-01T15:00:00Z",
      "updated_at": "2025-08-01T15:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Workflow

```http
GET /workflows/{workflow_id}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "id": "wf_123456789",
  "name": "Automotive Service Advisor",
  "description": "Fine-tuned model for automotive service department applications",
  "workflow_type": "fine-tuning",
  "config": {
    "task": "vertical-tune",
    "vertical": "automotive",
    "specialization": "service_advisor",
    "model": {
      "name": "mistral-7b",
      "revision": "v0.1"
    },
    "dataset": {
      "primary": "./datasets/maintenance_procedures.jsonl",
      "validation_split": 0.1
    },
    "fine_tuning": {
      "method": "QLoRA",
      "parameters": {
        "epochs": 3,
        "learning_rate": 2e-4
      }
    }
  },
  "status": "completed",
  "created_at": "2025-08-01T12:00:00Z",
  "updated_at": "2025-08-01T14:30:00Z",
  "completed_at": "2025-08-01T14:30:00Z",
  "metrics": {
    "accuracy": 0.92,
    "f1": 0.91,
    "training_time": 8640
  },
  "output": {
    "model_id": "model_123456789",
    "checkpoint_path": "./checkpoints/mistral-service-advisor"
  }
}
```

#### Create Workflow

```http
POST /workflows
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Automotive Service Advisor",
  "description": "Fine-tuned model for automotive service department applications",
  "workflow_type": "fine-tuning",
  "config": {
    "task": "vertical-tune",
    "vertical": "automotive",
    "specialization": "service_advisor",
    "model": {
      "name": "mistral-7b",
      "revision": "v0.1"
    },
    "dataset": {
      "primary": "./datasets/maintenance_procedures.jsonl",
      "validation_split": 0.1
    },
    "fine_tuning": {
      "method": "QLoRA",
      "parameters": {
        "epochs": 3,
        "learning_rate": 2e-4
      }
    }
  }
}
```

**Response**:

```json
{
  "id": "wf_123456789",
  "name": "Automotive Service Advisor",
  "description": "Fine-tuned model for automotive service department applications",
  "workflow_type": "fine-tuning",
  "status": "pending",
  "created_at": "2025-08-01T12:00:00Z",
  "updated_at": "2025-08-01T12:00:00Z"
}
```

#### Start Workflow

```http
POST /workflows/{workflow_id}/start
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "id": "wf_123456789",
  "status": "running",
  "started_at": "2025-08-01T12:05:00Z",
  "updated_at": "2025-08-01T12:05:00Z"
}
```

#### Cancel Workflow

```http
POST /workflows/{workflow_id}/cancel
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "id": "wf_123456789",
  "status": "cancelled",
  "cancelled_at": "2025-08-01T12:10:00Z",
  "updated_at": "2025-08-01T12:10:00Z"
}
```

### Models

#### List Models

```http
GET /models
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "model_123456789",
      "name": "Automotive Service Advisor",
      "description": "Fine-tuned model for automotive service department applications",
      "base_model": "mistral-7b",
      "type": "fine-tuned",
      "specialization": "service_advisor",
      "status": "active",
      "created_at": "2025-08-01T14:30:00Z",
      "updated_at": "2025-08-01T14:30:00Z"
    },
    {
      "id": "model_987654321",
      "name": "Automotive Sales Assistant",
      "description": "Fine-tuned model for automotive sales applications",
      "base_model": "llama-7b",
      "type": "fine-tuned",
      "specialization": "sales_assistant",
      "status": "active",
      "created_at": "2025-07-15T10:00:00Z",
      "updated_at": "2025-07-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Model

```http
GET /models/{model_id}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "id": "model_123456789",
  "name": "Automotive Service Advisor",
  "description": "Fine-tuned model for automotive service department applications",
  "base_model": "mistral-7b",
  "type": "fine-tuned",
  "specialization": "service_advisor",
  "status": "active",
  "metrics": {
    "accuracy": 0.92,
    "f1": 0.91,
    "precision": 0.93,
    "recall": 0.89
  },
  "parameters": {
    "model_size": "7B",
    "quantization": "int8",
    "adapter_type": "qlora"
  },
  "created_at": "2025-08-01T14:30:00Z",
  "updated_at": "2025-08-01T14:30:00Z",
  "workflow_id": "wf_123456789",
  "deployments": [
    {
      "id": "dep_123456789",
      "endpoint_type": "vllm",
      "status": "active",
      "created_at": "2025-08-01T15:00:00Z"
    }
  ]
}
```

#### Deploy Model

```http
POST /models/{model_id}/deploy
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "endpoint_type": "vllm",
  "quantization": "int8",
  "instance_type": "g4dn.xlarge",
  "instance_count": 1,
  "auto_scaling": {
    "min_instances": 1,
    "max_instances": 3
  }
}
```

**Response**:

```json
{
  "id": "dep_123456789",
  "model_id": "model_123456789",
  "endpoint_type": "vllm",
  "endpoint_url": "https://inference.neuroweaver.auterity.com/v1/models/automotive-service-advisor",
  "status": "deploying",
  "created_at": "2025-08-01T15:00:00Z",
  "updated_at": "2025-08-01T15:00:00Z",
  "estimated_completion": "2025-08-01T15:05:00Z"
}
```

### Datasets

#### List Datasets

```http
GET /datasets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "ds_123456789",
      "name": "Maintenance Procedures",
      "description": "Automotive maintenance and service procedures",
      "file_path": "./datasets/maintenance_procedures.jsonl",
      "file_type": "jsonl",
      "record_count": 2000,
      "created_at": "2025-07-01T10:00:00Z",
      "updated_at": "2025-07-01T10:00:00Z"
    },
    {
      "id": "ds_987654321",
      "name": "Vehicle Specifications",
      "description": "Vehicle specifications and technical details",
      "file_path": "./datasets/vehicle_specs.csv",
      "file_type": "csv",
      "record_count": 5000,
      "created_at": "2025-07-01T11:00:00Z",
      "updated_at": "2025-07-01T11:00:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

#### Upload Dataset

```http
POST /datasets/upload
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data

name: Maintenance Procedures
description: Automotive maintenance and service procedures
file: [binary data]
```

**Response**:

```json
{
  "id": "ds_123456789",
  "name": "Maintenance Procedures",
  "description": "Automotive maintenance and service procedures",
  "file_path": "./datasets/maintenance_procedures.jsonl",
  "file_type": "jsonl",
  "record_count": 2000,
  "created_at": "2025-08-01T10:00:00Z",
  "updated_at": "2025-08-01T10:00:00Z",
  "status": "processing"
}
```

#### Analyze Dataset

```http
POST /datasets/{dataset_id}/analyze
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "id": "ds_123456789",
  "analysis": {
    "record_count": 2000,
    "field_stats": {
      "procedure": {
        "type": "string",
        "unique_values": 150,
        "most_common": ["Oil Change", "Brake Pad Replacement", "Tire Rotation"]
      },
      "vehicle_type": {
        "type": "string",
        "unique_values": 8,
        "most_common": ["Passenger Car", "SUV", "Truck"]
      },
      "steps": {
        "type": "array",
        "avg_length": 7.5,
        "min_length": 3,
        "max_length": 15
      }
    },
    "quality_issues": {
      "missing_values": 23,
      "duplicates": 5,
      "outliers": 12
    },
    "recommendations": [
      "Remove 5 duplicate records",
      "Fill missing values in 'tools' field",
      "Consider balancing vehicle_type distribution"
    ]
  }
}
```

### Inference

#### Predict

```http
POST /inference/predict
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "model_id": "model_123456789",
  "prompt": "Vehicle: Toyota Camry 2022\nMileage: 35000\nLast Service: 2025-01-15\nLast Service Mileage: 30000\nCustomer Concern: Strange noise when braking\n\nWhat service recommendations would you provide?",
  "max_tokens": 500,
  "temperature": 0.7,
  "top_p": 0.95
}
```

**Response**:

```json
{
  "id": "pred_123456789",
  "model_id": "model_123456789",
  "output": "Based on the information provided, here are my service recommendations for your 2022 Toyota Camry with 35,000 miles:\n\n1. **Brake Inspection**: The strange noise during braking suggests potential brake issues. I recommend a complete brake system inspection, including:\n   - Brake pad thickness measurement\n   - Brake rotor condition assessment\n   - Inspection of brake calipers and hardware\n   - Check for proper lubrication of caliper pins and hardware\n\n2. **Regular Maintenance**: Since you're at 35,000 miles and your last service was at 30,000 miles, you're due for:\n   - Oil and filter change (synthetic oil recommended for your vehicle)\n   - Tire rotation\n   - Brake fluid check\n   - Air filter inspection\n\n3. **Multi-point Inspection**: A general inspection of other systems including:\n   - Battery health check\n   - Fluid levels check (coolant, power steering, transmission)\n   - Belt and hose inspection\n\nThe noise while braking is most likely due to worn brake pads or a glazed surface on the rotors. For a 2022 Camry at 35,000 miles, this would be somewhat early for complete brake replacement, but driving conditions can significantly affect brake wear. The inspection will determine if you need new brake pads, resurfacing of rotors, or just cleaning and lubrication of components.",
  "tokens_input": 52,
  "tokens_output": 245,
  "finish_reason": "stop",
  "latency_ms": 87,
  "created_at": "2025-08-01T16:00:00Z"
}
```

#### Batch Predict

```http
POST /inference/batch-predict
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "model_id": "model_123456789",
  "requests": [
    {
      "id": "req_1",
      "prompt": "Vehicle: Toyota Camry 2022\nMileage: 35000\nLast Service: 2025-01-15\nLast Service Mileage: 30000\nCustomer Concern: Strange noise when braking\n\nWhat service recommendations would you provide?"
    },
    {
      "id": "req_2",
      "prompt": "Vehicle: Honda Accord 2023\nMileage: 15000\nLast Service: 2025-03-01\nLast Service Mileage: 10000\nCustomer Concern: Check engine light is on\n\nWhat service recommendations would you provide?"
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}
```

**Response**:

```json
{
  "id": "batch_123456789",
  "results": [
    {
      "id": "req_1",
      "output": "Based on the information provided, here are my service recommendations for your 2022 Toyota Camry with 35,000 miles:\n\n1. **Brake Inspection**: The strange noise during braking suggests potential brake issues...",
      "tokens_input": 52,
      "tokens_output": 245,
      "finish_reason": "stop"
    },
    {
      "id": "req_2",
      "output": "Based on the information provided for your 2023 Honda Accord with 15,000 miles and an illuminated check engine light, here are my service recommendations:\n\n1. **Diagnostic Scan**: The first step is to perform a diagnostic scan to retrieve the specific error codes...",
      "tokens_input": 49,
      "tokens_output": 278,
      "finish_reason": "stop"
    }
  ],
  "total_tokens_input": 101,
  "total_tokens_output": 523,
  "avg_latency_ms": 92,
  "created_at": "2025-08-01T16:05:00Z"
}
```

### Monitoring

#### Get Metrics

```http
GET /monitoring/metrics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "cost": {
    "total": 123.45,
    "training": 45.67,
    "inference": 65.43,
    "storage": 12.35,
    "period": "month_to_date"
  },
  "performance": {
    "avg_latency_ms": 87.5,
    "p90_latency_ms": 120.3,
    "p99_latency_ms": 180.7,
    "throughput": 540.2,
    "success_rate": 0.998
  },
  "usage": {
    "total_requests": 15243,
    "total_tokens_input": 762150,
    "total_tokens_output": 3810750,
    "active_models": 5,
    "active_deployments": 8
  }
}
```

#### Get Drift Alerts

```http
GET /monitoring/drift-alerts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "alert_123456789",
      "model_id": "model_987654321",
      "model_name": "Automotive Sales Assistant",
      "severity": "high",
      "type": "data_drift",
      "description": "Input distribution has significantly changed over the past 24 hours",
      "detected_at": "2025-08-01T08:15:00Z",
      "metrics": {
        "drift_score": 0.82,
        "p_value": 0.001,
        "feature": "input_text"
      },
      "status": "open",
      "recommended_action": "Retrain model with recent data"
    },
    {
      "id": "alert_987654321",
      "model_id": "model_123456789",
      "model_name": "Automotive Service Advisor",
      "severity": "medium",
      "type": "performance_drift",
      "description": "Latency has increased by 15% over the past week",
      "detected_at": "2025-07-30T14:22:00Z",
      "metrics": {
        "drift_score": 0.65,
        "previous_latency": 75,
        "current_latency": 87
      },
      "status": "open",
      "recommended_action": "Consider scaling up instances or optimizing model"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

#### Get Optimization Recommendations

```http
GET /monitoring/optimization-recommendations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "opt_123456789",
      "model_id": "model_987654321",
      "model_name": "Automotive Sales Assistant",
      "type": "quantization",
      "description": "Current model is using INT8 quantization. Consider testing INT4 quantization for 25% cost reduction with minimal accuracy impact.",
      "estimated_savings": {
        "monthly": 108.0,
        "percentage": 25
      },
      "estimated_impact": {
        "latency": "+5%",
        "accuracy": "-0.5%"
      },
      "complexity": "medium",
      "status": "recommended"
    },
    {
      "id": "opt_987654321",
      "model_id": "model_123456789",
      "model_name": "Automotive Service Advisor",
      "type": "caching",
      "description": "Implement response caching for frequently asked questions to reduce inference costs.",
      "estimated_savings": {
        "monthly": 162.0,
        "percentage": 30
      },
      "estimated_impact": {
        "latency": "-40%",
        "throughput": "+25%"
      },
      "complexity": "low",
      "status": "recommended"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

### RelayCore Integration

#### Get RelayCore Data

```http
GET /integrations/relaycore/vehicles
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:

```json
{
  "data": [
    {
      "id": "veh_123456789",
      "vin": "1HGCM82633A123456",
      "make": "Toyota",
      "model": "Camry",
      "year": 2022,
      "trim": "XLE",
      "mileage": 35000,
      "last_service_date": "2025-01-15",
      "last_service_mileage": 30000,
      "customer_id": "cust_123456789"
    },
    {
      "id": "veh_987654321",
      "vin": "5FNRL6H72NB123456",
      "make": "Honda",
      "model": "Accord",
      "year": 2023,
      "trim": "Sport",
      "mileage": 15000,
      "last_service_date": "2025-03-01",
      "last_service_mileage": 10000,
      "customer_id": "cust_987654321"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

#### Send Maintenance Recommendations

```http
POST /integrations/relaycore/recommendations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "vin": "1HGCM82633A123456",
  "recommendations": [
    {
      "description": "Brake pad replacement recommended",
      "priority": "high",
      "details": {
        "current_mileage": 35000,
        "pad_thickness": "3mm",
        "minimum_thickness": "2mm"
      },
      "estimated_cost": 299.99,
      "due_date": "2025-08-08T00:00:00Z"
    },
    {
      "description": "Oil change recommended",
      "priority": "medium",
      "details": {
        "current_mileage": 35000,
        "last_service_mileage": 30000,
        "service_interval": 5000
      },
      "estimated_cost": 75.99,
      "due_date": "2025-08-15T00:00:00Z"
    }
  ]
}
```

**Response**:

```json
{
  "id": "rec_123456789",
  "vin": "1HGCM82633A123456",
  "recommendations_count": 2,
  "status": "sent",
  "created_at": "2025-08-01T16:30:00Z"
}
```

## Webhooks

NeuroWeaver can send webhook notifications for various events. To configure webhooks, use the following endpoint:

```http
POST /webhooks
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "url": "https://example.com/webhooks/neuroweaver",
  "events": [
    "workflow.completed",
    "model.deployed",
    "drift.detected"
  ],
  "secret": "whsec_123456789"
}
```

**Response**:

```json
{
  "id": "wh_123456789",
  "url": "https://example.com/webhooks/neuroweaver",
  "events": [
    "workflow.completed",
    "model.deployed",
    "drift.detected"
  ],
  "created_at": "2025-08-01T17:00:00Z",
  "updated_at": "2025-08-01T17:00:00Z"
}
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `workflow.created` | A new workflow has been created |
| `workflow.started` | A workflow has started running |
| `workflow.completed` | A workflow has completed successfully |
| `workflow.failed` | A workflow has failed |
| `model.created` | A new model has been created |
| `model.deployed` | A model has been deployed |
| `model.undeployed` | A model has been undeployed |
| `drift.detected` | Drift has been detected in a model |
| `optimization.recommended` | A new optimization recommendation has been generated |

### Webhook Payload

```json
{
  "id": "evt_123456789",
  "type": "workflow.completed",
  "created_at": "2025-08-01T14:30:00Z",
  "data": {
    "workflow_id": "wf_123456789",
    "name": "Automotive Service Advisor",
    "status": "completed",
    "metrics": {
      "accuracy": 0.92,
      "f1": 0.91
    },
    "output": {
      "model_id": "model_123456789"
    }
  }
}
```

## SDKs and Client Libraries

NeuroWeaver provides official client libraries for several programming languages:

- [Python SDK](https://github.com/tunedev/neuroweaver-python)
- [JavaScript SDK](https://github.com/tunedev/neuroweaver-js)
- [Java SDK](https://github.com/tunedev/neuroweaver-java)
- [Go SDK](https://github.com/tunedev/neuroweaver-go)

### Python Example

```python
import neuroweaver

# Initialize client
client = neuroweaver.Client(api_key="sk_neuroweaver_123456789")

# Create a workflow
workflow = client.workflows.create(
    name="Automotive Service Advisor",
    description="Fine-tuned model for automotive service department applications",
    workflow_type="fine-tuning",
    config={
        "task": "vertical-tune",
        "vertical": "automotive",
        "specialization": "service_advisor",
        "model": {
            "name": "mistral-7b",
            "revision": "v0.1"
        },
        "dataset": {
            "primary": "./datasets/maintenance_procedures.jsonl",
            "validation_split": 0.1
        },
        "fine_tuning": {
            "method": "QLoRA",
            "parameters": {
                "epochs": 3,
                "learning_rate": 2e-4
            }
        }
    }
)

# Start the workflow
client.workflows.start(workflow.id)

# Check workflow status
workflow_status = client.workflows.get(workflow.id)
print(f"Workflow status: {workflow_status.status}")

# Once workflow is completed, deploy the model
if workflow_status.status == "completed":
    deployment = client.models.deploy(
        workflow_status.output.model_id,
        endpoint_type="vllm",
        quantization="int8",
        instance_type="g4dn.xlarge",
        instance_count=1
    )
    print(f"Model deployed: {deployment.endpoint_url}")

# Make a prediction
prediction = client.inference.predict(
    model_id=workflow_status.output.model_id,
    prompt="Vehicle: Toyota Camry 2022\nMileage: 35000\nLast Service: 2025-01-15\nLast Service Mileage: 30000\nCustomer Concern: Strange noise when braking\n\nWhat service recommendations would you provide?",
    max_tokens=500
)
print(prediction.output)
```

## Conclusion

This API reference provides a comprehensive guide to interacting with the NeuroWeaver platform programmatically. For additional support or questions, please contact our support team at support@tunedev.ai.