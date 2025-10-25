

# Monitoring Setu

p

#

# Access URL

s

- **Grafana**: http://localhost:3003 (admin/admin123

)

- **Prometheus**: http://localhost:909

0

- **Jaeger**: http://localhost:1668

6

- **Kafka UI**: http://localhost:808

0

- **MLflow**: http://localhost:500

0

#

# Key Metric

s

#

## Application Metric

s

- Request latency (95th percentile

)

- Error rate (4xx/5xx responses

)

- Throughput (requests/second

)

- Active connection

s

#

## Infrastructure Metric

s

- CPU usage per servic

e

- Memory consumptio

n

- Disk I/

O

- Network traffi

c

#

## Business Metric

s

- Workflow execution tim

e

- Success/failure rate

s

- AI model performanc

e

- User activit

y

#

# Alerts Configuratio

n

```yaml

# High error rate

- alert: HighErrorRate

  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.

1

# High latency

- alert: HighLatency

  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1.

0

# Service down

- alert: ServiceDown

  expr: up == 0

```

#

# Dashboard Setu

p

1. Import Grafana dashboards from `monitoring/grafana/dashboards/

`

2. Configure Prometheus data sourc

e

3. Set up Loki for log aggregatio

n

4. Enable Jaeger tracin

g

#

# Log Aggregatio

n

- All container logs → Promtail → Lok

i

- Structured JSON loggin

g

- Correlation IDs for tracin

g

- Log retention: 30 day

s
