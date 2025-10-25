

# Deployment and Operations Guid

e

**Document Version**: 1.

0
**Last Updated**: August 8, 202

5
**Maintained By**: DevOps Tea

m

#

# Overvie

w

This guide provides comprehensive instructions for deploying, configuring, and operating the Auterity Unified Platform across different environments. It covers infrastructure setup, deployment procedures, monitoring, maintenance, and troubleshooting.

--

- #

# Infrastructure Architectur

e

#

##

 1. Environment Overvi

e

w

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Environment Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│  Production Environment                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   Load Balancer │ │   Web Servers   │ │   API Servers   │      │
│  │   (AWS ALB)     │ │   (nginx)       │ │   (FastAPI)     │      │
│  │   Multi-AZ      │ │   Auto Scaling  │ │   Auto Scaling  │      │

│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │
│  │   Database      │ │      Cache      │ │   File Storage  │      │
│  │   (RDS PG)      │ │     (Redis)     │ │      (S3)       │      │
│  │   Multi-AZ      │ │   ElastiCache   │ │   Multi-Region  │      │

│  └─────────────────┘ └─────────────────┘ └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Staging Environment                                                │
│  ┌─────────────────────────────────────────────────────────────────┤
│  │   Single-AZ deployment for testing and QA                      │

│  │   Mirrors production architecture at smaller scale             │
│  └─────────────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────────────┤
│  Development Environment                                            │
│  ┌─────────────────────────────────────────────────────────────────┤
│  │   Docker Compose setup for local development                   │
│  │   All services running on single machine                       │
│  └─────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────┘

```

#

##

 2. Infrastructure Componen

t

s

#

### AWS Resource

s

```

yaml

# infrastructure/terraform/main.tf

provider "aws" {
  region = var.aws_region
}

# VPC Configuration

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "auterity-vpc-${var.environment}"

    Environment = var.environment
  }
}

# Subnets

resource "aws_subnet" "public" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.inde

x

 + 1}.0/24"

  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "auterity-public-${count.inde

x

 + 1}-${var.environment}"

    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.inde

x

 + 10}.0/24"

  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "auterity-private-${count.inde

x

 + 1}-${var.environment}"

    Type = "Private"
  }
}

# Application Load Balancer

resource "aws_lb" "main" {
  name               = "auterity-alb-${var.environment}"

  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].i

d

  enable_deletion_protection = var.environment == "production"

  tags = {
    Environment = var.environment
  }
}

# RDS PostgreSQL Database

resource "aws_db_instance" "main" {
  identifier     = "auterity-db-${var.environment}"

  engine         = "postgres"
  engine_version = "15.4"

  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_encrypted     = true

  db_name  = "auterity"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"

  maintenance_window     = "sun:04:00-sun:05:00

"

  multi_az               = var.environment == "production"
  publicly_accessible    = false

  skip_final_snapshot = var.environment != "production"

  tags = {
    Environment = var.environment
  }
}

# ElastiCache Redis

resource "aws_elasticache_subnet_group" "main" {
  name       = "auterity-cache-subnet-${var.environment}"

  subnet_ids = aws_subnet.private[*].id

}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "auterity-redis-${var.environment}"

  description                  = "Redis cluster for Auterity ${var.environment}"

  node_type                    = var.redis_node_type
  port                         = 6379
  parameter_group_name         = "default.redis7"

  num_cache_clusters           = var.environment == "production" ? 2 : 1
  automatic_failover_enabled   = var.environment == "production"
  multi_az_enabled             = var.environment == "production"

  subnet_group_name            = aws_elasticache_subnet_group.main.name
  security_group_ids           = [aws_security_group.redis.id]

  at_rest_encryption_enabled   = true
  transit_encryption_enabled   = true

  tags = {
    Environment = var.environment
  }
}

# ECS Cluster

resource "aws_ecs_cluster" "main" {
  name = "auterity-cluster-${var.environment}

"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
  }
}

```

--

- #

# Deployment Procedure

s

#

##

 1. Production Deployme

n

t

#

### Pre-Deployment Checkli

s

t

```

bash

#!/bin/bas

h

# scripts/pre-deployment-checklist.

s

h

echo "🔍 Running pre-deployment checklist...

"

#

 1. Check environment variable

s

echo "✅ Checking environment variables..."
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET_KEY"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
)

for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then

        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

#

 2. Database connectivity tes

t

echo "✅ Testing database connectivity..."
python3 -c "

import os
import psycopg2
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    conn.close()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"

#

 3. Redis connectivity tes

t

echo "✅ Testing Redis connectivity..."
python3 -c "

import os
import redis
try:
    r = redis.from_url(os.environ['REDIS_URL'])
    r.ping()
    print('Redis connection successful')
except Exception as e:
    print(f'Redis connection failed: {e}')
    exit(1)
"

#

 4. Run database migrations (dry-ru

n

)

echo "✅ Checking database migrations..."
cd backend
alembic check
if [ $? -ne 0 ]; then

    echo "❌ Database migrations check failed"
    exit 1
fi

#

 5. Build and test Docker image

s

echo "✅ Building and testing Docker images..."
docker build -t auterity-backend:test ./backend

docker build -t auterity-frontend:test ./fronten

