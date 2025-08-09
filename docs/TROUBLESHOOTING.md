# Troubleshooting Guide

## Common Issues

### Services Won't Start
```bash
# Check Docker resources
docker system df
docker system prune

# Restart specific service
docker-compose restart backend

# View service logs
docker-compose logs -f backend
```

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### High Memory Usage
```bash
# Check resource usage
docker stats

# Scale down services
docker-compose up -d --scale celery-worker=1
```

### API Errors
- Check JWT token validity
- Verify environment variables
- Review application logs
- Test with curl/Postman

### Performance Issues
- Monitor Grafana dashboards
- Check Celery queue length
- Review database query performance
- Scale worker containers

## Health Check Commands
```bash
# All services
curl http://localhost:8000/health

# Individual services
curl http://localhost:3003/api/health  # Grafana
curl http://localhost:9090/-/healthy   # Prometheus
curl http://localhost:5000/health      # MLflow
```

## Log Locations
- Application: `docker-compose logs backend`
- Database: `docker-compose logs postgres`
- Workers: `docker-compose logs celery-worker`
- All services: `docker-compose logs`

## Recovery Procedures
1. **Service restart**: `docker-compose restart <service>`
2. **Full reset**: `docker-compose down && docker-compose up -d`
3. **Data reset**: `docker-compose down -v && docker-compose up -d`