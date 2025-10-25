

# Budget Management System

 - Phase 1 Implementati

o

n

#

# Overvie

w

Phase 1 of the Budget Management System implements the core components for cost-aware model switching in RelayCore. This phase provides the foundation for budget definition, usage tracking, and constraint checking

.

#

# ✅ Implemented Component

s

#

##

 1. Core Servic

e

s

#

### Budget Registry (`src/services/budget-registry.ts

`

)

- **Purpose**: Manages the lifecycle of budget definition

s

- **Features**

:

  - Create, read, update, delete budget

s

  - Support for hierarchical budgets (parent-child relationships

)

  - Multi-scope support (organization, team, user, project

)

  - Recurring budget periods (daily, weekly, monthly, quarterly, annual, custom

)

  - Budget validation and constraint checkin

g

#

### Budget Tracker (`src/services/budget-tracker.ts

`

)

- **Purpose**: Monitors and records usage against budget

s

- **Features**

:

  - Record usage with detailed metadat

a

  - Real-time budget status calculatio

n

  - Budget utilization percentage trackin

g

  - Constraint checking for estimated cost

s

  - Usage history and summary reportin

g

  - Automatic cache refresh for performanc

e

#

### Budget Integration (`src/services/budget-integration.ts

`

)

- **Purpose**: Integrates budget tracking with AI request processin

g

- **Features**

:

  - Multi-scope constraint checking (user, team, project

)

  - Automatic usage recording for AI request

s

  - Budget summary generatio

n

  - Alert threshold monitorin

g

#

##

 2. Database Sche

m

a

#

### Enhanced Tables (`src/database/budget-schema.sql

`

)

- **budget_definitions**: Core budget configuration and metadat

a

- **budget_usage_records**: Detailed usage tracking with metadat

a

- **budget_alert_history**: Alert trigger history and acknowledgment

s

- **budget_status_cache**: Performance-optimized status calculation

s

#

### Database Function

s

- **calculate_budget_status()**: Real-time budget status calculatio

n

- **refresh_budget_status_cache()**: Cache management for performanc

e

- **Triggers**: Automatic cache updates on usage recordin

g

#

##

 3. RESTful API (`src/routes/budgets.ts

`

)

#

### Budget Management Endpoint

s

```
POST   /api/v1/budgets

                    - Create budget

GET    /api/v1/budgets/:id

               - Get budget details

PUT    /api/v1/budgets/:id

               - Update budget

DELETE /api/v1/budgets/:id

               - Delete budget

GET    /api/v1/budgets/scope/:type/:id

   - List budgets for scope

GET    /api/v1/budgets/hierarchy/:type/:id

 - Get budget hierarch

y

```

#

### Usage Tracking Endpoint

s

```

GET    /api/v1/budgets/:id/status

        - Get budget status

POST   /api/v1/budgets/:id/usage

         - Record usage

GET    /api/v1/budgets/:id/usage

         - Get usage history

GET    /api/v1/budgets/:id/usage/summary

 - Get usage summar

y

```

#

### Constraint Checking Endpoint

s

```

POST   /api/v1/budgets/:id/check-constraint

s

 - Check budget constraints

POST   /api/v1/budgets/:id/refresh-cach

e

     - Refresh status cach

e

```

#

##

 4. Type Definitions (`src/types/budget.ts

`

)

#

### Core Type

s

- **BudgetDefinition**: Complete budget configuratio

n

- **BudgetStatusInfo**: Real-time budget status and metric

s

- **UsageRecord**: Detailed usage tracking recor

d

- **BudgetConstraintCheck**: Constraint validation result

s

#

### Request/Response Type

s

- **CreateBudgetRequest**: Budget creation payloa

d

- **UpdateBudgetRequest**: Budget update payloa

d

- **RecordUsageRequest**: Usage recording payloa

d

#

##

 5. Testing Framework (`src/test/budget-management.test.t

s

`

)

#

### Test Coverag

e

- Budget Registry CRUD operation

s

- Budget Tracker usage recording and status calculatio

n

- Budget Integration multi-scope constraint checkin

g

- Error handling and edge case

s

- Database connection mockin

g

#

# 🚀 Usage Example

s

#

## Creating a Budge

t

```

typescript
const budgetRequest: CreateBudgetRequest = {
  name: "Q1 2025 AI Development Budget",
  description: "Budget for AI development activities",
  scopeType: "team",
  scopeId: "team-engineering-ai",

  amount: 5000,
  currency: "USD",
  period: "quarterly",
  startDate: "2025-01-01T00:00:00Z",

  recurring: true,
  alerts: [
    {
      threshold: 80,
      actions: ["notify", "restrict-models"],

      notificationChannels: ["email", "slack"],
    },
  ],
};

