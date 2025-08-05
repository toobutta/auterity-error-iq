# Cost-Aware Model Switching Implementation Plan

## 1. Overview

Cost-Aware Model Switching is a feature that intelligently routes requests to different AI models based on cost parameters, budget constraints, and performance requirements. This document outlines the design and implementation plan for this feature in RelayCore, with integration points to Auterity.

## 2. System Design

### 2.1 Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                       RelayCore System                          │
│                                                                 │
│  ┌─────────────────┐      ┌─────────────────┐      ┌──────────┐ │
│  │                 │      │                 │      │          │ │
│  │  Budget Manager │◄────►│  Cost Analyzer  │◄────►│ Analytics│ │
│  │                 │      │                 │      │          │ │
│  └────────┬────────┘      └────────┬────────┘      └──────────┘ │
│           │                        │                            │
│           │                        │                            │
│           ▼                        ▼                            │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │                 │      │                 │                   │
│  │ Budget Enforcer │◄────►│  Model Selector │                   │
│  │                 │      │                 │                   │
│  └────────┬────────┘      └────────┬────────┘                   │
│           │                        │                            │
│           │                        │                            │
│           ▼                        ▼                            │
│  ┌─────────────────┐      ┌─────────────────┐      ┌──────────┐ │
│  │                 │      │                 │      │          │ │
│  │ Steering Rules  │◄────►│  Request Router │◄────►│ Providers│ │
│  │                 │      │                 │      │          │ │
│  └─────────────────┘      └─────────────────┘      └──────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Descriptions

#### Budget Manager
- Manages budget constraints at organization, team, and user levels
- Tracks spending against budgets
- Provides budget status and alerts
- Interfaces with billing systems

#### Cost Analyzer
- Calculates costs for different model options
- Analyzes historical cost data
- Provides cost projections
- Identifies cost optimization opportunities

#### Budget Enforcer
- Enforces budget constraints in real-time
- Rejects or downgrades requests when budgets are exceeded
- Applies graduated response based on budget status
- Provides override mechanisms for critical requests

#### Model Selector
- Selects optimal model based on cost, performance, and requirements
- Implements fallback strategies when preferred models are unavailable
- Balances cost vs. quality tradeoffs
- Adapts to changing conditions

#### Steering Rules Integration
- Extends steering rules with cost-aware conditions and actions
- Provides cost-based routing decisions
- Enables fine-grained control over model selection

## 3. Data Models

### 3.1 Budget Configuration

```typescript
interface BudgetConfig {
  id: string;
  name: string;
  description?: string;
  
  // Budget scope
  scope: 'organization' | 'team' | 'user' | 'project';
  scopeId: string;
  
  // Budget limits
  limit: number;
  currency: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  
  // Budget status
  currentSpend: number;
  lastUpdated: string; // ISO date
  
  // Alert thresholds (percentage of budget)
  warningThreshold: number; // e.g., 0.7 for 70%
  criticalThreshold: number; // e.g., 0.9 for 90%
  
  // Actions when thresholds are reached
  warningAction: BudgetAction;
  criticalAction: BudgetAction;
  exhaustedAction: BudgetAction;
  
  // Override settings
  allowOverrides: boolean;
  overrideRoles: string[]; // Roles that can override
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  enabled: boolean;
}

enum BudgetAction {
  NOTIFY_ONLY = 'notify_only',
  DOWNGRADE_MODELS = 'downgrade_models',
  RESTRICT_NONESSENTIAL = 'restrict_nonessential',
  BLOCK_ALL_EXCEPT_CRITICAL = 'block_all_except_critical',
  BLOCK_ALL = 'block_all'
}
```

### 3.2 Model Cost Profile

```typescript
interface ModelCostProfile {
  id: string;
  provider: string;
  model: string;
  
  // Cost structure
  inputTokenCost: number; // Cost per 1K input tokens
  outputTokenCost: number; // Cost per 1K output tokens
  currency: string;
  
  // Performance characteristics
  averageLatency: number; // milliseconds
  throughput: number; // requests per minute
  
  // Capability ratings (0-10)
  capabilities: {
    reasoning: number;
    creativity: number;
    knowledge: number;
    coding: number;
    math: number;
    [key: string]: number;
  };
  
  // Alternatives
  alternatives: ModelAlternative[];
  
  // Metadata
  updatedAt: string;
  enabled: boolean;
}

interface ModelAlternative {
  provider: string;
  model: string;
  costRatio: number; // Cost relative to primary model (e.g., 0.5 = half the cost)
  qualityRatio: number; // Quality relative to primary model (e.g., 0.8 = 80% as good)
  preferenceOrder: number; // Lower numbers are preferred
}
```

