# [CLINE-TASK] RelayCore Admin Interface Foundation

**Priority**: 🟡 HIGH - NEW STRATEGIC FEATURE
**Assigned Tool**: Cline
**Status**: Ready after TASK-001 completion
**Dependencies**: TypeScript compliance must be resolved first
**Estimated Effort**: 6-8 hours

## Task Overview

Build comprehensive RelayCore admin interface with real-time metrics, cost analytics, and management capabilities.

## Business Context

RelayCore is the AI routing and cost optimization system. This admin interface provides operational visibility and management capabilities for AI model routing, cost tracking, and performance monitoring.

## Technical Requirements

### Core Components to Build

1. **AI Routing Dashboard** - Real-time metrics and routing status
2. **Cost Analytics Interface** - Budget tracking and forecasting
3. **Steering Rules Management** - Visual rule builder
4. **Model Management** - Configuration wizard
5. **Real-Time Monitoring** - WebSocket updates every 5 seconds

### Architecture Requirements

- Use shared foundation components from `shared/components/`
- Implement automotive theming consistency
- Type-safe API integration with unified client
- Responsive design for all screen sizes
- WebSocket real-time updates

## Pre-Development Tasks for Cline

### 1. Foundation Analysis

```bash
# Analyze shared foundation components
find shared/components/ -name "*.tsx" -exec echo "=== {} ===" \; -exec head -20 {} \;

# Check existing API client patterns
find frontend/src/api/ -name "*.ts" -exec echo "=== {} ===" \; -exec head -10 {} \;

# Review automotive theming
cat frontend/tailwind.config.js
cat frontend/src/App.css | grep -A 10 -B 10 "automotive\|theme"
```

### 2. Component Architecture Planning

Analyze existing patterns for:

- Dashboard layouts and grid systems
- Real-time data display components
- Form builders and configuration wizards
- Chart and analytics components
- WebSocket integration patterns

### 3. API Integration Analysis

```bash
# Check existing API endpoints
grep -r "api/" frontend/src/ --include="*.ts" --include="*.tsx" | head -20

# Analyze API client structure
cat frontend/src/api/client.ts 2>/dev/null || echo "API client not found"
```

### 4. Dependency Assessment

```bash
# Check for WebSocket libraries
npm list ws socket.io-client @types/ws

# Verify chart libraries
npm list recharts chart.js react-chartjs-2

# Check form libraries
npm list react-hook-form formik
```

## Component Specifications

### 1. RelayCore Dashboard Layout (`RelayCoreDashboard.tsx`)

```typescript
interface RelayCoreDashboardProps {
  refreshInterval?: number; // Default 5000ms
  showCostAnalytics?: boolean;
  showModelManagement?: boolean;
}

// Layout: 4-column grid with responsive breakpoints
// Components: StatusIndicator, MetricCard, SystemBadge from shared/
```

### 2. AI Routing Metrics (`AIRoutingMetrics.tsx`)

```typescript
interface AIRoutingMetricsProps {
  models: AIModel[];
  routingStats: RoutingStatistics;
  realTimeUpdates: boolean;
}

// Real-time metrics: requests/sec, success rate, avg response time
// Visual indicators: traffic distribution, model health status
```

### 3. Cost Analytics Interface (`CostAnalytics.tsx`)

```typescript
interface CostAnalyticsProps {
  timeRange: TimeRange;
  budgetLimits: BudgetConfig;
  costData: CostMetrics[];
}

// Features: spend tracking, budget alerts, cost forecasting
// Charts: line charts for trends, pie charts for distribution
```

### 4. Steering Rules Builder (`SteeringRulesBuilder.tsx`)

```typescript
interface SteeringRulesBuilderProps {
  existingRules: SteeringRule[];
  onRuleCreate: (rule: SteeringRule) => void;
  onRuleUpdate: (id: string, rule: SteeringRule) => void;
}

// Visual rule builder with drag-and-drop conditions
// Rule types: routing, cost limits, performance thresholds
```

### 5. Model Management Wizard (`ModelManagementWizard.tsx`)

```typescript
interface ModelManagementWizardProps {
  availableModels: AIModelProvider[];
  currentConfig: ModelConfiguration;
  onConfigUpdate: (config: ModelConfiguration) => void;
}

// Multi-step wizard: provider selection, configuration, testing
// Features: model testing, performance benchmarking
```

## File Structure to Create

