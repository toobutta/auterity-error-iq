# Workflow Management API Documentation

## Overview

The Workflow Management API provides CRUD operations for managing AI-powered workflows. All endpoints require authentication via JWT token.

## Base URL

```
/api/workflows
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Workflow

**POST** `/api/workflows/`

Creates a new workflow for the authenticated user.

**Request Body:**

```json
{
  "name": "Customer Inquiry Workflow",
  "description": "Handles customer inquiries using AI",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "data": { "label": "Start" }
      },
      {
        "id": "ai_process",
        "type": "ai_process",
        "data": { "label": "AI Process", "prompt": "Process customer inquiry" }
      },
      {
        "id": "end",
        "type": "end",
        "data": { "label": "End" }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "ai_process" },
      { "id": "e2", "source": "ai_process", "target": "end" }
    ]
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Customer Inquiry Workflow",
  "description": "Handles customer inquiries using AI",
  "user_id": "456e7890-e89b-12d3-a456-426614174001",
  "definition": { ... },
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. List Workflows

**GET** `/api/workflows/`

Retrieves a paginated list of workflows for the authenticated user.

**Query Parameters:**

- `page` (int, default: 1): Page number
- `page_size` (int, default: 10, max: 100): Number of workflows per page
- `name_filter` (string, optional): Filter workflows by name (case-insensitive)
- `is_active` (boolean, optional): Filter by active status

**Response:** `200 OK`

```json
{
  "workflows": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Customer Inquiry Workflow",
      "description": "Handles customer inquiries using AI",
      "user_id": "456e7890-e89b-12d3-a456-426614174001",
      "definition": { ... },
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10
}
```

### 3. Get Workflow by ID

**GET** `/api/workflows/{workflow_id}`

Retrieves a specific workflow by its ID.

**Path Parameters:**

- `workflow_id` (UUID): The workflow ID

**Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Customer Inquiry Workflow",
  "description": "Handles customer inquiries using AI",
  "user_id": "456e7890-e89b-12d3-a456-426614174001",
  "definition": { ... },
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 4. Update Workflow

**PUT** `/api/workflows/{workflow_id}`

Updates an existing workflow.

**Path Parameters:**

- `workflow_id` (UUID): The workflow ID

**Request Body:**

```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "definition": { ... },
  "is_active": true
}
```

**Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "user_id": "456e7890-e89b-12d3-a456-426614174001",
  "definition": { ... },
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z"
}
```

### 5. Delete Workflow

**DELETE** `/api/workflows/{workflow_id}`

Soft deletes a workflow (sets `is_active` to `false`).

**Path Parameters:**

- `workflow_id` (UUID): The workflow ID

**Response:** `204 No Content`

### 6. Duplicate Workflow

**POST** `/api/workflows/{workflow_id}/duplicate`

Creates a copy of an existing workflow with a unique name.

**Path Parameters:**

- `workflow_id` (UUID): The workflow ID to duplicate

**Response:** `201 Created`

```json
{
  "id": "789e0123-e89b-12d3-a456-426614174002",
  "name": "Customer Inquiry Workflow (Copy)",
  "description": "Copy of Customer Inquiry Workflow",
  "user_id": "456e7890-e89b-12d3-a456-426614174001",
  "definition": { ... },
  "is_active": true,
  "created_at": "2024-01-15T12:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Workflow with name 'Customer Inquiry Workflow' already exists"
}
```

### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found

```json
{
  "detail": "Workflow not found"
}
```

### 422 Unprocessable Entity

```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "Workflow name cannot be empty",
      "type": "value_error"
    }
  ]
}
```

## Workflow Definition Schema

The workflow definition must follow this structure:

```json
{
  "nodes": [
    {
      "id": "unique_node_id",
      "type": "node_type",
      "data": { ... }
    }
  ],
  "edges": [
    {
      "id": "unique_edge_id",
      "source": "source_node_id",
      "target": "target_node_id"
    }
  ]
}
```

### Validation Rules

1. **Name**: Required, non-empty, max 255 characters, unique per user
2. **Definition**: Must contain `nodes` and `edges` arrays
3. **Nodes**: Each node must have `id` and `type` fields
4. **Edges**: Each edge must have `source` and `target` fields
5. **User Access**: Users can only access their own workflows

## Access Control

- All endpoints require authentication
- Users can only access workflows they created
- Workflow operations are isolated per user
- Soft delete preserves data while hiding workflows from user access
