

# 🪪 Process Mining Documentatio

n

#

# Overvie

w

Documentation for the Process Mining dashboard and services: extracting, transforming, and analyzing event logs to derive process models, KPIs, and optimization insights.

#

# Component

s

- Frontend: `frontend/src/components/process-mining/ProcessMiningDashboard.tsx

`

- Frontend services: `frontend/src/services/processMiningService.ts

`

- Backend services: process mining engine (API: `/api/v1/process-mining/*`

)

#

# Data Flo

w

```mermaid
sequenceDiagram
  participant UI as Dashboard
  participant API as Process Mining API
  participant ENG as Mining Engine
  participant DB as Event Store

  UI->>API: POST /analyze (parameters)

  API->>ENG: Start job

  ENG->>DB: Read event logs

  ENG-->>API: Results (model, KPIs, variants)

  API-->>UI: Renderable payloa

d

```

#

# Feature

s

- Event log ingestion and schema mappin

g

- Model discovery (e.g., variants, bottlenecks, throughput

)

- Conformance checkin

g

- What-if analysis and recommendation

s

#

# Payloads (Conceptual

)

```

json
{
  "model": { "nodes": [], "edges": [] },
  "kpis": { "cycle_time_avg": 1234, "throughput": 56 },
  "variants": [ {"path": ["A","B","C"], "count": 120} ],
  "bottlenecks": [ {"node": "B", "wait_ms": 45000} ]
}

```

#

# UI Consideration

s

- Graph visualization (zoom/pan), node/edge insight

s

- Variant table with filters and searc

h

- KPI cards and trend chart

s

