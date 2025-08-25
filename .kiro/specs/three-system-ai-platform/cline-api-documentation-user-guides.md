# [CLINE-TASK] Comprehensive API Documentation and User Guides

## Task Assignment

**Tool**: Cline
**Priority**: Medium-High
**Estimated Time**: 6-8 hours
**Status**: Ready for Implementation (After Tasks 7, 15, 12 completion)

## Task Overview

Create comprehensive API documentation and user guides for all three systems (AutoMatrix, RelayCore, NeuroWeaver) including OpenAPI documentation generation, user guides, and developer documentation for integration and customization.

## Requirements Reference

- **Requirement 1.3**: Comprehensive API documentation
- **Requirement 1.4**: User guides and developer documentation

## Implementation Specifications

### 1. OpenAPI Documentation Generation

**Objective**: Generate comprehensive OpenAPI 3.0 documentation for all system APIs

**AutoMatrix API Documentation**:

```python
# backend/app/docs/openapi_config.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi_schema(app: FastAPI):
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="AutoMatrix AI Workflow Platform",
        version="1.0.0",
        description="""
        AutoMatrix is an AI-powered workflow automation platform designed for automotive dealerships.

        ## Features
        - Visual workflow builder with drag-and-drop interface
        - AI-powered task execution using multiple models
        - Real-time execution monitoring and logging
        - Template library with pre-built automotive workflows
        - Role-based access control and user management

        ## Authentication
        All API endpoints require JWT authentication. Obtain a token by calling the `/api/auth/login` endpoint.

        ## Rate Limiting
        API calls are rate-limited to 1000 requests per hour per user.
        """,
        routes=app.routes,
        servers=[
            {"url": "http://localhost:8000", "description": "Development server"},
            {"url": "https://api.autmatrix.com", "description": "Production server"}
        ]
    )

    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    # Add security to all endpoints
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if method != "options":
                openapi_schema["paths"][path][method]["security"] = [{"BearerAuth": []}]

    # Add response examples
    openapi_schema["components"]["examples"] = {
        "WorkflowExample": {
            "summary": "Sample automotive workflow",
            "value": {
                "name": "Customer Follow-up Workflow",
                "description": "Automated follow-up for service appointments",
                "steps": [
                    {
                        "type": "ai_task",
                        "prompt": "Generate personalized follow-up message for {customer_name} regarding their {service_type} appointment",
                        "model_preference": "gpt-3.5-turbo"
                    },
                    {
                        "type": "email_send",
                        "template": "service_followup",
                        "recipient": "{customer_email}"
                    }
                ]
            }
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema
```

**RelayCore API Documentation**:

```typescript
// systems/relaycore/src/docs/swagger-config.ts
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RelayCore AI Request Routing Service",
      version: "1.0.0",
      description: `
        RelayCore is an intelligent AI request routing service that optimizes model selection
        based on cost, performance, and specialization requirements.

        ## Features
        - Intelligent model selection and routing
        - Cost optimization and budget management
        - Performance monitoring and analytics
        - Support for multiple AI providers (OpenAI, Anthropic, Custom Models)
        - Real-time request logging and metrics

        ## Routing Logic
        RelayCore uses YAML-based routing rules to determine the optimal model for each request
        based on factors like:
        - Request context and domain
        - Cost constraints and budgets
        - Model performance and availability
        - User preferences and history
      `,
      contact: {
        name: "RelayCore Support",
        email: "support@relaycore.ai",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://api.relaycore.ai",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        AIRequest: {
          type: "object",
          required: ["prompt", "context"],
          properties: {
            prompt: {
              type: "string",
              description: "The AI prompt to process",
              example:
                "Explain the benefits of electric vehicles for automotive dealerships",
            },
            context: {
              type: "object",
              properties: {
                domain: {
                  type: "string",
                  enum: ["automotive", "general", "technical"],
                  description: "The domain context for specialized routing",
                },
                user_id: {
                  type: "string",
                  description:
                    "User identifier for personalization and billing",
                },
                max_cost: {
                  type: "number",
                  description: "Maximum cost in dollars for this request",
                },
              },
            },
            preferences: {
              type: "object",
              properties: {
                model_preference: {
                  type: "string",
                  description: "Preferred model if available and within budget",
                },
                quality_priority: {
                  type: "string",
                  enum: ["speed", "quality", "cost"],
                  description: "Optimization priority for model selection",
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/models/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
```

