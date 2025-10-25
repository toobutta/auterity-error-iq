#!/bin/bash

# Integration Test Runner Script
# Runs comprehensive end-to-end integration tests for the AutoMatrix AI Hub

set -e

echo "🚀 Starting AutoMatrix AI Hub Integration Tests"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Function to check if a service is healthy
check_service_health() {
    local service=$1
    local max_attempts=30
    local attempt=1

    print_status "Checking $service health..."

    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy\|Up"; then
            print_success "$service is healthy"
            return 0
        fi

        print_status "Waiting for $service... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    print_error "$service failed to become healthy"
    return 1
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend integration tests..."

    # Set test environment variables
    export PYTEST_CURRENT_TEST=true
    export DATABASE_URL="sqlite:///:memory:"

    cd backend

    # Install test dependencies if needed
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements.txt
    else
        source venv/bin/activate
    fi

    # Run integration tests with coverage
    print_status "Executing backend integration tests..."
    pytest tests/integration/ -v \
        --tb=short \
        --cov=app \
        --cov-report=term-missing \
        --cov-report=html:htmlcov \
        --junit-xml=test-results.xml \
        --durations=10

    local backend_exit_code=$?

    if [ $backend_exit_code -eq 0 ]; then
        print_success "Backend integration tests passed"
    else
        print_error "Backend integration tests failed"
    fi

    cd ..
    return $backend_exit_code
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend integration tests..."

    cd frontend

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi

    # Run integration tests
    print_status "Executing frontend integration tests..."
    npm run test -- --run \
        --reporter=verbose \
        --coverage \
        --coverage.reporter=text \
        --coverage.reporter=html \
        --coverage.reporter=json-summary

    local frontend_exit_code=$?

    if [ $frontend_exit_code -eq 0 ]; then
        print_success "Frontend integration tests passed"
    else
        print_error "Frontend integration tests failed"
    fi

    cd ..
    return $frontend_exit_code
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance and load tests..."

    cd backend
    source venv/bin/activate

    # Run performance tests with special markers
    pytest tests/integration/test_performance_load.py -v \
        --tb=short \
        --durations=0 \
        -m "not slow" \
        --junit-xml=performance-results.xml

    local perf_exit_code=$?

    if [ $perf_exit_code -eq 0 ]; then
        print_success "Performance tests passed"
    else
        print_error "Performance tests failed"
    fi

    cd ..
    return $perf_exit_code
}

