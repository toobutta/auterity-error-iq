---
description: Repository Information Overview
alwaysApply: false
---

# Repository Information Overview

## Repository Summary

Auterity is a unified workspace for workflow automation platform, consolidating multiple projects into a single, maintainable codebase. The platform consists of three main systems: AutoMatrix (core workflow engine), RelayCore (AI routing hub), and NeuroWeaver (model specialization).

## Repository Structure

- **backend**: FastAPI-based workflow management backend
- **frontend**: React-based workflow builder UI
- **systems**: Contains RelayCore and NeuroWeaver subsystems
- **scripts**: Deployment, testing, and utility scripts
- **monitoring**: Prometheus, Grafana, and alerting configurations
- **docs**: Project documentation and architecture specifications
- **nginx**: Web server configuration
- **infra/infrastructure**: Infrastructure as Code (IaC) configurations

## Main Repository Components

- **AutoMatrix**: Core workflow engine (backend + frontend)
- **RelayCore**: AI routing and cost optimization system
- **NeuroWeaver**: Model specialization and training system
- **Monitoring**: Observability stack with Prometheus, Grafana, and Jaeger

## Projects

### AutoMatrix Backend

**Configuration File**: backend/pyproject.toml, backend/requirements.txt

#### Language & Runtime

**Language**: Python
**Version**: 3.12.3
**Build System**: pip
**Package Manager**: pip

#### Dependencies

**Main Dependencies**:

- fastapi==0.104.1
- sqlalchemy==2.0.23
- alembic==1.12.1
- pydantic==2.5.0
- openai==1.3.7
- psycopg2-binary==2.9.9

#### Build & Installation

```bash
cd backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Docker

**Dockerfile**: backend/Dockerfile, backend/Dockerfile.prod
**Configuration**: Runs on uvicorn in development, gunicorn in production

#### Testing

**Framework**: pytest
**Test Location**: backend/app/tests
**Run Command**:

```bash
cd backend && pytest
```

### AutoMatrix Frontend

**Configuration File**: frontend/package.json

#### Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.2.2
**Build System**: Vite
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:

- react: ^18.2.0
- react-flow-renderer: ^10.3.17
- reactflow: ^11.11.4
- tailwindcss: ^3.3.5
- axios: ^1.6.0

#### Build & Installation

```bash
cd frontend && npm install
npm run dev  # Development
npm run build  # Production
```

#### Docker

**Dockerfile**: frontend/Dockerfile, frontend/Dockerfile.prod
**Configuration**: Uses Vite for development, nginx for production

#### Testing

**Framework**: Vitest
**Test Location**: frontend/src/tests
**Run Command**:

```bash
cd frontend && npm test
```

### RelayCore

**Configuration File**: systems/relaycore/package.json

#### Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.1.6
**Build System**: tsc
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:

- express: ^4.18.2
- axios: ^1.5.0
- pg: ^8.11.3
- winston: ^3.10.0
- opentelemetry packages for tracing

#### Build & Installation

```bash
cd systems/relaycore && npm install
npm run dev  # Development
npm run build && npm start  # Production
```

#### Docker

**Dockerfile**: systems/relaycore/Dockerfile
**Configuration**: Uses ts-node-dev for development, node for production

#### Testing

**Framework**: Jest
**Test Location**: systems/relaycore/src/**tests**
**Run Command**:

```bash
cd systems/relaycore && npm test
```

### NeuroWeaver Backend

**Configuration File**: systems/neuroweaver/backend/requirements.txt

#### Language & Runtime

**Language**: Python
**Version**: 3.12.3 (same as main backend)
**Build System**: pip
**Package Manager**: pip

#### Dependencies

**Main Dependencies**:

- fastapi==0.104.1
- sqlalchemy[asyncio]==2.0.23
- asyncpg==0.29.0
- alembic==1.12.1
- pydantic==2.5.0

#### Build & Installation

```bash
cd systems/neuroweaver/backend && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### NeuroWeaver Frontend

**Configuration File**: systems/neuroweaver/frontend/package.json

#### Language & Runtime

**Language**: TypeScript
**Version**: TypeScript 5.1.6
**Build System**: Next.js
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:

- next: ^15.4.5
- react: ^18.2.0
- @mui/material: ^5.14.5
- axios: ^1.5.0
- swr: ^2.2.2

#### Build & Installation

```bash
cd systems/neuroweaver/frontend && npm install
npm run dev  # Development
npm run build && npm start  # Production
```

#### Testing

**Framework**: Jest
**Run Command**:

```bash
cd systems/neuroweaver/frontend && npm test
```

## Testing Framework

### End-to-End Testing

**Framework**: Playwright
**Test Location**: tests/e2e
**Run Command**:

```bash
cd tests/e2e && npm test
```

### Comprehensive Testing

**Automation Script**: scripts/test-automation.sh
**Features**:

- Unit tests with coverage analysis
- Integration tests
- End-to-end tests with Playwright
- Security vulnerability scanning
- Performance testing
- Quality gates with configurable thresholds

**Run Command**:

```bash
./scripts/test-automation.sh
```

### Staging Validation

**Validation Script**: scripts/staging-deployment-validation.sh
**Features**:

- Service health checks
- API endpoint validation
- Frontend application validation
- SSL certificate validation
- Database connectivity checks
- Smoke tests

**Run Command**:

```bash
./scripts/staging-deployment-validation.sh
```

### Infrastructure

**Type**: Docker Compose, AWS CloudFormation, Terraform

#### Key Resources

**Main Files**:

- docker-compose.yml
- docker-compose.prod.yml
- infrastructure/cognito-stack.yml
- infra/terraform.md

#### Usage & Operations

```bash
# Development environment
docker-compose up

# Production environment
docker-compose -f docker-compose.prod.yml up -d
```