const budget = await budgetRegistry.createBudget(budgetRequest, "user-123")

;

```

#

## Recording Usag

e

```

typescript
const usageRequest: RecordUsageRequest = {
  amount: 25.5,

  currency: "USD",
  source: "relaycore",
  description: "GPT-4 API usage",

  metadata: {
    requestId: "req-789",

    modelId: "gpt-4",

    userId: "user-456",

    teamId: "team-123",

  },
};

const usageRecord = await budgetTracker.recordUsage(budgetId, usageRequest);

```

#

## Checking Constraint

s

```

typescript
const constraintCheck = await budgetTracker.checkBudgetConstraints(
  budgetId,
  estimatedCost,
);

if (!constraintCheck.canProceed) {
  console.log("Request blocked:", constraintCheck.reason);
  console.log("Suggested actions:", constraintCheck.suggestedActions);
}

```

#

# 📊 Budget Status Informatio

n

The system provides comprehensive budget status information:

```

typescript
interface BudgetStatusInfo {
  budgetId: string;
  currentAmount: number; // Current spend
  limit: number; // Budget limit
  currency: string; // Currency code
  percentUsed: number; // Percentage used (0-100)

  remaining: number; // Remaining amount
  daysRemaining: number; // Days left in period
  burnRate: number; // Average daily spend
  projectedTotal: number; // Projected total by period end
  status: BudgetStatus; // normal | warning | critical | exceeded
  activeAlerts: BudgetAlertStatus[]; // Currently active alerts
  lastUpdated: string; // Last update timestamp
}

```

#

# 🔧 Configuratio

n

#

## Environment Variable

s

```

bash
DATABASE_URL=postgresql://user:password@localhost:5432/relaycore
NODE_ENV=development

```

#

## Alert Action

s

- **notify**: Send notification onl

y

- **restrict-models**: Restrict access to expensive model

s

- **require-approval**: Require approval for further spendin

g

- **block-all**: Block all further spendin

g

- **auto-downgrade**: Automatically downgrade to cheaper model

s

#

# 🧪 Testin

g

Run the test suite:

```

bash
npm test -

- budget-management.test.t

s

```

Run the demo:

```

bash
npx ts-node src/demo/budget-demo.t

s

```

#

# 📈 Performance Feature

s

#

## Caching Strateg

y

- **budget_status_cache**: Pre-calculated status for fast retrieva

l

- **Automatic refresh**: Triggers update cache on usage recordin

g

- **Stale detection**: Refreshes cache older than 5 minute

s

#

## Database Optimizatio

n

- **Indexes**: Optimized for common query pattern

s

- **Functions**: PostgreSQL functions for complex calculation

s

- **Triggers**: Automatic cache maintenanc

e

#

# 🔒 Security & Validatio

n

#

## Input Validatio

n

- Required field validatio

n

- Data type and format validatio

n

- Business rule validation (positive amounts, valid dates

)

- SQL injection prevention through parameterized querie

s

#

## Error Handlin

g

- Graceful database connection error handlin

g

- Transaction rollback on failure

s

- Detailed error loggin

g

- User-friendly error message

s

#

# 🎯 Next Steps (Future Phases

)

#

## Phase 2: Advanced Feature

s

- **Budget Reporter**: Historical analysis and forecastin

g

- **Alert Manager**: Advanced notification syste

m

- **Usage Collector**: Automated cost data collectio

n

- **Multi-currency support**: Currency conversion and managemen

t

#

## Phase 3: Enterprise Feature

s

- **Approval workflows**: Multi-level approval processe

s

- **Advanced analytics**: Detailed reporting and insight

s

- **Integration APIs**: External system integration

s

- **Audit logging**: Comprehensive audit trail

s

#

# 📝 API Documentatio

n

Complete API documentation is available through the implemented endpoints. Each endpoint includes:

- Request/response schema

s

- Validation rule

s

- Error codes and message

s

- Usage example

s

#

# 🤝 Integration Point

s

The Budget Management System integrates with:

- **AI Request Processing**: Automatic constraint checkin

g

- **Cost Tracking**: Usage recording from AI provider

s

- **User Management**: Multi-scope budget assignmen

t

- **Notification Systems**: Alert delivery (future phase

)

--

- **Status**: ✅ Phase 1 Complet

e

 - Core functionality implemented and teste

d
**Next**: Ready for Phase 2 implementation (Advanced Features

)
