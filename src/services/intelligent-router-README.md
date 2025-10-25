

# Intelligent Router Servic

e

AI-powered request routing system that intelligently distributes requests between Temporal, n8n, vLLM, LangGraph, CrewAI, and other services based on performance, cost, availability, and task requirements

.

#

# 🚀 Overvie

w

The Intelligent Router Service acts as a smart traffic controller for your AI ecosystem, automatically routing requests to the most appropriate service based on:

- **Performance Metrics**: Response time, throughput, reliabilit

y

- **Cost Optimization**: Budget constraints and cost efficienc

y

- **Service Health**: Real-time availability and capacit

y

- **Task Requirements**: Capabilities, latency needs, data siz

e

- **Business Rules**: Priority levels, preferred services, time-based routin

g

#

# 🏗️ Architectur

e

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │────│ Intelligent     │────┼─ Temporal       │
│   (Web/Mobile)  │    │ Router Service  │    ┼─ n8n           │
└─────────────────┘    └─────────────────┘    ┼─ vLLM           │
         │                       │           ┼─ LangGraph      │
         └───────────────────────┼───────────┼─ CrewAI         │
                                 │           ┼─ OpenAI         │
                    ┌─────────────────┐    └─────────────────┘
                    │   AI Services   │
                    │   Integration   │
                    └─────────────────┘

```

#

# 🎯 Key Feature

s

#

## Intelligent Decision Making

- **Multi-Criteria Scoring**: Evaluates services based on 1

0

+ factor

s

- **Dynamic Routing**: Adapts to real-time service performanc

e

- **Predictive Analytics**: Learns from historical performance dat

a

- **Fallback Strategies**: Automatic failover to alternative service

s

#

## Performance Optimization

- **Latency Awareness**: Routes to fastest available service

s

- **Cost Efficiency**: Optimizes for budget constraint

s

- **Load Balancing**: Distributes load across healthy service

s

- **Resource Management**: Prevents service overloa

d

#

## Enterprise Integration

- **Kong Gateway**: API routing and rate limitin

g

- **Health Monitoring**: Real-time service health check

s

- **Metrics Collection**: Comprehensive performance analytic

s

- **Audit Logging**: Complete request tracin

g

#

## Service Mesh Capabilities

- **Service Discovery**: Automatic service registration and discover

y

- **Circuit Breaking**: Prevents cascading failure

s

- **Request Queuing**: Handles traffic spikes gracefull

y

- **Retry Logic**: Intelligent retry with exponential backof

f

#

# 📋 Prerequisite

s

- **Node.js**: 1

8

+ with TypeScript suppor

t

- **AI Services**: At least one of Temporal, n8n, vLLM, LangGraph, CrewA

I

- **Kong Gateway**: For API routing (optional but recommended

)

- **Redis**: For caching and session management (optional

)

- **Monitoring**: Prometheus/Grafana for metrics visualization (optional

)

#

# 🚀 Quick Star

t

#

##

 1. Service Configurati

o

n

```

typescript
import { intelligentRouter } from './services/intelligentRouter';

// Router is automatically initialized with default configuration
// Customize as needed for your environment

```

#

##

 2. Basic Request Routi

n

g

```

typescript
import { RoutingRequest } from './services/intelligentRouter';

// Create a routing request
const request: RoutingRequest = {
  id: 'req_'

 + Date.now(),

  type: 'ai-generation',

  priority: 'high',
  requirements: {
    maxLatency: 5000,     // 5 seconds max
    maxCost: 0.01,        // $0.01 per request max

    reliability: 0.95     // 95% success rate required

  },
  payload: {
    prompt: 'Explain quantum computing in simple terms',
    temperature: 0.7,

    maxTokens: 500
  },
  metadata: {
    userId: 'user123',
    source: 'web-app'

  }
};

// Route the request
const result = await intelligentRouter.routeRequest(request);

console.log('Selected Service:', result.decision.selectedService);
console.log('Execution Result:', result.executionResult);
console.log('Actual Cost:', result.actualCost);

