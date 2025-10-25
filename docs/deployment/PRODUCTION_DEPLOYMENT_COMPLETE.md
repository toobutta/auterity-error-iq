

# Production Deployment Guide

 - Comple

t

e

#

# Overvie

w

This guide covers complete production deployment of Auterity with all infrastructure services, security hardening, monitoring, and operational procedures.

#

# Pre-Deployment Checkli

s

t

#

## Infrastructure Requirement

s

#

### Minimum System Requirement

s

```yaml

# Production Server Specifications

CPU: 8 cores (16 vCPUs recommended)
RAM: 32GB (64GB recommended)
Storage: 500GB SSD (1TB recommended)
Network: 1Gbps connection
OS: Ubuntu 22.04 LTS or RHEL

8

+ ```

#

### Service Resource Allocatio

n

```

yaml

# Resource Distribution

PostgreSQL: 4GB RAM, 2 CPU cores
Elasticsearch: 8GB RAM, 2 CPU cores
Redis: 2GB RAM, 1 CPU core
MinIO: 2GB RAM, 1 CPU core
Qdrant: 2GB RAM, 1 CPU core
Application Services: 8GB RAM, 4 CPU cores
Monitoring Stack: 4GB RAM, 2 CPU cores

```

#

## Security Prerequisite

s

#

### SSL/TLS Certificate

s

```

bash

# Generate certificates using Let's Encrypt

certbot certonly --standalone -d api.yourdomain.com

certbot certonly --standalone -d app.yourdomain.com

certbot certonly --standalone -d monitoring.yourdomain.co

m

```

#

### Firewall Configuratio

n

```

bash

# UFW firewall rules

ufw allow 22/tcp

# SSH

ufw allow 80/tcp

# HTTP

ufw allow 443/tcp

# HTTPS

ufw deny 5432/tcp

# PostgreSQL (internal only)

ufw deny 6379/tcp

# Redis (internal only)

ufw deny 9200/tcp

# Elasticsearch (internal only)

ufw enable

```

#

# Production Docker Compos

e

#

## docker-compose.prod.y

m

l

```

yaml
version: "3.8

"

services:


# Reverse Proxy

  nginx:
    image: nginx:alpine
    ports:

      - "80:80

"

      - "443:443"

    volumes:

      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.con

f

      - ./nginx/ssl:/etc/nginx/ss

l

      - nginx_logs:/var/log/nginx

    depends_on:

      - backen

d

      - frontend

    networks:

      - ai-platform

    restart: unless-stoppe

d



# Database

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:

      - postgres_data:/var/lib/postgresql/dat

a

      - ./scripts/init-unified-db.sql:/docker-entrypoint-initdb.d/init-unified-db.sql

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"

        reservations:
          memory: 2G



# Cache and Message Queue

  redis:
    image: redis:7-alpine

    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}

    volumes:

      - redis_data:/data

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.0

"



# Object Storage

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"

    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:

      - minio_data:/data

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.0

"



# Vector Database

  qdrant:
    image: qdrant/qdrant:latest
    volumes:

      - qdrant_data:/qdrant/storage

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "1.0

"



# Search Engine

  elasticsearch:
    image: elasticsearch:8.11.0

    environment:

      - discovery.type=single-nod

e

      - xpack.security.enabled=tru

e

      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD

}

      - ES_JAVA_OPTS=-Xms4g -Xmx4g

    volumes:

      - elasticsearch_data:/usr/share/elasticsearch/data

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 8G
          cpus: "2.0"

        reservations:
          memory: 4G



# Search UI

  kibana:
    image: kibana:8.11.0

    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
      ELASTICSEARCH_USERNAME: elastic
      ELASTICSEARCH_PASSWORD: ${ELASTIC_PASSWORD}
    depends_on:

      - elasticsearch

    networks:

      - ai-platform

    restart: unless-stoppe

d



# Backend API

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
      QDRANT_HOST: qdrant
      ELASTICSEARCH_HOST: elasticsearch:9200
      ELASTICSEARCH_PASSWORD: ${ELASTIC_PASSWORD}
      SECRET_KEY: ${SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ENVIRONMENT: production
      LOG_LEVEL: INFO
    depends_on:

      - postgre

s

      - redi

s

      - mini

o

      - qdran

t

      - elasticsearch

    networks:

      - ai-platform

    restart: unless-stopped

    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0

"



# Frontend

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      VITE_API_URL: https://api.yourdomain.com
    networks:

      - ai-platform

    restart: unless-stoppe

d



# Monitoring

  prometheus:
    image: prom/prometheus:latest
    volumes:

      - ./monitoring/prometheus:/etc/prometheu

s

      - prometheus_data:/prometheus

    command:

      - "--config.file=/etc/prometheus/prometheus.yml

"

      - "--storage.tsdb.path=/prometheus

"

      - "--storage.tsdb.retention.time=30d

"

      - "--web.enable-lifecycle"

    networks:

      - ai-platform

    restart: unless-stoppe

d

  grafana:
    image: grafana/grafana:latest
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_SERVER_ROOT_URL: https://monitoring.yourdomain.com
    volumes:

      - grafana_data:/var/lib/grafan

a

      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning

    networks:

      - ai-platform

    restart: unless-stoppe

d

volumes:
  postgres_data:
  redis_data:
  minio_data:
  qdrant_data:
  elasticsearch_data:
  grafana_data:
  prometheus_data:
  nginx_logs:

networks:
  ai-platform:

    driver: bridge
    internal: false

```

