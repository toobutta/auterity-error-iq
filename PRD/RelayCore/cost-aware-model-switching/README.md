# Cost-Aware Model Switching

A component for the RelayCore and Auterity integration that enables intelligent model selection based on cost parameters, budget constraints, and performance requirements.

## Overview

The Cost-Aware Model Switching component optimizes AI usage costs while maintaining quality by intelligently routing requests to different AI models based on various parameters. It integrates with RelayCore's steering rules and Auterity's observability system to provide a comprehensive cost management solution.

## Key Features

- **Budget Management**: Define and track budgets at organization, team, and user levels
- **Cost-Based Model Selection**: Automatically select the most cost-effective model that meets quality requirements
- **Budget Alerts and Enforcement**: Get notified when budgets reach thresholds and enforce budget constraints
- **Cost Analytics**: Track and analyze AI usage costs across models, providers, and users
- **Token Estimation**: Predict token usage and costs before sending requests
- **Model Selection Explainer**: Understand why specific models were selected for requests

## Architecture

The component consists of several key modules:

1. **Budget Management System**: Manages budget definitions, tracking, and enforcement
2. **Model Cost Database**: Stores cost information for different AI models
3. **Token Estimation Library**: Predicts token usage for requests
4. **Model Selection Algorithm**: Selects the optimal model based on constraints
5. **Cost Analytics Engine**: Provides insights into AI usage costs

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (for local development)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and configure environment variables
3. Run the development environment:

```bash
docker-compose up -d
```

### Development

The development environment includes:

- PostgreSQL database with initial schema
- Redis for caching
- Adminer for database management (http://localhost:8080)
- Hot-reloading Node.js server

## API Documentation

### Budget Management API

- `GET /api/v1/budgets` - List all budgets
- `POST /api/v1/budgets` - Create a new budget
- `GET /api/v1/budgets/:id` - Get a specific budget
- `PUT /api/v1/budgets/:id` - Update a budget
- `DELETE /api/v1/budgets/:id` - Delete a budget
- `GET /api/v1/budgets/:id/status` - Get budget status
- `POST /api/v1/budgets/:id/usage` - Record usage against a budget
- `GET /api/v1/budgets/scope/:type/:id` - Get budgets for a scope

### Model Management API

- `GET /api/v1/models` - List all model cost profiles
- `POST /api/v1/models` - Create a new model cost profile
- `GET /api/v1/models/:id` - Get a specific model cost profile
- `PUT /api/v1/models/:id` - Update a model cost profile
- `DELETE /api/v1/models/:id` - Delete a model cost profile
- `GET /api/v1/models/provider/:provider` - Get models by provider
- `GET /api/v1/models/name/:name` - Get models by name
- `GET /api/v1/models/capabilities` - Get model capabilities
- `POST /api/v1/models/sync` - Sync model cost profiles from providers

### Cost Analysis API

- `GET /api/v1/cost-analysis/summary` - Get cost summary
- `GET /api/v1/cost-analysis/by-model` - Get costs grouped by model
- `GET /api/v1/cost-analysis/by-provider` - Get costs grouped by provider
- `GET /api/v1/cost-analysis/by-user` - Get costs grouped by user
- `GET /api/v1/cost-analysis/by-organization` - Get costs grouped by organization
- `GET /api/v1/cost-analysis/trends` - Get cost trends over time
- `GET /api/v1/cost-analysis/estimate` - Estimate cost for a request

### Model Selection API

- `POST /api/v1/models/select` - Select a model for a request
- `POST /api/v1/models/estimate` - Estimate cost for a request
- `GET /api/v1/models/fallbacks/:modelId` - Get fallback chain for a model

## Integration with RelayCore

The component integrates with RelayCore through:

1. **Steering Rule Extensions**: Adds cost-aware conditions and actions to steering rules
2. **HTTP Proxy Integration**: Intercepts requests to apply cost-aware model selection
3. **Budget Status API**: Provides budget status information to RelayCore components

## Integration with Auterity

The component integrates with Auterity through:

1. **Cost Attribution**: Attributes costs to agents, tasks, and workflows
2. **Budget Alerts**: Sends budget alerts through Auterity's notification system
3. **Cost Analytics**: Provides cost data for Auterity's observability system

## License

MIT