### 3.3 Cost-Aware Steering Rule Extensions

```typescript
// Extending the existing SteeringRule interface
interface CostAwareSteeringRule extends SteeringRule {
  // Cost-related conditions
  costConditions?: {
    budgetStatus?: 'normal' | 'warning' | 'critical' | 'exhausted';
    costThreshold?: number;
    costRatio?: number; // Relative to default model
  };
  
  // Cost-related actions
  costActions?: {
    selectModelByMaxCost?: number;
    selectModelByBudgetStatus?: boolean;
    selectModelByCapabilityRequirement?: string[];
    fallbackStrategy?: 'next_best_quality' | 'lowest_cost' | 'balanced';
  };
}
```

## 4. Implementation Plan

### 4.1 Database Schema Updates

```sql
-- Budget configurations table
CREATE TABLE budget_configs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scope VARCHAR(50) NOT NULL,
  scope_id VARCHAR(255) NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  period VARCHAR(20) NOT NULL,
  current_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  warning_threshold DECIMAL(5,2) NOT NULL,
  critical_threshold DECIMAL(5,2) NOT NULL,
  warning_action VARCHAR(50) NOT NULL,
  critical_action VARCHAR(50) NOT NULL,
  exhausted_action VARCHAR(50) NOT NULL,
  allow_overrides BOOLEAN NOT NULL DEFAULT FALSE,
  override_roles JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(scope, scope_id, period)
);

-- Model cost profiles table
CREATE TABLE model_cost_profiles (
  id UUID PRIMARY KEY,
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  input_token_cost DECIMAL(12,6) NOT NULL,
  output_token_cost DECIMAL(12,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  average_latency INTEGER,
  throughput INTEGER,
  capabilities JSONB,
  alternatives JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(provider, model)
);

-- Cost tracking table
CREATE TABLE cost_tracking (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id VARCHAR(255),
  organization_id VARCHAR(255),
  team_id VARCHAR(255),
  project_id VARCHAR(255),
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL(12,6) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  original_model VARCHAR(255),
  downgraded BOOLEAN NOT NULL DEFAULT FALSE,
  budget_status VARCHAR(50)
);

-- Budget alerts table
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budget_configs(id),
  alert_type VARCHAR(50) NOT NULL,
  threshold DECIMAL(5,2) NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spend_amount DECIMAL(12,2) NOT NULL,
  limit_amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  notified_users JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (budget_id) REFERENCES budget_configs(id)
);
```

### 4.2 API Endpoints

#### Budget Management API

```
# Budget Configuration Endpoints
GET    /api/v1/budgets                  # List all budgets
POST   /api/v1/budgets                  # Create a new budget
GET    /api/v1/budgets/:id              # Get a specific budget
PUT    /api/v1/budgets/:id              # Update a budget
DELETE /api/v1/budgets/:id              # Delete a budget
GET    /api/v1/budgets/:id/status       # Get current budget status
POST   /api/v1/budgets/:id/reset        # Reset a budget's current spend

# Budget Filtering
GET    /api/v1/budgets/scope/:scope/:id # Get budgets for a scope (org, team, user)
GET    /api/v1/budgets/alerts           # Get all budget alerts
GET    /api/v1/budgets/alerts/active    # Get active budget alerts
```

#### Model Cost Profile API

```
# Model Cost Profile Endpoints
GET    /api/v1/cost-profiles                     # List all cost profiles
POST   /api/v1/cost-profiles                     # Create a new cost profile
GET    /api/v1/cost-profiles/:id                 # Get a specific cost profile
PUT    /api/v1/cost-profiles/:id                 # Update a cost profile
DELETE /api/v1/cost-profiles/:id                 # Delete a cost profile
GET    /api/v1/cost-profiles/provider/:provider  # Get profiles for a provider
GET    /api/v1/cost-profiles/model/:model        # Get profiles for a model
POST   /api/v1/cost-profiles/sync                # Sync cost profiles from providers
```

