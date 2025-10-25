

# 🔧 DETAILED TASK HANDOFF GUIDE FOR CODING AGENT

S

**Generated:

* * February 1, 202

5
**Purpose:

* * Comprehensive task specifications for autonomous AI coding agent executio

n
**Target Agents:

* * Amazon Q, Cursor IDE, Cline, and other coding assistant

s

--

- #

# 📋 **HANDOFF PROTOCO

L

* *

#

## **Task Assignment Forma

t

* *

Each task includes:

- **Detailed technical specifications

* *

- **Exact file paths and code locations

* *

- **Step-by-step implementation instructions

* *

- **Success criteria with validation commands

* *

- **Error handling and rollback procedures

* *

#

## **Quality Standard

s

* *

- **Zero tolerance

* * for security vulnerabilitie

s

- **TypeScript strict mode

* * compliance require

d

- **Test coverage

* * minimum 90% for new cod

e

- **Performance

* * requirements must be me

t

- **Documentation

* * required for all public API

s

--

- #

# 🔴 **CRITICAL TASK 001: TypeScript Compliance Emergency Fi

x

* *

#

## **ASSIGNMENT: CURSOR ID

E

* *

#

### **Task Overvie

w

* *

```markdown
**Objective**: Eliminate 108 TypeScript linting errors blocking frontend developmen

t
**Priority**: CRITICA

L

 - Blocking all frontend expansio

n
**Estimated Time**: 4-6 hour

s
**Dependencies**: None (ready for immediate execution

)

```

#

### **Technical Specification

s

* *

#

#### **Primary Target File

s

* *

```

bash

# High-priority files with error counts

:

frontend/src/components/__tests__/WorkflowErrorDisplay.test.tsx

# 19 errors

frontend/src/components/__tests__/WorkflowExecutionInterface.test.tsx

# 16 errors

frontend/src/components/__tests__/WorkflowExecutionResults.test.tsx

# 4 errors

frontend/src/utils/retryUtils.ts

# 1 error

```

#

#### **Error Categories to Fi

x

* *

1. **Explicit 'any' type usag

e

* * (16 instances

)

2. **Unused variable

s

* * (workflowsApi and others

)

3. **Missing type definition

s

* * for test mock

s

4. **Improper interface implementation

s

* *

#

### **Step-by-Step Implementatio

n

* *

#

#### **Step 1: Environment Setu

p

* *

```

bash
cd frontend
npm install
npm run lint -

- --fix



# Auto-fix what's possibl

e

npm run lint > lint-errors.txt



# Capture remaining errors

```

#

#### **Step 2: Fix WorkflowErrorDisplay.test.tsx (19 errors

)

* *

```

typescript
// Current problematic code patterns to fix:
//

 1. Replace 'any' types with proper interface

s

// BEFORE (problematic):
const mockWorkflow: any = {
  id: "123",
  name: "Test Workflow",
};

// AFTER (correct):
interface MockWorkflow {
  id: string;
  name: string;
  status?: WorkflowStatus;
  steps?: WorkflowStep[];
}

const mockWorkflow: MockWorkflow = {
  id: "123",
  name: "Test Workflow",
};

//

 2. Fix mock function types

// BEFORE:
const mockExecuteWorkflow = jest.fn();

// AFTER:
const mockExecuteWorkflow = jest.fn<
  Promise<WorkflowResult>,
  [WorkflowRequest]
>();

//

 3. Add proper error type definitions

interface WorkflowError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

```

#

#### **Step 3: Fix WorkflowExecutionInterface.test.tsx (16 errors

)

* *

```

typescript
// Fix React component prop types
interface WorkflowExecutionProps {
  workflow: Workflow;
  onExecute: (workflowId: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Fix test render calls
const renderComponent = (props: Partial<WorkflowExecutionProps> = {}) => {
  const defaultProps: WorkflowExecutionProps = {
    workflow: mockWorkflow,
    onExecute: jest.fn(),
    onCancel: jest.fn(),
    isLoading: false,
    ...props
  };

  return render(<WorkflowExecutionInterface {...defaultProps} />);
};

// Fix async test patterns
test('should handle workflow execution', async () => {
  const mockOnExecute = jest.fn<Promise<void>, [string]>();
  renderComponent({ onExecute: mockOnExecute });

  const executeButton = screen.getByRole('button', { name: /execute/i });
  fireEvent.click(executeButton);

  await waitFor(() => {
    expect(mockOnExecute).toHaveBeenCalledWith(mockWorkflow.id);
  });
});

```

