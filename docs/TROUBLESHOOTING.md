

# Troubleshooting Guid

e

#

# Common Issue

s

#

## Services Won't Star

t

```bash

# Check Docker resources

docker system df
docker system prune

# Restart specific service

docker-compose restart backen

d

# View service logs

docker-compose logs -f backen

d

```

#

## Database Connection Issue

s

```

bash

# Check PostgreSQL status

docker-compose exec postgres pg_isread

y

# Reset database

docker-compose down -v

docker-compose up -d postgre

s

```

#

## High Memory Usag

e

```

bash

# Check resource usage

docker stats

# Scale down services

docker-compose up -d --scale celery-worker=

1

```

#

## API Error

s

- Check JWT token validit

y

- Verify environment variable

s

- Review application log

s

- Test with curl/Postma

n

#

## Performance Issue

s

- Monitor Grafana dashboard

s

- Check Celery queue lengt

h

- Review database query performanc

e

- Scale worker container

s

#

# Health Check Command

s

```

bash

# All services

curl http://localhost:8000/health

# Individual services

curl http://localhost:3003/api/health

# Grafana

curl http://localhost:9090/-/healthy



# Prometheus

curl http://localhost:5000/health

# MLflow

```

#

# Log Location

s

- Application: `docker-compose logs backend

`

- Database: `docker-compose logs postgres

`

- Workers: `docker-compose logs celery-worker

`

- All services: `docker-compose logs

`

#

# Recovery Procedure

s

1. **Service restart**: `docker-compose restart <service

>

`

2. **Full reset**: `docker-compose down && docker-compose up -

d

`

3. **Data reset**: `docker-compose down -v && docker-compose up -

d

`