#### Cost Analysis API

```
# Cost Analysis Endpoints
GET    /api/v1/cost-analysis/summary                    # Get cost summary
GET    /api/v1/cost-analysis/by-model                   # Get costs grouped by model
GET    /api/v1/cost-analysis/by-provider                # Get costs grouped by provider
GET    /api/v1/cost-analysis/by-user                    # Get costs grouped by user
GET    /api/v1/cost-analysis/by-organization            # Get costs grouped by organization
GET    /api/v1/cost-analysis/trends                     # Get cost trends over time
GET    /api/v1/cost-analysis/estimate?model=X&tokens=Y  # Estimate cost for a request
```

### 4.3 Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- Set up database schema for budget configurations and model cost profiles
- Implement basic Budget Manager service
- Create initial Cost Analyzer service
- Implement API endpoints for budget and cost profile management
- Create data import tools for model cost profiles

#### Phase 2: Core Logic (Week 3-4)
- Implement Budget Enforcer service
- Create Model Selector with basic cost-aware selection logic
- Extend Steering Rules engine with cost conditions and actions
- Implement cost tracking for all requests
- Create budget status monitoring and alerting

#### Phase 3: UI and Integration (Week 5-6)
- Develop Budget Management UI
  - Budget configuration page
  - Budget status dashboard
  - Alert management
- Create Cost Analysis UI
  - Cost breakdown visualizations
  - Trend analysis charts
  - Cost projection tools
- Implement Model Selection UI
  - Model comparison tool
  - Cost vs. quality visualization
  - Alternative model suggestions

#### Phase 4: Advanced Features (Week 7-8)
- Implement predictive budget forecasting
- Create automatic cost optimization suggestions
- Add machine learning for optimal model selection
- Implement dynamic budget adjustments
- Create detailed cost attribution reporting

## 5. UI Mockups

### 5.1 Budget Management Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ Budget Management                                       + New Budget │
├─────────────────────────────────────────────────────────────────────┤
│ Filters: ▼ All Scopes   ▼ All Periods   ▼ Status                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Organization│  │ Development │  │ Marketing   │  │ Research    │ │
│  │ $5,000/mo   │  │ $1,500/mo   │  │ $800/mo     │  │ $1,200/mo   │ │
│  │             │  │             │  │             │  │             │ │
│  │ [███████▒▒▒]│  │ [████████▒▒]│  │ [██████████]│  │ [████▒▒▒▒▒▒]│ │
│  │ 70% Used    │  │ 80% Used    │  │ 100% Used   │  │ 40% Used    │ │
│  │ $3,500/$5,000│  │ $1,200/$1,500│  │ $800/$800   │  │ $480/$1,200 │ │
│  │             │  │             │  │             │  │             │ │
│  │ ⚠️ Warning  │  │ 🔴 Critical │  │ ⛔ Exceeded │  │ ✅ Normal   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Budget Alerts                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ 🔴 Marketing budget exceeded - 100% used                        ││
│  │ Action: Block all except critical - 2 hours ago                 ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ ⚠️ Development budget at 80% - Warning threshold reached        ││
│  │ Action: Downgrade models - 6 hours ago                          ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ ⚠️ Organization budget at 70% - Warning threshold reached       ││
│  │ Action: Notify only - 1 day ago                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cost Analysis Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ Cost Analysis                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Period: ▼ This Month   Compare to: ▼ Last Month   ▼ Export          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Cost Breakdown                      Daily Cost Trend               │
│  ┌─────────────────────┐             ┌─────────────────────────────┐│
│  │                     │             │                             ││
│  │                     │             │       ╭╮                    ││
│  │  ┌──┐               │             │      ╭╯╰╮                   ││
│  │  │  │ GPT-4         │             │     ╭╯  ╰╮    ╭╮            ││
│  │  │  │ $2,340 (45%)  │             │    ╭╯    ╰╮  ╭╯╰╮           ││
│  │  └──┘               │             │   ╭╯      ╰╮╭╯  ╰╮          ││
│  │  ┌──┐               │             │  ╭╯        ╰╯    ╰╮         ││
│  │  │  │ Claude-2      │             │ ╭╯                ╰╮        ││
│  │  │  │ $1,560 (30%)  │             │╭╯                  ╰╮       ││
│  │  └──┘               │             │                             ││
│  │  ┌──┐               │             │                             ││
│  │  │  │ GPT-3.5       │             │   1  5  10  15  20  25  30  ││
│  │  │  │ $780 (15%)    │             └─────────────────────────────┘│
│  │  └──┘               │                                            │
│  │  ┌──┐               │             Cost by Team                   │
│  │  │  │ Others        │             ┌─────────────────────────────┐│
│  │  │  │ $520 (10%)    │             │ Development   $2,100 (40%)  ││
│  │  └──┘               │             │ Marketing     $1,300 (25%)  ││
│  └─────────────────────┘             │ Research      $1,040 (20%)  ││
│                                      │ Support       $780 (15%)    ││
│  Model Efficiency                    └─────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Model     │ Requests │ Tokens  │ Avg Cost │ Quality/Cost Ratio  ││
│  ├───────────┼──────────┼─────────┼──────────┼────────────────────┤│
│  │ GPT-4     │ 12,400   │ 4.2M    │ $0.19    │ ★★★☆☆             ││
│  │ Claude-2  │ 8,600    │ 3.1M    │ $0.18    │ ★★★★☆             ││
│  │ GPT-3.5   │ 25,300   │ 7.8M    │ $0.03    │ ★★★★★             ││
│  │ Llama-2   │ 4,200    │ 1.5M    │ $0.01    │ ★★★☆☆             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Model Selection Configuration

