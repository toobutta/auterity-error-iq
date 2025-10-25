

# Auterity Unified AI Platform

 - API Documentati

o

n

#

# 🎯 API Overvie

w

**Base URL**: `http://localhost:8080/api` (Development) | `https://api.auterity.com/api` (Production

)
**Version**: v

1
**Authentication**: JWT Bearer Toke

n
**Content Type**: `application/json

`
**Rate Limiting**: 1000 requests/minute per use

r

#

# 🚀 Service Architectur

e

The Auterity platform consists of multiple specialized services:

#

## **Core Services

* *

- **Main API

* * (`/api`): Primary REST API for application functionality (Port: 8000

)

- **Intelligent Router

* * (`/api/intelligent-router`): AI model routing and load balancing (Port: 8005

)

- **HumanLayer Service

* * (`/api/humanlayer`): Human-in-the-loop AI workflows (Port: 8006

)

- **MLflow Integration

* * (`/api/mlflow`): Machine learning lifecycle management (Port: 8007

)

- **WorkflowAdapter

* * (`/api/workflow-adapter`): Enterprise workflow orchestration (Port: 8008

)

- **n8n AI Enhancements

* * (`/api/n8n-ai`): AI-enhanced workflow platform (Port: 8009

)

- **Cost Optimization Engine

* * (`/api/cost-optimization`): AI-powered cost analysis (Port: 8010

)

- **LangGraph Service

* * (`/api/langgraph`): AI-powered workflow orchestration (Port: 8002

)

- **vLLM Service

* * (`/api/vllm`): High-throughput AI model serving (Port: 8001

)

- **RelayCore

* * (`/api/relaycore`): AI model routing and management (Port: 8001

)

- **CrewAI Service

* * (`/api/crewai`): Multi-agent collaborative systems (Port: 8003

)

- **NeuroWeaver

* * (`/api/neuroweaver`): Model specialization platform (Port: 8004

)

- **MCP Orchestrator

* * (`/api/mcp`): Model Context Protocol orchestrator (Port: 8005

)

- **Integration Layer

* * (`/api/integration`): Cross-system integration (Port: 8007

)

#

## **Service Endpoints

* *

| Service | Base URL | Purpose | Port |
|---------|----------|---------|------|

| **Main API

* * | `http://localhost:8000/api` | Core application functionality | 8000 |

| **Intelligent Router

* * | `http://localhost:8005` | AI model routing and load balancing | 8005 |

| **HumanLayer Service

* * | `http://localhost:8006` | Human-in-the-loop AI workflows | 8006 |

| **MLflow Integration

* * | `http://localhost:8007` | Machine learning lifecycle management | 8007 |

| **WorkflowAdapter

* * | `http://localhost:8008` | Enterprise workflow orchestration | 8008 |

| **n8n AI Enhancements

* * | `http://localhost:8009` | AI-enhanced workflow platform | 8009 |

| **Cost Optimization Engine

* * | `http://localhost:8010` | AI-powered cost analysis | 8010 |

| **LangGraph

* * | `http://localhost:8002` | AI workflow orchestration | 8002 |

| **vLLM

* * | `http://localhost:8001` | AI model inference | 8001 |

| **RelayCore

* * | `http://localhost:8001/api/relaycore` | AI model routing | 8001 |

| **CrewAI

* * | `http://localhost:8003` | Multi-agent collaboration | 8003 |

| **NeuroWeaver

* * | `http://localhost:8004` | Model specialization | 8004 |

| **MCP Orchestrator

* * | `http://localhost:8005` | Model context management | 8005 |

| **Integration Layer

* * | `http://localhost:8007` | Cross-system integration | 8007

|

#

## **AI Service Integration

* *

- **Intelligent Router**: Advanced AI model routing and load balancing with cost-performance optimizatio

n

- **HumanLayer**: Human-in-the-loop AI workflows with approval processes and audit trail

s

- **MLflow Integration**: Comprehensive machine learning lifecycle management and experiment trackin

g

- **WorkflowAdapter**: Enterprise-grade workflow orchestration with multi-tenant suppor

t

- **n8n AI Enhancements**: Intelligent workflow generation and AI-powered automatio

