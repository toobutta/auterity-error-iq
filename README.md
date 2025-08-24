# Auterity - Unified AI Platform

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)](https://github.com/toobutta/auterity-error-iq)
[![All Services](https://img.shields.io/badge/Services-26%20Deployed-blue)](#services)

## 🚀 Complete Enterprise AI Platform

Auterity is a **production-ready AI platform** with 26 integrated services for enterprise workflow automation, AI routing, and intelligent operations.

## ⚡ Quick Start

```bash
# Clone and deploy complete platform
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq
cp .env.example .env
# Edit .env with your API keys
docker-compose -f docker-compose.unified.yml up -d
```

**Access Points:**
- **Application**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Admin Dashboard**: http://localhost:8001
- **Monitoring**: http://localhost:3001 (Grafana)
- **ML Tracking**: http://localhost:5000 (MLflow)

## 🏗️ Service Architecture

### **Core Services** (Production Ready)
- **Authentication**: JWT, OAuth2, SSO integration
- **Database**: PostgreSQL with clustering
- **Cache**: Redis with persistence  
- **Queue**: RabbitMQ + Celery workers

### **Communication Services** (Production Ready)
- **Twilio**: SMS, voice, campaigns, IVR
- **WhatsApp**: Business API, templates, interactive messages
- **Email**: SMTP integration with MailHog development server
- **Notifications**: Multi-channel (Email, Slack, SMS, WhatsApp, webhooks)

### **Automation Services** (Production Ready)
- **Playwright**: Web scraping, form automation, testing
- **Puppeteer**: Browser automation, PDF generation, screenshots
- **Workflow Engine**: Visual workflow builder with AI integration

### **AI/ML Services** (Production Ready)  
- **Vector Databases**: Pinecone, Weaviate integration
- **LLM Providers**: OpenAI, Anthropic, Azure OpenAI
- **MLflow**: Experiment tracking, model registry
- **Embeddings**: Automated text embedding generation

### **Infrastructure Services** (Production Ready)
- **API Gateway**: Kong with rate limiting, CORS
- **Load Balancer**: Nginx with SSL termination
- **Monitoring**: Prometheus, Grafana, Jaeger tracing, Alertmanager
- **Logging**: Loki centralized logging with Promtail collection
- **Secrets**: HashiCorp Vault integration
- **Event Streaming**: Apache Kafka with Zookeeper
- **Object Storage**: MinIO S3-compatible storage
- **System Monitoring**: Node, Redis, Postgres exporters

## 📊 Complete Service List (26 Services)

| Service | Type | Status | Port | Description |
|---------|------|--------|------|-------------|
| **kong** | Gateway | ✅ Production | 8000, 8001 | API Gateway & Admin |
| **nginx** | Load Balancer | ✅ Production | 80, 443 | Load Balancer & SSL |
| **backend** | API | ✅ Production | 8080 | FastAPI Backend |
| **frontend** | Web | ✅ Production | 3000 | React Frontend |
| **postgres** | Database | ✅ Production | 5432 | Primary Database |
| **redis** | Cache | ✅ Production | 6379 | Cache & Sessions |
| **rabbitmq** | Queue | ✅ Production | 5672, 15672 | Message Queue |
| **kafka** | Streaming | ✅ Production | 9092 | Event Streaming |
| **zookeeper** | Coordination | ✅ Production | 2181 | Kafka Dependency |
| **vault** | Secrets | ✅ Production | 8200 | Secrets Management |
| **mlflow** | ML | ✅ Production | 5000 | ML Experiment Tracking |
| **weaviate** | Vector DB | ✅ Production | 8081 | Vector Database |
| **puppeteer** | Automation | ✅ Production | 3000 | Browser Automation |
| **mailhog** | Email | ✅ Development | 1025, 8025 | SMTP Development |
| **celery-worker** | Workers | ✅ Production | - | Task Processing |
| **prometheus** | Metrics | ✅ Production | 9090 | Metrics Collection |
| **grafana** | Monitoring | ✅ Production | 3001 | Monitoring Dashboard |
| **alertmanager** | Alerts | ✅ Production | 9093 | Alert Management |
| **jaeger** | Tracing | ✅ Production | 16686 | Distributed Tracing |
| **loki** | Logging | ✅ Production | 3100 | Log Aggregation |
| **promtail** | Logs | ✅ Production | 9080 | Log Collection |
| **node-exporter** | Metrics | ✅ Production | 9100 | System Metrics |
| **redis-exporter** | Metrics | ✅ Production | 9121 | Redis Metrics |
| **postgres-exporter** | Metrics | ✅ Production | 9187 | Postgres Metrics |
| **minio** | Storage | ✅ Production | 9000, 9001 | Object Storage |

## 🔧 Configuration

### Environment Variables
```bash
# Core Services
POSTGRES_PASSWORD=your_secure_password
REDIS_URL=redis://redis:6379
RABBITMQ_PASSWORD=your_rabbitmq_password

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PINECONE_API_KEY=your_pinecone_key

# Communication Services
TWILIO_ACCOUNT_SID=your_twilio_sid
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token

# Infrastructure
VAULT_TOKEN=your_vault_token
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

### Service Health Checks
```bash
# Check all services
curl http://localhost:8001/status

# Individual service health
curl http://localhost:8080/api/health (Backend)
curl http://localhost:8081/v1/meta (Weaviate)
curl http://localhost:5000/health (MLflow)
curl http://localhost:8200/v1/sys/health (Vault)
```

## 🚀 Deployment Options

### **Development**
```bash
docker-compose -f docker-compose.unified.yml up -d
```

### **Production**
```bash
# With load balancing and clustering
docker-compose -f docker-compose.unified.yml -f docker-compose.production.yml up -d
```

### **Kubernetes**
```bash
kubectl apply -f kubernetes/
```

## 📈 Monitoring & Observability

- **Metrics**: Prometheus + Grafana dashboards
- **Tracing**: Jaeger distributed tracing
- **Logging**: Loki centralized logging
- **Health Checks**: Automated service monitoring
- **Alerts**: Multi-channel alerting system

## 🔒 Security Features

- **API Gateway**: Rate limiting, CORS, authentication
- **Secrets Management**: HashiCorp Vault integration
- **SSL/TLS**: End-to-end encryption
- **Input Validation**: SQL injection and XSS protection
- **Audit Logging**: Complete audit trail

## 🧪 Testing

```bash
# Run all tests
docker-compose exec backend python -m pytest

# Integration tests
python -m pytest tests/integration/

# Load testing
python -m pytest tests/load/

# Security testing
python -m pytest tests/security/
```

## 📚 API Documentation

- **OpenAPI Spec**: http://localhost:8080/docs
- **Service Registry**: http://localhost:8080/api/services
- **Health Dashboard**: http://localhost:8080/api/health/dashboard

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**🎯 Enterprise-ready AI platform with 25+ integrated services, production deployment, and comprehensive monitoring.**
