# Deployment Guide

This guide covers deploying the AutoMatrix AI Hub Workflow Engine MVP to production environments.

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM and 10GB disk space
- OpenAI API key
- Domain name (optional, for SSL)

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Copy environment configuration**
   ```bash
   cp .env.production .env
   ```

3. **Update environment variables in `.env`**
   - Set `POSTGRES_PASSWORD` to a secure password
   - Set `OPENAI_API_KEY` to your OpenAI API key
   - Set `SECRET_KEY` to a secure random string (at least 32 characters)
   - Update `CORS_ORIGINS` with your domain

4. **Deploy the application**
   ```bash
   ./scripts/deploy.sh production
   ```

5. **Verify deployment**
   ```bash
   ./scripts/deploy-check.sh
   ```

## Environment Configuration

### Production Environment (`.env.production`)

Required variables:
- `POSTGRES_PASSWORD`: Secure database password
- `OPENAI_API_KEY`: Your OpenAI API key
- `SECRET_KEY`: JWT signing key (32+ characters)
- `CORS_ORIGINS`: Comma-separated list of allowed origins

Optional variables:
- `POSTGRES_DB`: Database name (default: workflow_engine)
- `POSTGRES_USER`: Database user (default: postgres)
- `LOG_LEVEL`: Logging level (default: INFO)
- `BACKEND_PORT`: Backend port (default: 8000)
- `FRONTEND_PORT`: Frontend port (default: 3000)

### Staging Environment (`.env.staging`)

Copy `.env.staging` to `.env` for staging deployments with debug enabled.

## Deployment Commands

### Deploy to Production
```bash
./scripts/deploy.sh production
```

### Deploy to Staging
```bash
./scripts/deploy.sh staging
```

### Health Check
```bash
./scripts/deploy-check.sh
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f [service_name]
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

## SSL Configuration

To enable HTTPS:

1. **Obtain SSL certificates** (Let's Encrypt, commercial CA, or self-signed)

2. **Place certificates in `nginx/ssl/`**
   ```
   nginx/ssl/cert.pem
   nginx/ssl/key.pem
   ```

3. **Uncomment SSL configuration in `nginx/nginx.conf`**

4. **Update environment variables**
   ```bash
   NGINX_SSL_PORT=443
   CORS_ORIGINS=https://yourdomain.com
   REACT_APP_API_URL=https://yourdomain.com
   ```

5. **Redeploy**
   ```bash
   ./scripts/deploy.sh production
   ```

## Database Management

### Backup Database
```bash
./scripts/backup.sh
```

### Restore Database
```bash
# Stop the application
docker-compose -f docker-compose.prod.yml down

# Restore from backup
gunzip -c backups/workflow_engine_backup_YYYYMMDD_HHMMSS.sql.gz | \
docker exec -i postgres psql -U postgres -d workflow_engine

# Start the application
./scripts/deploy.sh production
```

### Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Monitoring and Health Checks

### Health Check Endpoints

- **Application Health**: `http://localhost:8000/api/monitoring/health`
- **Detailed Health**: `http://localhost:8000/api/monitoring/health/detailed`
- **System Metrics**: `http://localhost:8000/api/monitoring/metrics/system`
- **Frontend Health**: `http://localhost:3000/health`

### Container Health Checks

All containers include built-in health checks:
- **Backend**: Checks API health endpoint
- **Frontend**: Checks nginx status
- **PostgreSQL**: Checks database connectivity

### Monitoring Commands

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# View container health
docker-compose -f docker-compose.prod.yml ps --filter "health=healthy"

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Monitor resource usage
docker stats
```

## Troubleshooting

### Common Issues

1. **Services not starting**
   - Check environment variables are set correctly
   - Verify Docker has sufficient resources
   - Check logs: `docker-compose -f docker-compose.prod.yml logs`

2. **Database connection errors**
   - Ensure PostgreSQL container is healthy
   - Verify DATABASE_URL is correct
   - Check database logs: `docker-compose -f docker-compose.prod.yml logs postgres`

3. **Frontend not loading**
   - Check if backend is accessible
   - Verify CORS_ORIGINS includes your domain
   - Check nginx logs: `docker-compose -f docker-compose.prod.yml logs nginx`

4. **API errors**
   - Verify OpenAI API key is valid
   - Check backend logs for detailed errors
   - Ensure all required environment variables are set

### Log Locations

- **Application logs**: Available via Docker logs
- **Nginx logs**: `/var/log/nginx/` in nginx container
- **PostgreSQL logs**: Available via Docker logs

### Performance Tuning

1. **Database Connection Pool**
   - Adjust `pool_size` and `max_overflow` in `backend/app/models/base.py`
   - Monitor connection usage in health checks

2. **Container Resources**
   - Adjust memory and CPU limits in `docker-compose.prod.yml`
   - Monitor with `docker stats`

3. **Nginx Configuration**
   - Adjust worker connections in `nginx/nginx.conf`
   - Enable additional caching if needed

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong passwords and keys
   - Rotate secrets regularly

2. **Network Security**
   - Use HTTPS in production
   - Configure firewall rules
   - Limit database access to application containers

3. **Container Security**
   - Containers run as non-root users
   - Regular security updates for base images
   - Minimal attack surface with multi-stage builds

## Scaling

For higher loads, consider:

1. **Horizontal Scaling**
   - Run multiple backend instances behind a load balancer
   - Use external PostgreSQL service
   - Implement session storage (Redis)

2. **Vertical Scaling**
   - Increase container resource limits
   - Optimize database queries
   - Add caching layers

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review container logs
3. Run health checks
4. Verify environment configuration