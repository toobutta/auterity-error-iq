# [CLINE-TASK] Automated Deployment Pipeline Implementation

## Task Assignment
**Tool**: Cline  
**Priority**: High  
**Estimated Time**: 8-10 hours  
**Status**: Ready for Implementation (After Task 7 and 15 completion)

## Task Overview
Build comprehensive automated deployment pipeline with GitHub Actions workflows for all three systems (AutoMatrix, RelayCore, NeuroWeaver), automated testing pipeline with cross-system integration tests, and staging/production deployment with approval gates.

## Requirements Reference
- **Requirement 6.1**: Automated deployment and CI/CD pipeline
- **Requirement 6.2**: Cross-system integration testing
- **Requirement 6.3**: Staging and production deployment with approval gates

## Implementation Specifications

### 1. GitHub Actions Workflow Structure

**File Structure**:
```
.github/
├── workflows/
│   ├── autmatrix-ci-cd.yml          # AutoMatrix deployment pipeline
│   ├── relaycore-ci-cd.yml          # RelayCore deployment pipeline
│   ├── neuroweaver-ci-cd.yml        # NeuroWeaver deployment pipeline
│   ├── integration-tests.yml        # Cross-system integration testing
│   ├── security-scan.yml            # Security vulnerability scanning
│   └── production-deploy.yml        # Production deployment with approvals
├── actions/
│   ├── setup-node/                  # Custom Node.js setup action
│   ├── setup-python/                # Custom Python setup action
│   ├── docker-build/                # Custom Docker build action
│   └── deploy-service/               # Custom deployment action
└── templates/
    ├── service-ci.yml               # Reusable CI template
    ├── service-cd.yml               # Reusable CD template
    └── integration-test.yml         # Integration test template
```

### 2. AutoMatrix CI/CD Pipeline

**File**: `.github/workflows/autmatrix-ci-cd.yml`
```yaml
name: AutoMatrix CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    paths: ['backend/**', 'frontend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**', 'frontend/**']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: autmatrix-backend
  IMAGE_NAME_FRONTEND: autmatrix-frontend

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-python
        with:
          python-version: '3.11'
          cache-dependency-path: backend/requirements.txt
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run database migrations
        run: |
          cd backend
          alembic upgrade head
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=html
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage.xml
          flags: backend
          name: autmatrix-backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node
        with:
          node-version: '18'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run linting
        run: |
          cd frontend
          npm run lint
      
      - name: Run type checking
        run: |
          cd frontend
          npm run type-check
      
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage
      
      - name: Build application
        run: |
          cd frontend
          npm run build
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: frontend/coverage/lcov.info
          flags: frontend
          name: autmatrix-frontend

  build-and-push:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/docker-build
        with:
          context: backend
          image-name: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME_BACKEND }}
          push: true
      
      - uses: ./.github/actions/docker-build
        with:
          context: frontend
          image-name: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME_FRONTEND }}
          push: true

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: ./.github/actions/deploy-service
        with:
          environment: staging
          service: autmatrix
          image-tag: ${{ github.sha }}
```

### 3. Cross-System Integration Testing

**File**: `.github/workflows/integration-tests.yml`
```yaml
name: Cross-System Integration Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
  push:
    branches: [main]
    paths: ['systems/**', 'backend/**', 'scripts/**']

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: integration_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Compose
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30  # Wait for services to be ready
      
      - name: Wait for services health
        run: |
          ./scripts/wait-for-services.sh
      
      - name: Run AutoMatrix → RelayCore integration tests
        run: |
          python scripts/test-autmatrix-relaycore-integration.py
        env:
          AUTMATRIX_URL: http://localhost:8000
          RELAYCORE_URL: http://localhost:3001
      
      - name: Run RelayCore → NeuroWeaver integration tests
        run: |
          python scripts/test-relaycore-neuroweaver-integration.py
        env:
          RELAYCORE_URL: http://localhost:3001
          NEUROWEAVER_URL: http://localhost:8001
      
      - name: Run end-to-end workflow tests
        run: |
          python scripts/test-e2e-workflows.py
        env:
          AUTMATRIX_URL: http://localhost:8000
          RELAYCORE_URL: http://localhost:3001
          NEUROWEAVER_URL: http://localhost:8001
      
      - name: Run performance benchmarks
        run: |
          python scripts/benchmark-cross-system-performance.py
      
      - name: Collect service logs
        if: failure()
        run: |
          docker-compose -f docker-compose.test.yml logs > integration-test-logs.txt
      
      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: |
            integration-test-logs.txt
            test-results/
            performance-benchmarks/

  security-integration-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run cross-system security tests
        run: |
          python scripts/test-cross-system-security.py
      
      - name: Test authentication flow across systems
        run: |
          python scripts/test-unified-auth-integration.py
      
      - name: Validate encryption in transit
        run: |
          python scripts/test-encryption-integration.py
```

