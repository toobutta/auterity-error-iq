# API Documentation Overview

## Base URL
```
Production: https://api.auterity.com
Development: http://localhost:8000
```

## Authentication
All API endpoints require JWT Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication API
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - User logout

### Workflow Management API
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/{id}` - Get workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow

### Workflow Execution API
- `POST /api/workflows/{id}/execute` - Execute workflow
- `GET /api/executions/{id}` - Get execution status
- `GET /api/executions/{id}/logs` - Get execution logs
- `POST /api/executions/{id}/cancel` - Cancel execution

### Template Management API
- `GET /api/templates` - List templates
- `GET /api/templates/{id}` - Get template
- `POST /api/templates` - Create template
- `PUT /api/templates/{id}` - Update template
- `DELETE /api/templates/{id}` - Delete template
- `POST /api/templates/{id}/instantiate` - Create workflow from template

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {...}
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user

## Pagination
List endpoints support pagination:
```
GET /api/workflows?page=1&limit=20
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```