```

#

##

 3. Advanced Routing with Preferenc

e

s

```

typescript
const request: RoutingRequest = {
  id: 'advanced_'

 + Date.now(),

  type: 'workflow',
  priority: 'critical',
  requirements: {
    maxLatency: 10000,
    capabilities: ['fault-tolerance', 'monitoring']

  },
  payload: {
    workflowId: 'critical-process',

    input: { data: 'sensitive-data' }

  },
  preferredServices: ['temporal', 'langgraph'], // Prefer these
  excludedServices: ['openai'],                  // Never use this
  metadata: {
    userId: 'enterprise-user',

    tags: ['production', 'critical']
  }
};

const result = await intelligentRouter.routeRequest(request);

```

#

# 📚 API Referenc

e

#

## Core Method

s

#

### `routeRequest(request: RoutingRequest): Promise<RoutingResult>

`

Routes a request to the most appropriate service based on intelligent analysis.

**Parameters:

* *

- `request`: RoutingRequest object with requirements and payloa

d

**Returns:

* * Promise<RoutingResult> with execution results and metadat

a

#

### `getMetrics(): RoutingMetrics

`

Returns comprehensive routing performance metrics.

**Returns:

* * Current routing statistics and performance dat

a

#

### `getServiceHealth(): ServiceEndpoint[]

`

Returns health status of all registered services.

**Returns:

* * Array of service health informatio

n

#

### `getRoutingHistory(limit?: number): RoutingResult[]

`

Returns recent routing decisions and results.

**Parameters:

* *

- `limit`: Maximum number of results to return (default: 50

)

#

## Request Type

s

The router supports different request types with specialized routing logic:

```

typescript
type RequestType =
  | 'workflow'        // Temporal/LangGraph routing
  | 'ai-generation'   // vLLM/OpenAI/Anthropic routing

  | 'ai-analysis'     // Analysis-focused routing

  | 'multi-agent'     // CrewAI-focused routing

  | 'scheduled'       // Temporal scheduling
  | 'real-time';      // Low-latency routin

g

```

#

## Service Type

s

Supported service types with their characteristics:

```

typescript
interface ServiceEndpoint {
  name: string;
  type: 'temporal' | 'n8n' | 'vllm' | 'langgraph' | 'crewai' | 'openai' | 'anthropic';
  baseUrl: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  costPerRequest: number;
  capabilities: string[];
  priority: number;
}

```

#

# 🔧 Configuratio

n

#

## Environment Variable

s

| Variable | Default | Description |
|----------|---------|-------------|

| `TEMPORAL_BASE_URL` | http://localhost:7233 | Temporal service URL |
| `N8N_BASE_URL` | http://localhost:5678 | n8n service URL |
| `VLLM_BASE_URL` | http://localhost:8001 | vLLM service URL |
| `LANGGRAPH_BASE_URL` | http://localhost:8002 | LangGraph service URL |
| `CREWAI_BASE_URL` | http://localhost:8003 | CrewAI service URL |
| `OPENAI_API_KEY` |

 - | OpenAI API key |

| `ANTHROPIC_API_KEY` |

 - | Anthropic API key |

| `ROUTER_HEALTH_CHECK_INTERVAL` | 30000 | Health check interval (ms) |

#

## Advanced Configuratio

n

```

typescript
// Custom router configuration
const customConfig = {
  services: [
    {
      name: 'custom-vllm',

      type: 'vllm' as const,
      baseUrl: 'http://custom-gpu:8001',

      costPerRequest: 0.008,

      capabilities: ['text-generation', 'gpu-accelerated', 'custom-model'],

      priority: 10
    }
  ],
  loadBalancing: {
    strategy: 'performance-based' as const,

    healthCheckInterval: 15000
  },
  caching: {
    enabled: true,
    ttl: 300000, // 5 minutes
    maxSize: 2000
  }
};

// Initialize with custom config
const customRouter = new IntelligentRouter(customConfig);

```

#

# 🧪 Testin

g

#

## Unit Test

s

```

