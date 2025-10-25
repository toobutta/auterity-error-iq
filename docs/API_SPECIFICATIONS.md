

# API Specification

s

#

# Base UR

L

- Development: `http://localhost:8000

`

- Production: `https://api.auterity.com

`

#

# Authenticatio

n

All endpoints require JWT token in header: `Authorization: Bearer <token>`

#

## JWT Claim

s

- `sub`: user email (string

)

- `user_id`: UUID string of the use

r

- `tenant_id`: UUID string for multi-tenant scoping (optional for single-tenant

)

- `name`: user display nam

e

- `permissions`: array of permission strings like `autmatrix:read`, `relaycore:admin

`

- `type`: token type, one of `access`, `refresh`, `cross_system

`

- `target_system`: present when `type == cross_system` (e.g., `relaycore`

)

- `exp`: expiration timestamp (numeric

)

#

# Core Endpoint

s

#

## Workflow

s

- `POST /api/workflows

`

 - Create workflo

w

- `GET /api/workflows

`

 - List workflow

s

- `GET /api/workflows/{id}

`

 - Get workflo

w

- `PUT /api/workflows/{id}

`

 - Update workflo

w

- `DELETE /api/workflows/{id}

`

 - Delete workflo

w

- `POST /api/workflows/{id}/execute

`

 - Execute workflo

w

#

## Tasks (Async

)

- `POST /api/tasks/workflow/{id}

`

 - Queue workflow executio

n

- `GET /api/tasks/status/{task_id}

`

 - Get task statu

s

- `POST /api/tasks/ai/generate

`

 - Queue AI reques

t

#

## Template

s

- `GET /api/templates

`

 - List template

s

- `POST /api/templates

`

 - Create templat

e

- `GET /api/templates/{id}

`

 - Get templat

e

#

## Monitorin

g

- `GET /api/monitoring/health

`

 - System healt

h

- `GET /api/monitoring/metrics

`

 - System metric

s

- `GET /health

`

 - Basic health chec

k

#

# Response Forma

t

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2025-01-01T00:00:00Z"

}

```

#

# Error Forma

t

```

json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00Z"

}

```
