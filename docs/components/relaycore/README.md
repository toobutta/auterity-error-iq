# RelayCore - AI Request Router & Cost Optimizer

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../../LICENSE)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://hub.docker.com/r/auterity/relaycore)

## 🎯 **Overview**

RelayCore is an intelligent AI request router that optimizes costs and performance by automatically selecting the best AI model for each request. It acts as a proxy between your applications and multiple AI providers.

**Key Features**:
- 🔄 **Multi-Provider Routing**: OpenAI, Anthropic, Claude, NeuroWeaver
- 💰 **Cost Optimization**: Automatic model switching based on budget constraints
- ⚡ **Performance Monitoring**: Real-time latency and accuracy tracking
- 🎛️ **Steering Rules**: Configurable routing logic
- 🔌 **Plugin System**: IDE integrations for VSCode, JetBrains, etc.

## 🚀 **Quick Start**

### **Docker (Recommended)**
```bash
docker run -p 3001:3001 -e OPENAI_API_KEY=your_key auterity/relaycore:latest
```

### **From Source**
```bash
cd systems/relaycore
npm install
npm run build
npm start
```

### **Basic Usage**
```bash
curl -X POST http://localhost:3001/api/v1/ai/route \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing",
    "task_type": "explanation",
    "budget_limit": 0.10
  }'
```

## 📋 **Configuration**

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/relaycore
NEUROWEAVER_ENDPOINT=http://localhost:3002

# Monitoring
PROMETHEUS_PORT=9090
JAEGER_ENDPOINT=http://localhost:14268
```

### **Steering Rules Configuration**
```yaml
# config/steering-rules.yaml
rules:
  - name: "cost_optimization"
    condition: "budget_remaining < 0.05"
    action: "route_to_cheapest"
    
  - name: "automotive_specialization"
    condition: "context.domain == 'automotive'"
    action: "route_to_neuroweaver"
    
  - name: "complex_reasoning"
    condition: "task_complexity > 0.8"
    action: "route_to_gpt4"
```

## 🔧 **API Reference**

### **Route AI Request**
```http
POST /api/v1/ai/route
Content-Type: application/json

{
  "prompt": "string",
  "task_type": "explanation|generation|analysis",
  "complexity": "low|medium|high",
  "budget_limit": 0.10,
  "context": {
    "domain": "automotive",
    "user_id": "user123"
  }
}
```

**Response**:
```json
{
  "response": "AI generated response...",
  "metadata": {
    "model_used": "gpt-3.5-turbo",
    "cost": 0.002,
    "latency_ms": 1250,
    "routing_reason": "cost_optimization"
  }
}
```

### **Budget Management**
```http
GET /api/v1/budgets/user123
POST /api/v1/budgets/user123/limit
PUT /api/v1/budgets/user123/reset
```

### **Performance Metrics**
```http
GET /api/v1/metrics/performance
GET /api/v1/metrics/costs
GET /api/v1/metrics/models
```

## 🔌 **IDE Integrations**

### **VSCode Extension**
```bash
# Install from marketplace
code --install-extension auterity.relaycore

# Or from source
cd PRD/RelayCore/relaycore-backend/plugins/vscode
npm install && npm run build
code --install-extension .
```

### **JetBrains Plugin**
```bash
# Available in JetBrains marketplace
# Search for "RelayCore AI Router"
```

### **Claude CLI Integration**
```bash
npm install -g @auterity/claude-relay
claude-relay configure --endpoint http://localhost:3001
```

## 📊 **Monitoring & Observability**

### **Prometheus Metrics**
- `relaycore_requests_total` - Total requests processed
- `relaycore_request_duration_seconds` - Request latency
- `relaycore_costs_total` - Total costs by model
- `relaycore_model_accuracy` - Model accuracy scores

### **Grafana Dashboard**
```bash
# Import dashboard from monitoring/grafana/relaycore-dashboard.json
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @monitoring/grafana/relaycore-dashboard.json
```

### **Health Checks**
```bash
curl http://localhost:3001/health        # Basic health
curl http://localhost:3001/health/ready  # Readiness probe
curl http://localhost:3001/health/live   # Liveness probe
```

## 🧪 **Testing**

### **Unit Tests**
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### **Integration Tests**
```bash
npm run test:integration   # Full integration suite
npm run test:load         # Load testing
```

### **Manual Testing**
```bash
# Test routing logic
curl -X POST http://localhost:3001/api/v1/ai/route \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt", "task_type": "test"}'

# Test budget limits
curl -X POST http://localhost:3001/api/v1/budgets/test-user/limit \
  -H "Content-Type: application/json" \
  -d '{"daily_limit": 1.00}'
```

## 🚀 **Deployment**

### **Production Docker**
```bash
docker run -d \
  --name relaycore \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e REDIS_URL=$REDIS_URL \
  auterity/relaycore:latest
```

### **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: relaycore
spec:
  replicas: 3
  selector:
    matchLabels:
      app: relaycore
  template:
    metadata:
      labels:
        app: relaycore
    spec:
      containers:
      - name: relaycore
        image: auterity/relaycore:latest
        ports:
        - containerPort: 3001
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-keys
              key: openai
```

### **Load Balancing**
```nginx
upstream relaycore {
    server relaycore-1:3001;
    server relaycore-2:3001;
    server relaycore-3:3001;
}

server {
    listen 80;
    location /api/v1/ai/ {
        proxy_pass http://relaycore;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🛠️ **Development**

### **Local Development**
```bash
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq/systems/relaycore

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### **Code Structure**
```
src/
├── routes/           # API endpoints
├── services/         # Business logic
├── middleware/       # Request processing
├── config/          # Configuration management
├── utils/           # Utility functions
└── types/           # TypeScript definitions
```

## 🤝 **Contributing**

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

### **Quick Contribution Steps**
1. Fork the repository
2. Create feature branch: `git checkout -b feature/relaycore-enhancement`
3. Make changes and add tests
4. Run test suite: `npm test`
5. Submit pull request with `component:relaycore` label

## 📝 **Changelog**

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.

## 🆘 **Troubleshooting**

### **Common Issues**

**Connection Refused**
```bash
# Check if service is running
curl http://localhost:3001/health

# Check logs
docker logs relaycore
```

**High Latency**
```bash
# Check Redis connection
redis-cli ping

# Monitor metrics
curl http://localhost:3001/metrics
```

**Budget Exceeded**
```bash
# Check current usage
curl http://localhost:3001/api/v1/budgets/user123

# Reset budget
curl -X PUT http://localhost:3001/api/v1/budgets/user123/reset
```

## 📚 **Additional Resources**

- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Architecture Overview](../../ARCHITECTURE_OVERVIEW.md)

---

**Need help?** [Create an issue](https://github.com/toobutta/auterity-error-iq/issues) with the `component:relaycore` label.