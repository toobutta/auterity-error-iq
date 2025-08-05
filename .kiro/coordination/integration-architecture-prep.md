# Integration Architecture Preparation

**Role**: KIRO Architecture Coordination  
**Phase**: Pre-Integration Planning  
**Timeline**: Parallel to Amazon Q/Cline execution  

## UNIFIED PLATFORM ARCHITECTURE

### System Integration Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ AutoMatrix  │    │ RelayCore   │    │ NeuroWeaver │     │
│  │ (Workflows) │◄──►│ (AI Router) │◄──►│ (ML Train)  │     │
│  │             │    │             │    │             │     │
│  │ Port: 3000  │    │ Port: 3001  │    │ Port: 3002  │     │
│  │ Port: 8000  │    │ Port: 8001  │    │ Port: 8002  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Shared Infrastructure                  │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ PostgreSQL  │  │    Redis    │  │   Nginx     │ │   │
│  │  │ (Database)  │  │  (Cache)    │  │ (Gateway)   │ │   │
│  │  │ Port: 5432  │  │ Port: 6379  │  │ Port: 80/443│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Monitoring Stack                       │   │
│  │                                                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Prometheus  │  │   Grafana   │  │ AlertMgr    │ │   │
│  │  │ (Metrics)   │  │ (Dashboard) │  │ (Alerts)    │ │   │
│  │  │ Port: 9090  │  │ Port: 3003  │  │ Port: 9093  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### API Gateway Configuration
```nginx
# nginx/unified-gateway.conf
upstream autmatrix_backend {
    server autmatrix-backend:8000;
}

upstream relaycore_backend {
    server relaycore:8001;
}

upstream neuroweaver_backend {
    server neuroweaver-backend:8002;
}

server {
    listen 80;
    server_name localhost;

    # AutoMatrix Routes
    location /api/workflows/ {
        proxy_pass http://autmatrix_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # RelayCore Routes
    location /api/ai/ {
        proxy_pass http://relaycore_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # NeuroWeaver Routes
    location /api/models/ {
        proxy_pass http://neuroweaver_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend Routes
    location / {
        proxy_pass http://autmatrix-frontend:3000;
        proxy_set_header Host $host;
    }

    # WebSocket Support
    location /ws/ {
        proxy_pass http://autmatrix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## UNIFIED AUTHENTICATION SYSTEM

### JWT Token Strategy
```typescript
// shared/auth/unified-auth.ts
interface UnifiedAuthToken {
  // Standard JWT claims
  sub: string;           // User ID
  iat: number;          // Issued at
  exp: number;          // Expires at
  
  // Custom claims for cross-system access
  systems: SystemAccess[];
  roles: UserRole[];
  permissions: Permission[];
}

interface SystemAccess {
  system: 'autmatrix' | 'relaycore' | 'neuroweaver';
  level: 'read' | 'write' | 'admin';
  resources: string[];   // Specific resource access
}

interface UserRole {
  name: string;
  system: string;
  permissions: string[];
}

// Unified authentication service
export class UnifiedAuthService {
  async validateToken(token: string): Promise<UnifiedAuthToken | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UnifiedAuthToken;
      
      // Validate token hasn't been revoked
      const isRevoked = await this.redis.get(`revoked:${decoded.sub}:${decoded.iat}`);
      if (isRevoked) return null;
      
      return decoded;
    } catch (error) {
      return null;
    }
  }
  
  async hasSystemAccess(
    token: UnifiedAuthToken, 
    system: string, 
    level: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    const systemAccess = token.systems.find(s => s.system === system);
    if (!systemAccess) return false;
    
    const levels = ['read', 'write', 'admin'];
    const requiredIndex = levels.indexOf(level);
    const userIndex = levels.indexOf(systemAccess.level);
    
    return userIndex >= requiredIndex;
  }
}
```

### Cross-System Middleware
```python
# backend/app/middleware/unified_auth.py
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import redis.asyncio as redis

class UnifiedAuthMiddleware:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.security = HTTPBearer()
    
    async def verify_system_access(
        self, 
        request: Request, 
        required_system: str,
        required_level: str = "read"
    ):
        """Verify user has access to specific system."""
        try:
            credentials: HTTPAuthorizationCredentials = await self.security(request)
            token = credentials.credentials
            
            # Decode and validate JWT
            payload = jwt.decode(
                token, 
                os.getenv("JWT_SECRET"), 
                algorithms=["HS256"]
            )
            
            # Check system access
            systems = payload.get("systems", [])
            system_access = next(
                (s for s in systems if s["system"] == required_system), 
                None
            )
            
            if not system_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No access to {required_system} system"
                )
            
            # Check access level
            levels = ["read", "write", "admin"]
            required_index = levels.index(required_level)
            user_index = levels.index(system_access["level"])
            
            if user_index < required_index:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient access level for {required_system}"
                )
            
            return payload
            
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
```

## UNIFIED DATABASE SCHEMA

### Cross-System Data Model
```sql
-- scripts/unified-schema.sql