d

#

 6. Run smoke test

s

echo "✅ Running smoke tests..."
docker run --rm auterity-backend:test python -m pytest tests/smoke/ -

v

echo "🎉 Pre-deployment checklist completed successfully!

"

```

#

### Blue-Green Deployment Scri

p

t

```

bash

#!/bin/bas

h

# scripts/blue-green-deploy.

s

h

set -e

ENVIRONMENT=${1:-production}

VERSION=${2:-$(git rev-parse --short HEAD)}

REGION="us-west-2

"

echo "🚀 Starting blue-green deployment for $ENVIRONMENT..."

echo "📦 Version: $VERSION"

#

 1. Build and push Docker image

s

echo "🔨 Building Docker images..."
docker build -t auterity-backend:$VERSION ./backend

docker build -t auterity-frontend:$VERSION ./fronten

d

# Tag and push to ECR

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

docker tag auterity-backend:$VERSION $ECR_REGISTRY/auterity-backend:$VERSION

docker tag auterity-frontend:$VERSION $ECR_REGISTRY/auterity-frontend:$VERSIO

N

docker push $ECR_REGISTRY/auterity-backend:$VERSION

docker push $ECR_REGISTRY/auterity-frontend:$VERSIO

N

#

 2. Update ECS task definition

s

echo "📋 Updating ECS task definitions..."
aws ecs register-task-definition

\
    --family auterity-backend-$ENVIRONMENT

\
    --cli-input-json file://infrastructure/ecs/backend-task-definition.json

\
    --region $REGIO

N

aws ecs register-task-definition

\
    --family auterity-frontend-$ENVIRONMENT

\
    --cli-input-json file://infrastructure/ecs/frontend-task-definition.json

\
    --region $REGIO

N

#

 3. Create new service (green

)

CLUSTER_NAME="auterity-cluster-$ENVIRONMENT"

CURRENT_SERVICE="auterity-service-$ENVIRONMENT"

GREEN_SERVICE="auterity-service-$ENVIRONMENT-green

"

echo "🔄 Creating green service..."
aws ecs create-service

\
    --cluster $CLUSTER_NAME

\
    --service-name $GREEN_SERVICE

\
    --task-definition auterity-backend-$ENVIRONMENT

\
    --desired-count 2

\
    --launch-type FARGATE

\
    --network-configuration file://infrastructure/ecs/network-config.json

\
    --region $REGIO

N

#

 4. Wait for green service to be health

y

echo "⏳ Waiting for green service to be healthy..."
aws ecs wait services-stable

\
    --cluster $CLUSTER_NAME

\
    --services $GREEN_SERVICE

\
    --region $REGIO

N

#

 5. Run health check

s

echo "🏥 Running health checks..."
GREEN_ALB_DNS=$(aws elbv2 describe-load-balancers

\
    --names auterity-alb-$ENVIRONMENT-green

\
    --query 'LoadBalancers[0].DNSName'

\
    --output text

\
    --region $REGION

)

# Health check with retry

for i in {1..10}; do

    if curl -f http://$GREEN_ALB_DNS/api/health; then

        echo "✅ Health check passed"
        break
    fi
    if [ $i -eq 10 ]; then

        echo "❌ Health check failed after 10 attempts"


# Rollback

        aws ecs delete-service --cluster $CLUSTER_NAME --service $GREEN_SERVICE --force --region $REGION

        exit 1
    fi
    sleep 30
done

#

 6. Switch traffic to gree

n

echo "🔀 Switching traffic to green service..."
aws elbv2 modify-listener

\
    --listener-arn $(aws elbv2 describe-listeners

\
        --load-balancer-arn $(aws elbv2 describe-load-balancers

\
            --names auterity-alb-$ENVIRONMENT

\
            --query 'LoadBalancers[0].LoadBalancerArn'

\
            --output text)

\
        --query 'Listeners[0].ListenerArn'

\
        --output text)

\
    --default-actions Type=forward,TargetGroupArn=$(aws elbv2 describe-target-groups

\
        --names auterity-tg-$ENVIRONMENT-green

\
        --query 'TargetGroups[0].TargetGroupArn'

\
        --output text)

\
    --region $REGIO

N

#

 7. Verify traffic switc

h

echo "🔍 Verifying traffic switch..."
sleep 60
for i in {1..5}; do

    if curl -f http://$(aws elbv2 describe-load-balancers

\
        --names auterity-alb-$ENVIRONMENT

\
        --query 'LoadBalancers[0].DNSName'

\
        --output text)/api/health; then

        echo "✅ Traffic switch verified"
        break
    fi
    sleep 10
done

#

 8. Clean up old service (blue

)

echo "🧹 Cleaning up old service..."
aws ecs update-service

\
    --cluster $CLUSTER_NAME

\
    --service $CURRENT_SERVICE

\
    --desired-count 0

\
    --region $REGIO

N

aws ecs wait services-stable

\
    --cluster $CLUSTER_NAME

\
    --services $CURRENT_SERVICE

\
    --region $REGIO

N

aws ecs delete-service

\
    --cluster $CLUSTER_NAME

\
    --service $CURRENT_SERVICE

\
    --region $REGIO

N

#

 9. Rename green service to curren

t

