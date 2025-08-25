# API Specifications

## Base URL

- Development: `http://localhost:8000`
- Production: `https://api.auterity.com`

## Authentication

All endpoints require JWT token in header: `Authorization: Bearer <token>`

## Core Endpoints

### Workflows

- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/execute` - Execute workflow

### Tasks (Async)

- `POST /api/tasks/workflow/{id}` - Queue workflow execution
- `GET /api/tasks/status/{task_id}` - Get task status
- `POST /api/tasks/ai/generate` - Queue AI request

### Templates

- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/{id}` - Get template

### Monitoring

- `GET /api/monitoring/health` - System health
- `GET /api/monitoring/metrics` - System metrics
- `GET /health` - Basic health check

## Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

## Error Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00Z"
}
```
