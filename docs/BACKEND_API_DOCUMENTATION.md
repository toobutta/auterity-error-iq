# Backend API Documentation

**Document Version**: 1.0
**Last Updated**: August 8, 2025
**Maintained By**: Backend Team

## Overview

The Auterity Unified Platform backend is built with FastAPI, providing high-performance REST APIs for workflow automation, authentication, template management, and AI service integration. The API follows RESTful principles with comprehensive OpenAPI documentation.

---

## Technology Stack

### Core Framework

- **FastAPI 0.104.1** - Modern Python web framework
- **Python 3.12** - Programming language runtime
- **Uvicorn 0.24.0** - ASGI server implementation
- **SQLAlchemy 2.0.23** - ORM for database operations
- **Alembic 1.12.1** - Database migration tool

### Security & Authentication

- **JWT (python-jose)** - JSON Web Token implementation
- **BCrypt (passlib)** - Password hashing
- **OAuth2** - Industry-standard authorization

### External Integrations

- **OpenAI 1.3.7** - GPT model integration
- **LiteLLM 1.10.1** - Multi-provider AI abstraction
- **Redis 5.0.1** - Caching and session storage

---

## API Architecture

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

---

## API Endpoints Overview

### Base URL

- **Development**: `http://localhost:8000`
- **Staging**: `https://staging-api.auterity.com`
- **Production**: `https://api.auterity.com`

### Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI Spec**: `/openapi.json`

---

## Authentication API

### Base Path: `/api/auth`

#### User Registration

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "company": "AutoDealer Inc."
}
```

**Response (201 Created)**:

```json
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

**Error Responses**:

- `400 Bad Request`: Email already registered
- `422 Unprocessable Entity`: Validation errors

#### User Login

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response (200 OK)**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Error Responses**:

- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Inactive user account

#### Get Current User

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
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

#### Token Refresh

```http
POST /api/auth/refresh
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
{
  "access_token": "new_jwt_token",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Cross-System Token

```http
POST /api/auth/cross-system-token
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
{
  "target_system": "relaycore",
  "permissions": ["ai:route", "metrics:read"]
}
```

**Response (200 OK)**:

```json
{
  "token": "cross_system_jwt_token",
  "expires_at": "2025-08-08T11:30:00Z",
  "permissions": ["ai:route", "metrics:read"]
}
```

---

## Workflow API

### Base Path: `/api/workflows`

#### Create Workflow

```http
POST /api/workflows
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
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

**Response (201 Created)**:

```json
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

#### List Workflows

```http
GET /api/workflows?page=1&page_size=10&is_active=true
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 10, max: 100)
- `is_active` (bool): Filter by active status
- `search` (string): Search in name and description

**Response (200 OK)**:

```json
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

#### Get Workflow

```http
GET /api/workflows/{workflow_id}
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
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

#### Execute Workflow

```http
POST /api/workflows/{workflow_id}/execute
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
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

**Response (202 Accepted)**:

```json
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

#### Get Execution Status

```http
GET /api/workflows/executions/{execution_id}
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
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

---

## Template API

### Base Path: `/api/templates`

#### List Templates

```http
GET /api/templates?category=sales&page=1&page_size=10
Authorization: Bearer <jwt_token>
```

**Query Parameters**:

- `category` (string): Filter by category (sales, service, marketing, etc.)
- `page` (int): Page number
- `page_size` (int): Items per page

**Response (200 OK)**:

```json
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

#### Get Template

```http
GET /api/templates/{template_id}
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
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

#### Create Template

```http
POST /api/templates
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
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

**Response (201 Created)**:

```json
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

#### Instantiate Template

```http
POST /api/templates/{template_id}/instantiate
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:

```json
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

**Response (200 OK)**:

```json
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

---

## Monitoring API

### Base Path: `/api/monitoring`

#### System Health

```http
GET /api/monitoring/health
```

**Response (200 OK)**:

```json
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

#### System Metrics

```http
GET /api/monitoring/metrics
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:

```json
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

---

## WebSocket API

### Connection Endpoint

```
ws://localhost:8000/ws/{client_id}?token={jwt_token}
```

#### Real-time Updates

The WebSocket connection provides real-time updates for:

- Workflow execution status changes
- System health alerts
- Error notifications
- Metrics updates

**Message Format**:

```json
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

**Event Types**:

- `workflow_execution_update`: Workflow execution status changes
- `system_alert`: System health alerts
- `error_notification`: Error notifications
- `metrics_update`: Real-time metrics updates

---

## Error Handling

### Standard Error Response Format

```json
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

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

### Error Categories

- **Authentication Errors**: Invalid credentials, expired tokens
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid input data
- **Business Logic Errors**: Workflow execution failures
- **System Errors**: Database connection, external service failures

---

## Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1691505600
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint

- **Authentication**: 10 requests/minute per IP
- **Workflow Operations**: 100 requests/minute per user
- **Template Operations**: 50 requests/minute per user
- **Monitoring**: 200 requests/minute per user
- **AI Service Calls**: 20 requests/minute per user

---

## Security Considerations

### Authentication

- **JWT Tokens**: Bearer token authentication
- **Token Expiration**: 30 minutes default
- **Refresh Tokens**: Available for token renewal
- **Cross-system Tokens**: Limited scope and duration

### Input Validation

- **Request Validation**: Pydantic model validation
- **SQL Injection Prevention**: SQLAlchemy ORM usage
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: SameSite cookie settings

### API Security

- **HTTPS Only**: TLS encryption required
- **CORS Configuration**: Restricted origins
- **Rate Limiting**: Request throttling
- **Request ID Tracking**: Audit trail

---

## Database Schema

### Core Tables

- **users**: User account information
- **workflows**: Workflow definitions and metadata
- **workflow_executions**: Execution instances and status
- **templates**: Workflow templates
- **template_parameters**: Template parameter definitions
- **execution_logs**: Detailed execution logs
- **roles**: User roles for RBAC
- **permissions**: System permissions

### Relationships

```sql
-- Users can have multiple workflows
workflows.created_by -> users.id

-- Workflows can have multiple executions
workflow_executions.workflow_id -> workflows.id

-- Templates can be instantiated into workflows
workflows.template_id -> templates.id

-- Users can have multiple roles
user_roles.user_id -> users.id
user_roles.role_id -> roles.id
```

---

## Performance Optimization

### Database Optimization

- **Connection Pooling**: SQLAlchemy connection pool
- **Query Optimization**: Eager loading, indexing
- **Read Replicas**: Separate read/write connections
- **Query Caching**: Redis-based query result caching

### API Optimization

- **Response Caching**: Redis-based response caching
- **Pagination**: Limit large result sets
- **Field Selection**: Optional field filtering
- **Async Processing**: Background task execution

### Monitoring

- **Prometheus Metrics**: Request metrics collection
- **Performance Tracking**: Response time monitoring
- **Resource Monitoring**: CPU, memory, database metrics
- **Error Tracking**: Error rate and patterns

---

## Testing

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Database operation testing
- **Authentication Tests**: Security testing

### Test Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test module
pytest tests/test_workflows.py

# Run integration tests
pytest tests/integration/
```

### Test Database

- **SQLite In-Memory**: Fast test execution
- **Test Fixtures**: Reusable test data
- **Mock Services**: External service mocking
- **Test Coverage**: >80% code coverage target

---

This comprehensive API documentation provides developers with complete reference material for integrating with and extending the Auterity platform's backend services.