#

#### **Step 4: Fix WorkflowExecutionResults.test.tsx (4 errors

)

* *

```

typescript
// Add proper result type definitions
interface WorkflowExecutionResult {
  id: string;
  workflowId: string;
  status: "success" | "error" | "pending";
  startTime: Date;
  endTime?: Date;
  output?: Record<string, unknown>;
  error?: WorkflowError;
}

// Fix mock data structures
const mockExecutionResult: WorkflowExecutionResult = {
  id: "exec-123",

  workflowId: "workflow-456",

  status: "success",
  startTime: new Date("2025-01-01T10:00:00Z"),

  endTime: new Date("2025-01-01T10:05:00Z"),

  output: { result: "completed successfully" },
};

```

#

#### **Step 5: Fix retryUtils.ts (1 error

)

* *

```

typescript
// Current problematic code:
export const retryWithBackoff = async (
  fn: () => Promise<any>, // ❌ 'any' type
  maxRetries: number = 3,
): Promise<any> => {
  // ❌ 'any' return type
  // implementation
};

// Fixed version:
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {

    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = backoffMs

 * Math.pow(2, attempt);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

```

#

#### **Step 6: Create Missing Type Definition

s

* *

```

typescript
// Create frontend/src/types/testing.ts
export interface MockApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface MockWorkflowApi {
  getWorkflows: jest.MockedFunction<() => Promise<Workflow[]>>;
  executeWorkflow: jest.MockedFunction<
    (id: string) => Promise<WorkflowExecutionResult>
  >;
  cancelWorkflow: jest.MockedFunction<(id: string) => Promise<void>>;
}

// Update frontend/src/types/workflow.ts with missing interfaces
export interface WorkflowStep {
  id: string;
  type: "action" | "decision" | "ai" | "start" | "end";
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowValidationError {
  stepId: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

```

#

### **Validation Command

s

* *

```

bash

# After each file fix, run:

npm run lint -

- --max-warnings 0

npm run type-check

npm run build
npm test -

- --passWithNoTest

s

# Final validation:

npm run lint 2>&1 | grep -E "(error|Error)" | wc -l



# Should output 0

npm run build

# Should complete without errors

```

#

### **Success Criteria Checklis

t

* *

- [ ] Zero TypeScript linting errors (`npm run lint` passes

)

- [ ] All test files have proper type definition

s

- [ ] No 'any' types in production cod

e

- [ ] Build completes successfull

y

- [ ] All existing tests still pas

s

- [ ] New type definitions are exported properl

y

#

### **Rollback Procedur

e

* *

```

bash

# If issues arise, rollback using:

git stash push -m "TypeScript compliance work in progress"

git checkout HEAD -

- frontend/src/

git stash pop

# Only if you want to recover partial work

```

--

- #

# 🔴 **CRITICAL TASK 002: Test Infrastructure Dependency Repai

r

* *

#

## **ASSIGNMENT: AMAZON

Q

* *

#

### **Task Overvie

w

* *

```

markdown
**Objective**: Fix 22 vitest module resolution errors preventing all test executio

n
**Priority**: CRITICA

L

 - Blocking all quality validatio

n
**Estimated Time**: 4-6 hour

s
**Dependencies**: None (independent debugging task

)

```

#

### **Technical Specification

s

* *

#

#### **Primary Issue Analysi

s

* *

```

bash

# Current error pattern:

Error: Cannot find module 'pretty-format/build/index.js'

  at @vitest/snapshot/dist/index.js

# Dependency chain analysis needed:

frontend/package.json -> vitest -> @vitest/snapshot -> pretty-forma

t

```

#

#### **Diagnostic Command

s

* *

```

bash
cd frontend

#

 1. Analyze current dependency tre

e

npm ls vitest
npm ls @vitest/snapshot
npm ls pretty-forma

t

#

 2. Check for version conflict

s

npm outdated
npm audit

#

 3. Examine vitest configuratio

n

cat vitest.config.ts
cat package.json | jq '.devDependencies | with_entries(select(.key | contains("vitest") or contains("test")))'

```

