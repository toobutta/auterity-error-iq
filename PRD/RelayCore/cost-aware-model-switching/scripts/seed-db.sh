#!/bin/bash

# Seed database with test data for Cost-Aware Model Switching

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

# Check if containers are running
if ! docker-compose ps | grep -q "postgres"; then
    echo "PostgreSQL container is not running. Please start the development environment first."
    echo "Run: ./scripts/start-dev.sh"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run the seed script
echo "Seeding database with test data..."
docker-compose exec -T cost-aware-service node scripts/seed-test-data.js

# Check if seeding was successful
if [ $? -eq 0 ]; then
    echo "Database seeded successfully."
else
    echo "Failed to seed database."
    exit 1
fi