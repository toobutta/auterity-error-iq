

# Architecture Overvie

w

#

# Three-System Integration Architectu

r

e

Auterity is built on a **three-system architecture

* * that provides comprehensive AI-powered workflow automation

:

#

## **

1. AutoMatrix (Core Engine)

* *

- **Purpose**: Visual workflow automation platform with enterprise feature

s

- **Components**: Frontend UI, Workflow Studio, API Gateway, Core Service

s

- **Technology**: React, TypeScript, FastAPI, PostgreSQ

L

- **Ports**: 3000 (Frontend), 8000 (API

)

#

## **

2. RelayCore (AI Router)

* *



- **Purpose**: Intelligent AI request routing and cost optimizatio

n

- **Components**: Model routing, performance monitoring, cost optimizatio

n

- **Technology**: Python, FastAPI, AI SDK, Redi

s

- **Port**: 800

1

#

## **

3. NeuroWeaver (Model Management)

* *

- **Purpose**: Specialized AI model training, fine-tuning, and deploymen

t

- **Components**: Model registry, training pipelines, custom model servin

g

- **Technology**: Python, FastAPI, PyTorch, ML Pipelin

e

- **Port**: 800

4

#

# Unified Platform Architectur

e

```
Auterity Unified AI Platform
├── 🎨 Frontend Applications (Port: 3000)
│   ├── Main Application (React/TypeScript)
│   ├── Workflow Studio (Integrated Visual Designer)
│   └── Chrome DevTools Integration
├── 🔧 Backend Services
│   ├── API Gateway (apps/api

 - Port: 8000)

│   ├── Intelligent Router (services/intelligentRouter

 - Port: 8005)

│   ├── HumanLayer Service (services/humanLayerService

 - Port: 8006)

│   ├── MLflow Integration (services/humanlayerMLflowIntegration

 - Port: 8007)

│   ├── WorkflowAdapter (services/WorkflowAdapter

 - Port: 8008)

│   ├── n8n AI Enhancements (services/n8n-ai-enhancement

s

 - Port: 8009)

│   ├── Cost Optimization Engine (services/costOptimizationEngine

 - Port: 8010)

│   ├── RelayCore AI Router (systems/relaycore

 - Port: 8001)

│   ├── LangGraph Service (systems/langgraph

 - Port: 8002)

│   ├── vLLM Service (systems/vllm

 - Port: 8001)

│   ├── CrewAI Service (systems/crewai

 - Port: 8003)

│   ├── NeuroWeaver Platform (systems/neuroweaver

 - Port: 8004)

│   ├── MCP Orchestrator (systems/mcp

 - Port: 8005)

│   └── Integration Layer (systems/integration

 - Port: 8007)

├── 📦 Applications
│   ├── API Application (apps/api

 - Port: 8000)

│   └── Workflow Studio (apps/workflow-studi

o

 - Port: 3001)

├── 📦 Shared Libraries
│   ├── Design System (packages/design-system)

│   ├── Workflow Contracts (packages/workflow-contracts)

│   ├── Shared UI (packages/shared-ui)

│   └── Scaffolding (packages/scaffolding)
└── 🛠️ Infrastructure (30

+ Services)

    ├── Databases: PostgreSQL, Redis, Weaviate, Kafka
    ├── Message Queue: RabbitMQ
    ├── Monitoring: Prometheus, Grafana, Jaeger, Loki
    ├── Security: Vault, Kong Gateway
    ├── AI/ML: MLflow, Celery Workers
    ├── Development: MailHog, Puppeteer, pgAdmin
    └── Networking: AlertManager, Node Exporter

```

#

# Integrated Services Overvie

w

| Service | Location | Technology | Purpose | Port |
|---------|----------|------------|---------|------|

| **Frontend

* * | `frontend/` | React 18, TypeScript, Vite | Main application UI | 3000 |

| **Workflow Studio

* * | `apps/workflow-studio/` | React Flow, PixiJS, AI SDK | Visual workflow designer | 3001 |

| **API Services

* * | `apps/api/` | Node.js, Express, TypeScript | RESTful API endpoints | 8000 |

| **RelayCore

