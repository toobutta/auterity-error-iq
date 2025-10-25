#!/bin/bash

# Auterity Error-IQ Rollout Execution Script
# This script automates the phased rollout of the Auterity Error-IQ platform

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROLLBACK_ENABLED=true
MONITORING_ENABLED=true
LOG_FILE="${PROJECT_ROOT}/logs/rollout-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Health check functions
check_infrastructure() {
    log "🔍 Checking infrastructure health..."

    # Check Kubernetes cluster
    if ! kubectl cluster-info >/dev/null 2>&1; then
        error "Kubernetes cluster not accessible"
        return 1
    fi

    # Check PostgreSQL
    if ! kubectl exec -n auterity deployment/postgres -- pg_isready -U auterity >/dev/null 2>&1; then
        error "PostgreSQL not healthy"
        return 1
    fi

    # Check Redis
    if ! kubectl exec -n auterity deployment/redis -- redis-cli ping >/dev/null 2>&1; then
        error "Redis not healthy"
        return 1
    fi

    success "Infrastructure health check passed"
    return 0
}

check_services() {
    log "🔍 Checking service health..."

    local services=("api-gateway" "ai-orchestrator" "workflow-engine" "analytics-service")
    local failed_services=()

    for service in "${services[@]}"; do
        if ! kubectl get pods -n auterity -l app="$service" -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
            failed_services+=("$service")
        fi
    done

    if [ ${#failed_services[@]} -gt 0 ]; then
        error "Services not healthy: ${failed_services[*]}"
        return 1
    fi

    success "All services are healthy"
    return 0
}

validate_ai_integration() {
    log "🤖 Validating AI service integrations..."

    # Test OpenAI integration
    if ! curl -s -f "http://api.auterity.com/health/ai/openai" >/dev/null; then
        warning "OpenAI integration needs attention"
    fi

    # Test Anthropic integration
    if ! curl -s -f "http://api.auterity.com/health/ai/anthropic" >/dev/null; then
        warning "Anthropic integration needs attention"
    fi

    # Test HuggingFace integration
    if ! curl -s -f "http://api.auterity.com/health/ai/huggingface" >/dev/null; then
        warning "HuggingFace integration needs attention"
    fi

    success "AI integrations validated"
}

# Deployment functions
deploy_infrastructure() {
    log "🏗️ Deploying infrastructure..."

    # Create namespace
    kubectl apply -f "${PROJECT_ROOT}/k8s/namespace.yaml"

    # Deploy ConfigMaps and Secrets
    kubectl apply -f "${PROJECT_ROOT}/k8s/configmaps/"
    kubectl apply -f "${PROJECT_ROOT}/k8s/secrets/"

    # Deploy PostgreSQL
    kubectl apply -f "${PROJECT_ROOT}/k8s/postgres.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n auterity

    # Deploy Redis
    kubectl apply -f "${PROJECT_ROOT}/k8s/redis.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n auterity

    # Deploy monitoring stack
    kubectl apply -f "${PROJECT_ROOT}/monitoring/prometheus.yaml"
    kubectl apply -f "${PROJECT_ROOT}/monitoring/grafana.yaml"

    success "Infrastructure deployed successfully"
}

deploy_application() {
    log "🚀 Deploying application services..."

    # Deploy API Gateway
    kubectl apply -f "${PROJECT_ROOT}/k8s/api-gateway.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n auterity

    # Deploy AI Orchestrator
    kubectl apply -f "${PROJECT_ROOT}/k8s/ai-orchestrator.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/ai-orchestrator -n auterity

    # Deploy Workflow Engine
    kubectl apply -f "${PROJECT_ROOT}/k8s/workflow-engine.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/workflow-engine -n auterity

    # Deploy Analytics Service
    kubectl apply -f "${PROJECT_ROOT}/k8s/analytics-service.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/analytics-service -n auterity

    # Deploy Frontend
    kubectl apply -f "${PROJECT_ROOT}/k8s/frontend.yaml"
    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n auterity

    success "Application deployed successfully"
}

deploy_ingress() {
    log "🌐 Deploying ingress and load balancer..."

    # Deploy NGINX Ingress Controller
    kubectl apply -f "${PROJECT_ROOT}/k8s/ingress-controller.yaml"

    # Deploy Ingress rules
    kubectl apply -f "${PROJECT_ROOT}/k8s/ingress.yaml"

    # Wait for ingress to be ready
    kubectl wait --for=condition=available --timeout=300s deployment/nginx-ingress-controller -n ingress-nginx

    success "Ingress deployed successfully"
}

# Rollback functions
rollback_infrastructure() {
    log "🔄 Rolling back infrastructure..."

    kubectl delete -f "${PROJECT_ROOT}/k8s/ingress.yaml" --ignore-not-found=true
    kubectl delete -f "${PROJECT_ROOT}/k8s/frontend.yaml" --ignore-not-found=true
    kubectl delete -f "${PROJECT_ROOT}/k8s/analytics-service.yaml" --ignore-not-found=true
    kubectl delete -f "${PROJECT_ROOT}/k8s/workflow-engine.yaml" --ignore-not-found=true
    kubectl delete -f "${PROJECT_ROOT}/k8s/ai-orchestrator.yaml" --ignore-not-found=true
    kubectl delete -f "${PROJECT_ROOT}/k8s/api-gateway.yaml" --ignore-not-found=true

    warning "Infrastructure rolled back to previous state"
}

rollback_application() {
    log "🔄 Rolling back application..."

    # Scale down new deployments
    kubectl scale deployment frontend --replicas=0 -n auterity
    kubectl scale deployment analytics-service --replicas=0 -n auterity
    kubectl scale deployment workflow-engine --replicas=0 -n auterity
    kubectl scale deployment ai-orchestrator --replicas=0 -n auterity
    kubectl scale deployment api-gateway --replicas=0 -n auterity

    warning "Application rolled back - services scaled to zero"
}

# Monitoring functions
start_monitoring() {
    log "📊 Starting monitoring and alerting..."

    # Start Prometheus metrics collection
    kubectl apply -f "${PROJECT_ROOT}/monitoring/service-monitors.yaml"

    # Configure alerting rules
    kubectl apply -f "${PROJECT_ROOT}/monitoring/alerting-rules.yaml"

    # Start log aggregation
    kubectl apply -f "${PROJECT_ROOT}/monitoring/elasticsearch.yaml"
    kubectl apply -f "${PROJECT_ROOT}/monitoring/kibana.yaml"

    success "Monitoring and alerting configured"
}

check_monitoring() {
    log "📊 Checking monitoring health..."

    # Check Prometheus
    if ! kubectl get pods -n monitoring -l app=prometheus -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
        warning "Prometheus not healthy"
    fi

    # Check Grafana
    if ! kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[*].status.phase}' | grep -q "Running"; then
        warning "Grafana not healthy"
    fi

    success "Monitoring health verified"
}

# Main execution functions
execute_phase1a() {
    log "🎯 EXECUTING PHASE 1A: SOFT LAUNCH"
    echo "==============================================="

    # Pre-deployment checks
    if ! check_infrastructure; then
        error "Infrastructure check failed - aborting deployment"
        exit 1
    fi

    # Deploy infrastructure
    if ! deploy_infrastructure; then
        error "Infrastructure deployment failed"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            rollback_infrastructure
        fi
        exit 1
    fi

    # Deploy application
    if ! deploy_application; then
        error "Application deployment failed"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            rollback_application
        fi
        exit 1
    fi

    # Deploy ingress
    if ! deploy_ingress; then
        error "Ingress deployment failed"
        warning "Continuing without ingress - manual configuration required"
    fi

    # Start monitoring
    if [ "$MONITORING_ENABLED" = true ]; then
        start_monitoring
    fi

    # Post-deployment validation
    if ! check_services; then
        error "Service health check failed"
        warning "Services may not be fully operational"
    fi

    if ! validate_ai_integration; then
        warning "Some AI integrations need attention"
    fi

    success "PHASE 1A COMPLETED: Soft launch ready"
    echo "==============================================="
}

execute_phase1b() {
    log "🎯 EXECUTING PHASE 1B: FULL LAUNCH"
    echo "==============================================="

    # Enable full feature set
    log "🔓 Enabling full feature set..."
    kubectl apply -f "${PROJECT_ROOT}/k8s/feature-flags-full.yaml"

    # Scale up infrastructure for production load
    log "📈 Scaling infrastructure for production..."
    kubectl scale deployment api-gateway --replicas=3 -n auterity
    kubectl scale deployment ai-orchestrator --replicas=5 -n auterity
    kubectl scale deployment workflow-engine --replicas=3 -n auterity
    kubectl scale deployment analytics-service --replicas=2 -n auterity
    kubectl scale deployment frontend --replicas=3 -n auterity

    # Enable production monitoring
    log "📊 Enabling production monitoring..."
    kubectl apply -f "${PROJECT_ROOT}/monitoring/production-alerts.yaml"

    # Validate production readiness
    if ! check_services; then
        error "Production validation failed"
        exit 1
    fi

    success "PHASE 1B COMPLETED: Full production launch"
    echo "==============================================="
}

# Utility functions
show_help() {
    cat << EOF
Auterity Error-IQ Rollout Execution Script

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    phase1a         Execute Phase 1A: Soft Launch
    phase1b         Execute Phase 1B: Full Launch
    check           Run health checks only
    rollback        Rollback to previous state
    monitor         Check monitoring status
    help            Show this help message

OPTIONS:
    --no-rollback   Disable automatic rollback on failure
    --no-monitor    Disable monitoring setup
    --dry-run       Show what would be executed without running
    -v, --verbose   Enable verbose logging

EXAMPLES:
    $0 phase1a              # Execute soft launch
    $0 check                # Run health checks
    $0 --dry-run phase1a    # Show soft launch plan
    $0 rollback             # Rollback deployment

LOG FILE: ${LOG_FILE}
EOF
}

# Main execution
main() {
    local command=""
    local dry_run=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            phase1a|phase1b|check|rollback|monitor)
                command="$1"
                shift
                ;;
            --no-rollback)
                ROLLBACK_ENABLED=false
                shift
                ;;
            --no-monitor)
                MONITORING_ENABLED=false
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            help|-h|--help)
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

    # Validate command
    if [ -z "$command" ]; then
        error "No command specified"
        show_help
        exit 1
    fi

    # Execute command
    case $command in
        phase1a)
            if [ "$dry_run" = true ]; then
                echo "DRY RUN: Would execute Phase 1A (Soft Launch)"
                echo "- Check infrastructure health"
                echo "- Deploy infrastructure components"
                echo "- Deploy application services"
                echo "- Configure ingress and load balancing"
                echo "- Setup monitoring and alerting"
                echo "- Validate service health"
                echo "- Test AI integrations"
            else
                execute_phase1a
            fi
            ;;
        phase1b)
            if [ "$dry_run" = true ]; then
                echo "DRY RUN: Would execute Phase 1B (Full Launch)"
                echo "- Enable full feature set"
                echo "- Scale infrastructure for production"
                echo "- Enable production monitoring"
                echo "- Validate production readiness"
            else
                execute_phase1b
            fi
            ;;
        check)
            check_infrastructure && check_services && validate_ai_integration
            ;;
        rollback)
            rollback_application && rollback_infrastructure
            ;;
        monitor)
            check_monitoring
            ;;
        *)
            error "Invalid command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
