

# 📬 Event System & Message Pattern

s

#

# Overvie

w

Defines platform-wide eventing standards: topics/queues, message schema, delivery semantics, retries/DLQ, idempotency, ordering, and schema governance

.

#

# Architectur

e

```mermaid
graph TD
  subgraph Producers
    A[Frontend Apps]
    B[Core Services]
    C[AI Services]
  end
  subgraph Event Fabric
    K[Kafka Topics]
    R[RabbitMQ Queues]
    S[Schema Registry]
  end
  subgraph Consumers
    D[Workflow Engine]
    E[Analytics]
    F[Notification]
    G[Caching Invalidation]
  end
  A --> K

  B --> K

  C --> R

  K --> D

  K --> E

  R --> F

  K --> G

  S --

- K

```

#

# Message Schem

a

```

json
{
  "id": "uuid",
  "type": "event.name.v1",
  "occurred_at": "2025-01-01T00:00:00Z",

  "source": "service-name",

  "correlation_id": "uuid",
  "trace_id": "traceid",
  "payload": {"...": "..."},
  "metadata": {"partition_key": "entity-123", "tenant_id": "t1"}

}

```

- type: dotted lower-case with version suffi

x

- correlation_id and trace_id required for observabilit

y

- metadata used for routing and tenanc

y

#

# Delivery Semantic

s

- At-least-once by default; consumers must be idempoten

t

- Exactly-once with Kafk

a

 + transactional outbo

x

 + consumer offsets stored with stat

e

- Ordering by partition_key; no global ordering guarantee

s

#

# Reliabilit

y

- Retries with exponential backof

f

- Dead Letter Queue (DLQ) after N attempts with error contex

t

- Poison-pill detection and quarantin

e

#

# Pattern

s

#

## Outbox Pattern

Service writes event to local outbox within the same transaction as state change; a relay publishes to Kafka to prevent lost events.

#

## SAGA (Process Manager)

Use orchestration for multi-step workflows; employ compensating actions for failure paths

.

#

## Event Sourcing (Selective)

For high-audit domains, use append-only streams with snapshotting

.

#

# Topic/Queue Convention

s

- Kafka topics: `domain.entity.event.v1` (e.g., `workflow.instance.started.v1`

)

- Rabbit queues: `service.action.priority` (e.g., `notify.email.high`

)

- Partitions decided by entity key for localit

y

#

# Idempotenc

y

```

typescript
interface IdempotencyKeyStore {
  has(key: string): Promise<boolean>;
  put(key: string, ttlSeconds: number): Promise<void>;
}

```

Consumers must guard side effects with idempotency keys derived from message `id`.

#

# Error Handling Contrac

t

```

json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing field x",
    "details": {"field": "x"}
  }
}

```

Attach last error to DLQ entry along with headers and attempt count.

#

# Schema Governanc

e

- All schemas registered; backward-compatible evolution enforce

d

- Use additive changes; breaking changes require new `.vN

`

- CI checks: schema diff gates; contract tests for critical consumer

s

#

# Observabilit

y

- Emit `event.processed` and `event.failed` metrics with `trace_id

`

- Traces: producer -> broker -> consumer; propagate `trace_id` heade

r

- Dashboards: throughput, lag, DLQ rate, processing latenc

y

#

# Securit

y

- Per-topic ACLs; tenant scoping in metadat

a

- PII classification in schema; encryption where require

d

#

# Related Documentatio

n

- Message Queue Architectur

e

- Cross System Protoco

l

- Monitoring Documentatio

n
