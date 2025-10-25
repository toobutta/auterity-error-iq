#!/bin/bash

# Deployment Validation Script
# Comprehensive validation of deployment health and functionality

set -euo pipefail

# Configuration
TIMEOUT=${TIMEOUT:-300}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Validation functions
validate_service_health() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}

    log_info "Validating $service_name health..."

    local attempts=0
    local max_attempts=$((TIMEOUT / RETRY_INTERVAL))

    while [ $attempts -lt $max_attempts ]; do
        if curl -s -f -o /dev/null -w "%{http_code}" "$health_url" | grep -q "$expected_status"; then
            log_success "$service_name is healthy"
            return 0
        fi

        attempts=$((attempts + 1))
        log_warning "$service_name not ready, attempt $attempts/$max_attempts"
        sleep $RETRY_INTERVAL
    done

    log_error "$service_name failed health check after $max_attempts attempts"
    return 1
}

validate_database_connectivity() {
    log_info "Validating database connectivity..."

    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        log_success "PostgreSQL is accessible"
    else
        log_error "PostgreSQL is not accessible"
        return 1
    fi

    # Test database queries
    if docker-compose exec -T postgres psql -U postgres -d auterity -c "SELECT 1;" >/dev/null 2>&1; then
        log_success "Database queries are working"
    else
        log_error "Database queries are failing"
        return 1
    fi
}

validate_cache_connectivity() {
    log_info "Validating cache connectivity..."

    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis is accessible"
    else
        log_error "Redis is not accessible"
        return 1
    fi

    # Test cache operations
    if docker-compose exec -T redis redis-cli set test_key "test_value" | grep -q "OK"; then
        if docker-compose exec -T redis redis-cli get test_key | grep -q "test_value"; then
            docker-compose exec -T redis redis-cli del test_key >/dev/null
            log_success "Cache operations are working"
        else
            log_error "Cache read operation failed"
            return 1
        fi
    else
        log_error "Cache write operation failed"
        return 1
    fi
}

validate_api_endpoints() {
    log_info "Validating API endpoints..."

    local base_url="http://localhost:8080/api"

    # Test health endpoint
    if ! validate_service_health "API Health" "$base_url/health"; then
        return 1
    fi

    # Test authentication endpoint
    local auth_response=$(curl -s -X POST "$base_url/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"test","password":"test"}' \
        -w "%{http_code}")

    if echo "$auth_response" | grep -q "401\|400"; then
        log_success "Authentication endpoint is responding correctly"
    else
        log_error "Authentication endpoint is not responding correctly"
        return 1
    fi

    # Test workflow endpoints
    local workflows_response=$(curl -s "$base_url/workflows" -w "%{http_code}")
    if echo "$workflows_response" | grep -q "200\|401"; then
        log_success "Workflows endpoint is accessible"
    else
        log_error "Workflows endpoint is not accessible"
        return 1
    fi
}

validate_frontend_functionality() {
    log_info "Validating frontend functionality..."

    local frontend_url="http://localhost:3000"

    # Check if frontend is serving content
    if ! validate_service_health "Frontend" "$frontend_url"; then
        return 1
    fi

    # Check for critical assets
    local assets_to_check=(
        "/static/js"
        "/static/css"
        "/manifest.json"
    )

    for asset in "${assets_to_check[@]}"; do
        if curl -s -f "$frontend_url$asset" >/dev/null 2>&1; then
            log_success "Frontend asset $asset is accessible"
        else
            log_warning "Frontend asset $asset is not accessible (may be normal)"
        fi
    done
}

validate_monitoring_stack() {
    log_info "Validating monitoring stack..."

    # Prometheus
    if validate_service_health "Prometheus" "http://localhost:9090/-/healthy"; then
        # Check if Prometheus is scraping targets
        local targets_response=$(curl -s "http://localhost:9090/api/v1/targets")
        if echo "$targets_response" | grep -q '"status":"success"'; then
            log_success "Prometheus is scraping targets"
        else
            log_warning "Prometheus may not be scraping all targets"
        fi
    fi

    # Grafana
    validate_service_health "Grafana" "http://localhost:3001/api/health"

    # AlertManager
    validate_service_health "AlertManager" "http://localhost:9093/-/healthy"
}

validate_workflow_execution() {
    log_info "Validating workflow execution capabilities..."

    # This would typically create and execute a test workflow
    # For now, we'll just check if the workflow engine is responsive

    local workflow_test_payload='{
        "name": "validation_test_workflow",
        "description": "Test workflow for deployment validation",
        "nodes": [
            {
                "id": "start",
                "type": "start",
                "data": {"label": "Start"}
            },
            {
                "id": "end",
                "type": "end",
                "data": {"label": "End"}
            }
        ],
        "edges": [
            {
                "id": "start-end",
                "source": "start",
                "target": "end"
            }
        ]
    }'

    # Test workflow creation (this would need proper authentication)
    log_info "Testing workflow engine responsiveness..."
    local workflow_response=$(curl -s -X POST "http://localhost:8080/api/workflows" \
        -H "Content-Type: application/json" \
        -d "$workflow_test_payload" \
        -w "%{http_code}" || echo "000")

    if echo "$workflow_response" | grep -q "401\|403"; then
        log_success "Workflow engine is responding (authentication required as expected)"
    elif echo "$workflow_response" | grep -q "201\|200"; then
        log_success "Workflow engine is fully functional"
    else
        log_warning "Workflow engine response unclear, manual verification recommended"
    fi
}

