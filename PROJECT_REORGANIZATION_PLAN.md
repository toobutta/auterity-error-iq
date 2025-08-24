# PROJECT REORGANIZATION - CRITICAL RESTRUCTURE

## MAJOR ISSUES IDENTIFIED:

### 1. **SCATTERED DOCUMENTATION** - 200+ markdown files with duplicate/conflicting info
### 2. **HIDDEN SERVICES** - Production-ready services buried in backend/app/services/
### 3. **INCONSISTENT STRUCTURE** - Multiple docker-compose files, scattered configs
### 4. **MISSING SERVICE REGISTRY** - No central service discovery/documentation

## IMMEDIATE RESTRUCTURE PLAN:

### Phase 1: Service Consolidation
```
services/
├── core/                    # Core platform services
│   ├── auth/               # Authentication & authorization
│   ├── database/           # Database management
│   ├── cache/              # Redis caching
│   └── queue/              # Celery task queue
├── communication/          # All communication services
│   ├── twilio/             # SMS/Voice
│   ├── whatsapp/           # WhatsApp Business
│   ├── email/              # Email service
│   └── notifications/      # Multi-channel notifications
├── automation/             # Automation services
│   ├── playwright/         # Browser automation
│   ├── puppeteer/          # Alternative browser automation
│   └── workflow/           # Workflow execution
├── ai/                     # AI/ML services
│   ├── vector/             # Vector databases
│   ├── llm/                # LLM providers
│   ├── mlflow/             # ML tracking
│   └── embeddings/         # Embedding generation
├── infrastructure/         # Infrastructure services
│   ├── monitoring/         # Prometheus/Grafana
│   ├── logging/            # Centralized logging
│   ├── security/           # Vault/secrets
│   └── gateway/            # Kong API gateway
└── integrations/           # External integrations
    ├── kafka/              # Event streaming
    ├── storage/            # File storage
    └── search/             # Search services
```

### Phase 2: Documentation Consolidation
```
docs/
├── README.md               # Single source of truth
├── services/               # Service documentation
│   ├── core.md
│   ├── communication.md
│   ├── automation.md
│   ├── ai.md
│   └── infrastructure.md
├── deployment/             # Deployment guides
│   ├── development.md
│   ├── staging.md
│   └── production.md
├── api/                    # API documentation
│   └── openapi.json
└── architecture/           # System architecture
    ├── overview.md
    └── diagrams/
```

### Phase 3: Configuration Unification
```
config/
├── environments/
│   ├── development.yml
│   ├── staging.yml
│   └── production.yml
├── services/
│   ├── core.yml
│   ├── communication.yml
│   ├── automation.yml
│   └── ai.yml
└── deployment/
    ├── docker-compose.yml  # Single compose file
    ├── kubernetes/
    └── terraform/
```

### Phase 4: Service Registry Implementation
```python
# services/registry.py
SERVICE_REGISTRY = {
    "core": {
        "auth": {"status": "production", "port": 8001},
        "database": {"status": "production", "port": 5432},
        "cache": {"status": "production", "port": 6379},
        "queue": {"status": "production", "port": 5672}
    },
    "communication": {
        "twilio": {"status": "production", "endpoints": ["/sms", "/voice"]},
        "whatsapp": {"status": "production", "endpoints": ["/message", "/webhook"]},
        "notifications": {"status": "production", "channels": ["email", "slack", "sms"]}
    },
    "automation": {
        "playwright": {"status": "production", "capabilities": ["scraping", "testing"]},
        "workflow": {"status": "production", "engines": ["celery", "temporal"]}
    },
    "ai": {
        "vector": {"status": "production", "providers": ["pinecone", "weaviate"]},
        "llm": {"status": "production", "providers": ["openai", "anthropic"]},
        "mlflow": {"status": "production", "tracking": True}
    }
}
```

## EXECUTION PRIORITY:

1. **IMMEDIATE**: Create service registry and status dashboard
2. **URGENT**: Consolidate all docker-compose files into single deployment
3. **HIGH**: Reorganize documentation into 5 core files
4. **MEDIUM**: Restructure service directories
5. **LOW**: Update all import paths and references

## SUCCESS METRICS:
- Single README.md with complete service overview
- One docker-compose.yml for all services
- Service registry with health checks
- Documentation reduced from 200+ to <20 files
- All services discoverable and documented