n

- **Cost Optimization Engine**: AI-powered cost analysis and cloud resource optimizatio

n

- **LangGraph**: Advanced workflow orchestration with AI-driven decision makin

g

- **vLLM**: GPU-accelerated AI model serving with intelligent cachin

g

- **CrewAI**: Multi-agent collaborative systems with hierarchical/democratic mode

s

- **NeuroWeaver**: Automotive domain specialization with fine-tuning pipeline

s

- **MCP Orchestrator**: Unified model context management across provider

s

- **Multi-Model Support**: OpenAI, Anthropic, Google AI, Azure AI, and custom model

s

#

# 🔐 Authenticatio

n

#

## **JWT Authentication Flo

w

* *

```bash

#

 1. Login to get access toke

n

curl -X POST http://localhost:8080/api/auth/login

\
  -H "Content-Type: application/json"

\
  -d '{"email": "user@example.com", "password": "password"}

'

# Response

{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",

  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",

  "token_type": "bearer",
  "expires_in": 1800
}

#

 2. Use token in subsequent request

s

curl -X GET http://localhost:8080/api/workflows

\
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..

.

"

```

#

## **Authentication Endpoint

s

* *

#

### `POST /api/auth/login

`

Authenticate user and return JWT tokens.

**Request Body:

* *

```

json
{
  "email": "user@example.com",
  "password": "password123"
}

```

**Response:

* *

```

json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",

  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",

  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  }
}

```

#

### `POST /api/auth/register

`

Register a new user account.

**Request Body:

* *

```

json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "user"
}

```

#

### `POST /api/auth/refresh

`

Refresh access token using refresh token.

**Request Body:

* *

```

json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

}

```

#

### `POST /api/auth/logout

`

Invalidate current session tokens.

#

# 🤖 AI Services API

s

#

## **CrewAI Service

* * (Port: 800

3

)

#

### `POST /api/crewai/agents`

Create and configure AI agents for collaborative tasks.

**Request Body:

* *

```

json
{
  "name": "Research Agent",
  "role": "Research Specialist",
  "goal": "Conduct comprehensive research on automotive trends",
  "backstory": "Expert in automotive industry analysis",
  "mode": "hierarchical",
  "manager_id": "agent-123"

}

```

**Response:

* *

```

json
{
  "agent_id": "crewai-agent-456",

  "status": "created",
  "capabilities": ["research", "analysis", "reporting"],
  "created_at": "2024-01-15T10:30:00Z"

}

```

#

### `POST /api/crewai/tasks`

Assign tasks to agent crews.

**Request Body:

* *

```

json
{
  "crew_id": "crew-789",

  "task_description": "Analyze Q4 automotive sales data",
  "expected_output": "Comprehensive sales analysis report",
  "context": "Focus on electric vehicle trends",
  "priority": "high"
}

```

#

## **NeuroWeaver Platform

* * (Port: 800

4

)

#

### `POST /api/neuroweaver/models/finetune`

Initiate model fine-tuning for automotive domain

.

**Request Body:

* *

```

json
{
  "base_model": "gpt-4",

  "domain": "automotive",
  "training_data": "s3://dataset/automotive-q4-2024",

  "specialization": "vehicle_diagnostics",
  "hyperparameters": {
    "learning_rate": 0.0001,

    "epochs": 10,
    "batch_size": 8
  }
}

```

**Response:

* *

```

json
{
  "job_id": "fine-tune-123",

  "status": "queued",
  "estimated_completion": "2024-01-16T14:00:00Z",

  "model_name": "automotive-diagnostics-v1"

}

```

#

### `GET /api/neuroweaver/models/{model_id}/performance`

Retrieve model performance metrics.

#

## **MCP Orchestrator

* * (Port: 800

5

)

#

### `POST /api/mcp/contexts`

Create a new model context session.

**Request Body:

* *

```

json
{
  "session_name": "Customer Support Session",
  "models": ["gpt-4", "claude-3", "gemini-pro"],

  "context_window": 4096,
  "fallback_strategy": "performance_based"
}

```

#

### `POST /api/mcp/infer`

Execute inference across multiple models with context management.

**Request Body:

* *

```

