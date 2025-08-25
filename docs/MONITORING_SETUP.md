# Monitoring Setup

## Access URLs

- **Grafana**: http://localhost:3003 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Jaeger**: http://localhost:16686
- **Kafka UI**: http://localhost:8080
- **MLflow**: http://localhost:5000

## Key Metrics

### Application Metrics

- Request latency (95th percentile)
- Error rate (4xx/5xx responses)
- Throughput (requests/second)
- Active connections

### Infrastructure Metrics

- CPU usage per service
- Memory consumption
- Disk I/O
- Network traffic

### Business Metrics

- Workflow execution time
- Success/failure rates
- AI model performance
- User activity

## Alerts Configuration

```yaml
# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1

# High latency
- alert: HighLatency
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1.0

# Service down
- alert: ServiceDown
  expr: up == 0
```

## Dashboard Setup

1. Import Grafana dashboards from `monitoring/grafana/dashboards/`
2. Configure Prometheus data source
3. Set up Loki for log aggregation
4. Enable Jaeger tracing

## Log Aggregation

- All container logs → Promtail → Loki
- Structured JSON logging
- Correlation IDs for tracing
- Log retention: 30 days
