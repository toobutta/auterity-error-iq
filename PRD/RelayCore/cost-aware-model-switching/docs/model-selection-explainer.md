# Model Selection Explainer

The Model Selection Explainer component provides transparency into the decision-making process of the Cost-Aware Model Switching system. It explains why a particular model was selected for a request based on various factors such as cost, quality, budget constraints, and user preferences.

## Overview

When a model is selected for a request, the explainer:

1. Records the decision factors and weights used in the selection process
2. Compares the selected model with alternatives
3. Generates a human-readable explanation of the decision
4. Creates visualization data for the selection process
5. Stores the explanation for future reference

## API Endpoints

### Get Explanation by ID

Retrieves a specific explanation by its unique identifier.

```
GET /api/v1/explainer/:id
```

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2025-08-02T12:34:56.789Z",
  "selectedModel": "gpt-4-turbo",
  "originalModel": "gpt-4-turbo",
  "budgetStatus": "normal",
  "budgetPriority": "balanced",
  "qualityRequirement": "standard",
  "factors": {
    "cost": 0.4,
    "quality": 0.4,
    "budget": 0.1,
    "preference": 0.1
  },
  "comparisons": [
    {
      "modelId": "gpt-4-turbo",
      "provider": "OpenAI",
      "qualityScore": 85,
      "cost": {
        "amount": 0.0123,
        "currency": "USD"
      },
      "factors": [
        {
          "name": "Cost",
          "weight": 0.4,
          "score": 0.75,
          "description": "0.75 (0.0123 USD)"
        },
        {
          "name": "Quality",
          "weight": 0.4,
          "score": 0.85,
          "description": "0.85 (85/100)"
        },
        {
          "name": "Budget Impact",
          "weight": 0.1,
          "score": 0.95,
          "description": "0.95 (0.01/10.00)"
        },
        {
          "name": "Preference",
          "weight": 0.1,
          "score": 1,
          "description": "Preferred model"
        }
      ],
      "totalScore": 0.83,
      "selected": true
    },
    {
      "modelId": "gpt-3.5-turbo",
      "provider": "OpenAI",
      "qualityScore": 70,
      "cost": {
        "amount": 0.0023,
        "currency": "USD"
      },
      "factors": [
        {
          "name": "Cost",
          "weight": 0.4,
          "score": 0.95,
          "description": "0.95 (0.0023 USD)"
        },
        {
          "name": "Quality",
          "weight": 0.4,
          "score": 0.7,
          "description": "0.7 (70/100)"
        },
        {
          "name": "Budget Impact",
          "weight": 0.1,
          "score": 0.99,
          "description": "0.99 (0.002/10.00)"
        },
        {
          "name": "Preference",
          "weight": 0.1,
          "score": 0,
          "description": "Not preferred"
        }
      ],
      "totalScore": 0.78,
      "selected": false
    }
  ],
  "reasoning": "gpt-4-turbo was selected as it provides good quality at a cost of 0.0123 USD. Balanced priority was applied, considering both cost and quality. Standard quality requirement was applied. gpt-3.5-turbo would cost 0.0100 USD less but with lower quality (-15.0 points)",
  "visualizationData": {
    "radar": { /* Radar chart data */ },
    "bar": { /* Bar chart data */ },
    "cost": { /* Cost comparison data */ },
    "quality": { /* Quality comparison data */ },
    "weights": { /* Factor weights data */ }
  }
}
```

### Get Explanations by Request ID

Retrieves all explanations for a specific request.

```
GET /api/v1/explainer/request/:requestId
```

#### Response

```json
{
  "explanations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "requestId": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-08-02T12:34:56.789Z",
      "selectedModel": "gpt-4-turbo",
      "originalModel": "gpt-4-turbo",
      "budgetStatus": "normal",
      "budgetPriority": "balanced",
      "qualityRequirement": "standard",
      "factors": { /* ... */ },
      "comparisons": [ /* ... */ ],
      "reasoning": "gpt-4-turbo was selected as it provides good quality at a cost of 0.0123 USD...",
      "visualizationData": { /* ... */ }
    }
  ]
}
```

### Generate Explanation

Generates a new explanation for a model selection.

```
POST /api/v1/explainer/generate
```

#### Request Body

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440001",
  "selectedModel": "gpt-4-turbo",
  "originalModel": "gpt-4-turbo",
  "alternatives": [
    {
      "modelId": "gpt-3.5-turbo",
      "reason": "Lower cost",
      "costDifference": -0.01,
      "qualityDifference": -15
    }
  ],
  "budgetStatus": {
    "budgetId": "550e8400-e29b-41d4-a716-446655440002",
    "currentSpend": 500,
    "limitAmount": 1000,
    "percentUsed": 50,
    "remaining": 500,
    "status": "normal"
  },
  "budgetPriority": "balanced",
  "qualityRequirement": "standard",
  "modelOptions": [
    {
      "model": "gpt-4-turbo",
      "provider": "OpenAI",
      "qualityScore": 85,
      "estimatedCost": {
        "totalCost": 0.0123,
        "currency": "USD"
      }
    },
    {
      "model": "gpt-3.5-turbo",
      "provider": "OpenAI",
      "qualityScore": 70,
      "estimatedCost": {
        "totalCost": 0.0023,
        "currency": "USD"
      }
    }
  ]
}
```

