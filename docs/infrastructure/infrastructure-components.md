# Auterity Unified Infrastructure Components

## Overview

This document provides a detailed description of the infrastructure components that make up the Auterity Unified platform. It serves as a reference for understanding the current infrastructure and the recommended improvements.

## Core Infrastructure Components

### 1. Compute Resources

#### 1.1 Amazon EKS (Kubernetes)

**Current Configuration**:

- Cluster Name: neuroweaver-dev
- Kubernetes Version: 1.27
- Node Types: t3.medium
- Node Count: 1-3 nodes (auto-scaling)
- Single Availability Zone deployment

**Recommended Configuration**:

```terraform
module "eks" {
  source = "../modules/eks"

  environment     = "production"
  cluster_name    = "auterity-prod"
  kubernetes_version = "1.28"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_types  = ["m5.large", "m5a.large", "m5n.large"]
  min_size        = 3
  max_size        = 10
  desired_size    = 3
  capacity_type   = "ON_DEMAND"  # Use ON_DEMAND for production critical workloads

  # Enable multi-AZ deployment
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

  # Enable cluster autoscaler
  cluster_autoscaler_enabled = true
}
```

#### 1.2 Docker Containers

**Current Configuration**:

- Docker Compose for local development
- Containerized services with basic health checks
- Limited resource constraints

**Recommended Configuration**:

```yaml
# Example production container configuration
services:
  backend:
    image: ${ECR_REPOSITORY}/autmatrix-backend:${VERSION}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: "1.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      update_config:
        order: start-first
        failure_action: rollback
        delay: 10s
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
```

### 2. Storage Resources

#### 2.1 Amazon RDS (PostgreSQL)

**Current Configuration**:

- PostgreSQL 15 in Docker container
- Single instance without replication
- Basic volume persistence

**Recommended Configuration**:

```terraform
module "rds" {
  source = "../modules/rds"

  environment     = "production"
  identifier      = "auterity-prod"
  engine          = "postgres"
  engine_version  = "15.4"
  instance_class  = "db.t3.large"
  allocated_storage = 100

  # High availability configuration
  multi_az        = true
  backup_retention_period = 7
  backup_window   = "03:00-04:00"
  maintenance_window = "sun:04:30-sun:05:30"

  # Security configuration
  storage_encrypted = true
  deletion_protection = true

  # Network configuration
  subnet_ids      = module.vpc.database_subnet_ids
  vpc_security_group_ids = [aws_security_group.rds.id]
}
```

#### 2.2 Amazon S3

**Current Configuration**:

- Limited use of S3 for storage
- No lifecycle policies or versioning

**Recommended Configuration**:

```terraform
module "s3" {
  source = "../modules/s3"

  environment = "production"
  bucket_name = "auterity-prod-data"

  # Enable versioning
  versioning_enabled = true

  # Configure lifecycle policies
  lifecycle_rules = [
    {
      id      = "archive-old-data"
      enabled = true

      transition = [
        {
          days          = 30
          storage_class = "STANDARD_IA"
        },
        {
          days          = 90
          storage_class = "GLACIER"
        }
      ]

      expiration = {
        days = 365
      }
    }
  ]

  # Server-side encryption
  encryption_enabled = true

  # Access logging
  logging_enabled = true
  logging_target_bucket = "auterity-prod-logs"
  logging_target_prefix = "s3-access-logs/"
}
```

#### 2.3 Redis

**Current Configuration**:

- Redis 7 in Docker container
- Single instance without replication
- Basic volume persistence

**Recommended Configuration**:

```terraform
module "elasticache" {
  source = "../modules/elasticache"

  environment     = "production"
  cluster_id      = "auterity-prod"
  engine          = "redis"
  engine_version  = "7.0"
  node_type       = "cache.t3.medium"

  # High availability configuration
  num_cache_nodes = 2
  automatic_failover_enabled = true
  multi_az_enabled = true

  # Performance configuration
  parameter_group_name = "default.redis7"

  # Network configuration
  subnet_group_name = aws_elasticache_subnet_group.redis.name
  security_group_ids = [aws_security_group.redis.id]
}
```

### 3. Networking Resources

#### 3.1 Amazon VPC

**Current Configuration**:

- Basic VPC with public and private subnets
- Limited network segmentation
- Basic security groups

**Recommended Configuration**:

```terraform
module "vpc" {
  source = "../modules/vpc"

  environment = "production"
  vpc_cidr    = "10.0.0.0/16"

  # Multi-AZ configuration
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]

  # Subnet configuration
  public_subnets   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  # NAT Gateway configuration
  enable_nat_gateway = true
  single_nat_gateway = false
  one_nat_gateway_per_az = true

  # VPC Flow Logs
  enable_flow_log = true
  flow_log_destination_type = "s3"
  flow_log_destination_arn = module.s3.flow_logs_bucket_arn
}
```

#### 3.2 Network Security

**Current Configuration**:

- Basic security groups
- No WAF or network policies
- Limited network monitoring

**Recommended Configuration**:

```terraform
# Security Groups
resource "aws_security_group" "api" {
  name        = "api-sg"
  description = "Security group for API servers"
  vpc_id      = module.vpc.vpc_id

  # Restrict inbound traffic
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  ingress {
    from_port   = 8000
    to_port     = 8001
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
    description = "API access from ALB only"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# WAF Configuration
resource "aws_wafv2_web_acl" "api_protection" {
  name        = "api-protection"
  description = "WAF rules for API protection"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
  rule {
    name     = "SQLInjectionRule"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLInjectionRule"
      sampled_requests_enabled   = true
    }
  }
}
```

### 4. Authentication and Authorization

#### 4.1 Amazon Cognito

**Current Configuration**:

- Basic Cognito user pool
- Limited MFA configuration
- Basic password policies

