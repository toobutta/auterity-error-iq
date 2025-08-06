#!/bin/bash
# AutoMatrix AI Hub - Health Check Script
# Generated: 2025-01-31

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check endpoints
ENDPOINTS=(
    "http://localhost:8000/health|AutoMatrix Backend"
    "http://localhost:3000|AutoMatrix Frontend"
    "http://localhost:3001/health|RelayCore"
    "http://localhost:8001/health|NeuroWeaver Backend"
    "http://localhost:3002|NeuroWeaver Frontend"
    "http://localhost:9090/-/healthy|Prometheus"
    "http://localhost:3003/api/health|Grafana"
)

check_service_health() {
    local endpoint_info="$1"
    local url=$(echo "$endpoint_info" | cut -d'|' -f1)
    local name=$(echo "$endpoint_info" | cut -d'|' -f2)
    
    log_info "Checking $name..."
    
    if curl -f -s --max-time 10 "$url" > /dev/null 2>&1; then
        log_success "$name is healthy"
        return 0
    else
        log_error "$name is not responding"
        return 1
    fi
}

check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database is accessible"
        return 0
    else
        log_error "Database is not accessible"
        return 1
    fi
}

check_redis_connectivity() {
    log_info "Checking Redis connectivity..."
    
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis is accessible"
        return 0
    else
        log_error "Redis is not accessible"
        return 1
    fi
}

main() {
    log_info "AutoMatrix AI Hub - Health Check"
    echo "=================================="
    
    local failed_checks=0
    local total_checks=0
    
    # Check all service endpoints
    for endpoint in "${ENDPOINTS[@]}"; do
        total_checks=$((total_checks + 1))
        if ! check_service_health "$endpoint"; then
            failed_checks=$((failed_checks + 1))
        fi
        echo
    done
    
    # Check database
    total_checks=$((total_checks + 1))
    if ! check_database_connectivity; then
        failed_checks=$((failed_checks + 1))
    fi
    echo
    
    # Check Redis
    total_checks=$((total_checks + 1))
    if ! check_redis_connectivity; then
        failed_checks=$((failed_checks + 1))
    fi
    echo
    
    # Summary
    echo "=================================="
    if [ $failed_checks -eq 0 ]; then
        log_success "All health checks passed! ($total_checks/$total_checks)"
        echo "🎉 AutoMatrix AI Hub is fully operational!"
        exit 0
    else
        log_error "Health check failed! ($((total_checks - failed_checks))/$total_checks passed)"
        echo "❌ Some services are not responding properly."
        echo
        echo "Troubleshooting steps:"
        echo "1. Check service logs: docker-compose -f docker-compose.prod.yml logs [service]"
        echo "2. Restart failed services: docker-compose -f docker-compose.prod.yml restart [service]"
        echo "3. Check system resources: docker stats"
        exit 1
    fi
}

main "$@"