json
{
  "context_id": "ctx-456",

  "prompt": "Analyze this vehicle diagnostic report",
  "max_tokens": 1000,
  "temperature": 0.7

}

```

#

## **n8n AI Enhancements

* * (Port: 800

6

)

#

### `POST /api/n8n-ai/analyze

`

Analyze workflow for AI optimization opportunities.

**Request Body:

* *

```

json
{
  "workflow_json": "{...}",
  "analysis_type": "performance",
  "optimization_goals": ["efficiency", "cost", "reliability"]
}

```

**Response:

* *

```

json
{
  "workflow_id": "wf-789",

  "analysis_complete": true,
  "recommendations": [
    {
      "type": "node_optimization",
      "description": "Replace manual data processing with AI-powered node",

      "estimated_improvement": "35% faster execution"
    }
  ],
  "optimized_workflow": "{...}"
}

```

#

### `POST /api/n8n-ai/generate

`

Generate workflow from natural language description.

**Request Body:

* *

```

json
{
  "description": "Create a workflow that processes customer feedback, analyzes sentiment, and generates response recommendations",
  "domain": "customer_service",
  "complexity": "advanced"
}

```

#

## **Integration Layer

* * (Port: 800

7

)

#

### `POST /api/integration/authenticate`

Unified authentication across all services.

#

### `POST /api/integration/message`

Send cross-system messages via RabbitMQ

.

**Request Body:

* *

```

json
{
  "target_service": "crewai",
  "message_type": "task_assignment",
  "payload": {
    "task_id": "task-123",

    "agent_id": "agent-456",

    "priority": "high"
  },
  "routing_key": "crewai.tasks.high_priority"
}

```

#

# 🔄 Workflow Managemen

t

#

## **Workflow Endpoint

s

* *

#

### `GET /api/workflows

`

Retrieve all workflows for authenticated user.

**Query Parameters:

* *

- `page` (int): Page number (default: 1

)

- `limit` (int): Items per page (default: 20

)

- `status` (string): Filter by status (active, inactive, archived

)

- `category` (string): Filter by categor

y

**Response:

* *

```

