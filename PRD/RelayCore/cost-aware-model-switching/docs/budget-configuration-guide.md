# Budget Configuration Guide

This guide provides instructions for configuring and managing budgets in the Cost-Aware Model Switching system. Budgets allow you to control AI usage costs by setting limits and defining actions when thresholds are reached.

## Overview

The budget management system allows you to:

1. Define budgets at organization, team, and user levels
2. Set spending limits for different time periods
3. Configure warning and critical thresholds
4. Define actions to take when thresholds are reached
5. Monitor budget usage and receive alerts

## Budget Hierarchy

Budgets are organized in a hierarchical structure:

1. **Organization Budgets**: Apply to an entire organization
2. **Team Budgets**: Apply to specific teams within an organization
3. **User Budgets**: Apply to individual users

When multiple budgets apply to a request (e.g., user, team, and organization budgets), the system checks them in order of specificity: user > team > organization.

## Creating a Budget

To create a new budget, use the Budget Management API:

```
POST /api/v1/budgets
```

### Request Body

```json
{
  "name": "Engineering Team Monthly Budget",
  "description": "Monthly AI usage budget for the Engineering team",
  "scope": "team",
  "scopeId": "team-123",
  "limitAmount": 1500.00,
  "currency": "USD",
  "period": "monthly",
  "warningThreshold": 70.00,
  "criticalThreshold": 90.00,
  "warningAction": "notify",
  "criticalAction": "restrict-models",
  "exhaustedAction": "block-all",
  "allowOverrides": true,
  "overrideRoles": ["team_lead", "admin"]
}
```

### Budget Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `name` | Budget name | Yes | - |
| `description` | Budget description | No | - |
| `scope` | Budget scope (`organization`, `team`, or `user`) | Yes | - |
| `scopeId` | ID of the organization, team, or user | Yes | - |
| `limitAmount` | Budget limit amount | Yes | - |
| `currency` | Currency code (e.g., `USD`, `EUR`) | Yes | `USD` |
| `period` | Budget period (`daily`, `weekly`, `monthly`, `quarterly`, `yearly`) | Yes | `monthly` |
| `warningThreshold` | Percentage threshold for warning alerts | No | 70 |
| `criticalThreshold` | Percentage threshold for critical alerts | No | 90 |
| `warningAction` | Action to take when warning threshold is reached | No | `notify` |
| `criticalAction` | Action to take when critical threshold is reached | No | `restrict-models` |
| `exhaustedAction` | Action to take when budget is exhausted | No | `block-all` |
| `allowOverrides` | Whether to allow overrides of budget restrictions | No | `false` |
| `overrideRoles` | Roles that can override budget restrictions | No | `[]` |

## Budget Actions

When a budget threshold is reached, the system can take the following actions:

| Action | Description |
|--------|-------------|
| `notify` | Send notifications to users and administrators |
| `restrict-models` | Restrict usage to lower-cost models |
| `block-expensive` | Block usage of expensive models |
| `block-all` | Block all AI usage |
| `require-approval` | Require approval for AI usage |
| `none` | Take no action |

## Budget Periods

Budgets can be defined for different time periods:

| Period | Description |
|--------|-------------|
| `daily` | Budget resets every day |
| `weekly` | Budget resets every week (Monday) |
| `monthly` | Budget resets every month (1st day) |
| `quarterly` | Budget resets every quarter (Jan 1, Apr 1, Jul 1, Oct 1) |
| `yearly` | Budget resets every year (Jan 1) |
| `custom` | Custom date range (requires `startDate` and `endDate`) |

## Managing Budgets

### Retrieving Budgets

To retrieve all budgets:

```
GET /api/v1/budgets
```

To retrieve a specific budget:

```
GET /api/v1/budgets/:id
```

To retrieve budgets for a specific scope:

```
GET /api/v1/budgets/scope/:type/:id
```

### Updating Budgets

To update a budget:

```
PUT /api/v1/budgets/:id
```

### Deleting Budgets

To delete a budget:

```
DELETE /api/v1/budgets/:id
```

## Budget Status

To check the status of a budget:

```
GET /api/v1/budgets/:id/status
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Engineering Team Monthly Budget",
  "scope": "team",
  "scopeId": "team-123",
  "limitAmount": 1500.00,
  "currency": "USD",
  "period": "monthly",
  "currentSpend": 1050.00,
  "percentUsed": 70.00,
  "remaining": 450.00,
  "status": "warning",
  "startDate": "2025-08-01T00:00:00.000Z",
  "endDate": "2025-08-31T23:59:59.999Z",
  "lastUpdated": "2025-08-15T12:34:56.789Z"
}
```

## Budget Alerts

When a budget threshold is reached, the system generates alerts. Alerts can be viewed through the Budget Management API:

```
GET /api/v1/budgets/:id/alerts
```

### Response

```json
{
  "alerts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "budgetId": "550e8400-e29b-41d4-a716-446655440000",
      "alertType": "warning",
      "threshold": 70.00,
      "triggeredAt": "2025-08-15T12:34:56.789Z",
      "spendAmount": 1050.00,
      "limitAmount": 1500.00,
      "percentage": 70.00,
      "resolved": false
    }
  ]
}
```