#

# Environment Configuratio

n

#

## Production Environment Variable

s

```

bash

# .env.productio

n

# Database

POSTGRES_DB=auterity_prod
POSTGRES_USER=auterity_user
POSTGRES_PASSWORD=your_secure_db_password

# Redis

REDIS_PASSWORD=your_secure_redis_password

# MinIO

MINIO_ROOT_USER=auterity_minio
MINIO_ROOT_PASSWORD=your_secure_minio_password

# Elasticsearch

ELASTIC_PASSWORD=your_secure_elastic_password

# Application

SECRET_KEY=your_256_bit_secret_key
OPENAI_API_KEY=your_openai_api_key

# Monitoring

GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your_secure_grafana_password

# Domain Configuration

DOMAIN=yourdomain.com
API_DOMAIN=api.yourdomain.com
APP_DOMAIN=app.yourdomain.com
MONITORING_DOMAIN=monitoring.yourdomain.com

```

#

# Nginx Configuratio

n

#

## nginx.prod.con

f

```

nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    upstream grafana {
        server grafana:3000;
    }



# Rate limiting

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=app:10m rate=30r/s;



# SSL Configuration

    ssl_protocols TLSv1.2 TLSv1.3;

    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;



# API Server

    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/api.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/api.yourdomain.com/privkey.pem;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_set_header X-Forwarded-Proto $scheme;

        }
    }



# Frontend App

    server {
        listen 443 ssl http2;
        server_name app.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/app.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/app.yourdomain.com/privkey.pem;

        location / {
            limit_req zone=app burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_set_header X-Forwarded-Proto $scheme;

        }
    }



# Monitoring Dashboard

    server {
        listen 443 ssl http2;
        server_name monitoring.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/monitoring.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/monitoring.yourdomain.com/privkey.pem;



# Basic auth for monitoring

        auth_basic "Monitoring Access";
        auth_basic_user_file /etc/nginx/.htpasswd;

        location / {
            proxy_pass http://grafana;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;

            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_set_header X-Forwarded-Proto $scheme;

        }
    }



# HTTP to HTTPS redirect

    server {
        listen 80;
        server_name api.yourdomain.com app.yourdomain.com monitoring.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
}

```

#

# Deployment Script

s

#

## deploy.s

h

```

bash

#!/bin/bash

set -e

echo "🚀 Starting Auterity Production Deployment"

# Check prerequisites

if [ ! -f .env.production ]; then

    echo "❌ .env.production file not found"
    exit 1
fi

# Load environment variables

source .env.production

# Create necessary directories

mkdir -p nginx/ssl

mkdir -p monitoring/prometheus

mkdir -p monitoring/grafana/provisionin

g

# Generate strong passwords if not set

if [ -z "$SECRET_KEY" ]; then

    export SECRET_KEY=$(openssl rand -hex 32)

    echo "Generated SECRET_KEY: $SECRET_KEY"
fi

# Pull latest images

echo "📦 Pulling Docker images..."
docker-compose -f docker-compose.prod.yml pul

l

# Build custom images

echo "🔨 Building application images..."
docker-compose -f docker-compose.prod.yml buil

d

# Start services

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -

d

# Wait for services to be ready

echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations

echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade hea

d

# Initialize default data

echo "📊 Initializing default data..."
docker-compose -f docker-compose.prod.yml exec backend python -m app.init_d

b

# Verify deployment

echo "✅ Verifying deployment..."
./scripts/health-check.s

h

echo "🎉 Deployment completed successfully!"
echo "📊 Monitoring: https://monitoring.$DOMAIN"
echo "🌐 Application: https://app.$DOMAIN"
echo "🔌 API: https://api.$DOMAIN"

```

#

## health-check.

s

h

```

bash

#!/bin/bas

h

echo "🔍 Running health checks..."

# Check service health

services=("postgres" "redis" "minio" "qdrant" "elasticsearch" "backend" "frontend")

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.prod.yml ps $service | grep -q "Up"; then

        echo "✅ $service is running"
    else
        echo "❌ $service is not running"
        exit 1
    fi
done

# Check API health

if curl -f -s https://api.$DOMAIN/health > /dev/null; then

    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    exit 1
fi

# Check frontend

if curl -f -s https://app.$DOMAIN > /dev/null; then

    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "🎉 All health checks passed!"

```