```
┌─────────────────────────────────────────────────────────────────────┐
│ Model Selection Rules                               + New Rule      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Rule: Development Team - Cost Optimization                      ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ Conditions:                                                     ││
│  │ ✓ Team is "Development"                                         ││
│  │ ✓ Budget status is "Warning" or "Critical"                      ││
│  │                                                                 ││
│  │ Actions:                                                        ││
│  │ ✓ Select model by budget status                                ││
│  │   - Normal: Use requested model                                 ││
│  │   - Warning: Use next cheapest alternative with quality > 80%   ││
│  │   - Critical: Use cheapest model with quality > 60%             ││
│  │   - Exhausted: Block non-essential requests                     ││
│  │                                                                 ││
│  │ Fallback Strategy: balanced                                     ││
│  │                                                                 ││
│  │ [Edit] [Delete] [Duplicate]                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Rule: Marketing Team - Quality Priority                         ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ Conditions:                                                     ││
│  │ ✓ Team is "Marketing"                                           ││
│  │ ✓ Request contains "customer-facing"                            ││
│  │                                                                 ││
│  │ Actions:                                                        ││
│  │ ✓ Select model by capability requirement                        ││
│  │   - Required: creativity > 8, knowledge > 7                     ││
│  │   - Max cost: $0.10 per request                                 ││
│  │                                                                 ││
│  │ Fallback Strategy: next_best_quality                            ││
│  │                                                                 ││
│  │ [Edit] [Delete] [Duplicate]                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 6. Integration with Auterity

### 6.1 Integration Points

1. **Budget Status Sharing**
   - RelayCore shares budget status with Auterity
   - Auterity agents can adapt behavior based on budget constraints
   - Budget alerts are propagated to Auterity's notification system

2. **Cost Attribution**
   - Auterity provides task context for better cost attribution
   - RelayCore tracks costs per agent, task type, and workflow
   - Joint reporting provides insights on agent efficiency

3. **Model Selection Feedback**
   - Auterity agents provide feedback on model performance
   - RelayCore uses feedback to improve model selection
   - Quality/cost metrics are shared between systems

4. **Error Handling**
   - Budget-related errors are routed to Auterity's Kiro system
   - Kiro provides specialized handling for cost constraint errors
   - Users are notified of budget-related issues through Auterity UI

### 6.2 API Contract for Integration

#### Budget Status API

```typescript
// GET /api/v1/budgets/status/:scopeType/:scopeId
interface BudgetStatusResponse {
  scopeType: 'organization' | 'team' | 'user' | 'project';
  scopeId: string;
  budgets: {
    id: string;
    name: string;
    period: string;
    limit: number;
    currentSpend: number;
    percentUsed: number;
    status: 'normal' | 'warning' | 'critical' | 'exhausted';
    lastUpdated: string;
  }[];
  aggregateStatus: 'normal' | 'warning' | 'critical' | 'exhausted';
  costRestrictions: {
    modelDowngrading: boolean;
    restrictedModels: string[];
    maxCostPerRequest: number | null;
    blockNonEssential: boolean;
  };
}
```

#### Cost Estimation API

```typescript
// POST /api/v1/cost-analysis/estimate
interface CostEstimationRequest {
  provider?: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
  alternatives?: boolean;
  qualityThreshold?: number;
}

