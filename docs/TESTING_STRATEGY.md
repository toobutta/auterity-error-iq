# Testing Strategy Documentation

**Document Version**: 1.0  
**Last Updated**: August 8, 2025  
**Maintained By**: QA Team  

## Overview

The Auterity Unified Platform employs a comprehensive testing strategy that ensures code quality, reliability, and maintainability across all systems. Our approach combines automated testing at multiple levels with manual testing for user experience validation.

---

## Testing Philosophy

### Core Principles
1. **Test Early and Often**: Tests are written alongside code development
2. **Fail Fast**: Quick feedback loops to catch issues early
3. **Test in Production**: Comprehensive monitoring and observability
4. **User-Centric**: Focus on user experience and business value
5. **Maintainable Tests**: Tests are treated as first-class code

### Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  <- High confidence, slow, expensive
                    │   (Few tests)   │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │  <- Medium confidence, medium speed
                  │   (Some tests)        │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │  <- Fast, cheap, many tests
              │       (Many tests)              │
              └─────────────────────────────────┘
```

---

## Testing Levels

### 1. Unit Testing

#### Frontend Unit Tests
**Framework**: Vitest + Testing Library  
**Location**: `frontend/src/**/__tests__/`

```typescript
// Example: Component unit test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { WorkflowCard } from '../WorkflowCard';