json
{
  "workflows": [
    {
      "id": "workflow-uuid",

      "name": "Customer Onboarding",
      "description": "Automated customer onboarding workflow",
      "status": "active",
      "category": "automation",
      "steps": [
        {
          "id": "step-1",

          "type": "email",
          "name": "Welcome Email",
          "config": {
            "template": "welcome-template",

            "delay": 0
          }
        }
      ],
      "created_at": "2025-08-25T10:00:00Z",

      "updated_at": "2025-08-25T15:30:00Z",

      "created_by": "user-uuid"

    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "has_next": true
}

```

#

### `POST /api/workflows

`

Create a new workflow.

**Request Body:

* *

```

json
{
  "name": "New Workflow",
  "description": "Description of the workflow",
  "category": "automation",
  "steps": [
    {
      "type": "ai_prompt",
      "name": "Generate Response",
      "config": {
        "prompt": "Analyze the following customer feedback:",
        "model": "gpt-4",

        "max_tokens": 500
      },
      "position": { "x": 100, "y": 100 }
    },
    {
      "type": "email",
      "name": "Send Summary",
      "config": {
        "template": "summary-template",

        "to": "manager@company.com"
      },
      "position": { "x": 300, "y": 100 },
      "dependencies": ["step-1"]

    }
  ]
}

```

#

### `GET /api/workflows/{workflow_id}

`

Retrieve specific workflow by ID.

#

### `PUT /api/workflows/{workflow_id}

`

Update existing workflow.

#

### `DELETE /api/workflows/{workflow_id}

`

Delete workflow (soft delete).

#

## **Workflow Executio

n

* *

#

### `POST /api/workflows/{workflow_id}/execute

`

Execute a workflow with input data.

**Request Body:

* *

```

json
{
  "input_data": {
    "customer_email": "customer@example.com",
    "customer_name": "John Smith",
    "feedback": "Great service, but delivery was slow"
  },
  "priority": "normal",
  "scheduled_at": "2025-08-25T16:00:00Z"

}

```

**Response:

* *

```

json
{
  "execution_id": "execution-uuid",

  "workflow_id": "workflow-uuid",

  "status": "running",
  "started_at": "2025-08-25T15:45:00Z",

  "input_data": {
    "customer_email": "customer@example.com",
    "customer_name": "John Smith"
  },
  "progress": {
    "completed_steps": 0,
    "total_steps": 3,
    "current_step": "Generate Response"
  }
}

```

#

### `GET /api/executions/{execution_id}

`

Get execution status and results.

**Response:

* *

```

json
{
  "id": "execution-uuid",

  "workflow_id": "workflow-uuid",

  "status": "completed",
  "started_at": "2025-08-25T15:45:00Z",

  "completed_at": "2025-08-25T15:47:30Z",

  "duration": 150,
  "progress": {
    "completed_steps": 3,
    "total_steps": 3,
    "current_step": null
  },
  "results": {
    "step-1": {

      "status": "completed",
      "output": "Analysis shows positive sentiment with delivery concern",
      "tokens_used": 85,
      "cost": 0.0042

    },
    "step-2": {

      "status": "completed",
      "output": "Email sent successfully",
      "recipients": ["manager@company.com"]
    }
  },
  "logs": [
    {
      "timestamp": "2025-08-25T15:45:00Z",

      "level": "info",
      "message": "Workflow execution started"
    },
    {
      "timestamp": "2025-08-25T15:45:15Z",

      "level": "info",
      "message": "Step 'Generate Response' completed"
    }
  ]
}

```

#

### `POST /api/executions/{execution_id}/cancel

`

Cancel running execution.

#

# 📝 Template Managemen

t

#

## **Template Endpoint

s

* *

#

### `GET /api/templates

`

Retrieve available workflow templates.

**Query Parameters:

* *

- `category` (string): Filter by categor

y

- `featured` (boolean): Show only featured template

s

**Response:

* *

```

json
{
  "templates": [
    {
      "id": "template-uuid",

      "name": "Customer Support Automation",
      "description": "Automated customer support ticket processing",
      "category": "customer_service",
      "featured": true,
      "steps": [
        {
          "type": "ai_prompt",
          "name": "Categorize Ticket",
          "config": {
            "prompt": "Categorize this support ticket: {{ticket_content}}",
            "model": "gpt-3.5-turbo

"

          }
        }
      ],
      "preview_image": "/templates/customer-support.png",

      "usage_count": 1250,
      "rating": 4.8,

      "created_at": "2025-08-01T00:00:00Z"

    }
  ]
}

```

#

### `POST /api/templates/{template_id}/instantiate

`

Create workflow from template.

**Request Body:

* *

```

json
{
  "name": "My Customer Support Workflow",
  "customizations": {
    "step-1": {

      "config": {
        "model": "gpt-4"

      }
    }
  }
}

```

#

# 🤖 AI Services Integratio

n

#

## **LangGraph Service (AI Workflow Orchestration

)

* *

**Base URL**: `http://localhost:8002

`
**Purpose**: AI-powered workflow orchestration with intelligent decision makin

g

#

### `POST /workflows

`

Create a new AI-powered workflow

.

**Request Body:

* *

```

json
{
  "workflow_id": "ai-content-workflow",

  "name": "AI Content Generation Pipeline",
  "description": "Multi-step content creation with AI decision making",

  "nodes": [
    {
      "id": "research",
      "type": "llm",
      "config": {
        "prompt": "Research the topic: {{topic}}",
        "model": "gpt-4",

        "temperature": 0.3

      }
    },
    {
      "id": "generate",
      "type": "llm",
      "config": {
        "prompt": "Create content about: {{research}}",
        "model": "claude-3-sonnet-20240229"

      }
    }
  ],
  "edges": [
    {
      "source": "research",
      "target": "generate"
    }
  ]
}

```

#

### `POST /workflows/{workflow_id}/execute

`

Execute an AI-powered workflow

.

**Request Body:

* *

```

json
{
  "input": {
    "topic": "AI-powered workflow orchestration"

  }
}

```

**Response:

* *

```

json
{
  "execution_id": "exec-12345",

  "status": "completed",
  "result": {
    "research": "Research results...",
    "generated_content": "Generated content..."
  },
  "execution_time": 2.45,

  "execution_path": ["research", "generate"]
}

```

#

### `GET /metrics

`

Get LangGraph service performance metrics.

**Response:

* *

```

json
{
  "performance_metrics": {
    "total_workflows": 150,
    "active_workflows": 3,
    "completed_workflows": 145,
    "failed_workflows": 2,
    "average_execution_time": 2.34,

    "average_decision_time": 0.45

  },
  "node_type_usage": {
    "llm": 85,
    "condition": 12,
    "tool": 8,
    "integration": 5
  }
}

```

#

## **vLLM Service (High-Throughput AI Inference

)

* *

**Base URL**: `http://localhost:8001

`
**Purpose**: GPU-accelerated AI model serving with optimized performanc

e

#

### `POST /v1/generate

`

Generate text using high-performance AI models

.

**Request Body:

* *

```

json
{
  "prompt": "Explain quantum computing in simple terms",
  "temperature": 0.7,

  "max_tokens": 500,
  "top_p": 1.0,

  "stop_sequences": ["\\n\\n"],
  "model": "meta-llama/Llama-2-7b-chat-hf"

}

```

**Response:

* *

```

json
{
  "response": "Quantum computing uses quantum mechanics principles...",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 127,
    "total_tokens": 135
  },
  "performance": {
    "latency_ms": 245,
    "model": "meta-llama/Llama-2-7b-chat-hf",

    "timestamp": "2025-08-25T15:45:00Z"

  },
  "metadata": {
    "finish_reason": "length",
    "cached": false
  }
}

```

#

### `GET /v1/metrics

`

Get vLLM service performance and GPU metrics.

**Response:

* *

```

json
{
  "model_metrics": {
    "model_name": "meta-llama/Llama-2-7b-chat-hf",

    "requests_per_second": 45.2,

    "average_latency_ms": 245.3,

    "gpu_memory_used_gb": 12.4,

    "gpu_memory_total_gb": 16.0,

    "active_requests": 2,
    "queue_depth": 0,
    "cache_hit_rate": 0.23

  },
  "gpu_info": {
    "available": true,
    "device_count": 1,
    "devices": [
      {
        "id": 0,
        "name": "NVIDIA A100-SXM4-16GB",

        "total_memory_gb": 16.0,

        "allocated_memory_gb": 12.4,

        "utilization": 0.775

      }
    ]
  }
}

```

#

## **RelayCore (AI Routing

)

* *

#

### `POST /api/ai/route

`

Route AI request through intelligent routing system.

**Request Body:

* *

```

json
{
  "prompt": "Analyze this customer feedback for sentiment",
  "context": "customer_service",
  "max_tokens": 200,
  "temperature": 0.7,

  "routing_preferences": {
    "cost_optimization": true,
    "quality_preference": "balanced",
    "budget_limit": 0.5

  }
}

```

**Response:

* *

```

json
{
  "response": "The customer feedback shows positive sentiment overall...",
  "model_used": "gpt-3.5-turbo"

,

  "provider": "openai",
  "cost": 0.024,

  "tokens_used": 156,
  "routing_reason": "cost_optimized",
  "response_time": 850,
  "quality_score": 0.89

}

```

#

### `GET /api/ai/models

`

Get available AI models and pricing.

**Response:

* *

```

json
{
  "models": [
    {
      "id": "gpt-4",

      "provider": "openai",
      "cost_per_token": 0.00003,

      "max_tokens": 8192,
      "capabilities": ["text", "reasoning", "code"],
      "quality_score": 0.95,

      "avg_response_time": 2500
    },
    {
      "id": "gpt-3.5-turbo"

,

      "provider": "openai",
      "cost_per_token": 0.000002,

      "max_tokens": 4096,
      "capabilities": ["text", "basic_reasoning"],
      "quality_score": 0.85,

      "avg_response_time": 800
    }
  ]
}

```

#

## **RelayCore AI Router (Model Management

)

* *

#

### `GET /api/models/available

`

Get available AI models across all providers.

**Response:

* *

```

json
{
  "models": [
    {
      "id": "gpt-4",

      "provider": "openai",
      "name": "GPT-4",

      "context_window": 8192,
      "cost_per_token": 0.00003,

      "status": "available"
    },
    {
      "id": "claude-3-sonnet",

      "provider": "anthropic",
      "name": "Claude 3 Sonnet",
      "context_window": 200000,
      "cost_per_token": 0.000015,

      "status": "available"
    }
  ]
}

```

#

### `POST /api/models/route

`

Route a request to the optimal AI model based on performance and cost.

**Request Body:

* *

```

json
{
  "prompt": "Analyze this customer feedback...",
  "task_type": "analysis",
  "max_tokens": 1000,
  "priority": "cost", // "cost", "performance", "balanced"
  "providers": ["openai", "anthropic", "google"]
}

```

**Response:

* *

```

json
{
  "model": "claude-3-sonnet",

  "provider": "anthropic",
  "estimated_cost": 0.0015,

  "estimated_tokens": 500,
  "confidence_score": 0.92

}

```

#

# 📊 Analytics & Monitorin

g

#

## **Analytics Endpoint

s

* *

#

### `GET /api/analytics/dashboard

`

Get dashboard analytics data.

**Response:

* *

```

json
{
  "overview": {
    "total_workflows": 156,
    "active_executions": 12,
    "total_executions_today": 89,
    "success_rate": 97.8,

    "avg_execution_time": 45.6

  },
  "usage_stats": {
    "ai_requests_today": 234,
    "total_cost_today": 12.45,

    "tokens_consumed": 45678,
    "most_used_model": "gpt-3.5-turbo

"

  },
  "performance_metrics": {
    "avg_response_time": 850,
    "error_rate": 0.02,

    "uptime": 99.9

  }
}

```

#

### `GET /api/analytics/workflows/{workflow_id}/metrics

`

Get detailed metrics for specific workflow.

#

### `GET /api/analytics/costs

`

Get cost breakdown and budget tracking.

**Response:

* *

```

json
{
  "current_month": {
    "total_spent": 245.67,

    "budget_limit": 500.0,

    "budget_used_percentage": 49.13,

    "projected_monthly_cost": 492.34

  },
  "cost_breakdown": {
    "openai_gpt4": 156.23,

    "openai_gpt35": 45.67,

    "anthropic_claude": 34.89,

    "custom_models": 8.88

  },
  "daily_usage": [
    {
      "date": "2025-08-25",

      "cost": 12.45,

      "requests": 234
    }
  ]
}

```

#

# 🔔 Real-time Updates (WebSocke

t

)

#

## **WebSocket Connectio

n

* *

```

javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws/executions');

// Listen for execution updates
ws.onmessage = function(event) {
  const update = JSON.parse(event.data);
  console.log('Execution update:', update);
};

// Example update message
{
  "type": "execution_update",
  "execution_id": "execution-uuid",

  "status": "step_completed",
  "step_name": "Generate Response",
  "progress": {
    "completed_steps": 2,
    "total_steps": 3
  },
  "timestamp": "2025-08-25T15:46:30Z"

}

```

#

## **WebSocket Event

s

* *

- `execution_started`: Workflow execution bega

n

- `step_completed`: Individual step finishe

d

- `execution_completed`: Workflow finished successfull

y

- `execution_failed`: Workflow failed with erro

r

- `execution_cancelled`: Workflow was cancelle

d

#

# 🚨 Error Handlin

g

#

## **Standard Error Respons

e

* *

```

json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid workflow configuration",
    "details": {
      "field": "steps[0].config.prompt",
      "issue": "Prompt cannot be empty"
    },
    "timestamp": "2025-08-25T15:30:00Z",

    "request_id": "req-uuid"

  }
}