#

### **Step-by-Step Implementatio

n

* *

#

#### **Step 1: Dependency Analysi

s

* *

```

bash

# Check current versions and conflicts

npm ls --depth=0 | grep -E "(vitest|@vitest|pretty-format)

"

# Identify the exact error location

npm test 2>&1 | head -50



# Capture first 50 lines of error outpu

t

# Check if pretty-format is properly installe

d

find node_modules -name "pretty-format" -type d

ls -la node_modules/pretty-format/build

/

```

#

#### **Step 2: Version Compatibility Fi

x

* *

```

bash

# Option A: Update vitest to latest compatible version

npm install --save-dev vitest@latest @vitest/ui@lates

t

# Option B: Downgrade to known working version

npm install --save-dev vitest@0.34.6 @vitest/ui@0.34

.

6

# Option C: Force resolution in package.jso

n

# Add to package.json:

{
  "overrides": {
    "pretty-format": "^29.0.0

"

  }
}

```

#

#### **Step 3: Module Resolution Fi

x

* *

```

typescript
// Update vitest.config.ts with proper module resolution
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    // Add module resolution fixes
    deps: {
      inline: ["pretty-format", "@vitest/snapshot"],

    },
    // Fix memory issues
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1,
      },
    },
    // Increase memory limit
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

```

#

#### **Step 4: Memory Issue Resolutio

n

* *

```

bash

# Update package.json test scripts with memory fixes

{
  "scripts": {
    "test": "vitest --run --reporter=verbose --max-old-space-size=4096",

    "test:watch": "vitest --max-old-space-size=4096",

    "test:coverage": "vitest run --coverage --max-old-space-size=4096"

  }
}

# Alternative: Use Node.js memory flags

export NODE_OPTIONS="--max-old-space-size=4096"

npm test

```

#

#### **Step 5: Coverage Configuration Fi

x

* *

```

bash

# Install compatible coverage provider

npm install --save-dev @vitest/coverage-v8@lates

t

# Update vitest.config.ts coverage settings

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',

        '**/*.test.{ts,tsx}',

        '**/*.spec.{ts,tsx}'

      ]
    }
  }
});

```

#

#### **Step 6: Clean Installatio

n

* *

```

bash

# Complete dependency reset if needed

rm -rf node_modules package-lock.json

npm cache clean --force

npm install

# Verify installation

npm ls vitest
npm test -

- --versio

n

```

#

### **Validation Command

s

* *

```

bash

# Progressive validation

npm test -

- --run --reporter=verbose



# Should show test discovery

npm test -

- --run src/components/__tests__/App.test.tsx



# Single test file

npm test -

- --run



# All tests

npm run test:coverage

# Coverage generatio

n

# Success indicators

:

#

 - "collected X test(s)" message appea

r

s

#

 - No module resolution erro

r

s

#

 - Tests execute (pass/fail is secondar

y

)

#

 - Coverage report generate

s

```

#

### **Success Criteria Checklis

t

* *

- [ ] All 25

0

+ tests are discoverable by vites

t

- [ ] Zero module resolution error

s

- [ ] Memory issues resolved (no heap out of memory

)

- [ ] Coverage reporting functiona

l

- [ ] CI/CD pipeline test gates operationa

l

- [ ] Test execution time reasonable (<5 minutes for full suite

)

#

### **Rollback Procedur

e

* *

```

bash

# If complete failure, rollback to last known working state

git checkout HEAD -

- frontend/package.json frontend/vitest.config.ts

rm -rf frontend/node_modules frontend/package-lock.json

cd frontend && npm install

```

--

- #

# 🟡 **HIGH PRIORITY TASK 004: RelayCore Admin Interface Foundatio

n

* *

#

## **ASSIGNMENT: CURSOR ID

E

* *

#

### **Task Overvie

w

* *

```

markdown
**Objective**: Build comprehensive RelayCore admin interface using shared foundatio

n
**Priority**: HIG

H

 - New strategic featur

e
**Estimated Time**: 6-8 hour

s
**Dependencies**: TypeScript compliance completion (Task 001

)

```

#

### **Technical Specification

s

* *

#

#### **Project Structur