validate_security_headers() {
    log_info "Validating security headers..."

    local security_headers=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
    )

    for header in "${security_headers[@]}"; do
        if curl -s -I "http://localhost:3000" | grep -i "$header" >/dev/null; then
            log_success "Security header $header is present"
        else
            log_warning "Security header $header is missing"
        fi
    done
}

validate_performance_metrics() {
    log_info "Validating performance metrics..."

    # Check response times
    local api_response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:8080/api/health")
    local frontend_response_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:3000")

    if (( $(echo "$api_response_time < 2.0" | bc -l) )); then
        log_success "API response time is acceptable (${api_response_time}s)"
    else
        log_warning "API response time is slow (${api_response_time}s)"
    fi

    if (( $(echo "$frontend_response_time < 3.0" | bc -l) )); then
        log_success "Frontend response time is acceptable (${frontend_response_time}s)"
    else
        log_warning "Frontend response time is slow (${frontend_response_time}s)"
    fi
}

generate_validation_report() {
    log_info "Generating validation report..."

    local report_file="deployment-validation-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# Deployment Validation Report

**Environment:** $ENVIRONMENT
**Timestamp:** $(date)
**Validation Duration:** ${SECONDS}s

## Validation Results

### ✅ Successful Validations
$(grep -o "SUCCESS.*" /tmp/validation.log 2>/dev/null | sed 's/^/- /' || echo "- No successful validations logged")

### ⚠️ Warnings
$(grep -o "WARNING.*" /tmp/validation.log 2>/dev/null | sed 's/^/- /' || echo "- No warnings")

### ❌ Failures
$(grep -o "ERROR.*" /tmp/validation.log 2>/dev/null | sed 's/^/- /' || echo "- No failures")

## Service Status Summary

| Service | Status | Response Time |
|---------|--------|---------------|
| Backend API | $(curl -s -f "http://localhost:8080/api/health" >/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy") | $(curl -s -o /dev/null -w "%{time_total}s" "http://localhost:8080/api/health" 2>/dev/null || echo "N/A") |
| Frontend | $(curl -s -f "http://localhost:3000" >/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy") | $(curl -s -o /dev/null -w "%{time_total}s" "http://localhost:3000" 2>/dev/null || echo "N/A") |
| PostgreSQL | $(docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1 && echo "✅ Healthy" || echo "❌ Unhealthy") | N/A |
| Redis | $(docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG" && echo "✅ Healthy" || echo "❌ Unhealthy") | N/A |
| Prometheus | $(curl -s -f "http://localhost:9090/-/healthy" >/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy") | $(curl -s -o /dev/null -w "%{time_total}s" "http://localhost:9090/-/healthy" 2>/dev/null || echo "N/A") |
| Grafana | $(curl -s -f "http://localhost:3001/api/health" >/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy") | $(curl -s -o /dev/null -w "%{time_total}s" "http://localhost:3001/api/health" 2>/dev/null || echo "N/A") |

## Recommendations

- Monitor service performance over the next 24 hours
- Verify all integrations are working as expected
- Run load tests if this is a production deployment
- Update monitoring dashboards with new deployment metrics

---
*Report generated by deployment validation script*
EOF

    log_success "Validation report saved to $report_file"
}

# Main validation process
main() {
    log_info "Starting deployment validation for $ENVIRONMENT environment..."

    # Redirect logs for report generation
    exec > >(tee /tmp/validation.log)
    exec 2>&1

    local validation_failed=false

    # Core service validations
    validate_database_connectivity || validation_failed=true
    validate_cache_connectivity || validation_failed=true
    validate_api_endpoints || validation_failed=true
    validate_frontend_functionality || validation_failed=true

    # Optional validations (warnings only)
    validate_monitoring_stack || true
    validate_workflow_execution || true
    validate_security_headers || true
    validate_performance_metrics || true

    # Generate report
    generate_validation_report

    if [ "$validation_failed" = true ]; then
        log_error "❌ Deployment validation failed - critical issues detected"
        exit 1
    else
        log_success "✅ Deployment validation completed successfully"
        log_info "All critical services are healthy and functional"
    fi
}

# Script usage
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 [ENVIRONMENT]"
    echo ""
    echo "Validates deployment health and functionality"
    echo ""
    echo "Environment variables:"
    echo "  TIMEOUT        - Maximum wait time for services (default: 300s)"
    echo "  RETRY_INTERVAL - Time between retry attempts (default: 10s)"
    echo "  ENVIRONMENT    - Target environment name (default: production)"
    exit 0
fi

# Set environment if provided
if [[ -n "${1:-}" ]]; then
    ENVIRONMENT="$1"
fi

# Execute main function
main "$@"