## Budget Reports

To generate reports on budget usage:

```
GET /api/v1/budgets/:id/reports
```

### Query Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `startDate` | Start date for the report | Current period start |
| `endDate` | End date for the report | Current period end |
| `groupBy` | Group by parameter (`day`, `week`, `month`, `model`, `provider`) | - |

### Response

```json
{
  "budget": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering Team Monthly Budget",
    "limitAmount": 1500.00,
    "currency": "USD"
  },
  "summary": {
    "totalSpend": 1050.00,
    "percentUsed": 70.00,
    "remaining": 450.00
  },
  "breakdown": [
    {
      "date": "2025-08-01",
      "spend": 50.00
    },
    {
      "date": "2025-08-02",
      "spend": 75.00
    },
    // ...
    {
      "date": "2025-08-15",
      "spend": 65.00
    }
  ]
}
```

## Best Practices

### Setting Budget Limits

1. **Start Conservative**: Begin with conservative budget limits and adjust as needed
2. **Analyze Usage Patterns**: Use cost analysis reports to understand usage patterns
3. **Consider Seasonality**: Account for seasonal variations in AI usage
4. **Include Buffer**: Include a buffer for unexpected usage spikes

### Configuring Thresholds

1. **Early Warning**: Set warning thresholds early enough to take action (e.g., 70%)
2. **Critical Threshold**: Set critical thresholds to ensure time for intervention (e.g., 90%)
3. **Appropriate Actions**: Choose actions appropriate for each threshold

### Managing Budget Overrides

1. **Limit Override Access**: Restrict override capabilities to necessary roles
2. **Document Overrides**: Require documentation for budget overrides
3. **Review Overrides**: Regularly review budget overrides

### Monitoring and Adjusting

1. **Regular Review**: Regularly review budget usage and adjust as needed
2. **Investigate Spikes**: Investigate unusual spikes in usage
3. **Adjust Thresholds**: Adjust thresholds based on actual usage patterns
4. **Forecast Future Usage**: Use historical data to forecast future usage

## Example Scenarios

### Organization-wide Budget

```json
{
  "name": "Acme Corp Monthly Budget",
  "description": "Monthly AI usage budget for Acme Corporation",
  "scope": "organization",
  "scopeId": "org-123",
  "limitAmount": 5000.00,
  "currency": "USD",
  "period": "monthly",
  "warningThreshold": 70.00,
  "criticalThreshold": 90.00,
  "warningAction": "notify",
  "criticalAction": "restrict-models",
  "exhaustedAction": "block-expensive",
  "allowOverrides": true,
  "overrideRoles": ["admin"]
}
```

### Team Budget

```json
{
  "name": "Marketing Team Monthly Budget",
  "description": "Monthly AI usage budget for the Marketing team",
  "scope": "team",
  "scopeId": "team-456",
  "limitAmount": 1000.00,
  "currency": "USD",
  "period": "monthly",
  "warningThreshold": 70.00,
  "criticalThreshold": 90.00,
  "warningAction": "notify",
  "criticalAction": "restrict-models",
  "exhaustedAction": "block-all",
  "allowOverrides": true,
  "overrideRoles": ["team_lead", "admin"]
}
```

### User Budget

```json
{
  "name": "John's Monthly Budget",
  "description": "Monthly AI usage budget for John",
  "scope": "user",
  "scopeId": "user-789",
  "limitAmount": 200.00,
  "currency": "USD",
  "period": "monthly",
  "warningThreshold": 70.00,
  "criticalThreshold": 90.00,
  "warningAction": "notify",
  "criticalAction": "restrict-models",
  "exhaustedAction": "block-all",
  "allowOverrides": false
}
```

### Project-based Budget

```json
{
  "name": "Website Redesign Project Budget",
  "description": "AI usage budget for the Website Redesign project",
  "scope": "project",
  "scopeId": "project-101",
  "limitAmount": 500.00,
  "currency": "USD",
  "period": "custom",
  "startDate": "2025-08-01T00:00:00.000Z",
  "endDate": "2025-10-31T23:59:59.999Z",
  "warningThreshold": 70.00,
  "criticalThreshold": 90.00,
  "warningAction": "notify",
  "criticalAction": "restrict-models",
  "exhaustedAction": "require-approval",
  "allowOverrides": true,
  "overrideRoles": ["project_manager", "admin"]
}
```

## Troubleshooting

### Budget Not Enforced

If a budget is not being enforced:

1. Check that the budget is enabled
2. Verify that the budget scope and ID are correct
3. Ensure that the budget period is current
4. Check that the budget actions are configured correctly

### Incorrect Budget Usage

If budget usage appears incorrect:

1. Check for recent cost data synchronization issues
2. Verify that all AI usage is being tracked
3. Check for duplicate cost records
4. Ensure that the currency is consistent

### Budget Alerts Not Received

If budget alerts are not being received:

1. Check that alert notifications are enabled
2. Verify that notification destinations are configured correctly
3. Check that thresholds are set correctly
4. Ensure that the budget status is being updated