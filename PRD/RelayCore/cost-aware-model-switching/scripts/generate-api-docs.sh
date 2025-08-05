#!/bin/bash

# Generate API documentation for Cost-Aware Model Switching

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm and try again."
    exit 1
fi

# Install apidoc if not already installed
if ! command -v apidoc &> /dev/null; then
    echo "Installing apidoc..."
    npm install -g apidoc
fi

# Create docs directory if it doesn't exist
mkdir -p docs/api

# Generate API documentation
echo "Generating API documentation..."
apidoc \
  -i src/routes/ \
  -o docs/api/ \
  -t node_modules/apidoc-template \
  --title "Cost-Aware Model Switching API" \
  --description "API documentation for the Cost-Aware Model Switching component" \
  --version "1.0.0"

# Check if documentation was generated successfully
if [ $? -eq 0 ]; then
    echo "API documentation generated successfully."
    echo "Open docs/api/index.html in your browser to view the documentation."
else
    echo "Failed to generate API documentation."
    exit 1
fi