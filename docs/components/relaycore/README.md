

# RelayCore

 - AI Request Router & Cost Optimiz

e

r

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](CHANGELOG.md

)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../../LICENSE)

[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://hub.docker.com/r/auterity/relaycore

)

#

# 🎯 **Overvie

w

* *

RelayCore is an intelligent AI request router that optimizes costs and performance by automatically selecting the best AI model for each request. It acts as a proxy between your applications and multiple AI providers.

**Key Features**

:

- 🔄 **Multi-Provider Routing**: OpenAI, Anthropic, Claude, NeuroWeave

r

- 💰 **Cost Optimization**: Automatic model switching based on budget constraint

s

- ⚡ **Performance Monitoring**: Real-time latency and accuracy trackin

g

- 🎛️ **Steering Rules**: Configurable routing logi

c

- 🔌 **Plugin System**: IDE integrations for VSCode, JetBrains, etc

.

#

# 🚀 **Quick Star

t

* *

#

## **Docker (Recommended

)

* *

```bash
docker run -p 3001:3001 -e OPENAI_API_KEY=your_key auterity/relaycore:lates

t

```

#

## **From Sourc

e

* *

```

bash
cd systems/relaycore
npm install
npm run build
npm start

```

#

## **Basic Usag

e

* *

```

bash
curl -X POST http://localhost:3001/api/v1/ai/route

\
  -H "Content-Type: application/json"

\
  -d '{

    "prompt": "Explain quantum computing",
    "task_type": "explanation",
    "budget_limit": 0.10

  }'

```

#

# 📋 **Configuratio

n

* *

#

## **Environment Variable

s

* *

```

bash

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

#

## **Steering Rules Configuratio

n

* *

```

yaml

# config/steering-rules.yam

l

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

#

# 🔧 **API Referenc

e

* *

#

## **Route AI Reques

t

* *

```

http
POST /api/v1/ai/route
Content-Type: application/jso

n

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

**Response**

:

```

json
{
  "response": "AI generated response...",
  "metadata": {
    "model_used": "gpt-3.5-turbo"

,

    "cost": 0.002,

    "latency_ms": 1250,
    "routing_reason": "cost_optimization"
  }
}

```

#

## **Budget Managemen

t

* *

```

http
GET /api/v1/budgets/user123
POST /api/v1/budgets/user123/limit
PUT /api/v1/budgets/user123/reset

```

#

## **Performance Metric

s

* *

```

http
GET /api/v1/metrics/performance
GET /api/v1/metrics/costs
GET /api/v1/metrics/models

```

#

# 🔌 **IDE Integration

s

* *

#

## **VSCode Extensio

n

* *

```

bash

# Install from marketplace

code --install-extension auterity.relaycor

e

# Or from source

cd PRD/RelayCore/relaycore-backend/plugins/vscode

npm install && npm run build
code --install-extension

.

```

#

## **JetBrains Plugi

n

* *

```

bash

# Available in JetBrains marketplac

e

# Search for "RelayCore AI Router"

```

#

## **Claude CLI Integratio

n

* *

```

bash
npm install -g @auterity/claude-relay

claude-relay configure --endpoint http://localhost:300

1

```

#

# 📊 **Monitoring & Observabilit

y

* *

#

## **Prometheus Metric

s

* *

- `relaycore_requests_total

`

 - Total requests processe

d

- `relaycore_request_duration_seconds

`

 - Request latenc

y

- `relaycore_costs_total

`

 - Total costs by mode

l

- `relaycore_model_accuracy

`

 - Model accuracy score

s

#

## **Grafana Dashboar

d

* *

```

bash

# Import dashboard from monitoring/grafana/relaycore-dashboard.jso

n

curl -X POST http://admin:admin@localhost:3000/api/dashboards/db

\
  -H "Content-Type: application/json"

\
  -d @monitoring/grafana/relaycore-dashboard.jso

n

```

#

## **Health Check

s

* *

```

bash
curl http://localhost:3001/health

# Basic health

curl http://localhost:3001/health/ready

# Readiness probe

curl http://localhost:3001/health/live

# Liveness probe

```

#

# 🧪 **Testin

g

* *

#

## **Unit Test

s

* *

```

bash
npm test

# Run all tests

npm run test:watch

# Watch mode

npm run test:coverage

# Coverage report

```

#

## **Integration Test

s

* *

```

bash
npm run test:integration

# Full integration suite

npm run test:load

# Load testing

```

#

## **Manual Testin

g

* *

```

bash

# Test routing logic

curl -X POST http://localhost:3001/api/v1/ai/route

\
  -H "Content-Type: application/json"

\
  -d '{"prompt": "Test prompt", "task_type": "test"}

'

# Test budget limits

curl -X POST http://localhost:3001/api/v1/budgets/test-user/limit

\
  -H "Content-Type: application/json"

\
  -d '{"daily_limit": 1.00

}

'

```

#

# 🚀 **Deploymen

t

* *

#

## **Production Docke

r

* *

```

bash
docker run -d

\
  --name relaycore

\
  -p 3001:3001

\
  -e NODE_ENV=production

\
  -e OPENAI_API_KEY=$OPENAI_API_KEY

\
  -e REDIS_URL=$REDIS_URL \

  auterity/relaycore:latest

```

#

## **Kubernete

s

* *

```

yaml
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

#

## **Load Balancin

g

* *

```

nginx
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

#

# 🛠️ **Developmen

t

* *

#

## **Local Developmen

t

* *

```

bash
git clone https://github.com/toobutta/auterity-error-iq.git

cd auterity-error-iq/systems/relaycor

e

# Install dependencies

npm install

# Start development server

npm run dev

# Run tests

npm test

```

#

## **Code Structur

e

* *

```

src/
├── routes/

# API endpoints

├── services/

# Business logic

├── middleware/

# Request processing

├── config/

# Configuration management

├── utils/

# Utility functions

└── types/

# TypeScript definitions

```

#

# 🤝 **Contributin

g

* *

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

#

## **Quick Contribution Step

s

* *

1. Fork the repositor

y

2. Create feature branch: `git checkout -b feature/relaycore-enhancemen

t

`

3. Make changes and add test

s

4. Run test suite: `npm test

`

5. Submit pull request with `component:relaycore` labe

l

#

# 📝 **Changelo

g

* *

See [CHANGELOG.md](CHANGELOG.md) for version history and breaking changes.

#

# 🆘 **Troubleshootin

g

* *

#

## **Common Issue

s

* *

**Connection Refused

* *

```

bash

# Check if service is running

curl http://localhost:3001/health

# Check logs

docker logs relaycore

```

**High Latency

* *

```

bash

# Check Redis connection

redis-cli pin

g

# Monitor metrics

curl http://localhost:3001/metrics

```

**Budget Exceeded

* *

```

bash

# Check current usage

curl http://localhost:3001/api/v1/budgets/user123

# Reset budget

curl -X PUT http://localhost:3001/api/v1/budgets/user123/rese

t

```

#

# 📚 **Additional Resource

s

* *

- [API Documentation](API.md

)

- [Deployment Guide](DEPLOYMENT.md

)

- [Contributing Guidelines](CONTRIBUTING.md

)

- [Architecture Overview](../../ARCHITECTURE_OVERVIEW.md

)

--

- **Need help?

* * [Create an issue](https://github.com/toobutta/auterity-error-iq/issues) with the `component:relaycore` label

.