* * | `systems/relaycore/` | Python, FastAPI, AI SDK | AI model routing & management | 8001 |

| **LangGraph Service

* * | `systems/langgraph/` | Python, FastAPI, LangGraph | AI-powered workflow orchestration | 8002 |

| **vLLM Service

* * | `systems/vllm/` | Python, FastAPI, vLLM | High-throughput AI model serving | 8001 |

| **CrewAI Service

* * | `systems/crewai/` | Python, FastAPI, CrewAI | Multi-agent collaborative systems | 8003 |

| **NeuroWeaver

* * | `systems/neuroweaver/` | Python, FastAPI, PyTorch | Model specialization platform | 8004 |

| **MCP Orchestrator

* * | `systems/mcp/` | TypeScript, Node.js | Model Context Protocol orchestrator | 8005 |

| **n8n AI Enhancements

* * | `systems/n8n-ai-enhancements/` | Node.js, n8n, AI SDK | AI-enhanced workflow platform | 8006 |

| **Integration Layer

* * | `systems/integration/` | Python, FastAPI, RabbitMQ | Cross-system integration | 8007 |

| **Kong Gateway

* * | `infrastructure/docker/` | Kong, Lua | API gateway & load balancing | 8000 |

| **PostgreSQL

* * | `infrastructure/docker/` | PostgreSQL | Primary database | 5432 |

| **Redis

* * | `infrastructure/docker/` | Redis | Caching & sessions | 6379 |

| **RabbitMQ

* * | `infrastructure/docker/` | RabbitMQ | Message queuing | 5672 |

| **Kafka

* * | `infrastructure/docker/` | Kafka, Zookeeper | Event streaming | 9092 |

| **Weaviate

* * | `infrastructure/docker/` | Weaviate | Vector database | 8080 |

| **MLflow

* * | `infrastructure/docker/` | MLflow | ML experiment tracking | 5000 |

| **Prometheus

* * | `infrastructure/docker/` | Prometheus | Metrics collection | 9090 |

| **Grafana

* * | `infrastructure/docker/` | Grafana | Monitoring dashboards | 3000 |

| **Jaeger

* * | `infrastructure/docker/` | Jaeger | Distributed tracing | 16686 |

| **Loki

* * | `infrastructure/docker/` | Loki | Log aggregation | 3100 |

| **Vault

* * | `infrastructure/docker/` | HashiCorp Vault | Secrets management | 8200 |

| **Celery Worker

* * | `infrastructure/docker/` | Python, Celery | Background task processing

|

 - |

| **Design System

* * | `packages/design-system/` | React, TypeScript, CSS | Shared UI components

|

 - |

| **Workflow Contracts

* * | `packages/workflow-contracts/` | TypeScript | Type-safe workflow definitions

|

 - |

| **Shared UI

* * | `packages/shared-ui/` | React, TypeScript | Common UI components

|

 - |

| **Scaffolding

* * | `packages/scaffolding/` | TypeScript | Project scaffolding tools

|

 - |

#

# Data Flow Architectur

e

```

mermaid
User Request
    ↓
Frontend Application (Port: 3000)
    ↓
API Gateway (Port: 8000)
    ↓
┌─────────────────────────────────────┐
│         Service Routing             │
├─────────────────────────────────────┤
│ • Workflow Studio → apps/workflow-studio │

│ • AI Services → systems/relaycore       │
│ • Data Services → apps/api              │
└─────────────────────────────────────┘
    ↓
Infrastructure Layer
├── PostgreSQL (Data Storage)
├── Redis (Caching)
├── MinIO (File Storage)
└── Kafka (Event Streaming)

```

#

# Service Layer

s

#

## **Presentation Layer

* *

- **Main Frontend

* * (`frontend/`): React/TypeScript application with integrated Workflow Studi

o

- **Workflow Studio UI

* * (`apps/workflow-studio/`): Visual workflow designer with drag-and-drop interfac

e

- **Chrome DevTools Integration**: Complete debugging and performance monitoring suit

e

#

## **Application Layer

* *

- **API Gateway

* * (`apps/api/`): Centralized API management and routin

g

- **Workflow Engine

* * (`apps/workflow-studio/`): Workflow execution and managemen

t

