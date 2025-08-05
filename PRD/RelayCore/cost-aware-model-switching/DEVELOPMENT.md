# Development Environment Setup

This document provides instructions for setting up the development environment for the Cost-Aware Model Switching component.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm 9+
- Git

## Getting Started

1. Clone the repository:

```bash
git clone <repository-url>
cd cost-aware-model-switching
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Start the development environment:

```bash
./scripts/start-dev.sh
```

Or using Make:

```bash
make start
```

This will:
- Start PostgreSQL, Redis, and the application in Docker containers
- Set up the database schema
- Start the application in development mode with hot reloading

4. Seed the database with test data:

```bash
./scripts/seed-db.sh
```

Or using Make:

```bash
make seed
```

5. Access the API at http://localhost:3002

6. Access the database admin interface at http://localhost:8080
   - System: PostgreSQL
   - Server: postgres
   - Username: postgres
   - Password: postgres
   - Database: cost_aware_db

## Development Workflow

### Running Tests

```bash
npm test
```

Or using Make:

```bash
make test
```

### Building the Application

```bash
npm run build
```

Or using Make:

```bash
make build
```

### Stopping the Development Environment

```bash
docker-compose down
```

Or using Make:

```bash
make stop
```

### Restarting the Development Environment

```bash
docker-compose down
./scripts/start-dev.sh
```

Or using Make:

```bash
make restart
```

### Viewing Logs

```bash
docker-compose logs -f
```

Or using Make:

```bash
make logs
```

## Project Structure

```
cost-aware-model-switching/
├── config/               # Configuration files
├── scripts/              # Utility scripts
├── src/                  # Source code
│   ├── integration/      # Integration with RelayCore and Auterity
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── validators/       # Request validators
│   ├── app.ts            # Express application
│   ├── cache.ts          # Redis cache
│   ├── database.ts       # Database connection
│   └── index.ts          # Application entry point
├── tests/                # Test files
├── .env.example          # Example environment variables
├── .gitignore            # Git ignore file
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
├── jest.config.js        # Jest configuration
├── Makefile              # Make targets
├── package.json          # npm package configuration
├── README.md             # Project README
└── tsconfig.json         # TypeScript configuration
```

## Integration with RelayCore and Auterity

The Cost-Aware Model Switching component integrates with:

1. **RelayCore**: Through the steering rule engine extension
2. **Auterity**: Through the budget management and cost analysis APIs

To enable integrations, set `ENABLE_INTEGRATIONS=true` in your `.env` file.

## Database Schema

The component uses the following database tables:

1. `budget_configs`: Budget configurations
2. `model_cost_profiles`: Model cost profiles
3. `cost_tracking`: Cost tracking records
4. `budget_alerts`: Budget alerts
5. `model_selection_history`: Model selection history
6. `token_estimation_cache`: Token estimation cache

See `scripts/init.sql` for the complete schema.

## API Documentation

See the [README.md](README.md) file for API documentation.