aws ecs update-service

\
    --cluster $CLUSTER_NAME

\
    --service $GREEN_SERVICE

\
    --desired-count 2

\
    --region $REGIO

N

echo "🎉 Blue-green deployment completed successfully!"

echo "📊 New version $VERSION is now live in $ENVIRONMENT"

```

#

##

 2. Environment-Specific Configurat

i

o

n

#

### Production Configuratio

n

```

yaml

# infrastructure/environments/production.yml

environment: production
region: us-west-

2

# Compute Resources

app_instance_type: t3.large

app_min_capacity: 2
app_max_capacity: 10
app_desired_capacity: 3

# Database

db_instance_class: db.t3.large

db_allocated_storage: 100
db_max_allocated_storage: 1000
db_backup_retention: 30
db_multi_az: true

# Cache

redis_node_type: cache.t3.medium

redis_num_nodes: 2

# Monitoring

cloudwatch_log_retention: 30
enable_detailed_monitoring: true

# Security

ssl_certificate_arn: "arn:aws:acm:us-west-2:123456789:certificate/xxx"

waf_enabled: true
enable_deletion_protection: true

# Auto Scaling

scale_up_threshold: 70

# CPU percentage

scale_down_threshold: 30

# CPU percentage

scale_up_adjustment: 2

# Number of instances

scale_down_adjustment: -1



# Number of instances

```

#

### Staging Configuratio

n

```

yaml

# infrastructure/environments/staging.yml

environment: staging
region: us-west-

2

# Compute Resources

app_instance_type: t3.medium

app_min_capacity: 1
app_max_capacity: 3
app_desired_capacity: 2

# Database

db_instance_class: db.t3.medium

db_allocated_storage: 50
db_max_allocated_storage: 200
db_backup_retention: 7
db_multi_az: false

# Cache

redis_node_type: cache.t3.small

redis_num_nodes: 1

# Monitoring

cloudwatch_log_retention: 14
enable_detailed_monitoring: false

# Security

ssl_certificate_arn: "arn:aws:acm:us-west-2:123456789:certificate/yyy"

waf_enabled: false
enable_deletion_protection: false

```

#

##

 3. Database Migration Manageme

n

t

#

### Migration Script

s

```

python

# scripts/migrate_database.py

"""Database migration management script."""

import os
import sys
import logging
from alembic.config import Config
from alembic import command
from sqlalchemy import create_engine, text
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMI

T

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseMigrator:
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.engine = create_engine(database_url)

    def create_database_if_not_exists(self):
        """Create database if it doesn't exist."""
        try:


# Parse database URL to get connection details

            from urllib.parse import urlparse
            parsed = urlparse(self.database_url)



# Connect to PostgreSQL server (not specific database)

            conn = psycopg2.connect(

                host=parsed.hostname,
                port=parsed.port,
                user=parsed.username,
                password=parsed.password,
                database='postgres'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()



# Check if database exists

            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (parsed.path.lstrip('/'),)
            )

            if not cursor.fetchone():
                logger.info(f"Creating database: {parsed.path.lstrip('/')}")
                cursor.execute(f'CREATE DATABASE "{parsed.path.lstrip("/")}"')
            else:
                logger.info("Database already exists")

            cursor.close()
            conn.close()

        except Exception as e:
            logger.error(f"Error creating database: {e}")
            raise

    def backup_database(self, backup_path: str):
        """Create database backup before migration."""
        from urllib.parse import urlparse
        parsed = urlparse(self.database_url)

        backup_command = [
            "pg_dump",
            "-h", parsed.hostname,

            "-p", str(parsed.port or 5432),

            "-U", parsed.username,

            "-d", parsed.path.lstrip('/'),

            "-f", backup_path,

            "--verbose"

        ]

        env = os.environ.copy()
        env['PGPASSWORD'] = parsed.password

        import subprocess
        result = subprocess.run(backup_command, env=env, capture_output=True, text=True)

        if result.returncode != 0:
            logger.error(f"Backup failed: {result.stderr}")
            raise Exception("Database backup failed")

        logger.info(f"Database backup created: {backup_path}")

    def run_migrations(self, target_revision: str = "head"):
        """Run database migrations."""
        try:
            alembic_cfg = Config("backend/alembic.ini")
            alembic_cfg.set_main_option("sqlalchemy.url", self.database_url)

            logger.info("Running database migrations...")
            command.upgrade(alembic_cfg, target_revision)
            logger.info("Migrations completed successfully")

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            raise

    def rollback_migration(self, target_revision: str):
        """Rollback database migration."""
        try:
            alembic_cfg = Config("backend/alembic.ini")
            alembic_cfg.set_main_option("sqlalchemy.url", self.database_url)

            logger.info(f"Rolling back to revision: {target_revision}")
            command.downgrade(alembic_cfg, target_revision)
            logger.info("Rollback completed successfully")

        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            raise

    def validate_migration(self):
        """Validate database state after migration."""
        try:


# Run basic validation queries

            with self.engine.connect() as conn:


# Check critical tables exist

                result = conn.execute(text("""
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name IN ('users', 'workflows', 'workflow_executions')
                """))

                tables = [row[0] for row in result]
                required_tables = ['users', 'workflows', 'workflow_executions']

                missing_tables = set(required_tables)

 - set(tables)

                if missing_tables:
                    raise Exception(f"Missing required tables: {missing_tables}")