bash

# Run router tests

cd src/services
npm test -

- --testPathPattern=intelligentRoute

r

# Run with coverage

npm test -

- --testPathPattern=intelligentRouter --coverag

e

```

#

## Integration Test

s

```

bash

# Test with real services

npm run test:integration -

- --testPathPattern=route

r

# Test routing decisions

npm run test:integration -

- --testPathPattern=routing-decision

s

```

#

## Load Testin

g

```

bash

# Install Artillery for load testing

npm install -g artiller

y

# Run load test

artillery run tests/load/router-load-test.ym

l

# Generate report

artillery report router-load-test.jso

n

```

#

## Performance Benchmarkin

g

```

typescript
// Benchmark routing performance
import { runRouterBenchmark } from './tests/benchmark';

const results = await runRouterBenchmark({
  concurrentRequests: 100,
  duration: 30000, // 30 seconds
  requestTypes: ['ai-generation', 'workflow', 'multi-agent']

});

console.log('Benchmark Results:', {
  averageLatency: results.averageLatency,
  requestsPerSecond: results.requestsPerSecond,
  errorRate: results.errorRate
});

```

#

# 📊 Monitoring & Analytic

s

#

## Real-time Metri

c

s

The router provides comprehensive metrics:

```

typescript
const metrics = intelligentRouter.getMetrics();

console.log('Router Performance:', {
  totalRequests: metrics.totalRequests,
  successRate: `${(metrics.successRate

 * 100).toFixed(1)}%`,

  averageRoutingTime: `${metrics.averageRoutingTime.toFixed(0)}ms`,
  serviceUtilization: metrics.serviceUtilization
});

```

#

## Service Health Monitorin

g

```

typescript
const health = intelligentRouter.getServiceHealth();

health.forEach(service => {
  console.log(`${service.name}: ${service.health} (${service.responseTime}ms)`);
});

```

#

## Routing Analytic

s

```

typescript
const stats = intelligentRouter.getRoutingStats();

console.log('Service Performance:', stats.servicePerformance);
console.log('Request Distribution:', stats.requestTypeDistribution);
console.log('Priority Distribution:', stats.priorityDistribution);

```

#

## Prometheus Integratio

n

```

yaml

# prometheus.yml

scrape_configs:

  - job_name: 'intelligent-router'

    static_configs:

      - targets: ['router-service:9464']

    metrics_path: '/metrics'

# Custom metrics exposed:

/metrics/intelligent_router_requests_total
/metrics/intelligent_router_routing_time
/metrics/intelligent_router_service_health
/metrics/intelligent_router_cost_efficiency

```

#

# 🔌 Integration Example

s

#

## With React Fronten

d

```

tsx
import { useState, useEffect } from 'react';
import { intelligentRouter, RoutingRequest } from '../services/intelligentRouter';