**NeuroWeaver API Documentation**:

```python
# systems/neuroweaver/backend/app/docs/openapi_config.py
def neuroweaver_openapi_schema(app):
    openapi_schema = get_openapi(
        title="NeuroWeaver Specialized AI Model Platform",
        version="1.0.0",
        description="""
        NeuroWeaver is a specialized AI model training and deployment platform focused on
        automotive industry applications.

        ## Features
        - Custom model training with automotive datasets
        - Specialized model registry and versioning
        - High-performance inference endpoints
        - Model performance monitoring and optimization
        - Integration with RelayCore for intelligent routing

        ## Model Specializations
        - **Automotive Sales**: Customer interaction and sales optimization
        - **Service Scheduling**: Appointment optimization and resource allocation
        - **Parts Management**: Inventory optimization and demand forecasting
        - **Customer Support**: Automated support and FAQ responses

        ## Training Pipeline
        NeuroWeaver uses QLoRA (Quantized Low-Rank Adaptation) and RLAIF (Reinforcement Learning
        from AI Feedback) to create highly specialized models with minimal computational overhead.
        """,
        routes=app.routes,
        servers=[
            {"url": "http://localhost:8001", "description": "Development server"},
            {"url": "https://api.neuroweaver.ai", "description": "Production server"}
        ]
    )

    # Add model-specific examples
    openapi_schema["components"]["examples"] = {
        "ModelRegistration": {
            "summary": "Register a new automotive model",
            "value": {
                "name": "automotive-sales-specialist-v2",
                "description": "Specialized model for automotive sales interactions",
                "specialization": "automotive_sales",
                "base_model": "llama-2-7b",
                "training_config": {
                    "method": "qlora",
                    "rank": 16,
                    "alpha": 32,
                    "dropout": 0.1
                },
                "performance_targets": {
                    "accuracy": 0.92,
                    "latency_ms": 1500,
                    "cost_per_1k_tokens": 0.002
                }
            }
        },
        "InferenceRequest": {
            "summary": "Automotive sales inference request",
            "value": {
                "model_id": "automotive-sales-specialist-v2",
                "prompt": "A customer is interested in electric vehicles but concerned about charging infrastructure. How should I address their concerns?",
                "context": {
                    "customer_profile": "suburban_family",
                    "previous_vehicles": ["honda_accord", "toyota_camry"],
                    "budget_range": "30000-45000"
                },
                "parameters": {
                    "max_tokens": 200,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
        }
    }

    return openapi_schema
```

### 2. User Guide Documentation

**File Structure**:

```
docs/
├── user-guides/
│   ├── autmatrix/
│   │   ├── getting-started.md
│   │   ├── workflow-builder.md
│   │   ├── template-library.md
│   │   ├── monitoring-dashboard.md
│   │   └── user-management.md
│   ├── relaycore/
│   │   ├── ai-routing-guide.md
│   │   ├── cost-optimization.md
│   │   ├── steering-rules.md
│   │   └── performance-monitoring.md
│   ├── neuroweaver/
│   │   ├── model-training.md
│   │   ├── model-deployment.md
│   │   ├── inference-api.md
│   │   └── performance-optimization.md
│   └── integration/
│       ├── three-system-setup.md
│       ├── authentication.md
│       ├── monitoring.md
│       └── troubleshooting.md
├── developer-guides/
│   ├── api-integration.md
│   ├── custom-models.md
│   ├── webhook-integration.md
│   └── sdk-documentation.md
└── assets/
    ├── images/
    ├── videos/
    └── diagrams/
```

**AutoMatrix User Guide Example**:

````markdown
# AutoMatrix Workflow Builder Guide

## Getting Started

AutoMatrix is an AI-powered workflow automation platform designed specifically for automotive dealerships. This guide will help you create, manage, and monitor automated workflows.

### Creating Your First Workflow

1. **Access the Workflow Builder**
   - Navigate to the Workflows section in the main menu
   - Click "Create New Workflow"
   - Choose from a template or start from scratch

