# Integration Tests Documentation

## Overview

This directory contains comprehensive end-to-end integration tests for the AutoMatrix AI Hub Workflow Engine MVP. These tests validate complete user workflows, system performance, and cross-component functionality.

## Test Structure

### Core Test Files

- **`test_e2e_workflows.py`** - Complete workflow lifecycle testing
- **`test_performance_load.py`** - Performance and load testing
- **`conftest.py`** - Test configuration and fixtures

### Test Categories

#### 1. Complete Workflow Lifecycle (`TestCompleteWorkflowLifecycle`)

Tests the full workflow from creation to execution to monitoring:

- Workflow creation with validation
- Workflow execution with AI integration
- Execution monitoring and logging
- Error handling and recovery
- Concurrent execution testing

#### 2. Template Integration (`TestTemplateIntegration`)

Tests template functionality:

- Template browsing and listing
- Template preview and details
- Template instantiation with parameters
- Parameter validation and error handling

#### 3. Authentication Integration (`TestAuthenticationIntegration`)

Tests security and access control:

- Unauthenticated access denial
- Invalid token rejection
- User workflow isolation
- Cross-user access prevention

#### 4. Performance Testing (`TestWorkflowPerformance`)

Tests system performance under various conditions:

- Single workflow execution performance
- Concurrent execution load testing
- Database performance under load
- Memory usage monitoring
- API response time consistency

#### 5. Scalability Testing (`TestScalabilityLimits`)

Tests system behavior at scale:

- Maximum concurrent executions
- Large workflow definition handling
- Resource usage under extreme load

## Requirements Coverage

These integration tests validate all requirements from the specification:

### Requirement 1: Visual Workflow Builder

- **1.1**: Drag-and-drop canvas interface ✅
- **1.2**: Component connections ✅
- **1.3**: Workflow persistence ✅
- **1.4**: Validation error handling ✅

### Requirement 2: AI-Powered Execution

- **2.1**: Sequential workflow execution ✅
- **2.2**: AI model integration ✅
- **2.3**: Successful completion handling ✅
- **2.4**: Error logging and stopping ✅

### Requirement 3: Monitoring and Analytics

- **3.1**: Execution logging with timestamps ✅
- **3.2**: Dashboard execution history ✅
- **3.3**: Success/failure rates and timing ✅
- **3.4**: Error detail display ✅

### Requirement 4: Authentication and Management

- **4.1**: Login credential validation ✅
- **4.2**: Authenticated session creation ✅
- **4.3**: Workflow-user association ✅
- **4.4**: Session invalidation ✅

### Requirement 5: Template Library

- **5.1**: Template library display ✅
- **5.2**: Template-based workflow creation ✅
- **5.3**: Parameter customization ✅
- **5.4**: Required value prompting ✅

### Requirement 6: API Integration

- **6.1**: Request authentication ✅
- **6.2**: Workflow execution with ID return ✅
- **6.3**: Status request handling ✅
- **6.4**: Invalid ID error handling ✅

## Running the Tests

### Prerequisites

1. **Python Environment**:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   ```bash
   # Tests use in-memory SQLite, no setup required
   ```

### Running Individual Test Categories

```bash
# Run all integration tests
pytest tests/integration/ -v

# Run specific test classes
pytest tests/integration/test_e2e_workflows.py::TestCompleteWorkflowLifecycle -v
pytest tests/integration/test_e2e_workflows.py::TestTemplateIntegration -v
pytest tests/integration/test_e2e_workflows.py::TestAuthenticationIntegration -v

# Run performance tests
pytest tests/integration/test_performance_load.py -v

# Run with coverage
pytest tests/integration/ -v --cov=app --cov-report=html
```

### Running with the Integration Test Script

```bash
# Run all integration tests
./scripts/run-integration-tests.sh

# Run specific test suites
./scripts/run-integration-tests.sh --backend-only
./scripts/run-integration-tests.sh --performance-only

# Skip Docker setup (if already running)
./scripts/run-integration-tests.sh --skip-setup
```

## Test Configuration

### Fixtures (`conftest.py`)

