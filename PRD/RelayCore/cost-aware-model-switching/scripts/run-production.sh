#!/bin/bash

# Run production environment for Cost-Aware Model Switching

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your production configuration."
    exit 1
fi

# Create relaycore network if it doesn't exist and if integrations are enabled
if [ "$ENABLE_INTEGRATIONS" = "true" ]; then
    docker network create relaycore-network 2>/dev/null || true
fi

# Build and start containers
echo "Starting production environment..."
docker-compose -f docker-compose.prod.yml up -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo "Production environment started successfully."
    echo "API is available at http://localhost:3002"
    echo ""
    echo "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "To stop: docker-compose -f docker-compose.prod.yml down"
else
    echo "Failed to start production environment."
    exit 1
fi