function AIServiceComponent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAIRequest = async (prompt: string) => {
    setLoading(true);

    const request: RoutingRequest = {
      id: `ui_${Date.now()}`,
      type: 'ai-generation',

      priority: 'medium',
      requirements: {
        maxLatency: 3000,
        capabilities: ['text-generation']

      },
      payload: { prompt, temperature: 0.7 },

      metadata: {
        userId: 'ui-user',

        source: 'react-app'

      }
    };

    try {
      const response = await intelligentRouter.routeRequest(request);
      setResult(response);
    } catch (error) {
      console.error('AI request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleAIRequest('Hello AI!')} disabled={loading}>
        {loading ? 'Processing...' : 'Send Request'}
      </button>

      {result && (
        <div>
          <h3>Result from {result.decision.selectedService}</h3>
          <p>Cost: ${result.actualCost}</p>
          <p>Latency: {result.actualLatency}ms</p>
          <pre>{JSON.stringify(result.executionResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

```

#

## With Express Backen

d

```

typescript
import express from 'express';
import { intelligentRouter, RoutingRequest } from './services/intelligentRouter';

const app = express();
app.use(express.json());

app.post('/api/ai/route', async (req, res) => {
  try {
    const request: RoutingRequest = {
      id: req.body.id || `api_${Date.now()}`,
      type: req.body.type,
      priority: req.body.priority || 'medium',
      requirements: req.body.requirements || {},
      payload: req.body.payload,
      metadata: {
        userId: req.user?.id,
        source: 'api',
        ...req.body.metadata
      }
    };

    const result = await intelligentRouter.routeRequest(request);

    res.json({
      success: result.success,
      service: result.decision.selectedService,
      result: result.executionResult,
      cost: result.actualCost,
      latency: result.actualLatency
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = intelligentRouter.getServiceHealth();
  const metrics = intelligentRouter.getMetrics();

  res.json({
    status: 'healthy',
    services: health,
    metrics: metrics
  });
});

app.listen(3000, () => {
  console.log('Intelligent Router API running on port 3000');
});

```

#

## With Kong Gatewa

y

```

yaml

# kong.yml

services:

  - name: intelligent-router

    url: http://router-service:3000

    plugins:

      - name: rate-limiting

        config:
          minute: 1000
          hour: 10000

      - name: request-size-limiting

        config:
          allowed_payload_size: 10

 * 102

4

 * 1024



# 10M

B

routes:

  - name: ai-routing

    service: intelligent-router

    paths:

      - /api/ai/route

    methods:

      - POS

T

  - name: router-health

    service: intelligent-router

    paths:

      - /api/ai/health

    methods:

      - GE

T

```

#

# 🏗️ Developmen

t

#

## Project Structur

e

```

src/services/
├── intelligentRouter.ts

# Main router service

├── intelligentRouterExample.ts

# Usage examples

├── unifiedAIService.ts

# AI service integration

├── aiSDKService.ts

# Existing AI SDK

└── optimizers/
    ├── CostOptimizationEngine.ts
    └── WorkflowOptimizer.ts

```

#

## Adding New Service

s

1. **Define Service Type**: Add to the ServiceType uni

o

n

2. **Implement Service Handler**: Add execution method in the rout

e

r

3. **Configure Service**: Add to service configurati

o

n

4. **Add Health Check**: Implement health monitori

n

g

5. **Update Tests**: Add test cases for new servi

c

e

Example:

```

typescript
//

 1. Add to service type

type ServiceType = 'temporal' | 'n8n' | 'vllm' | 'langgraph' | 'crewai' | 'openai' | 'anthropic' | 'custom-service'

;

//

 2. Add service configuration

{
  name: 'custom-service',

  type: 'custom-service' as const,

  baseUrl: 'http://custom-service:8080',

  costPerRequest: 0.003,

  capabilities: ['custom-processing', 'specialized-ai'],

  priority: 7
}

//

 3. Implement execution method

private async executeCustomService(request: RoutingRequest, service: ServiceEndpoint): Promise<any> {
  const response = await axios.post(`${service.baseUrl}/process`, request.payload, {
    timeout: 30000
  });
  return response.data;
}

```

#

## Custom Routing Strategie

s

```

typescript
// Implement custom routing logic
private calculateCustomScore(service: ServiceEndpoint, request: RoutingRequest): { score: number; reasoning: string } {
  let score = service.priority

 * 10;

  const reasons: string[] = [];

  // Custom scoring logic here
  if (request.metadata?.tags?.includes('premium')) {
    if (service.type === 'openai' || service.type === 'anthropic') {
      score += 20;

      reasons.push('Premium service for premium request');
    }
  }

  return { score, reasoning: reasons.join('; ') };
}

```

#

# 🔒 Security & Complianc

e

#

## Authentication & Authorizatio

n

- **API Key Management**: Secure service authenticatio

n

- **Request Validation**: Comprehensive input validatio

n

- **Rate Limiting**: Prevents abuse and ensures fair usag

e

- **Audit Logging**: Complete request/response loggin

g

#

## Data Protectio

n

- **Encryption**: TLS for all service communication

s

- **Data Sanitization**: Input validation and sanitizatio

n

- **Privacy Compliance**: GDPR and CCPA complianc

e

- **Data Retention**: Configurable data retention policie

s

#

## Service Securit

y

- **Health Validation**: Continuous service health monitorin

g

- **Failover Protection**: Automatic failover to healthy service

s

- **Circuit Breaking**: Prevents cascade failure

s

- **Resource Limits**: Configurable resource usage limit

s

#

# 🤝 Contributin

g

#

## Development Guideline

s

1. **Code Quality**: Follow TypeScript best practic

e

s

2. **Testing**: Comprehensive test coverage for all routing log

i

c

3. **Documentation**: Update API documentation for new featur

e

s

4. **Performance**: Optimize routing algorithms for low laten

c

y

5. **Security**: Implement security best practic

e

s

#

## Feature Developmen

t

1. **Plan**: Design routing logic and service integrati

o

n

2. **Implement**: Add service handlers and routing log

i

c

3. **Test**: Comprehensive testing including load testi

n

g

4. **Document**: Update documentation and exampl

e

s

5. **Deploy**: Gradual rollout with monitori

n

g

#

## Performance Optimizatio

n

- **Caching**: Implement intelligent result cachin

g

- **Load Balancing**: Optimize service load distributio

n

- **Async Processing**: Use async/await for non-blocking operation

s

- **Connection Pooling**: Reuse connections to reduce overhea

d

#

# 📄 Licens

e

This project is part of the Auterity Unified AI Platform. See the main project LICENSE file for details.

#

# 🆘 Support & Troubleshootin

g

#

## Common Issue

s

**High Latency Routing

* *

```

typescript
// Check service health
const health = intelligentRouter.getServiceHealth();
const slowServices = health.filter(s => s.responseTime > 5000);

console.log('Slow services:', slowServices);

// Optimize by excluding slow services
const request: RoutingRequest = {
  // ... request config
  excludedServices: slowServices.map(s => s.name)
};

```

**Service Unavailable

* *

```

typescript
// Check overall health
const health = intelligentRouter.getServiceHealth();
const unhealthyServices = health.filter(s => s.health === 'unhealthy');

if (unhealthyServices.length > 0) {
  console.warn('Unhealthy services:', unhealthyServices);
  // Implement fallback logic
}

```

**Cost Optimization

* *

```

typescript
// Monitor cost efficiency
const metrics = intelligentRouter.getMetrics();
console.log('Cost efficiency:', metrics.costEfficiency);

// Adjust routing for cost optimization
const request: RoutingRequest = {
  // ... request config
  requirements: {
    maxCost: 0.005 // Lower cost threshold

  }
};

```

#

## Performance Tunin

g

1. **Monitor Metrics**: Regularly check routing performan

c

e

2. **Adjust Priorities**: Modify service priorities based on usage patter

n

s

3. **Optimize Caching**: Configure caching for frequently accessed da

t

a

4. **Load Balancing**: Distribute load across multiple service instanc

e

s

#

## Getting Hel

p

- **Documentation**: Comprehensive documentation and example

s

- **GitHub Issues**: Report bugs and request feature

s

- **Community**: Join the Auterity community discussion

s

- **Professional Support**: Enterprise support availabl

e

#

# 🎯 Roadma

p

#

## Upcoming Feature

s

- [ ] **Machine Learning Routing**: ML-powered routing decision

s

- [ ] **Predictive Scaling**: Auto-scaling based on demand pattern

s

- [ ] **Advanced Caching**: Intelligent result caching and invalidatio

n

- [ ] **Real-time Analytics**: Live dashboard for routing metric

s

- [ ] **Custom Plugins**: Extensible plugin system for routing strategie

s

- [ ] **Multi-region Support**: Global service distribution and routin

g

- [ ] **Advanced Security**: Enhanced authentication and authorizatio

n

- [ ] **Performance Profiling**: Detailed performance analysis tool

s

--

- **Built with ❤️ for the Auterity Unified AI Platform

* *

