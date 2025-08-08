# 🚗 Automotive Prompt Library - Template Specifications

## Overview
Pre-built workflow templates specifically designed for automotive dealership use cases. These templates will be implemented as database seeds once the foundation stabilization is complete.

## Template Categories

### 1. Sales Process Automation

#### 1.1 Lead Qualification Workflow
```json
{
  "id": "auto-lead-qualification",
  "name": "Automotive Lead Qualification",
  "category": "sales",
  "description": "Automatically qualify and score incoming sales leads based on customer information and preferences",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "New Lead Received" }
      },
      {
        "id": "extract-info",
        "type": "ai",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Extract Customer Information",
          "prompt": "Extract and structure the following information from the customer inquiry:\n- Budget range\n- Vehicle preferences (make, model, year)\n- Timeline for purchase\n- Trade-in information\n- Contact preferences\n- Financing needs\n\nCustomer Inquiry: {{customer_message}}",
          "model": "gpt-4",
          "temperature": 0.1
        }
      },
      {
        "id": "score-lead",
        "type": "ai",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "Score Lead Quality",
          "prompt": "Based on the extracted customer information, provide a lead quality score (1-10) and reasoning:\n\nCustomer Info: {{extracted_info}}\n\nConsider:\n- Budget alignment with inventory\n- Purchase timeline urgency\n- Specificity of requirements\n- Contact responsiveness indicators\n\nProvide score and next recommended action.",
          "model": "gpt-4",
          "temperature": 0.2
        }
      },
      {
        "id": "route-decision",
        "type": "decision",
        "position": { "x": 700, "y": 100 },
        "data": {
          "label": "Route Based on Score",
          "condition": "lead_score >= 7"
        }
      },
      {
        "id": "high-priority",
        "type": "action",
        "position": { "x": 600, "y": 200 },
        "data": {
          "label": "High Priority Follow-up",
          "action": "assign_to_senior_sales",
          "priority": "immediate"
        }
      },
      {
        "id": "standard-nurture",
        "type": "action",
        "position": { "x": 800, "y": 200 },
        "data": {
          "label": "Standard Nurture Campaign",
          "action": "add_to_nurture_sequence",
          "priority": "standard"
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "extract-info" },
      { "id": "e2", "source": "extract-info", "target": "score-lead" },
      { "id": "e3", "source": "score-lead", "target": "route-decision" },
      { "id": "e4", "source": "route-decision", "target": "high-priority", "condition": "true" },
      { "id": "e5", "source": "route-decision", "target": "standard-nurture", "condition": "false" }
    ]
  },
  "parameters": [
    {
      "name": "customer_message",
      "type": "text",
      "description": "Initial customer inquiry or lead information",
      "required": true
    },
    {
      "name": "inventory_data",
      "type": "json",
      "description": "Current dealership inventory for budget alignment",
      "required": false
    }
  ]
}
```

#### 1.2 Vehicle Recommendation Engine
```json
{
  "id": "auto-vehicle-recommendation",
  "name": "Intelligent Vehicle Recommendation",
  "category": "sales",
  "description": "Recommend vehicles based on customer preferences, budget, and inventory",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Customer Preferences Input" }
      },
      {
        "id": "analyze-preferences",
        "type": "ai",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Analyze Customer Preferences",
          "prompt": "Analyze customer preferences and create a detailed profile:\n\nCustomer Input: {{customer_preferences}}\nBudget: {{budget_range}}\nFamily Size: {{family_size}}\nUsage Patterns: {{usage_patterns}}\n\nCreate a comprehensive customer profile including:\n- Primary vehicle use case\n- Must-have features\n- Nice-to-have features\n- Deal-breaker features\n- Lifestyle alignment factors",
          "model": "gpt-4",
          "temperature": 0.3
        }
      },
      {
        "id": "match-inventory",
        "type": "ai",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "Match Against Inventory",
          "prompt": "Match the customer profile against available inventory:\n\nCustomer Profile: {{customer_profile}}\nAvailable Inventory: {{inventory_data}}\n\nProvide top 5 vehicle recommendations with:\n- Match score (1-10)\n- Key selling points\n- Potential objections and responses\n- Financing options\n- Competitive advantages",
          "model": "gpt-4",
          "temperature": 0.2
        }
      },
      {
        "id": "create-presentation",
        "type": "ai",
        "position": { "x": 700, "y": 100 },
        "data": {
          "label": "Create Sales Presentation",
          "prompt": "Create a personalized sales presentation:\n\nRecommendations: {{vehicle_matches}}\nCustomer Profile: {{customer_profile}}\n\nGenerate:\n- Compelling presentation narrative\n- Key benefit statements\n- Objection handling scripts\n- Financing presentation\n- Next steps and call-to-action",
          "model": "gpt-4",
          "temperature": 0.4
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "analyze-preferences" },
      { "id": "e2", "source": "analyze-preferences", "target": "match-inventory" },
      { "id": "e3", "source": "match-inventory", "target": "create-presentation" }
    ]
  },
  "parameters": [
    {
      "name": "customer_preferences",
      "type": "text",
      "description": "Customer's stated vehicle preferences and requirements",
      "required": true
    },
    {
      "name": "budget_range",
      "type": "text",
      "description": "Customer's budget range for vehicle purchase",
      "required": true
    },
    {
      "name": "family_size",
      "type": "number",
      "description": "Number of family members",
      "required": false
    },
    {
      "name": "usage_patterns",
      "type": "text",
      "description": "How the customer plans to use the vehicle",
      "required": false
    },
    {
      "name": "inventory_data",
      "type": "json",
      "description": "Current dealership inventory with specifications and pricing",
      "required": true
    }
  ]
}
```