e

* *

```

bash

# Create new directory structure

frontend/src/pages/relaycore/
├── AdminDashboard.tsx

# Main dashboard container

├── components/
│   ├── AIRoutingDashboard.tsx

# Real-time routing metric

s

│   ├── CostAnalytics.tsx

# Cost tracking and forecasting

│   ├── SteeringRulesManager.tsx

# Visual rule builder

│   ├── ModelManagement.tsx

# Model configuration

│   └── RealTimeMonitoring.tsx

# Live system monitoring

├── hooks/
│   ├── useRealtimeMetrics.ts

# WebSocket metrics hook

│   ├── useCostAnalytics.ts

# Cost data management

│   └── useSteeringRules.ts

# Rules management

├── types/
│   └── relaycore.ts

# RelayCore-specific type

s

└── api/
    └── relaycoreClient.ts

# API client for RelayCore

```

#

### **Step-by-Step Implementatio

n

* *

#

#### **Step 1: Type Definition

s

* *

```

typescript
// frontend/src/types/relaycore.ts
export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "anthropic" | "google" | "azure";
  status: "active" | "inactive" | "error";
  costPerToken: number;
  averageLatency: number;
  successRate: number;
  configuration: ModelConfiguration;
}

export interface ModelConfiguration {
  maxTokens: number;
  temperature: number;
  timeout: number;
  retryAttempts: number;
  costLimit?: number;
}

export interface RoutingMetrics {
  timestamp: Date;
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  errorRate: number;
  modelDistribution: Record<string, number>;
}

export interface CostAnalytics {
  currentSpending: number;
  budgetLimit: number;
  remainingBudget: number;
  spendingByModel: Record<string, number>;
  spendingByTimeframe: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  forecast: {
    nextWeek: number;
    nextMonth: number;
  };
}

export interface SteeringRule {
  id: string;
  name: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  field: "requestType" | "userRole" | "costLimit" | "responseTime";
  operator: "equals" | "contains" | "greaterThan" | "lessThan";
  value: string | number;
}

export interface RuleAction {
  type: "routeToModel" | "setCostLimit" | "setRetryCount" | "blockRequest";
  parameters: Record<string, unknown>;
}

```

#

#### **Step 2: API Client Implementatio

n

* *

```

typescript
// frontend/src/api/relaycoreClient.ts
import { createApiClient } from "../shared/api/apiClient";
import type {
  AIModel,
  RoutingMetrics,
  CostAnalytics,
  SteeringRule,
} from "../types/relaycore";

const relaycoreApi = createApiClient({
  baseURL: process.env.REACT_APP_RELAYCORE_API_URL || "http://localhost:3001",
  timeout: 10000,
});

export const relaycoreClient = {
  // AI Model Management
  async getModels(): Promise<AIModel[]> {
    const response = await relaycoreApi.get<AIModel[]>("/api/models");
    return response.data;
  },

  async updateModelConfiguration(
    modelId: string,
    config: Partial<ModelConfiguration>,
  ): Promise<AIModel> {
    const response = await relaycoreApi.patch<AIModel>(
      `/api/models/${modelId}`,
      config,
    );
    return response.data;
  },

  // Routing Metrics
  async getRoutingMetrics(
    timeframe: "1h" | "24h" | "7d" | "30d",
  ): Promise<RoutingMetrics[]> {
    const response = await relaycoreApi.get<RoutingMetrics[]>(
      `/api/metrics/routing?timeframe=${timeframe}`,
    );
    return response.data;
  },

  // Cost Analytics
  async getCostAnalytics(
    timeframe: "7d" | "30d" | "90d",
  ): Promise<CostAnalytics> {
    const response = await relaycoreApi.get<CostAnalytics>(
      `/api/analytics/cost?timeframe=${timeframe}`,
    );
    return response.data;
  },

  // Steering Rules
  async getSteeringRules(): Promise<SteeringRule[]> {
    const response = await relaycoreApi.get<SteeringRule[]>(
      "/api/steering-rules",

    );
    return response.data;
  },

  async createSteeringRule(
    rule: Omit<SteeringRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<SteeringRule> {
    const response = await relaycoreApi.post<SteeringRule>(
      "/api/steering-rules",

      rule,
    );
    return response.data;
  },

  async updateSteeringRule(
    ruleId: string,
    updates: Partial<SteeringRule>,
  ): Promise<SteeringRule> {
    const response = await relaycoreApi.patch<SteeringRule>(
      `/api/steering-rules/${ruleId}`,

      updates,
    );
    return response.data;
  },

  async deleteSteeringRule(ruleId: string): Promise<void> {
    await relaycoreApi.delete(`/api/steering-rules/${ruleId}`);

  },

  // WebSocket connection for real-time updates

  createWebSocketConnection(
    onMessage: (data: RoutingMetrics) => void,
  ): WebSocket {
    const wsUrl =
      process.env.REACT_APP_RELAYCORE_WS_URL || "ws://localhost:3001/ws";
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    return ws;
  },
};

```