-- Users table (shared across all systems)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System access control
CREATE TABLE user_system_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    system_name VARCHAR(50) NOT NULL, -- 'autmatrix', 'relaycore', 'neuroweaver'
    access_level VARCHAR(20) NOT NULL, -- 'read', 'write', 'admin'
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    UNIQUE(user_id, system_name)
);

-- AutoMatrix workflows (existing)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) NOT NULL,
    definition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RelayCore AI providers and routing
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'local'
    endpoint_url VARCHAR(500),
    api_key_encrypted TEXT,
    is_active BOOLEAN DEFAULT true,
    cost_per_token DECIMAL(10, 8),
    rate_limit_rpm INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NeuroWeaver models and training
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    training_data_path TEXT,
    model_path TEXT,
    performance_metrics JSONB,
    is_deployed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, version)
);

-- Cross-system execution tracking
CREATE TABLE unified_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_type VARCHAR(50) NOT NULL, -- 'workflow', 'ai_request', 'model_training'
    source_system VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL, -- ID in source system
    user_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB
);

-- Unified error correlation
CREATE TABLE error_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_pattern VARCHAR(100) NOT NULL,
    root_cause TEXT NOT NULL,
    affected_systems TEXT[] NOT NULL,
    error_ids TEXT[] NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    recovery_actions TEXT[]
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_active ON workflows(is_active) WHERE is_active = true;
CREATE INDEX idx_executions_user_system ON unified_executions(user_id, source_system);
CREATE INDEX idx_executions_status ON unified_executions(status);
CREATE INDEX idx_error_correlations_created ON error_correlations(created_at);
```

## MONITORING AND OBSERVABILITY

### Unified Metrics Collection
```yaml
# monitoring/prometheus/unified-config.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  # AutoMatrix Backend
  - job_name: 'autmatrix-backend'
    static_configs:
      - targets: ['autmatrix-backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # RelayCore Service
  - job_name: 'relaycore'
    static_configs:
      - targets: ['relaycore:8001']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # NeuroWeaver Backend
  - job_name: 'neuroweaver-backend'
    static_configs:
      - targets: ['neuroweaver-backend:8002']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Database Monitoring
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis Monitoring
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx Gateway
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

alertmanager:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Cross-System Alert Rules
```yaml
# monitoring/prometheus/alert_rules.yml
groups:
  - name: unified-platform-alerts
    rules:
      # System Health
      - alert: SystemDown
        expr: up{job=~"autmatrix-backend|relaycore|neuroweaver-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "System {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"

      # Cross-System Performance
      - alert: HighCrossSystemLatency
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket{job=~"autmatrix-backend|relaycore|neuroweaver-backend"}[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected across systems"
          description: "95th percentile latency is {{ $value }}s"

      # Error Correlation
      - alert: ErrorCorrelationDetected
        expr: increase(error_correlations_total[5m]) > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Cross-system error correlation detected"
          description: "{{ $value }} error correlations detected in the last 5 minutes"

      # Authentication Issues
      - alert: AuthenticationFailureSpike
        expr: |
          rate(http_requests_total{status="401"}[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High authentication failure rate"
          description: "Authentication failure rate is {{ $value }} per second"

      # Database Performance
      - alert: DatabaseConnectionExhaustion
        expr: |
          (
            postgres_stat_database_numbackends / 
            postgres_settings_max_connections
          ) > 0.8
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use"
```

## DEPLOYMENT ORCHESTRATION

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # API Gateway
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/unified-gateway.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - autmatrix-backend
      - relaycore
      - neuroweaver-backend
    restart: unless-stopped

  # AutoMatrix System
  autmatrix-frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=http://nginx
    restart: unless-stopped

  autmatrix-backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/unified_platform
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # RelayCore System
  relaycore:
    build: 
      context: ./systems/relaycore
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/unified_platform
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # NeuroWeaver System
  neuroweaver-frontend:
    build: 
      context: ./systems/neuroweaver/frontend
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  neuroweaver-backend:
    build: 
      context: ./systems/neuroweaver/backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/unified_platform
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Shared Infrastructure
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=unified_platform
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/unified-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Monitoring Stack
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/unified-config.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager:/etc/alertmanager
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

This integration architecture preparation ensures that when Amazon Q and Cline complete their tasks, we have a comprehensive framework ready for seamless system integration and production deployment.