# Function to generate test report
generate_test_report() {
    print_status "Generating comprehensive test report..."

    cat > test-report.md << EOF
# AutoMatrix AI Hub - Integration Test Report

**Generated:** $(date)
**Test Run ID:** $(date +%Y%m%d_%H%M%S)

## Test Summary

### Backend Integration Tests
- **Location:** \`backend/tests/integration/\`
- **Coverage Report:** \`backend/htmlcov/index.html\`
- **Results:** \`backend/test-results.xml\`

### Frontend Integration Tests
- **Location:** \`frontend/src/tests/integration/\`
- **Coverage Report:** \`frontend/coverage/index.html\`

### Performance Tests
- **Location:** \`backend/tests/integration/test_performance_load.py\`
- **Results:** \`backend/performance-results.xml\`

## Test Categories Covered

### ✅ Complete Workflow Lifecycle
- Workflow creation, execution, and monitoring
- Error handling and validation
- Concurrent execution testing

### ✅ Template Integration
- Template browsing and preview
- Template instantiation with parameters
- Parameter validation

### ✅ Authentication & Authorization
- User authentication flows
- Protected route access
- User workflow isolation

### ✅ Performance & Load Testing
- Single workflow execution performance
- Concurrent execution load testing
- Database performance under load
- Memory usage monitoring
- API response time consistency

### ✅ Error Handling & Recovery
- API error handling
- Network failure recovery
- Application state maintenance

## Requirements Coverage

This test suite validates the following requirements:

- **Requirement 1.1-1.4:** Visual workflow builder functionality
- **Requirement 2.1-2.4:** AI-powered workflow execution
- **Requirement 3.1-3.4:** Monitoring and analytics
- **Requirement 4.1-4.4:** Authentication and session management
- **Requirement 5.1-5.4:** Template library functionality
- **Requirement 6.1-6.4:** API functionality

## Performance Benchmarks

- **Average Workflow Execution:** < 2.0 seconds
- **Concurrent Execution Success Rate:** ≥ 90%
- **API Response Time:** < 1.0 second
- **Database Query Performance:** < 0.5 seconds
- **Memory Usage Growth:** < 50MB under load

## Next Steps

1. Review any failed tests in the detailed reports
2. Check coverage reports for untested code paths
3. Monitor performance metrics in production
4. Update test thresholds based on production requirements

EOF

    print_success "Test report generated: test-report.md"
}

# Main execution flow
main() {
    local start_time=$(date +%s)
    local backend_passed=false
    local frontend_passed=false
    local performance_passed=false

    print_status "Starting integration test suite..."

    # Parse command line arguments
    RUN_BACKEND=true
    RUN_FRONTEND=true
    RUN_PERFORMANCE=true
    SKIP_SETUP=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                RUN_FRONTEND=false
                RUN_PERFORMANCE=false
                shift
                ;;
            --frontend-only)
                RUN_BACKEND=false
                RUN_PERFORMANCE=false
                shift
                ;;
            --performance-only)
                RUN_BACKEND=false
                RUN_FRONTEND=false
                shift
                ;;
            --skip-setup)
                SKIP_SETUP=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --backend-only     Run only backend tests"
                echo "  --frontend-only    Run only frontend tests"
                echo "  --performance-only Run only performance tests"
                echo "  --skip-setup       Skip Docker setup"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Setup test environment
    if [ "$SKIP_SETUP" = false ]; then
        print_status "Setting up test environment..."

        # Start services
        docker-compose up -d postgres

        # Wait for services to be ready
        check_service_health postgres || exit 1

        # Run database migrations
        print_status "Running database migrations..."
        cd backend
        if [ -d "venv" ]; then
            source venv/bin/activate
            alembic upgrade head
        fi
        cd ..
    fi

    # Run tests based on flags
    if [ "$RUN_BACKEND" = true ]; then
        if run_backend_tests; then
            backend_passed=true
        fi
    fi

    if [ "$RUN_FRONTEND" = true ]; then
        if run_frontend_tests; then
            frontend_passed=true
        fi
    fi

    if [ "$RUN_PERFORMANCE" = true ]; then
        if run_performance_tests; then
            performance_passed=true
        fi
    fi

    # Generate report
    generate_test_report

    # Calculate total time
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))

    # Print final results
    echo ""
    echo "================================================"
    echo "🏁 Integration Test Results"
    echo "================================================"

    if [ "$RUN_BACKEND" = true ]; then
        if [ "$backend_passed" = true ]; then
            print_success "Backend Tests: PASSED"
        else
            print_error "Backend Tests: FAILED"
        fi
    fi

    if [ "$RUN_FRONTEND" = true ]; then
        if [ "$frontend_passed" = true ]; then
            print_success "Frontend Tests: PASSED"
        else
            print_error "Frontend Tests: FAILED"
        fi
    fi

    if [ "$RUN_PERFORMANCE" = true ]; then
        if [ "$performance_passed" = true ]; then
            print_success "Performance Tests: PASSED"
        else
            print_error "Performance Tests: FAILED"
        fi
    fi

    echo ""
    print_status "Total execution time: ${total_time} seconds"
    print_status "Detailed reports available in test-report.md"

    # Exit with appropriate code
    if [ "$backend_passed" = true ] && [ "$frontend_passed" = true ] && [ "$performance_passed" = true ]; then
        print_success "All integration tests passed! 🎉"
        exit 0
    else
        print_error "Some integration tests failed. Check the reports for details."
        exit 1
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up test environment..."
    if [ "$SKIP_SETUP" = false ]; then
        docker-compose down
    fi
}

# Set up cleanup trap
trap cleanup EXIT

# Run main function
main "$@"
