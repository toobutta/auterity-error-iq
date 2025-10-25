

# Backend API Documentatio

n

**Document Version**: 1.

0
**Last Updated**: August 8, 202

5
**Maintained By**: Backend Tea

m

#

# Overvie

w

The Auterity Unified Platform backend is built with FastAPI, providing high-performance REST APIs for workflow automation, authentication, template management, and AI service integration. The API follows RESTful principles with comprehensive OpenAPI documentation

.

--

- #

# Technology Stac

k

#

## Core Framewor

k

- **FastAPI 0.104.

1

* *

- Modern Python web framewor

k

- **Python 3.1

2

* *

- Programming language runtim

e

- **Uvicorn 0.24.

0

* *

- ASGI server implementatio

n

- **SQLAlchemy 2.0.2

3

* *

- ORM for database operation

s

- **Alembic 1.12.

1

* *

- Database migration too

l

#

## Security & Authenticatio

n

- **JWT (python-jose)

* *

- JSON Web Token implementatio

n

- **BCrypt (passlib)

* *

- Password hashin

g

- **OAuth2

* *

- Industry-standard authorizatio

n

#

## External Integration

s

- **OpenAI 1.3.

7

* *

- GPT model integratio

n

- **LiteLLM 1.10.

1

* *

- Multi-provider AI abstractio

n

- **Redis 5.0.

1

* *

- Caching and session storag

e

--

- #

# API Architectur

e

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application                          │
├─────────────────────────────────────────────────────────────────────┤
│  Middleware Layer                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │      CORS       │ │   Rate Limit    │ │   Error Handler │      │
│  │   Middleware    │ │   Middleware    │ │   Middleware    │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  API Router Layer                                                   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   /api/auth     │ │ /api/workflows  │ │ /api/templates  │      │
│  │ Authentication  │ │   Workflow      │ │   Template      │      │
│  │    Endpoints    │ │   Management    │ │   Management    │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │  /api/logs      │ │ /api/monitoring │ │   WebSocket     │      │
│  │   Execution     │ │     System      │ │   Real-time     │      │

│  │   Logging       │ │    Metrics      │ │   Updates       │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Service Layer                                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │ Authentication  │ │ Workflow Engine │ │ Template Engine │      │
│  │    Service      │ │    Service      │ │    Service      │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Data Layer                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   PostgreSQL    │ │     Redis       │ │   SQLAlchemy    │      │
│  │   Database      │ │     Cache       │ │      ORM        │      │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘

```

--

- #

# API Endpoints Overvie

w

#

## Base UR

L

- **Development**: `http://localhost:8000

`

- **Staging**: `https://staging-api.auterity.com

`

- **Production**: `https://api.auterity.com

`

#

## Documentatio

n

- **Swagger UI**: `/docs

`

- **ReDoc**: `/redoc

`

- **OpenAPI Spec**: `/openapi.json

`

--

- #

# Authentication AP

I

#

## Base Path: `/api/auth

`

#

### User Registratio

n

```

http
POST /api/auth/register
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "company": "AutoDealer Inc."
}

```

**Response (201 Created)**

:

```

json
{
  "id": "uuid-string",

  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company": "AutoDealer Inc.",
  "is_active": true,
  "created_at": "2025-08-08T10:30:00Z",

  "roles": ["user"]
}

```

**Error Responses**

:

- `400 Bad Request`: Email already registere

d

- `422 Unprocessable Entity`: Validation error

s

#

### User Logi

n

```

http
POST /api/auth/login
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "email": "user@example.com",
  "password": "secure_password"
}

```

**Response (200 OK)**

:

```

json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",

  "token_type": "bearer",
  "expires_in": 1800
}

```

**Error Responses**

:

- `401 Unauthorized`: Invalid credential

s

- `400 Bad Request`: Inactive user accoun

t

#

### Get Current Use

r

```

