# Budget Management System Technical Specification

## 1. Overview

The Budget Management System is a core component of the Cost-Aware Model Switching feature, responsible for defining, tracking, and managing budgets across different organizational scopes (organization, team, user). It provides the foundation for cost-aware decision making throughout the integrated RelayCore and Auterity platform.

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Budget Management System                           │
│                                                                         │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐  │
│  │                 │      │                 │      │                 │  │
│  │ Budget Registry │◄────►│ Budget Tracker  │◄────►│ Budget Reporter │  │
│  │                 │      │                 │      │                 │  │
│  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘  │
│           │                        │                        │           │
│           ▼                        ▼                        ▼           │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐  │
│  │                 │      │                 │      │                 │  │
│  │ Budget Config   │      │ Usage Collector │      │ Alert Manager   │  │
│  │ API             │      │                 │      │                 │  │
│  └─────────────────┘      └─────────────────┘      └─────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                 │    │
│  │                      Persistence Layer                          │    │
│  │                                                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Component Descriptions

### 3.1 Budget Registry

The Budget Registry manages the lifecycle of budget definitions, including creation, retrieval, updating, and deletion.

**Responsibilities:**
- Store and manage budget definitions
- Handle budget hierarchy relationships
- Validate budget configurations
- Manage budget periods and rollovers
- Provide budget lookup by scope (org, team, user)

**Key Methods:**
- `createBudget(budgetDefinition)`
- `getBudget(budgetId)`
- `updateBudget(budgetId, updates)`
- `deleteBudget(budgetId)`
- `listBudgets(scopeType, scopeId)`
- `getBudgetHierarchy(scopeType, scopeId)`

### 3.2 Budget Tracker

The Budget Tracker monitors and records usage against budgets, calculating current status and remaining amounts.

**Responsibilities:**
- Track spending against budgets
- Calculate budget utilization percentages
- Handle multi-currency conversions
- Manage budget period transitions
- Provide real-time budget status

**Key Methods:**
- `recordUsage(budgetId, amount, metadata)`
- `getBudgetStatus(budgetId)`
- `calculateUtilization(budgetId)`
- `forecastRemainingPeriod(budgetId)`
- `checkBudgetConstraints(budgetId, estimatedCost)`

### 3.3 Budget Reporter

The Budget Reporter generates insights and reports on budget usage and trends.

**Responsibilities:**
- Generate budget usage reports
- Provide historical spending analysis
- Create budget forecasts
- Compare actual vs. planned spending
- Export budget data for external analysis

**Key Methods:**
- `generateReport(budgetId, timeRange)`
- `getHistoricalTrends(budgetId, timeRange)`
- `forecastFutureSpending(budgetId, daysAhead)`
- `exportBudgetData(budgetId, format)`
- `getBudgetAnalytics(budgetId)`

### 3.4 Budget Config API

The Budget Config API provides RESTful endpoints for managing budget configurations.

**Responsibilities:**
- Expose budget CRUD operations
- Handle authentication and authorization
- Validate incoming requests
- Provide budget configuration endpoints
- Document API usage

**Key Endpoints:**
- `POST /api/v1/budgets` - Create a new budget
- `GET /api/v1/budgets/:id` - Get a specific budget
- `PUT /api/v1/budgets/:id` - Update a budget
- `DELETE /api/v1/budgets/:id` - Delete a budget
- `GET /api/v1/budgets/scope/:type/:id` - List budgets for a scope

### 3.5 Usage Collector

The Usage Collector gathers cost data from various sources and attributes it to the appropriate budgets.

**Responsibilities:**
- Collect usage data from RelayCore and Auterity
- Attribute costs to appropriate budgets
- Handle delayed cost reporting
- Process batch usage records
- Validate usage data

**Key Methods:**
- `collectUsage(source, usageData)`
- `attributeUsage(usageData)`
- `processBatchUsage(usageBatch)`
- `handleDelayedUsage(usageData)`
- `validateUsageData(usageData)`

### 3.6 Alert Manager

The Alert Manager monitors budgets and triggers alerts based on defined thresholds.

**Responsibilities:**
- Monitor budget thresholds
- Trigger alerts when thresholds are crossed
- Manage notification channels
- Handle alert acknowledgments
- Provide alert history

