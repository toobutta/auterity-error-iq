#!/bin/bash

# Build production version of Cost-Aware Model Switching

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf dist

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run tests
echo "Running tests..."
npm test

# Check if tests passed
if [ $? -ne 0 ]; then
    echo "Tests failed. Aborting build."
    exit 1
fi

# Build TypeScript code
echo "Building TypeScript code..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed."
    exit 1
fi

# Build Docker image
echo "Building Docker image..."
docker build -t cost-aware-model-switching:production .

# Check if Docker build was successful
if [ $? -ne 0 ]; then
    echo "Docker build failed."
    exit 1
fi

echo "Production build completed successfully."
echo "You can run the production image with:"
echo "docker run -p 3002:3002 -e NODE_ENV=production cost-aware-model-switching:production"