```

#

## **Error Code

s

* *

| Code               | Description                       | HTTP Status |
| ----------------

- - | -------------------------------

- - | ---------

- - |

| `UNAUTHORIZED`     | Invalid or missing authentication | 401         |
| `FORBIDDEN`        | Insufficient permissions          | 403         |
| `NOT_FOUND`        | Resource not found                | 404         |
| `VALIDATION_ERROR` | Request validation failed         | 422         |
| `RATE_LIMITED`     | Too many requests                 | 429         |
| `INTERNAL_ERROR`   | Server error                      | 500         |
| `AI_SERVICE_ERROR` | AI provider error                 | 502         |
| `WORKFLOW_ERROR`   | Workflow execution error          | 400         |

#

# 📋 Request/Response Example

s

#

## **Complete Workflow Creation Exampl

e

* *

```

bash

# Create a customer onboarding workflow

curl -X POST http://localhost:8080/api/workflows

\
  -H "Authorization: Bearer your-jwt-token"

\
  -H "Content-Type: application/json"

\
  -d '{

    "name": "Customer Onboarding Automation",
    "description": "Automated workflow for new customer onboarding",
    "category": "customer_service",
    "steps": [
      {
        "id": "welcome-email",

        "type": "email",
        "name": "Send Welcome Email",
        "config": {
          "template": "welcome-template",

          "to": "{{customer_email}}",
          "subject": "Welcome to Auterity!"
        },
        "position": {"x": 100, "y": 100}
      },
      {
        "id": "setup-account",

        "type": "api_call",
        "name": "Setup Customer Account",
        "config": {
          "url": "https://api.crm.com/customers",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer crm-token"

          },
          "body": {
            "email": "{{customer_email}}",
            "name": "{{customer_name}}",
            "source": "auterity_onboarding"
          }
        },
        "position": {"x": 300, "y": 100},
        "dependencies": ["welcome-email"]

      },
      {
        "id": "ai-personalization",

        "type": "ai_prompt",
        "name": "Generate Personalized Content",
        "config": {
          "prompt": "Create personalized content for {{customer_name}} based on their industry: {{customer_industry}}",
          "model": "gpt-4",

          "max_tokens": 300
        },
        "position": {"x": 500, "y": 100},
        "dependencies": ["setup-account"]

      }
    ]
  }'

