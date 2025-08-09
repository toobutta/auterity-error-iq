# Deployment Guide

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

## Quick Deploy
```bash
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq
cp .env.example .env
docker-compose up -d
./scripts/init-services.sh
```

## Environment Setup
1. Copy `.env.example` to `.env`
2. Set required API keys:
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `SECRET_KEY`

## Service Verification
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f backend

# Health checks
curl http://localhost:8000/health
curl http://localhost:3003  # Grafana
curl http://localhost:5000  # MLflow
```

## Production Considerations
- Use external PostgreSQL
- Configure SSL certificates
- Set up backup strategies
- Monitor resource usage
- Scale worker containers

## Scaling
```bash
# Scale Celery workers
docker-compose up -d --scale celery-worker=3

# Scale backend instances
docker-compose up -d --scale backend=2
```