**Key Methods:**
- `checkAlertThresholds(budgetId)`
- `triggerAlert(budgetId, threshold, alertType)`
- `getActiveAlerts(scopeType, scopeId)`
- `acknowledgeAlert(alertId)`
- `configureAlertChannel(channelConfig)`

### 3.7 Persistence Layer

The Persistence Layer handles data storage and retrieval for the Budget Management System.

**Responsibilities:**
- Store budget definitions
- Record usage data
- Maintain alert configurations
- Handle data migrations
- Manage data retention

**Key Methods:**
- `storeBudget(budgetData)`
- `retrieveBudget(budgetId)`
- `storeUsage(usageData)`
- `queryUsage(filters)`
- `storeAlert(alertData)`

## 4. Data Models

### 4.1 Budget Definition

```typescript
interface BudgetDefinition {
  id: string;                     // Unique identifier
  name: string;                   // Display name
  description?: string;           // Optional description
  scopeType: 'organization' | 'team' | 'user' | 'project'; // Budget scope
  scopeId: string;                // ID of the scope entity
  amount: number;                 // Budget amount
  currency: string;               // Currency code (USD, EUR, etc.)
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'; // Budget period
  startDate: string;              // ISO date string for period start
  endDate?: string;               // ISO date string for period end (optional for recurring)
  recurring: boolean;             // Whether budget recurs after period
  alerts: BudgetAlert[];          // Alert configurations
  tags?: Record<string, string>;  // Optional metadata tags
  createdAt: string;              // Creation timestamp
  updatedAt: string;              // Last update timestamp
  createdBy: string;              // User ID who created the budget
  parentBudgetId?: string;        // Optional parent budget for hierarchical budgets
}

interface BudgetAlert {
  threshold: number;              // Percentage threshold (0-100)
  actions: BudgetAction[];        // Actions to take when threshold is crossed
  notificationChannels?: string[]; // Channels to notify (email, slack, etc.)
  message?: string;               // Custom message for notification
}

type BudgetAction = 
  | 'notify'                      // Send notification only
  | 'restrict-models'             // Restrict access to expensive models
  | 'require-approval'            // Require approval for further spending
  | 'block-all'                   // Block all further spending
  | 'auto-downgrade';             // Automatically downgrade to cheaper models
```

### 4.2 Budget Status

```typescript
interface BudgetStatus {
  budgetId: string;               // Budget identifier
  currentAmount: number;          // Current spend amount
  limit: number;                  // Budget limit
  currency: string;               // Currency code
  percentUsed: number;            // Percentage used (0-100)
  remaining: number;              // Remaining amount
  daysRemaining: number;          // Days remaining in period
  burnRate: number;               // Average daily spend
  projectedTotal: number;         // Projected total by period end
  status: 'normal' | 'warning' | 'critical' | 'exceeded'; // Current status
  activeAlerts: BudgetAlertStatus[]; // Currently active alerts
  lastUpdated: string;            // Last update timestamp
}

interface BudgetAlertStatus {
  threshold: number;              // Alert threshold
  triggeredAt: string;            // When the alert was triggered
  actions: BudgetAction[];        // Actions being taken
  acknowledged: boolean;          // Whether alert was acknowledged
  acknowledgedBy?: string;        // Who acknowledged the alert
  acknowledgedAt?: string;        // When the alert was acknowledged
}
```

### 4.3 Usage Record

```typescript
interface UsageRecord {
  id: string;                     // Unique identifier
  budgetId: string;               // Associated budget
  amount: number;                 // Usage amount
  currency: string;               // Currency code
  timestamp: string;              // When the usage occurred
  source: 'relaycore' | 'auterity' | 'manual'; // Source of the usage
  description?: string;           // Optional description
  metadata: {
    requestId?: string;           // Associated request ID
    modelId?: string;             // AI model used
    userId?: string;              // User who generated the usage
    teamId?: string;              // Team associated with usage
    projectId?: string;           // Project associated with usage
    tags?: Record<string, string>; // Additional metadata tags
  };
}
```

## 5. API Endpoints

### 5.1 Budget Configuration API

#### Create Budget
```
POST /api/v1/budgets
```