- **`db_session`**: Fresh database session for each test
- **`client`**: FastAPI test client
- **`async_client`**: Async HTTP client for concurrent testing
- **`test_user`**: Pre-created test user
- **`test_user_token`**: Authentication token
- **`authenticated_headers`**: Headers with auth token
- **`sample_workflow`**: Pre-created workflow for testing
- **`sample_template`**: Pre-created template for testing

### Mock Configuration

- **OpenAI API**: Mocked to return consistent responses
- **Database**: In-memory SQLite for isolation
- **Authentication**: JWT tokens with test users

## Performance Benchmarks

The integration tests enforce the following performance benchmarks:

### Execution Performance

- **Average workflow execution**: < 2.0 seconds
- **Maximum execution time**: < 5.0 seconds
- **Execution time consistency**: Standard deviation < 1.0 second

### Concurrent Load Performance

- **Success rate under load**: ≥ 90%
- **Average execution time under load**: < 3.0 seconds
- **Throughput**: ≥ 5 executions/second

### Database Performance

- **Workflow listing**: < 2.0 seconds
- **Individual workflow retrieval**: < 0.5 seconds
- **Large workflow handling**: < 5.0 seconds creation, < 2.0 seconds retrieval

### Memory Usage

- **Memory growth under load**: < 50MB total increase
- **Memory growth per 10 executions**: < 100MB

### API Response Times

- **Average API response**: < 1.0 second
- **Response time consistency**: Standard deviation < 0.5 seconds

## Error Scenarios Tested

### Validation Errors

- Empty workflow names
- Invalid workflow definitions
- Missing required template parameters
- Invalid parameter values

### Authentication Errors

- Missing authentication tokens
- Invalid/expired tokens
- Cross-user access attempts

### Execution Errors

- Non-existent workflow execution
- AI service failures
- Network timeouts
- Resource exhaustion

### Performance Degradation

- High concurrent load
- Large workflow definitions
- Memory pressure
- Database connection limits

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

### GitHub Actions Integration

```yaml
- name: Run Integration Tests
  run: |
    ./scripts/run-integration-tests.sh

- name: Upload Test Results
  uses: actions/upload-artifact@v3
  with:
    name: integration-test-results
    path: |
      backend/htmlcov/
      backend/test-results.xml
      test-report.md
```

### Test Reporting

- **JUnit XML**: Compatible with CI/CD systems
- **HTML Coverage**: Detailed coverage reports
- **Performance Metrics**: Logged for monitoring
- **Markdown Report**: Human-readable summary

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure PostgreSQL is running for full integration
   - Tests use SQLite in-memory by default

2. **Authentication Failures**:
   - Check JWT secret configuration
   - Verify user creation in test fixtures

3. **Performance Test Failures**:
   - Adjust thresholds based on hardware
   - Check system resource availability

4. **Concurrent Test Issues**:
   - Reduce concurrent execution count
   - Check thread pool configuration

### Debug Mode

Run tests with verbose output and debugging:

```bash
pytest tests/integration/ -v -s --tb=long --log-cli-level=DEBUG
```

### Test Data Inspection

Access test database and inspect data:

```python
# In test debugging
import pdb; pdb.set_trace()

# Inspect database state
print(f"Workflows: {db_session.query(Workflow).count()}")
print(f"Executions: {db_session.query(WorkflowExecution).count()}")
```

## Contributing

When adding new integration tests:

1. **Follow naming conventions**: `test_<feature>_<scenario>`
2. **Use appropriate fixtures**: Leverage existing fixtures when possible
3. **Add performance assertions**: Include timing and resource checks
4. **Document test purpose**: Clear docstrings explaining test goals
5. **Update this README**: Add new test categories and requirements coverage

### Test Template

```python
def test_new_feature_integration(
    self,
    client: TestClient,
    authenticated_headers: dict,
    relevant_fixture
):
    """Test description explaining what this validates."""

    # Arrange - Set up test data
    test_data = {...}

    # Act - Perform the action being tested
    response = client.post("/api/endpoint", json=test_data, headers=authenticated_headers)

    # Assert - Verify expected outcomes
    assert response.status_code == 200
    result = response.json()
    assert result["expected_field"] == "expected_value"

    # Performance assertion if applicable
    # assert execution_time < threshold
```