### 2. Service Department Automation

#### 2.1 Service Appointment Optimization
```json
{
  "id": "auto-service-scheduling",
  "name": "Intelligent Service Scheduling",
  "category": "service",
  "description": "Optimize service appointments based on customer needs, technician availability, and parts inventory",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Service Request Received" }
      },
      {
        "id": "diagnose-issue",
        "type": "ai",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Initial Diagnosis",
          "prompt": "Analyze the customer's service request and provide initial diagnosis:\n\nCustomer Description: {{customer_issue}}\nVehicle Info: {{vehicle_details}}\nMileage: {{mileage}}\nService History: {{service_history}}\n\nProvide:\n- Likely causes of the issue\n- Required diagnostic steps\n- Estimated repair time\n- Parts likely needed\n- Urgency level (1-5)",
          "model": "gpt-4",
          "temperature": 0.2
        }
      },
      {
        "id": "check-availability",
        "type": "action",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "Check Technician & Parts Availability",
          "action": "check_resources",
          "inputs": ["diagnosis", "estimated_time", "required_parts"]
        }
      },
      {
        "id": "optimize-schedule",
        "type": "ai",
        "position": { "x": 700, "y": 100 },
        "data": {
          "label": "Optimize Appointment Scheduling",
          "prompt": "Optimize the service appointment based on:\n\nDiagnosis: {{diagnosis}}\nTechnician Availability: {{tech_availability}}\nParts Availability: {{parts_availability}}\nCustomer Preferences: {{customer_preferences}}\nUrgency Level: {{urgency}}\n\nRecommend:\n- Best appointment time slots\n- Alternative options if preferred time unavailable\n- Estimated completion time\n- Cost estimate\n- Loaner car recommendation if needed",
          "model": "gpt-4",
          "temperature": 0.3
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "diagnose-issue" },
      { "id": "e2", "source": "diagnose-issue", "target": "check-availability" },
      { "id": "e3", "source": "check-availability", "target": "optimize-schedule" }
    ]
  },
  "parameters": [
    {
      "name": "customer_issue",
      "type": "text",
      "description": "Customer's description of the vehicle issue",
      "required": true
    },
    {
      "name": "vehicle_details",
      "type": "json",
      "description": "Vehicle make, model, year, VIN",
      "required": true
    },
    {
      "name": "mileage",
      "type": "number",
      "description": "Current vehicle mileage",
      "required": true
    },
    {
      "name": "service_history",
      "type": "json",
      "description": "Previous service records",
      "required": false
    },
    {
      "name": "customer_preferences",
      "type": "json",
      "description": "Customer scheduling preferences and constraints",
      "required": false
    }
  ]
}
```

### 3. Parts Department Automation

#### 3.1 Inventory Optimization
```json
{
  "id": "auto-parts-inventory",
  "name": "Parts Inventory Optimization",
  "category": "parts",
  "description": "Optimize parts inventory based on seasonal trends, service patterns, and vehicle population",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Inventory Analysis Trigger" }
      },
      {
        "id": "analyze-trends",
        "type": "ai",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Analyze Usage Trends",
          "prompt": "Analyze parts usage trends and patterns:\n\nHistorical Usage: {{usage_history}}\nSeasonal Data: {{seasonal_patterns}}\nVehicle Population: {{local_vehicle_data}}\nService Forecasts: {{service_forecasts}}\n\nIdentify:\n- High-turnover parts needing stock increase\n- Slow-moving parts for reduction\n- Seasonal adjustment recommendations\n- Emergency stock requirements\n- Cost optimization opportunities",
          "model": "gpt-4",
          "temperature": 0.2
        }
      },
      {
        "id": "calculate-optimal-levels",
        "type": "ai",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "Calculate Optimal Stock Levels",
          "prompt": "Calculate optimal inventory levels:\n\nTrend Analysis: {{trend_analysis}}\nCurrent Stock: {{current_inventory}}\nLead Times: {{supplier_lead_times}}\nBudget Constraints: {{inventory_budget}}\n\nProvide:\n- Recommended stock levels for each part\n- Reorder points and quantities\n- Budget allocation recommendations\n- Risk assessment for stockouts\n- ROI projections for changes",
          "model": "gpt-4",
          "temperature": 0.1
        }
      },
      {
        "id": "generate-orders",
        "type": "action",
        "position": { "x": 700, "y": 100 },
        "data": {
          "label": "Generate Purchase Orders",
          "action": "create_purchase_orders",
          "inputs": ["optimal_levels", "current_stock", "supplier_info"]
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "analyze-trends" },
      { "id": "e2", "source": "analyze-trends", "target": "calculate-optimal-levels" },
      { "id": "e3", "source": "calculate-optimal-levels", "target": "generate-orders" }
    ]
  },
  "parameters": [
    {
      "name": "usage_history",
      "type": "json",
      "description": "Historical parts usage data",
      "required": true
    },
    {
      "name": "seasonal_patterns",
      "type": "json",
      "description": "Seasonal usage patterns and trends",
      "required": true
    },
    {
      "name": "local_vehicle_data",
      "type": "json",
      "description": "Local vehicle population and demographics",
      "required": true
    },
    {
      "name": "service_forecasts",
      "type": "json",
      "description": "Upcoming service appointment forecasts",
      "required": false
    },
    {
      "name": "current_inventory",
      "type": "json",
      "description": "Current parts inventory levels",
      "required": true
    },
    {
      "name": "inventory_budget",
      "type": "number",
      "description": "Available budget for inventory purchases",
      "required": true
    }
  ]
}
```