- **RelayCore

* * (`systems/relaycore/`): AI model orchestration and routin

g

#

## **Data Layer

* *

- **PostgreSQL

* * (Port: 5432): Primary relational databas

e

- **Redis

* * (Port: 6379): Caching and session managemen

t

- **MinIO

* * (Port: 9000): Object storage for files and asset

s

- **Kafka

* * (Port: 9092): Event streaming and messagin

g

#

## **Infrastructure Layer

* *

- **Kong Gateway

* * (Port: 8000): API gateway and load balancin

g

- **PostgreSQL

* * (Port: 5432): Primary relational databas

e

- **Redis

* * (Port: 6379): High-performance caching and session storag

e

- **RabbitMQ

* * (Port: 5672): Message queuing for asynchronous processin

g

- **Kafka

* * (Port: 9092): Event streaming and real-time data processin

g

- **Zookeeper

* * (Port: 2181): Coordination service for Kafka cluste

r

- **Weaviate

* * (Port: 8080): Vector database for AI embeddings and semantic searc

h

- **MLflow

* * (Port: 5000): Machine learning experiment tracking and model registr

y

- **Vault

* * (Port: 8200): Secrets management and encryptio

n

- **Prometheus

* * (Port: 9090): Metrics collection and monitorin

g

- **Grafana

* * (Port: 3000): Visualization and monitoring dashboard

s

- **Jaeger

* * (Port: 16686): Distributed tracing and performance monitorin

g

- **Loki

* * (Port: 3100): Log aggregation and analysi

s

- **Celery Worker**: Background task processing and job queue

s

- **Celery Beat**: Scheduled task managemen

t

- **Puppeteer**: Headless browser automation for testing and scrapin

g

- **MailHog

* * (Port: 1025/8025): Email testing and developmen

t

- **AlertManager

* * (Port: 9093): Alert management and notification routin

g

- **Node Exporter

* * (Port: 9100): System metrics collectio

n

- **pgAdmin

* * (Port: 5050): PostgreSQL database administratio

n

- **Docker Compose**: Container orchestration for all service

s

#

# Integration Point

s

#

## Workflow Studio Integration

- **Location**: Integrated as `apps/workflow-studio/` in unified platfor

m

- **Access**: Available at `/workflow-studio` route in main applicatio

n

- **Technology**: React Flow for visual workflow desig

n

- **AI Integration**: Vercel AI SDK for multi-model suppor

t

#

## Chrome DevTools Integration

- **Global API**: Available via `window.auterity.devtools

`

- **Components**: 7 monitoring modules (Web Vitals, Network, Memory, Console, Accessibility, Security

)

- **Integration**: Built into main frontend applicatio

n

#

## AI Service Integration

- **RelayCore**: Handles AI model routing and performance optimizatio

n

- **LangGraph Service**: AI-powered workflow orchestration with intelligent decision makin

g

- **vLLM Service**: High-throughput AI model serving with GPU acceleratio

n

- **Multi-Model Support**: OpenAI, Anthropic, Google, Azure AI, and custom vLLM model

s

- **Load Balancing**: Intelligent routing based on model performance and cos

t

#

## LangGraph Service Integration

- **Location**: `systems/langgraph/` (Port: 8002

)

- **Technology**: Python, FastAPI, LangGraph, Redi

s

- **Features**: AI-driven workflow execution, dynamic routing, multi-provider AI integratio

n

- **Integration**: Works with n8n, Temporal, and Celery for enterprise workflow automatio

n

#

## vLLM Service Integration

- **Location**: `systems/vllm/` (Port: 8001

)

- **Technology**: Python, FastAPI, vLLM, PyTorc

h

- **Features**: GPU-accelerated inference, up to 24x faster than CPU, intelligent cachin

g

- **Integration**: Supports multiple AI models with automatic scaling and monitorin

g

#

## CrewAI Service Integration

- **Location**: `systems/crewai/` (Port: 8003

)

- **Technology**: Python, FastAPI, CrewAI framewor

k

- **Features**: Multi-agent collaborative systems, hierarchical/democratic modes, role-based agents, dynamic task assignmen

t

- **Purpose**: Advanced multi-agent workflows for complex problem-solving and collaborative AI task

