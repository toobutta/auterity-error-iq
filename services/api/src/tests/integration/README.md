

# Integration Tests Documentatio

n

#

# Overvie

w

This directory contains comprehensive end-to-end integration tests for the AutoMatrix AI Hub Workflow Engine MVP. These tests validate complete user workflows, system performance, and cross-component functionality

.

#

# Test Structur

e

#

## Core Test File

s

- **`test_e2e_workflows.py`

* *

- Complete workflow lifecycle testin

g

- **`test_performance_load.py`

* *

- Performance and load testin

g

- **`conftest.py`

* *

- Test configuration and fixture

s

#

## Test Categorie

s

#

###

 1. Complete Workflow Lifecycle (`TestCompleteWorkflowLifecycle

`

)

Tests the full workflow from creation to execution to monitoring:

- Workflow creation with validatio

n

- Workflow execution with AI integratio

n

- Execution monitoring and loggin

g

- Error handling and recover

y

- Concurrent execution testin

g

#

###

 2. Template Integration (`TestTemplateIntegration

`

)

Tests template functionality:

- Template browsing and listin

g

- Template preview and detail

s

- Template instantiation with parameter

s

- Parameter validation and error handlin

g

#

###

 3. Authentication Integration (`TestAuthenticationIntegration

`

)

Tests security and access control:

- Unauthenticated access denia

l

- Invalid token rejectio

n

- User workflow isolatio

n

- Cross-user access preventio

n

#

###

 4. Performance Testing (`TestWorkflowPerformance

`

)

Tests system performance under various conditions:

- Single workflow execution performanc

e

- Concurrent execution load testin

g

- Database performance under loa

d

- Memory usage monitorin

g

- API response time consistenc

y

#

###

 5. Scalability Testing (`TestScalabilityLimits

`

)

Tests system behavior at scale:

- Maximum concurrent execution

s

- Large workflow definition handlin

g

- Resource usage under extreme loa

d

#

# Requirements Coverag

e

These integration tests validate all requirements from the specification:

#

## Requirement 1: Visual Workflow Builde

r

- **1.1**: Drag-and-drop canvas interface



✅

- **1.2**: Component connections



✅

- **1.3**: Workflow persistence



✅

- **1.4**: Validation error handling



✅

#

## Requirement 2: AI-Powered Executi

o

n

- **2.1**: Sequential workflow execution



✅

- **2.2**: AI model integration



✅

- **2.3**: Successful completion handling



✅

- **2.4**: Error logging and stopping



✅

#

## Requirement 3: Monitoring and Analytic

s

- **3.1**: Execution logging with timestamps



✅

- **3.2**: Dashboard execution history



✅

- **3.3**: Success/failure rates and timing



✅

- **3.4**: Error detail display



✅

#

## Requirement 4: Authentication and Managemen

t

- **4.1**: Login credential validation



✅

- **4.2**: Authenticated session creation



✅

- **4.3**: Workflow-user association



✅

- **4.4**: Session invalidation



✅

#

## Requirement 5: Template Librar

y

- **5.1**: Template library display



✅

- **5.2**: Template-based workflow creation



✅

- **5.3**: Parameter customization



✅

- **5.4**: Required value prompting



✅

#

## Requirement 6: API Integratio

n

- **6.1**: Request authentication



✅

- **6.2**: Workflow execution with ID return



✅

- **6.3**: Status request handling



✅

- **6.4**: Invalid ID error handling



✅

#

# Running the Test

s

#

## Prerequisite

s

1. **Python Environment*

* :



```bash
   cd backend
   python -m venv venv

   source venv/bin/activate

# On Windows: venv\Scripts\activate

   pip install -r requirements.txt



```

2. **Database Setup**

:



```

bash


# Tests use in-memory SQLite, no setup require

d



```

#

## Running Individual Test Categorie

s

```

bash

# Run all integration tests

pytest tests/integration/ -v

# Run specific test classes

pytest tests/integration/test_e2e_workflows.py::TestCompleteWorkflowLifecycle -v

pytest tests/integration/test_e2e_workflows.py::TestTemplateIntegration -v

pytest tests/integration/test_e2e_workflows.py::TestAuthenticationIntegration -v

# Run performance tests

pytest tests/integration/test_performance_load.py -v

# Run with coverage

pytest tests/integration/ -v --cov=app --cov-report=htm

l

```

#

## Running with the Integration Test Scrip

t

```

bash

# Run all integration tests

./scripts/run-integration-tests.s

h

# Run specific test suites

./scripts/run-integration-tests.sh --backend-only

./scripts/run-integration-tests.sh --performance-onl

y

# Skip Docker setup (if already running)

./scripts/run-integration-tests.sh --skip-setu

p

```

#

# Test Configuratio

n

#

## Fixtures (`conftest.py`

)

- **`db_session`**: Fresh database session for each tes

t

- **`client`**: FastAPI test clien

t

