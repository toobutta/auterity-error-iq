# Routing Policy Management API

*API Version: 1.0.0*
*Base URL: `/api/routing`*
*Authentication: Required (JWT Bearer Token)*

## Overview

The Routing Policy Management API provides comprehensive endpoints for configuring and managing intelligent AI service routing policies. This API enables users to create, update, and monitor routing rules that optimize AI service selection based on performance, cost, and user requirements.

## Authentication

All endpoints require authentication using JWT Bearer tokens:

```bash
Authorization: Bearer <your-jwt-token>
```

## Core Concepts

### Routing Policy
A routing policy defines rules for selecting AI service providers based on:
- User tier and permissions
- Service type requirements
- Performance and cost constraints
- Geographic preferences

### Provider Configuration
Provider configurations define available AI services with:
- Cost per token metrics
- Performance characteristics
- Capacity and health status
- Regional availability

---

## API Endpoints

### Policy Management

#### Create Routing Policy
**POST** `/api/routing/policies`

Creates a new routing policy with specified conditions and actions.

**Request Body:**
```json
{
  "name": "Enterprise High Priority",
  "description": "Optimized routing for enterprise users",
  "priority": 1,
  "conditions": {
    "user_tier": "enterprise",
    "performance_requirement": "high",
    "service_type": "chat"
  },
  "actions": {
    "primary_provider": "gpt-4-turbo",
    "fallback_providers": ["claude-3-opus", "gpt-4"],
    "cost_optimization": false,
    "caching_enabled": true,
    "timeout_ms": 30000,
    "retry_attempts": 2
  },
  "template": "enterprise-high-priority"
}
```

**Response (201):**
```json
{
  "id": "policy-uuid-123",
  "name": "Enterprise High Priority",
  "description": "Optimized routing for enterprise users",
  "priority": 1,
  "conditions": {...},
  "actions": {...},
  "status": "draft",
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z",
  "created_by": "user-uuid",
  "usage_stats": {
    "total_requests": 0,
    "total_cost": 0.0,
    "avg_response_time": 0.0,
    "success_rate": 0.0
  }
}
```

#### List Routing Policies
**GET** `/api/routing/policies`

Retrieves all routing policies with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `inactive`, `draft`)

**Response (200):**
```json
[
  {
    "id": "policy-uuid-123",
    "name": "Enterprise High Priority",
    "description": "Optimized routing for enterprise users",
    "priority": 1,
    "status": "active",
    "created_at": "2025-01-20T10:00:00Z",
    "usage_stats": {
      "total_requests": 1250,
      "avg_response_time": 2.3,
      "cost_savings": 15.5
    }
  }
]
```

#### Get Routing Policy
**GET** `/api/routing/policies/{policy_id}`

Retrieves a specific routing policy by ID.

**Response (200):** See Create Policy response format.

#### Update Routing Policy
**PUT** `/api/routing/policies/{policy_id}`

Updates an existing routing policy.

**Request Body:**
```json
{
  "name": "Updated Policy Name",
  "description": "Updated description",
  "priority": 2,
  "conditions": {
    "user_tier": "professional"
  },
  "actions": {
    "cost_optimization": true
  }
}
```

#### Delete Routing Policy
**DELETE** `/api/routing/policies/{policy_id}`

Deletes a routing policy.

**Response (200):**
```json
{
  "message": "Routing policy deleted successfully"
}
```

#### Activate/Deactivate Policy
**POST** `/api/routing/policies/{policy_id}/activate`
**POST** `/api/routing/policies/{policy_id}/deactivate`

Activates or deactivates a routing policy.

**Response (200):**
```json
{
  "message": "Routing policy activated successfully"
}
```

### Provider Management

#### List Providers
**GET** `/api/routing/providers`

Retrieves all configured AI providers.

**Response (200):**
```json
[
  {
    "id": "gpt-4-turbo",
    "name": "GPT-4 Turbo",
    "type": "openai",
    "cost_per_token": 0.03,
    "avg_response_time": 2.1,
    "capacity": 95,
    "status": "healthy",
    "region": "us-east",
    "api_key_configured": true
  }
]
```

#### Get Provider
**GET** `/api/routing/providers/{provider_id}`

Retrieves a specific provider configuration.

#### Update Provider Configuration
**PUT** `/api/routing/providers/{provider_id}`

Updates provider configuration settings.