### 4. Production Deployment Pipeline

**File**: `.github/workflows/production-deploy.yml`
```yaml
name: Production Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        type: string
      services:
        description: 'Services to deploy (comma-separated)'
        required: true
        default: 'autmatrix,relaycore,neuroweaver'
        type: string

env:
  REGISTRY: ghcr.io

jobs:
  pre-deployment-checks:
    runs-on: ubuntu-latest
    outputs:
      deploy-approved: ${{ steps.approval.outputs.approved }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate version tag
        run: |
          if ! git tag --list | grep -q "^${{ inputs.version }}$"; then
            echo "Version tag ${{ inputs.version }} does not exist"
            exit 1
          fi
      
      - name: Run security scan
        run: |
          docker run --rm -v $(pwd):/workspace \
            securecodewarrior/docker-security-scan:latest \
            /workspace
      
      - name: Check deployment readiness
        run: |
          python scripts/check-deployment-readiness.py \
            --version ${{ inputs.version }} \
            --services ${{ inputs.services }}
      
      - name: Request deployment approval
        id: approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: ${{ vars.PRODUCTION_APPROVERS }}
          minimum-approvals: 2
          issue-title: "Production Deployment: ${{ inputs.version }}"
          issue-body: |
            ## Production Deployment Request
            
            **Version**: ${{ inputs.version }}
            **Services**: ${{ inputs.services }}
            **Requested by**: ${{ github.actor }}
            
            ### Pre-deployment Checks
            - ✅ Security scan passed
            - ✅ Integration tests passed
            - ✅ Performance benchmarks met
            - ✅ Version tag validated
            
            Please review and approve this deployment.

  deploy-production:
    needs: pre-deployment-checks
    runs-on: ubuntu-latest
    environment: production
    if: needs.pre-deployment-checks.outputs.deploy-approved == 'true'
    
    strategy:
      matrix:
        service: [autmatrix, relaycore, neuroweaver]
      fail-fast: false
    
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
      
      - name: Deploy ${{ matrix.service }}
        uses: ./.github/actions/deploy-service
        with:
          environment: production
          service: ${{ matrix.service }}
          image-tag: ${{ inputs.version }}
          health-check-url: ${{ vars[format('{0}_HEALTH_URL', upper(matrix.service))] }}
      
      - name: Run post-deployment tests
        run: |
          python scripts/test-production-deployment.py \
            --service ${{ matrix.service }} \
            --version ${{ inputs.version }}
      
      - name: Update deployment status
        run: |
          python scripts/update-deployment-status.py \
            --service ${{ matrix.service }} \
            --version ${{ inputs.version }} \
            --status deployed

  post-deployment-validation:
    needs: deploy-production
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run full system health check
        run: |
          python scripts/validate-production-health.py \
            --services ${{ inputs.services }}
      
      - name: Run smoke tests
        run: |
          python scripts/run-production-smoke-tests.py
      
      - name: Update monitoring dashboards
        run: |
          python scripts/update-monitoring-dashboards.py \
            --version ${{ inputs.version }}
      
      - name: Send deployment notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          text: |
            Production deployment completed successfully!
            Version: ${{ inputs.version }}
            Services: ${{ inputs.services }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 5. Custom GitHub Actions

**File**: `.github/actions/setup-python/action.yml`
```yaml
name: 'Setup Python Environment'
description: 'Set up Python with caching and dependencies'
inputs:
  python-version:
    description: 'Python version to use'
    required: true
  cache-dependency-path:
    description: 'Path to requirements file'
    required: true

runs:
  using: 'composite'
  steps:
    - uses: actions/setup-python@v4
      with:
        python-version: ${{ inputs.python-version }}
        cache: 'pip'
        cache-dependency-path: ${{ inputs.cache-dependency-path }}
    
    - name: Upgrade pip
      run: python -m pip install --upgrade pip
      shell: bash
    
    - name: Install build tools
      run: pip install wheel setuptools
      shell: bash
```

**File**: `.github/actions/docker-build/action.yml`
```yaml
name: 'Docker Build and Push'
description: 'Build and optionally push Docker image'
inputs:
  context:
    description: 'Build context directory'
    required: true
  image-name:
    description: 'Full image name with registry'
    required: true
  push:
    description: 'Whether to push the image'
    required: false
    default: 'false'