```

#

## **Execute Workflow Exampl

e

* *

```

bash

# Execute the workflow with customer data

curl -X POST http://localhost:8080/api/workflows/workflow-uuid/execute

\
  -H "Authorization: Bearer your-jwt-token"

\
  -H "Content-Type: application/json"

\
  -d '{

    "input_data": {
      "customer_email": "john.doe@example.com",
      "customer_name": "John Doe",
      "customer_industry": "Technology"
    },
    "priority": "high"
  }'

```

#

# 🔍 Testing & Developmen

t

#

## **Health Check Endpoint

s

* *

```

bash

# System health

curl http://localhost:8080/api/health

# Detailed health with dependencies

curl http://localhost:8080/api/health/detailed

# Service readiness

curl http://localhost:8080/api/ready

```

#

## **Development Tool

s

* *

- **OpenAPI Documentation**: http://localhost:8080/doc

s

- **Interactive API Explorer**: http://localhost:8080/redo

c

- **Postman Collection**: Available in `/docs/api/auterity-api.postman_collection.json

`

#

# 📚 SDK & Client Librarie

s

#

## **Python SD

K

* *

```

python
from auterity_sdk import AuterityClient

# Initialize client

client = AuterityClient(
    base_url="http://localhost:8080",
    api_key="your-api-key"

)

# Create workflow

workflow = client.workflows.create({
    "name": "Test Workflow",
    "steps": [...]
})

# Execute workflow

execution = client.workflows.execute(
    workflow.id,
    input_data={"key": "value"}
)

# Monitor execution

status = client.executions.get_status(execution.id)

```

#

## **JavaScript SD

K

* *

```

javascript
import { AuteritySDK } from '@auterity/sdk';

const client = new AuteritySDK({
  baseUrl: 'http://localhost:8080',
  apiKey: 'your-api-key'

});

// Create and execute workflow
const workflow = await client.workflows.create({
  name: 'Test Workflow',
  steps: [...]
});

const execution = await client.workflows.execute(workflow.id, {
  inputData: { key: 'value' }
});

// Stream execution updates
const stream = client.executions.stream(execution.id);
stream.onUpdate((update) => {
  console.log('Execution progress:', update);
});

```

--

- **Last Updated**: August 25, 202

5
**API Version**: v

1
**Documentation Version**: 1.0

.

0
