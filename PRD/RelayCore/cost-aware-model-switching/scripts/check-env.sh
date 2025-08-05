#!/bin/bash

# Check development environment for Cost-Aware Model Switching

echo "Checking development environment..."

# Check Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    docker --version
else
    echo "❌ Docker is not installed"
    echo "   Please install Docker from https://docs.docker.com/get-docker/"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is installed"
    docker-compose --version
else
    echo "❌ Docker Compose is not installed"
    echo "   Please install Docker Compose from https://docs.docker.com/compose/install/"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed"
    node --version
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "⚠️  Node.js version is less than 18"
        echo "   Please upgrade Node.js to version 18 or higher"
    fi
else
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm is installed"
    npm --version
else
    echo "❌ npm is not installed"
    echo "   Please install npm from https://www.npmjs.com/get-npm"
fi

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file does not exist"
    echo "   Please copy .env.example to .env and configure it"
    echo "   cp .env.example .env"
fi

# Check if Docker containers are running
if docker-compose ps | grep -q "cost-aware-service"; then
    echo "✅ Development environment is running"
else
    echo "⚠️  Development environment is not running"
    echo "   Please start the development environment with ./scripts/start-dev.sh"
fi

echo ""
echo "Environment check complete."