# RelayCore and Auterity Integration Architecture

## 1. System Overview

### RelayCore
RelayCore is a universal HTTP relay service that connects external tools to AI model endpoints. It provides:
- Smart routing through the Steering Rule Engine
- Cost optimization
- Context injection
- Plug-and-play agent interoperability

Key components:
- **Steering Rule Engine**: YAML-based rule system for routing requests
- **HTTP Proxy**: Handles incoming requests and routes them to appropriate providers
- **Caching System**: Redis-based with semantic caching capabilities
- **Analytics**: Tracks usage, costs, and performance metrics
- **Batch Processing**: Handles batch requests efficiently

### Auterity
Auterity includes the Kiro error intelligence system that handles:
- Error routing based on type (validation/runtime/ai_service/system)
- Permission-based access control (admin/operator/guest)
- Slack integration for system errors
- Real-time status indicators in UI

Key components:
- **Backend**: FastAPI-based Python application
- **Frontend**: React-based UI
- **Kiro System**: Error intelligence and management

## 2. Integration Architecture

```
┌─────────────────┐                  ┌─────────────────┐
│                 │                  │                 │
│    RelayCore    │◄────────────────►│    Auterity     │
│                 │                  │                 │
└────────┬────────┘                  └────────┬────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│  Steering Rule  │                  │   Kiro Error    │
│     Engine      │───────────────►  │  Intelligence   │
└─────────────────┘                  └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│   HTTP Proxy    │                  │  Error Routing  │
│    Service      │                  │     System      │
└─────────────────┘                  └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│ AI Model Router │                  │ Agent Framework │
│                 │◄────────────────►│  (Porter/Driver)│
└─────────────────┘                  └─────────────────┘
```

## 3. Integration Points

### Error Handling Flow
1. RelayCore's Steering Rule Engine detects errors in requests or responses
2. Errors are categorized and enriched with context
3. Errors are sent to Auterity's Kiro system via API
4. Kiro routes errors based on type and severity
5. Appropriate notifications are triggered (UI, Slack, etc.)
6. Error metrics are collected for analytics

### Observability Data Sharing
1. RelayCore collects metrics on:
   - Request volume
   - Token usage
   - Model performance
   - Cost data
2. Auterity collects metrics on:
   - Error rates
   - Agent performance
   - System health
3. Shared metrics are combined in a unified dashboard
4. Joint analytics provide insights across the entire system

### Agent Context Sharing
1. Auterity agents (Porter/Driver) require specific models or capabilities
2. Agent requirements are translated into RelayCore steering rules
3. RelayCore routes agent requests to appropriate models
4. Response quality and performance metrics flow back to agents

## 4. Charkoal Visual Mapping

Charkoal will be used to create visual representations of:

1. **RelayCore Routing Flow**:
   - Incoming request → YAML rule engine → Provider/model selector → Response

2. **Porter + Driver Agent Flows**:
   - Porter → Task Parser → Driver → Model Runner → Logger

3. **Steering Rules to Agent Contexts**:
   - Connection maps from Auterity agents to RelayCore routing logic

4. **Shared Observability**:
   - Token usage → Model hit rates → Caching layer effectiveness