### 4. Customer Communication Automation

#### 4.1 Follow-up Communication Generator
```json
{
  "id": "auto-customer-followup",
  "name": "Automated Customer Follow-up",
  "category": "communication",
  "description": "Generate personalized follow-up communications based on customer interaction history",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "start",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Follow-up Trigger" }
      },
      {
        "id": "analyze-interaction",
        "type": "ai",
        "position": { "x": 300, "y": 100 },
        "data": {
          "label": "Analyze Customer Interaction",
          "prompt": "Analyze the customer interaction and determine appropriate follow-up:\n\nInteraction Type: {{interaction_type}}\nCustomer History: {{customer_history}}\nInteraction Details: {{interaction_details}}\nOutcome: {{interaction_outcome}}\nCustomer Sentiment: {{customer_sentiment}}\n\nDetermine:\n- Appropriate follow-up timing\n- Communication channel preference\n- Key messages to include\n- Offers or incentives to consider\n- Next best action",
          "model": "gpt-4",
          "temperature": 0.3
        }
      },
      {
        "id": "generate-message",
        "type": "ai",
        "position": { "x": 500, "y": 100 },
        "data": {
          "label": "Generate Personalized Message",
          "prompt": "Create a personalized follow-up message:\n\nAnalysis: {{interaction_analysis}}\nCustomer Profile: {{customer_profile}}\nDealership Brand Voice: {{brand_guidelines}}\nCommunication Channel: {{preferred_channel}}\n\nGenerate:\n- Subject line (if email)\n- Personalized greeting\n- Relevant content based on interaction\n- Clear call-to-action\n- Professional closing\n- Appropriate tone and style",
          "model": "gpt-4",
          "temperature": 0.4
        }
      },
      {
        "id": "schedule-delivery",
        "type": "action",
        "position": { "x": 700, "y": 100 },
        "data": {
          "label": "Schedule Message Delivery",
          "action": "schedule_communication",
          "inputs": ["message", "timing", "channel", "customer_contact"]
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start", "target": "analyze-interaction" },
      { "id": "e2", "source": "analyze-interaction", "target": "generate-message" },
      { "id": "e3", "source": "generate-message", "target": "schedule-delivery" }
    ]
  },
  "parameters": [
    {
      "name": "interaction_type",
      "type": "select",
      "options": ["sales_visit", "service_appointment", "phone_inquiry", "website_visit", "test_drive"],
      "description": "Type of customer interaction",
      "required": true
    },
    {
      "name": "customer_history",
      "type": "json",
      "description": "Customer's interaction and purchase history",
      "required": true
    },
    {
      "name": "interaction_details",
      "type": "text",
      "description": "Specific details of the interaction",
      "required": true
    },
    {
      "name": "interaction_outcome",
      "type": "text",
      "description": "Result or outcome of the interaction",
      "required": true
    },
    {
      "name": "customer_sentiment",
      "type": "select",
      "options": ["very_positive", "positive", "neutral", "negative", "very_negative"],
      "description": "Customer sentiment during interaction",
      "required": false
    }
  ]
}
```

## Implementation Strategy

### Database Seeding
These templates will be inserted into the `templates` table with corresponding `template_parameters` once the backend quality fixes are complete.

### Integration Points
- **Monaco Editor**: Rich editing for prompt customization
- **React Flow**: Visual workflow representation
- **LangGraph**: Multi-step workflow orchestration
- **WebSocket**: Real-time execution monitoring

### Customization Features
- **Parameter Substitution**: Dynamic content based on dealership data
- **Brand Customization**: Dealership-specific messaging and tone
- **Integration Hooks**: Connect to existing DMS/CRM systems
- **Performance Metrics**: Track template effectiveness and ROI

## Next Steps
1. **Foundation Completion**: Wait for critical fixes to complete
2. **Database Migration**: Create migration for template seeding
3. **UI Integration**: Connect templates to workflow builder
4. **Testing**: Validate templates with real dealership scenarios
5. **Documentation**: Create user guides for template customization