s

- **Integration**: Works with LangGraph for workflow orchestration and RelayCore for model routin

g

#

## NeuroWeaver Platform Integration

- **Location**: `systems/neuroweaver/` (Port: 8004

)

- **Technology**: Python, FastAPI, PyTorch, specialized ML framework

s

- **Features**: Model specialization platform, fine-tuning pipeline, model registry, performance monitorin

g

- **Domain**: Automotive industry focus with specialized models for vehicle diagnostics, autonomous systems, and manufacturin

g

- **Integration**: Connects with vLLM for inference, MLflow for experiment tracking, and Weaviate for vector storag

e

#

## MCP Orchestrator Integration

- **Location**: `systems/mcp/` (Port: 8005

)

- **Technology**: TypeScript, Node.js, Model Context Protoco

l

- **Features**: AI model management, context orchestration, multi-model coordinatio

n

- **Purpose**: Unified interface for managing different AI models and their context

s

- **Integration**: Bridges various AI services and provides consistent API for model interaction

s

#

## n8n AI Enhancements Integration

- **Location**: `systems/n8n-ai-enhancements/` (Port: 8006

)

- **Technology**: Node.js, n8n workflow engine, AI SDK integration

s

- **Features**: AI-enhanced workflow platform, intelligent analysis, smart node suggestions, automated workflow generatio

n

- **Purpose**: Enhanced workflow automation with AI-powered decision making and optimizatio

n

- **Integration**: Extends n8n with AI capabilities, connects to all AI services in the platfor

m

#

## Integration Layer

- **Location**: `systems/integration/` (Port: 8007

)

- **Technology**: Python, FastAPI, RabbitMQ, Redi

s

- **Features**: Unified authentication, cross-system messaging, distributed caching, service discover

y

- **Purpose**: Provides seamless integration between all platform service

s

- **Integration**: Acts as the central hub for inter-service communication and data flo

w

#

# Security Architectur

e

#

## Authentication & Authorization

- **JWT Tokens**: Stateless authentication across all service

s

- **Role-Based Access Control**: Granular permissions for users and service

s

- **API Gateway Security**: Centralized security policies via Kon

g

#

## Data Protection

- **Encryption**: Data encryption at rest and in transi

t

- **Secrets Management**: Secure credential storage and rotatio

n

- **Audit Logging**: Complete audit trail for all operation

s

#

## Network Security

- **CORS Protection**: Configured for allowed origin

s

- **Rate Limiting**: DDoS protection and abuse preventio

n

- **SSL/TLS**: End-to-end encryption for all communication

s

#

# Deployment Architectur

e

#

## Development Environment

```

bash
npm run dev

# Starts all services via Docker Compose

```

#

## Production Environment

```

bash
npm run prod

# Production deployment with optimizations

```

#

## Service Scaling

- **Horizontal Scaling**: Services can be scaled independentl

y

- **Load Balancing**: Kong Gateway distributes traffi

c

- **Health Checks**: Automated service health monitorin

g

#

# Monitoring & Observabilit

y

#

## Application Monitoring

- **Chrome DevTools**: Integrated performance monitorin

g

- **OpenTelemetry**: Distributed tracing and metric

s

- **Prometheus**: Metrics collection and alertin

g

- **Grafana**: Visualization and dashboard

s

#

## Infrastructure Monitoring

- **Docker Health Checks**: Container-level monitorin

g

- **Resource Usage**: CPU, memory, and disk monitorin

g

- **Log Aggregation**: Centralized logging with Lok

i

#

# Development Workflo

w

#

## Local Development

1. **Clone Repository**: Single repository for entire platfo

r

m

2. **Install Dependencies**: `npm install` (handles all workspace

s

)

3. **Start Services**: `npm run de

v

`

4. **Access Applications**: All services available on localho

s

t

#

## Code Organization

- **Monorepo Structure**: All services in single repositor

y

- **Workspace Management**: npm workspaces for dependency managemen

t

- **Shared Libraries**: Common code in `packages/` and `shared/

`

This unified architecture provides a scalable, maintainable, and feature-rich platform for AI-powered workflow automation in the automotive industry

.
