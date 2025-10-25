

# Workflow Integration Setu

p

#

# Quick Start (from monorepo root

)

```powershell

#

 1. Install all workspace dependencie

s

npm install

#

 2. Build contracts packag

e

npm run contracts:build

#

 3. Start the API serve

r

npm run api:dev

```

The API will be available at http://localhost:5055 with docs at http://localhost:5055/docs.

#

# Test Everythin

g

```

powershell

# Run all workflow tests

npm run workflow:test-al

l

# Run API smoke tests (requires server running)

npm run api:smoke

```

#

# Manual Testin

g

1. **Start API**: `npm run api:de

v

`

2. **Open docs**: http://localhost:5055/do

c

s

3. **Test with PowerShell**: `cd apps/api && pwsh ./smoke-test.ps

1

`

#

# Next: UI Integratio

n

Ready for the next step

 - wiring up the Error-IQ export and Workflow-Studio import buttons

!

#

## Error-IQ Export Integrati

o

n

Add to your ReactFlow component:

```

typescript
import { reactflowToCanonical } from '@auterity/workflow-contracts'

;

async function exportCanonical() {
  const canonical = reactflowToCanonical(currentWorkflow);

  const response = await fetch('http://localhost:5055/v1/workflows/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',

      'x-api-key': 'dev-api-key-123'

    },
    body: JSON.stringify(canonical)
  });

  const result = await response.json();
  console.log('Exported workflow:', result.id);
}

```

#

## Workflow-Studio Import Integrati

o

n

Add to your canvas component:

```

typescript
import { canonicalToReactflow } from '@auterity/workflow-contracts'

;

async function importCanonical(workflowId: string) {
  const response = await fetch(`http://localhost:5055/v1/workflows/${workflowId}`, {
    headers: { 'x-api-key': 'dev-api-key-123' }

  });

  const canonical = await response.json();
  const studioFormat = canonicalToReactflow(canonical);

  // Render in your canvas
  setWorkflow(studioFormat);
}

```

#

# Architecture Summar

y

```

auterity-error-iq/

├── packages/workflow-contracts/



# Shared contract (Zod

 + JSON Schema

)

│   ├── src/index.ts

# Zod types

│   ├── src/adapters/

# RF ↔ Canonical converters

│   └── src/__tests__/

# Round-trip test

s

├── apps/api/

# Express REST API

│   ├── src/server.ts

# OpenAPI

 + validatio

n

│   ├── src/routes/workflows.ts

# CRUD

 + ETa

g

 + JSON Patc

h

│   └── src/services/

# Store

 + validatio

n

└── package.json

# Workspace config

```

**Status: ✅ Contract

s

 + API Complete

* *
**Next: 🔄 UI Integration (Error-I

Q

 + Workflow-Studio)

* *
