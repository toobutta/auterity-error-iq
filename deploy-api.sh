#!/bin/bash

# Deployment script for Auterity API

echo "Starting deployment..."

# Build and start infrastructure
cd infrastructure
docker-compose up -d

# Wait for services to be ready
sleep 30

# Install API dependencies
cd ../api
npm install --legacy-peer-deps

# Run linting
npm run lint

# Run tests
npm test

# Copy environment file if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Please update .env with your configuration"
fi

# Start API
npm start &

echo "Deployment complete. API running on http://localhost:3000"
