#!/bin/bash

# Auterity Error-IQ Health Validation Script
# Comprehensive validation of all system components and integrations

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VALIDATION_TIMEOUT=300  # 5 minutes
LOG_FILE="${PROJECT_ROOT}/logs/health-validation-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Validation results
declare -A validation_results
declare -a failed_checks
declare -a warning_checks

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
    validation_results["$1"]="PASS"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
    validation_results["$1"]="WARN"
    warning_checks+=("$1")
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    validation_results["$1"]="FAIL"
    failed_checks+=("$1")
}

# Infrastructure validation
validate_infrastructure() {
    log "🏗️ Validating Infrastructure..."

    # Check Kubernetes cluster
    if kubectl cluster-info >/dev/null 2>&1; then
        success "Kubernetes cluster accessible"
    else
        error "Kubernetes cluster not accessible"
        return 1
    fi

    # Check namespace
    if kubectl get namespace auterity >/dev/null 2>&1; then
        success "Auterity namespace exists"
    else
        error "Auterity namespace missing"
        return 1
    fi

    # Check ConfigMaps
    if kubectl get configmap -n auterity >/dev/null 2>&1; then
        success "ConfigMaps configured"
    else
        warning "ConfigMaps not found"
    fi

    # Check Secrets
    if kubectl get secret -n auterity >/dev/null 2>&1; then
        success "Secrets configured"
    else
        error "Secrets not configured"
        return 1
    fi

    return 0
}

