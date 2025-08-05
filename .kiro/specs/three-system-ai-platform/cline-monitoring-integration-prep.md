# [CLINE-TASK] Monitoring Integration Preparation

## Task Overview
Prepare the monitoring infrastructure integration components for the three-system AI platform, focusing on Prometheus metrics collection, Grafana dashboard components, and unified monitoring interfaces.

## Component Specifications

### 1. Prometheus Metrics Endpoints

#### AutoMatrix Backend Metrics Endpoint
**File**: `backend/app/api/metrics.py`
```python
from fastapi import APIRouter
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from starlette.responses import Response

# Metrics definitions
workflow_executions = Counter('autmatrix_workflow_executions_total', 'Total workflow executions', ['status', 'template'])
workflow_duration = Histogram('autmatrix_workflow_duration_seconds', 'Workflow execution duration')
active_workflows = Gauge('autmatrix_active_workflows', 'Currently active workflows')
ai_requests = Counter('autmatrix_ai_requests_total', 'Total AI requests', ['provider', 'model'])
```

#### RelayCore Metrics Endpoint
**File**: `systems/relaycore/src/routes/metrics.ts`
```typescript
import { Router } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';

const router = Router();

// Metrics definitions
const aiRequests = new Counter({
  name: 'relaycore_ai_requests_total',
  help: 'Total AI requests routed',
  labelNames: ['provider', 'model', 'status']
});
```

#### NeuroWeaver Metrics Endpoint
**File**: `systems/neuroweaver/backend/app/api/metrics.py`
```python
from fastapi import APIRouter
from prometheus_client import Counter, Histogram, Gauge

# Model-specific metrics
model_inferences = Counter('neuroweaver_model_inferences_total', 'Total model inferences', ['model_id', 'specialization'])
training_jobs = Gauge('neuroweaver_training_jobs_active', 'Active training jobs')
```

### 2. Unified Monitoring Dashboard Components

#### System Health Overview Component
**File**: `frontend/src/components/monitoring/SystemHealthOverview.tsx`
```typescript
interface SystemHealthProps {
  systems: Array<{
    name: 'autmatrix' | 'relaycore' | 'neuroweaver';
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    responseTime: number;
    errorRate: number;
  }>;
  refreshInterval?: number;
}

export const SystemHealthOverview: React.FC<SystemHealthProps> = ({ systems, refreshInterval = 30000 }) => {
  // Component implementation
};
```

#### Cross-System Metrics Dashboard
**File**: `frontend/src/components/monitoring/CrossSystemMetrics.tsx`
```typescript
interface CrossSystemMetricsProps {
  timeRange: '1h' | '6h' | '24h' | '7d';
  systems: string[];
  metrics: {
    requests: MetricData[];
    latency: MetricData[];
    errors: MetricData[];
    costs: MetricData[];
  };
}
```

### 3. API Integration Points

#### Monitoring API Client
**File**: `frontend/src/api/monitoring.ts`
```typescript
export interface SystemMetrics {
  system: string;
  timestamp: Date;
  metrics: {
    requests_per_second: number;
    average_latency_ms: number;
    error_rate: number;
    active_connections: number;
    cpu_usage: number;
    memory_usage: number;
  };
}

export const monitoringApi = {
  getSystemMetrics: (system: string, timeRange: string): Promise<SystemMetrics[]> => {},
  getAggregatedMetrics: (systems: string[], timeRange: string): Promise<AggregatedMetrics> => {},
  getAlerts: (): Promise<Alert[]> => {},
  acknowledgeAlert: (alertId: string): Promise<void> => {}
};
```

## Styling Requirements
- Use existing Tailwind CSS patterns from AutoMatrix
- Consistent with current dashboard styling in `frontend/src/components/UnifiedMonitoringDashboard.tsx`
- Responsive design for mobile and desktop
- Dark/light theme support following existing patterns

## Error Handling Requirements
- Network timeout handling for metrics collection
- Graceful degradation when systems are unavailable
- Retry logic for failed metric requests
- User-friendly error messages for monitoring failures
- Fallback to cached data when real-time data unavailable

## Integration Requirements
- Compatible with existing Prometheus configuration in `monitoring/prometheus/prometheus.yml`
- Integrate with current authentication system
- Support for real-time updates via WebSocket connections
- Export capabilities for metrics data

## Success Criteria
- [ ] All three systems expose `/metrics` endpoints in Prometheus format
- [ ] Frontend components can display unified monitoring data
- [ ] Real-time updates work without performance issues
- [ ] Error states are handled gracefully
- [ ] Components are fully typed with TypeScript
- [ ] Integration tests pass for all monitoring endpoints

## Technical Context
- Reference existing monitoring patterns in `frontend/src/components/UnifiedMonitoringDashboard.tsx`
- Use established API client patterns from `frontend/src/api/`
- Follow component structure from `frontend/src/components/`
- Integrate with existing authentication from `backend/app/api/auth.py`

## Files to Create/Modify
1. `backend/app/api/metrics.py` - AutoMatrix metrics endpoint
2. `systems/relaycore/src/routes/metrics.ts` - RelayCore metrics endpoint  
3. `systems/neuroweaver/backend/app/api/metrics.py` - NeuroWeaver metrics endpoint
4. `frontend/src/components/monitoring/SystemHealthOverview.tsx` - Health overview component
5. `frontend/src/components/monitoring/CrossSystemMetrics.tsx` - Metrics dashboard
6. `frontend/src/api/monitoring.ts` - Enhanced monitoring API client
7. `frontend/src/types/monitoring.ts` - TypeScript definitions for monitoring

## Priority
High - Required for production monitoring and system observability

## Estimated Time
6-8 hours

## Dependencies
- Prometheus configuration already created
- Existing monitoring dashboard components as reference
- Authentication system for secure metrics access