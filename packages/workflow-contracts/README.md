

# @auterity/workflow-contrac

t

s

Canonical workflow contracts for Auterity.

This package provides Zod schemas (source of truth) and a generated JSON Schema for the canonical workflow model used across Error-IQ and Workflow Studio

.

Install (local / manual)

```powershell

# from monorepo root (fast local link)

cd packages/workflow-contracts

npm install
npm run build
npm pack

# copy the generated .tgz and install in another repo with

:

# npm i ../path/to/@auterity-workflow-contracts-1.0.0.t

g

z

```

Install (GitHub Packages

 - recommended for multi-developer teams

)

1. Configure `.npmrc` for the consuming repo (replace `<OWNER>`)

:

```

text
@auterity:registry=https://npm.pkg.github.com/<OWNER>
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

```

2. Install

:

```

bash
npm i @auterity/workflow-contracts@1.0

.

0

```

Usage

```

ts
import { WorkflowSchema, reactflowToCanonical } from '@auterity/workflow-contracts'

;

// validate
const parsed = WorkflowSchema.safeParse(obj);

// adapters
const canonical = reactflowToCanonical(reactFlowObj);

```

Building & Publishing

- `npm run build` compiles TypeScript and generates `dist/workflow.schema.json` from Zod

.

- CI workflow (in this repo) will publish on tag `v*` to GitHub Packages. See `.github/workflows/publish-workflow-contracts.yml`

.

Contributing

- Update Zod types in `src/index.ts`

.

- Run `npm run build` and add any sample fixtures under `src/__tests__` if needed

.