http
GET /api/auth/me
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "id": "uuid-string",

  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "company": "AutoDealer Inc.",
  "is_active": true,
  "roles": ["user", "admin"],
  "permissions": ["workflow:read", "workflow:create"]
}

```

#

### Token Refres

h

```

http
POST /api/auth/refresh
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer",
  "expires_in": 1800
}

```

#

### Cross-System Tok

e

n

```

http
POST /api/auth/cross-system-token

Authorization: Bearer <jwt_token>
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "target_system": "relaycore",
  "permissions": ["ai:route", "metrics:read"]
}

```

**Response (200 OK)**

:

```

json
{
  "token": "cross_system_jwt_token",
  "expires_at": "2025-08-08T11:30:00Z",

  "permissions": ["ai:route", "metrics:read"]
}

```

--

- #

# Workflow AP

I

#

## Base Path: `/api/workflows

`

#

### Create Workflo

w

```

http
POST /api/workflows
Authorization: Bearer <jwt_token>
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "name": "Customer Follow-up Workflow",

  "description": "Automated customer follow-up process",

  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "data": {
          "label": "Start Process"
        },
        "position": { "x": 100, "y": 100 }
      },
      {
        "id": "send_email",
        "type": "email",
        "data": {
          "label": "Send Follow-up Email",

          "to": "{{customer_email}}",
          "template": "follow_up_template"
        },
        "position": { "x": 300, "y": 100 }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "start",
        "target": "send_email"
      }
    ]
  },
  "is_active": true
}

```

**Response (201 Created)**

:

```

json
{
  "id": "workflow-uuid",

  "name": "Customer Follow-up Workflow",

  "description": "Automated customer follow-up process",

  "definition": { "nodes": [...], "edges": [...] },
  "is_active": true,
  "created_at": "2025-08-08T10:30:00Z",

  "updated_at": "2025-08-08T10:30:00Z",

  "created_by": "user-uuid"

}

```

#

### List Workflow

s

```

http
GET /api/workflows?page=1&page_size=10&is_active=true
Authorization: Bearer <jwt_token>

```

**Query Parameters**

:

- `page` (int): Page number (default: 1

)

- `page_size` (int): Items per page (default: 10, max: 100

)

- `is_active` (bool): Filter by active statu

s

- `search` (string): Search in name and descriptio

n

**Response (200 OK)**

:

```

json
{
  "workflows": [
    {
      "id": "workflow-uuid",

      "name": "Customer Follow-up Workflow",

      "description": "Automated customer follow-up process",

      "is_active": true,
      "created_at": "2025-08-08T10:30:00Z",

      "execution_count": 42,
      "last_execution": "2025-08-08T09:15:00Z"

    }
  ],
  "total": 25,
  "page": 1,
  "page_size": 10,
  "total_pages": 3
}

```

#

### Get Workflo

w

```

http
GET /api/workflows/{workflow_id}
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "id": "workflow-uuid",

  "name": "Customer Follow-up Workflow",

  "description": "Automated customer follow-up process",

  "definition": {
    "nodes": [...],
    "edges": [...]
  },
  "is_active": true,
  "created_at": "2025-08-08T10:30:00Z",

  "updated_at": "2025-08-08T10:30:00Z",

  "created_by": "user-uuid",

  "execution_stats": {
    "total_executions": 42,
    "successful_executions": 38,
    "failed_executions": 4,
    "average_duration": 45.2

  }
}

```

#

### Execute Workflo

w

```

http
POST /api/workflows/{workflow_id}/execute
Authorization: Bearer <jwt_token>
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "input_data": {
    "customer_email": "customer@example.com",
    "customer_name": "Jane Smith",
    "deal_amount": 25000
  },
  "execution_mode": "async",
  "webhook_url": "https://your-app.com/webhook"

}

```

**Response (202 Accepted)**

:

```

json
{
  "execution_id": "execution-uuid",

  "workflow_id": "workflow-uuid",

  "status": "running",
  "started_at": "2025-08-08T11:00:00Z",

  "input_data": {
    "customer_email": "customer@example.com",
    "customer_name": "Jane Smith",
    "deal_amount": 25000
  }
}

