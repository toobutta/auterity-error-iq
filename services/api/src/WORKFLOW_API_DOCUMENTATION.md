

# Workflow Management API Documentatio

n

#

# Overvie

w

The Workflow Management API provides CRUD operations for managing AI-powered workflows. All endpoints require authentication via JWT token

.

#

# Base UR

L

```
/api/workflows

```

#

# Authenticatio

n

All endpoints require a valid JWT token in the Authorization header:

```

Authorization: Bearer <jwt_token>

```

#

# Endpoint

s

#

##

 1. Create Workfl

o

w

**POST

* * `/api/workflows/

`

Creates a new workflow for the authenticated user.

**Request Body:

* *

```

json
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

**Response:

* * `201 Created

`

```

json
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

#

##

 2. List Workflo

w

s

**GET

* * `/api/workflows/

`

Retrieves a paginated list of workflows for the authenticated user.

**Query Parameters:

* *

- `page` (int, default: 1): Page numbe

r

- `page_size` (int, default: 10, max: 100): Number of workflows per pag

e

- `name_filter` (string, optional): Filter workflows by name (case-insensitive

)

- `is_active` (boolean, optional): Filter by active statu

s

**Response:

* * `200 OK

`

```

json
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

#

##

 3. Get Workflow by

I

D

**GET

* * `/api/workflows/{workflow_id}

`

Retrieves a specific workflow by its ID.

**Path Parameters:

* *

- `workflow_id` (UUID): The workflow I

D

**Response:

* * `200 OK

`

```

json
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

#

##

 4. Update Workfl

o

w

**PUT

* * `/api/workflows/{workflow_id}

`

Updates an existing workflow.

**Path Parameters:

* *

- `workflow_id` (UUID): The workflow I

D

**Request Body:

* *

```

json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "definition": { ... },
  "is_active": true
}

```

**Response:

* * `200 OK

`

```

json
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

#

##

 5. Delete Workfl

o

w

**DELETE

* * `/api/workflows/{workflow_id}

`

Soft deletes a workflow (sets `is_active` to `false`).

**Path Parameters:

* *

- `workflow_id` (UUID): The workflow I

D

**Response:

* * `204 No Content

`

#

##

 6. Duplicate Workfl

o

w

**POST

* * `/api/workflows/{workflow_id}/duplicate

`

Creates a copy of an existing workflow with a unique name.

**Path Parameters:

* *

- `workflow_id` (UUID): The workflow ID to duplicat

e

**Response:

* * `201 Created

`

```

json
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

#

# Error Response

s

#

## 400 Bad Reques

t

```

json
{
  "detail": "Workflow with name 'Customer Inquiry Workflow' already exists"
}

```

#

## 401 Unauthorize

d

```

json
{
  "detail": "Not authenticated"
}

```

#

## 404 Not Foun

d

```

json
{
  "detail": "Workflow not found"
}

```

#

## 422 Unprocessable Entit

y

```

json
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

#

# Workflow Definition Schem

a

The workflow definition must follow this structure:

```

json
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

#

## Validation Rule

s

1. **Name**: Required, non-empty, max 255 characters, unique per us

e

r

2. **Definition**: Must contain `nodes` and `edges` arra

y

s

3. **Nodes**: Each node must have `id` and `type` fiel

d

s

4. **Edges**: Each edge must have `source` and `target` fiel

d

s

5. **User Access**: Users can only access their own workflo

w

s

#

# Access Contro

l

- All endpoints require authenticatio

n

- Users can only access workflows they create

d

- Workflow operations are isolated per use

r

- Soft delete preserves data while hiding workflows from user acces

s