2. **Design Your Workflow**
   - Drag and drop components from the toolbox
   - Connect components to define the execution flow
   - Configure each component's settings

3. **Add AI-Powered Steps**
   ```json
   {
     "type": "ai_task",
     "name": "Generate Customer Response",
     "prompt": "Create a personalized response for {customer_name} regarding their {inquiry_type}",
     "model_preference": "gpt-3.5-turbo",
     "context": {
       "domain": "automotive",
       "tone": "professional_friendly"
     }
   }
   ```
````

### Workflow Components

#### AI Task Component

- **Purpose**: Execute AI-powered tasks using natural language prompts
- **Configuration**:
  - Prompt template with variable substitution
  - Model preference (optional)
  - Context and domain specification
  - Output format requirements

#### Email Component

- **Purpose**: Send automated emails to customers or staff
- **Configuration**:
  - Recipient selection (dynamic or static)
  - Template selection
  - Variable substitution
  - Scheduling options

#### Decision Component

- **Purpose**: Create conditional logic in workflows
- **Configuration**:
  - Condition expression
  - True/false branch actions
  - Multiple condition support

### Template Library

AutoMatrix includes pre-built templates for common automotive workflows:

#### Customer Follow-up Template

- **Use Case**: Automated follow-up after service appointments
- **Components**: AI response generation, email sending, scheduling
- **Customization**: Easily modify prompts and timing

#### Lead Qualification Template

- **Use Case**: Qualify and route incoming sales leads
- **Components**: AI analysis, decision logic, CRM integration
- **Customization**: Adjust qualification criteria and routing rules

#### Service Reminder Template

- **Use Case**: Automated service reminders based on mileage/time
- **Components**: Data lookup, AI personalization, multi-channel communication
- **Customization**: Configure reminder intervals and communication preferences

### Monitoring and Analytics

#### Execution Dashboard

- Real-time workflow execution status
- Performance metrics and success rates
- Error tracking and resolution
- Cost analysis and optimization suggestions

#### Performance Metrics

- **Execution Time**: Average time for workflow completion
- **Success Rate**: Percentage of successful executions
- **Cost per Execution**: AI usage costs and optimization opportunities
- **User Satisfaction**: Feedback and rating collection

### Best Practices

1. **Prompt Engineering**
   - Use clear, specific prompts
   - Include relevant context variables
   - Test prompts with sample data
   - Monitor AI response quality

2. **Error Handling**
   - Add fallback steps for AI failures
   - Include human review checkpoints
   - Set up alert notifications
   - Implement retry logic

3. **Performance Optimization**
   - Use appropriate AI models for each task
   - Implement caching for repeated operations
   - Monitor execution times and costs
   - Regular workflow performance reviews

### Troubleshooting

#### Common Issues

**Workflow Not Executing**

- Check user permissions
- Verify all required fields are configured
- Review execution logs for errors
- Ensure AI service connectivity

**AI Responses Not Meeting Expectations**

- Review and refine prompts
- Add more specific context
- Consider using specialized models
- Implement human review steps

**High Execution Costs**

- Review model selection for each task
- Implement cost limits and budgets
- Use RelayCore optimization features
- Monitor usage patterns and optimize

### Integration with RelayCore and NeuroWeaver

AutoMatrix seamlessly integrates with RelayCore for intelligent AI routing and NeuroWeaver for specialized automotive models:

- **RelayCore Integration**: Automatic cost optimization and model selection
- **NeuroWeaver Integration**: Access to specialized automotive AI models
- **Unified Monitoring**: Cross-system performance and cost tracking

````

### 3. Developer Documentation

**File**: `docs/developer-guides/api-integration.md`
```markdown
# API Integration Guide

## Overview

This guide provides comprehensive information for developers integrating with the three-system AI platform (AutoMatrix, RelayCore, NeuroWeaver).

## Authentication

All three systems use JWT-based authentication with a unified token system.

### Obtaining Access Tokens

```javascript
// JavaScript/Node.js example
const axios = require('axios');