**Request Body:**
```json
{
  "cost_per_token": 0.035,
  "avg_response_time": 2.5,
  "capacity": 90,
  "status": "degraded",
  "region": "us-west"
}
```

### Analytics and Monitoring

#### Get Routing Analytics
**GET** `/api/routing/analytics`

Retrieves routing performance analytics and metrics.

**Query Parameters:**
- `period` (optional): `daily`, `weekly`, `monthly` (default: `daily`)

**Response (200):**
```json
{
  "total_requests": 1250,
  "total_cost": 45.67,
  "avg_response_time": 2.3,
  "success_rate": 98.7,
  "provider_usage": {
    "gpt-4-turbo": 450,
    "claude-3-opus": 380,
    "gpt-3.5-turbo": 420
  },
  "cost_savings": 15.5,
  "period": "daily"
}
```

### Testing and Templates

#### Test Routing Policy
**POST** `/api/routing/test-policy`

Tests a routing policy with sample input data.

**Request Body:**
```json
{
  "policy_id": "policy-uuid-123",
  "test_input": {
    "user_tier": "enterprise",
    "service_type": "chat",
    "model_requirement": "high_performance"
  }
}
```

**Response (200):**
```json
{
  "policy_id": "policy-uuid-123",
  "selected_provider": "gpt-4-turbo",
  "evaluation_result": "success",
  "test_input": {...},
  "timestamp": "2025-01-20T10:00:00Z"
}
```

#### List Policy Templates
**GET** `/api/routing/templates`

Retrieves available routing policy templates.

**Response (200):**
```json
{
  "templates": [
    {
      "id": "enterprise-high-priority",
      "name": "Enterprise High Priority",
      "description": "Optimized routing for enterprise users with high performance requirements",
      "category": "enterprise"
    },
    {
      "id": "cost-optimized-standard",
      "name": "Cost Optimized Standard",
      "description": "Balance cost and performance for standard tier users",
      "category": "standard"
    }
  ]
}
```

---

## Data Models

### RoutingCondition
```typescript
interface RoutingCondition {
  user_tier?: "enterprise" | "professional" | "standard";
  service_type?: "chat" | "completion" | "embedding";
  model_type?: string;
  cost_threshold?: number;
  performance_requirement?: "high" | "medium" | "low";
  geographic_region?: string;
  time_window?: "business_hours" | "off_hours";
}
```

### RoutingAction
```typescript
interface RoutingAction {
  primary_provider: string;
  fallback_providers: string[];
  cost_optimization: boolean;
  caching_enabled: boolean;
  timeout_ms: number;
  retry_attempts: number;
  load_balancing: boolean;
}
```

### ProviderConfig
```typescript
interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  cost_per_token: number;
  avg_response_time: number;
  capacity: number;
  status: "healthy" | "degraded" | "unhealthy";
  region?: string;
  api_key_configured: boolean;
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "detail": "Error description message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (resource already exists)
- `500` - Internal Server Error

---

## Rate Limiting

- **Authenticated Requests**: 1000 requests per hour
- **Analytics Requests**: 100 requests per hour
- **Test Requests**: 50 requests per hour

---

## Usage Examples

### Creating a Policy from Template
```javascript
const response = await fetch('/api/routing/policies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template: 'enterprise-high-priority',
    name: 'Custom Enterprise Policy',
    conditions: {
      geographic_region: 'us-west'
    }
  })
});
```

### Testing a Policy
```javascript
const testResult = await fetch('/api/routing/test-policy', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    policy_id: 'policy-uuid-123',
    test_input: {
      user_tier: 'enterprise',
      service_type: 'chat'
    }
  })
});
```

---

## Implementation Notes

### Pre-Development Considerations
1. **Template System**: Supports policy creation from predefined templates
2. **Priority Evaluation**: Policies are evaluated in priority order (1 = highest)
3. **Fallback Logic**: Automatic failover to secondary providers on failure
4. **Cost Optimization**: Dynamic cost-based routing when enabled
5. **Caching**: Response caching to improve performance

### Integration Points
- **Workflow Engine**: Policy evaluation during step execution
- **AI Service Layer**: Provider selection and routing decisions
- **Monitoring System**: Performance metrics collection
- **Frontend**: Policy management interface

### Security Considerations
- All endpoints require authentication
- User isolation by tenant/workspace
- Input validation on all policy configurations
- Audit logging for policy changes

---

*This API provides the foundation for intelligent AI service routing and will be integrated into the Week 2 development cycle for Unified AI Service Integration.*