interface CostEstimationResponse {
  provider: string;
  model: string;
  estimatedCost: number;
  currency: string;
  inputTokenCost: number;
  outputTokenCost: number;
  alternatives?: {
    provider: string;
    model: string;
    estimatedCost: number;
    costSavings: number;
    costSavingsPercentage: number;
    qualityRatio: number;
  }[];
}
```

#### Cost Attribution API

```typescript
// POST /api/v1/cost-tracking/attribute
interface CostAttributionRequest {
  requestId: string;
  attributionData: {
    agentId?: string;
    taskId?: string;
    workflowId?: string;
    taskType?: string;
    purpose?: string;
    tags?: string[];
    customAttributes?: Record<string, string>;
  };
}

interface CostAttributionResponse {
  success: boolean;
  requestId: string;
  message?: string;
}
```

#### Model Performance Feedback API

```typescript
// POST /api/v1/model-feedback
interface ModelFeedbackRequest {
  requestId: string;
  provider: string;
  model: string;
  ratings: {
    overall: number; // 1-10
    accuracy?: number;
    relevance?: number;
    creativity?: number;
    reasoning?: number;
    speed?: number;
    [key: string]: number | undefined;
  };
  comments?: string;
  taskSuccessful: boolean;
  alternativeRequested?: boolean;
}

interface ModelFeedbackResponse {
  success: boolean;
  message?: string;
  feedbackId: string;
}
```

## 7. Testing Strategy

### 7.1 Unit Tests

- Budget Manager service tests
- Cost Analyzer service tests
- Model Selector algorithm tests
- Budget Enforcer logic tests
- Steering rule extension tests

### 7.2 Integration Tests

- Budget status API integration tests
- Cost estimation API integration tests
- Model selection with budget constraints tests
- Database integration tests
- Error handling integration tests

### 7.3 End-to-End Tests

- Complete request flow with budget constraints
- Budget alert generation and notification
- UI functionality tests
- API contract validation tests
- Performance under load tests

### 7.4 Simulation Tests

- Budget exhaustion simulation
- High-volume request simulation
- Cost spike detection tests
- Budget reset and adjustment tests
- Multi-tenant isolation tests

## 8. Deployment and Rollout Plan

### 8.1 Database Migration

1. Create new tables for budget and cost tracking
2. Add indexes for performance optimization
3. Set up initial data for model cost profiles
4. Configure backup and recovery procedures

### 8.2 Feature Flag Strategy

1. Deploy code behind feature flags
2. Enable features progressively:
   - First: Cost tracking and analysis (read-only)
   - Second: Budget configuration and monitoring
   - Third: Cost-aware model selection
   - Fourth: Budget enforcement

### 8.3 Rollout Phases

1. **Alpha Phase** (Week 1)
   - Internal testing with development team
   - Monitoring for any issues or performance impacts
   - Gathering initial feedback

2. **Beta Phase** (Week 2-3)
   - Limited release to select customers
   - Monitor usage patterns and gather feedback
   - Refine UI and user experience

3. **General Availability** (Week 4)
   - Full release to all customers
   - Marketing and documentation updates
   - Training sessions for customer success team

### 8.4 Monitoring and Alerts

1. Set up monitoring for:
   - Budget status changes
   - Cost anomalies
   - API performance
   - Database performance
   - Error rates

2. Configure alerts for:
   - Budget threshold crossings
   - Cost spikes
   - System performance issues
   - Database issues
   - API failures

## 9. Documentation

### 9.1 User Documentation

- Budget configuration guide
- Cost optimization best practices
- Model selection strategies
- Reporting and analytics guide
- Troubleshooting guide

### 9.2 Developer Documentation

- API reference
- Integration guide
- Schema documentation
- Extension points
- Custom rule development

### 9.3 Operations Documentation

- Deployment guide
- Monitoring setup
- Backup and recovery procedures
- Performance tuning
- Troubleshooting guide