#

#### **Step 3: Real-Time Metrics Hoo

k

* *

```

typescript
// frontend/src/hooks/useRealtimeMetrics.ts
import { useState, useEffect, useCallback } from "react";
import { relaycoreClient } from "../api/relaycoreClient";
import type { RoutingMetrics } from "../types/relaycore";

export const useRealtimeMetrics = (
  timeframe: "1h" | "24h" | "7d" | "30d" = "1h",
) => {
  const [metrics, setMetrics] = useState<RoutingMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<RoutingMetrics | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch historical metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await relaycoreClient.getRoutingMetrics(timeframe);
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  // WebSocket connection for real-time updates

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        ws = relaycoreClient.createWebSocketConnection(
          (data: RoutingMetrics) => {
            setCurrentMetrics(data);
            setMetrics((prev) => [...prev.slice(-99), data]); // Keep last 100 data points

          },
        );

        ws.onopen = () => {
          setIsConnected(true);
          console.log("WebSocket connected to RelayCore");
        };

        ws.onclose = () => {
          setIsConnected(false);
          console.log("WebSocket disconnected from RelayCore");
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        setError("Failed to establish real-time connection");

      }
    };

    fetchMetrics();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [fetchMetrics]);

  return {
    metrics,
    currentMetrics,
    isLoading,
    error,
    isConnected,
    refetch: fetchMetrics,
  };
};

```

#

#### **Step 4: AI Routing Dashboard Componen

t

* *

```

typescript
// frontend/src/pages/relaycore/components/AIRoutingDashboard.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatusIndicator, MetricCard, SystemBadge } from '../../../shared/components';
import { useRealtimeMetrics } from '../hooks/useRealtimeMetrics';

const COLORS = ['

#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

;

export const AIRoutingDashboard: React.FC = () => {
  const { metrics, currentMetrics, isLoading, error, isConnected } = useRealtimeMetrics('1h');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>

      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">

        <p className="text-red-800">Error loading routing metrics: {error}</p>

      </div>
    );
  }

  const latestMetrics = currentMetrics || metrics[metrics.length

 - 1]

;

  return (
    <div className="space-y-6">

      {/

* Connection Status */}

      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-bold text-gray-900">AI Routing Dashboard</h2>

        <StatusIndicator
          status={isConnected ? 'healthy' : 'error'}
          label={isConnected ? 'Real-time Connected' : 'Connection Lost'}

        />
      </div>

      {/

* Key Metrics Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <MetricCard
          title="Total Requests"
          value={latestMetrics?.totalRequests || 0}
          trend={metrics.length > 1 ?
            ((latestMetrics?.totalRequests || 0)

 - metrics[metrics.lengt

h

 - 2].totalRequests) : 0

          }
          format="number"
        />
        <MetricCard
          title="Success Rate"
          value={latestMetrics ?
            ((latestMetrics.successfulRequests / latestMetrics.totalRequests)

 * 100) : 0

          }
          trend={metrics.length > 1 ?
            (((latestMetrics?.successfulRequests || 0) / (latestMetrics?.totalRequests || 1))

 * 100

)

 - ((metrics[metrics.length

 - 2].successfulRequests / metrics[metrics.lengt

h

 - 2].totalRequests

)

 * 100) : 0

          }
          format="percentage"
        />
        <MetricCard
          title="Avg Response Time"
          value={latestMetrics?.averageResponseTime || 0}
          trend={metrics.length > 1 ?
            (latestMetrics?.averageResponseTime || 0)

 - metrics[metrics.lengt

h

 - 2].averageResponseTime : 0

          }
          format="duration"
        />
        <MetricCard
          title="Error Rate"
          value={latestMetrics?.errorRate || 0}
          trend={metrics.length > 1 ?
            (latestMetrics?.errorRate || 0)

 - metrics[metrics.lengt

h

 - 2].errorRate : 0

          }
          format="percentage"
          invertTrend={true}
        />
      </div>

      {/

* Charts */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/

* Response Time Trend */}

        <div className="bg-white p-6 rounded-lg shadow">

          <h3 className="text-lg font-semibold mb-4">Response Time Trend</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value: number) => [`${value}ms`, 'Response Time']}
              />
              <Line
                type="monotone"
                dataKey="averageResponseTime"
                stroke="

#8884d8"

                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/

* Model Distribution */}

        <div className="bg-white p-6 rounded-lg shadow">

          <h3 className="text-lg font-semibold mb-4">Model Distribution</h3>

          {latestMetrics?.modelDistribution && (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(latestMetrics.modelDistribution).map(([model, count]) => ({
                    name: model,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent

 * 100).toFixed(0)}%`}

                  outerRadius={80}
                  fill="

