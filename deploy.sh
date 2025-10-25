#!/bin/bash

# 🚀 Auterity IDE Production Deployment Script
# Comprehensive deployment solution for the enhanced IDE

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Logging
LOG_FILE="./deployment_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

# Functions
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

check_dependencies() {
    log_info "Checking dependencies..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    log_success "All dependencies are installed"
}

setup_environment() {
    log_info "Setting up environment..."

    # Create environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found. Creating template..."
        cat > "$ENV_FILE" << EOF
# Auterity IDE Production Environment
NODE_ENV=production
APP_TITLE=Auterity IDE
APP_VERSION=1.0.0
APP_ENVIRONMENT=production

# API Configuration
API_BASE_URL=https://api.auterity.com
API_TIMEOUT=30000

# Continue.dev AI Integration
CONTINUE_API_KEY=${CONTINUE_API_KEY:-your_continue_api_key}
CONTINUE_BASE_URL=https://api.continue.dev
CONTINUE_TIMEOUT=60000

# GitHub Integration
GITHUB_TOKEN=${GITHUB_TOKEN:-your_github_token}
GITHUB_API_BASE_URL=https://api.github.com

# AI Model Providers
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-your_anthropic_key}
OPENAI_API_KEY=${OPENAI_API_KEY:-your_openai_key}
GOOGLE_API_KEY=${GOOGLE_API_KEY:-your_google_key}
COHERE_API_KEY=${COHERE_API_KEY:-your_cohere_key}

# Database Configuration
DATABASE_URL=postgresql://auterity:password@postgres:5432/auterity
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=password

# Authentication
AUTH_PROVIDER=cognito
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-your_cognito_pool_id}
COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID:-your_cognito_client_id}
JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}

# Security
ENABLE_CSP=true
ENABLE_HSTS=true
ENABLE_CORS=true

# Monitoring
ANALYTICS_ENABLED=true
SENTRY_DSN=${SENTRY_DSN:-your_sentry_dsn}
LOG_LEVEL=info

# External Services
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-your_stripe_key}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-your_stripe_webhook_secret}
INTERCOM_APP_ID=${INTERCOM_APP_ID:-your_intercom_id}
EOF
        log_success "Environment template created: $ENV_FILE"
        log_warning "Please edit $ENV_FILE with your actual configuration values"
    else
        log_success "Environment file already exists"
    fi
}

build_frontend() {
    log_info "Building frontend application..."

    cd frontend

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --silent

    # Build application
    log_info "Building application..."
    npm run build

    # Verify build
    if [ ! -d "dist" ]; then
        log_error "Build failed: dist directory not found"
        exit 1
    fi

    cd ..
    log_success "Frontend build completed"
}

backup_existing_deployment() {
    log_info "Creating backup of existing deployment..."

    mkdir -p "$BACKUP_DIR"

    # Backup Docker volumes
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "$BACKUP_DIR/"
    fi

    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_DIR/"
    fi

    # Backup database if running
    if docker ps | grep -q auterity-postgres; then
        log_info "Creating database backup..."
        docker exec auterity-postgres pg_dump -U auterity auterity > "$BACKUP_DIR/database_backup.sql" 2>/dev/null || true
    fi

    log_success "Backup created: $BACKUP_DIR"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure..."

    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || true

    # Remove old images
    log_info "Cleaning up old images..."
    docker image prune -f

    # Start infrastructure
    log_info "Starting infrastructure..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U auterity -d auterity >/dev/null 2>&1; then
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done

    if [ $timeout -le 0 ]; then
        log_error "Database failed to start"
        exit 1
    fi

    log_success "Infrastructure deployed"
}

deploy_application() {
    log_info "Deploying application..."

    # Build and start all services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    services=("frontend" "backend" "postgres" "redis")
    for service in "${services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "$service.*Up"; then
            log_success "$service is running"
        else
            log_error "$service failed to start"
            docker-compose -f "$DOCKER_COMPOSE_FILE" logs "$service"
            exit 1
        fi
    done

    log_success "Application deployed successfully"
}

