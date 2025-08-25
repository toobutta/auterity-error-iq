#!/bin/bash
# Setup script to install Git hooks

echo "Setting up Git hooks..."

# Make hooks executable
chmod +x .githooks/pre-commit
chmod +x .githooks/commit-msg

# Configure Git to use custom hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks installed successfully"
echo "Hooks will now run on every commit regardless of IDE or environment"
