# RelayCore Developer Guide

Welcome to the RelayCore Developer Guide! This comprehensive guide is designed to help developers understand the architecture of RelayCore, contribute to its development, and extend its functionality.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
   - [HTTP Server](#http-server)
   - [Provider Management](#provider-management)
   - [Caching System](#caching-system)
   - [Token Optimization](#token-optimization)
   - [Batch Processing](#batch-processing)
   - [Analytics and Monitoring](#analytics-and-monitoring)
5. [Plugin Development](#plugin-development)
   - [Plugin Architecture](#plugin-architecture)
   - [Creating a New Plugin](#creating-a-new-plugin)
   - [Plugin API Reference](#plugin-api-reference)
6. [Testing](#testing)
   - [Unit Testing](#unit-testing)
   - [Integration Testing](#integration-testing)
   - [Performance Testing](#performance-testing)
7. [Deployment](#deployment)
   - [Docker Deployment](#docker-deployment)
   - [Kubernetes Deployment](#kubernetes-deployment)
   - [Cloud Deployment](#cloud-deployment)
8. [Contributing Guidelines](#contributing-guidelines)
   - [Code Style](#code-style)
   - [Pull Request Process](#pull-request-process)
   - [Issue Reporting](#issue-reporting)
9. [API Development](#api-development)
   - [Adding New Endpoints](#adding-new-endpoints)
   - [Versioning](#versioning)
   - [Documentation](#documentation)
10. [Security Considerations](#security-considerations)
    - [Authentication](#authentication)
    - [Data Protection](#data-protection)
    - [Rate Limiting](#rate-limiting)
11. [Performance Optimization](#performance-optimization)
    - [Caching Strategies](#caching-strategies)
    - [Database Optimization](#database-optimization)
    - [Scaling Strategies](#scaling-strategies)

## Architecture Overview

RelayCore follows a modular architecture designed for extensibility, performance, and reliability. The system is composed of several key components:

![RelayCore Architecture](https://docs.relaycore.ai/images/architecture.png)

### Key Components

1. **API Gateway**: Handles incoming HTTP requests, authentication, and routing
2. **Provider Manager**: Manages connections to AI providers (OpenAI, Anthropic, etc.)
3. **Cache Manager**: Handles caching of requests and responses
4. **Token Optimizer**: Optimizes prompts to reduce token usage
5. **Batch Processor**: Manages batch processing of requests
6. **Analytics Engine**: Collects and processes usage data
7. **Plugin System**: Enables extension of functionality through plugins

### Data Flow

1. Client sends a request to the RelayCore API
2. Request is authenticated and validated
3. Cache is checked for a matching response
4. If no cache hit, the request is optimized and routed to the appropriate provider
5. Response is cached (if caching is enabled)
6. Response is returned to the client
7. Analytics data is collected asynchronously

## Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 8+ or yarn 1.22+
- Redis 6+
- PostgreSQL 14+
- Docker (optional, for containerized development)

### Setup Steps

1. Clone the repository:

```bash
git clone https://github.com/relaycore/relaycore.git
cd relaycore
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development services:

```bash
# Using Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Or manually start Redis and PostgreSQL
```

5. Run database migrations:

```bash
npm run migrate
```

6. Start the development server:

```bash
npm run dev
```

The server will be available at http://localhost:3000.

### Development Tools

- **ESLint**: For code linting
- **Prettier**: For code formatting
- **Jest**: For testing
- **TypeScript**: For type checking
- **Nodemon**: For automatic server restart during development

## Project Structure

```
relaycore/
├── src/                    # Source code
│   ├── api/                # API endpoints
│   ├── analytics/          # Analytics and monitoring
│   ├── batch/              # Batch processing
│   ├── cache/              # Caching system
│   ├── config/             # Configuration management
│   ├── core/               # Core functionality
│   │   └── middleware/     # Express middleware
│   ├── optimization/       # Token optimization
│   ├── plugins/            # Plugin system
│   ├── providers/          # Provider integrations
│   └── utils/              # Utility functions
├── tests/                  # Tests
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── performance/        # Performance tests
├── docs/                   # Documentation
├── scripts/                # Build and utility scripts
├── dashboard/              # Dashboard frontend
├── plugins/                # Official plugins
│   ├── vscode/             # VS Code plugin
│   ├── claude-cli/         # Claude CLI plugin
│   ├── langchain/          # LangChain integration
│   ├── jetbrains/          # JetBrains IDE plugin
│   └── amazon-kiro/        # Amazon Kiro IDE plugin
├── .github/                # GitHub configuration
├── .vscode/                # VS Code configuration
├── docker/                 # Docker configuration
├── kubernetes/             # Kubernetes manifests
├── package.json            # npm package configuration
└── tsconfig.json           # TypeScript configuration
```

## Core Components

### HTTP Server

RelayCore uses Express.js for its HTTP server. The server is responsible for handling incoming requests, authentication, and routing to the appropriate handlers.

Key files:
- `src/api/server.ts`: Main server setup
- `src/api/routes/index.ts`: Route definitions
- `src/core/middleware/auth.ts`: Authentication middleware

Example of adding a new route:

```typescript
// src/api/routes/example.ts
import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();

// Public route
router.get('/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected endpoint', user: req.user });
});

export default router;

// src/api/routes/index.ts
import { Router } from 'express';
import exampleRouter from './example';

const router = Router();

router.use('/example', exampleRouter);

export default router;
```

### Provider Management

The provider management system handles connections to different AI providers, such as OpenAI, Anthropic, and Mistral.

Key files:
- `src/providers/providerManager.ts`: Main provider manager
- `src/providers/openai.ts`: OpenAI provider implementation
- `src/providers/anthropic.ts`: Anthropic provider implementation

Example of implementing a new provider:

```typescript
// src/providers/customProvider.ts
import { BaseProvider } from './baseProvider';
import { CompletionRequest, CompletionResponse } from '../types';

export class CustomProvider extends BaseProvider {
  constructor(config: any) {
    super('custom', config);
  }

  async completion(request: CompletionRequest): Promise<CompletionResponse> {
    // Implement completion logic
    const response = await fetch('https://api.custom-provider.com/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        prompt: request.prompt,
        max_tokens: request.max_tokens,
        temperature: request.temperature
      })
    });

    const data = await response.json();

    // Transform provider-specific response to standard format
    return {
      id: data.id,
      object: 'completion',
      created: Date.now(),
      model: request.model,
      choices: [
        {
          text: data.completion,
          index: 0,
          finish_reason: data.finish_reason
        }
      ],
      usage: {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens
      }
    };
  }

  // Implement other methods (chat, embeddings, etc.)
}

// Register the provider in providerManager.ts
import { CustomProvider } from './customProvider';

// In the constructor or init method
this.providers.set('custom', new CustomProvider(config.providers.custom));
```

### Caching System

RelayCore's caching system is designed to reduce costs and improve performance by caching responses to similar requests.

Key files:
- `src/cache/cacheManager.ts`: Main cache manager
- `src/cache/semanticCache.ts`: Semantic caching implementation

The caching system uses Redis for storage and supports both exact and semantic caching.

Example of using the cache manager:

```typescript
import { CacheManager } from '../cache/cacheManager';

// Create a cache manager
const cacheManager = new CacheManager(redisClient);

// Set a value in the cache
await cacheManager.set('key', { data: 'value' }, 3600); // TTL in seconds

// Get a value from the cache
const value = await cacheManager.get('key');

// Check if a key exists
const exists = await cacheManager.exists('key');

// Delete a key
await cacheManager.delete('key');

// Clear keys matching a pattern
await cacheManager.clear('prefix:*');
```

### Token Optimization

The token optimization system reduces token usage by optimizing prompts before sending them to AI providers.

Key files:
- `src/optimization/tokenOptimizer.ts`: Main token optimizer
- `src/optimization/strategies/`: Optimization strategies

Example of using the token optimizer:

```typescript
import { TokenOptimizer } from '../optimization/tokenOptimizer';

// Create a token optimizer
const tokenOptimizer = new TokenOptimizer();

// Optimize a prompt
const optimizedPrompt = tokenOptimizer.optimizePrompt(prompt);

// Optimize a context window to fit within a token limit
const optimizedContext = tokenOptimizer.optimizeContextWindow(context, 4000);
```

### Batch Processing

The batch processing system allows clients to submit multiple requests in a single API call, which are then processed efficiently.

Key files:
- `src/batch/batchProcessor.ts`: Main batch processor
- `src/batch/batchQueue.ts`: Queue for batch requests

Example of using the batch processor:

```typescript
import { BatchProcessor } from '../batch/batchProcessor';

// Create a batch processor
const batchProcessor = new BatchProcessor(providerManager);

// Submit a batch request
const batchId = await batchProcessor.submitBatch({
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
  ],
  options: {
    parallel: true,
    max_concurrency: 5
  }
});

// Get batch status
const status = await batchProcessor.getBatchStatus(batchId);
```

### Analytics and Monitoring

The analytics and monitoring system collects data about usage, performance, and costs.

Key files:
- `src/analytics/analyticsManager.ts`: Main analytics manager
- `src/analytics/metrics.ts`: Metrics collection
- `src/analytics/storage.ts`: Storage for analytics data

Example of using the analytics manager:

```typescript
import { AnalyticsManager } from '../analytics/analyticsManager';

// Create an analytics manager
const analyticsManager = new AnalyticsManager(database);

// Record a request
await analyticsManager.recordRequest({
  id: 'req-123',
  provider: 'openai',
  model: 'gpt-4',
  timestamp: Date.now(),
  duration: 500,
  tokens: {
    prompt: 10,
    completion: 50,
    total: 60
  },
  cost: 0.0012,
  cache_hit: false
});

// Get usage statistics
const stats = await analyticsManager.getUsageStats({
  start_date: '2023-01-01',
  end_date: '2023-01-31',
  provider: 'openai'
});
```

## Plugin Development

### Plugin Architecture

RelayCore's plugin system allows developers to extend its functionality. Plugins can add new features, integrate with external tools, or modify existing behavior.

Key files:
- `src/plugins/pluginManager.ts`: Main plugin manager
- `src/plugins/basePlugin.ts`: Base class for plugins

### Creating a New Plugin

To create a new plugin, you need to:

1. Create a new directory in the `plugins/` directory
2. Implement the plugin interface
3. Register the plugin with the plugin manager

Example of a simple plugin:

```typescript
// plugins/example/index.ts
import { BasePlugin } from '../../src/plugins/basePlugin';

export class ExamplePlugin extends BasePlugin {
  constructor() {
    super('example', '1.0.0');
  }

  async initialize(app: any, config: any): Promise<void> {
    // Add routes
    app.get('/api/v1/example', (req, res) => {
      res.json({ message: 'Hello from example plugin!' });
    });

    // Add middleware
    app.use('/api/v1/example', (req, res, next) => {
      console.log('Example plugin middleware');
      next();
    });

    // Add event listeners
    app.on('request.completed', (data) => {
      console.log('Request completed:', data);
    });

    console.log('Example plugin initialized');
  }

  async shutdown(): Promise<void> {
    console.log('Example plugin shutdown');
  }
}

// Export plugin factory function
export default function createPlugin() {
  return new ExamplePlugin();
}
```

### Plugin API Reference

Plugins can interact with RelayCore through the following APIs:

- **App**: Express application instance
- **Config**: Configuration object
- **Events**: Event emitter for system events
- **Provider Manager**: Access to AI providers
- **Cache Manager**: Access to the caching system
- **Analytics Manager**: Access to analytics data

For a complete reference, see the [Plugin API Documentation](../api/plugins.md).

## Testing

RelayCore uses Jest for testing. The test suite includes unit tests, integration tests, and performance tests.

### Unit Testing

Unit tests focus on testing individual components in isolation.

Example of a unit test:

```typescript
// tests/unit/cache/cacheManager.test.ts
import { CacheManager } from '../../../src/cache/cacheManager';
import Redis from 'ioredis-mock';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let mockRedisClient: any;

  beforeEach(() => {
    mockRedisClient = new Redis();
    cacheManager = new CacheManager(mockRedisClient);
  });

  it('should set and get a value', async () => {
    const key = 'test-key';
    const value = { data: 'test-data' };

    await cacheManager.set(key, value);
    const result = await cacheManager.get(key);

    expect(result).toEqual(value);
  });

  // More tests...
});
```

To run unit tests:

```bash
npm run test:unit
```

### Integration Testing

Integration tests focus on testing the interaction between components.

Example of an integration test:

```typescript
// tests/integration/api/routes.test.ts
import request from 'supertest';
import { createServer } from '../../../src/api/server';

describe('API Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await createServer();
  });

  it('should return 200 OK for health check endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  // More tests...
});
```

To run integration tests:

```bash
npm run test:integration
```

### Performance Testing

Performance tests focus on measuring the performance of the system under load.

Example of a performance test:

```typescript
// tests/performance/cache/cachePerformance.test.ts
import { CacheManager } from '../../../src/cache/cacheManager';
import Redis from 'ioredis';

describe('Cache Performance', () => {
  let cacheManager: CacheManager;
  let redisClient: Redis;

  beforeAll(async () => {
    redisClient = new Redis();
    cacheManager = new CacheManager(redisClient);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  it('should handle bulk set operations efficiently', async () => {
    const numItems = 1000;
    const items = Array.from({ length: numItems }, (_, i) => ({
      key: `perf-test-key-${i}`,
      value: { data: `test-data-${i}` }
    }));

    const start = Date.now();
    for (const item of items) {
      await cacheManager.set(item.key, item.value);
    }
    const end = Date.now();

    const duration = end - start;
    console.log(`Set ${numItems} items in ${duration}ms (${duration / numItems}ms per item)`);

    // Performance assertion
    expect(duration).toBeLessThan(numItems * 5); // Less than 5ms per item on average
  });

  // More tests...
});
```

To run performance tests:

```bash
npm run test:performance
```

## Deployment

RelayCore can be deployed in various environments, including Docker, Kubernetes, and cloud platforms.

### Docker Deployment

RelayCore includes a Dockerfile for containerized deployment:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

To build and run the Docker image:

```bash
# Build the image
docker build -t relaycore .

# Run the container
docker run -p 3000:3000 -e API_KEY=your_api_key relaycore
```

### Kubernetes Deployment

RelayCore includes Kubernetes manifests for deployment on Kubernetes:

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: relaycore
spec:
  replicas: 3
  selector:
    matchLabels:
      app: relaycore
  template:
    metadata:
      labels:
        app: relaycore
    spec:
      containers:
      - name: relaycore
        image: relaycore:latest
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        - name: REDIS_URL
          value: "redis://redis:6379"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: relaycore-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: relaycore-secrets
              key: openai-api-key
```

To deploy to Kubernetes:

```bash
# Apply the manifests
kubectl apply -f kubernetes/

# Check the deployment
kubectl get pods -l app=relaycore
```

### Cloud Deployment

RelayCore can be deployed to various cloud platforms:

- **AWS**: Using ECS, EKS, or EC2
- **Google Cloud**: Using GKE or Cloud Run
- **Azure**: Using AKS or App Service
- **Heroku**: Using the Heroku CLI

For detailed deployment instructions for each platform, see the [Deployment Guide](../deployment/README.md).

## Contributing Guidelines

We welcome contributions to RelayCore! Here are some guidelines to help you get started.

### Code Style

RelayCore follows a consistent code style enforced by ESLint and Prettier:

- Use TypeScript for type safety
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use async/await for asynchronous code
- Write descriptive variable and function names
- Add JSDoc comments for public APIs

To check your code style:

```bash
npm run lint
```

To automatically fix style issues:

```bash
npm run lint:fix
```

### Pull Request Process

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Update documentation if necessary
7. Submit a pull request

Pull requests should include:

- A clear description of the changes
- Any relevant issue numbers
- Tests for new functionality
- Documentation updates if necessary

### Issue Reporting

When reporting issues, please include:

- A clear description of the issue
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment information (OS, Node.js version, etc.)
- Logs or error messages

## API Development

### Adding New Endpoints

To add a new endpoint to the RelayCore API:

1. Create a new route file in `src/api/routes/`
2. Implement the endpoint logic
3. Add the route to the main router in `src/api/routes/index.ts`
4. Add tests for the new endpoint
5. Update the API documentation

Example of adding a new endpoint:

```typescript
// src/api/routes/custom.ts
import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Implement endpoint logic
    res.json({ message: 'Custom endpoint' });
  } catch (error) {
    next(error);
  }
});

export default router;

// src/api/routes/index.ts
import { Router } from 'express';
import customRouter from './custom';

const router = Router();

router.use('/custom', customRouter);

export default router;
```

### Versioning

RelayCore uses semantic versioning (MAJOR.MINOR.PATCH) and includes version information in API paths:

- `/v1/`: Version 1 API
- `/v2/`: Version 2 API (when available)

When making changes to the API:

- **PATCH**: Backward-compatible bug fixes
- **MINOR**: Backward-compatible new features
- **MAJOR**: Breaking changes

### Documentation

API documentation is generated from code comments using [TypeDoc](https://typedoc.org/):

```typescript
/**
 * Get usage statistics
 * 
 * @param {Object} options - Query options
 * @param {string} options.start_date - Start date (ISO format)
 * @param {string} options.end_date - End date (ISO format)
 * @param {string} [options.provider] - Filter by provider
 * @param {string} [options.model] - Filter by model
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStats(options) {
  // Implementation
}
```

To generate API documentation:

```bash
npm run docs
```

## Security Considerations

### Authentication

RelayCore uses multiple authentication methods:

- **API Keys**: For programmatic access
- **JWT Tokens**: For user authentication
- **OAuth**: For third-party integrations

API keys and JWT tokens are stored securely:

- API keys are hashed before storage
- JWT tokens are signed with a secret key
- Passwords are hashed using bcrypt

### Data Protection

RelayCore takes data protection seriously:

- All data is encrypted in transit using TLS
- Sensitive data is encrypted at rest
- API keys and secrets are never logged
- Personal data is handled according to GDPR and other regulations

### Rate Limiting

RelayCore includes rate limiting to prevent abuse:

- Global rate limits to protect the system
- Per-client rate limits to ensure fair usage
- Per-endpoint rate limits for resource-intensive operations
- IP-based rate limits to prevent brute force attacks

Rate limits are configurable and can be adjusted based on your needs.

## Performance Optimization

### Caching Strategies

RelayCore uses several caching strategies:

- **In-Memory Cache**: For frequently accessed data
- **Redis Cache**: For distributed caching
- **Semantic Cache**: For similar AI requests
- **Response Cache**: For identical requests

To optimize caching:

- Adjust TTL based on data volatility
- Use appropriate cache keys
- Monitor cache hit rates
- Implement cache warming for critical data

### Database Optimization

RelayCore uses PostgreSQL for persistent storage. To optimize database performance:

- Use indexes for frequently queried fields
- Implement connection pooling
- Use transactions for atomic operations
- Optimize queries for performance
- Implement database sharding for large deployments

### Scaling Strategies

RelayCore is designed to scale horizontally:

- Stateless API servers can be scaled out
- Redis can be configured as a cluster for cache scaling
- Database can be scaled through replication and sharding
- Batch processing can be distributed across multiple workers

For high-availability deployments:

- Use multiple API servers behind a load balancer
- Configure Redis with replication and failover
- Set up database replication with automatic failover
- Implement health checks and auto-healing