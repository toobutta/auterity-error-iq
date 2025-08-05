# Makefile for Cost-Aware Model Switching

# Variables
DOCKER_COMPOSE = docker-compose
NODE = node
NPM = npm

# Default target
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  start       - Start development environment"
	@echo "  stop        - Stop development environment"
	@echo "  restart     - Restart development environment"
	@echo "  logs        - Show logs from all containers"
	@echo "  seed        - Seed database with test data"
	@echo "  build       - Build TypeScript code"
	@echo "  test        - Run tests"
	@echo "  clean       - Remove build artifacts"
	@echo "  install     - Install dependencies"

# Start development environment
.PHONY: start
start:
	@echo "Starting development environment..."
	@./scripts/start-dev.sh

# Stop development environment
.PHONY: stop
stop:
	@echo "Stopping development environment..."
	@$(DOCKER_COMPOSE) down

# Restart development environment
.PHONY: restart
restart:
	@echo "Restarting development environment..."
	@$(DOCKER_COMPOSE) down
	@./scripts/start-dev.sh

# Show logs
.PHONY: logs
logs:
	@$(DOCKER_COMPOSE) logs -f

# Seed database
.PHONY: seed
seed:
	@echo "Seeding database..."
	@./scripts/seed-db.sh

# Build TypeScript code
.PHONY: build
build:
	@echo "Building TypeScript code..."
	@$(NPM) run build

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	@$(NPM) test

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist
	@rm -rf logs/*.log

# Install dependencies
.PHONY: install
install:
	@echo "Installing dependencies..."
	@$(NPM) install