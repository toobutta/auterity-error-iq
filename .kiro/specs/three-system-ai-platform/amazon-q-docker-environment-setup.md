# [AMAZON-Q-TASK] Docker Environment Setup for Three-System Platform

## Task Overview

Set up unified Docker Compose configuration and environment management for AutoMatrix, RelayCore, and NeuroWeaver integration.

## Error Context

- **Current Issue**: Need unified development environment across three systems
- **Environment Details**: Existing AutoMatrix system needs integration with new RelayCore and NeuroWeaver systems
- **Dependencies**: PostgreSQL, Redis, and proper service orchestration required

## Expected Outcome

- **Root Cause Analysis**: Identify optimal Docker configuration for three-system integration
- **Specific Fix**: Complete docker-compose.yml with all services properly configured
- **Prevention**: Environment configuration that prevents service conflicts and dependency issues

## Technical Requirements

### Docker Services Required

1. **Shared PostgreSQL**: Single database instance with separate schemas for each system
2. **Redis**: Shared caching and session management
3. **AutoMatrix Backend**: Port 8000 (existing)
4. **AutoMatrix Frontend**: Port 3000 (existing)
5. **RelayCore**: Port 3001 (new)
6. **NeuroWeaver Backend**: Port 8001 (new)
7. **NeuroWeaver Frontend**: Port 3002 (new)
8. **Monitoring**: Grafana on port 3003

### Environment Variables Setup

- Unified .env configuration for all systems
- Shared JWT secrets and database credentials
- AI provider API keys (OpenAI, Anthropic, Claude)
- Service interconnection URLs
- Development vs production configurations

### Health Checks and Dependencies

- Proper service dependency ordering
- Health checks for all services
- Graceful startup and shutdown
- Volume management for persistent data

## Files to Create/Modify

- `docker-compose.yml` (modify existing)
- `.env.example` (modify existing)
- `scripts/init-unified-db.sql` (create)
- Individual Dockerfiles for new services

## Success Criteria

- All services start successfully with `docker-compose up`
- Services can communicate with each other
- Shared database and Redis working
- Environment variables properly configured
- Health checks passing for all services

## Priority

High - Blocks all other development work

## Estimated Time

2-3 hours