Request:
```json
{
  "name": "Q3 Development",
  "description": "Budget for Q3 AI development activities",
  "scopeType": "team",
  "scopeId": "team-123",
  "amount": 10000,
  "currency": "USD",
  "period": "quarterly",
  "startDate": "2025-07-01T00:00:00Z",
  "recurring": true,
  "alerts": [
    {
      "threshold": 50,
      "actions": ["notify"],
      "notificationChannels": ["email", "slack"]
    },
    {
      "threshold": 80,
      "actions": ["notify", "restrict-models"],
      "notificationChannels": ["email", "slack", "dashboard"]
    },
    {
      "threshold": 95,
      "actions": ["notify", "require-approval"],
      "notificationChannels": ["email", "slack", "dashboard"]
    }
  ],
  "tags": {
    "department": "engineering",
    "purpose": "development"
  }
}
```

Response:
```json
{
  "id": "budget-abc123",
  "name": "Q3 Development",
  "description": "Budget for Q3 AI development activities",
  "scopeType": "team",
  "scopeId": "team-123",
  "amount": 10000,
  "currency": "USD",
  "period": "quarterly",
  "startDate": "2025-07-01T00:00:00Z",
  "endDate": "2025-09-30T23:59:59Z",
  "recurring": true,
  "alerts": [
    {
      "threshold": 50,
      "actions": ["notify"],
      "notificationChannels": ["email", "slack"]
    },
    {
      "threshold": 80,
      "actions": ["notify", "restrict-models"],
      "notificationChannels": ["email", "slack", "dashboard"]
    },
    {
      "threshold": 95,
      "actions": ["notify", "require-approval"],
      "notificationChannels": ["email", "slack", "dashboard"]
    }
  ],
  "tags": {
    "department": "engineering",
    "purpose": "development"
  },
  "createdAt": "2025-06-15T14:23:45Z",
  "updatedAt": "2025-06-15T14:23:45Z",
  "createdBy": "user-456"
}
```

#### Get Budget Status
```
GET /api/v1/budgets/:id/status
```

Response:
```json
{
  "budgetId": "budget-abc123",
  "currentAmount": 4500,
  "limit": 10000,
  "currency": "USD",
  "percentUsed": 45,
  "remaining": 5500,
  "daysRemaining": 45,
  "burnRate": 100,
  "projectedTotal": 9000,
  "status": "normal",
  "activeAlerts": [],
  "lastUpdated": "2025-08-02T18:30:00Z"
}
```

#### Record Usage
```
POST /api/v1/budgets/:id/usage
```

Request:
```json
{
  "amount": 25.50,
  "currency": "USD",
  "timestamp": "2025-08-02T18:25:30Z",
  "source": "relaycore",
  "description": "GPT-4 API usage",
  "metadata": {
    "requestId": "req-789",
    "modelId": "gpt-4",
    "userId": "user-456",
    "teamId": "team-123",
    "tags": {
      "project": "customer-chatbot",
      "environment": "production"
    }
  }
}
```

Response:
```json
{
  "id": "usage-xyz789",
  "budgetId": "budget-abc123",
  "amount": 25.50,
  "currency": "USD",
  "timestamp": "2025-08-02T18:25:30Z",
  "source": "relaycore",
  "description": "GPT-4 API usage",
  "metadata": {
    "requestId": "req-789",
    "modelId": "gpt-4",
    "userId": "user-456",
    "teamId": "team-123",
    "tags": {
      "project": "customer-chatbot",
      "environment": "production"
    }
  },
  "recorded": "2025-08-02T18:25:32Z"
}
```

#### Get Budget Reports
```
GET /api/v1/budgets/:id/reports
```

Parameters:
- `timeRange`: Time range for the report (e.g., "last-7-days", "current-period", "custom")
- `startDate`: Start date for custom time range
- `endDate`: End date for custom time range
- `groupBy`: How to group the data (e.g., "day", "week", "model", "user", "team")

Response:
```json
{
  "budgetId": "budget-abc123",
  "timeRange": "current-period",
  "startDate": "2025-07-01T00:00:00Z",
  "endDate": "2025-09-30T23:59:59Z",
  "totalSpend": 4500,
  "limit": 10000,
  "currency": "USD",
  "groupedData": [
    {
      "group": "2025-07",
      "amount": 1500,
      "percentage": 15
    },
    {
      "group": "2025-08",
      "amount": 3000,
      "percentage": 30
    }
  ],
  "topSpenders": [
    {
      "userId": "user-789",
      "amount": 1200,
      "percentage": 26.67
    },
    {
      "userId": "user-456",
      "amount": 950,
      "percentage": 21.11
    }
  ],
  "modelUsage": [
    {
      "modelId": "gpt-4",
      "amount": 2800,
      "percentage": 62.22
    },
    {
      "modelId": "claude-instant",
      "amount": 1200,
      "percentage": 26.67
    },
    {
      "modelId": "gpt-3.5-turbo",
      "amount": 500,
      "percentage": 11.11
    }
  ],
  "generatedAt": "2025-08-02T18:35:00Z"
}
```

