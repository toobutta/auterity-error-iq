#!/bin/bash

# Production deployment script
set -e

echo "Starting production deployment..."

# Environment setup
export ENVIRONMENT=production
export COMPOSE_FILE=docker-compose.production.yml

# Pre-deployment checks
echo "Running pre-deployment checks..."
./scripts/health-check.sh
./scripts/security_scan.py

# Database backup
echo "Creating database backup..."
docker-compose exec postgres-primary pg_dump -U postgres auterity > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest images
echo "Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Deploy with zero downtime
echo "Deploying services..."
docker-compose -f $COMPOSE_FILE up -d --remove-orphans

# Health checks
echo "Running health checks..."
sleep 30
curl -f http://localhost/health || exit 1
curl -f http://localhost/api/health || exit 1

# Run integration tests
echo "Running integration tests..."
python -m pytest tests/integration/ -v

echo "Production deployment completed successfully!"