validate_database() {
    log "🗄️ Validating Database..."

    # Check PostgreSQL deployment
    if kubectl get deployment postgres -n auterity >/dev/null 2>&1; then
        success "PostgreSQL deployment exists"
    else
        error "PostgreSQL deployment missing"
        return 1
    fi

    # Check PostgreSQL pod status
    local postgres_status
    postgres_status=$(kubectl get pods -n auterity -l app=postgres -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
    if [ "$postgres_status" = "Running" ]; then
        success "PostgreSQL pod running"
    else
        error "PostgreSQL pod not running (status: $postgres_status)"
        return 1
    fi

    # Test PostgreSQL connection
    if kubectl exec -n auterity deployment/postgres -- pg_isready -U auterity >/dev/null 2>&1; then
        success "PostgreSQL connection healthy"
    else
        error "PostgreSQL connection failed"
        return 1
    fi

    # Check Redis
    if kubectl get deployment redis -n auterity >/dev/null 2>&1; then
        success "Redis deployment exists"
    else
        error "Redis deployment missing"
        return 1
    fi

    local redis_status
    redis_status=$(kubectl get pods -n auterity -l app=redis -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
    if [ "$redis_status" = "Running" ]; then
        success "Redis pod running"
    else
        error "Redis pod not running (status: $redis_status)"
        return 1
    fi

    return 0
}

validate_services() {
    log "🔧 Validating Services..."

    local services=("api-gateway" "ai-orchestrator" "workflow-engine" "analytics-service" "frontend")
    local all_healthy=true

    for service in "${services[@]}"; do
        # Check deployment exists
        if ! kubectl get deployment "$service" -n auterity >/dev/null 2>&1; then
            error "Service deployment missing: $service"
            all_healthy=false
            continue
        fi

        # Check pod status
        local pod_status
        pod_status=$(kubectl get pods -n auterity -l app="$service" -o jsonpath='{.items[0].status.phase}' 2>/dev/null)

        if [ "$pod_status" = "Running" ]; then
            success "Service running: $service"
        else
            error "Service not running: $service (status: $pod_status)"
            all_healthy=false
        fi

        # Check service endpoints
        if kubectl get service "$service" -n auterity >/dev/null 2>&1; then
            success "Service endpoint configured: $service"
        else
            warning "Service endpoint missing: $service"
        fi
    done

    return $all_healthy
}

validate_networking() {
    log "🌐 Validating Networking..."

    # Check ingress
    if kubectl get ingress -n auterity >/dev/null 2>&1; then
        success "Ingress configured"
    else
        warning "Ingress not configured"
    fi

    # Test API connectivity
    if curl -s -f --max-time 10 "http://api.auterity.com/health" >/dev/null; then
        success "API endpoint accessible"
    else
        error "API endpoint not accessible"
        return 1
    fi

    # Test frontend connectivity
    if curl -s -f --max-time 10 "http://app.auterity.com" >/dev/null; then
        success "Frontend accessible"
    else
        warning "Frontend not accessible"
    fi

    return 0
}

validate_ai_integrations() {
    log "🤖 Validating AI Integrations..."

    local ai_services=("openai" "anthropic" "huggingface" "temporal" "langchain" "litellm")
    local ai_healthy=true

    for service in "${ai_services[@]}"; do
        if curl -s -f --max-time 10 "http://api.auterity.com/health/ai/$service" >/dev/null; then
            success "AI integration healthy: $service"
        else
            warning "AI integration issue: $service"
            ai_healthy=false
        fi
    done

    # Test AI functionality
    if curl -s -f --max-time 30 "http://api.auterity.com/api/ai/test" >/dev/null; then
        success "AI functionality working"
    else
        error "AI functionality not working"
        ai_healthy=false
    fi

    return $ai_healthy
}

validate_security() {
    log "🔒 Validating Security..."

    # Check HTTPS/TLS
    if curl -s -f --max-time 10 "https://api.auterity.com/health" >/dev/null; then
        success "HTTPS/TLS configured"
    else
        error "HTTPS/TLS not configured"
        return 1
    fi

    # Test authentication
    local auth_response
    auth_response=$(curl -s -o /dev/null -w "%{http_code}" "http://api.auterity.com/api/auth/test")
    if [ "$auth_response" = "401" ]; then
        success "Authentication working (401 unauthorized)"
    elif [ "$auth_response" = "200" ]; then
        warning "Authentication not required for test endpoint"
    else
        error "Authentication test failed (HTTP $auth_response)"
        return 1
    fi

    # Check rate limiting
    local rate_limit_test=0
    local rate_limited=false

    for i in {1..10}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://api.auterity.com/api/health")
        if [ "$response" = "429" ]; then
            rate_limited=true
            break
        fi
        sleep 0.1
    done

    if [ "$rate_limited" = true ]; then
        success "Rate limiting working"
    else
        warning "Rate limiting not detected"
    fi

    return 0
}

validate_monitoring() {
    log "📊 Validating Monitoring..."

    # Check Prometheus
    if kubectl get deployment prometheus -n monitoring >/dev/null 2>&1; then
        local prometheus_status
        prometheus_status=$(kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
        if [ "$prometheus_status" = "Running" ]; then
            success "Prometheus running"
        else
            error "Prometheus not running"
            return 1
        fi
    else
        warning "Prometheus not deployed"
    fi

    # Check Grafana
    if kubectl get deployment grafana -n monitoring >/dev/null 2>&1; then
        local grafana_status
        grafana_status=$(kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].status.phase}' 2>/dev/null)
        if [ "$grafana_status" = "Running" ]; then
            success "Grafana running"
        else
            error "Grafana not running"
            return 1
        fi
    else
        warning "Grafana not deployed"
    fi

    # Test monitoring endpoints
    if curl -s -f "http://prometheus.monitoring.svc.cluster.local:9090/-/healthy" >/dev/null; then
        success "Prometheus endpoint accessible"
    else
        warning "Prometheus endpoint not accessible"
    fi

    return 0
}

validate_performance() {
    log "⚡ Validating Performance..."

    # API Response Time
    local start_time end_time response_time
    start_time=$(date +%s%N)
    curl -s -f "http://api.auterity.com/health" >/dev/null
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds

    if [ "$response_time" -lt 100 ]; then
        success "API response time: ${response_time}ms (< 100ms target)"
    elif [ "$response_time" -lt 500 ]; then
        warning "API response time: ${response_time}ms (100-500ms range)"
    else
        error "API response time: ${response_time}ms (> 500ms - too slow)"
        return 1
    fi

    # Memory Usage
    local mem_usage
    mem_usage=$(kubectl top pods -n auterity --no-headers | awk '{sum+=$3} END {print sum/NR}' 2>/dev/null)
    if [ -n "$mem_usage" ]; then
        if (( $(echo "$mem_usage < 80" | bc -l 2>/dev/null || echo "0") )); then
            success "Average memory usage: ${mem_usage}%"
        else
            warning "High memory usage: ${mem_usage}%"
        fi
    else
        warning "Memory usage metrics not available"
    fi

    # CPU Usage
    local cpu_usage
    cpu_usage=$(kubectl top pods -n auterity --no-headers | awk '{sum+=$2} END {print sum/NR}' 2>/dev/null)
    if [ -n "$cpu_usage" ]; then
        if (( $(echo "$cpu_usage < 80" | bc -l 2>/dev/null || echo "0") )); then
            success "Average CPU usage: ${cpu_usage}%"
        else
            warning "High CPU usage: ${cpu_usage}%"
        fi
    else
        warning "CPU usage metrics not available"
    fi

    return 0
}

generate_report() {
    log "📋 Generating Validation Report..."

    local total_checks=${#validation_results[@]}
    local passed_checks=0
    local warned_checks=${#warning_checks[@]}
    local failed_checks=${#failed_checks[@]}

    for result in "${validation_results[@]}"; do
        if [ "$result" = "PASS" ]; then
            passed_checks=$((passed_checks + 1))
        fi
    done

    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                        HEALTH VALIDATION REPORT                             ║"
    echo "║                        $(date +'%Y-%m-%d %H:%M:%S')                           ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 SUMMARY:"
    echo "   Total Checks:     $total_checks"
    echo "   ✅ Passed:        $passed_checks"
    echo "   ⚠️  Warnings:      $warned_checks"
    echo "   ❌ Failed:        $failed_checks"
    echo ""

    if [ $failed_checks -gt 0 ]; then
        echo "❌ FAILED CHECKS:"
        for check in "${failed_checks[@]}"; do
            echo "   • $check"
        done
        echo ""
    fi

    if [ $warned_checks -gt 0 ]; then
        echo "⚠️  WARNINGS:"
        for check in "${warning_checks[@]}"; do
            echo "   • $check"
        done
        echo ""
    fi

    # Overall status
    if [ $failed_checks -eq 0 ] && [ $warned_checks -eq 0 ]; then
        echo "🎉 STATUS: ALL CHECKS PASSED - SYSTEM READY FOR PRODUCTION"
    elif [ $failed_checks -eq 0 ]; then
        echo "⚠️  STATUS: READY WITH WARNINGS - MONITOR CLOSELY"
    else
        echo "❌ STATUS: CRITICAL ISSUES DETECTED - DO NOT PROCEED"
    fi

    echo ""
    echo "📝 Detailed results saved to: $LOG_FILE"
}

show_help() {
    cat << EOF
Auterity Error-IQ Health Validation Script

USAGE:
    $0 [OPTIONS]

DESCRIPTION:
    Comprehensive health validation of all Auterity Error-IQ system components
    including infrastructure, databases, services, networking, AI integrations,
    security, monitoring, and performance.

VALIDATION CHECKS:
    🏗️  Infrastructure: Kubernetes, namespaces, config, secrets
    🗄️  Database: PostgreSQL, Redis connectivity and health
    🔧 Services: All microservices deployment and health
    🌐 Networking: Ingress, API, and frontend accessibility
    🤖 AI Integrations: OpenAI, Anthropic, HuggingFace, etc.
    🔒 Security: HTTPS/TLS, authentication, rate limiting
    📊 Monitoring: Prometheus, Grafana deployment and access
    ⚡ Performance: Response times, resource utilization

OPTIONS:
    -t, --timeout SECONDS    Validation timeout in seconds (default: 300)
    --fail-fast              Stop on first failure
    --verbose               Show detailed validation output
    -h, --help              Show this help message

EXAMPLES:
    $0                      # Run all validations
    $0 --fail-fast          # Stop on first failure
    $0 --verbose            # Show detailed output
    $0 --timeout 600        # 10-minute timeout

OUTPUT:
    Results are displayed in real-time and saved to log file
    Exit code 0 = All checks passed
    Exit code 1 = Some checks failed
    Exit code 2 = Critical failures detected

LOG FILE: ${LOG_FILE}
EOF
}

# Main execution
main() {
    local fail_fast=false
    local verbose=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--timeout)
                VALIDATION_TIMEOUT="$2"
                shift 2
                ;;
            --fail-fast)
                fail_fast=true
                shift
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    log "🚀 Starting Auterity Error-IQ Health Validation"
    log "   Timeout: ${VALIDATION_TIMEOUT}s"
    log "   Fail Fast: $fail_fast"
    log "   Verbose: $verbose"

    local overall_status=0

    # Run all validations
    validations=(
        "validate_infrastructure"
        "validate_database"
        "validate_services"
        "validate_networking"
        "validate_ai_integrations"
        "validate_security"
        "validate_monitoring"
        "validate_performance"
    )

    for validation in "${validations[@]}"; do
        if ! $validation; then
            if [ "$fail_fast" = true ]; then
                error "Validation failed with fail-fast enabled"
                overall_status=1
                break
            fi
            overall_status=1
        fi
    done

    # Generate report
    generate_report

    # Exit with appropriate status
    if [ $overall_status -eq 0 ]; then
        log "✅ All validations completed successfully"
        exit 0
    else
        log "❌ Some validations failed - check report for details"
        exit 1
    fi
}

# Run main function with timeout
timeout "$VALIDATION_TIMEOUT" bash -c "main $*" || {
    error "Validation timed out after ${VALIDATION_TIMEOUT} seconds"
    exit 2
}
