

# Deployment Guid

e

#

# Prerequisite

s

- Docker 24.

0

+ - Docker Compose 2.2

0

+ - 16GB RAM minimum (32GB recommended

)

- 50GB disk space minimu

m

- NVIDIA GPU (optional, for vLLM acceleration

)

#

# Architecture Overvie

w

The Auterity platform consists of 30

+ microservices organized into the following layers

:

#

## **Application Layer

* *

- Frontend (React/TypeScript

)

 - Port 300

0

- Workflow Studi

o

 - Port 300

1

- API Gateway (Kong

)

 - Port 800

0

- Main API Servic

e

 - Port 800

0

#

## **AI Services Layer

* *

- RelayCor

e

 - Port 800

1

- LangGraph Servic

e

 - Port 800

2

- CrewAI Servic

e

 - Port 800

3

- NeuroWeaver Platfor

m

 - Port 800

4

- MCP Orchestrato

r

 - Port 800

5

- n8n AI Enhancement

s

 - Port 800

6

- Integration Laye

r

 - Port 800

7

- vLLM Servic

e

 - Port 800

1

#

## **Data & Infrastructure Layer

* *

- PostgreSQ

L

 - Port 543

2

- Redi

s

 - Port 637

9

- RabbitM

Q

 - Port 5672, 1567

2

- Kafk

a

 + Zookeepe

r

 - Ports 9092, 218

1

- Weaviat

e

 - Port 808

0

- MLflo

w

 - Port 500

0

- Vaul

t

 - Port 820

0

#

## **Monitoring & Observability

* *

- Prometheu

s

 - Port 909

0

- Grafan

a

 - Port 300

0

- Jaege

r

 - Port 1668

6

- Lok

i

 - Port 310

0

- AlertManage

r

 - Port 909

3

- Node Exporte

r

 - Port 910

0

#

## **Development Tools

* *

- pgAdmi

n

 - Port 505

0

- MailHo

g

 - Ports 1025, 802

5

- Puppeteer (headless browser

)

#

# Quick Deplo

y

```bash
git clone https://github.com/toobutta/auterity-error-iq.git

cd auterity-error-iq

cp deployment/docker-compose.env .env

docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d

./scripts/init-all-services.s

h

```

#

# Environment Configuratio

n

#

## **Required Environment Variable

s

* *

```

bash

# AI Service API Keys

OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_AI_API_KEY=your_google_key
AZURE_AI_API_KEY=your_azure_key

# Database Configuration

POSTGRES_USER=auterity
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=auterity_db

# Redis Configuration

REDIS_PASSWORD=secure_redis_password

# RabbitMQ Configuration

RABBITMQ_DEFAULT_USER=auterity
RABBITMQ_DEFAULT_PASS=secure_rabbitmq_password

# Vault Configuration

VAULT_DEV_ROOT_TOKEN_ID=your_vault_token

# JWT Secret

JWT_SECRET=your_jwt_secret_key

# Service URLs

AUTERITY_FRONTEND_URL=http://localhost:3000
AUTERITY_API_URL=http://localhost:8000

```

#

## **GPU Configuration (for vLLM)

* *

```

bash

# Enable GPU support

VLLM_GPU_ENABLED=true
VLLM_GPU_MEMORY_UTILIZATION=0.9

CUDA_VISIBLE_DEVICES=0

```

#

# Service Deployment Orde

r

1. **Infrastructure Service

s

* * (Start first)



```

bash
   docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d postgres redis rabbitmq kafka zookeeper vault



```

2. **Monitoring Stac

k

* *


```

bash
   docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d prometheus grafana jaeger loki alertmanager node-exporter



```

3. **AI and ML Service

s

* *


```

bash
   docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d weaviate mlflow

   docker-compose -f infrastructure/docker/vllm/docker-compose.yml up -d

   docker-compose -f infrastructure/docker/langgraph/docker-compose.yml up -d

   docker-compose -f infrastructure/docker/crewai/docker-compose.yml up -d



```

4. **Application Service

s

* *


```

bash
   docker-compose -f infrastructure/docker/docker-compose.unified.yml up -d backend frontend workflow-studio kong celery-worker



```

5. **Integration Service

s

* *


```

bash
   docker-compose -f systems/integration/docker-compose.yml up -d



```

#

# Service Verificatio

n

#

## **Core Services Health Checks

* *

```

bash

# API Gateway

curl http://localhost:8000/health

# Main API

curl http://localhost:8000/api/health

# AI Services

curl http://localhost:8001/health

# RelayCore/vLLM

curl http://localhost:8002/health

# LangGraph

curl http://localhost:8003/health

# CrewAI

curl http://localhost:8004/health

# NeuroWeaver

curl http://localhost:8005/health

# MCP

curl http://localhost:8006/health

# n8n AI

curl http://localhost:8007/health

# Integration Laye

r

# Databases

curl http://localhost:5432/health

# PostgreSQL

curl http://localhost:6379/health

# Redi

s

# Monitoring

curl http://localhost:9090/health

# Prometheus

curl http://localhost:3000/health

# Grafana

```

#

## **Application Access

* *

- **Frontend**: http://localhost:300

0

- **Workflow Studio**: http://localhost:300

1

- **API Documentation**: http://localhost:8000/api/doc

s

- **Grafana**: http://localhost:3000 (admin/admin

)

- **pgAdmin**: http://localhost:505

0

- **MailHog**: http://localhost:802

5

#

# Production Consideration

s

#

## **Security

* *

- Use external managed databases (AWS RDS, Google Cloud SQL

)

- Configure SSL/TLS certificates for all service

s

- Implement secrets management with HashiCorp Vaul

t

- Set up network segmentation and firewall

s

- Enable authentication and authorization for all service

s

#

## **Scalability

* *

- Configure horizontal scaling for AI service

s

- Set up load balancers for high-traffic service

s

- Implement auto-scaling based on resource usag

e

- Use managed Kubernetes for production deployment

s

#

## **Monitoring & Observability

* *

- Set up comprehensive logging with Lok

i

- Configure alerting with AlertManage

r

- Implement distributed tracing with Jaege

r

- Monitor AI model performance and accurac

y

- Track API usage and response time

s

#

## **Backup & Recovery

* *

- Regular database backups (PostgreSQL, Redis

)

- AI model checkpoints and versionin

g

- Configuration backup

s

- Disaster recovery plannin

g

#

## **Performance Optimization

* *

- GPU acceleration for vLLM service

s

- Redis caching for frequently accessed dat

a

- Database query optimizatio

n

- CDN for static asset

s

- API response cachin

g

#

# Scalin

g

```

bash

# Scale Celery workers

docker-compose up -d --scale celery-worker=

3

# Scale backend instances

docker-compose up -d --scale backend=

2

```