## 6. Integration Points

### 6.1 Integration with RelayCore

The Budget Management System integrates with RelayCore through the following touchpoints:

1. **Usage Collection**:
   - Intercept requests and responses in RelayCore's HTTP proxy
   - Calculate costs based on token usage and model rates
   - Send usage data to the Budget Management System

2. **Budget Enforcement**:
   - Extend steering rules to check budget status before routing
   - Implement model downgrading based on budget constraints
   - Add budget override request workflow

3. **Budget Status API**:
   - Expose budget status to RelayCore components
   - Allow RelayCore to check budget constraints before processing requests
   - Provide cost estimates for different routing options

### 6.2 Integration with Auterity

The Budget Management System integrates with Auterity through the following touchpoints:

1. **Agent Cost Attribution**:
   - Track costs generated by Porter/Driver agents
   - Attribute costs to appropriate budgets based on agent metadata
   - Provide cost visibility for agent operations

2. **Budget-Aware Agent Selection**:
   - Allow agents to check budget status before execution
   - Implement cost-aware agent selection strategies
   - Provide budget constraint information to workflow engine

3. **Budget Alerts**:
   - Send budget alerts through Auterity's notification system
   - Display budget status in Auterity's UI
   - Integrate budget alerts with Kiro error intelligence system

## 7. Security Considerations

1. **Access Control**:
   - Budget creation/modification limited to authorized users
   - Budget viewing permissions based on scope and role
   - Audit logging for all budget operations

2. **Data Protection**:
   - Encryption of budget data at rest and in transit
   - Masking of sensitive cost details in logs
   - Compliance with data retention policies

3. **Validation**:
   - Input validation for all API endpoints
   - Prevention of negative budget amounts
   - Protection against budget manipulation attacks

## 8. Implementation Approach

### 8.1 Technology Stack

- **Backend**: Node.js with TypeScript (matching RelayCore)
- **Database**: MongoDB for budget definitions and PostgreSQL for usage data
- **Caching**: Redis for budget status and frequently accessed data
- **API**: Express.js RESTful API with OpenAPI documentation
- **Authentication**: JWT-based authentication with role-based access control
- **Messaging**: RabbitMQ for asynchronous usage processing

### 8.2 Development Phases

#### Phase 1: Core Budget Management
- Implement Budget Registry
- Create basic Budget Tracker
- Develop Budget Config API
- Set up persistence layer

#### Phase 2: Usage Tracking
- Implement Usage Collector
- Enhance Budget Tracker with real-time updates
- Create RelayCore integration for usage collection
- Develop basic reporting capabilities

#### Phase 3: Alerts and Enforcement
- Implement Alert Manager
- Create budget enforcement mechanisms
- Develop notification system integration
- Implement override workflows

#### Phase 4: Reporting and Analytics
- Enhance Budget Reporter with advanced analytics
- Create visualization components for dashboards
- Implement historical data analysis
- Develop export capabilities

### 8.3 Testing Strategy

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **API Tests**: Verify API contract compliance
- **Performance Tests**: Ensure system handles high volume of usage records
- **Security Tests**: Verify access controls and data protection

## 9. Deployment and Operations

### 9.1 Deployment Architecture

- Deploy as microservice within the integrated platform
- Use containerization (Docker) for consistent environments
- Implement horizontal scaling for high availability
- Set up database replication for data durability

### 9.2 Monitoring and Alerting

- Monitor API response times and error rates
- Track database performance and query times
- Set up alerts for system issues
- Monitor budget processing delays

### 9.3 Backup and Recovery

- Implement regular database backups
- Create point-in-time recovery capabilities
- Establish disaster recovery procedures
- Test recovery processes regularly

## 10. Documentation Requirements

- API documentation with OpenAPI specification
- User guide for budget management
- Administrator guide for system configuration
- Integration guide for RelayCore and Auterity developers
- Troubleshooting guide for common issues