# Check for any orphaned data

                result = conn.execute(text("""
                    SELECT COUNT(*) FROM workflow_executions we

                    LEFT JOIN workflows w ON we.workflow_id = w.id
                    WHERE w.id IS NULL
                """))

                orphaned_count = result.scalar()
                if orphaned_count > 0:
                    logger.warning(f"Found {orphaned_count} orphaned workflow executions")

                logger.info("Database validation completed successfully")

        except Exception as e:
            logger.error(f"Database validation failed: {e}")
            raise

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate_database.py [migrate|rollback|validate] [revision]")
        sys.exit(1)

    command = sys.argv[1]
    revision = sys.argv[2] if len(sys.argv) > 2 else "head"

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)

    migrator = DatabaseMigrator(database_url)

    try:
        if command == "migrate":


# Create backup before migration

            backup_path = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
            migrator.backup_database(backup_path)



# Run migrations

            migrator.run_migrations(revision)
            migrator.validate_migration()

        elif command == "rollback":
            if revision == "head":
                logger.error("Revision required for rollback")
                sys.exit(1)
            migrator.rollback_migration(revision)

        elif command == "validate":
            migrator.validate_migration()

        else:
            logger.error(f"Unknown command: {command}")
            sys.exit(1)

    except Exception as e:
        logger.error(f"Operation failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

```

--

- #

# Monitoring and Observabilit

y

#

##

 1. Application Monitori

n

g

#

### Health Check Endpoint

s

```

python

# backend/app/api/v1/health.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import time
from app.database import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.VERSION
    }

@router.get("/health/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """Detailed health check with dependency validation."""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.VERSION,
        "checks": {}
    }



# Database connectivity check

    try:
        result = db.execute(text("SELECT 1")).scalar()
        health_status["checks"]["database"] = {
            "status": "healthy" if result == 1 else "unhealthy",
            "response_time": time.time()
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"



# Redis connectivity check

    try:
        redis_client = redis.from_url(settings.REDIS_URL)
        start_time = time.time()
        redis_client.ping()
        response_time = (time.time()

 - start_time

)

 * 100

0

        health_status["checks"]["redis"] = {
            "status": "healthy",
            "response_time_ms": round(response_time, 2)
        }
    except Exception as e:
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"



# External service checks

    health_status["checks"]["ai_service"] = await check_ai_service_health()

    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)

    return health_status

@router.get("/health/readiness")
async def readiness_check(db: Session = Depends(get_db)):
    """Kubernetes readiness probe endpoint."""
    try:


# Check if migrations are up to date

        result = db.execute(text("""
            SELECT version_num FROM alembic_version
        """)).scalar()

        if not result:
            raise HTTPException(
                status_code=503,
                detail="Database not initialized"
            )

        return {"status": "ready", "db_version": result}

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Not ready: {str(e)}"
        )

@router.get("/health/liveness")
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {"status": "alive", "timestamp": time.time()}

```

#

### Metrics Collectio

n

```

python

# backend/app/core/metrics.py

from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time
from typing import Callable

# Metrics definitions

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

WORKFLOW_EXECUTIONS = Counter(
    'workflow_executions_total',
    'Total workflow executions',
    ['workflow_type', 'status']
)

DATABASE_CONNECTIONS = Gauge(
    'database_connections_active',
    'Active database connections'
)

def track_request_metrics(func: Callable) -> Callable:

    """Decorator to track request metrics."""
    @wraps(func)
    async def wrapper(*args, **kwargs):

        start_time = time.time()

        try:
            response = await func(*args, **kwargs)

            status_code = getattr(response, 'status_code', 200)



# Track metrics

            REQUEST_COUNT.labels(
                method=kwargs.get('method', 'GET'),
                endpoint=func.__name__,
                status_code=status_code
            ).inc()

            REQUEST_DURATION.labels(
                method=kwargs.get('method', 'GET'),
                endpoint=func.__name__
            ).observe(time.time()

 - start_time

)

            return response

        except Exception as e:
            REQUEST_COUNT.labels(
                method=kwargs.get('method', 'GET'),
                endpoint=func.__name__,
                status_code=500
            ).inc()
            raise

    return wrapper

@router.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint."""
    return Response(
        generate_latest(),
        media_type="text/plain"
    )

```

#

##

 2. Logging Configurati

o

n

#

### Structured Loggin

g

```

python

# backend/app/core/logging.py

import logging
import json
import sys
from datetime import datetime
from typing import Dict, Any

class StructuredFormatter(logging.Formatter):
    """JSON structured logging formatter."""

    def format(self, record: logging.LogRecord) -> str:

        """Format log record as JSON."""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }



# Add extra fields if present

        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'execution_time'):
            log_entry['execution_time'] = record.execution_time



# Add exception info if present

        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

def setup_logging(log_level: str = "INFO", structured: bool = True):
    """Setup application logging configuration."""



# Clear existing handlers

    root_logger = logging.getLogger()
    root_logger.handlers.clear()



# Create handler

    handler = logging.StreamHandler(sys.stdout)

    if structured:
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s

 - %(name)