```

#

### Get Execution Statu

s

```

http
GET /api/workflows/executions/{execution_id}
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "id": "execution-uuid",

  "workflow_id": "workflow-uuid",

  "status": "completed",
  "started_at": "2025-08-08T11:00:00Z",

  "completed_at": "2025-08-08T11:02:30Z",

  "duration": 150.5,

  "input_data": {...},
  "output_data": {
    "email_sent": true,
    "email_id": "email-uuid",

    "response_rate": 0.85

  },
  "steps": [
    {
      "step_id": "start",
      "status": "completed",
      "started_at": "2025-08-08T11:00:00Z",

      "completed_at": "2025-08-08T11:00:05Z"

    },
    {
      "step_id": "send_email",
      "status": "completed",
      "started_at": "2025-08-08T11:00:05Z",

      "completed_at": "2025-08-08T11:02:30Z",

      "output": {
        "email_sent": true,
        "email_id": "email-uuid"

      }
    }
  ]
}

```

--

- #

# Template AP

I

#

## Base Path: `/api/templates

`

#

### List Template

s

```

http
GET /api/templates?category=sales&page=1&page_size=10
Authorization: Bearer <jwt_token>

```

**Query Parameters**

:

- `category` (string): Filter by category (sales, service, marketing, etc.

)

- `page` (int): Page numbe

r

- `page_size` (int): Items per pag

e

**Response (200 OK)**

:

```

json
{
  "templates": [
    {
      "id": "template-uuid",

      "name": "Lead Qualification Template",
      "description": "Automated lead qualification workflow",
      "category": "sales",
      "is_active": true,
      "created_at": "2025-08-08T10:00:00Z",

      "usage_count": 15,
      "parameter_count": 3
    }
  ],
  "total": 8,
  "page": 1,
  "page_size": 10
}

```

#

### Get Templat

e

```

http
GET /api/templates/{template_id}
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "id": "template-uuid",

  "name": "Lead Qualification Template",
  "description": "Automated lead qualification workflow",
  "category": "sales",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "data": {
          "label": "Start: {{customer_name}}"
        }
      }
    ],
    "edges": []
  },
  "parameters": [
    {
      "name": "customer_name",
      "description": "Customer's full name",
      "parameter_type": "string",
      "is_required": true,
      "default_value": null
    },
    {
      "name": "budget_range",
      "description": "Customer's budget range",
      "parameter_type": "number",
      "is_required": false,
      "default_value": 20000
    }
  ],
  "is_active": true,
  "created_at": "2025-08-08T10:00:00Z"

}

```

#

### Create Templat

e

```

http
POST /api/templates
Authorization: Bearer <jwt_token>
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "name": "New Sales Template",
  "description": "Template for new sales workflow",
  "category": "sales",
  "definition": {
    "nodes": [...],
    "edges": [...]
  },
  "parameters": [
    {
      "name": "customer_email",
      "description": "Customer email address",
      "parameter_type": "email",
      "is_required": true
    }
  ]
}

```

**Response (201 Created)**

:

```

json
{
  "id": "new-template-uuid",

  "name": "New Sales Template",
  "description": "Template for new sales workflow",
  "category": "sales",
  "definition": {...},
  "parameters": [...],
  "is_active": true,
  "created_at": "2025-08-08T11:30:00Z"

}

```

#

### Instantiate Templat

e

```

http
POST /api/templates/{template_id}/instantiate
Authorization: Bearer <jwt_token>
Content-Type: application/jso

n

```

**Request Body**

:

```

json
{
  "name": "Customer ABC Follow-up",

  "description": "Follow-up workflow for Customer ABC",

  "parameter_values": {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "budget_range": 35000
  }
}

```

**Response (200 OK)**

:

```