**Recommended Configuration**:

```yaml
# CloudFormation template for Cognito
Resources:
  CognitoUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: auterity-production
      AdminCreateUserConfig:
        AllowAdminCreateUserOnly: true
      AutoVerifiedAttributes:
        - email
      MfaConfiguration: OPTIONAL
      EnabledMfas:
        - SOFTWARE_TOKEN_MFA
      AccountRecoverySetting:
        RecoveryMechanisms:
          - Name: verified_email
            Priority: 1
      Policies:
        PasswordPolicy:
          MinimumLength: 12
          RequireUppercase: true
          RequireLowercase: true
          RequireNumbers: true
          RequireSymbols: true
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
          Mutable: true
        - Name: given_name
          AttributeDataType: String
          Required: true
        - Name: family_name
          AttributeDataType: String
          Required: true
        - Name: department
          AttributeDataType: String
          Required: false
          Mutable: true
        - Name: role
          AttributeDataType: String
          Required: false
          Mutable: true
      UserPoolAddOns:
        AdvancedSecurityMode: ENFORCED
```

### 5. Monitoring and Observability

#### 5.1 Prometheus and Grafana

**Current Configuration**:

- Basic Prometheus setup
- Limited alert rules
- Basic Grafana dashboards

**Recommended Configuration**:

```yaml
# Enhanced Prometheus alert rules
groups:
  - name: system_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 1% for {{ $labels.job }} (current value: {{ $value }})"
          dashboard: "https://grafana.example.com/d/abc123/service-overview"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"

      - alert: APILatencyHigh
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler!="metrics"}[5m])) by (le, handler)) > 0.5
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "API latency high"
          description: "95th percentile latency for {{ $labels.handler }} is above 500ms (current value: {{ $value }}s)"
          dashboard: "https://grafana.example.com/d/abc123/service-overview"
          runbook: "https://wiki.example.com/runbooks/high-latency"
```

#### 5.2 Distributed Tracing

**Current Configuration**:

- Basic Jaeger setup
- Limited tracing instrumentation

**Recommended Configuration**:

```yaml
# OpenTelemetry Collector configuration
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024

  memory_limiter:
    check_interval: 1s
    limit_mib: 1000

  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
      - key: service.namespace
        value: auterity
        action: upsert

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  prometheus:
    endpoint: 0.0.0.0:8889

  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    format: json

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [jaeger]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [loki]
```

## Service-Specific Components

### 1. AutoMatrix (Core Workflow Engine)

**Current Configuration**:

- FastAPI backend with basic scaling
- React frontend with Vite
- Basic database integration

**Recommended Configuration**:

```yaml
# Kubernetes deployment for AutoMatrix backend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: autmatrix-backend
  labels:
    app: autmatrix-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: autmatrix-backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: autmatrix-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "8000"
    spec:
      containers:
        - name: backend
          image: ${ECR_REPOSITORY}/autmatrix-backend:${VERSION}
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: autmatrix-db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: autmatrix-redis-credentials
                  key: url
          resources:
            limits:
              cpu: "1"
              memory: "2Gi"
            requests:
              cpu: "500m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 60
```

### 2. RelayCore (AI Routing Hub)

**Current Configuration**:

- Node.js backend with Express
- Basic cost optimization
- Limited model steering

**Recommended Configuration**:

```yaml
# Kubernetes deployment for RelayCore
apiVersion: apps/v1
kind: Deployment
metadata:
  name: relaycore
  labels:
    app: relaycore
spec:
  replicas: 3
  selector:
    matchLabels:
      app: relaycore
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: relaycore
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "3001"
    spec:
      containers:
        - name: relaycore
          image: ${ECR_REPOSITORY}/relaycore:${VERSION}
          ports:
            - containerPort: 3001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: relaycore-db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: relaycore-redis-credentials
                  key: url
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: relaycore-api-keys
                  key: OPENAI_API_KEY
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: relaycore-api-keys
                  key: ANTHROPIC_API_KEY
          resources:
            limits:
              cpu: "1"
              memory: "2Gi"
            requests:
              cpu: "500m"
              memory: "1Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 10
            periodSeconds: 30
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 60
```

### 3. NeuroWeaver (Model Specialization)

**Current Configuration**:

- FastAPI backend
- Next.js frontend
- Basic model storage

**Recommended Configuration**:

```yaml
# Kubernetes deployment for NeuroWeaver backend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neuroweaver-backend
  labels:
    app: neuroweaver-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: neuroweaver-backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: neuroweaver-backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/metrics"
        prometheus.io/port: "8001"
    spec:
      containers:
        - name: backend
          image: ${ECR_REPOSITORY}/neuroweaver-backend:${VERSION}
          ports:
            - containerPort: 8001
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: neuroweaver-db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: neuroweaver-redis-credentials
                  key: url
            - name: MODEL_STORAGE_PATH
              value: "/app/models"
          volumeMounts:
            - name: models-volume
              mountPath: /app/models
          resources:
            limits:
              cpu: "2"
              memory: "4Gi"
            requests:
              cpu: "1"
              memory: "2Gi"
          readinessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 10
            periodSeconds: 30
          livenessProbe:
            httpGet:
              path: /health
              port: 8001
            initialDelaySeconds: 30
            periodSeconds: 60
      volumes:
        - name: models-volume
          persistentVolumeClaim:
            claimName: neuroweaver-models-pvc
```

## Conclusion

This document provides a detailed overview of the infrastructure components that make up the Auterity Unified platform. The recommended configurations represent best practices for security, reliability, scalability, and cost optimization.

Implementing these recommendations will significantly improve the platform's infrastructure, making it more secure, reliable, and cost-efficient. The configurations are designed to be modular and adaptable, allowing for incremental improvements and future expansion.
