

# AI SDK Integration Guid

e

#

# Overvie

w

This guide provides comprehensive instructions for using the AI SDK across both Auterity projects (auterity-workflow-studio and auterity-error-iq) to ensure consistent implementation and maximum functionality

.

#

# Feature

s

The AI SDK integration provides:

- **Multi-Provider Support**: OpenAI, Anthropic, Azure, Google, and Coher

e

- **Structured Outputs**: Zod schema validation for consistent response

s

- **Streaming Responses**: Real-time text generatio

n

- **Cost Tracking**: Automatic cost monitoring and reportin

g

- **Tool Calling**: Integration with workflow operation

s

#

# Project Structur

e

#

## auterity-workflow-studi

o

- **Service**: `src/services/aiSDKService.ts

`

- **Test**: `test-ai-sdk.js

`

- **Environment**: `.env

`

#

## auterity-error-i

q

- **Service**: `src/services/aiSDKService.ts

`

- **Frontend Service**: `frontend/src/services/aiSDKService.ts` (if needed

)

- **Test**: `test-ai-sdk.js

`

- **Environment**: `.env

`

- **Frontend Environment**: `frontend/.env

`

#

# Setup Instruction

s

#

##

 1. Environment Variabl

e

s

Add the following API keys to your `.env` files:

```bash

# OpenAI

OPENAI_API_KEY=your-openai-api-key-her

e

# Anthropic

ANTHROPIC_API_KEY=your-anthropic-api-key-her

e

# Azure OpenAI

AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here

AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint-her

e

# Google Generative AI

GOOGLE_GENERATIVE_AI_API_KEY=your-google-generative-ai-api-key-her

e

# Cohere

COHERE_API_KEY=your-cohere-api-key-her

e

```

#

##

 2. Dependenci

e

s

Ensure the following packages are installed:

```

json
{
  "ai": "^5.0.28",

  "@ai-sdk/openai": "^2.0.23"

,

  "@ai-sdk/anthropic": "^2.0.9"

,

  "@ai-sdk/azure": "^2.0.23"

,

  "@ai-sdk/google": "^2.0.11"

,

  "@ai-sdk/cohere": "^2.0.7"

,

  "@ai-sdk/react": "^2.0.28"

,

  "zod": "^4.1.5"

}

```

#

##

 3. TypeScript Configurati

o

n

For auterity-error-iq, ensure your `tsconfig.json` includes

:

```

json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./src/types"]
  }
}

```

#

# Usage Example

s

#

## Basic Text Generatio

n

```

typescript
import { aiSDKService } from './services/aiSDKService.js';

// Simple text response
const response = await aiSDKService.generateTextResponse(
  'Create a workflow for processing customer orders',
  { workflowId: 'order-processing-001' }

);

```

#

## Provider Switchin

g

```

typescript
// Switch to different AI providers
aiSDKService.setProvider('anthropic'); // Use Claude
aiSDKService.setProvider('openai');    // Use GPT
aiSDKService.setProvider('google');    // Use Gemini

// Get available providers
const providers = aiSDKService.getProviders();

```

#

## Structured Output

s

```

typescript
// Generate workflow with structured output
const workflow = await aiSDKService.generateWorkflow(
  'Create a workflow for email marketing campaigns'
);

// Optimize existing workflow
const optimization = await aiSDKService.optimizeWorkflow({
  workflowId: 'campaign-workflow-001',

  nodes: [...],
  edges: [...]
});

```

#

## Streaming Response

s

```

typescript
// Stream real-time responses

for await (const chunk of aiSDKService.generateChatResponse(messages, context)) {
  console.log(chunk); // Process each chunk as it arrives
}

```

#

## Cost Trackin

g

```

typescript
// Get cost summary
const costs = aiSDKService.getCostSummary();
console.log('Total cost:', costs.total);
console.log('By operation:', costs.byOperation);

// Reset tracking
aiSDKService.resetCostTracking();

```

#

# Testin

g

Run the integration tests:

```

bash

# auterity-workflow-studi

o

node test-ai-sdk.j

s

# auterity-error-i

q

node test-ai-sdk.j

s

```

#

# Best Practice

s

#

##

 1. Error Handli

n

g

```

typescript
try {
  const response = await aiSDKService.generateTextResponse(prompt);
  // Process response
} catch (error) {
  console.error('AI SDK Error:', error);
  // Fallback logic
}

```

#

##

 2. Provider Selecti

o

n

```

typescript
// Choose provider based on use case
const provider = process.env.PREFERRED_AI_PROVIDER || 'openai';
aiSDKService.setProvider(provider);

```

#

##

 3. Cost Monitori

n

g

```

typescript
// Log costs for monitoring
const costs = aiSDKService.getCostSummary();
if (costs.total > COST_THRESHOLD) {
  // Send alert or switch to cheaper provider
  aiSDKService.setProvider('anthropic'); // Generally cheaper
}

```

#

##

 4. Context Manageme

n

t

```

typescript
// Provide rich context for better responses
const context = {
  workflowId: 'wf-123',

  userRole: 'admin',
  currentStep: 'optimization',
  metadata: { priority: 'high' }
};

const response = await aiSDKService.generateTextResponse(prompt, context);

```

#

# Advanced Feature

s

#

## Custom Schema

s

```

typescript
import { z } from 'zod';

const CustomSchema = z.object({
  title: z.string(),
  steps: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high'])
});

// Use in generateObject calls

```

#

## Tool Integratio

n

```

typescript
// Define custom tools
const customTools = {
  createWorkflow: 'Create a new workflow',
  updateWorkflow: 'Update existing workflow',
  deleteWorkflow: 'Delete workflow'
};

```

#

# Troubleshootin

g

#

## Common Issue

s

1. **Module not found error

s

* *

   - Ensure all AI SDK packages are installe

d

   - Check TypeScript configuratio

n

2. **API Key error

s

* *

   - Verify environment variables are se

t

   - Check API key validit

y

3. **Provider switching issue

s

* *

   - Ensure provider is supporte

d

   - Check provider-specific configuratio

n

#

## Debug Mod

e

```

typescript
// Enable detailed logging
process.env.DEBUG = 'ai-sdk:*'

;

// Check current configuration
console.log('Current provider:', aiSDKService.getProviders());
console.log('Cost summary:', aiSDKService.getCostSummary());

```

#

# Performance Optimizatio

n

#

##

 1. Cachi

n

g

```

typescript
// Implement response caching for frequently used prompts
const cache = new Map();

async function getCachedResponse(prompt: string) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const response = await aiSDKService.generateTextResponse(prompt);
  cache.set(prompt, response);
  return response;
}

```

#

##

 2. Batch Processi

n

g

```

typescript
// Process multiple requests efficiently
const responses = await Promise.all(
  prompts.map(prompt => aiSDKService.generateTextResponse(prompt))
);

```

#

# Security Consideration

s

1. **API Key Managemen

t

* *

   - Never commit API keys to version contro

l

   - Use environment variable

s

   - Rotate keys regularl

y

2. **Input Validatio

n

* *

   - Validate all inputs before sending to A

I

   - Sanitize user-provided conten

t

3. **Rate Limitin

g

* *

   - Implement rate limiting to prevent abus

e

   - Monitor API usag

e

#

# Contributin

g

When adding new AI features:

1. Update both projects consistentl

y

2. Add comprehensive test

s

3. Update this documentatio

n

4. Follow the established pattern

s

5. Test across all supported provider

s

#

# Suppor

t

For issues or questions:

- Check the test files for example

s

- Review the AI SDK documentatio

n

- Consult the project maintainer

s
