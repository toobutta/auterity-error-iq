#!/bin/bash

# Start development environment for Cost-Aware Model Switching

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

# Create logs directory if it doesn't exist
mkdir -p logs

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration."
fi

# Build and start containers
echo "Starting development environment..."
docker-compose up -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo "Development environment started successfully."
    echo "API is available at http://localhost:3002"
    echo "Database admin is available at http://localhost:8080"
    echo "  System: PostgreSQL"
    echo "  Server: postgres"
    echo "  Username: postgres"
    echo "  Password: postgres"
    echo "  Database: cost_aware_db"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo "Failed to start development environment."
    exit 1
fi