s

 - %(levelname)

s

 - %(message)s'

        )

    handler.setFormatter(formatter)



# Configure root logger

    root_logger.addHandler(handler)
    root_logger.setLevel(getattr(logging, log_level.upper()))



# Configure specific loggers

    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

class ContextualLogger:
    """Logger with contextual information."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.context = {}

    def set_context(self, **kwargs):

        """Set contextual information."""
        self.context.update(kwargs)

    def clear_context(self):
        """Clear contextual information."""
        self.context.clear()

    def _log_with_context(self, level: int, message: str, **kwargs):

        """Log message with context."""
        extra = {**self.context, **kwargs}

        self.logger.log(level, message, extra=extra)

    def info(self, message: str, **kwargs):

        self._log_with_context(logging.INFO, message, **kwargs

)

    def warning(self, message: str, **kwargs):

        self._log_with_context(logging.WARNING, message, **kwargs

)

    def error(self, message: str, **kwargs):

        self._log_with_context(logging.ERROR, message, **kwargs

)

    def debug(self, message: str, **kwargs):

        self._log_with_context(logging.DEBUG, message, **kwargs

)

# Usage example

logger = ContextualLogger(__name__)

@router.post("/api/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, current_user: User = Depends(get_current_user)):
    logger.set_context(
        user_id=current_user.id,
        workflow_id=workflow_id,
        request_id=uuid.uuid4().hex
    )

    logger.info("Starting workflow execution")

    try:
        result = await workflow_service.execute(workflow_id)
        logger.info("Workflow execution completed", execution_time=result.duration)
        return result
    except Exception as e:
        logger.error("Workflow execution failed", error=str(e))
        raise
    finally:
        logger.clear_context()

```

#

##

 3. Performance Monitori

n

g

#

### APM Integratio

n

```

python

# backend/app/core/apm.py

from elasticapm.contrib.starlette import ElasticAPM
from elasticapm.contrib.starlette import make_apm_client
import elasticapm

def setup_apm(app, config: dict):
    """Setup Application Performance Monitoring."""

    apm_config = {
        'SERVICE_NAME': config.get('service_name', 'auterity-backend'),

        'SERVER_URL': config.get('apm_server_url'),
        'SECRET_TOKEN': config.get('apm_secret_token'),
        'ENVIRONMENT': config.get('environment', 'production'),
        'CAPTURE_BODY': 'all',
        'CAPTURE_HEADERS': True,
        'TRANSACTIONS_IGNORE_PATTERNS': [
            '/health',
            '/metrics'
        ]
    }

    if apm_config['SERVER_URL']:
        apm = make_apm_client(apm_config)
        app.add_middleware(ElasticAPM, client=apm)



# Custom transaction tracking

        @app.middleware("http")
        async def apm_transaction_middleware(request, call_next):
            transaction_name = f"{request.method} {request.url.path}"

            elasticapm.set_transaction_name(transaction_name)
            elasticapm.tag(
                http_method=request.method,
                http_url=str(request.url),
                user_agent=request.headers.get('user-agent')

            )

            response = await call_next(request)

            elasticapm.tag(
                http_status_code=response.status_code
            )

            return response

# Custom instrumentation

def track_workflow_execution(workflow_id: str, execution_time: float):
    """Track workflow execution performance."""
    elasticapm.tag(
        workflow_id=workflow_id,
        execution_time=execution_time
    )



# Custom metric

    elasticapm.capture_message(
        f"Workflow {workflow_id} executed in {execution_time}ms",
        level='info'
    )

```

--

- #

# Backup and Disaster Recover

y

#

##

 1. Backup Strate

g

y

#

### Database Backu

p

```

bash

#!/bin/bas

h

# scripts/backup-database.

s

h

set -e

ENVIRONMENT=${1:-production}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

BACKUP_BUCKET="auterity-backups-${ENVIRONMENT}"

RETENTION_DAYS=30

echo "🗄️  Starting database backup for $ENVIRONMENT..."

# Get database connection details

DB_HOST=$(aws ssm get-parameter --name "/auterity/$ENVIRONMENT/db/host" --query "Parameter.Value" --output text)

DB_NAME=$(aws ssm get-parameter --name "/auterity/$ENVIRONMENT/db/name" --query "Parameter.Value" --output text)

DB_USER=$(aws ssm get-parameter --name "/auterity/$ENVIRONMENT/db/user" --query "Parameter.Value" --output text)

DB_PASSWORD=$(aws ssm get-parameter --name "/auterity/$ENVIRONMENT/db/password" --with-decryption --query "Parameter.Value" --output text

)

# Create backup

BACKUP_FILE="auterity-db-${ENVIRONMENT}-${TIMESTAMP}.sql"

PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST

\
    -U $DB_USER

\
    -d $DB_NAME

\
    --verbose

\
    --no-owner

\
    --no-privileges

\
    --clean

\
    --if-exists \

    > $BACKUP_FILE

# Compress backup

gzip $BACKUP_FILE
BACKUP_FILE="${BACKUP_FILE}.gz"

# Upload to S3

aws s3 cp $BACKUP_FILE s3://$BACKUP_BUCKET/database/
echo "✅ Database backup uploaded to S3: s3://$BACKUP_BUCKET/database/$BACKUP_FILE"

# Create backup metadata

cat > backup-metadata.json << EOF

{
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "database": "$DB_NAME",
    "backup_file": "$BACKUP_FILE",
    "backup_size": "$(stat -c%s "$BACKUP_FILE")",

    "backup_type": "full"
}
EOF

aws s3 cp backup-metadata.json s3://$BACKUP_BUCKET/metadata/database-${TIMESTAMP}.jso

n

# Cleanup local files

rm $BACKUP_FILE backup-metadata.jso

n

# Cleanup old backups

echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
aws s3 ls s3://$BACKUP_BUCKET/database/ | while read -r line; do

    backup_date=$(echo $line | awk '{print $1 " " $2}')
    backup_file=$(echo $line | awk '{print $4}')

    if [[ $(date -d "$backup_date" +%s) -lt $(date -d "$RETENTION_DAYS days ago" +%s) ]]; then

        aws s3 rm s3://$BACKUP_BUCKET/database/$backup_file
        echo "Deleted old backup: $backup_file"
    fi
done

echo "🎉 Database backup completed successfully!"

```

#

### Application Data Backu

p

```

bash

#!/bin/bas

h

# scripts/backup-application-data.

s

h

set -e

ENVIRONMENT=${1:-production}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

BACKUP_BUCKET="auterity-backups-${ENVIRONMENT}

"

echo "📁 Starting application data backup for $ENVIRONMENT..."

# Backup configuration files

echo "Backing up configuration files..."
mkdir -p backup-temp/config

aws s3 sync s3://auterity-config-${ENVIRONMENT}/ backup-temp/config

/

# Backup user uploads

echo "Backing up user uploads..."
mkdir -p backup-temp/uploads

aws s3 sync s3://auterity-uploads-${ENVIRONMENT}/ backup-temp/uploads

/

# Backup logs (last 7 days)

echo "Backing up recent logs..."
mkdir -p backup-temp/logs

aws logs filter-log-events

\
    --log-group-name "/aws/ecs/auterity-${ENVIRONMENT}"

\
    --start-time $(date -d "7 days ago" +%s)000

\
    --output text > backup-temp/logs/application-logs.tx

t

# Create archive

tar -czf auterity-data-${ENVIRONMENT}-${TIMESTAMP}.tar.gz backup-temp

/

# Upload to S3

aws s3 cp auterity-data-${ENVIRONMENT}-${TIMESTAMP}.tar.gz s3://$BACKUP_BUCKET/application-data

/

# Cleanup

rm -rf backup-temp auterity-data-${ENVIRONMENT}-${TIMESTAMP}.tar.g

z

echo "✅ Application data backup completed!"

```

#

##

 2. Disaster Recovery Pl

a

n

#

### Recovery Procedure

s

```

bash

#!/bin/bas

h

# scripts/disaster-recovery.

s

h

set -e

ENVIRONMENT=${1:-production}

BACKUP_DATE=${2:-latest}

RECOVERY_REGION=${3:-us-east-1

}

echo "🚨 Starting disaster recovery for $ENVIRONMENT..."
echo "📅 Backup date: $BACKUP_DATE"
echo "🌍 Recovery region: $RECOVERY_REGION"

#

 1. Create new infrastructure in recovery regio

n

echo "🏗️  Creating recovery infrastructure..."
cd infrastructure/terraform

# Switch to recovery workspace

terraform workspace select recovery-$ENVIRONMENT || terraform workspace new recovery-$ENVIRONMEN

T

# Deploy infrastructure

terraform init
terraform plan -var="region=$RECOVERY_REGION" -var="environment=recovery-$ENVIRONMENT"

terraform apply -auto-approve -var="region=$RECOVERY_REGION" -var="environment=recovery-$ENVIRONMENT

"

#

 2. Restore databas

e

echo "🗄️  Restoring database..."
BACKUP_BUCKET="auterity-backups-${ENVIRONMENT}

"

if [ "$BACKUP_DATE" = "latest" ]; then
    BACKUP_FILE=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | sort | tail -n 1 | awk '{print $4}')

else
    BACKUP_FILE=$(aws s3 ls s3://$BACKUP_BUCKET/database/ | grep $BACKUP_DATE | awk '{print $4}')
fi

if [ -z "$BACKUP_FILE" ]; then

    echo "❌ No backup file found for date: $BACKUP_DATE"
    exit 1
fi

# Download and restore backup

aws s3 cp s3://$BACKUP_BUCKET/database/$BACKUP_FILE ./
gunzip $BACKUP_FILE
BACKUP_FILE=${BACKUP_FILE%.gz}

# Get recovery database details

RECOVERY_DB_HOST=$(terraform output -raw database_endpoint)

RECOVERY_DB_NAME=$(terraform output -raw database_name)

RECOVERY_DB_USER=$(terraform output -raw database_username)

RECOVERY_DB_PASSWORD=$(terraform output -raw database_password

)

# Restore database

PGPASSWORD=$RECOVERY_DB_PASSWORD psql \
    -h $RECOVERY_DB_HOST

\
    -U $RECOVERY_DB_USER

\
    -d $RECOVERY_DB_NAME

\
    -f $BACKUP_FIL

E

echo "✅ Database restored successfully"

#

 3. Deploy applicatio

n

echo "🚀 Deploying application to recovery environment..."
export AWS_DEFAULT_REGION=$RECOVERY_REGION
export ENVIRONMENT="recovery-$ENVIRONMENT

"

# Update ECS services to use recovery infrastructure

aws ecs update-service

\
    --cluster auterity-cluster-recovery-$ENVIRONMENT

\
    --service auterity-service-recovery-$ENVIRONMENT

\
    --desired-count 2

\
    --region $RECOVERY_REGIO

N

#

 4. Restore application dat

a

echo "📁 Restoring application data..."
if [ "$BACKUP_DATE" = "latest" ]; then
    DATA_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/application-data/ | sort | tail -n 1 | awk '{print $4}')

else
    DATA_BACKUP=$(aws s3 ls s3://$BACKUP_BUCKET/application-data/ | grep $BACKUP_DATE | awk '{print $4}')

fi

if [ -n "$DATA_BACKUP" ]; then

    aws s3 cp s3://$BACKUP_BUCKET/application-data/$DATA_BACKUP ./

    tar -xzf $DATA_BACKU

P



# Restore to recovery buckets

    aws s3 sync backup-temp/config/ s3://auterity-config-recovery-${ENVIRONMENT}/

    aws s3 sync backup-temp/uploads/ s3://auterity-uploads-recovery-${ENVIRONMENT}

/

    rm -rf backup-temp $DATA_BACKUP

fi

#

 5. Run health check

s

echo "🏥 Running health checks..."
RECOVERY_ALB_DNS=$(terraform output -raw load_balancer_dns

)

for i in {1..10}; do

    if curl -f http://$RECOVERY_ALB_DNS/api/health; then

        echo "✅ Recovery environment is healthy!"
        break
    fi
    if [ $i -eq 10 ]; then

        echo "❌ Recovery environment health check failed"
        exit 1
    fi
    sleep 30
done

#

 6. Update DNS (manual step

)

echo "🌐 Manual step required: Update DNS to point to recovery environment"
echo "Recovery Load Balancer DNS: $RECOVERY_ALB_DNS"

echo "🎉 Disaster recovery completed successfully!"
echo "📊 Recovery environment is running in region: $RECOVERY_REGION"

```

--

- #

# Troubleshooting Guid

e

#

##

 1. Common Issues and Solutio

n

s

#

### Application Won't Star

t

```

bash

# Problem: Application container fails to star

t

# Solution: Check environment variables and dependencie

s

#

 1. Check container log

s

docker logs <container_id>

#

 2. Verify environment variable

s

docker exec <container_id> env | grep -E "(DATABASE_URL|REDIS_URL|JWT_SECRET)

"

#

 3. Test database connectivit

y

docker exec <container_id> python -c "

import os
import psycopg2
conn = psycopg2.connect(os.environ['DATABASE_URL'])

print('Database connection successful')
conn.close()
"

#

 4. Check if migrations are neede

d

docker exec <container_id> python -m alembic current

docker exec <container_id> python -m alembic head

s

```

#

### Database Connection Issue

s

```

sql
- - Problem: Database connection timeouts or failure

s
- - Solution: Check connection pool and database statu

s

- -

 1. Check active connections

SELECT
    count(*) as total_connections,

    count(*) FILTER (WHERE state = 'active') as active_connections,

    count(*) FILTER (WHERE state = 'idle') as idle_connections

FROM pg_stat_activity;

- -

 2. Check for long-running querie

s

SELECT
    pid,
    now()

 - pg_stat_activity.query_start AS duration,

    query,
    state
FROM pg_stat_activity
WHERE (now()

 - pg_stat_activity.query_start) > interval '5 minutes'

ORDER BY duration DESC;

- -

 3. Check database locks

SELECT
    blocked_locks.pid     AS blocked_pid,
    blocked_activity.usename  AS blocked_user,
    blocking_locks.pid     AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query    AS blocked_statement,
    blocking_activity.query   AS current_statement_in_blocking_process
FROM  pg_catalog.pg_locks         blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks         blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

```

#

### Performance Issue

s

```

python

# Performance troubleshooting scrip

t

# scripts/performance_diagnostics.p

y

import psutil
import redis
import time
import requests
from sqlalchemy import create_engine, text
import os

class PerformanceDiagnostics:
    def __init__(self):
        self.redis_client = redis.from_url(os.environ['REDIS_URL'])
        self.db_engine = create_engine(os.environ['DATABASE_URL'])

    def check_system_resources(self):
        """Check system resource usage."""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "cpu_usage": cpu_percent,
            "memory_usage": memory.percent,
            "memory_available": memory.available / (1024**3),



# GB

            "disk_usage": disk.percent,
            "disk_free": disk.free / (1024**3)



# GB

        }

    def check_database_performance(self):
        """Check database performance metrics."""
        with self.db_engine.connect() as conn:


# Check slow queries

            slow_queries = conn.execute(text("""
                SELECT query, mean_time, calls, total_time
                FROM pg_stat_statements
                WHERE mean_time > 100  -