json
{
  "id": "new-workflow-uuid",

  "name": "Customer ABC Follow-up",

  "description": "Follow-up workflow for Customer ABC",

  "definition": {
    "nodes": [
      {
        "id": "start",
        "data": {
          "label": "Start: John Doe"
        }
      }
    ]
  },
  "template_id": "template-uuid",

  "created_at": "2025-08-08T11:45:00Z"

}

```

--

- #

# Monitoring AP

I

#

## Base Path: `/api/monitoring

`

#

### System Healt

h

```

http
GET /api/monitoring/health

```

**Response (200 OK)**

:

```

json
{
  "status": "healthy",
  "timestamp": "2025-08-08T12:00:00Z",

  "version": "1.0.0",

  "environment": "production",
  "services": {
    "database": {
      "status": "healthy",
      "response_time": 12.5,

      "connections": {
        "active": 8,
        "idle": 2,
        "max": 20
      }
    },
    "redis": {
      "status": "healthy",
      "response_time": 3.2,

      "memory_usage": "45MB"
    },
    "ai_services": {
      "openai": {
        "status": "healthy",
        "response_time": 850.3

      },
      "anthropic": {
        "status": "healthy",
        "response_time": 720.1

      }
    }
  }
}

```

#

### System Metric

s

```

http
GET /api/monitoring/metrics
Authorization: Bearer <jwt_token>

```

**Response (200 OK)**

:

```

json
{
  "system": {
    "uptime": 86400,
    "cpu_usage": 45.2,

    "memory_usage": 67.8,

    "disk_usage": 23.1

  },
  "application": {
    "total_requests": 15420,
    "successful_requests": 14876,
    "failed_requests": 544,
    "average_response_time": 125.6,

    "requests_per_minute": 45.2

  },
  "workflows": {
    "total_executions": 1284,
    "successful_executions": 1201,
    "failed_executions": 83,
    "average_execution_time": 78.3,

    "executions_last_hour": 12
  },
  "ai_usage": {
    "total_requests": 856,
    "total_cost": 45.67,

    "tokens_used": 125420,
    "average_cost_per_request": 0.053

  }
}

```

--

- #

# WebSocket AP

I

#

## Connection Endpoin

t

```

ws://localhost:8000/ws/{client_id}?token={jwt_token}

```

#

### Real-time Updat

e

s

The WebSocket connection provides real-time updates for

:

- Workflow execution status change

s

- System health alert

s

- Error notification

s

- Metrics update

s

**Message Format**

:

```

json
{
  "type": "workflow_execution_update",
  "data": {
    "execution_id": "execution-uuid",

    "workflow_id": "workflow-uuid",

    "status": "running",
    "current_step": "send_email",
    "progress": 65
  },
  "timestamp": "2025-08-08T12:15:00Z"

}

```

**Event Types**

:

- `workflow_execution_update`: Workflow execution status change

s

- `system_alert`: System health alert

s

- `error_notification`: Error notification

s

- `metrics_update`: Real-time metrics update

s

--

- #

# Error Handlin

g

#

## Standard Error Response Forma

t

```

json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2025-08-08T12:00:00Z",

    "request_id": "req-uuid"

  }
}

```

#

## HTTP Status Code

s

- **200 OK**: Successful reques

t

- **201 Created**: Resource created successfull

y

- **202 Accepted**: Request accepted for processin

g

- **400 Bad Request**: Invalid request dat

a

- **401 Unauthorized**: Authentication require

d

- **403 Forbidden**: Insufficient permission

s

- **404 Not Found**: Resource not foun

d

- **422 Unprocessable Entity**: Validation error

s

- **429 Too Many Requests**: Rate limit exceede

d

- **500 Internal Server Error**: Server erro

r

- **503 Service Unavailable**: Service temporarily unavailabl

e

#

## Error Categorie

s

- **Authentication Errors**: Invalid credentials, expired token

s

- **Authorization Errors**: Insufficient permission

s

- **Validation Errors**: Invalid input dat

a

- **Business Logic Errors**: Workflow execution failure

s

- **System Errors**: Database connection, external service failure

s

--

- #

# Rate Limitin

g

#

## Rate Limit Header

s

```

