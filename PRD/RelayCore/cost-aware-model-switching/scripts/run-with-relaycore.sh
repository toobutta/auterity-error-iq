#!/bin/bash

# Run Cost-Aware Model Switching with RelayCore

# Check if RelayCore directory exists
if [ ! -d "../RelayCore" ]; then
    echo "RelayCore directory not found. Please make sure it exists at ../RelayCore"
    exit 1
fi

# Create a docker network if it doesn't exist
docker network create relaycore-network 2>/dev/null || true

# Start RelayCore
echo "Starting RelayCore..."
cd ../RelayCore
docker-compose up -d

# Wait for RelayCore to start
echo "Waiting for RelayCore to start..."
sleep 10

# Start Cost-Aware Model Switching
echo "Starting Cost-Aware Model Switching..."
cd ../cost-aware-model-switching

# Set environment variables for integration
export ENABLE_INTEGRATIONS=true
export RELAYCORE_API_URL=http://relaycore:3000

# Start the development environment
./scripts/start-dev.sh

# Connect the containers to the same network
echo "Connecting containers to the same network..."
docker network connect relaycore-network cost-aware-service
docker network connect relaycore-network relaycore

echo "Both services are now running and connected."
echo "RelayCore API: http://localhost:3000"
echo "Cost-Aware Model Switching API: http://localhost:3002"