#8884d8"

                  dataKey="value"
                >
                  {Object.entries(latestMetrics.modelDistribution).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/

* Model Status */}

      <div className="bg-white p-6 rounded-lg shadow">

        <h3 className="text-lg font-semibold mb-4">Model Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {latestMetrics?.modelDistribution && Object.entries(latestMetrics.modelDistribution).map(([model, count]) => (
            <div key={model} className="flex items-center justify-between p-3 border rounded-lg">

              <div className="flex items-center space-x-3">

                <SystemBadge system={model} />
                <span className="font-medium">{model}</span>

              </div>
              <div className="text-right">

                <div className="text-sm text-gray-500">{count} requests</div>

                <StatusIndicator status="healthy" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

```

#

#### **Step 5: Main Admin Dashboar

d

* *

```

typescript
// frontend/src/pages/relaycore/AdminDashboard.tsx
import React, { useState } from 'react';
import { AIRoutingDashboard } from './components/AIRoutingDashboard';
import { CostAnalytics } from './components/CostAnalytics';
import { SteeringRulesManager } from './components/SteeringRulesManager';
import { ModelManagement } from './components/ModelManagement';
import { RealTimeMonitoring } from './components/RealTimeMonitoring';

type TabType = 'routing' | 'cost' | 'rules' | 'models' | 'monitoring';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('routing');

  const tabs = [
    { id: 'routing' as TabType, label: 'AI Routing', icon: '🔀' },
    { id: 'cost' as TabType, label: 'Cost Analytics', icon: '💰' },
    { id: 'rules' as TabType, label: 'Steering Rules', icon: '⚙️' },
    { id: 'models' as TabType, label: 'Model Management', icon: '🤖' },
    { id: 'monitoring' as TabType, label: 'Real-time Monitoring', icon: '📊' },

  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'routing':
        return <AIRoutingDashboard />;
      case 'cost':
        return <CostAnalytics />;
      case 'rules':
        return <SteeringRulesManager />;
      case 'models':
        return <ModelManagement />;
      case 'monitoring':
        return <RealTimeMonitoring />;
      default:
        return <AIRoutingDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/

* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-gray-900">RelayCore Admin Interface</h1>

          <p className="mt-2 text-gray-600">

            Manage AI routing, cost optimization, and steering rules
          </p>
        </div>

        {/

* Tab Navigation */}

        <div className="mb-8">

          <nav className="flex space-x-8" aria-label="Tabs">

            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm

                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'

                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/

* Tab Content */}

        <div className="tab-content">

          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

```

#

### **Validation Command

s

* *

```

bash

# After implementation:

cd frontend
npm run lint

# Should pass with no errors

npm run type-check



# Should pass TypeScript validation

npm run build

# Should build successfully

npm test -

- --run src/pages/relaycore/



# Test new component

s

# Integration testing:

npm start

# Start dev serve

r

# Navigate to /relaycore/admin in browse

r

# Verify all tabs load without error

s

# Check browser console for any runtime errors

```

#

### **Success Criteria Checklis

t

* *

- [ ] All 5 dashboard sections implemented and functiona

l

- [ ] Real-time WebSocket connection establishe

d

- [ ] Shared foundation components properly integrate

d

- [ ] TypeScript compliance maintained (no new errors

)

- [ ] Responsive design works on all screen size

s

- [ ] <2 second response times for all interaction

s

- [ ] Error handling and loading states implemente

d

- [ ] Automotive theming applied consistentl

y

#

### **Performance Requirement

s

* *

- Bundle size increase <500K

B

- Initial page load <3 second

s

- Real-time updates <100ms latenc

y

- Chart rendering smooth with 100

0

+ data point

s

- Memory usage stable during extended us

e

--

- #

# 📊 **QUALITY ASSURANCE CHECKLIS

T

* *

#

## **Pre-Deployment Validatio

n

* *

```

bash

# Security scan

npm audit --audit-level moderat

e

# Should return 0 vulnerabilitie

s

# Performance check

npm run build

# Bundle analyzer should show <1MB total siz

e

# Type safety

npm run type-chec

k

# Should complete with 0 error

s

# Test coverage

npm run test:coverage

# Should maintain >90% coverag

e

# Linting

npm run lint -

- --max-warnings

0

# Should pass with 0 warnings/errors

```

#

## **Integration Testin

g

* *

```

bash

# API integration

curl -X GET http://localhost:3001/api/model

s

# Should return valid JSON respons

e

# WebSocket connectio

n

# Open browser dev tools, check WebSocket connection in Network ta

b

# Should show active WS connection to RelayCor

e

# Cross-browser testi

n

g

# Test in Chrome, Firefox, Safari, Edg

e

# Verify all functionality works consistently

```

#

## **Performance Validatio

n

* *

```

bash

# Lighthouse audit

npx lighthouse http://localhost:3000/relaycore/admin --output=jso

n

# Performance score should be >7

0

# Bundle analysis

npx webpack-bundle-analyzer build/static/js/*.j

s

# Identify any unexpectedly large dependencies

```

--

- #

# 🚨 **ERROR HANDLING & ROLLBACK PROCEDURE

S

* *

#

## **Common Issues & Solution

s

* *

#

### **TypeScript Compilation Error

s

* *

```

bash

# Clear TypeScript cache

rm -rf frontend/node_modules/.cache

npx tsc --build --clean

npm run type-chec

k

# If persistent errors:

git checkout HEAD -

- frontend/src/types/

npm run type-chec

k

```

#

### **Test Infrastructure Failure

s

* *

```

bash

# Reset test environment

rm -rf frontend/node_modules frontend/package-lock.json

npm install
npm test -

- --run --reporter=verbos

e

# If vitest still fails:

npm install --save-dev vitest@0.34.6 @vitest/ui@0.34

.

6

```

#

### **WebSocket Connection Issue

s

* *

```

bash

# Check RelayCore service status

curl -I http://localhost:3001/healt

h

# Verify WebSocket endpoint

wscat -c ws://localhost:3001/w

s

# If connection fails, implement fallback polling

:

# Use setInterval to fetch metrics every 5 seconds

```

#

## **Emergency Rollbac

k

* *

```

bash

# Complete rollback to last stable state

git stash push -m "Work in progres

s

 - emergency rollback"

git reset --hard HEAD~1

npm install
npm run build
npm test

```

--

- #

# 📈 **SUCCESS METRICS TRACKIN

G

* *

#

## **Task Completion Metric

s

* *

- **TypeScript Errors**: 108 → 0 (100% reduction

)

- **Test Execution**: 0% → 100% capabilit

y

- **New Features**: RelayCore admin interface operationa

l

- **Performance**: <2s response times maintaine

d

- **Quality**: Zero regressions introduce

d

#

## **Business Value Delivere

d

* *

- **AI Routing Optimization**: Real-time visibility and contro

l

- **Cost Management**: Comprehensive analytics and budgetin

g

- **Operational Excellence**: Live monitoring and alertin

g

- **Enterprise Readiness**: Production-grade admin interfac

e

--

- **🎯 This detailed handoff guide provides complete specifications for autonomous AI coding agent execution, ensuring consistent, high-quality implementation across all critical tasks.

* *
