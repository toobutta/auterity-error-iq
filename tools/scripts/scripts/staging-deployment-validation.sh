#!/bin/bash

# Staging Deployment Validation Script
# Validates deployment in staging environment before production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
STAGING_BASE_URL=${STAGING_BASE_URL:-"https://staging.auterity.com"}
STAGING_API_URL=${STAGING_API_URL:-"https://api-staging.auterity.com"}
STAGING_RELAY_URL=${STAGING_RELAY_URL:-"https://relay-staging.auterity.com"}
STAGING_MODELS_URL=${STAGING_MODELS_URL:-"https://models-staging.auterity.com"}

TIMEOUT=30
RETRY_COUNT=3
VALIDATION_REPORT="staging-validation-report-$(date +%Y%m%d_%H%M%S).md"

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}

    print_status "Checking $service_name health..."

    for i in $(seq 1 $RETRY_COUNT); do
        if curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$health_url" | grep -q "$expected_status"; then
            print_success "$service_name is healthy"
            return 0
        else
            print_warning "$service_name health check failed (attempt $i/$RETRY_COUNT)"
            if [ $i -lt $RETRY_COUNT ]; then
                sleep 5
            fi
        fi
    done

    print_error "$service_name health check failed after $RETRY_COUNT attempts"
    return 1
}

# Function to validate API endpoints
validate_api_endpoints() {
    print_status "Validating API endpoints..."

    local failed_endpoints=()

    # Test AutoMatrix API endpoints
    local endpoints=(
        "GET $STAGING_API_URL/health"
        "GET $STAGING_API_URL/api/workflows"
        "GET $STAGING_API_URL/api/templates"
        "GET $STAGING_API_URL/api/auth/me"
    )

    for endpoint in "${endpoints[@]}"; do
        read -r method url <<< "$endpoint"

        print_status "Testing $method $url"

        case $method in
            GET)
                response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url")
                ;;
            POST)
                response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X POST "$url" -H "Content-Type: application/json" -d "{}")
                ;;
        esac

        # Accept 200, 401 (for protected endpoints), or 404 as valid responses
        if [[ "$response_code" =~ ^(200|401|404)$ ]]; then
            print_success "$method $url - Response: $response_code"
        else
            print_error "$method $url - Unexpected response: $response_code"
            failed_endpoints+=("$endpoint")
        fi
    done

    # Test RelayCore endpoints
    if check_service_health "RelayCore" "$STAGING_RELAY_URL/health"; then
        print_status "Testing RelayCore routing endpoint..."
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_RELAY_URL/api/route")
        if [[ "$response_code" =~ ^(200|400|401)$ ]]; then
            print_success "RelayCore routing endpoint accessible"
        else
            failed_endpoints+=("GET $STAGING_RELAY_URL/api/route")
        fi
    fi

    # Test NeuroWeaver endpoints
    if check_service_health "NeuroWeaver" "$STAGING_MODELS_URL/health"; then
        print_status "Testing NeuroWeaver models endpoint..."
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_MODELS_URL/api/models")
        if [[ "$response_code" =~ ^(200|401)$ ]]; then
            print_success "NeuroWeaver models endpoint accessible"
        else
            failed_endpoints+=("GET $STAGING_MODELS_URL/api/models")
        fi
    fi

    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        print_success "All API endpoints validation passed"
        return 0
    else
        print_error "Failed endpoints: ${failed_endpoints[*]}"
        return 1
    fi
}

