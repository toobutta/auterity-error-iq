# Cost Data Synchronization

The Cost Data Synchronization component ensures that cost information is consistently maintained across the Cost-Aware Model Switching system, RelayCore, and Auterity. It provides mechanisms for periodic synchronization, real-time updates via webhooks, and data reconciliation.

## Overview

Cost data synchronization is essential for:

1. Accurate budget tracking across systems
2. Consistent cost reporting and analytics
3. Reliable model selection based on up-to-date cost information
4. Proper budget enforcement and alerts

The synchronization process includes:

1. Periodic synchronization of cost data between systems
2. Real-time updates via webhooks
3. Data reconciliation to identify and resolve discrepancies
4. Handling of cost-related events such as budget alerts and model cost updates

## Synchronization Process

### Periodic Synchronization

The system performs periodic synchronization of cost data with RelayCore and Auterity at configurable intervals (default: 1 hour). The process includes:

1. Fetching new cost data from RelayCore and Auterity since the last successful sync
2. Processing and storing the cost data in the local database
3. Updating budget spend based on the new cost data
4. Pushing local cost data to RelayCore and Auterity
5. Recording the sync history

### Real-time Updates via Webhooks

The system provides webhook endpoints for real-time cost data updates:

1. `/api/v1/webhooks/cost-data`: Receives cost data from external systems
2. `/api/v1/webhooks/budget-alert`: Receives budget alerts from external systems
3. `/api/v1/webhooks/model-cost-update`: Receives model cost updates from external systems

### Data Reconciliation

The system performs periodic reconciliation of cost data to identify and resolve discrepancies:

1. Comparing local cost data with data from RelayCore and Auterity
2. Identifying discrepancies in cost amounts, token counts, or other attributes
3. Recording discrepancies for analysis
4. Initiating resolution of discrepancies

## API Endpoints

### Cost Data Webhook

Receives cost data from external systems.

```
POST /api/v1/webhooks/cost-data
```

#### Request Body

```json
{
  "records": [
    {
      "request_id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "user-123",
      "organization_id": "org-456",
      "team_id": "team-789",
      "provider": "OpenAI",
      "model": "gpt-4-turbo",
      "input_tokens": 500,
      "output_tokens": 1000,
      "cost": 0.0123,
      "currency": "USD",
      "timestamp": "2025-08-02T12:34:56.789Z",
      "original_model": null,
      "downgraded": false,
      "budget_status": "normal"
    }
  ]
}
```

#### Response

```json
{
  "success": true
}
```

### Budget Alert Webhook

Receives budget alerts from external systems.

```
POST /api/v1/webhooks/budget-alert
```

#### Request Body

```json
{
  "budgetId": "550e8400-e29b-41d4-a716-446655440002",
  "alertType": "warning",
  "threshold": 70,
  "spendAmount": 700,
  "limitAmount": 1000
}
```

#### Response

```json
{
  "success": true
}
```

### Model Cost Update Webhook

Receives model cost updates from external systems.

```
POST /api/v1/webhooks/model-cost-update
```

#### Request Body

```json
{
  "provider": "OpenAI",
  "model": "gpt-4-turbo",
  "inputTokenCost": 0.00001,
  "outputTokenCost": 0.00003,
  "currency": "USD"
}
```

#### Response

```json
{
  "success": true
}
```

## Database Schema

The cost data synchronization component uses the following tables:

### Cost Sync History Table

```sql
CREATE TABLE cost_sync_history (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  from_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  to_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_cost_sync_history_timestamp ON cost_sync_history(created_at);
```

### Cost Reconciliation Table

```sql
CREATE TABLE cost_reconciliation (
  id UUID PRIMARY KEY,
  start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  total_records INTEGER NOT NULL,
  discrepancy_count INTEGER NOT NULL,
  discrepancies JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Configuration

The cost data synchronization component can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `RELAYCORE_API_URL` | URL of the RelayCore API | `http://relaycore:3000` |
| `AUTERITY_API_URL` | URL of the Auterity API | `http://auterity:3001` |
| `COST_SYNC_INTERVAL` | Interval for periodic synchronization (in milliseconds) | `3600000` (1 hour) |
| `WEBHOOK_SECRET` | Secret for webhook signature verification | - |

## Integration with RelayCore and Auterity

### RelayCore Integration

The cost data synchronization component integrates with RelayCore through:

1. Fetching cost data from RelayCore's cost data API
2. Pushing cost data to RelayCore's cost data API
3. Receiving cost data updates from RelayCore via webhooks
4. Reconciling cost data with RelayCore

### Auterity Integration

The cost data synchronization component integrates with Auterity through:

1. Fetching cost data from Auterity's cost data API
2. Pushing cost data to Auterity's cost data API
3. Receiving cost data updates from Auterity via webhooks
4. Reconciling cost data with Auterity

## Error Handling

The cost data synchronization component includes robust error handling:

1. Retrying failed synchronization attempts
2. Logging synchronization errors
3. Recording failed synchronization attempts in the sync history
4. Alerting administrators of persistent synchronization issues

## Monitoring and Reporting

The component provides monitoring and reporting capabilities:

1. Sync history for tracking synchronization status
2. Reconciliation reports for identifying and resolving discrepancies
3. Logging of synchronization events and errors
4. Metrics for synchronization performance and reliability

## Security

The component includes security features:

1. Webhook signature verification to ensure the authenticity of incoming webhooks
2. Authentication for API calls to RelayCore and Auterity
3. Secure handling of sensitive cost data
4. Rate limiting to prevent abuse