#!/bin/bash

# Run integration tests for Cost-Aware Model Switching

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

# Create test database if it doesn't exist
echo "Creating test database..."
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE cost_aware_db_test;" || true

# Run database migrations on test database
echo "Running database migrations on test database..."
export DATABASE_URL=postgresql://postgres:postgres@postgres:5432/cost_aware_db_test
docker-compose exec -T postgres psql -U postgres -d cost_aware_db_test -f /docker-entrypoint-initdb.d/init.sql

# Run integration tests
echo "Running integration tests..."
docker-compose exec -T cost-aware-service npm test -- --testMatch "**/tests/**/*.test.ts" --runInBand

# Check if tests were successful
if [ $? -eq 0 ]; then
    echo "Integration tests completed successfully."
else
    echo "Integration tests failed."
    exit 1
fi