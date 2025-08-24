# Production Deployment Guide

## Quick Start

1. **Configure External Services**
```bash
cp .env.production.template .env.production
# Edit .env.production with your API keys
```

2. **Deploy Infrastructure**
```bash
docker-compose -f docker-compose.production.yml up -d
```

3. **Run Tests**
```bash
python -m pytest tests/integration/ tests/security/ tests/load/
```

## External Services Setup

### Vector Databases

**Pinecone Setup:**
```bash
# Install Pinecone CLI
pip install pinecone-client

# Create index
pinecone create-index auterity-vectors --dimension 1536 --metric cosine
```

**Weaviate Setup:**
```bash
# Weaviate runs in Docker - configure in external-services.yml
# Schema auto-created on first use
```

### LLM Providers

**OpenAI:**
- Get API key from https://platform.openai.com/api-keys
- Set OPENAI_API_KEY in .env.production

**Anthropic:**
- Get API key from https://console.anthropic.com/
- Set ANTHROPIC_API_KEY in .env.production

### Authentication

**Auth0 Setup:**
1. Create Auth0 application
2. Configure callback URLs: https://yourdomain.com/callback
3. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET

## Production Infrastructure

### Load Balancing
- Nginx handles load balancing between backend instances
- Health checks ensure traffic only goes to healthy instances
- SSL termination at load balancer

### Database Clustering
- PostgreSQL primary-replica setup
- Automatic failover with pg_auto_failover
- Regular backups to S3

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and alerting
- **Jaeger**: Distributed tracing
- **Loki**: Log aggregation

### Security Features
- Rate limiting (10 req/s API, 1 req/s auth)
- SSL/TLS encryption
- Security headers
- Input sanitization
- SQL injection protection

## Testing & Validation

### Integration Tests
```bash
python -m pytest tests/integration/ -v
```

### Security Audit
```bash
python -m pytest tests/security/ -v
```

### Load Testing
```bash
python -m pytest tests/load/ -v
```

### Penetration Testing
```bash
# Use external security tools
nmap -sV -sC yourdomain.com
sqlmap -u "https://yourdomain.com/api/endpoint" --batch
```

## Scaling Configuration

### Horizontal Scaling
```yaml
# Add more backend instances
backend-3:
  build: ./backend
  environment:
    - DATABASE_URL=postgresql://...
```

### Database Scaling
```yaml
# Add read replicas
postgres-replica-2:
  image: postgres:15-alpine
  environment:
    - POSTGRES_REPLICATION_MODE=slave
```

### Monitoring Alerts
- CPU usage > 80%
- Memory usage > 85%
- Response time > 2s
- Error rate > 5%

## Maintenance

### Backup Strategy
- Daily database backups
- Weekly full system backups
- Backup retention: 30 days

### Updates
```bash
# Zero-downtime deployment
./scripts/deploy-production.sh
```

### Health Monitoring
```bash
# Check all services
./scripts/health-check.sh
```