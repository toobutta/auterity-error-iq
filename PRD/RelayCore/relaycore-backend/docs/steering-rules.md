# Steering Rules Engine

The RelayCore Steering Rules Engine provides a powerful, declarative way to control how requests are routed to different AI providers based on configurable conditions. This allows for intelligent routing, cost optimization, and customized handling of requests without changing your application code.

## Table of Contents

- [Overview](#overview)
- [Rule Structure](#rule-structure)
- [Conditions](#conditions)
- [Actions](#actions)
- [Example Rules](#example-rules)
- [API Reference](#api-reference)
- [UI Management](#ui-management)
- [Best Practices](#best-practices)

## Overview

The Steering Rules Engine allows you to define YAML-based rules that determine how requests are routed and processed. Each rule consists of conditions that are evaluated against the request and actions that are taken when the conditions match.

Key features:

- **Declarative Rules**: Define routing logic in YAML without changing code
- **Conditional Routing**: Route requests based on content, user attributes, or other factors
- **Request Transformation**: Modify requests before they reach AI providers
- **Context Injection**: Add system prompts or other context to requests
- **Rejection Handling**: Block requests that violate policies
- **Prioritization**: Control the order in which rules are evaluated

## Rule Structure

A steering rule has the following structure:

```yaml
id: unique-rule-id
name: Human-readable name
description: Optional description of what the rule does
priority: 10  # Lower numbers have higher priority
enabled: true  # Whether the rule is active
conditions:
  - field: request.body.prompt
    operator: contains
    value: code
operator: and  # How to combine conditions (and/or)
actions:
  - type: route
    params:
      provider: openai
      model: gpt-4
continue: true  # Whether to continue evaluating other rules
tags:  # Optional tags for organization
  - code
  - routing
```

## Conditions

Conditions determine when a rule should be applied. Each condition evaluates a field against a value using an operator.

### Available Fields

You can reference various parts of the request and context:

- `request.body.*`: The request body (e.g., `request.body.prompt`)
- `request.headers.*`: Request headers
- `request.path`: The request path
- `request.method`: The HTTP method
- `request.ip`: The client IP address
- `user.*`: User properties (e.g., `user.tier`, `user.id`)
- `organization.*`: Organization properties
- `context.*`: Additional context (e.g., `context.tokenCount`)

### Operators

The following operators are available:

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `field: user.tier, operator: equals, value: premium` |
| `not_equals` | Not an exact match | `field: request.method, operator: not_equals, value: GET` |
| `contains` | String contains substring | `field: request.body.prompt, operator: contains, value: code` |
| `not_contains` | String doesn't contain substring | `field: request.body.prompt, operator: not_contains, value: harmful` |
| `regex` | Matches regular expression | `field: request.body.prompt, operator: regex, value: "\\bcode\\b"` |
| `gt` | Greater than (numeric) | `field: context.tokenCount, operator: gt, value: 1000` |
| `lt` | Less than (numeric) | `field: context.tokenCount, operator: lt, value: 5000` |
| `gte` | Greater than or equal (numeric) | `field: context.tokenCount, operator: gte, value: 1000` |
| `lte` | Less than or equal (numeric) | `field: context.tokenCount, operator: lte, value: 5000` |
| `in` | Value is in list | `field: user.tier, operator: in, value: [premium, enterprise]` |
| `not_in` | Value is not in list | `field: user.tier, operator: not_in, value: [free, basic]` |
| `exists` | Field exists | `field: request.body.system_prompt, operator: exists` |
| `not_exists` | Field doesn't exist | `field: request.body.system_prompt, operator: not_exists` |

### Combining Conditions

Multiple conditions can be combined using the `operator` field:

- `and`: All conditions must match
- `or`: At least one condition must match

## Actions

Actions define what happens when a rule matches. Multiple actions can be specified for a single rule.

### Route Action

Routes the request to a specific provider and model:

```yaml
type: route
params:
  provider: openai
  model: gpt-4
```

### Transform Action

Modifies a field in the request:

```yaml
type: transform
params:
  transformation:
    field: request.body.prompt
    operation: append
    value: " Please provide code examples."
```

Available operations:
- `replace`: Replace the field with a new value
- `append`: Add to the end of the field
- `prepend`: Add to the beginning of the field
- `delete`: Remove the field

### Inject Action

Adds a new field to the request:

```yaml
type: inject
params:
  context:
    field: request.body.system_prompt
    value: "You are a helpful coding assistant."
```

### Reject Action

Rejects the request with an error message:

```yaml
type: reject
params:
  message: "This request contains prohibited content."
  status: 403
```

### Log Action

Logs a message:

```yaml
type: log
params:
  level: info
  message: "Processing code-related request"
```

Available log levels: `debug`, `info`, `warn`, `error`

## Example Rules

### Route Code Requests to GPT-4

```yaml
id: code-to-gpt4
name: Code Prompts to GPT-4
description: Route code-related prompts to OpenAI GPT-4
priority: 10
enabled: true
conditions:
  - field: request.body.prompt
    operator: regex
    value: "(```|function|class|def |import |const |let |var |public class)"
operator: and
actions:
  - type: route
    params:
      provider: openai
      model: gpt-4
continue: true
tags:
  - code
  - routing
```

### Route Long Prompts to Claude

```yaml
id: long-to-claude
name: Long Prompts to Claude
description: Route long prompts to Anthropic Claude
priority: 20
enabled: true
conditions:
  - field: context.tokenCount
    operator: gt
    value: 4000
operator: and
actions:
  - type: route
    params:
      provider: anthropic
      model: claude-3-opus
continue: true
tags:
  - long-context
  - routing
```

### Add System Prompt for Customer Service

```yaml
id: customer-service-prompt
name: Customer Service System Prompt
description: Add customer service system prompt for support requests
priority: 30
enabled: true
conditions:
  - field: request.body.prompt
    operator: regex
    value: "(support|help|issue|problem|not working|broken|error|bug)"
  - field: request.path
    operator: contains
    value: "/support"
operator: and
actions:
  - type: inject
    params:
      context:
        field: request.body.system_prompt
        value: "You are a helpful customer support agent for RelayCore. Be empathetic, clear, and solution-oriented. Provide step-by-step troubleshooting when appropriate."
continue: true
tags:
  - customer-service
  - system-prompt
```

### Reject Harmful Content

```yaml
id: reject-harmful
name: Reject Harmful Content
description: Reject requests containing harmful or prohibited content
priority: 5
enabled: true
conditions:
  - field: request.body.prompt
    operator: regex
    value: "(hack|exploit|illegal|bomb|terrorist|child abuse)"
operator: and
actions:
  - type: reject
    params:
      message: "Your request contains prohibited content and cannot be processed."
      status: 403
  - type: log
    params:
      level: warn
      message: "Rejected harmful content"
continue: false
tags:
  - safety
  - moderation
```

## API Reference

### REST API Endpoints

The Steering Rules Engine provides the following REST API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/steering` | GET | Get all rules |
| `/admin/steering` | POST | Create a new rule |
| `/admin/steering/:id` | GET | Get a specific rule |
| `/admin/steering/:id` | PUT | Update a rule |
| `/admin/steering/:id` | DELETE | Delete a rule |
| `/admin/steering/priorities` | POST | Update rule priorities |
| `/admin/steering/default-actions` | POST | Update default actions |
| `/admin/steering/test` | POST | Test a rule against a sample request |
| `/admin/steering/reload` | POST | Reload rules from file |

### Node.js API

You can also use the Steering Rules Engine programmatically:

```typescript
import { SteeringService, createSteeringMiddleware } from 'relaycore';

// Create a steering service
const steeringService = new SteeringService('/path/to/rules.yaml');

// Create middleware
const steeringMiddleware = createSteeringMiddleware(steeringService, {
  applyRouting: true,
  applyRejection: true,
  getUserFromRequest: (req) => req.user,
  additionalContext: (req) => ({
    tokenCount: req.body?.prompt?.length ? Math.ceil(req.body.prompt.length / 4) : 0
  })
});

// Apply middleware to your Express app
app.use('/v1/ai', steeringMiddleware);
```

## UI Management

The RelayCore Dashboard provides a user-friendly interface for managing steering rules:

1. **Rule List**: View, enable/disable, and reorder rules
2. **Rule Editor**: Create and edit rules with a visual editor
3. **Rule Testing**: Test rules against sample requests
4. **Default Actions**: Configure actions for when no rules match

To access the Steering Rules UI, navigate to the `/steering` page in the RelayCore Dashboard.

## Best Practices

### Rule Organization

- Use clear, descriptive names and descriptions for rules
- Use tags to categorize rules
- Keep rule priorities organized (e.g., use increments of 10 to leave room for new rules)
- Put safety and security rules at higher priorities (lower numbers)

### Performance Considerations

- Keep the number of rules manageable (ideally under 100)
- Put frequently matching rules at higher priorities
- Use specific conditions to avoid unnecessary rule evaluations
- Use `continue: false` for rules that should be terminal (e.g., rejection rules)

### Testing and Validation

- Test rules thoroughly before deploying to production
- Use the rule testing feature to verify behavior
- Monitor rule performance and adjust as needed
- Consider A/B testing for significant routing changes

### Security

- Limit access to rule management to administrators
- Audit rule changes regularly
- Be careful with rules that modify request content
- Use rejection rules to enforce security policies