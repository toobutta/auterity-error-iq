# NeuroWeaver Development Environment Setup Guide

This document provides instructions for setting up the development environment for the NeuroWeaver platform.

## Overview

The NeuroWeaver development environment is designed to support the template-first approach and parallel development tracks. It provides a consistent environment for developing, testing, and debugging the platform components.

## Prerequisites

Before setting up the development environment, ensure you have:

1. **Docker**: Docker and Docker Compose installed
2. **Git**: Git installed for version control
3. **Python**: Python 3.10+ installed
4. **AWS CLI**: AWS CLI installed and configured (optional, for cloud integration)
5. **kubectl**: Kubernetes CLI installed (optional, for Kubernetes integration)
6. **Helm**: Helm installed (optional, for Kubernetes integration)

## Local Development Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/neuroweaver.git
cd neuroweaver
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# Install component-specific dependencies
for component in template-system auto-specializer inference-weaver dataset-refinement costguard-dashboard workflow-ui; do
  pip install -r requirements/$component.txt
done
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```
# Environment
ENVIRONMENT=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=neuroweaver
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis

# S3
S3_BUCKET=neuroweaver-dev-data
AWS_REGION=us-west-2
```

### 5. Start Development Services with Docker Compose

```bash
docker-compose up -d
```

This will start the following services:
- PostgreSQL database
- Redis cache
- MinIO (S3-compatible storage)

### 6. Initialize Database

```bash
python src/backend/database/init_db.py
```

### 7. Start Development Server

```bash
# Start API server
python src/backend/api/main.py

# In another terminal, start frontend development server
cd src/frontend
npm install
npm run dev
```

## Docker-based Development Environment

For a fully containerized development environment:

```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## Component-specific Development

### Template System Development

```bash
# Start template system service
docker-compose up -d template-system

# Run template validation
python src/template-system/tools/validate_templates.py --directory vertical_kits/automotive/templates

# Test templates with sample data
python src/template-system/tools/test_templates.py --directory vertical_kits/automotive/templates
```

### Auto-Specializer Development

```bash
# Start auto-specializer service
docker-compose up -d auto-specializer

# Run fine-tuning with a test configuration
python src/models/specializer/run_fine_tuning.py --config examples/service_advisor_config.yaml
```

### Inference Weaver Development

```bash
# Start inference-weaver service
docker-compose up -d inference-weaver

# Test inference with a sample query
curl -X POST http://localhost:8000/api/v1/inference \
  -H "Content-Type: application/json" \
  -d '{"model": "mistral-service-advisor", "prompt": "How do I perform an oil change?"}'
```

### CostGuard Dashboard Development

```bash
# Start costguard-dashboard service
docker-compose up -d costguard-dashboard

# Access dashboard
open http://localhost:8050
```

### Workflow UI Development

```bash
# Start workflow-ui service
docker-compose up -d workflow-ui

# Access UI
open http://localhost:8080
```

## Testing

### Running Unit Tests

```bash
# Run all tests
pytest

# Run component-specific tests
pytest src/template-system/tests/
pytest src/models/specializer/tests/
pytest src/models/inference/tests/
```

### Running Integration Tests

```bash
# Start integration test environment
docker-compose -f docker-compose.integration.yml up -d

# Run integration tests
pytest integration_tests/
```

## Debugging

### Debugging Python Services

1. Add the following to your Python code where you want to set a breakpoint:
   ```python
   import pdb; pdb.set_trace()
   ```

2. Run the service in debug mode:
   ```bash
   python -m src.backend.api.main
   ```

### Debugging Docker Containers

```bash
# Access container shell
docker-compose exec template-system bash

# View container logs
docker-compose logs -f template-system
```

## Working with Templates

### Creating a New Template

```bash
# Create a new template based on an existing one
python src/template-system/tools/create_template.py \
  --base vertical_kits/automotive/templates/service_advisor.yaml \
  --output vertical_kits/automotive/templates/custom_template.yaml \
  --name "custom_template" \
  --description "Custom template for specific use case"
```

### Testing a Template

```bash
# Validate template
python src/template-system/tools/validate_template.py \
  --template vertical_kits/automotive/templates/custom_template.yaml

# Test template with sample data
python src/template-system/tools/test_template.py \
  --template vertical_kits/automotive/templates/custom_template.yaml \
  --data examples/sample_data.jsonl
```

## Working with Models

### Fine-tuning a Model

```bash
# Create a configuration file
python src/template-system/tools/create_config.py \
  --template vertical_kits/automotive/templates/service_advisor.yaml \
  --output service_advisor_config.yaml

# Edit the configuration file as needed

# Run fine-tuning
python src/models/specializer/run_fine_tuning.py \
  --config service_advisor_config.yaml
```

### Deploying a Model

```bash
# Package model for deployment
python src/models/inference/package_model.py \
  --model ./checkpoints/mistral-service-advisor \
  --output ./deployment/mistral-service-advisor \
  --quantization int8

# Deploy model locally
python src/models/inference/deploy_model_local.py \
  --model ./deployment/mistral-service-advisor
```

## Version Control Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/my-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "Add my feature"
   ```

3. Push changes to GitHub:
   ```bash
   git push -u origin feature/my-feature
   ```

4. Create a pull request to `develop` on GitHub

5. After approval and merge, update local `develop` branch:
   ```bash
   git checkout develop
   git pull
   ```

## Conclusion

This development environment setup provides a comprehensive framework for developing the NeuroWeaver platform with a template-first approach. By leveraging Docker and containerization, it ensures a consistent development experience across different components and development tracks.