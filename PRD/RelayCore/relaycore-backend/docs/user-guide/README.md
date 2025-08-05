# RelayCore User Guide

Welcome to the RelayCore User Guide! This comprehensive guide will help you get started with RelayCore, understand its features, and make the most of its capabilities.

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Authentication](#authentication)
3. [Core Concepts](#core-concepts)
   - [AI Provider Routing](#ai-provider-routing)
   - [Caching System](#caching-system)
   - [Token Optimization](#token-optimization)
   - [Batch Processing](#batch-processing)
4. [Dashboard](#dashboard)
   - [Overview](#overview)
   - [Request Logs](#request-logs)
   - [Analytics](#analytics)
   - [Configuration](#dashboard-configuration)
   - [User Management](#user-management)
5. [API Reference](#api-reference)
6. [Plugins](#plugins)
   - [VS Code Plugin](#vs-code-plugin)
   - [Claude CLI Plugin](#claude-cli-plugin)
   - [LangChain Integration](#langchain-integration)
   - [JetBrains IDE Plugin](#jetbrains-ide-plugin)
   - [Amazon Kiro IDE Plugin](#amazon-kiro-ide-plugin)
7. [Advanced Usage](#advanced-usage)
   - [Custom Routing Rules](#custom-routing-rules)
   - [Semantic Caching](#semantic-caching)
   - [Webhooks](#webhooks)
   - [Rate Limiting](#rate-limiting)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Introduction

RelayCore is a universal HTTP relay service that connects external tools to AI model endpoints. It provides smart routing, cost optimization, context injection, and plug-and-play agent interoperability.

### Key Features

- **Universal Compatibility**: Connect any tool to any AI model endpoint
- **Smart Routing**: Automatically route requests to the most appropriate AI model
- **Cost Optimization**: Reduce costs through caching, token optimization, and smart routing
- **Semantic Caching**: Cache similar requests to avoid redundant API calls
- **Batch Processing**: Process multiple requests efficiently
- **Analytics and Monitoring**: Track usage, costs, and performance
- **Plugin Ecosystem**: Integrate with popular tools like VS Code, JetBrains IDEs, and more

## Getting Started

### Installation

#### Docker (Recommended)

The easiest way to get started with RelayCore is using Docker:

```bash
docker pull relaycore/relaycore:latest
docker run -p 3000:3000 -e API_KEY=your_api_key relaycore/relaycore:latest
```

#### NPM

You can also install RelayCore using npm:

```bash
npm install -g relaycore
relaycore start
```

#### Source

To install from source:

```bash
git clone https://github.com/relaycore/relaycore.git
cd relaycore
npm install
npm run build
npm start
```

### Configuration

RelayCore can be configured using environment variables, a configuration file, or the dashboard.

#### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
MISTRAL_API_KEY=your_mistral_api_key

# Caching
REDIS_URL=redis://localhost:6379
CACHE_ENABLED=true
CACHE_TTL=3600
SEMANTIC_CACHE_SIMILARITY_THRESHOLD=0.85

# Database
DATABASE_URL=postgres://user:password@localhost:5432/relaycore
```

#### Configuration File

Create a `config.json` file:

```json
{
  "server": {
    "port": 3000,
    "environment": "production"
  },
  "authentication": {
    "jwtSecret": "your_jwt_secret",
    "jwtExpiration": "24h"
  },
  "providers": {
    "openai": {
      "apiKey": "your_openai_api_key",
      "models": ["gpt-3.5-turbo", "gpt-4"]
    },
    "anthropic": {
      "apiKey": "your_anthropic_api_key",
      "models": ["claude-2", "claude-instant"]
    },
    "mistral": {
      "apiKey": "your_mistral_api_key",
      "models": ["mistral-small", "mistral-medium", "mistral-large"]
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "semanticSimilarityThreshold": 0.85
  },
  "database": {
    "url": "postgres://user:password@localhost:5432/relaycore"
  }
}
```

Then start RelayCore with:

```bash
relaycore start --config path/to/config.json
```

### Authentication

RelayCore uses API keys for authentication. You can generate API keys through the dashboard or using the CLI:

```bash
relaycore api-keys create --name "My API Key" --role "admin"
```

## Core Concepts

### AI Provider Routing

RelayCore can route requests to different AI providers based on various factors:

- **Explicit Provider Selection**: Specify the provider in your request
- **Auto-Provider Selection**: Let RelayCore choose the best provider based on:
  - Request complexity
  - Cost optimization
  - Performance requirements
  - Availability

Example of explicit provider selection:

```javascript
// Using the JavaScript SDK
const response = await relaycore.completions.create({
  provider: 'openai',
  model: 'gpt-4',
  prompt: 'Explain quantum computing'
});
```

Example of auto-provider selection:

```javascript
// Using the JavaScript SDK
const response = await relaycore.completions.create({
  prompt: 'Explain quantum computing',
  options: {
    priority: 'quality' // or 'cost' or 'speed'
  }
});
```

### Caching System

RelayCore includes a sophisticated caching system to reduce costs and improve performance:

- **Exact Caching**: Cache identical requests
- **Semantic Caching**: Cache semantically similar requests
- **TTL Control**: Configure how long responses are cached
- **Cache Invalidation**: Manually invalidate cache entries when needed

Example of controlling caching behavior:

```javascript
// Using the JavaScript SDK
const response = await relaycore.completions.create({
  provider: 'openai',
  model: 'gpt-4',
  prompt: 'Explain quantum computing',
  options: {
    cache: true, // Enable caching
    cacheTtl: 3600 // Cache for 1 hour
  }
});

// Check if response was from cache
console.log(`Cache hit: ${response.cache_hit}`);
```

### Token Optimization

RelayCore optimizes token usage to reduce costs:

- **Prompt Compression**: Remove redundant whitespace and formatting
- **Context Pruning**: Remove irrelevant context from prompts
- **Token Counting**: Accurately count tokens before sending requests
- **Response Optimization**: Request only the tokens you need

Example of token optimization:

```javascript
// Using the JavaScript SDK
const response = await relaycore.completions.create({
  provider: 'openai',
  model: 'gpt-4',
  prompt: 'Explain quantum computing',
  options: {
    optimize_tokens: true, // Enable token optimization
    optimization_level: 'high' // Level of optimization
  }
});
```

### Batch Processing

RelayCore can process multiple requests efficiently:

- **Parallel Processing**: Process multiple requests in parallel
- **Sequential Processing**: Process requests in sequence when order matters
- **Batch Status Tracking**: Monitor the status of batch requests
- **Result Aggregation**: Collect and return results in a single response

Example of batch processing:

```javascript
// Using the JavaScript SDK
const batch = await relaycore.batch.create({
  requests: [
    {
      provider: 'openai',
      model: 'gpt-4',
      prompt: 'Explain quantum computing'
    },
    {
      provider: 'anthropic',
      model: 'claude-2',
      prompt: 'Explain relativity'
    }
  ],
  options: {
    parallel: true,
    max_concurrency: 5
  }
});

// Check batch status
const status = await relaycore.batch.status(batch.batch_id);
```

## Dashboard

RelayCore includes a comprehensive dashboard for monitoring and configuration.

### Overview

The dashboard overview provides a high-level summary of your RelayCore instance:

- **Request Volume**: Total number of requests processed
- **Cost Metrics**: Total cost and cost breakdown by provider
- **Cache Performance**: Cache hit rate and savings
- **Token Usage**: Total tokens used and breakdown by provider
- **Recent Requests**: List of recent requests with status

### Request Logs

The request logs view allows you to browse and search through all requests:

- **Filtering**: Filter by provider, model, status, and date range
- **Sorting**: Sort by time, cost, tokens, etc.
- **Detail View**: View detailed information about each request
- **Export**: Export logs for further analysis

### Analytics

The analytics view provides detailed insights into your RelayCore usage:

- **Usage Trends**: View usage trends over time
- **Cost Analysis**: Analyze costs by provider, model, and time period
- **Performance Metrics**: Monitor response times and error rates
- **Cache Analytics**: Analyze cache performance and savings

### Dashboard Configuration

The configuration view allows you to configure your RelayCore instance:

- **Provider Settings**: Configure API keys and model access
- **Cache Settings**: Configure caching behavior
- **Optimization Settings**: Configure token optimization
- **Routing Rules**: Define custom routing rules
- **Webhook Configuration**: Set up webhooks for events

### User Management

The user management view allows you to manage users and permissions:

- **User List**: View and manage users
- **Role Management**: Assign roles to users
- **API Key Management**: Create and revoke API keys
- **Audit Logs**: View user activity logs

## API Reference

For detailed API documentation, see the [API Reference](../api/README.md).

## Plugins

RelayCore offers a variety of plugins to integrate with popular tools.

### VS Code Plugin

The VS Code plugin brings AI capabilities directly into your code editor:

- **Code Explanation**: Get detailed explanations of selected code
- **Code Generation**: Generate code based on natural language descriptions
- **Documentation Generation**: Automatically generate documentation for your code
- **Code Optimization**: Optimize your code for performance, readability, or memory usage

For more information, see the [VS Code Plugin Documentation](../plugins/vscode.md).

### Claude CLI Plugin

The Claude CLI plugin brings Claude AI to your terminal:

- **Interactive Chat**: Have natural conversations with Claude directly in your terminal
- **File Processing**: Process and analyze files with Claude
- **Code Generation**: Generate code based on natural language descriptions
- **Shell Command Generation**: Generate shell commands from natural language descriptions

For more information, see the [Claude CLI Plugin Documentation](../plugins/claude-cli.md).

### LangChain Integration

The LangChain integration allows you to use RelayCore with the LangChain framework:

- **Optimized Model Access**: Route requests to the most appropriate AI model
- **Semantic Caching**: Reduce costs and latency with intelligent caching
- **Token Optimization**: Automatically optimize prompts to reduce token usage
- **Cost Management**: Track and manage AI usage costs across your LangChain applications

For more information, see the [LangChain Integration Documentation](../plugins/langchain.md).

### JetBrains IDE Plugin

The JetBrains IDE plugin brings AI capabilities to IntelliJ IDEA, PyCharm, and other JetBrains IDEs:

- **Code Explanation**: Get detailed explanations of selected code
- **Code Generation**: Generate code based on natural language descriptions
- **Code Completion**: Get intelligent code completions as you type
- **Documentation Generation**: Automatically generate documentation for your code

For more information, see the [JetBrains IDE Plugin Documentation](../plugins/jetbrains.md).

### Amazon Kiro IDE Plugin

The Amazon Kiro IDE plugin integrates AI capabilities into Amazon's Kiro IDE:

- **AWS-Specific Code Generation**: Generate code for AWS services
- **CloudFormation Template Generation**: Create and optimize CloudFormation templates
- **IAM Policy Generation**: Generate secure IAM policies
- **Best Practices Enforcement**: Ensure your AWS code follows best practices

For more information, see the [Amazon Kiro IDE Plugin Documentation](../plugins/amazon-kiro.md).

## Advanced Usage

### Custom Routing Rules

You can define custom routing rules to control how requests are routed to different providers:

```javascript
// Using the JavaScript SDK
const relaycore = new RelayCore({
  routingRules: [
    {
      pattern: 'summarize|summary|summarization',
      provider: 'anthropic',
      model: 'claude-instant',
      options: {
        temperature: 0.3
      }
    },
    {
      pattern: 'code|function|algorithm|program',
      provider: 'openai',
      model: 'gpt-4',
      options: {
        temperature: 0.2
      }
    }
  ]
});
```

You can also configure routing rules through the dashboard.

### Semantic Caching

RelayCore's semantic caching system caches responses based on the semantic similarity of prompts:

- **Similarity Threshold**: Configure how similar prompts need to be for a cache hit
- **Embedding Models**: Choose which embedding model to use for similarity calculation
- **Cache TTL**: Configure how long responses are cached
- **Cache Namespaces**: Organize cache entries by namespace

Example of configuring semantic caching:

```javascript
// Using the JavaScript SDK
const relaycore = new RelayCore({
  cache: {
    enabled: true,
    semantic: true,
    semanticSimilarityThreshold: 0.85,
    ttl: 3600
  }
});
```

### Webhooks

RelayCore can send webhook notifications for various events:

- **Request Completed**: When a request is completed
- **Batch Completed**: When a batch request is completed
- **Error**: When an error occurs
- **Cache Hit**: When a cache hit occurs
- **Rate Limit Exceeded**: When a rate limit is exceeded

Example of configuring webhooks:

```javascript
// Using the JavaScript SDK
await relaycore.webhooks.create({
  url: 'https://your-server.com/webhook',
  events: ['request.completed', 'batch.completed', 'error'],
  secret: 'your_webhook_secret'
});
```

### Rate Limiting

RelayCore includes a rate limiting system to prevent abuse and ensure fair usage:

- **Global Rate Limits**: Limit requests across all clients
- **Per-Client Rate Limits**: Limit requests per client
- **Per-Endpoint Rate Limits**: Limit requests to specific endpoints
- **Custom Rate Limits**: Define custom rate limits for specific use cases

Example of configuring rate limits:

```javascript
// Using the JavaScript SDK
const relaycore = new RelayCore({
  rateLimits: {
    global: {
      requestsPerMinute: 1000
    },
    perClient: {
      requestsPerMinute: 100
    },
    perEndpoint: {
      '/providers/openai/completions': {
        requestsPerMinute: 50
      }
    }
  }
});
```

## Troubleshooting

### Common Issues

#### Authentication Errors

If you're experiencing authentication errors:

1. Check that your API key is correct
2. Ensure your API key has the necessary permissions
3. Verify that your JWT token is valid and not expired

#### Rate Limiting

If you're being rate limited:

1. Check your rate limit settings
2. Implement exponential backoff in your client
3. Consider upgrading your plan for higher rate limits

#### Cache Issues

If caching is not working as expected:

1. Verify that caching is enabled
2. Check your cache TTL settings
3. Ensure your Redis instance is properly configured

#### Performance Issues

If you're experiencing performance issues:

1. Check your server resources (CPU, memory, network)
2. Optimize your prompts to reduce token usage
3. Enable caching to reduce API calls
4. Use batch processing for multiple requests

### Logs

RelayCore logs can help diagnose issues:

```bash
# View logs
relaycore logs

# View logs with debug information
relaycore logs --level debug

# View logs for a specific component
relaycore logs --component cache
```

## FAQ

### General Questions

#### What is RelayCore?

RelayCore is a universal HTTP relay service that connects external tools to AI model endpoints. It provides smart routing, cost optimization, context injection, and plug-and-play agent interoperability.

#### How does RelayCore reduce costs?

RelayCore reduces costs through several mechanisms:
- Semantic caching to avoid redundant API calls
- Token optimization to reduce token usage
- Smart routing to choose cost-effective providers
- Batch processing to reduce overhead

#### Can I use RelayCore with my existing tools?

Yes, RelayCore is designed to work with existing tools through its API and plugin ecosystem. It supports popular tools like VS Code, JetBrains IDEs, and LangChain.

### Technical Questions

#### How does semantic caching work?

Semantic caching works by:
1. Converting prompts to embeddings
2. Calculating similarity between the current prompt and cached prompts
3. Returning cached responses for similar prompts
4. Caching new responses for future use

#### Can I host RelayCore on-premises?

Yes, RelayCore can be self-hosted on your own infrastructure. It's designed to work in various environments, including on-premises data centers, cloud providers, and Kubernetes clusters.

#### How does RelayCore handle sensitive data?

RelayCore is designed with privacy and security in mind:
- All data is encrypted in transit
- No data is stored permanently unless explicitly configured
- You can self-host for complete data control
- Custom data retention policies can be configured

#### What databases does RelayCore support?

RelayCore supports:
- PostgreSQL (recommended)
- MySQL
- SQLite (for development)
- MongoDB

For caching, RelayCore uses Redis.

### Support

For additional support:

- **Documentation**: [docs.relaycore.ai](https://docs.relaycore.ai)
- **GitHub Issues**: [github.com/relaycore/relaycore/issues](https://github.com/relaycore/relaycore/issues)
- **Discord Community**: [discord.gg/relaycore](https://discord.gg/relaycore)
- **Email Support**: [support@relaycore.ai](mailto:support@relaycore.ai)