#!/bin/bash

# Navigate to the root directory
cd "$(dirname "$0")/../.."

# Build the Docker images
echo "Building Docker images..."
docker build -t neuroweaver/workflow-ui -f docker/workflow-ui/Dockerfile .
docker build -t neuroweaver/costguard-dashboard -f docker/costguard-dashboard/Dockerfile .

# Run the Docker containers
echo "Running Docker containers..."
docker run -d -p 8080:8080 --name neuroweaver-workflow-ui neuroweaver/workflow-ui
docker run -d -p 8050:8050 --name neuroweaver-costguard-dashboard neuroweaver/costguard-dashboard

echo "Frontend services are running:"
echo "- Workflow UI: http://localhost:8080"
echo "- CostGuard Dashboard: http://localhost:8050"