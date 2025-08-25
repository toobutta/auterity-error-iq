# Production Deployment Guide

## Overview

This guide covers deploying Auterity to production environments with proper security, scalability, and monitoring.

## Infrastructure Requirements

### Minimum System Requirements

- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 100GB SSD
- **Network**: 1Gbps connection

### Recommended Production Setup

- **Application Servers**: 2+ instances (load balanced)
- **Database**: PostgreSQL 15+ with replication
- **Cache**: Redis for session storage
- **Load Balancer**: Nginx or AWS ALB
- **Monitoring**: Prometheus + Grafana

## Deployment Architecture

```
Internet → Load Balancer → App Servers → Database
                      ↓
                   Static Files (CDN)
                      ↓
                   Monitoring Stack
```

## Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq

# Copy production environment
cp .env.production .env

# Build and start services
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Database Setup

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Seed production data
docker-compose exec backend python seed_templates.py
```

## Environment Configuration

### Production Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@db:5432/auterity_prod
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Security
SECRET_KEY=your-super-secure-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# API Keys
OPENAI_API_KEY=your-openai-api-key

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# Performance
WORKERS=4
MAX_CONNECTIONS=100
```

### Nginx Configuration

```nginx
upstream auterity_backend {
    server app1:8000;
    server app2:8000;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location /api/ {
        proxy_pass http://auterity_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/auterity;
        try_files $uri $uri/ /index.html;
    }
}
```

## Security Configuration

### 1. SSL/TLS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 2. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Database Security

```sql
-- Create production user
CREATE USER auterity_prod WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE auterity_prod TO auterity_prod;
GRANT USAGE ON SCHEMA public TO auterity_prod;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO auterity_prod;
```

## Monitoring and Logging

### 1. Application Monitoring

```yaml
# docker-compose.monitoring.yml
version: "3.8"
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 2. Log Management

```bash
# Configure log rotation
sudo tee /etc/logrotate.d/auterity << EOF
/var/log/auterity/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
EOF
```

### 3. Health Checks

```python
# Add to FastAPI app
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

## Backup and Recovery

### 1. Database Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U auterity_prod auterity_prod > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://auterity-backups/
```

### 2. Application Backup

```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /opt/auterity
aws s3 cp app_backup_$(date +%Y%m%d).tar.gz s3://auterity-backups/
```

### 3. Recovery Procedures

```bash
# Database recovery
psql -h localhost -U auterity_prod auterity_prod < backup_20240101_120000.sql

# Application recovery
tar -xzf app_backup_20240101.tar.gz -C /opt/
docker-compose restart
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
```

### 2. Application Optimization

```python
# Connection pooling
DATABASE_POOL_SIZE = 20
DATABASE_MAX_OVERFLOW = 30

# Caching
REDIS_URL = "redis://redis:6379/0"
CACHE_TTL = 300
```

### 3. Frontend Optimization

```bash
# Build optimized frontend
npm run build

# Serve with CDN
aws s3 sync dist/ s3://auterity-static/
aws cloudfront create-invalidation --distribution-id E123456789 --paths "/*"
```

## Scaling Considerations

### Horizontal Scaling

- Multiple application server instances
- Load balancer configuration
- Session storage in Redis
- Database read replicas

### Vertical Scaling

- Increase server resources
- Optimize database configuration
- Tune application settings
- Monitor resource usage

## Troubleshooting

### Common Issues

#### High CPU Usage

```bash
# Check processes
top -p $(pgrep -d',' python)

# Check database queries
SELECT query, state, query_start FROM pg_stat_activity;
```

#### Memory Issues

```bash
# Check memory usage
free -h
docker stats

# Check for memory leaks
ps aux --sort=-%mem | head
```

#### Database Connection Issues

```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Check connection limits
SHOW max_connections;
```

## Maintenance

### Regular Tasks

- **Daily**: Check logs and monitoring
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Capacity planning and optimization review

### Update Procedures

```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Restart services
docker-compose restart
```

## Disaster Recovery

### Backup Strategy

- **Database**: Daily automated backups
- **Application**: Weekly full backups
- **Configuration**: Version controlled
- **Monitoring**: Backup retention policies

### Recovery Plan

1. Assess damage and scope
2. Restore from latest backup
3. Verify data integrity
4. Test application functionality
5. Update DNS if needed
6. Monitor for issues

## Support and Maintenance

### Monitoring Alerts

- High error rates
- Database connection issues
- Disk space warnings
- SSL certificate expiration

### Support Contacts

- **Technical Lead**: technical@auterity.com
- **DevOps Team**: devops@auterity.com
- **Emergency**: +1-555-AUTERITY

---

**Last Updated**: $(date)
**Version**: 1.0
**Environment**: Production