X-RateLimit-Limit: 1000

X-RateLimit-Remaining: 999

X-RateLimit-Reset: 1691505600

X-RateLimit-Window: 360

0

```

#

## Rate Limits by Endpoin

t

- **Authentication**: 10 requests/minute per I

P

- **Workflow Operations**: 100 requests/minute per use

r

- **Template Operations**: 50 requests/minute per use

r

- **Monitoring**: 200 requests/minute per use

r

- **AI Service Calls**: 20 requests/minute per use

r

--

- #

# Security Consideration

s

#

## Authenticatio

n

- **JWT Tokens**: Bearer token authenticatio

n

- **Token Expiration**: 30 minutes defaul

t

- **Refresh Tokens**: Available for token renewa

l

- **Cross-system Tokens**: Limited scope and duratio

n

#

## Input Validatio

n

- **Request Validation**: Pydantic model validatio

n

- **SQL Injection Prevention**: SQLAlchemy ORM usag

e

- **XSS Prevention**: Input sanitizatio

n

- **CSRF Protection**: SameSite cookie setting

s

#

## API Securit

y

- **HTTPS Only**: TLS encryption require

d

- **CORS Configuration**: Restricted origin

s

- **Rate Limiting**: Request throttlin

g

- **Request ID Tracking**: Audit trai

l

--

- #

# Database Schem

a

#

## Core Table

s

- **users**: User account informatio

n

- **workflows**: Workflow definitions and metadat

a

- **workflow_executions**: Execution instances and statu

s

- **templates**: Workflow template

s

- **template_parameters**: Template parameter definition

s

- **execution_logs**: Detailed execution log

s

- **roles**: User roles for RBA

C

- **permissions**: System permission

s

#

## Relationship

s

```

sql
- - Users can have multiple workflows

workflows.created_by -> users.i

d

- - Workflows can have multiple executions

workflow_executions.workflow_id -> workflows.i

d

- - Templates can be instantiated into workflows

workflows.template_id -> templates.i

d

- - Users can have multiple roles

user_roles.user_id -> users.id

user_roles.role_id -> roles.i

d

```

--

- #

# Performance Optimizatio

n

#

## Database Optimizatio

n

- **Connection Pooling**: SQLAlchemy connection poo

l

- **Query Optimization**: Eager loading, indexin

g

- **Read Replicas**: Separate read/write connection

s

- **Query Caching**: Redis-based query result cachin

g

#

## API Optimizatio

n

- **Response Caching**: Redis-based response cachin

g

- **Pagination**: Limit large result set

s

- **Field Selection**: Optional field filterin

g

- **Async Processing**: Background task executio

n

#

## Monitorin

g

- **Prometheus Metrics**: Request metrics collectio

n

- **Performance Tracking**: Response time monitorin

g

- **Resource Monitoring**: CPU, memory, database metric

s

- **Error Tracking**: Error rate and pattern

s

--

- #

# Testin

g

#

## Test Categorie

s

- **Unit Tests**: Individual function testin

g

- **Integration Tests**: API endpoint testin

g

- **Database Tests**: Database operation testin

g

- **Authentication Tests**: Security testin

g

#

## Test Command

s

```

bash

# Run all tests

pytest

# Run with coverage

pytest --cov=app --cov-report=htm

l

# Run specific test module

pytest tests/test_workflows.py

# Run integration tests

pytest tests/integration/

```

#

## Test Databas

e

- **SQLite In-Memory**: Fast test executio

n

- **Test Fixtures**: Reusable test dat

a

- **Mock Services**: External service mockin

g

- **Test Coverage**: >80% code coverage targe

t

--

- This comprehensive API documentation provides developers with complete reference material for integrating with and extending the Auterity platform's backend services.