#### Response

Same as the response for `GET /api/v1/explainer/:id`.

### Get Recent Explanations

Retrieves the most recent explanations.

```
GET /api/v1/explainer/recent?limit=10
```

#### Response

```json
{
  "explanations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "requestId": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-08-02T12:34:56.789Z",
      "selectedModel": "gpt-4-turbo",
      "originalModel": "gpt-4-turbo",
      "budgetStatus": "normal",
      "reasoning": "gpt-4-turbo was selected as it provides good quality at a cost of 0.0123 USD..."
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "requestId": "550e8400-e29b-41d4-a716-446655440004",
      "timestamp": "2025-08-02T12:30:00.000Z",
      "selectedModel": "claude-3-sonnet",
      "originalModel": "claude-3-opus",
      "budgetStatus": "warning",
      "reasoning": "claude-3-sonnet was selected as it provides good quality at a cost of 0.0089 USD. Budget is approaching its limit, so cost was considered carefully..."
    }
  ]
}
```

### Get Explanation Statistics

Retrieves statistics about model selection explanations.

```
GET /api/v1/explainer/stats
```

#### Response

```json
{
  "total": 1250,
  "modelDistribution": [
    {
      "selected_model": "gpt-3.5-turbo",
      "count": "500"
    },
    {
      "selected_model": "gpt-4-turbo",
      "count": "350"
    },
    {
      "selected_model": "claude-3-sonnet",
      "count": "250"
    },
    {
      "selected_model": "claude-3-haiku",
      "count": "150"
    }
  ],
  "budgetDistribution": [
    {
      "budget_status": "normal",
      "count": "800"
    },
    {
      "budget_status": "warning",
      "count": "300"
    },
    {
      "budget_status": "critical",
      "count": "100"
    },
    {
      "budget_status": "exceeded",
      "count": "50"
    }
  ],
  "changeStats": {
    "total": 1250,
    "changed": 350,
    "unchanged": 900,
    "changeRate": 28
  }
}
```

## Integration with Budget Dashboard

The Model Selection Explainer integrates with the Budget Dashboard to provide visual explanations of model selection decisions. The dashboard displays:

1. A summary of recent model selections
2. Visualizations of selection factors and weights
3. Comparisons between selected models and alternatives
4. Statistics on model selection patterns and budget impacts

## Database Schema

The explainer uses the `model_selection_explanations` table:

```sql
CREATE TABLE model_selection_explanations (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  selected_model VARCHAR(255) NOT NULL,
  original_model VARCHAR(255),
  budget_status VARCHAR(50),
  budget_priority VARCHAR(50) NOT NULL,
  quality_requirement VARCHAR(50) NOT NULL,
  factors JSONB NOT NULL,
  comparisons JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  visualization_data JSONB NOT NULL
);

CREATE INDEX idx_model_selection_explanations_request_id ON model_selection_explanations(request_id);
CREATE INDEX idx_model_selection_explanations_timestamp ON model_selection_explanations(timestamp);
```

## Visualization Types

The explainer generates several types of visualizations:

1. **Radar Chart**: Shows how each model scores across different factors
2. **Bar Chart**: Compares the total scores of different models
3. **Cost Comparison**: Compares the cost of different models
4. **Quality Comparison**: Compares the quality scores of different models
5. **Factor Weights**: Shows the weights assigned to different factors

## Decision Factors

The model selection process considers several factors:

1. **Cost**: The estimated cost of using the model for the request
2. **Quality**: The quality score of the model for the specific task type
3. **Budget Impact**: How the model's cost impacts the remaining budget
4. **Preference**: Whether the model was explicitly requested by the user

The weights of these factors are adjusted based on:

1. **Budget Priority**: Cost-saving, balanced, or quality-first
2. **Budget Status**: Normal, warning, critical, or exceeded
3. **Quality Requirement**: Minimum, standard, high, or maximum