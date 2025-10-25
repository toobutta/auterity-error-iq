

# 🔗 Data Connectors & Querying for Analytic

s

#

# Overvie

w

How to configure, query, and monitor external/internal data sources powering dashboards and bespoke analytics.

#

# Frontend Clien

t

Location: `frontend/src/api/data-connectors.ts

`

Capabilities:

- Manage connections (create, update, delete, test

)

- Execute queries per-connectio

n

- Inspect schemas and supported type

s

- Bulk health checks and analytic

s

#

# Supported Connector Type

s

`rest_api`, `postgresql`, `mysql`, `mongodb`, `redis`, `elasticsearch`, `s3`, `bigquery`, `snowflake`, `kafka`, `websocket`, `file_upload`

#

# Typical Flo

w

1) Create or select a connection
2) Validate config with `validateConnectionConfig`
3) Execute query via `executeQuery`
4) Normalize results to chart/table shapes

#

# Exampl

e

```ts
const { data } = await executeQuery(connId, 'SELECT ts, value FROM metrics WHERE ts > NOW()

 - INTERVAL 1 DAY');

const chartData = data.rows.map((r: any) => ({ x: r.ts, y: r.value }));

```

#

# Health & Monitorin

g

- `getConnectionHealth` for per-connection statu

s

- `bulkTestConnections` for fleet check

s

- `getConnectorAnalytics` for usage distributio

n

#

# Securit

y

- Store secrets server-side; never commit credential

s

- Enforce RBAC per-connection and per-operatio

n