#

# Security Hardenin

g

#

## Application Securit

y

```

python

# backend/app/config/security.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

def configure_security(app: FastAPI):


# HTTPS redirect in production

    if os.getenv("ENVIRONMENT") == "production":
        app.add_middleware(HTTPSRedirectMiddleware)



# Trusted hosts

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["api.yourdomain.com", "localhost"]
    )



# CORS configuration

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://app.yourdomain.com"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],

    )



# Security headers

    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"

        response.headers["X-Frame-Options"] = "DENY"

        response.headers["X-XSS-Protection"] = "1; mode=block"

        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response

```

#

## Database Securit

y

```

sql
- - Create read-only user for monitoring

CREATE USER monitoring_user WITH PASSWORD 'secure_monitoring_password';
GRANT CONNECT ON DATABASE auterity_prod TO monitoring_user;
GRANT USAGE ON SCHEMA public TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;

- - Create backup user

CREATE USER backup_user WITH PASSWORD 'secure_backup_password';
GRANT CONNECT ON DATABASE auterity_prod TO backup_user;
GRANT USAGE ON SCHEMA public TO backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

```

#

# Monitoring and Alertin

g

#

## Prometheus Alert

s

```

yaml

# monitoring/prometheus/alert_rules.yml

groups:

  - name: auterity_alerts

    rules:

      - alert: HighErrorRate

        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1

        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseConnectionsHigh

        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connections"

      - alert: DiskSpaceUsage

        expr: (node_filesystem_size_bytes

 - node_filesystem_free_bytes) / node_filesystem_size_bytes > 0.8

5

        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space usage above 85%"

      - alert: ServiceDown

        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"

```

#

## Grafana Dashboard

s

```

json
{
  "dashboard": {
    "title": "Auterity Production Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ status }}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",

            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Service Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up",
            "legendFormat": "{{ instance }}"
          }
        ]
      }
    ]
  }
}

```

#

# Backup and Recover

y

#

## Automated Backup Scrip

t

```

bash

#!/bin/bas

h

# backup.s

h

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"

mkdir -p $BACKUP_DI

R

# Database backup

docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_DIR/database.sq

l

# MinIO backup

docker run --rm -v minio_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/minio.tar.gz -C /data

.

# Elasticsearch backup

curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$(date +%Y%m%d_%H%M%S)

"

# Compress and upload to S3

tar czf $BACKUP_DIR.tar.gz $BACKUP_DIR
aws s3 cp $BACKUP_DIR.tar.gz s3://your-backup-bucket

/

# Cleanup old backups (keep 30 days)

find /backups -type d -mtime +30 -exec rm -rf {} \

;

```

#

## Recovery Procedure

s

```

bash

#!/bin/bas

h

# restore.s

h

BACKUP_DATE=$1
BACKUP_DIR="/backups/$BACKUP_DATE"

if [ ! -d "$BACKUP_DIR" ]; then

    echo "Backup directory not found: $BACKUP_DIR"
    exit 1
fi

# Stop services

docker-compose -f docker-compose.prod.yml dow

n

# Restore database

docker-compose -f docker-compose.prod.yml up -d postgres

sleep 10
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"

docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"

docker-compose -f docker-compose.prod.yml exec -T postgres psql -U $POSTGRES_USER $POSTGRES_DB < $BACKUP_DIR/database.sq

l

# Restore MinIO

docker volume rm minio_data
docker volume create minio_data
docker run --rm -v minio_data:/data -v $BACKUP_DIR:/backup alpine tar xzf /backup/minio.tar.gz -C /dat

a

# Start all services

docker-compose -f docker-compose.prod.yml up -

d

echo "Recovery completed from backup: $BACKUP_DATE"

```

#

# Maintenance Procedure

s

#

## Log Rotatio

n

```

bash

# /etc/logrotate.d/auterity

/var/log/auterity/*.log {

    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/auterity/docker-compose.prod.yml restart nginx

    endscript
}

```

#

## Update Procedur

e

```

bash

#!/bin/bas

h

# update.s

h

echo "🔄 Starting Auterity update..."

# Create backup before update

./backup.sh

# Pull latest images

docker-compose -f docker-compose.prod.yml pul

l

# Rebuild custom images

docker-compose -f docker-compose.prod.yml buil

d

# Rolling update (zero downtime)

docker-compose -f docker-compose.prod.yml up -d --no-deps backend

sleep 30
docker-compose -f docker-compose.prod.yml up -d --no-deps fronten

d

# Run migrations

docker-compose -f docker-compose.prod.yml exec backend alembic upgrade hea

d

# Verify update

./scripts/health-check.s

h

echo "✅ Update completed successfully!"

```

This production deployment guide provides a complete, secure, and scalable deployment strategy for Auterity with all infrastructure services, monitoring, backup procedures, and maintenance workflows.
