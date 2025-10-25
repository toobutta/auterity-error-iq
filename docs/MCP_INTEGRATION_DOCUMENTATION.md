

# 🧩 MCP Orchestrator Integratio

n

#

# Overvie

w

This document describes the MCP (Model/Capability/Control) orchestrator integration across backend and frontend, including schemas, APIs, and flows.

> **📋 Note**: For the complete MCP specification including all features, APIs, schemas, and implementation details, see the [MCP Comprehensive Specification](./MCP_COMPREHENSIVE_SPECIFICATION.md)

.

#

# Component

s

- Backend

:

  - `services/api/src/app/api/mcp_routes.py

`

  - `services/api/src/app/services/mcp_server_manager.py

`

  - `services/api/src/app/models/mcp_server.py

`

  - Alembic migrations adding MCP table

s

- Systems

:

  - `systems/mcp/orchestrator.ts` (node-based tools/workflows

)

- Frontend

:

  - `src/services/mcpProtocolService.ts

`

#

# APIs (Conceptual

)

- `GET /api/v1/mcp/servers` — list server

s

- `POST /api/v1/mcp/servers` — register serve

r

- `POST /api/v1/mcp/execute` — execute MCP tool/capabilit

y

#

# Flo

w

```mermaid
sequenceDiagram
  participant UI as Frontend
  participant API as MCP API
  participant MGR as MCP Manager
  participant SRV as MCP Server

  UI->>API: Execute(tool, params)

  API->>MGR: Resolve server & route

  MGR->>SRV: Invoke

  SRV-->>MGR: Result

  MGR-->>API: Payload

  API-->>UI: Respons

e

```

#

# Storage & Model

s

- Servers, capabilities, executions with audit metadat

a

#

# Securit

y

- Per-tool RBAC, input validation, rate limit

s

