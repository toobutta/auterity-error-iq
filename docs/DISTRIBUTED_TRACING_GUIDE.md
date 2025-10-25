

# 🔎 Distributed Tracing Guide (Jaeger

)

#

# Overvie

w

End-to-end tracing for requests across gateway, services, and workers

.

#

# Instrumentatio

n

- Propagate trace/span IDs via headers (W3C Trace Context

)

- Wrap async tasks with span contex

t

- Annotate spans with domain tags (tenant, workflow_id

)

#

# Collection & Dashboard

s

- Export to Jaeger; link traces from logs (Loki

)

- Grafana panels for p95 latency and error hotpath

s

#

# Best Practice

s

- Sample rates per-route; increase for erroring endpoint

s

- Redact sensitive data in span attribute

s

