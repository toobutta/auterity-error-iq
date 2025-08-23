# [CLINE-TASK] RelayCore Admin Interface - Detailed Implementation Specification

**Priority**: 🔴 CRITICAL - MISSING CORE SYSTEM COMPONENT
**Assigned Tool**: Cline
**Status**: Ready for immediate execution after TASK-001 completion
**Dependencies**: TypeScript compliance must be resolved first
**Estimated Effort**: 8-12 hours (detailed implementation)

## EXECUTIVE SUMMARY
Build comprehensive RelayCore admin interface with real-time AI routing metrics, cost analytics, steering rules management, and model configuration. This is a critical missing component of the three-system integration (AutoMatrix + RelayCore + NeuroWeaver).

## BUSINESS CONTEXT
RelayCore is the AI routing and cost optimization system that intelligently routes AI requests across multiple providers (OpenAI, Anthropic, Claude) based on cost, performance, and steering rules. The admin interface provides operational visibility and management capabilities.

## PRE-DEVELOPMENT TASKS FOR CLINE

### 1. Foundation Analysis (30 minutes)
```bash
# Analyze shared foundation components
find shared/components/ -name "*.tsx" -exec echo "=== {} ===" \; -exec head -20 {} \;

# Check existing API client patterns  
find frontend/src/api/ -name "*.ts" -exec echo "=== {} ===" \; -exec head -10 {} \;

# Review automotive theming
cat frontend/tailwind.config.js
grep -r "automotive\|theme" frontend/src/ --include="*.css" --include="*.tsx"

# Check for existing dashboard patterns
find frontend/src/pages/ -name "*dashboard*" -o -name "*admin*" | head -10
```

### 2. Dependency Assessment (15 minutes)
```bash
# Check WebSocket libraries
npm list ws socket.io-client @types/ws

# Verify chart libraries  
npm list recharts chart.js react-chartjs-2 d3

# Check form libraries
npm list react-hook-form formik yup zod

# Verify real-time libraries
npm list @tanstack/react-query swr
```

### 3. API Endpoint Planning (15 minutes)
```bash
# Check existing API structure
find backend/app/api/ -name "*.py" | grep -E "(relaycore|routing|cost)" || echo "RelayCore APIs need creation"

# Analyze existing API patterns
grep -r "router\|APIRouter" backend/app/api/ --include="*.py" | head -5

# Check WebSocket implementation
find backend/ -name "*.py" -exec grep -l "websocket\|WebSocket" {} \; || echo "WebSocket needs implementation"
```

## DETAILED COMPONENT SPECIFICATIONS

### 1. Main Dashboard Layout (`RelayCoreDashboard.tsx`)

#### Component Architecture
```typescript
interface RelayCoreDashboardProps {
  refreshInterval?: number; // Default 5000ms
  showCostAnalytics?: boolean; // Default true
  showModelManagement?: boolean; // Default true
  theme?: 'automotive' | 'default'; // Default 'automotive'
}

interface DashboardState {
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

type TabType = 'routing' | 'cost' | 'rules' | 'models' | 'monitoring';
```

#### Layout Structure
```tsx
// 4-column responsive grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Status Cards using shared MetricCard */}
  <MetricCard title="Active Routes" value={metrics.activeRoutes} />
  <MetricCard title="Success Rate" value={metrics.successRate} format="percentage" />
  <MetricCard title="Avg Cost" value={metrics.avgCost} format="currency" />
  <MetricCard title="Response Time" value={metrics.responseTime} format="duration" />
</div>

// Tab navigation with automotive styling
<nav className="flex space-x-8 border-b border-gray-200">
  {tabs.map(tab => (
    <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
      {tab.icon} {tab.label}
    </TabButton>
  ))}
</nav>
```

### 2. AI Routing Metrics Component (`AIRoutingMetrics.tsx`)

