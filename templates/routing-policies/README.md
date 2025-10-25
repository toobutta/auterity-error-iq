# 🚀 Routing Policy Templates

*Pre-development templates for Week 2: Unified AI Service Integration*

## Overview

This directory contains templates and configuration examples for routing policy management. These templates provide standardized patterns for implementing intelligent AI service routing based on performance, cost, and user requirements.

## Template Structure

```
templates/routing-policies/
├── README.md                    # This file
├── templates/                   # Policy templates
│   ├── enterprise-high-priority.json
│   ├── cost-optimized-standard.json
│   ├── performance-critical.json
│   └── geographic-routing.json
├── examples/                    # Usage examples
│   ├── api-integration.md
│   └── frontend-implementation.md
└── schemas/                     # JSON schemas
    ├── routing-policy.schema.json
    └── provider-config.schema.json
```

## Policy Templates

### 1. Enterprise High Priority
**File**: `templates/enterprise-high-priority.json`

**Use Case**: Enterprise users requiring maximum performance and reliability
- Primary: GPT-4 Turbo (fastest response)
- Fallback: Claude 3 Opus, GPT-4
- Cost optimization: Disabled
- Caching: Enabled
- Priority: 1 (highest)

### 2. Cost Optimized Standard
**File**: `templates/cost-optimized-standard.json`

**Use Case**: Standard tier users balancing cost and performance
- Primary: GPT-3.5 Turbo (cost-effective)
- Fallback: Claude 3 Haiku, GPT-4
- Cost optimization: Enabled
- Caching: Enabled
- Priority: 2 (medium)

### 3. Performance Critical
**File**: `templates/performance-critical.json`

**Use Case**: Applications requiring sub-second response times
- Primary: GPT-4 Turbo with caching
- Fallback: Claude 3 Opus
- Cost optimization: Moderate
- Caching: Aggressive
- Priority: 1 (highest)

### 4. Geographic Routing
**File**: `templates/geographic-routing.json`

**Use Case**: Route to geographically closer providers for latency optimization
- Primary: Regional provider selection
- Fallback: Global providers
- Cost optimization: Regional pricing
- Caching: Regional
- Priority: 3 (lower)

## Template Schema

### Routing Policy Structure
```json
{
  "$schema": "./schemas/routing-policy.schema.json",
  "id": "string",
  "name": "string",
  "description": "string",
  "version": "1.0.0",
  "priority": 1,
  "conditions": {
    "userTier": "enterprise|professional|standard",
    "serviceType": "chat|completion|embedding",
    "modelType": "gpt-4|claude-3|custom",
    "costThreshold": 0.01,
    "performanceRequirement": "high|medium|low",
    "geographicRegion": "us-east|us-west|eu-central|ap-southeast"
  },
  "actions": {
    "primaryProvider": "gpt-4-turbo",
    "fallbackProviders": ["claude-3-opus", "gpt-4"],
    "costOptimization": true,
    "cachingEnabled": true,
    "timeoutMs": 30000,
    "retryAttempts": 2
  },
  "monitoring": {
    "metricsEnabled": true,
    "alertThresholds": {
      "errorRate": 0.05,
      "responseTime": 5000,
      "costIncrease": 0.1
    }
  }
}
```

## Usage Examples

### API Integration
```typescript
// Create policy from template
const enterprisePolicy = await api.post('/api/routing-policies', {
  template: 'enterprise-high-priority',
  customizations: {
    name: 'Custom Enterprise Policy',
    conditions: {
      userTier: 'enterprise'
    }
  }
});
```

### Frontend Implementation
```typescript
// Load policy template
const template = await loadRoutingPolicyTemplate('enterprise-high-priority');

// Customize and create
const policy = {
  ...template,
  name: 'My Custom Policy',
  conditions: {
    ...template.conditions,
    geographicRegion: 'us-west'
  }
};
```

## Implementation Notes

### Pre-Development Considerations
1. **Template Validation**: All templates validated against JSON schema
2. **Version Control**: Templates include version numbers for compatibility
3. **Customization**: Templates support partial overrides for flexibility
4. **Testing**: Each template includes test scenarios

### Integration Points
- **Workflow Engine**: Policy evaluation in step execution
- **Frontend**: Policy management UI components
- **Backend**: Policy storage and evaluation APIs
- **Monitoring**: Policy performance metrics collection

### Deployment Strategy
1. Deploy templates to shared location
2. Update frontend to load templates dynamically
3. Implement policy validation and testing
4. Roll out to staging environment first

## Next Steps

These templates provide the foundation for Week 2 implementation:

1. ✅ **Templates Created**: Standardized policy configurations
2. 🔄 **Next**: API endpoint design and documentation
3. 📋 **Week 2 Tasks**:
   - Integrate Unified AI Service into FE workflows
   - Enable Intelligent Router globally
   - Add cost optimization enforcement
   - Create routing policy management UI

## Testing Strategy

### Template Validation
- JSON schema validation
- Required field verification
- Cross-reference validation (provider existence)
- Performance benchmark validation

### Integration Testing
- Policy application in workflow execution
- Fallback provider activation
- Cost optimization calculations
- Caching behavior verification

---

*These templates establish the foundation for intelligent AI service routing and will be integrated into the Week 2 development cycle.*