describe('WorkflowCard', () => {
  const mockWorkflow = {
    id: '1',
    name: 'Test Workflow',
    description: 'Test description',
    status: 'active',
    created_at: '2025-08-08T10:00:00Z'
  };

  const mockProps = {
    workflow: mockWorkflow,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onExecute: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders workflow information correctly', () => {
    render(<WorkflowCard {...mockProps} />);
    
    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('calls onExecute when execute button is clicked', async () => {
    render(<WorkflowCard {...mockProps} />);
    
    const executeButton = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(mockProps.onExecute).toHaveBeenCalledWith('1');
    });
  });

  it('shows loading state during execution', async () => {
    const slowExecute = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<WorkflowCard {...mockProps} onExecute={slowExecute} />);
    
    const executeButton = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(executeButton);
    
    expect(screen.getByText(/executing/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/executing/i)).not.toBeInTheDocument();
    });
  });

  it('handles execution errors gracefully', async () => {
    const failingExecute = vi.fn(() => Promise.reject(new Error('Execution failed')));
    render(<WorkflowCard {...mockProps} onExecute={failingExecute} />);
    
    const executeButton = screen.getByRole('button', { name: /execute/i });
    fireEvent.click(executeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

#### Hook Testing
```typescript
// Example: Custom hook test
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useWorkflows } from '../hooks/useWorkflows';
import { WorkflowService } from '../api/workflows';

// Mock the API service
vi.mock('../api/workflows');

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches workflows on mount', async () => {
    const mockWorkflows = [
      { id: '1', name: 'Workflow 1' },
      { id: '2', name: 'Workflow 2' }
    ];
    
    WorkflowService.getWorkflows.mockResolvedValue({
      workflows: mockWorkflows,
      total: 2
    });

    const { result } = renderHook(() => useWorkflows());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.workflows).toEqual(mockWorkflows);
      expect(result.current.error).toBeNull();
    });
  });

  it('handles fetch errors', async () => {
    const errorMessage = 'Failed to fetch workflows';
    WorkflowService.getWorkflows.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useWorkflows());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.workflows).toEqual([]);
    });
  });

  it('creates workflow successfully', async () => {
    const newWorkflow = { id: '3', name: 'New Workflow' };
    WorkflowService.createWorkflow.mockResolvedValue(newWorkflow);

    const { result } = renderHook(() => useWorkflows());

    await result.current.createWorkflow({ name: 'New Workflow' });

    await waitFor(() => {
      expect(result.current.workflows).toContainEqual(newWorkflow);
    });
  });
});
```

#### Backend Unit Tests
**Framework**: pytest + pytest-asyncio  
**Location**: `backend/tests/`

```python
# Example: Service unit test
import pytest
from unittest.mock import AsyncMock, patch
from app.services.workflow_service import WorkflowService
from app.models.workflow import Workflow
from app.schemas import WorkflowCreate

class TestWorkflowService:
    @pytest.fixture
    def workflow_service(self, db_session):
        return WorkflowService(db_session)

    @pytest.fixture
    def sample_workflow_data(self):
        return WorkflowCreate(
            name="Test Workflow",
            description="Test description",
            definition={
                "nodes": [{"id": "start", "type": "start"}],
                "edges": []
            }
        )

    async def test_create_workflow_success(
        self, workflow_service, sample_workflow_data, test_user
    ):
        """Test successful workflow creation."""
        workflow = await workflow_service.create_workflow(
            sample_workflow_data, test_user.id
        )
        
        assert workflow.name == "Test Workflow"
        assert workflow.description == "Test description"
        assert workflow.created_by == test_user.id
        assert workflow.is_active is True

    async def test_create_workflow_with_invalid_definition(
        self, workflow_service, test_user
    ):
        """Test workflow creation with invalid definition."""
        invalid_data = WorkflowCreate(
            name="Invalid Workflow",
            definition={"invalid": "structure"}
        )
        
        with pytest.raises(ValidationError) as exc_info:
            await workflow_service.create_workflow(invalid_data, test_user.id)
        
        assert "Invalid workflow definition" in str(exc_info.value)

    async def test_get_user_workflows(
        self, workflow_service, test_user, db_session
    ):
        """Test retrieving user workflows."""
        # Create test workflows
        workflow1 = Workflow(
            name="Workflow 1",
            created_by=test_user.id,
            definition={"nodes": [], "edges": []}
        )
        workflow2 = Workflow(
            name="Workflow 2",
            created_by=test_user.id,
            definition={"nodes": [], "edges": []}
        )
        
        db_session.add_all([workflow1, workflow2])
        await db_session.commit()
        
        workflows = await workflow_service.get_user_workflows(test_user.id)
        
        assert len(workflows) == 2
        assert all(w.created_by == test_user.id for w in workflows)

    @patch('app.services.workflow_service.WorkflowExecutor')
    async def test_execute_workflow(
        self, mock_executor, workflow_service, test_user
    ):
        """Test workflow execution."""
        # Setup mock
        mock_execution = AsyncMock()
        mock_execution.id = "exec-123"
        mock_execution.status = "running"
        mock_executor.return_value.execute.return_value = mock_execution
        
        # Create workflow
        workflow_data = WorkflowCreate(
            name="Test Workflow",
            definition={"nodes": [{"id": "start", "type": "start"}], "edges": []}
        )
        workflow = await workflow_service.create_workflow(workflow_data, test_user.id)
        
        # Execute workflow
        execution = await workflow_service.execute_workflow(
            workflow.id, {"input": "test"}, test_user.id
        )
        
        assert execution.id == "exec-123"
        assert execution.status == "running"
        mock_executor.return_value.execute.assert_called_once()
```

### 2. Integration Testing

#### API Integration Tests
```python
# Example: API integration test
import pytest
from httpx import AsyncClient
from app.main import app

class TestWorkflowAPI:
    @pytest.fixture
    async def client(self):
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac

    @pytest.fixture
    def auth_headers(self, test_user):
        token = create_access_token(data={"sub": test_user.email})
        return {"Authorization": f"Bearer {token}"}

    async def test_create_workflow_endpoint(
        self, client: AsyncClient, auth_headers, db_session
    ):
        """Test workflow creation endpoint."""
        workflow_data = {
            "name": "Integration Test Workflow",
            "description": "Test description",
            "definition": {
                "nodes": [{"id": "start", "type": "start"}],
                "edges": []
            }
        }
        
        response = await client.post(
            "/api/workflows/",
            json=workflow_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Integration Test Workflow"
        assert data["is_active"] is True
        assert "id" in data

    async def test_list_workflows_endpoint(
        self, client: AsyncClient, auth_headers, sample_workflows
    ):
        """Test workflow listing endpoint."""
        response = await client.get("/api/workflows/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "workflows" in data
        assert "total" in data
        assert len(data["workflows"]) > 0

    async def test_execute_workflow_endpoint(
        self, client: AsyncClient, auth_headers, sample_workflow
    ):
        """Test workflow execution endpoint."""
        execution_data = {
            "input_data": {"customer_id": "123"},
            "execution_mode": "async"
        }
        
        response = await client.post(
            f"/api/workflows/{sample_workflow.id}/execute",
            json=execution_data,
            headers=auth_headers
        )
        
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "running"
        assert "execution_id" in data

    async def test_unauthorized_access(self, client: AsyncClient):
        """Test unauthorized access to protected endpoints."""
        response = await client.get("/api/workflows/")
        assert response.status_code == 401

    async def test_invalid_workflow_data(
        self, client: AsyncClient, auth_headers
    ):
        """Test validation errors."""
        invalid_data = {
            "name": "",  # Empty name should fail validation
            "definition": {"invalid": "structure"}
        }
        
        response = await client.post(
            "/api/workflows/",
            json=invalid_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
```

#### Database Integration Tests
```python
# Example: Database integration test
import pytest
from sqlalchemy import text
from app.database import get_db
from app.models.workflow import Workflow
from app.models.user import User

class TestDatabaseIntegration:
    async def test_workflow_user_relationship(self, db_session, test_user):
        """Test workflow-user relationship."""
        workflow = Workflow(
            name="Test Workflow",
            description="Test description",
            definition={"nodes": [], "edges": []},
            created_by=test_user.id
        )
        
        db_session.add(workflow)
        await db_session.commit()
        await db_session.refresh(workflow)
        
        # Test relationship loading
        loaded_workflow = await db_session.get(Workflow, workflow.id)
        assert loaded_workflow.created_by == test_user.id
        
        # Test reverse relationship
        user_workflows = await db_session.execute(
            text("SELECT * FROM workflows WHERE created_by = :user_id"),
            {"user_id": test_user.id}
        )
        workflows = user_workflows.fetchall()
        assert len(workflows) == 1
        assert workflows[0].name == "Test Workflow"

    async def test_cascade_deletes(self, db_session, test_user):
        """Test cascade deletion behavior."""
        workflow = Workflow(
            name="Test Workflow",
            created_by=test_user.id,
            definition={"nodes": [], "edges": []}
        )
        
        db_session.add(workflow)
        await db_session.commit()
        workflow_id = workflow.id
        
        # Delete user
        await db_session.delete(test_user)
        await db_session.commit()
        
        # Verify workflow is also deleted (if cascade is configured)
        remaining_workflow = await db_session.get(Workflow, workflow_id)
        assert remaining_workflow is None

    async def test_concurrent_access(self, db_session_factory):
        """Test concurrent database access."""
        import asyncio
        
        async def create_workflow(session_factory, user_id, name):
            async with session_factory() as session:
                workflow = Workflow(
                    name=name,
                    created_by=user_id,
                    definition={"nodes": [], "edges": []}
                )
                session.add(workflow)
                await session.commit()
                return workflow.id
        
        user = User(email="test@example.com", hashed_password="test")
        async with db_session_factory() as session:
            session.add(user)
            await session.commit()
            user_id = user.id
        
        # Create workflows concurrently
        tasks = [
            create_workflow(db_session_factory, user_id, f"Workflow {i}")
            for i in range(5)
        ]
        
        workflow_ids = await asyncio.gather(*tasks)
        assert len(workflow_ids) == 5
        assert len(set(workflow_ids)) == 5  # All IDs should be unique
```

### 3. End-to-End Testing

#### Frontend E2E Tests
**Framework**: Playwright  
**Location**: `tests/e2e/`

```typescript
// Example: E2E test
import { test, expect } from '@playwright/test';

test.describe('Workflow Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('create new workflow', async ({ page }) => {
    // Navigate to workflows page
    await page.click('[data-testid="workflows-nav"]');
    await expect(page).toHaveURL('/workflows');

    // Click create workflow button
    await page.click('[data-testid="create-workflow"]');
    await expect(page).toHaveURL('/workflow-builder');

    // Fill workflow details
    await page.fill('[data-testid="workflow-name"]', 'E2E Test Workflow');
    await page.fill('[data-testid="workflow-description"]', 'Created by E2E test');

    // Add workflow nodes
    await page.click('[data-testid="add-node-start"]');
    await page.click('[data-testid="add-node-email"]');

    // Connect nodes
    await page.dragAndDrop(
      '[data-testid="node-start"] .source-handle',
      '[data-testid="node-email"] .target-handle'
    );

    // Save workflow
    await page.click('[data-testid="save-workflow"]');

    // Verify workflow is created
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Workflow created successfully'
    );

    // Navigate back to workflows list
    await page.click('[data-testid="workflows-nav"]');
    
    // Verify workflow appears in list
    await expect(page.locator('[data-testid="workflow-list"]')).toContainText(
      'E2E Test Workflow'
    );
  });

  test('execute workflow', async ({ page }) => {
    // Navigate to workflows page
    await page.goto('/workflows');

    // Find and click on test workflow
    const workflowCard = page.locator('[data-testid="workflow-card"]').first();
    await workflowCard.click();

    // Click execute button
    await page.click('[data-testid="execute-workflow"]');

    // Fill execution parameters
    await page.fill('[data-testid="input-customer-email"]', 'customer@example.com');
    await page.fill('[data-testid="input-customer-name"]', 'John Doe');

    // Start execution
    await page.click('[data-testid="start-execution"]');

    // Wait for execution to complete
    await expect(page.locator('[data-testid="execution-status"]')).toContainText(
      'completed',
      { timeout: 30000 }
    );

    // Verify execution results
    await expect(page.locator('[data-testid="execution-results"]')).toBeVisible();
  });

  test('workflow builder functionality', async ({ page }) => {
    await page.goto('/workflow-builder');

    // Test node palette
    await expect(page.locator('[data-testid="node-palette"]')).toBeVisible();

    // Test adding nodes
    await page.dragAndDrop(
      '[data-testid="palette-start-node"]',
      '[data-testid="canvas"]'
    );

    await page.dragAndDrop(
      '[data-testid="palette-email-node"]',
      '[data-testid="canvas"]'
    );

    // Test node configuration
    await page.click('[data-testid="node-email"]');
    await expect(page.locator('[data-testid="node-config-panel"]')).toBeVisible();

    await page.fill('[data-testid="config-email-template"]', 'Welcome Email');
    await page.click('[data-testid="config-save"]');

    // Test connection creation
    await page.hover('[data-testid="node-start"]');
    await page.dragAndDrop(
      '[data-testid="node-start"] .source-handle',
      '[data-testid="node-email"] .target-handle'
    );

    // Verify connection is created
    await expect(page.locator('[data-testid="edge"]')).toBeVisible();

    // Test workflow validation
    await page.click('[data-testid="validate-workflow"]');
    await expect(page.locator('[data-testid="validation-success"]')).toBeVisible();
  });

  test('error handling', async ({ page }) => {
    // Test network error handling
    await page.route('/api/workflows', route => route.abort());
    await page.goto('/workflows');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Failed to load workflows'
    );

    // Test retry functionality
    await page.unroute('/api/workflows');
    await page.click('[data-testid="retry-button"]');

    await expect(page.locator('[data-testid="workflow-list"]')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('login flow', async ({ page }) => {
    await page.goto('/login');

    // Test invalid credentials
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials'
    );

    // Test valid credentials
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('logout flow', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpassword');
    await page.click('[data-testid="login-button"]');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
  });
});
```

#### Backend E2E Tests
```python
# Example: Full system E2E test
import pytest
import asyncio
from httpx import AsyncClient
from app.main import app

class TestSystemE2E:
    @pytest.fixture
    async def client(self):
        async with AsyncClient(app=app, base_url="http://test") as ac:
            yield ac

    async def test_complete_workflow_lifecycle(
        self, client: AsyncClient, test_user
    ):
        """Test complete workflow lifecycle from creation to execution."""
        
        # 1. Login user
        login_response = await client.post("/api/auth/login", json={
            "email": test_user.email,
            "password": "testpassword"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create workflow
        workflow_data = {
            "name": "E2E Test Workflow",
            "description": "End-to-end test workflow",
            "definition": {
                "nodes": [
                    {
                        "id": "start",
                        "type": "start",
                        "data": {"label": "Start"},
                        "position": {"x": 100, "y": 100}
                    },
                    {
                        "id": "email",
                        "type": "email",
                        "data": {
                            "label": "Send Email",
                            "template": "welcome_email",
                            "to": "{{customer_email}}"
                        },
                        "position": {"x": 300, "y": 100}
                    },
                    {
                        "id": "end",
                        "type": "end",
                        "data": {"label": "End"},
                        "position": {"x": 500, "y": 100}
                    }
                ],
                "edges": [
                    {"id": "e1", "source": "start", "target": "email"},
                    {"id": "e2", "source": "email", "target": "end"}
                ]
            }
        }
        
        create_response = await client.post(
            "/api/workflows/",
            json=workflow_data,
            headers=headers
        )
        assert create_response.status_code == 201
        workflow = create_response.json()
        workflow_id = workflow["id"]

        # 3. Validate workflow
        validate_response = await client.post(
            f"/api/workflows/{workflow_id}/validate",
            headers=headers
        )
        assert validate_response.status_code == 200
        assert validate_response.json()["is_valid"] is True

        # 4. Execute workflow
        execution_data = {
            "input_data": {
                "customer_email": "customer@example.com",
                "customer_name": "John Doe"
            },
            "execution_mode": "async"
        }
        
        execute_response = await client.post(
            f"/api/workflows/{workflow_id}/execute",
            json=execution_data,
            headers=headers
        )
        assert execute_response.status_code == 202
        execution = execute_response.json()
        execution_id = execution["execution_id"]

        # 5. Monitor execution status
        max_attempts = 30
        for attempt in range(max_attempts):
            status_response = await client.get(
                f"/api/workflows/executions/{execution_id}",
                headers=headers
            )
            assert status_response.status_code == 200
            execution_status = status_response.json()
            
            if execution_status["status"] in ["completed", "failed"]:
                break
            
            await asyncio.sleep(1)
        
        assert execution_status["status"] == "completed"
        assert execution_status["output_data"] is not None

        # 6. Verify execution logs
        logs_response = await client.get(
            f"/api/workflows/executions/{execution_id}/logs",
            headers=headers
        )
        assert logs_response.status_code == 200
        logs = logs_response.json()
        assert len(logs["logs"]) > 0

        # 7. Get workflow execution history
        history_response = await client.get(
            f"/api/workflows/{workflow_id}/executions",
            headers=headers
        )
        assert history_response.status_code == 200
        history = history_response.json()
        assert len(history["executions"]) >= 1
        assert any(e["id"] == execution_id for e in history["executions"])
```

### 4. Performance Testing

#### Load Testing
**Framework**: Locust  
**Location**: `tests/performance/`

```python
# Example: Load test
from locust import HttpUser, task, between
import json

class WorkflowUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks."""
        response = self.client.post("/api/auth/login", json={
            "email": "loadtest@example.com",
            "password": "loadtestpassword"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def list_workflows(self):
        """List workflows - most common operation."""
        self.client.get("/api/workflows/", headers=self.headers)

    @task(2)
    def get_workflow_details(self):
        """Get workflow details."""
        # Assume we have workflow IDs available
        workflow_id = "test-workflow-id"
        self.client.get(f"/api/workflows/{workflow_id}", headers=self.headers)

    @task(1)
    def create_workflow(self):
        """Create new workflow - less frequent operation."""
        workflow_data = {
            "name": f"Load Test Workflow {self.user_id}",
            "description": "Created by load test",
            "definition": {
                "nodes": [{"id": "start", "type": "start"}],
                "edges": []
            }
        }
        self.client.post(
            "/api/workflows/",
            json=workflow_data,
            headers=self.headers
        )

    @task(1)
    def execute_workflow(self):
        """Execute workflow - moderate frequency."""
        workflow_id = "test-workflow-id"
        execution_data = {
            "input_data": {"test": "data"},
            "execution_mode": "async"
        }
        self.client.post(
            f"/api/workflows/{workflow_id}/execute",
            json=execution_data,
            headers=self.headers
        )

class SystemUser(HttpUser):
    wait_time = between(5, 10)
    
    @task
    def health_check(self):
        """System health check."""
        self.client.get("/health")

    @task
    def metrics_check(self):
        """System metrics check."""
        self.client.get("/api/monitoring/metrics")
```

#### Stress Testing
```python
# Example: Stress test configuration
import asyncio
import aiohttp
import time
from concurrent.futures import ThreadPoolExecutor

class StressTest:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.results = []

    async def make_request(self, session, endpoint, method="GET", data=None):
        """Make a single HTTP request."""
        start_time = time.time()
        try:
            async with session.request(
                method, 
                f"{self.base_url}{endpoint}",
                json=data
            ) as response:
                await response.text()
                end_time = time.time()
                return {
                    "endpoint": endpoint,
                    "status": response.status,
                    "duration": end_time - start_time,
                    "success": 200 <= response.status < 400
                }
        except Exception as e:
            end_time = time.time()
            return {
                "endpoint": endpoint,
                "status": 0,
                "duration": end_time - start_time,
                "success": False,
                "error": str(e)
            }

    async def stress_test_endpoint(
        self, 
        endpoint, 
        concurrent_requests=100, 
        total_requests=1000
    ):
        """Run stress test on a specific endpoint."""
        connector = aiohttp.TCPConnector(limit=concurrent_requests)
        async with aiohttp.ClientSession(connector=connector) as session:
            
            # Create semaphore to limit concurrent requests
            semaphore = asyncio.Semaphore(concurrent_requests)
            
            async def limited_request():
                async with semaphore:
                    return await self.make_request(session, endpoint)
            
            # Run all requests
            tasks = [limited_request() for _ in range(total_requests)]
            results = await asyncio.gather(*tasks)
            
            return self.analyze_results(results)

    def analyze_results(self, results):
        """Analyze stress test results."""
        successful_requests = [r for r in results if r["success"]]
        failed_requests = [r for r in results if not r["success"]]
        
        if successful_requests:
            durations = [r["duration"] for r in successful_requests]
            avg_duration = sum(durations) / len(durations)
            max_duration = max(durations)
            min_duration = min(durations)
        else:
            avg_duration = max_duration = min_duration = 0
        
        return {
            "total_requests": len(results),
            "successful_requests": len(successful_requests),
            "failed_requests": len(failed_requests),
            "success_rate": len(successful_requests) / len(results) * 100,
            "average_duration": avg_duration,
            "max_duration": max_duration,
            "min_duration": min_duration,
            "errors": [r.get("error") for r in failed_requests if "error" in r]
        }

# Usage example
async def run_stress_tests():
    stress_tester = StressTest()
    
    # Test different endpoints
    endpoints = [
        "/health",
        "/api/workflows/",
        "/api/auth/me"
    ]
    
    for endpoint in endpoints:
        print(f"Testing {endpoint}...")
        results = await stress_tester.stress_test_endpoint(
            endpoint, 
            concurrent_requests=50, 
            total_requests=500
        )
        print(f"Results: {results}")
```

---

## Test Data Management

### 1. Test Fixtures
```python
# conftest.py - Shared test fixtures
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.database import Base, get_db
from app.models.user import User
from app.models.workflow import Workflow

@pytest.fixture
async def db_session():
    """Create test database session."""
    engine = create_async_engine("sqlite+aiosqlite:///test.db")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def test_user(db_session):
    """Create test user."""
    user = User(
        email="test@example.com",
        hashed_password="hashed_password",
        first_name="Test",
        last_name="User",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture
async def sample_workflow(db_session, test_user):
    """Create sample workflow."""
    workflow = Workflow(
        name="Sample Workflow",
        description="Sample workflow for testing",
        definition={
            "nodes": [
                {"id": "start", "type": "start"},
                {"id": "end", "type": "end"}
            ],
            "edges": [{"id": "e1", "source": "start", "target": "end"}]
        },
        created_by=test_user.id
    )
    db_session.add(workflow)
    await db_session.commit()
    await db_session.refresh(workflow)
    return workflow
```

### 2. Mock Data Generation
```typescript
// Mock data generators
import { faker } from '@faker-js/faker';

export const generateMockUser = () => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  company: faker.company.name(),
  roles: ['user'],
  permissions: ['workflow:read', 'workflow:create'],
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString()
});

export const generateMockWorkflow = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'start',
        data: { label: 'Start' },
        position: { x: 100, y: 100 }
      },
      {
        id: 'end',
        type: 'end',
        data: { label: 'End' },
        position: { x: 300, y: 100 }
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'end' }
    ]
  },
  is_active: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  execution_count: faker.number.int({ min: 0, max: 100 }),
  last_execution: faker.date.recent().toISOString(),
  ...overrides
});

export const generateMockExecution = (workflowId?: string) => ({
  id: faker.string.uuid(),
  workflow_id: workflowId || faker.string.uuid(),
  status: faker.helpers.arrayElement(['completed', 'running', 'failed']),
  started_at: faker.date.recent().toISOString(),
  completed_at: faker.date.recent().toISOString(),
  duration: faker.number.float({ min: 10, max: 300 }),
  input_data: { customer_id: faker.string.uuid() },
  output_data: { success: true, processed: true }
});
```

---

## Test Environment Configuration

### 1. Environment Setup
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - test_db_data:/var/lib/postgresql/data

  test-redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  test-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.test
    environment:
      DATABASE_URL: postgresql://test_user:test_password@test-db:5432/test_db
      REDIS_URL: redis://test-redis:6379/0
      ENVIRONMENT: test
    depends_on:
      - test-db
      - test-redis
    volumes:
      - ./backend:/app
    command: pytest -v

  test-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.test
    environment:
      REACT_APP_API_URL: http://test-backend:8000
      NODE_ENV: test
    volumes:
      - ./frontend:/app
    command: npm test

volumes:
  test_db_data:
```

### 2. CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.12'
          
      - name: Install backend dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r requirements-test.txt
          
      - name: Run backend tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml
          
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run frontend tests
        run: |
          cd frontend
          npm test -- --coverage
          
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run integration tests
        run: |
          docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
          
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install Playwright
        run: |
          npm install -g @playwright/test
          playwright install
          
      - name: Start application
        run: |
          docker-compose up -d
          
      - name: Wait for application
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
          
      - name: Run E2E tests
        run: |
          playwright test
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Quality Gates and Coverage

### 1. Coverage Requirements
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: Critical path coverage
- **E2E Tests**: User journey coverage
- **API Tests**: 100% endpoint coverage

### 2. Quality Metrics
```python
# pytest.ini
[tool:pytest]
addopts = 
    --strict-markers
    --strict-config
    --cov=app
    --cov-report=term-missing
    --cov-report=html
    --cov-fail-under=80
    --durations=10

markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
    smoke: Smoke tests
```

### 3. Test Quality Checks
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

---

## Testing Best Practices

### 1. Test Writing Guidelines
- **Arrange-Act-Assert**: Structure tests clearly
- **Descriptive Names**: Test names should describe behavior
- **Single Responsibility**: One assertion per test
- **Independent Tests**: Tests should not depend on each other

### 2. Mock Strategy
- **Mock External Dependencies**: API calls, databases, file systems
- **Spy on Internal Functions**: Monitor function calls
- **Use Real Objects When Possible**: Avoid over-mocking

### 3. Test Maintenance
- **Regular Review**: Review and update tests regularly
- **Flaky Test Handling**: Identify and fix unreliable tests
- **Performance Monitoring**: Track test execution time
- **Documentation**: Document complex test scenarios

---

This comprehensive testing strategy ensures the Auterity platform maintains high quality, reliability, and performance standards throughout its development lifecycle.
