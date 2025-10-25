#!/bin/bash

# Monitoring Setup Script for Auterity Error IQ
# Sets up comprehensive monitoring and alerting

set -euo pipefail

# Configuration
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-"admin123"}
ALERT_EMAIL=${ALERT_EMAIL:-"admin@example.com"}
SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create Grafana dashboards
create_grafana_dashboards() {
    log_info "Creating Grafana dashboards..."

    mkdir -p monitoring/grafana/dashboards

    # Workflow Performance Dashboard
    cat > monitoring/grafana/dashboards/workflow-performance.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Workflow Performance Dashboard",
    "tags": ["workflows", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Workflow Execution Times",
        "type": "graph",
        "targets": [
          {
            "expr": "workflow_execution_duration_seconds",
            "legendFormat": "{{workflow_name}}"
          }
        ],
        "yAxes": [
          {
            "label": "Duration (seconds)",
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(workflow_executions_total{status=\"success\"}[5m]) / rate(workflow_executions_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Active Workflows",
        "type": "stat",
        "targets": [
          {
            "expr": "workflow_active_count",
            "legendFormat": "Active Workflows"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF

    # CI/CD Performance Dashboard
    cat > monitoring/grafana/dashboards/cicd-performance.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "CI/CD Performance Dashboard",
    "tags": ["cicd", "github", "performance"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Build Duration Trends",
        "type": "graph",
        "targets": [
          {
            "expr": "github_workflow_duration_seconds",
            "legendFormat": "{{workflow_name}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Cache Hit Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "github_cache_hit_rate * 100",
            "legendFormat": "Cache Hit Rate %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Deployment Frequency",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(github_deployments_total[1d])",
            "legendFormat": "Deployments per day"
          }
        ]
      }
    ]
  }
}
EOF

    log_success "Grafana dashboards created"
}

# Create Prometheus alerts
create_prometheus_alerts() {
    log_info "Creating Prometheus alert rules..."

    mkdir -p monitoring/prometheus/rules

    cat > monitoring/prometheus/rules/workflow-alerts.yml << EOF
groups:
  - name: workflow.rules
    rules:
      - alert: WorkflowHighFailureRate
        expr: rate(workflow_executions_total{status="failed"}[5m]) / rate(workflow_executions_total[5m]) > 0.1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High workflow failure rate detected"
          description: "Workflow failure rate is {{ \$value | humanizePercentage }} over the last 5 minutes"

      - alert: WorkflowExecutionTimeout
        expr: workflow_execution_duration_seconds > 300
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Workflow execution timeout"
          description: "Workflow {{ \$labels.workflow_name }} has been running for {{ \$value }} seconds"

      - alert: CIWorkflowSlowdown
        expr: github_workflow_duration_seconds > 1800
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CI workflow performance degradation"
          description: "CI workflow {{ \$labels.workflow_name }} took {{ \$value }} seconds to complete"

      - alert: LowCacheHitRate
        expr: github_cache_hit_rate < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate detected"
          description: "Cache hit rate is {{ \$value | humanizePercentage }}, consider reviewing cache configuration"
EOF

    log_success "Prometheus alert rules created"
}

# Create Alertmanager configuration
create_alertmanager_config() {
    log_info "Creating Alertmanager configuration..."

    mkdir -p monitoring/alertmanager

    cat > monitoring/alertmanager/alertmanager.yml << EOF
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@auterity.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    email_configs:
      - to: '${ALERT_EMAIL}'
        subject: 'Auterity Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
EOF

    if [[ -n "$SLACK_WEBHOOK" ]]; then
        cat >> monitoring/alertmanager/alertmanager.yml << EOF
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#alerts'
        title: 'Auterity Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
EOF
    fi

    log_success "Alertmanager configuration created"
}

# Setup monitoring stack
setup_monitoring_stack() {
    log_info "Setting up monitoring stack..."

    # Create monitoring docker-compose override
    cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    volumes:
      - ./monitoring/prometheus/rules:/etc/prometheus/rules:ro
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'

  grafana:
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro

  alertmanager:
    volumes:
      - ./monitoring/alertmanager:/etc/alertmanager:ro
EOF

    log_success "Monitoring stack configuration created"
}

# Create monitoring scripts
create_monitoring_scripts() {
    log_info "Creating monitoring utility scripts..."

    # Health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Comprehensive health check script

check_service() {
    local service=$1
    local url=$2
    local expected_code=${3:-200}

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_code"; then
        echo "✅ $service is healthy"
        return 0
    else
        echo "❌ $service is unhealthy"
        return 1
    fi
}

echo "🔍 Running health checks..."

# Core services
check_service "Backend API" "http://localhost:8080/api/health"
check_service "Frontend" "http://localhost:3000"
check_service "Prometheus" "http://localhost:9090/-/healthy"
check_service "Grafana" "http://localhost:3001/api/health"
check_service "AlertManager" "http://localhost:9093/-/healthy"

# Database
if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is unhealthy"
fi

# Redis
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is unhealthy"
fi

echo "🏁 Health check completed"
EOF

    chmod +x scripts/health-check.sh

    # Performance monitoring script
    cat > scripts/monitor-performance.sh << 'EOF'
#!/bin/bash

# Performance monitoring script

echo "📊 System Performance Report"
echo "============================"

# CPU and Memory
echo "💻 System Resources:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Disk usage
echo -e "\n💾 Disk Usage:"
df -h | grep -E "(Filesystem|/dev/)"

# Network
echo -e "\n🌐 Network Connections:"
netstat -tuln | grep -E "(8080|3000|9090|3001)" | head -10

# Docker containers
echo -e "\n🐳 Container Status:"
docker-compose ps

# Recent logs
echo -e "\n📝 Recent Error Logs:"
docker-compose logs --tail=5 backend frontend | grep -i error || echo "No recent errors found"

echo -e "\n✅ Performance report completed"
EOF

    chmod +x scripts/monitor-performance.sh

    log_success "Monitoring scripts created"
}

# Main setup function
main() {
    log_info "Setting up comprehensive monitoring for Auterity Error IQ..."

    create_grafana_dashboards
    create_prometheus_alerts
    create_alertmanager_config
    setup_monitoring_stack
    create_monitoring_scripts

    log_success "🎯 Monitoring setup completed!"

    echo ""
    echo "Next steps:"
    echo "1. Start monitoring stack: docker-compose -f docker-compose.unified.yml -f docker-compose.monitoring.yml up -d"
    echo "2. Access Grafana: http://localhost:3001 (admin/${GRAFANA_ADMIN_PASSWORD})"
    echo "3. Import dashboards from monitoring/grafana/dashboards/"
    echo "4. Configure alert channels in Grafana"
    echo "5. Run health check: ./scripts/health-check.sh"
    echo "6. Monitor performance: ./scripts/monitor-performance.sh"
}

# Execute main function
main "$@"
