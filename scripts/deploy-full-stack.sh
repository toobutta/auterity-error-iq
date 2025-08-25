#!/bin/bash

# Full Stack Deployment with All Services
set -e

echo "Deploying Auterity Full Stack..."

# Environment setup
export ENVIRONMENT=production
export COMPOSE_FILES="-f docker-compose.production.yml -f docker-compose.services.yml -f docker-compose.celery.yml"

# Pre-deployment validation
echo "Validating services..."
docker-compose $COMPOSE_FILES config > /dev/null

# Deploy infrastructure services first
echo "Starting infrastructure services..."
docker-compose -f docker-compose.services.yml up -d zookeeper kafka vault

# Wait for infrastructure
echo "Waiting for infrastructure..."
sleep 30

# Deploy core services
echo "Starting core services..."
docker-compose $COMPOSE_FILES up -d

# Health checks
echo "Running health checks..."
sleep 60

# Kong
curl -f http://localhost:8001/status || echo "Kong health check failed"

# Vault
curl -f http://localhost:8200/v1/sys/health || echo "Vault health check failed"

# MLflow
curl -f http://localhost:5000/health || echo "MLflow health check failed"

# Backend API
curl -f http://localhost/api/health || echo "Backend health check failed"

echo "Full stack deployment completed!"
echo "Services available:"
echo "- Kong Admin: http://localhost:8001"
echo "- Vault UI: http://localhost:8200"
echo "- MLflow: http://localhost:5000"
echo "- Grafana: http://localhost:3000"
echo "- Application: http://localhost"