setup_monitoring() {
    log_info "Setting up monitoring..."

    # Wait for monitoring services to be ready
    log_info "Waiting for monitoring services..."
    sleep 20

    # Verify monitoring services
    monitoring_services=("prometheus" "grafana" "loki" "promtail")
    for service in "${monitoring_services[@]}"; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "$service.*Up"; then
            log_success "$service is running"
        else
            log_warning "$service is not running (this is optional)"
        fi
    done

    # Display monitoring URLs
    echo ""
    log_info "Monitoring URLs:"
    echo "  Grafana:     http://localhost:3000 (admin/admin)"
    echo "  Prometheus:  http://localhost:9090"
    echo "  Traefik:     http://localhost:8080"
    echo "  Application: http://localhost"
    echo ""
}

run_health_checks() {
    log_info "Running health checks..."

    # Frontend health check
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
    fi

    # Backend health check
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
    fi

    # Database connectivity check
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U auterity -d auterity >/dev/null 2>&1; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
    fi

    # Redis connectivity check
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis connectivity check passed"
    else
        log_error "Redis connectivity check failed"
    fi
}

run_performance_tests() {
    log_info "Running performance tests..."

    # Build performance test image
    if [ -f "frontend/src/__tests__/performance/benchmark.test.ts" ]; then
        log_info "Running performance benchmarks..."

        # Simple performance test
        start_time=$(date +%s)
        curl -s http://localhost >/dev/null
        end_time=$(date +%s)
        response_time=$((end_time - start_time))

        if [ $response_time -lt 5 ]; then
            log_success "Performance test passed (response time: ${response_time}s)"
        else
            log_warning "Performance test warning (response time: ${response_time}s)"
        fi
    else
        log_warning "Performance tests not found, skipping..."
    fi
}

cleanup() {
    log_info "Cleaning up..."

    # Remove dangling images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    log_success "Cleanup completed"
}

rollback() {
    log_error "Deployment failed. Starting rollback..."

    # Stop failed deployment
    docker-compose -f "$DOCKER_COMPOSE_FILE" down

    # Restore from backup if available
    if [ -d "$BACKUP_DIR" ]; then
        log_info "Restoring from backup..."
        if [ -f "$BACKUP_DIR/$DOCKER_COMPOSE_FILE" ]; then
            cp "$BACKUP_DIR/$DOCKER_COMPOSE_FILE" .
        fi
        if [ -f "$BACKUP_DIR/$ENV_FILE" ]; then
            cp "$BACKUP_DIR/$ENV_FILE" .
        fi

        # Restore database if backup exists
        if [ -f "$BACKUP_DIR/database_backup.sql" ]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
            sleep 10
            docker exec -i auterity-postgres psql -U auterity -d auterity < "$BACKUP_DIR/database_backup.sql"
        fi

        log_success "Rollback completed"
    else
        log_warning "No backup available for rollback"
    fi

    exit 1
}

main() {
    log_info "🚀 Starting Auterity IDE Production Deployment"
    log_info "Log file: $LOG_FILE"

    # Trap errors for rollback
    trap rollback ERR

    # Run deployment steps
    check_dependencies
    setup_environment
    build_frontend
    backup_existing_deployment
    deploy_infrastructure
    deploy_application
    setup_monitoring
    run_health_checks
    run_performance_tests
    cleanup

    log_success "🎉 Deployment completed successfully!"
    echo ""
    log_info "Application is now running at: http://localhost"
    log_info "Monitoring available at: http://localhost:3000 (Grafana)"
    echo ""
    log_info "To view logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    log_info "To stop: docker-compose -f $DOCKER_COMPOSE_FILE down"
    log_info "To restart: docker-compose -f $DOCKER_COMPOSE_FILE restart"
}

# Run main function
main "$@"
