# [CLINE-TASK] RelayCore Admin Interface Implementation

## Task Assignment

**Assigned Tool**: Cline
**Priority**: High
**Estimated Time**: 3-4 hours
**Task ID**: Component Development - RelayCore Admin Interface
**Dependencies**: Amazon Q must fix file corruption first

## Component Overview

Implement a comprehensive RelayCore administration interface for managing AI routing, provider configurations, budget tracking, and system monitoring.

## Props Interface

```typescript
interface RelayCoreAdminInterfaceProps {
  onBudgetUpdate: (budget: number) => void;
  onProviderChange: (provider: string) => void;
}

interface ProviderStatus {
  name: string;
  status: "online" | "offline" | "degraded";
  responseTime: number;
  errorRate: number;
  costPerToken: number;
  modelsAvailable: string[];
}

interface BudgetMetrics {
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  dailySpend: number;
  projectedMonthlySpend: number;
}

interface SystemMetrics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  activeConnections: number;
  uptime: number;
}
```

## API Integration Details

- **Endpoints**:
  - `GET /api/v1/relaycore/providers` - Provider status and metrics
  - `GET /api/v1/relaycore/budget` - Budget tracking data
  - `GET /api/v1/relaycore/metrics` - System performance metrics
  - `POST /api/v1/relaycore/providers/{id}/toggle` - Enable/disable providers
  - `PUT /api/v1/relaycore/budget` - Update budget limits

## Styling Requirements

- **Framework**: Tailwind CSS with existing design system
- **Layout**: Grid-based responsive design
- **Components**: Use existing shared components from `shared/components/`
- **Icons**: Lucide React icons (TrendingUp, Users, Server, Shield, etc.)
- **Theme**: Follow existing AutoMatrix color scheme and typography

## Component Structure

### 1. Provider Management Section

```typescript
// Provider status cards with real-time updates
const ProviderCard = ({ provider }: { provider: ProviderStatus }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">{provider.name}</h3>
      <StatusIndicator status={provider.status} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <MetricCard label="Response Time" value={`${provider.responseTime}ms`} />
      <MetricCard label="Error Rate" value={`${provider.errorRate}%`} />
      <MetricCard label="Cost/Token" value={formatCurrency(provider.costPerToken)} />
      <MetricCard label="Models" value={provider.modelsAvailable.length} />
    </div>
  </div>
);
```

### 2. Budget Tracking Section

```typescript
// Budget overview with spending analytics
const BudgetOverview = ({ metrics }: { metrics: BudgetMetrics }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span>Total Budget</span>
        <span className="font-semibold">{formatCurrency(metrics.totalBudget)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${(metrics.usedBudget / metrics.totalBudget) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Used" value={formatCurrency(metrics.usedBudget)} />
        <MetricCard label="Remaining" value={formatCurrency(metrics.remainingBudget)} />
      </div>
    </div>
  </div>
);
```

### 3. System Metrics Dashboard

```typescript
// Real-time system performance metrics
const SystemDashboard = ({ metrics }: { metrics: SystemMetrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricCard
      icon={<TrendingUp className="h-5 w-5" />}
      label="Total Requests"
      value={metrics.totalRequests.toLocaleString()}
    />
    <MetricCard
      icon={<Users className="h-5 w-5" />}
      label="Success Rate"
      value={`${metrics.successRate}%`}
    />
    <MetricCard
      icon={<Server className="h-5 w-5" />}
      label="Avg Latency"
      value={`${metrics.averageLatency}ms`}
    />
    <MetricCard
      icon={<Shield className="h-5 w-5" />}
      label="Uptime"
      value={formatUptime(metrics.uptime)}
    />
  </div>
);
```

## Error Handling Requirements

- **Network Errors**: Display user-friendly error messages for API failures
- **Loading States**: Show skeleton loaders while fetching data
- **Empty States**: Handle cases where no data is available
- **Validation**: Validate budget inputs and provider configurations
- **Retry Logic**: Implement retry mechanisms for failed requests

## State Management

```typescript
const RelayCoreAdminInterface: React.FC<RelayCoreAdminInterfaceProps> = ({
  onBudgetUpdate,
  onProviderChange,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [budgetLimit, setBudgetLimit] = useState<number>(1000);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000);

  // React Query hooks for data fetching
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['relaycore-providers'],
    queryFn: () => getRelayCoreProviders(),
    refetchInterval: refreshInterval,
  });

  const { data: budgetMetrics } = useQuery({
    queryKey: ['relaycore-budget'],
    queryFn: () => getRelayCorebudget(),
    refetchInterval: refreshInterval,
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['relaycore-metrics'],
    queryFn: () => getRelayCoreMetrics(),
    refetchInterval: refreshInterval,
  });

  // Mutation for updating budget
  const budgetMutation = useMutation({
    mutationFn: (newBudget: number) => updateBudgetLimit(newBudget),
    onSuccess: () => {
      onBudgetUpdate(budgetLimit);
      // Refetch budget data
    },
  });

  return (
    <div className="space-y-6">
      {/* Component implementation */}
    </div>
  );
};
```

## Technical Context

### Existing Code Patterns

- **API Client**: Use existing patterns from `frontend/src/api/monitoring.ts`
- **Components**: Leverage `shared/components/MetricCard.tsx` and `StatusIndicator.tsx`
- **Formatting**: Use utilities from `shared/utils/formatters.ts`
- **Styling**: Follow patterns from existing dashboard components

### Integration Points

- **Monitoring API**: Integrate with existing monitoring endpoints
- **WebSocket**: Use existing WebSocket connection for real-time updates
- **Error Handling**: Use existing error boundary and toast patterns

## Success Criteria

- [ ] Component renders without TypeScript errors
- [ ] All provider status cards display correctly with real-time updates
- [ ] Budget tracking shows accurate spending data and progress bars
- [ ] System metrics dashboard updates every 30 seconds
- [ ] Provider toggle functionality works correctly
- [ ] Budget update form validates input and saves changes
- [ ] Responsive design works on mobile and desktop
- [ ] Loading states and error handling implemented
- [ ] Component integrates seamlessly with existing AutoMatrix design system

## Testing Strategy

- **Unit Tests**: Test component rendering and state management
- **Integration Tests**: Test API integration and data flow
- **User Interaction Tests**: Test form submissions and button clicks
- **Responsive Tests**: Verify layout on different screen sizes

## Files to Create/Modify

- `frontend/src/components/RelayCoreAdminInterface.tsx` - Main component (fix and implement)
- `frontend/src/api/relaycore.ts` - API client functions (if not exists)
- `frontend/src/types/relaycore.ts` - TypeScript type definitions
- `frontend/src/components/__tests__/RelayCoreAdminInterface.test.tsx` - Component tests

## Priority Justification

This component is essential for the RelayCore system administration and monitoring. It provides critical functionality for managing AI providers, tracking costs, and monitoring system performance.

## Handoff from Amazon Q

This task should only begin after Amazon Q has successfully fixed the file corruption in `RelayCoreAdminInterface.tsx`. Cline should verify the file compiles correctly before beginning implementation.