#### Real-Time Data Integration
```typescript
interface RoutingMetrics {
  timestamp: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  modelDistribution: Record<string, number>;
  costByModel: Record<string, number>;
}

interface AIRoutingMetricsProps {
  timeRange: '1h' | '24h' | '7d' | '30d';
  autoRefresh?: boolean;
  onMetricsUpdate?: (metrics: RoutingMetrics) => void;
}
```

#### Chart Implementation
```tsx
// Use Recharts for consistent styling
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={metricsHistory}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey="timestamp" 
      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
    />
    <YAxis />
    <Tooltip 
      labelFormatter={(value) => new Date(value).toLocaleString()}
      formatter={(value: number, name: string) => [
        name === 'averageResponseTime' ? `${value}ms` : value,
        name
      ]}
    />
    <Line 
      type="monotone" 
      dataKey="averageResponseTime" 
      stroke="#8884d8" 
      strokeWidth={2}
      dot={false}
    />
    <Line 
      type="monotone" 
      dataKey="successfulRequests" 
      stroke="#82ca9d" 
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

### 3. Cost Analytics Interface (`CostAnalytics.tsx`)

#### Cost Tracking Features
```typescript
interface CostAnalytics {
  currentSpending: number;
  budgetLimit: number;
  remainingBudget: number;
  spendingByModel: Record<string, number>;
  spendingByTimeframe: {
    hourly: Array<{timestamp: Date, cost: number}>;
    daily: Array<{date: string, cost: number}>;
    weekly: Array<{week: string, cost: number}>;
    monthly: Array<{month: string, cost: number}>;
  };
  forecast: {
    nextDay: number;
    nextWeek: number;
    nextMonth: number;
  };
  alerts: CostAlert[];
}

interface CostAlert {
  id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'unusual_spending';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}
```

#### Budget Management UI
```tsx
// Budget progress indicator
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span>Current Spending</span>
      <span className="font-bold">${costData.currentSpending.toFixed(2)}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className={`h-2 rounded-full ${
          (costData.currentSpending / costData.budgetLimit) > 0.9 
            ? 'bg-red-500' 
            : (costData.currentSpending / costData.budgetLimit) > 0.7 
            ? 'bg-yellow-500' 
            : 'bg-green-500'
        }`}
        style={{ 
          width: `${Math.min((costData.currentSpending / costData.budgetLimit) * 100, 100)}%` 
        }}
      />
    </div>
    <div className="flex justify-between text-sm text-gray-600">
      <span>$0</span>
      <span>${costData.budgetLimit.toFixed(2)} limit</span>
    </div>
  </div>