async function authenticate(baseUrl, credentials) {
  try {
    const response = await axios.post(`${baseUrl}/api/auth/login`, {
      username: credentials.username,
      password: credentials.password
    });

    return response.data.access_token;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.response.data.message}`);
  }
}

// Usage
const token = await authenticate('http://localhost:8000', {
  username: 'your-username',
  password: 'your-password'
});
````

```python
# Python example
import requests

def authenticate(base_url, credentials):
    response = requests.post(
        f"{base_url}/api/auth/login",
        json=credentials
    )

    if response.status_code == 200:
        return response.json()['access_token']
    else:
        raise Exception(f"Authentication failed: {response.json()['message']}")

# Usage
token = authenticate('http://localhost:8000', {
    'username': 'your-username',
    'password': 'your-password'
})
```

### Using Access Tokens

Include the JWT token in the Authorization header for all API requests:

```javascript
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
```

## AutoMatrix API Integration

### Creating Workflows Programmatically

```javascript
async function createWorkflow(token, workflowData) {
  const response = await axios.post(
    "http://localhost:8000/api/workflows",
    workflowData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

// Example workflow
const workflowData = {
  name: "API Created Workflow",
  description: "Workflow created via API integration",
  steps: [
    {
      type: "ai_task",
      name: "Generate Response",
      prompt: "Create a professional response for customer inquiry: {inquiry}",
      model_preference: "gpt-3.5-turbo",
      context: {
        domain: "automotive",
        tone: "professional",
      },
    },
    {
      type: "email_send",
      name: "Send Response",
      template: "customer_response",
      recipient: "{customer_email}",
      subject: "Response to Your Inquiry",
    },
  ],
  variables: [
    {
      name: "inquiry",
      type: "string",
      required: true,
      description: "Customer inquiry text",
    },
    {
      name: "customer_email",
      type: "email",
      required: true,
      description: "Customer email address",
    },
  ],
};

const workflow = await createWorkflow(token, workflowData);
```

### Executing Workflows

```javascript
async function executeWorkflow(token, workflowId, variables) {
  const response = await axios.post(
    `http://localhost:8000/api/workflows/${workflowId}/execute`,
    { variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

// Execute with variables
const execution = await executeWorkflow(token, workflow.id, {
  inquiry: "I'm interested in your electric vehicle options",
  customer_email: "customer@example.com",
});
```

## RelayCore API Integration

### Direct AI Requests

```javascript
async function sendAIRequest(token, requestData) {
  const response = await axios.post(
    "http://localhost:3001/api/ai/request",
    requestData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

// Example AI request
const aiRequest = {
  prompt: "Explain the benefits of hybrid vehicles for city driving",
  context: {
    domain: "automotive",
    user_id: "user123",
    max_cost: 0.05,
  },
  preferences: {
    quality_priority: "quality",
    model_preference: "gpt-4",
  },
};

const aiResponse = await sendAIRequest(token, aiRequest);
```

### Cost Monitoring

```javascript
async function getCostAnalysis(token, timeframe) {
  const response = await axios.get(
    `http://localhost:3001/api/analytics/costs?timeframe=${timeframe}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}

// Get cost analysis for the last 7 days
const costAnalysis = await getCostAnalysis(token, "7d");
```

## NeuroWeaver API Integration

### Model Inference

```javascript
async function runInference(token, modelId, inferenceData) {
  const response = await axios.post(
    `http://localhost:8001/api/models/${modelId}/inference`,
    inferenceData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

// Example inference request
const inferenceData = {
  prompt:
    "A customer wants to trade in their 2018 Honda Civic. What questions should I ask?",
  context: {
    customer_profile: "first_time_buyer",
    dealership_inventory: ["honda", "toyota", "nissan"],
  },
  parameters: {
    max_tokens: 150,
    temperature: 0.7,
  },
};

const inference = await runInference(
  token,
  "automotive-sales-v1",
  inferenceData,
);
```

### Model Management

```javascript
async function listAvailableModels(token) {
  const response = await axios.get("http://localhost:8001/api/models", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

async function getModelDetails(token, modelId) {
  const response = await axios.get(
    `http://localhost:8001/api/models/${modelId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
}
```

## SDK Development

### JavaScript/TypeScript SDK

```typescript
// autmatrix-sdk.ts
export class AutoMatrixSDK {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async createWorkflow(workflowData: WorkflowData): Promise<Workflow> {
    // Implementation
  }

  async executeWorkflow(
    workflowId: string,
    variables: Record<string, any>,
  ): Promise<Execution> {
    // Implementation
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    // Implementation
  }
}

// Usage
const sdk = new AutoMatrixSDK("http://localhost:8000", token);
const workflow = await sdk.createWorkflow(workflowData);
```

### Python SDK

```python
# autmatrix_sdk.py
class AutoMatrixSDK:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def create_workflow(self, workflow_data: dict) -> dict:
        response = self.session.post(
            f"{self.base_url}/api/workflows",
            json=workflow_data
        )
        response.raise_for_status()
        return response.json()

    def execute_workflow(self, workflow_id: str, variables: dict) -> dict:
        response = self.session.post(
            f"{self.base_url}/api/workflows/{workflow_id}/execute",
            json={'variables': variables}
        )
        response.raise_for_status()
        return response.json()

# Usage
sdk = AutoMatrixSDK('http://localhost:8000', token)
workflow = sdk.create_workflow(workflow_data)
```

## Error Handling

### Common Error Responses

```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Invalid or expired token",
    "details": {
      "token_expired": true,
      "expires_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Error Handling Best Practices

```javascript
async function handleAPICall(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Token expired, refresh authentication
          await refreshAuthentication();
          return await apiCall(); // Retry

        case 429:
          // Rate limited, implement exponential backoff
          await delay(calculateBackoffDelay(error.response.headers));
          return await apiCall(); // Retry

        case 500:
          // Server error, log and potentially retry
          console.error("Server error:", data);
          throw new Error("Service temporarily unavailable");

        default:
          throw new Error(`API error: ${data.error.message}`);
      }
    } else {
      throw new Error("Network error or service unavailable");
    }
  }
}
```

## Webhook Integration

### Setting Up Webhooks

```javascript
// Register webhook endpoint
async function registerWebhook(token, webhookData) {
  const response = await axios.post(
    "http://localhost:8000/api/webhooks",
    webhookData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

const webhook = await registerWebhook(token, {
  url: "https://your-app.com/webhooks/autmatrix",
  events: ["workflow.completed", "workflow.failed", "execution.started"],
  secret: "your-webhook-secret",
});
```

### Webhook Handler Example

```javascript
const express = require("express");
const crypto = require("crypto");

app.post("/webhooks/autmatrix", (req, res) => {
  const signature = req.headers["x-autmatrix-signature"];
  const payload = JSON.stringify(req.body);
  const secret = "your-webhook-secret";

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send("Invalid signature");
  }

  // Process webhook event
  const { event, data } = req.body;

  switch (event) {
    case "workflow.completed":
      handleWorkflowCompleted(data);
      break;
    case "workflow.failed":
      handleWorkflowFailed(data);
      break;
    case "execution.started":
      handleExecutionStarted(data);
      break;
  }

  res.status(200).send("OK");
});
```

````

### 4. Interactive Documentation Site

**File**: `docs/site/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three-System AI Platform Documentation</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.15.5/swagger-ui.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
            text-align: center;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .system-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }

        .system-card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }

        .system-card:hover {
            transform: translateY(-2px);
        }

        .system-card h3 {
            color: #333;
            margin-top: 0;
        }

        .api-links {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }

        .api-link {
            padding: 0.5rem 1rem;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9rem;
        }

        .api-link:hover {
            background: #0056b3;
        }

        .guide-section {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            margin: 2rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Three-System AI Platform</h1>
        <p>Comprehensive documentation for AutoMatrix, RelayCore, and NeuroWeaver</p>
    </div>

    <div class="container">
        <div class="system-grid">
            <div class="system-card">
                <h3>🚗 AutoMatrix</h3>
                <p>AI-powered workflow automation platform for automotive dealerships</p>
                <div class="api-links">
                    <a href="/api/autmatrix/docs" class="api-link">API Docs</a>
                    <a href="/guides/autmatrix/" class="api-link">User Guide</a>
                </div>
            </div>

            <div class="system-card">
                <h3>🔀 RelayCore</h3>
                <p>Intelligent AI request routing and cost optimization service</p>
                <div class="api-links">
                    <a href="/api/relaycore/docs" class="api-link">API Docs</a>
                    <a href="/guides/relaycore/" class="api-link">User Guide</a>
                </div>
            </div>

            <div class="system-card">
                <h3>🧠 NeuroWeaver</h3>
                <p>Specialized AI model training and deployment platform</p>
                <div class="api-links">
                    <a href="/api/neuroweaver/docs" class="api-link">API Docs</a>
                    <a href="/guides/neuroweaver/" class="api-link">User Guide</a>
                </div>
            </div>
        </div>

        <div class="guide-section">
            <h2>📚 Documentation Sections</h2>
            <div class="system-grid">
                <div>
                    <h4>User Guides</h4>
                    <ul>
                        <li><a href="/guides/getting-started/">Getting Started</a></li>
                        <li><a href="/guides/workflow-builder/">Workflow Builder</a></li>
                        <li><a href="/guides/ai-routing/">AI Request Routing</a></li>
                        <li><a href="/guides/model-training/">Model Training</a></li>
                    </ul>
                </div>

                <div>
                    <h4>Developer Guides</h4>
                    <ul>
                        <li><a href="/dev/api-integration/">API Integration</a></li>
                        <li><a href="/dev/authentication/">Authentication</a></li>
                        <li><a href="/dev/webhooks/">Webhook Integration</a></li>
                        <li><a href="/dev/sdks/">SDK Documentation</a></li>
                    </ul>
                </div>

                <div>
                    <h4>Integration Guides</h4>
                    <ul>
                        <li><a href="/integration/setup/">Three-System Setup</a></li>
                        <li><a href="/integration/monitoring/">Monitoring</a></li>
                        <li><a href="/integration/troubleshooting/">Troubleshooting</a></li>
                        <li><a href="/integration/best-practices/">Best Practices</a></li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="guide-section">
            <h2>🔧 Quick Start</h2>
            <p>Get started with the three-system AI platform in minutes:</p>

            <h4>1. Authentication</h4>
            <pre><code>curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username", "password": "your-password"}'</code></pre>

            <h4>2. Create a Workflow</h4>
            <pre><code>curl -X POST http://localhost:8000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "steps": [
      {
        "type": "ai_task",
        "prompt": "Generate a welcome message for new customers"
      }
    ]
  }'</code></pre>

            <h4>3. Execute Workflow</h4>
            <pre><code>curl -X POST http://localhost:8000/api/workflows/WORKFLOW_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN"</code></pre>
        </div>
    </div>
</body>
</html>
````

## Success Criteria

### Documentation Requirements

- ✅ Complete OpenAPI 3.0 documentation for all three systems
- ✅ Interactive API documentation with examples
- ✅ Comprehensive user guides for each system
- ✅ Developer integration guides with code examples
- ✅ SDK documentation for JavaScript/TypeScript and Python
- ✅ Webhook integration documentation

### Quality Requirements

- ✅ All API endpoints documented with examples
- ✅ Code examples tested and verified
- ✅ User guides include screenshots and step-by-step instructions
- ✅ Developer guides include error handling examples
- ✅ Documentation is searchable and well-organized

### Accessibility Requirements

- ✅ Documentation site is mobile-responsive
- ✅ Proper heading structure for screen readers
- ✅ Alt text for all images and diagrams
- ✅ High contrast colors for readability

## Dependencies

- **All three systems operational** with complete APIs
- **OpenAPI schema generation** implemented in each system
- **Documentation hosting** infrastructure set up
- **Example data and test accounts** for documentation

## Files to Create

1. **OpenAPI configurations** - Schema generation for all systems
2. **User guide documentation** - Comprehensive guides for each system
3. **Developer documentation** - API integration and SDK guides
4. **Interactive documentation site** - Web-based documentation portal
5. **Code examples and SDKs** - Working examples in multiple languages
6. **Video tutorials** - Screen recordings for complex workflows

---

**Cline**: Create comprehensive API documentation and user guides after completing the foundational tasks. Focus on creating clear, practical documentation that enables users and developers to successfully integrate with and use all three systems.
