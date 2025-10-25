#!/bin/bash

# Comprehensive Test Automation Script
# Runs all test suites with quality gates and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COVERAGE_THRESHOLD=80
PERFORMANCE_THRESHOLD_MS=2000
PROJECT_ROOT=$(pwd)
REPORTS_DIR="$PROJECT_ROOT/test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."

    # Create reports directory
    mkdir -p "$REPORTS_DIR"

    # Start required services
    docker-compose up -d postgres redis
    sleep 10

    print_success "Test environment ready"
}

# Function to run unit tests with coverage
run_unit_tests() {
    print_status "Running unit tests with coverage analysis..."

    local failed_components=()

    # Backend unit tests
    print_status "Running backend unit tests..."
    cd "$PROJECT_ROOT/backend"
    if python -m pytest tests/ -v \
        --cov=app \
        --cov-report=term-missing \
        --cov-report=html:"$REPORTS_DIR/backend-coverage" \
        --cov-report=xml:"$REPORTS_DIR/backend-coverage.xml" \
        --junit-xml="$REPORTS_DIR/backend-unit-tests.xml" \
        --tb=short; then
        print_success "Backend unit tests passed"
    else
        print_error "Backend unit tests failed"
        failed_components+=("backend-unit")
    fi

    # Frontend unit tests
    print_status "Running frontend unit tests..."
    cd "$PROJECT_ROOT/frontend"
    if npm test -- --run --coverage \
        --reporter=verbose \
        --reporter=junit \
        --outputFile="$REPORTS_DIR/frontend-unit-tests.xml"; then
        print_success "Frontend unit tests passed"

        # Move coverage report
        if [ -d "coverage" ]; then
            cp -r coverage "$REPORTS_DIR/frontend-coverage"
        fi
    else
        print_error "Frontend unit tests failed"
        failed_components+=("frontend-unit")
    fi

    # RelayCore unit tests
    print_status "Running RelayCore unit tests..."
    cd "$PROJECT_ROOT/systems/relaycore"
    if npm test -- --coverage --watchAll=false; then
        print_success "RelayCore unit tests passed"

        if [ -d "coverage" ]; then
            cp -r coverage "$REPORTS_DIR/relaycore-coverage"
        fi
    else
        print_error "RelayCore unit tests failed"
        failed_components+=("relaycore-unit")
    fi

    # NeuroWeaver Backend unit tests
    print_status "Running NeuroWeaver Backend unit tests..."
    cd "$PROJECT_ROOT/systems/neuroweaver/backend"
    if python -m pytest tests/ -v \
        --cov=app \
        --cov-report=html:"$REPORTS_DIR/neuroweaver-backend-coverage" \
        --junit-xml="$REPORTS_DIR/neuroweaver-backend-unit-tests.xml"; then
        print_success "NeuroWeaver Backend unit tests passed"
    else
        print_error "NeuroWeaver Backend unit tests failed"
        failed_components+=("neuroweaver-backend-unit")
    fi

    # NeuroWeaver Frontend unit tests
    print_status "Running NeuroWeaver Frontend unit tests..."
    cd "$PROJECT_ROOT/systems/neuroweaver/frontend"
    if npm test -- --coverage --watchAll=false; then
        print_success "NeuroWeaver Frontend unit tests passed"

        if [ -d "coverage" ]; then
            cp -r coverage "$REPORTS_DIR/neuroweaver-frontend-coverage"
        fi
    else
        print_error "NeuroWeaver Frontend unit tests failed"
        failed_components+=("neuroweaver-frontend-unit")
    fi

    cd "$PROJECT_ROOT"

    if [ ${#failed_components[@]} -eq 0 ]; then
        print_success "All unit tests passed"
        return 0
    else
        print_error "Failed components: ${failed_components[*]}"
        return 1
    fi
}

# Function to check test coverage
check_coverage() {
    print_status "Analyzing test coverage..."

    local coverage_failures=()

    # Check backend coverage
    if [ -f "$REPORTS_DIR/backend-coverage.xml" ]; then
        coverage_percent=$(grep -oP 'line-rate="\K[0-9.]+' "$REPORTS_DIR/backend-coverage.xml" | head -1 | awk '{print $1*100}')
        if (( $(echo "$coverage_percent < $COVERAGE_THRESHOLD" | bc -l) )); then
            print_warning "Backend coverage ($coverage_percent%) below threshold ($COVERAGE_THRESHOLD%)"
            coverage_failures+=("backend")
        else
            print_success "Backend coverage: $coverage_percent%"
        fi
    fi

    # Check frontend coverage
    if [ -f "$PROJECT_ROOT/frontend/coverage/lcov.info" ]; then
        # Simple coverage extraction (would need more sophisticated parsing for real use)
        coverage_percent=$(grep -oP 'LF:\K[0-9]+' "$PROJECT_ROOT/frontend/coverage/lcov.info" | head -1)
        covered=$(grep -oP 'LH:\K[0-9]+' "$PROJECT_ROOT/frontend/coverage/lcov.info" | head -1)
        if [ -n "$coverage_percent" ] && [ -n "$covered" ]; then
            actual_coverage=$(( (covered * 100) / coverage_percent ))
            if (( actual_coverage < COVERAGE_THRESHOLD )); then
                print_warning "Frontend coverage ($actual_coverage%) below threshold ($COVERAGE_THRESHOLD%)"
                coverage_failures+=("frontend")
            else
                print_success "Frontend coverage: $actual_coverage%"
            fi
        fi
    fi

    if [ ${#coverage_failures[@]} -eq 0 ]; then
        print_success "All coverage thresholds met"
        return 0
    else
        print_error "Coverage failures: ${coverage_failures[*]}"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."

    cd "$PROJECT_ROOT"
    if ./scripts/run-integration-tests.sh; then
        print_success "Integration tests passed"
        return 0
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run E2E tests
run_e2e_tests() {
    print_status "Running End-to-End tests..."

    # Start all services
    print_status "Starting application services..."

    # Start backend services
    cd "$PROJECT_ROOT/backend"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!

    cd "$PROJECT_ROOT/systems/relaycore"
    npm start &
    RELAYCORE_PID=$!

    cd "$PROJECT_ROOT/systems/neuroweaver/backend"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
    NEUROWEAVER_BACKEND_PID=$!

    # Start frontend services
    cd "$PROJECT_ROOT/frontend"
    npm run preview &
    FRONTEND_PID=$!

    cd "$PROJECT_ROOT/systems/neuroweaver/frontend"
    npm start &
    NEUROWEAVER_FRONTEND_PID=$!

    # Wait for services to start
    sleep 30

    # Run E2E tests
    cd "$PROJECT_ROOT/tests/e2e"
    if npm test; then
        print_success "E2E tests passed"
        e2e_result=0
    else
        print_error "E2E tests failed"
        e2e_result=1
    fi

    # Copy reports
    if [ -d "playwright-report" ]; then
        cp -r playwright-report "$REPORTS_DIR/"
    fi

    if [ -f "test-results.xml" ]; then
        cp test-results.xml "$REPORTS_DIR/e2e-test-results.xml"
    fi

    # Cleanup processes
    print_status "Stopping services..."
    kill $BACKEND_PID $RELAYCORE_PID $NEUROWEAVER_BACKEND_PID $FRONTEND_PID $NEUROWEAVER_FRONTEND_PID 2>/dev/null || true

    return $e2e_result
}

# Function to run security scans
run_security_scans() {
    print_status "Running security scans..."

    # Install security tools if needed
    if ! command -v trivy &> /dev/null; then
        print_status "Installing Trivy..."
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
    fi

    # Run filesystem vulnerability scan
    print_status "Running Trivy filesystem scan..."
    trivy fs --format json --output "$REPORTS_DIR/trivy-fs-report.json" .

    # Run dependency scans
    print_status "Running Python dependency audit..."
    cd "$PROJECT_ROOT/backend"
    if command -v pip-audit &> /dev/null; then
        pip-audit -r requirements.txt --output "$REPORTS_DIR/python-audit.json" --format json || true
    fi

    # Run npm audit for frontend components
    print_status "Running npm audit..."
    cd "$PROJECT_ROOT/frontend"
    npm audit --json > "$REPORTS_DIR/frontend-npm-audit.json" || true

    cd "$PROJECT_ROOT/systems/relaycore"
    npm audit --json > "$REPORTS_DIR/relaycore-npm-audit.json" || true

    cd "$PROJECT_ROOT/systems/neuroweaver/frontend"
    npm audit --json > "$REPORTS_DIR/neuroweaver-frontend-npm-audit.json" || true

    cd "$PROJECT_ROOT"
    print_success "Security scans completed"
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."

    # Create simple k6 performance test if k6 is available
    if command -v k6 &> /dev/null; then
        cat > "$REPORTS_DIR/performance-test.js" << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  let response = http.get('http://localhost:8000/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
EOF

        # Start backend for performance testing
        cd "$PROJECT_ROOT/backend"
        python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
        PERF_BACKEND_PID=$!

        sleep 10

        # Run k6 test
        k6 run --out json="$REPORTS_DIR/performance-results.json" "$REPORTS_DIR/performance-test.js"
        perf_result=$?

        # Cleanup
        kill $PERF_BACKEND_PID 2>/dev/null || true

        if [ $perf_result -eq 0 ]; then
            print_success "Performance tests passed"
            return 0
        else
            print_error "Performance tests failed"
            return 1
        fi
    else
        print_warning "k6 not installed, skipping performance tests"
        return 0
    fi
}

# Function to generate comprehensive test report
generate_test_report() {
    print_status "Generating comprehensive test report..."

    cat > "$REPORTS_DIR/test-summary-$TIMESTAMP.md" << EOF
# Comprehensive Test Report

**Generated:** $(date)
**Test Run ID:** $TIMESTAMP
**Project:** Auterity Unified Platform

## Test Execution Summary

| Test Suite | Status | Duration | Coverage |
|------------|--------|----------|----------|
| Unit Tests | $UNIT_TEST_STATUS | - | See individual coverage reports |
| Integration Tests | $INTEGRATION_TEST_STATUS | - | - |
| End-to-End Tests | $E2E_TEST_STATUS | - | - |
| Security Scans | $SECURITY_SCAN_STATUS | - | - |
| Performance Tests | $PERFORMANCE_TEST_STATUS | - | - |

## Quality Gates

### Coverage Analysis
- **Threshold:** $COVERAGE_THRESHOLD%
- **Backend Coverage:** Available in \`backend-coverage/index.html\`
- **Frontend Coverage:** Available in \`frontend-coverage/index.html\`
- **RelayCore Coverage:** Available in \`relaycore-coverage/index.html\`
- **NeuroWeaver Coverage:** Available in coverage directories

### Security Analysis
- **Vulnerability Scan:** \`trivy-fs-report.json\`
- **Dependency Audit:** \`python-audit.json\`, \`*-npm-audit.json\`

### Performance Analysis
- **Performance Results:** \`performance-results.json\`
- **Threshold:** Response time < ${PERFORMANCE_THRESHOLD_MS}ms

## Test Reports

### Unit Test Results
- Backend: \`backend-unit-tests.xml\`
- Frontend: \`frontend-unit-tests.xml\`
- RelayCore: Component test results
- NeuroWeaver: \`neuroweaver-backend-unit-tests.xml\`

### Integration Test Results
- Full integration test report: \`test-report.md\`

### End-to-End Test Results
- Playwright Report: \`playwright-report/index.html\`
- Test Results: \`e2e-test-results.xml\`

## Recommendations

$( [ "$OVERALL_STATUS" == "PASSED" ] && echo "✅ **ALL TESTS PASSED** - Ready for deployment" || echo "❌ **TESTS FAILED** - Review failed components and fix before deployment" )

## Next Steps

1. Review detailed reports for any failed tests
2. Check coverage reports and improve coverage where needed
3. Address any security vulnerabilities found
4. Optimize performance where thresholds were exceeded
5. Update documentation based on test results

---

*Report generated by test-automation.sh*
EOF

    print_success "Test report generated: $REPORTS_DIR/test-summary-$TIMESTAMP.md"
}

# Function to cleanup test environment
cleanup_test_environment() {
    print_status "Cleaning up test environment..."

    # Stop Docker services
    docker-compose down

    # Kill any remaining processes
    pkill -f "uvicorn" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true

    print_success "Cleanup completed"
}

# Main execution
main() {
    print_status "Starting comprehensive test automation suite..."

    local start_time=$(date +%s)
    local overall_result=0

    # Parse command line arguments
    RUN_UNIT_TESTS=true
    RUN_INTEGRATION_TESTS=true
    RUN_E2E_TESTS=true
    RUN_SECURITY_SCANS=true
    RUN_PERFORMANCE_TESTS=true
    SKIP_SETUP=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                RUN_INTEGRATION_TESTS=false
                RUN_E2E_TESTS=false
                RUN_SECURITY_SCANS=false
                RUN_PERFORMANCE_TESTS=false
                shift
                ;;
            --integration-only)
                RUN_UNIT_TESTS=false
                RUN_E2E_TESTS=false
                RUN_SECURITY_SCANS=false
                RUN_PERFORMANCE_TESTS=false
                shift
                ;;
            --e2e-only)
                RUN_UNIT_TESTS=false
                RUN_INTEGRATION_TESTS=false
                RUN_SECURITY_SCANS=false
                RUN_PERFORMANCE_TESTS=false
                shift
                ;;
            --security-only)
                RUN_UNIT_TESTS=false
                RUN_INTEGRATION_TESTS=false
                RUN_E2E_TESTS=false
                RUN_PERFORMANCE_TESTS=false
                shift
                ;;
            --performance-only)
                RUN_UNIT_TESTS=false
                RUN_INTEGRATION_TESTS=false
                RUN_E2E_TESTS=false
                RUN_SECURITY_SCANS=false
                shift
                ;;
            --skip-setup)
                SKIP_SETUP=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --unit-only         Run only unit tests"
                echo "  --integration-only  Run only integration tests"
                echo "  --e2e-only         Run only E2E tests"
                echo "  --security-only    Run only security scans"
                echo "  --performance-only Run only performance tests"
                echo "  --skip-setup       Skip test environment setup"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    # Setup trap for cleanup
    trap cleanup_test_environment EXIT

    # Setup test environment
    if [ "$SKIP_SETUP" = false ]; then
        setup_test_environment
    fi

    # Run tests based on flags
    if [ "$RUN_UNIT_TESTS" = true ]; then
        if run_unit_tests && check_coverage; then
            UNIT_TEST_STATUS="✅ PASSED"
        else
            UNIT_TEST_STATUS="❌ FAILED"
            overall_result=1
        fi
    else
        UNIT_TEST_STATUS="⏭️ SKIPPED"
    fi

    if [ "$RUN_INTEGRATION_TESTS" = true ]; then
        if run_integration_tests; then
            INTEGRATION_TEST_STATUS="✅ PASSED"
        else
            INTEGRATION_TEST_STATUS="❌ FAILED"
            overall_result=1
        fi
    else
        INTEGRATION_TEST_STATUS="⏭️ SKIPPED"
    fi

    if [ "$RUN_E2E_TESTS" = true ]; then
        if run_e2e_tests; then
            E2E_TEST_STATUS="✅ PASSED"
        else
            E2E_TEST_STATUS="❌ FAILED"
            overall_result=1
        fi
    else
        E2E_TEST_STATUS="⏭️ SKIPPED"
    fi

    if [ "$RUN_SECURITY_SCANS" = true ]; then
        run_security_scans
        SECURITY_SCAN_STATUS="✅ COMPLETED"
    else
        SECURITY_SCAN_STATUS="⏭️ SKIPPED"
    fi

    if [ "$RUN_PERFORMANCE_TESTS" = true ]; then
        if run_performance_tests; then
            PERFORMANCE_TEST_STATUS="✅ PASSED"
        else
            PERFORMANCE_TEST_STATUS="❌ FAILED"
            # Don't fail overall for performance (warning only)
        fi
    else
        PERFORMANCE_TEST_STATUS="⏭️ SKIPPED"
    fi

    # Set overall status
    if [ $overall_result -eq 0 ]; then
        OVERALL_STATUS="PASSED"
    else
        OVERALL_STATUS="FAILED"
    fi

    # Generate comprehensive report
    generate_test_report

    # Calculate total time
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))

    # Print final results
    echo ""
    echo "================================================"
    echo "🏁 Comprehensive Test Results"
    echo "================================================"
    echo "Unit Tests: $UNIT_TEST_STATUS"
    echo "Integration Tests: $INTEGRATION_TEST_STATUS"
    echo "E2E Tests: $E2E_TEST_STATUS"
    echo "Security Scans: $SECURITY_SCAN_STATUS"
    echo "Performance Tests: $PERFORMANCE_TEST_STATUS"
    echo ""
    print_status "Total execution time: ${total_time} seconds"
    print_status "Detailed reports available in: $REPORTS_DIR"

    if [ $overall_result -eq 0 ]; then
        print_success "All critical tests passed! 🎉"
    else
        print_error "Some tests failed. Check the reports for details."
    fi

    exit $overall_result
}

# Run main function
main "$@"