</div>
```

### 4. Steering Rules Builder (`SteeringRulesBuilder.tsx`)

#### Visual Rule Builder
```typescript
interface SteeringRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface RuleCondition {
  id: string;
  field: 'requestType' | 'userRole' | 'costLimit' | 'responseTime' | 'modelLoad' | 'timeOfDay';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in';
  value: string | number | string[];
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: 'routeToModel' | 'setCostLimit' | 'setRetryCount' | 'blockRequest' | 'setTimeout';
  parameters: Record<string, unknown>;
  description: string;
}
```

#### Drag-and-Drop Rule Builder
```tsx
// Rule builder with drag-and-drop conditions
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Rule Builder</h3>
  
  {/* Condition Builder */}
  <div className="space-y-4">
    <h4 className="font-medium">Conditions</h4>
    {rule.conditions.map((condition, index) => (
      <div key={condition.id} className="flex items-center space-x-2 p-3 border rounded-lg">
        {index > 0 && (
          <select 
            value={condition.logicalOperator} 
            onChange={(e) => updateCondition(condition.id, 'logicalOperator', e.target.value)}
            className="px-2 py-1 border rounded"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        )}
        
        <select 
          value={condition.field}
          onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="requestType">Request Type</option>
          <option value="userRole">User Role</option>
          <option value="costLimit">Cost Limit</option>
          <option value="responseTime">Response Time</option>
          <option value="modelLoad">Model Load</option>
        </select>
        
        <select 
          value={condition.operator}
          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="equals">Equals</option>
          <option value="contains">Contains</option>
          <option value="greaterThan">Greater Than</option>
          <option value="lessThan">Less Than</option>
        </select>
        
        <input
          type="text"
          value={condition.value}
          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
          className="px-3 py-2 border rounded-md flex-1"
          placeholder="Value"
        />
        
        <button
          onClick={() => removeCondition(condition.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          ×
        </button>
      </div>
    ))}
    
    <button
      onClick={addCondition}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      Add Condition
    </button>
  </div>
  
  {/* Action Builder */}
  <div className="space-y-4 mt-6">
    <h4 className="font-medium">Actions</h4>
    {rule.actions.map((action) => (
      <div key={action.id} className="flex items-center space-x-2 p-3 border rounded-lg">
        <select 
          value={action.type}
          onChange={(e) => updateAction(action.id, 'type', e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="routeToModel">Route to Model</option>
          <option value="setCostLimit">Set Cost Limit</option>
          <option value="setRetryCount">Set Retry Count</option>
          <option value="blockRequest">Block Request</option>
        </select>
        
        {/* Dynamic parameter inputs based on action type */}
        {renderActionParameters(action)}
        
        <button
          onClick={() => removeAction(action.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          ×
        </button>
      </div>
    ))}
    
    <button
      onClick={addAction}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
    >
      Add Action
    </button>
  </div>
</div>
```

### 5. Model Management Wizard (`ModelManagementWizard.tsx`)

#### Multi-Step Configuration
```typescript
interface ModelConfiguration {
  id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'local';
  modelName: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  costPerToken: number;
  priority: number;
  isActive: boolean;
  healthCheck: {
    enabled: boolean;
    interval: number;
    endpoint: string;
  };
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  validation: (data: any) => boolean;
}
```

#### Wizard Implementation
```tsx
const wizardSteps: WizardStep[] = [
  {
    id: 'provider',
    title: 'Select Provider',
    description: 'Choose your AI model provider',
    component: ProviderSelection,
    validation: (data) => !!data.provider
  },
  {
    id: 'configuration',
    title: 'Configure Model',
    description: 'Set model parameters and limits',
    component: ModelConfiguration,
    validation: (data) => data.maxTokens > 0 && data.temperature >= 0
  },
  {
    id: 'testing',
    title: 'Test Connection',
    description: 'Verify model connectivity and performance',
    component: ConnectionTesting,
    validation: (data) => data.testPassed
  },
  {
    id: 'deployment',
    title: 'Deploy Model',
    description: 'Activate model for routing',
    component: ModelDeployment,
    validation: (data) => data.deploymentConfirmed
  }
];

// Wizard navigation
<div className="bg-white p-6 rounded-lg shadow">
  {/* Step indicator */}
  <div className="flex items-center justify-between mb-8">
    {wizardSteps.map((step, index) => (
      <div key={step.id} className="flex items-center">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${currentStep >= index 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-600'
          }
        `}>
          {index + 1}
        </div>
        {index < wizardSteps.length - 1 && (
          <div className={`
            w-16 h-1 mx-2
            ${currentStep > index ? 'bg-blue-600' : 'bg-gray-200'}
          `} />
        )}
      </div>
    ))}
  </div>
  
  {/* Current step content */}
  <div className="mb-8">
    <h3 className="text-xl font-semibold mb-2">{wizardSteps[currentStep].title}</h3>
    <p className="text-gray-600 mb-6">{wizardSteps[currentStep].description}</p>
    
    {/* Dynamic step component */}
    {React.createElement(wizardSteps[currentStep].component, {
      data: wizardData,
      onChange: updateWizardData,
      onValidation: setStepValid
    })}
  </div>
  
  {/* Navigation buttons */}
  <div className="flex justify-between">
    <button
      onClick={previousStep}
      disabled={currentStep === 0}
      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
    >
      Previous
    </button>
    
    <button
      onClick={nextStep}
      disabled={!isStepValid}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {currentStep === wizardSteps.length - 1 ? 'Deploy' : 'Next'}
    </button>
  </div>
</div>
```

## API INTEGRATION REQUIREMENTS

### Expected Backend Endpoints
```typescript
// RelayCore API endpoints (to be created/verified)
interface RelayCoreBa ckendAPI {
  // System status and health
  'GET /api/relaycore/status': SystemStatus;
  'GET /api/relaycore/health': HealthCheck;
  
  // Real-time metrics
  'GET /api/relaycore/metrics': RoutingMetrics[];
  'GET /api/relaycore/metrics/live': WebSocketConnection;
  
  // Model management
  'GET /api/relaycore/models': AIModel[];
  'POST /api/relaycore/models': CreateModelRequest;
  'PUT /api/relaycore/models/:id': UpdateModelRequest;
  'DELETE /api/relaycore/models/:id': void;
  'POST /api/relaycore/models/:id/test': ModelTestResult;
  
  // Steering rules
  'GET /api/relaycore/rules': SteeringRule[];
  'POST /api/relaycore/rules': CreateRuleRequest;
  'PUT /api/relaycore/rules/:id': UpdateRuleRequest;
  'DELETE /api/relaycore/rules/:id': void;
  'POST /api/relaycore/rules/:id/test': RuleTestResult;
  
  // Cost analytics
  'GET /api/relaycore/analytics/cost': CostAnalytics;
  'GET /api/relaycore/analytics/usage': UsageAnalytics;
  'POST /api/relaycore/analytics/budget': BudgetConfiguration;
}
```

### WebSocket Integration
```typescript
// Real-time updates via WebSocket
interface WebSocketMessage {
  type: 'metrics_update' | 'cost_alert' | 'model_status' | 'rule_triggered';
  timestamp: Date;
  data: any;
}

// WebSocket hook implementation
const useRealtimeUpdates = (endpoint: string) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws${endpoint}`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      setData(message.data);
    };
    
    return () => ws.close();
  }, [endpoint]);
  
  return { data, isConnected };
};
```

## FILE STRUCTURE TO CREATE

```
frontend/src/pages/relaycore/
├── RelayCoreDashboard.tsx           # Main dashboard container
├── components/
│   ├── AIRoutingMetrics.tsx         # Real-time routing metrics
│   ├── CostAnalytics.tsx           # Cost tracking and analytics
│   ├── SteeringRulesBuilder.tsx    # Visual rule builder
│   ├── ModelManagementWizard.tsx   # Model configuration wizard
│   ├── RealTimeMonitor.tsx         # WebSocket monitoring
│   ├── BudgetManager.tsx           # Budget configuration
│   ├── AlertsPanel.tsx             # Cost and performance alerts
│   └── __tests__/
│       ├── RelayCoreDashboard.test.tsx
│       ├── AIRoutingMetrics.test.tsx
│       ├── CostAnalytics.test.tsx
│       ├── SteeringRulesBuilder.test.tsx
│       └── ModelManagementWizard.test.tsx
├── hooks/
│   ├── useRelayCore.ts             # RelayCore API integration
│   ├── useWebSocket.ts             # Real-time updates
│   ├── useCostAnalytics.ts         # Cost data management
│   ├── useSteeringRules.ts         # Rules management
│   └── useModelManagement.ts       # Model configuration
├── types/
│   ├── relaycore.types.ts          # RelayCore-specific types
│   ├── cost-analytics.types.ts     # Cost and analytics types
│   └── steering-rules.types.ts     # Rule builder types
└── api/
    └── relaycoreClient.ts          # API client for RelayCore
```

## IMPLEMENTATION STRATEGY

### Phase 1: Foundation Setup (2 hours)
1. **File Structure Creation** (30 minutes)
   - Create directory structure
   - Set up basic component shells
   - Configure TypeScript interfaces

2. **API Client Setup** (30 minutes)
   - Create RelayCore API client
   - Set up WebSocket connection management
   - Configure error handling and retry logic

3. **Shared Component Integration** (1 hour)
   - Import and configure shared components (MetricCard, StatusIndicator, SystemBadge)
   - Set up automotive theming
   - Create reusable dashboard layouts

### Phase 2: Core Components (4-5 hours)
1. **RelayCoreDashboard Layout** (1 hour)
   - Main dashboard container with tab navigation
   - Responsive grid layout for metrics cards
   - Tab switching and state management

2. **AIRoutingMetrics Component** (1.5 hours)
   - Real-time metrics display with charts
   - WebSocket integration for live updates
   - Model distribution visualization

3. **CostAnalytics Interface** (1.5 hours)
   - Budget tracking and progress indicators
   - Cost forecasting charts
   - Alert system for budget overruns

4. **Basic SteeringRulesBuilder** (1 hour)
   - Rule listing and basic CRUD operations
   - Simple form-based rule creation
   - Rule activation/deactivation

### Phase 3: Advanced Features (3-4 hours)
1. **Advanced Rule Builder** (2 hours)
   - Drag-and-drop condition builder
   - Dynamic action parameter configuration
   - Rule testing and validation

2. **Model Management Wizard** (1.5 hours)
   - Multi-step wizard implementation
   - Provider-specific configuration forms
   - Connection testing and validation

3. **Real-Time Monitoring** (30 minutes)
   - WebSocket connection status
   - Live metrics updates
   - Error handling and reconnection

### Phase 4: Testing & Polish (1-2 hours)
1. **Unit Testing** (1 hour)
   - Component testing with React Testing Library
   - Mock WebSocket connections
   - API client mocking

2. **Integration Testing** (30 minutes)
   - End-to-end workflow testing
   - WebSocket connection testing
   - Error scenario validation

3. **Performance Optimization** (30 minutes)
   - Memoization of expensive calculations
   - Lazy loading of chart components
   - Bundle size optimization

## SUCCESS CRITERIA CHECKLIST
- [ ] Functional admin interface with live data display
- [ ] Real-time metrics updating every 5 seconds via WebSocket
- [ ] Cost analytics with interactive charts and budget tracking
- [ ] Steering rules visual builder with drag-and-drop functionality
- [ ] Model management wizard with configuration and testing
- [ ] <2 second response times for all interactions
- [ ] Responsive design working on mobile and desktop
- [ ] 90%+ test coverage for all components
- [ ] TypeScript compliance with zero 'any' types
- [ ] Integration with shared foundation components

## QUALITY GATES
- **TypeScript**: Strict typing with proper interfaces
- **Performance**: <2s load time, <100ms interaction response
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Testing**: Unit tests with mocking for API calls and WebSocket
- **Responsive**: Mobile-first design with breakpoint testing
- **Bundle Size**: RelayCore components <300KB additional

## DEPENDENCIES & BLOCKERS
- **CRITICAL BLOCKER**: TASK-001 (TypeScript compliance) must be complete
- **Shared Components**: StatusIndicator, MetricCard, SystemBadge from shared/
- **API Client**: Unified API client from frontend/src/api/
- **WebSocket**: Real-time connection management
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form for complex forms

## CONTEXT FILES TO REFERENCE
- `shared/components/` - Foundation components to use
- `frontend/src/api/` - Existing API patterns
- `frontend/src/types/` - Existing type definitions
- `frontend/tailwind.config.js` - Theming configuration
- `frontend/src/pages/` - Existing page layout patterns

## HANDBACK CRITERIA
Task is complete when:
1. All components render without TypeScript errors
2. WebSocket connections establish and update data every 5 seconds
3. Cost analytics display accurate data with interactive charts
4. Steering rules builder allows rule creation, editing, and testing
5. Model management wizard completes full configuration flow
6. All tests pass with 90%+ coverage
7. Responsive design validated on mobile, tablet, and desktop
8. Performance metrics meet <2s load time requirement
9. Integration with shared foundation components confirmed
10. Documentation complete with usage examples and API integration guide

---

**READY FOR IMMEDIATE CLINE EXECUTION** after TypeScript compliance is resolved by Amazon Q.