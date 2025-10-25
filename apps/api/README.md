

# Workflow AP

I

PR-ready Express REST scaffold that integrates with `@auterity/workflow-contracts` package, validates with Ajv, serves OpenAPI at `/docs`, supports ETa

g

 + JSON Patch, and is safe for local dev

.

#

# Feature

s

- ✅ **Contract-driven**: Uses `@auterity/workflow-contracts` for Zod types and JSON Schema validatio

n

- ✅ **REST endpoints**: Export, import, get, patch workflows with proper HTTP semantic

s

- ✅ **ETa

g

 + JSON Patch**: Optimistic concurrency control for safe update

s

- ✅ **OpenAPI docs**: Interactive API documentation at `/docs

`

- ✅ **Ajv validation**: Runtime validation against JSON Schema derived from Zo

d

- ✅ **Security**: API key auth, CORS, helmet, compressio

n

- ✅ **In-memory store**: Safe for development, easily replaceable with databas

e

- ✅ **TypeScript**: Fully typed with proper ESM suppor

t

#

# Quick Star

t

```bash

# Install dependencies

cd apps/api
npm install

# Install contracts package (from monorepo root)

cd ../../packages/workflow-contracts

npm install
npm run build

# Start the API server

cd ../../apps/api
npm run dev

```

The API will be available at `http://localhost:5055` with docs at `http://localhost:5055/docs`.

#

# API Endpoint

s

#

## Authentication

All endpoints except `/health` require `x-api-key` header

:

```

bash
curl -H "x-api-key: dev-api-key-123" ..

.

```

#

## Core Endpoint

s

| Method | Path | Description |
|--------|------|-------------|

| `GET` | `/health` | Health check (no auth) |
| `GET` | `/docs` | OpenAPI documentation |
| `POST` | `/v1/workflows/export` | Convert ReactFlow → Canonical |
| `POST` | `/v1/workflows/import` | Store Canonical → Studio format |
| `GET` | `/v1/workflows/:id` | Retrieve canonical workflow (with ETag) |
| `PATCH` | `/v1/workflows/:id` | Update with JSON Patch (requires If-Match) |

| `GET` | `/v1/workflows` | List all workflows |

#

## Example Usag

e

**Export ReactFlow to Canonical:

* *

```

bash
curl -X POST http://localhost:5055/v1/workflows/export

\
  -H "Content-Type: application/json"

\
  -H "x-api-key: dev-api-key-123"

\
  -d '{

    "id": "my-workflow",

    "nodes": [...],
    "edges": [...],
    "viewport": {"x": 0, "y": 0, "zoom": 1}
  }'

```

**Get workflow with ETag:

* *

```

bash
curl http://localhost:5055/v1/workflows/{id} \
  -H "x-api-key: dev-api-key-123

"

```

**Update with JSON Patch:

* *

```

bash
curl -X PATCH http://localhost:5055/v1/workflows/{id}

\
  -H "Content-Type: application/json"

\
  -H "x-api-key: dev-api-key-123"

\
  -H "If-Match: {etag}"

\
  -d '[{"op": "replace", "path": "/nodes/0/position/x", "value": 200}]

'

```

#

# Configuratio

n

Environment variables (`.env`):

```

env
PORT=5055
NODE_ENV=development
API_KEY=dev-api-key-123

CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000

```

#

# Testin

g

```

bash

# Run unit tests

npm test

# Run smoke tests (requires server running)

chmod +x smoke-test.sh

./smoke-test.s

h

```

#

# JSON Patch Example

s

**Move a node:

* *

```

json
[{"op": "replace", "path": "/nodes/0/position", "value": {"x": 300, "y": 400}}]

```

**Change node label:

* *

```

json
[{"op": "replace", "path": "/nodes/0/label", "value": "New Label"}]

```

**Add metadata:

* *

```

json
[{"op": "add", "path": "/metadata/author", "value": "John Doe"}]

```

#

# Architectur

e

```

apps/api/
├── src/
│   ├── config.ts

# Environment configuration

│   ├── server.ts

# Express app with OpenAPI docs

│   ├── middleware/
│   │   └── auth.ts

# API key auth

 + error handlin

g

│   ├── services/
│   │   ├── validation.ts

# Ajv

 + Zod validatio

n

│   │   └── store.ts

# In-memory workflow store with ETa

g

│   ├── routes/
│   │   └── workflows.ts

# REST endpoints

│   └── __tests__/
│       ├── fixtures.ts

# Test data

│       └── api.test.ts

# Integration tests

├── package.json
├── tsconfig.json
├── .env
└── smoke-test.s

h

```

#

# Next Step

s

1. **UI Integration**: Wire Error-IQ export and Workflow-Studio import butto

n

s

2. **Database**: Replace in-memory store with PostgreSQL/Mongo

D

B

3. **WebSocket**: Add real-time collaboration via `/v1/ws/workflow

s

`

4. **Auth**: Upgrade to OAuth2 client credentials for producti

o

n

5. **CI/CD**: Add GitHub Actions for contract tests and deployme

n

t

#

# Contract Test

s

The API validates all requests/responses against the canonical schema. To add contract tests to CI:

```

yaml

# .github/workflows/api.yml

- name: Contract Tests

  run: |
    cd apps/api
    npm run test
    npm run start &
    sleep 2
    ./smoke-test.s

h

```