- queries taking more than 100ms

                ORDER BY mean_time DESC
                LIMIT 10
            """)).fetchall()



# Check cache hit ratio

            cache_hit_ratio = conn.execute(text("""
                SELECT
                    sum(heap_blks_hit) / (sum(heap_blks_hit)

 + sum(heap_blks_read)) as ratio

                FROM pg_statio_user_tables
            """)).scalar()



# Check table sizes

            table_sizes = conn.execute(text("""
                SELECT
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 10
            """)).fetchall()

            return {
                "slow_queries": [dict(row) for row in slow_queries],
                "cache_hit_ratio": float(cache_hit_ratio or 0),
                "largest_tables": [dict(row) for row in table_sizes]
            }

    def check_redis_performance(self):
        """Check Redis performance metrics."""
        info = self.redis_client.info()

        return {
            "memory_usage": info['used_memory_human'],
            "memory_peak": info['used_memory_peak_human'],
            "connected_clients": info['connected_clients'],
            "total_commands_processed": info['total_commands_processed'],
            "keyspace_hits": info['keyspace_hits'],
            "keyspace_misses": info['keyspace_misses'],
            "hit_rate": info['keyspace_hits'] / (info['keyspace_hits']

 + info['keyspace_misses']) if (info['keyspace_hits'

]

 + info['keyspace_misses']) > 0 else 0

        }

    def check_api_response_times(self):
        """Check API response times."""
        endpoints = [
            "/api/health",
            "/api/workflows",
            "/api/users/me"
        ]

        base_url = os.environ.get('API_BASE_URL', 'http://localhost:8000')
        results = {}

        for endpoint in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
                response_time = (time.time()

 - start_time

)

 * 100

0

                results[endpoint] = {
                    "response_time_ms": round(response_time, 2),
                    "status_code": response.status_code,
                    "success": response.status_code < 400
                }
            except Exception as e:
                results[endpoint] = {
                    "error": str(e),
                    "success": False
                }

        return results

    def generate_report(self):
        """Generate comprehensive performance report."""
        report = {
            "timestamp": time.time(),
            "system_resources": self.check_system_resources(),
            "database_performance": self.check_database_performance(),
            "redis_performance": self.check_redis_performance(),
            "api_response_times": self.check_api_response_times()
        }



# Generate recommendations

        recommendations = []

        if report["system_resources"]["cpu_usage"] > 80:
            recommendations.append("High CPU usage detected. Consider scaling up or optimizing application code.")

        if report["system_resources"]["memory_usage"] > 90:
            recommendations.append("High memory usage detected. Check for memory leaks or scale up instance.")

        if report["database_performance"]["cache_hit_ratio"] < 0.95:

            recommendations.append("Low database cache hit ratio. Consider increasing shared_buffers or reviewing queries.")

        if report["redis_performance"]["hit_rate"] < 0.8:

            recommendations.append("Low Redis hit rate. Review caching strategy.")

        report["recommendations"] = recommendations

        return report

if __name__ == "__main__":
    diagnostics = PerformanceDiagnostics()
    report = diagnostics.generate_report()

    print("📊 Performance Diagnostic Report")
    print("="

 * 50)

    print(f"System CPU Usage: {report['system_resources']['cpu_usage']}%")
    print(f"System Memory Usage: {report['system_resources']['memory_usage']}%")
    print(f"Database Cache Hit Ratio: {report['database_performance']['cache_hit_ratio']:.2%}")
    print(f"Redis Hit Rate: {report['redis_performance']['hit_rate']:.2%}")

    if report["recommendations"]:
        print("\n🔧 Recommendations:")
        for rec in report["recommendations"]:
            print(f"  • {rec}")

```

#

##

 2. Emergency Procedur

e

s

#

### Service Restart Procedur

e

```

bash

#!/bin/bas

h

# scripts/emergency-restart.

s

h

ENVIRONMENT=${1:-production}

COMPONENT=${2:-all}



# Options: frontend, backend, database, redis, al

l

echo "🚨 Emergency restart procedure for $ENVIRONMENT..."
echo "Component: $COMPONENT"

case $COMPONENT in
    "frontend"|"all")
        echo "🔄 Restarting frontend service..."
        aws ecs update-service

\
            --cluster auterity-cluster-$ENVIRONMENT

\
            --service auterity-frontend-$ENVIRONMENT

\
            --force-new-deployment

\
            --region us-west-2

        ;;
esac

case $COMPONENT in
    "backend"|"all")
        echo "🔄 Restarting backend service..."
        aws ecs update-service

\
            --cluster auterity-cluster-$ENVIRONMENT

\
            --service auterity-backend-$ENVIRONMENT

\
            --force-new-deployment

\
            --region us-west-2

        ;;
esac

case $COMPONENT in
    "redis"|"all")
        echo "🔄 Restarting Redis cluster..."
        aws elasticache reboot-cache-cluster

\
            --cache-cluster-id auterity-redis-$ENVIRONMENT

\
            --cache-node-ids-to-reboot 0001

\
            --region us-west-2

        ;;
esac

echo "✅ Emergency restart completed for $COMPONENT"

```

--

- This comprehensive deployment and operations guide provides the foundation for successfully deploying, monitoring, and maintaining the Auterity Unified Platform across different environments.