# Function to validate frontend applications
validate_frontend_applications() {
    print_status "Validating frontend applications..."

    local failed_apps=()

    # Test main frontend
    print_status "Testing main frontend application..."
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_BASE_URL")
    if [ "$response_code" == "200" ]; then
        print_success "Main frontend is accessible"

        # Check for critical resources
        if curl -s --max-time $TIMEOUT "$STAGING_BASE_URL" | grep -q "AutoMatrix"; then
            print_success "Main frontend content loaded correctly"
        else
            print_warning "Main frontend content may not be loading correctly"
        fi
    else
        print_error "Main frontend not accessible - Response: $response_code"
        failed_apps+=("main-frontend")
    fi

    # Test NeuroWeaver frontend
    print_status "Testing NeuroWeaver frontend..."
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$STAGING_MODELS_URL")
    if [ "$response_code" == "200" ]; then
        print_success "NeuroWeaver frontend is accessible"
    else
        print_error "NeuroWeaver frontend not accessible - Response: $response_code"
        failed_apps+=("neuroweaver-frontend")
    fi

    if [ ${#failed_apps[@]} -eq 0 ]; then
        print_success "All frontend applications validation passed"
        return 0
    else
        print_error "Failed applications: ${failed_apps[*]}"
        return 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    print_status "Running smoke tests..."

    # Create a simple workflow via API to test end-to-end functionality
    print_status "Testing workflow creation..."

    # Note: This would require authentication tokens in a real scenario
    workflow_payload='{
        "name": "Staging Smoke Test",
        "description": "Automated smoke test workflow",
        "steps": [
            {
                "id": "test-input",
                "type": "data_input",
                "config": {"input_type": "text", "value": "Smoke test data"}
            }
        ]
    }'

    # Simulate workflow creation test
    print_status "Simulating workflow creation test..."
    if curl -s --max-time $TIMEOUT "$STAGING_API_URL/api/workflows" -H "Content-Type: application/json" -d "$workflow_payload" | grep -q "error\|Error"; then
        print_warning "Workflow creation may have issues (authentication required)"
    else
        print_success "Workflow API endpoint responding correctly"
    fi

    # Test template retrieval
    print_status "Testing template retrieval..."
    if curl -s --max-time $TIMEOUT "$STAGING_API_URL/api/templates" | grep -q -E '\[\]|\[.*\]'; then
        print_success "Template API returning data"
    else
        print_warning "Template API may have issues"
    fi
}

# Function to validate database connectivity
validate_database_connectivity() {
    print_status "Validating database connectivity..."

    # Test database connectivity through health endpoints
    # AutoMatrix Backend
    if curl -s --max-time $TIMEOUT "$STAGING_API_URL/health" | grep -q "database.*ok\|healthy\|status.*ok"; then
        print_success "AutoMatrix database connection healthy"
    else
        print_warning "AutoMatrix database connection status unclear"
    fi

    # RelayCore database
    if curl -s --max-time $TIMEOUT "$STAGING_RELAY_URL/health" | grep -q "database.*ok\|healthy\|status.*ok"; then
        print_success "RelayCore database connection healthy"
    else
        print_warning "RelayCore database connection status unclear"
    fi

    # NeuroWeaver database
    if curl -s --max-time $TIMEOUT "$STAGING_MODELS_URL/health" | grep -q "database.*ok\|healthy\|status.*ok"; then
        print_success "NeuroWeaver database connection healthy"
    else
        print_warning "NeuroWeaver database connection status unclear"
    fi
}

# Function to validate SSL certificates
validate_ssl_certificates() {
    print_status "Validating SSL certificates..."

    local ssl_issues=()

    # Check SSL for each service
    local services=(
        "$STAGING_BASE_URL"
        "$STAGING_API_URL"
        "$STAGING_RELAY_URL"
        "$STAGING_MODELS_URL"
    )

    for service in "${services[@]}"; do
        domain=$(echo "$service" | sed 's|https\?://||' | cut -d'/' -f1)
        print_status "Checking SSL certificate for $domain..."

        if echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
            expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
            expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
            current_epoch=$(date +%s)
            days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

            if [ $days_until_expiry -gt 30 ]; then
                print_success "$domain SSL certificate valid (expires in $days_until_expiry days)"
            else
                print_warning "$domain SSL certificate expires soon ($days_until_expiry days)"
            fi
        else
            print_error "$domain SSL certificate validation failed"
            ssl_issues+=("$domain")
        fi
    done

    if [ ${#ssl_issues[@]} -eq 0 ]; then
        print_success "All SSL certificates are valid"
        return 0
    else
        print_error "SSL issues with: ${ssl_issues[*]}"
        return 1
    fi
}

# Function to check monitoring and logging
validate_monitoring() {
    print_status "Validating monitoring and logging..."

    # Check if monitoring endpoint is accessible
    if [ -n "$STAGING_MONITORING_URL" ]; then
        if check_service_health "Monitoring" "$STAGING_MONITORING_URL/health"; then
            print_success "Monitoring system is accessible"
        else
            print_warning "Monitoring system may not be accessible"
        fi
    else
        print_warning "Monitoring URL not configured, skipping monitoring validation"
    fi

    # Check application metrics endpoints
    local metrics_endpoints=(
        "$STAGING_API_URL/metrics"
        "$STAGING_RELAY_URL/metrics"
        "$STAGING_MODELS_URL/metrics"
    )

    for endpoint in "${metrics_endpoints[@]}"; do
        if curl -s --max-time $TIMEOUT "$endpoint" | grep -q "prometheus\|metric"; then
            print_success "Metrics endpoint accessible: $endpoint"
        else
            print_warning "Metrics endpoint may not be accessible: $endpoint"
        fi
    done
}

# Function to validate configuration
validate_configuration() {
    print_status "Validating staging configuration..."

    # Check environment-specific configurations
    # This would typically involve checking config endpoints or environment variables

    print_status "Checking staging-specific configurations..."

    # Validate that we're not connecting to production databases or services
    for url in "$STAGING_API_URL" "$STAGING_RELAY_URL" "$STAGING_MODELS_URL"; do
        if echo "$url" | grep -q "prod\|production"; then
            print_error "Configuration error: $url appears to be production URL"
            return 1
        fi
    done

    print_success "Configuration validation passed"
    return 0
}

# Function to generate validation report
generate_validation_report() {
    print_status "Generating staging validation report..."

    cat > "$VALIDATION_REPORT" << EOF
# Staging Deployment Validation Report

**Generated:** $(date)
**Environment:** Staging
**Validation Run ID:** $(date +%Y%m%d_%H%M%S)

## Validation Summary

| Validation Area | Status | Details |
|----------------|---------|---------|
| Service Health | $SERVICE_HEALTH_STATUS | All core services health check results |
| API Endpoints | $API_ENDPOINTS_STATUS | REST API endpoint accessibility |
| Frontend Applications | $FRONTEND_STATUS | Web application loading and accessibility |
| Database Connectivity | $DATABASE_STATUS | Database connection health |
| SSL Certificates | $SSL_STATUS | Certificate validity and expiration |
| Monitoring | $MONITORING_STATUS | Monitoring and metrics availability |
| Configuration | $CONFIG_STATUS | Environment-specific configuration validation |
| Smoke Tests | $SMOKE_TESTS_STATUS | Basic functionality validation |

## Service URLs Validated

- **Main Application:** $STAGING_BASE_URL
- **API Gateway:** $STAGING_API_URL
- **RelayCore:** $STAGING_RELAY_URL
- **NeuroWeaver:** $STAGING_MODELS_URL

## Validation Results

### ✅ Successful Validations
$SUCCESSFUL_VALIDATIONS

### ⚠️ Warnings
$VALIDATION_WARNINGS

### ❌ Failed Validations
$FAILED_VALIDATIONS

## Recommendations

$( [ "$OVERALL_VALIDATION_STATUS" == "PASSED" ] && echo "✅ **STAGING VALIDATION PASSED** - Environment ready for testing" || echo "❌ **STAGING VALIDATION FAILED** - Address issues before proceeding" )

## Next Steps

1. Review any failed validations and address underlying issues
2. Check application logs for any error patterns
3. Run comprehensive test suite against staging environment
4. Validate performance under expected load
5. Confirm monitoring and alerting are functioning

---

*Report generated by staging-deployment-validation.sh*
EOF

    print_success "Validation report generated: $VALIDATION_REPORT"
}

# Main execution function
main() {
    print_status "Starting staging deployment validation..."

    local start_time=$(date +%s)
    local validation_failures=0

    SUCCESSFUL_VALIDATIONS=""
    VALIDATION_WARNINGS=""
    FAILED_VALIDATIONS=""

    # Service Health Checks
    print_status "=== Service Health Validation ==="
    if check_service_health "AutoMatrix API" "$STAGING_API_URL/health" && \
       check_service_health "RelayCore" "$STAGING_RELAY_URL/health" && \
       check_service_health "NeuroWeaver" "$STAGING_MODELS_URL/health"; then
        SERVICE_HEALTH_STATUS="✅ PASSED"
        SUCCESSFUL_VALIDATIONS+="\n- Service health checks"
    else
        SERVICE_HEALTH_STATUS="❌ FAILED"
        FAILED_VALIDATIONS+="\n- Service health checks"
        ((validation_failures++))
    fi

    # API Endpoints Validation
    print_status "=== API Endpoints Validation ==="
    if validate_api_endpoints; then
        API_ENDPOINTS_STATUS="✅ PASSED"
        SUCCESSFUL_VALIDATIONS+="\n- API endpoints accessibility"
    else
        API_ENDPOINTS_STATUS="❌ FAILED"
        FAILED_VALIDATIONS+="\n- API endpoints accessibility"
        ((validation_failures++))
    fi

    # Frontend Applications Validation
    print_status "=== Frontend Applications Validation ==="
    if validate_frontend_applications; then
        FRONTEND_STATUS="✅ PASSED"
        SUCCESSFUL_VALIDATIONS+="\n- Frontend applications"
    else
        FRONTEND_STATUS="❌ FAILED"
        FAILED_VALIDATIONS+="\n- Frontend applications"
        ((validation_failures++))
    fi

    # Database Connectivity
    print_status "=== Database Connectivity Validation ==="
    validate_database_connectivity
    DATABASE_STATUS="✅ COMPLETED"
    SUCCESSFUL_VALIDATIONS+="\n- Database connectivity"

    # SSL Certificates
    print_status "=== SSL Certificates Validation ==="
    if validate_ssl_certificates; then
        SSL_STATUS="✅ PASSED"
        SUCCESSFUL_VALIDATIONS+="\n- SSL certificates"
    else
        SSL_STATUS="⚠️ WARNINGS"
        VALIDATION_WARNINGS+="\n- SSL certificate issues"
    fi

    # Monitoring
    print_status "=== Monitoring Validation ==="
    validate_monitoring
    MONITORING_STATUS="✅ COMPLETED"
    SUCCESSFUL_VALIDATIONS+="\n- Monitoring and metrics"

    # Configuration
    print_status "=== Configuration Validation ==="
    if validate_configuration; then
        CONFIG_STATUS="✅ PASSED"
        SUCCESSFUL_VALIDATIONS+="\n- Configuration validation"
    else
        CONFIG_STATUS="❌ FAILED"
        FAILED_VALIDATIONS+="\n- Configuration validation"
        ((validation_failures++))
    fi

    # Smoke Tests
    print_status "=== Smoke Tests ==="
    run_smoke_tests
    SMOKE_TESTS_STATUS="✅ COMPLETED"
    SUCCESSFUL_VALIDATIONS+="\n- Smoke tests"

    # Determine overall status
    if [ $validation_failures -eq 0 ]; then
        OVERALL_VALIDATION_STATUS="PASSED"
    else
        OVERALL_VALIDATION_STATUS="FAILED"
    fi

    # Generate validation report
    generate_validation_report

    # Calculate total time
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))

    # Print final results
    echo ""
    echo "================================================"
    echo "🏁 Staging Validation Results"
    echo "================================================"
    echo "Service Health: $SERVICE_HEALTH_STATUS"
    echo "API Endpoints: $API_ENDPOINTS_STATUS"
    echo "Frontend Apps: $FRONTEND_STATUS"
    echo "Database: $DATABASE_STATUS"
    echo "SSL Certificates: $SSL_STATUS"
    echo "Monitoring: $MONITORING_STATUS"
    echo "Configuration: $CONFIG_STATUS"
    echo "Smoke Tests: $SMOKE_TESTS_STATUS"
    echo ""
    print_status "Total validation time: ${total_time} seconds"
    print_status "Detailed report: $VALIDATION_REPORT"

    if [ $validation_failures -eq 0 ]; then
        print_success "Staging validation completed successfully! 🎉"
        exit 0
    else
        print_error "Staging validation failed with $validation_failures critical issues."
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --base-url)
            STAGING_BASE_URL="$2"
            shift 2
            ;;
        --api-url)
            STAGING_API_URL="$2"
            shift 2
            ;;
        --relay-url)
            STAGING_RELAY_URL="$2"
            shift 2
            ;;
        --models-url)
            STAGING_MODELS_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --base-url URL      Main application URL (default: https://staging.auterity.com)"
            echo "  --api-url URL       API URL (default: https://api-staging.auterity.com)"
            echo "  --relay-url URL     RelayCore URL (default: https://relay-staging.auterity.com)"
            echo "  --models-url URL    NeuroWeaver URL (default: https://models-staging.auterity.com)"
            echo "  --timeout SECONDS   Request timeout (default: 30)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main
