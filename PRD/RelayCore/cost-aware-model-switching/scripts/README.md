# Scripts Directory

This directory contains utility scripts for the Cost-Aware Model Switching component.

## Available Scripts

### Development Scripts

- `start-dev.sh`: Start the development environment
- `seed-db.sh`: Seed the database with test data
- `check-env.sh`: Check the development environment
- `run-with-relaycore.sh`: Run the development environment with RelayCore

### Testing Scripts

- `run-integration-tests.sh`: Run integration tests

### Documentation Scripts

- `generate-api-docs.sh`: Generate API documentation

### Production Scripts

- `build-production.sh`: Build the production version
- `run-production.sh`: Run the production environment

## Usage

Make sure all scripts are executable:

```bash
chmod +x scripts/*.sh
```

Then run a script:

```bash
./scripts/script-name.sh
```

## Database Initialization

The `init.sql` file in this directory is used to initialize the database schema. It is automatically executed when the PostgreSQL container starts for the first time.