```
frontend/src/pages/relaycore/
├── RelayCoreDashboard.tsx           # Main dashboard layout
├── components/
│   ├── AIRoutingMetrics.tsx         # Real-time routing metrics
│   ├── CostAnalytics.tsx           # Cost tracking and analytics
│   ├── SteeringRulesBuilder.tsx    # Visual rule builder
│   ├── ModelManagementWizard.tsx   # Model configuration wizard
│   ├── RealTimeMonitor.tsx         # WebSocket monitoring
│   └── __tests__/
│       ├── RelayCoreDashboard.test.tsx
│       ├── AIRoutingMetrics.test.tsx
│       ├── CostAnalytics.test.tsx
│       ├── SteeringRulesBuilder.test.tsx
│       └── ModelManagementWizard.test.tsx
├── hooks/
│   ├── useRelayCore.ts             # RelayCore API integration
│   ├── useWebSocket.ts             # Real-time updates
│   └── useCostAnalytics.ts         # Cost data management
└── types/
    ├── relaycore.types.ts          # RelayCore-specific types
    └── cost-analytics.types.ts     # Cost and analytics types
```

## API Integration Requirements

### Expected Endpoints (to be created/verified)

```typescript
// RelayCore API endpoints
GET / api / relaycore / status; // System status and health
GET / api / relaycore / metrics; // Real-time metrics
GET / api / relaycore / models; // Available AI models
GET / api / relaycore / routing - rules; // Current routing rules
POST / api / relaycore / routing - rules; // Create/update rules
GET / api / relaycore / cost - analytics; // Cost data and analytics
WebSocket / ws / relaycore / live; // Real-time updates
```

### Type Definitions Needed

```typescript
interface AIModel {
  id: string;
  provider: string;
  name: string;
  status: "active" | "inactive" | "error";
  costPerToken: number;
  avgResponseTime: number;
  successRate: number;
}

interface RoutingStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  modelDistribution: Record<string, number>;
}

interface CostMetrics {
  timestamp: Date;
  totalCost: number;
  costByModel: Record<string, number>;
  requestCount: number;
  budgetUtilization: number;
}
```

## Implementation Strategy

### Phase 1: Foundation Setup (1 hour)

1. Create file structure and basic components
2. Set up TypeScript interfaces and types
3. Establish API client integration patterns
4. Configure WebSocket connection management

### Phase 2: Core Components (3-4 hours)

1. Build RelayCoreDashboard layout with shared components
2. Implement AIRoutingMetrics with real-time data
3. Create CostAnalytics with chart integration
4. Develop basic SteeringRulesBuilder interface

### Phase 3: Advanced Features (2-3 hours)

1. Complete ModelManagementWizard with multi-step flow
2. Implement WebSocket real-time updates
3. Add responsive design and mobile optimization
4. Integrate with existing authentication system

### Phase 4: Testing & Polish (1 hour)

1. Write comprehensive unit tests
2. Test WebSocket connections and error handling
3. Validate responsive design across screen sizes
4. Performance optimization and bundle size check

## Success Criteria

✅ Functional admin interface with live data display
✅ Real-time metrics updating every 5 seconds via WebSocket
✅ Cost analytics with interactive charts and budget tracking
✅ Steering rules visual builder with drag-and-drop functionality
✅ Model management wizard with configuration and testing
✅ <2 second response times for all interactions
✅ Responsive design working on mobile and desktop
✅ 90%+ test coverage for all components
✅ TypeScript compliance with zero 'any' types

## Quality Gates

- **TypeScript**: Strict typing with proper interfaces
- **Performance**: <2s load time, <100ms interaction response
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Testing**: Unit tests with mocking for API calls and WebSocket
- **Responsive**: Mobile-first design with breakpoint testing

## Dependencies

- **Blocking**: TASK-001 (TypeScript compliance) must be complete
- **Shared Components**: StatusIndicator, MetricCard, SystemBadge
- **API Client**: Unified API client from frontend/src/api/
- **WebSocket**: Real-time connection management
- **Charts**: Recharts or similar for data visualization

## Context Files to Reference

- `shared/components/` - Foundation components to use
- `frontend/src/api/` - Existing API patterns
- `frontend/src/types/` - Existing type definitions
- `frontend/tailwind.config.js` - Theming configuration
- `frontend/src/pages/` - Existing page layout patterns

## Handback Criteria

Task is complete when:

1. All components render without errors
2. WebSocket connections establish and update data
3. Cost analytics display accurate data with charts
4. Steering rules builder allows rule creation/editing
5. Model management wizard completes configuration flow
6. All tests pass with 90%+ coverage
7. Responsive design validated on multiple screen sizes
8. Performance metrics meet <2s response time requirement