- **`async_client`**: Async HTTP client for concurrent testin

g

- **`test_user`**: Pre-created test use

r

- **`test_user_token`**: Authentication toke

n

- **`authenticated_headers`**: Headers with auth toke

n

- **`sample_workflow`**: Pre-created workflow for testin

g

- **`sample_template`**: Pre-created template for testin

g

#

## Mock Configuratio

n

- **OpenAI API**: Mocked to return consistent response

s

- **Database**: In-memory SQLite for isolatio

n

- **Authentication**: JWT tokens with test user

s

#

# Performance Benchmark

s

The integration tests enforce the following performance benchmarks:

#

## Execution Performanc

e

- **Average workflow execution**: < 2.0 secon

d

s

- **Maximum execution time**: < 5.0 secon

d

s

- **Execution time consistency**: Standard deviation < 1.0 seco

n

d

#

## Concurrent Load Performanc

e

- **Success rate under load**: ≥ 90

%

- **Average execution time under load**: < 3.0 secon

d

s

- **Throughput**: ≥ 5 executions/secon

d

#

## Database Performanc

e

- **Workflow listing**: < 2.0 secon

d

s

- **Individual workflow retrieval**: < 0.5 secon

d

s

- **Large workflow handling**: < 5.0 seconds creation, < 2.0 seconds retriev

a

l

#

## Memory Usag

e

- **Memory growth under load**: < 50MB total increas

e

- **Memory growth per 10 executions**: < 100M

B

#

## API Response Time

s

- **Average API response**: < 1.0 seco

n

d

- **Response time consistency**: Standard deviation < 0.5 secon

d

s

#

# Error Scenarios Teste

d

#

## Validation Error

s

- Empty workflow name

s

- Invalid workflow definition

s

- Missing required template parameter

s

- Invalid parameter value

s

#

## Authentication Error

s

- Missing authentication token

s

- Invalid/expired token

s

- Cross-user access attempt

s

#

## Execution Error

s

- Non-existent workflow executio

n

- AI service failure

s

- Network timeout

s

- Resource exhaustio

n

#

## Performance Degradatio

n

- High concurrent loa

d

- Large workflow definition

s

- Memory pressur

e

- Database connection limit

s

#

# Continuous Integratio

n

These tests are designed to run in CI/CD pipelines:

#

## GitHub Actions Integratio

n

```

yaml

- name: Run Integration Tests

  run: |
    ./scripts/run-integration-tests.s

h

- name: Upload Test Results

  uses: actions/upload-artifact@v3

  with:
    name: integration-test-results

    path: |
      backend/htmlcov/
      backend/test-results.xml

      test-report.m

d

```

#

## Test Reportin

g

- **JUnit XML**: Compatible with CI/CD system

s

- **HTML Coverage**: Detailed coverage report

s

- **Performance Metrics**: Logged for monitorin

g

- **Markdown Report**: Human-readable summar

y

#

# Troubleshootin

g

#

## Common Issue

s

1. **Database Connection Errors*

* :

   - Ensure PostgreSQL is running for full integratio

n

   - Tests use SQLite in-memory by defaul

t

2. **Authentication Failures*

* :

   - Check JWT secret configuratio

n

   - Verify user creation in test fixture

s

3. **Performance Test Failures*

* :

   - Adjust thresholds based on hardwar

e

   - Check system resource availabilit

y

4. **Concurrent Test Issues*

* :

   - Reduce concurrent execution coun

t

   - Check thread pool configuratio

n

#

## Debug Mod

e

Run tests with verbose output and debugging:

```

bash
pytest tests/integration/ -v -s --tb=long --log-cli-level=DEBU

G

```

#

## Test Data Inspectio

n

Access test database and inspect data:

```

python

# In test debugging

import pdb; pdb.set_trace()

# Inspect database state

print(f"Workflows: {db_session.query(Workflow).count()}")
print(f"Executions: {db_session.query(WorkflowExecution).count()}")

```

#

# Contributin

g

When adding new integration tests:

1. **Follow naming conventions**: `test_<feature>_<scenario

>

`

2. **Use appropriate fixtures**: Leverage existing fixtures when possib

l

e

3. **Add performance assertions**: Include timing and resource chec

k

s

4. **Document test purpose**: Clear docstrings explaining test goa

l

s

5. **Update this README**: Add new test categories and requirements covera

g

e

#

## Test Templat

e

```

python
def test_new_feature_integration(
    self,
    client: TestClient,
    authenticated_headers: dict,
    relevant_fixture
):
    """Test description explaining what this validates."""



# Arrange

 - Set up test dat

a

    test_data = {...}



# Act

 - Perform the action being teste

d

    response = client.post("/api/endpoint", json=test_data, headers=authenticated_headers)



# Assert

 - Verify expected outcome

s

    assert response.status_code == 200
    result = response.json()
    assert result["expected_field"] == "expected_value"



# Performance assertion if applicable



# assert execution_time < threshold

```