runs:
  using: 'composite'
  steps:
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      if: inputs.push == 'true'
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ github.token }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ inputs.image-name }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: ${{ inputs.context }}
        push: ${{ inputs.push }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

### 6. Integration Test Scripts

**File**: `scripts/test-autmatrix-relaycore-integration.py`
```python
#!/usr/bin/env python3
"""
AutoMatrix → RelayCore integration tests
"""
import asyncio
import aiohttp
import json
import os
from typing import Dict, Any

class AutoMatrixRelayCoreTester:
    def __init__(self):
        self.autmatrix_url = os.getenv('AUTMATRIX_URL', 'http://localhost:8000')
        self.relaycore_url = os.getenv('RELAYCORE_URL', 'http://localhost:3001')
        self.auth_token = None
    
    async def authenticate(self) -> str:
        """Authenticate with AutoMatrix and get JWT token"""
        async with aiohttp.ClientSession() as session:
            auth_data = {
                "username": "test@example.com",
                "password": "testpassword"
            }
            async with session.post(
                f"{self.autmatrix_url}/api/auth/login",
                json=auth_data
            ) as response:
                if response.status != 200:
                    raise Exception(f"Authentication failed: {response.status}")
                data = await response.json()
                self.auth_token = data['access_token']
                return self.auth_token
    
    async def test_ai_request_routing(self) -> Dict[str, Any]:
        """Test AI request routing through RelayCore"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Create a workflow that uses AI
        workflow_data = {
            "name": "Test AI Workflow",
            "description": "Integration test workflow",
            "steps": [
                {
                    "type": "ai_task",
                    "prompt": "Summarize the benefits of electric vehicles",
                    "model_preference": "gpt-3.5-turbo"
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            # Create workflow
            async with session.post(
                f"{self.autmatrix_url}/api/workflows",
                json=workflow_data,
                headers=headers
            ) as response:
                if response.status != 201:
                    raise Exception(f"Workflow creation failed: {response.status}")
                workflow = await response.json()
            
            # Execute workflow
            async with session.post(
                f"{self.autmatrix_url}/api/workflows/{workflow['id']}/execute",
                headers=headers
            ) as response:
                if response.status != 200:
                    raise Exception(f"Workflow execution failed: {response.status}")
                execution = await response.json()
            
            # Wait for completion and verify RelayCore was used
            execution_id = execution['id']
            for _ in range(30):  # Wait up to 30 seconds
                async with session.get(
                    f"{self.autmatrix_url}/api/executions/{execution_id}",
                    headers=headers
                ) as response:
                    execution_status = await response.json()
                    if execution_status['status'] == 'completed':
                        break
                    await asyncio.sleep(1)
            
            # Verify RelayCore handled the request
            async with session.get(
                f"{self.relaycore_url}/api/requests",
                headers=headers
            ) as response:
                relaycore_requests = await response.json()
                
            return {
                "workflow_id": workflow['id'],
                "execution_id": execution_id,
                "execution_status": execution_status['status'],
                "relaycore_requests": len(relaycore_requests),
                "success": execution_status['status'] == 'completed' and len(relaycore_requests) > 0
            }

async def main():
    tester = AutoMatrixRelayCoreTester()
    
    try:
        # Authenticate
        await tester.authenticate()
        print("✅ Authentication successful")
        
        # Test AI request routing
        result = await tester.test_ai_request_routing()
        if result['success']:
            print("✅ AI request routing test passed")
            print(f"   Workflow: {result['workflow_id']}")
            print(f"   Execution: {result['execution_id']}")
            print(f"   RelayCore requests: {result['relaycore_requests']}")
        else:
            print("❌ AI request routing test failed")
            print(f"   Execution status: {result['execution_status']}")
            exit(1)
        
        print("\n🎉 All AutoMatrix → RelayCore integration tests passed!")
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())
```

## Success Criteria

### Functional Requirements
- ✅ All three systems have complete CI/CD pipelines
- ✅ Cross-system integration tests run automatically
- ✅ Staging deployments work without manual intervention
- ✅ Production deployments require proper approvals
- ✅ Rollback procedures are automated and tested
- ✅ Security scans integrated into pipeline

### Performance Requirements
- ✅ CI pipeline completes in < 15 minutes
- ✅ Integration tests complete in < 30 minutes
- ✅ Deployment time < 10 minutes per service
- ✅ Zero-downtime deployments achieved

### Quality Requirements
- ✅ Test coverage > 90% for all services
- ✅ All linting and type checking passes
- ✅ Security scans show no critical vulnerabilities
- ✅ Performance benchmarks meet requirements

## Dependencies
- **Task 7**: NeuroWeaver setup must be complete
- **Task 15**: Tool communication system for automated handoffs
- **Existing CI/CD**: Build on current GitHub Actions setup
- **Docker**: All services must be containerized

## Files to Create
1. **GitHub Actions workflows** - Complete CI/CD pipelines
2. **Custom actions** - Reusable deployment components
3. **Integration test scripts** - Cross-system testing
4. **Deployment scripts** - Production deployment automation
5. **Configuration files** - Environment-specific configs
6. **Documentation** - Deployment and maintenance guides

---

**Cline**: Implement this comprehensive automated deployment pipeline after completing Tasks 7 and 15. Focus on creating robust, reliable automation that ensures quality and security throughout the deployment process.