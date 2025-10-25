

# 🧑‍⚖️ Human Layer & MLflow Integratio

n

#

# Overvie

w

Guidance for incorporating human-in-the-loop review, approvals, and interventions with MLflow-powered experiment and model tracking

.

#

# Component

s

- Frontend: `src/services/humanLayerService.ts`, `src/services/humanlayerMLflowIntegration.ts`, `frontend/src/components/humanlayer-mlflow/HumanLayerMLflowDashboard.tsx

`

- Backend: approval queues, audit logs, MLflow tracking serve

r

#

# Flow

s

```mermaid
sequenceDiagram
  participant UI as Human Layer UI
  participant API as Human Layer API
  participant Q as Approval Queue
  participant M as MLflow

  UI->>API: Submit item for review

  API->>Q: Enqueue

  UI->>API: List pending items

  API-->>UI: Item

s

 + model metadata

  API->>M: Read metrics/artifacts

  UI->>API: Approve/Reject with reason

  API-->>UI: Persist decisio

n

 + audi

t

```

#

# Policies & Audi

t

- Per-role approval threshold

s

- Reason capture, immutable log

s

- SLA timers and escalatio

n

#

# U

I

- Dashboard linking model runs (metrics, params, artifacts) to review task

s

- Filters: risk, impact, freshnes

s

