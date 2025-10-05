

# Core Data Model & SQL DDL

L

This document defines the core data model for the AI Standardization Registry, focusing on a normalized, interop-first approach

.

#

# Entitie

s

- **`providers`**: The vendor or framework that exposes a function (e.g., OpenAI, Anthropic, LangChain)

.

- **`invocation_paradigms`**: The "how" a function is called (e.g., OpenAI Functions JSON-Schema, Anthropic Tool-Use, MCP Tool, gRPC)

.

- **`functions`**: The logical, provider-agnostic capability (e.g., `web_search`, `generate_embeddings`)

.

- **`function_variants`**: The concrete implementation of a function under a specific provider and paradigm (e.g., OpenAI's `get_weather` vs. MCP's `get_weather`)

.

- **`protocols`**: The communication protocols involved (e.g., MCP, A2A, JSON-RPC, gRPC)

.

- **`models`**: Optional linkage to the AI model(s) that can call or are required by a function

.

- **`relationships`**: The interoperability graph, defining how entities relate to one another (e.g., `depends_on`, `interoperates_with`)

.

- **`benchmarks / limits / compliance`**: Per-variant operational facts that often drive lock-in

.

--

- #

# Minimal SQL DD

L

```sql
- - Providers

CREATE TABLE providers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  org_url TEXT,
  license TEXT,
  regions TEXT[],          -

- ["US","EU",...]

  availability TEXT,       -

- GA | Beta | Preview

  created_at TIMESTAMPTZ DEFAULT now()
);

- - Invocation paradigms (the “how”)

CREATE TABLE invocation_paradigms (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,   -

- e.g., "OpenAI Functions JSON-Schema"

  transport TEXT[],            -

- ["HTTP","WebSocket","MCP","gRPC","JSON-RPC"]

  spec_links TEXT[],           -

- canonical docs

  notes TEXT
);

- - Logical functions (provider-agnostic)

CREATE TABLE functions (
  id UUID PRIMARY KEY,
  canonical_name TEXT NOT NULL,    -

- "web_search"

  description TEXT,
  category TEXT,                    -

- "retrieval","code","eval","file_ops","image","audio","vision","infra"

  tags TEXT[],                      -

- freeform tags

  semantics_hash TEXT,              -

- hash of normalized I/O semantics (for cross-provider matching)

  created_at TIMESTAMPTZ DEFAULT now()
);

- - Concrete implementations (variant = functio

n

 + provide

r

 + paradigm)

CREATE TABLE function_variants (
  id UUID PRIMARY KEY,
  function_id UUID NOT NULL REFERENCES functions(id),
  provider_id UUID NOT NULL REFERENCES providers(id),
  paradigm_id UUID NOT NULL REFERENCES invocation_paradigms(id),
  variant_name TEXT,                -

- provider-specific label

  version TEXT,                     -

- semver or doc rev

  args_schema JSONB,                -

- JSON Schema (normalized)

  result_schema JSONB,              -

- JSON Schema (normalized)

  args_schema_hash TEXT,
  result_schema_hash TEXT,
  transport TEXT[],                 -

- e.g., ["HTTP","MCP"]

  auth TEXT[],                      -

- ["API_KEY","OAuth2","ServiceAccount","Unsigned"]

  rate_limits JSONB,                -

- { rps, rpm, tpm, concurrency }

  quotas JSONB,                     -

- { daily_tokens, monthly_credits, ... }

  limits JSONB,                     -

- { max_payload_mb, file_types, timeout_s }

  streaming BOOLEAN,
  idempotency TEXT,                 -

- strategy/key or "N/A"

  side_effects TEXT,                -

- description

  error_taxonomy JSONB,             -

- standardized error codes

  compliance_tags TEXT[],           -

- ["SOC2","ISO27001","GDPR","HIPAA","EU_AI_ACT_RISK:low"]

  regions TEXT[],
  source_links TEXT[],              -

- evidence URLs

  confidence NUMERIC,               -

- 0..

1

  last_verified TIMESTAMPTZ,
  UNIQUE (function_id, provider_id, paradigm_id, version, variant_name)
);

- - Protocols & linkages

CREATE TABLE protocols (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  role_model TEXT,                  -

- client/server, agent/tool, peer/peer

  message_schema TEXT,              -

- reference or excerpt

  transport TEXT[],
  spec_links TEXT[]
);

CREATE TABLE function_variant_protocols (
  function_variant_id UUID REFERENCES function_variants(id) ON DELETE CASCADE,
  protocol_id UUID REFERENCES protocols(id) ON DELETE CASCADE,
  PRIMARY KEY (function_variant_id, protocol_id)
);

- - Optional: model link (when specific models/tool-use enablement matters)

CREATE TABLE models (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  name TEXT,
  version TEXT,
  modalities TEXT[],
  notes TEXT
);

CREATE TABLE function_variant_models (
  function_variant_id UUID REFERENCES function_variants(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  required BOOLEAN DEFAULT FALSE,   -

- true if variant only works with these models

  PRIMARY KEY (function_variant_id, model_id)
);

- - Cross-entity relationships (for interop graph)

CREATE TABLE relationships (
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,        -

- "function" | "function_variant" | "provider" | "protocol" | ...

  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  relation_type TEXT NOT NULL,      -

- depends_on | interoperates_with | superseded_by | conflicts_with | equivalent_to

  notes TEXT,
  PRIMARY KEY (source_id, source_type, target_id, target_type, relation_type)
);

- - Helpful indexes

CREATE INDEX idx_fn_name ON functions(canonical_name);
CREATE INDEX idx_fn_semantics ON functions(semantics_hash);
CREATE INDEX idx_variant_provider ON function_variants(provider_id);
CREATE INDEX idx_variant_paradigm ON function_variants(paradigm_id);
CREATE INDEX idx_variant_args_hash ON function_variants(args_schema_hash);
CREATE INDEX idx_variant_result_hash ON function_variants(result_schema_hash);

```
