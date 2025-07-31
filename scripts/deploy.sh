#!/bin/bash

# Production deployment script for AutoMatrix AI Hub Workflow Engine MVP
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.${ENVIRONMENT}"

echo -e "${GREEN}Starting deployment for ${ENVIRONMENT} environment...${NC}"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: Environment file $ENV_FILE not found!${NC}"
    echo "Please create $ENV_FILE with your configuration."
    exit 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Validate required environment variables
required_vars=("POSTGRES_PASSWORD" "OPENAI_API_KEY" "SECRET_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable $var is not set!${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Environment validation passed${NC}"

# Create necessary directories
mkdir -p logs
mkdir -p nginx/ssl

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans

# Pull latest images
echo -e "${YELLOW}Pulling latest images...${NC}"
docker-compose -f "$COMPOSE_FILE" pull

# Build and start services
echo -e "${YELLOW}Building and starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
timeout=300
counter=0

while [ $counter -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
        echo -e "${GREEN}Services are healthy!${NC}"
        break
    fi
    
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}Timeout waiting for services to be healthy${NC}"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    
    echo "Waiting for services... ($counter/$timeout)"
    sleep 5
    counter=$((counter + 5))
done

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head

# Health check
echo -e "${YELLOW}Performing health checks...${NC}"
sleep 10

# Check backend health
if curl -f http://localhost:${BACKEND_PORT:-8000}/api/monitoring/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend health check passed${NC}"
else
    echo -e "${RED}Backend health check failed${NC}"
    docker-compose -f "$COMPOSE_FILE" logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost:${FRONTEND_PORT:-3000}/health > /dev/null 2>&1; then
    echo -e "${GREEN}Frontend health check passed${NC}"
else
    echo -e "${RED}Frontend health check failed${NC}"
    docker-compose -f "$COMPOSE_FILE" logs frontend
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Application is available at:${NC}"
echo -e "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo -e "  Backend API: http://localhost:${BACKEND_PORT:-8000}"
echo -e "  API Documentation: http://localhost:${BACKEND_PORT:-8000}/docs"

# Show running containers
echo -e "\n${YELLOW}Running containers:${NC}"
docker-compose -f "$COMPOSE_FILE" ps