# RelayCore API Documentation

This document provides comprehensive documentation for the RelayCore API, which serves as a universal HTTP relay service connecting external tools to AI model endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [AI Providers](#ai-providers)
  - [Configuration](#configuration)
  - [Analytics](#analytics)
  - [Cache Management](#cache-management)
  - [Batch Processing](#batch-processing)
- [Webhooks](#webhooks)
- [SDK Integration](#sdk-integration)
- [Examples](#examples)

## Authentication

RelayCore API uses two authentication methods:

### API Key Authentication

For most API calls, use an API key in the request header:

```
X-API-Key: your_api_key_here
```

API keys can be generated and managed through the RelayCore dashboard.

### JWT Authentication

For dashboard and administrative operations, use JWT authentication:

```
Authorization: Bearer your_jwt_token_here
```

JWT tokens are obtained through the authentication endpoints.

## Base URL

All API endpoints are relative to the base URL:

```
https://api.relaycore.ai/v1
```

For self-hosted instances, replace with your instance URL.

## Request Format

Most API endpoints accept JSON-formatted request bodies:

```json
{
  "property1": "value1",
  "property2": "value2"
}
```

Content-Type should be set to `application/json`.

## Response Format

All API responses are returned in JSON format:

```json
{
  "status": "success",
  "data": {
    "property1": "value1",
    "property2": "value2"
  }
}
```

Error responses follow this format:

```json
{
  "status": "error",
  "error": {
    "code": "error_code",
    "message": "Error message description",
    "details": {}
  }
}
```

## Error Handling

RelayCore uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Error responses include detailed information to help diagnose issues.

## Rate Limiting

API requests are subject to rate limiting to ensure fair usage. Rate limits are based on:

- API key tier
- Endpoint type
- Request frequency

Rate limit headers are included in all responses:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time (in seconds) until the rate limit resets

When rate limits are exceeded, a `429 Too Many Requests` response is returned.

## Endpoints

### Health Check

#### GET /health

Check the health status of the API.

**Response:**

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 1234567
}
```

### AI Providers

#### POST /providers/{provider}/completions

Send a completion request to a specific AI provider.

**Path Parameters:**

- `provider`: The AI provider (e.g., `openai`, `anthropic`, `mistral`)

**Request Body:**

```json
{
  "model": "gpt-4",
  "prompt": "Explain quantum computing",
  "max_tokens": 500,
  "temperature": 0.7,
  "options": {
    "cache": true,
    "optimize_tokens": true
  }
}
```

**Response:**

```json
{
  "id": "cmpl-123abc",
  "object": "completion",
  "created": 1677858242,
  "model": "gpt-4",
  "choices": [
    {
      "text": "Quantum computing is...",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 3,
    "completion_tokens": 150,
    "total_tokens": 153
  },
  "cache_hit": false
}
```

#### POST /providers/{provider}/chat/completions

Send a chat completion request to a specific AI provider.

**Path Parameters:**

- `provider`: The AI provider (e.g., `openai`, `anthropic`, `mistral`)

**Request Body:**

```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain quantum computing"}
  ],
  "max_tokens": 500,
  "temperature": 0.7,
  "options": {
    "cache": true,
    "optimize_tokens": true
  }
}
```

**Response:**

```json
{
  "id": "chatcmpl-123abc",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Quantum computing is..."
      },
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  },
  "cache_hit": false
}
```

#### POST /providers/auto/completions

Send a completion request and let RelayCore automatically select the best provider.

**Request Body:**

```json
{
  "prompt": "Explain quantum computing",
  "max_tokens": 500,
  "temperature": 0.7,
  "options": {
    "cache": true,
    "optimize_tokens": true,
    "priority": "cost" // or "speed" or "quality"
  }
}
```

**Response:**

Same as the provider-specific completion endpoint, with an additional field indicating the selected provider.

#### POST /providers/auto/chat/completions

Send a chat completion request and let RelayCore automatically select the best provider.

**Request Body:**

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Explain quantum computing"}
  ],
  "max_tokens": 500,
  "temperature": 0.7,
  "options": {
    "cache": true,
    "optimize_tokens": true,
    "priority": "cost" // or "speed" or "quality"
  }
}
```

**Response:**

Same as the provider-specific chat completion endpoint, with an additional field indicating the selected provider.

### Configuration

#### GET /config

Get the current configuration.

**Response:**

```json
{
  "providers": {
    "openai": {
      "enabled": true,
      "models": ["gpt-3.5-turbo", "gpt-4"]
    },
    "anthropic": {
      "enabled": true,
      "models": ["claude-2", "claude-instant"]
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "semantic_similarity_threshold": 0.85
  },
  "optimization": {
    "token_optimization": true,
    "smart_routing": true
  }
}
```

#### PUT /config

Update the configuration.

**Request Body:**

```json
{
  "cache": {
    "enabled": true,
    "ttl": 7200
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Configuration updated successfully"
}
```

### Analytics

#### GET /analytics/usage

Get usage statistics.

**Query Parameters:**

- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `provider`: Filter by provider (optional)
- `model`: Filter by model (optional)

**Response:**

```json
{
  "total_requests": 12345,
  "total_tokens": 5678901,
  "total_cost": 123.45,
  "by_provider": {
    "openai": {
      "requests": 8765,
      "tokens": 3456789,
      "cost": 78.90
    },
    "anthropic": {
      "requests": 3580,
      "tokens": 2222112,
      "cost": 44.55
    }
  },
  "by_model": {
    "gpt-4": {
      "requests": 5432,
      "tokens": 2345678,
      "cost": 70.10
    },
    "claude-2": {
      "requests": 2468,
      "tokens": 1357924,
      "cost": 30.25
    }
  },
  "by_date": [
    {
      "date": "2023-01-01",
      "requests": 1234,
      "tokens": 567890,
      "cost": 12.34
    }
  ]
}
```

#### GET /analytics/performance

Get performance metrics.

**Query Parameters:**

- `start_date`: Start date (ISO format)
- `end_date`: End date (ISO format)
- `provider`: Filter by provider (optional)
- `model`: Filter by model (optional)

**Response:**

```json
{
  "average_latency": 450.5,
  "p50_latency": 425.0,
  "p95_latency": 750.0,
  "p99_latency": 1200.0,
  "cache_hit_rate": 0.65,
  "error_rate": 0.02,
  "by_provider": {
    "openai": {
      "average_latency": 475.2,
      "cache_hit_rate": 0.62
    },
    "anthropic": {
      "average_latency": 425.8,
      "cache_hit_rate": 0.68
    }
  }
}
```

### Cache Management

#### GET /cache/stats

Get cache statistics.

**Response:**

```json
{
  "size": 1234567,
  "items": 5678,
  "hit_rate": 0.75,
  "miss_rate": 0.25,
  "average_ttl": 3600
}
```

#### DELETE /cache

Clear the cache.

**Query Parameters:**

- `pattern`: Cache key pattern to clear (optional)

**Response:**

```json
{
  "status": "success",
  "message": "Cache cleared successfully",
  "items_removed": 5678
}
```

### Batch Processing

#### POST /batch

Submit a batch of requests.

**Request Body:**

```json
{
  "requests": [
    {
      "provider": "openai",
      "endpoint": "completions",
      "body": {
        "model": "gpt-4",
        "prompt": "Explain quantum computing"
      }
    },
    {
      "provider": "anthropic",
      "endpoint": "chat/completions",
      "body": {
        "model": "claude-2",
        "messages": [
          {"role": "user", "content": "Explain relativity"}
        ]
      }
    }
  ],
  "options": {
    "parallel": true,
    "max_concurrency": 5
  }
}
```

**Response:**

```json
{
  "batch_id": "batch-123abc",
  "status": "processing",
  "total_requests": 2,
  "completed_requests": 0,
  "estimated_time": 5
}
```

#### GET /batch/{batch_id}

Get the status of a batch request.

**Path Parameters:**

- `batch_id`: The ID of the batch request

**Response:**

```json
{
  "batch_id": "batch-123abc",
  "status": "completed",
  "total_requests": 2,
  "completed_requests": 2,
  "results": [
    {
      "status": "success",
      "data": {
        "id": "cmpl-123abc",
        "choices": [
          {
            "text": "Quantum computing is..."
          }
        ]
      }
    },
    {
      "status": "success",
      "data": {
        "id": "chatcmpl-456def",
        "choices": [
          {
            "message": {
              "content": "Relativity is..."
            }
          }
        ]
      }
    }
  ]
}
```

## Webhooks

RelayCore can send webhook notifications for various events:

### Webhook Configuration

#### POST /webhooks

Register a new webhook.

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["request.completed", "batch.completed", "error"],
  "secret": "your_webhook_secret"
}
```

**Response:**

```json
{
  "id": "webhook-123abc",
  "url": "https://your-server.com/webhook",
  "events": ["request.completed", "batch.completed", "error"],
  "created_at": "2023-01-01T12:00:00Z"
}
```

### Webhook Events

Webhook payloads include:

```json
{
  "event": "request.completed",
  "timestamp": "2023-01-01T12:00:00Z",
  "data": {
    // Event-specific data
  },
  "signature": "sha256=..."
}
```

## SDK Integration

RelayCore provides SDKs for various programming languages:

- [JavaScript/TypeScript](https://github.com/relaycore/relaycore-js)
- [Python](https://github.com/relaycore/relaycore-python)
- [Go](https://github.com/relaycore/relaycore-go)
- [Ruby](https://github.com/relaycore/relaycore-ruby)
- [Java](https://github.com/relaycore/relaycore-java)

## Examples

### Basic Completion Request

```javascript
const RelayCore = require('relaycore');

const client = new RelayCore('your_api_key');

async function getCompletion() {
  const response = await client.completions.create({
    provider: 'openai',
    model: 'gpt-4',
    prompt: 'Explain quantum computing',
    max_tokens: 500
  });
  
  console.log(response.choices[0].text);
}

getCompletion();
```

### Chat Completion with Auto-Provider Selection

```javascript
const RelayCore = require('relaycore');

const client = new RelayCore('your_api_key');

async function getChatCompletion() {
  const response = await client.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain quantum computing' }
    ],
    options: {
      priority: 'quality'
    }
  });
  
  console.log(response.choices[0].message.content);
  console.log(`Provider used: ${response.provider}`);
}

getChatCompletion();
```

### Batch Processing

```javascript
const RelayCore = require('relaycore');

const client = new RelayCore('your_api_key');

async function processBatch() {
  // Submit batch
  const batch = await client.batch.create({
    requests: [
      {
        provider: 'openai',
        endpoint: 'completions',
        body: {
          model: 'gpt-4',
          prompt: 'Explain quantum computing'
        }
      },
      {
        provider: 'anthropic',
        endpoint: 'chat/completions',
        body: {
          model: 'claude-2',
          messages: [
            { role: 'user', content: 'Explain relativity' }
          ]
        }
      }
    ]
  });
  
  console.log(`Batch ID: ${batch.batch_id}`);
  
  // Poll for results
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await client.batch.status(batch.batch_id);
  } while (status.status !== 'completed' && status.status !== 'failed');
  
  console.log('Batch results:', status.results);
}

processBatch();
```