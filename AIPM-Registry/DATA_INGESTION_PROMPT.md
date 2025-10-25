

# Final Parallel AI Prompt (copy-paste

e

)

Use blocks below inside Parallel. Run Find All first, then Deep Research per entity, then Enrichment to fill fields, and Search to fetch supporting references. Save outputs as CSV/JSON per block. Re-run until self-checks pass

.

--

- #

# 1) Find All — Entity Discovery (datasets

)

**Goal**: Enumerate entities across the AI landscape for the AI Standardization Registry

.

**Entity types to discover**

:

- **Protocols & Standards**: MCP, A2A, JSON-RPC, gRPC, OpenAPI, GraphQ

L

- **APIs & SDKs**: OpenAI, Anthropic, Google, Meta, xAI, Bedrock, Azure, Vertex; cross-providers/routers (LiteLLM, OpenRouter, RelayCore), inference platforms (Together, Fireworks, Anyscale, HF Inference, vLLM, Cerebras

)

- **Agent frameworks**: LangChain, LangGraph, CrewAI, TaskWeaver, Cursor/Kiro agent

s

- **Tools/Functions**: retrieval, web_browse, code_run, eval, file_ops, embeddings, image, audio, vision, sandbox; MCP tool registrie

s

- **Models**: code, reasoning, multimodal, embeddings, speech, imag

e

- **Observability**: Langfuse, OTel exporter

s

- **Compliance**: SOC2, ISO 27001, GDPR, EU AI Act resource

s

- **Cookbooks/Playbooks**: routing, guardrails, failure, securit

y

- **Deployment**: docker/helm images, SaaS, on-pre

m

- **Evaluations**: MMLU, HELM, HumanEval, SWE-bench, LongBenc

h

- **Community/Adoption**: GitHub orgs/projects with high relevanc

e

For each entity, return minimally: `Resource_Name`, `Category/Subcategory`, `Source_Link(s)`, `Maintainer`, `Short_Description`.

**Output**: dataset "entity_catalog" with unique IDs

.

--

- #

# 2) Deep Research — Structured Extraction (per entity

)

**Goal**: Extract full AIPM schema fields for each entity in "entity_catalog"

.

For each entity:
1) Visit docs/repos/APIs and capture every field in the Data Dictionary:

   - Registry & Provenance (`Path`, `Record_Type`, `Resource_Name`, `Category/Subcategory`, `Maintainer`, `Version`, `License`, `Source_Links`, `Discovery_Date`, `Last_Updated_Upstream`, `Lineage`, `Confidence`, `Notes`

)

   - Identity & Intero

p

   - Model & Runtim

e

   - Pricing & Limit

s

   - Inference Providers & Router

s

   - Function & Tool Invocation (`Invocation_Paradigm`, `Function_Name`, `Arguments_Schema`, `Result_Schema`, `Transport`, `Auth`, `Idempotency`, `Side_Effects`, `Error_Taxonomy`, `Tool_Limits`, `Streaming_Support`, `Security_Considerations`, `Compatibility_Tags`

)

   - Protocols & Standard

s

   - Orchestration & Workflo

w

   - Observability & Reliabilit

y

   - Compliance & Governanc

e

   - Evaluations & Benchmark

s

   - Community & Adoptio

n

   - Deployment & Packagin

g

   - Relationships (`Depends_On`, `Interoperates_With`, `Superseded_By`

)

2) Normalize units and formats (ISO-8601 dates, SPDX licenses, numeric prices)

.

3) Attach at least 3 corroborating `Source_Links` for critical fields (pricing, limits, safety/compliance).

**Output**: dataset "registry_records" where each row = one entity version with all fields

.

--

- #

# 3) Enrichment — Cross-mapping & Normalizati

o

n

**Goal**: Fill gaps, dedupe, and cross-link records

.

**Tasks**

:

- Deduplicate using key: `Path

`

 + `Resource_Name

`

 + `Version`; preserve lineage in "Lineage"

.

- Add `Relationships` edges: `Depends_On`, `Interoperates_With`, `Conflicts_With`, `Superseded_By`

.

- Generate `Compatibility_Tags` from text (LangChain, CrewAI, TaskWeaver, MCP, GraphQL, JSON-RPC, gRPC)

.

- Create `Supported_Models_Map` for routers (`router_model_id` → `upstream_id`)

.

- Normalize `Compliance_Tags` (SOC2, ISO 27001, HIPAA, GDPR, EU AI Act risk)

.

- Compute docs freshness: days since `Last_Updated_Upstream`

.

- Compute maturity score from Community & Adoption

.

**Outputs**

:

- "registry_records_enriched" (full records

)

- Category tables

:

  - `providers.csv

`

  - `models.csv

`

  - `functions.csv

`

  - `mcp_resources.csv

`

  - `a2a_protocols.csv

`

  - `function_benchmarks.csv

`

  - `integration_complexity.csv

`

  - `community_metrics.csv

`

--

- #

# 4) Search — Targeted Evidence & Gap-Filli

n

g

**Goal**: Patch missing fields with focused queries and attach references

.

**Run targeted searches for**

:

- "rate limits site:[provider domain]" "pricing tokens

"

- "function" OR "tool use" OR "function declarations" OR "parameters schema

"

- "OpenTelemetry" OR "Langfuse" OR "trace" OR "metrics

"

- "SOC 2" OR "ISO 27001" OR "GDPR" OR "EU AI Act

"

- "fine-tuning" OR "LoRA" OR "QLoRA" OR "adapters

"

- "quantization" OR "gguf" OR "awq

"

- "routing" OR "fallback" OR "canary" OR "AB test

"

- "SWE-bench" OR "HumanEval" OR "MMLU" OR "LongBench

"

- "docker" OR "helm" OR "compose" OR "self-host

"

Attach matched URLs to `Source_Links` and update fields.

--

- #

# 5) Self-Check — Automated Validation (must pass before final expor

t

)

Run completeness & quality gates:

**Completeness**

:

- ≥95% records have `Path`, `Record_Type`, `Resource_Name`, `Source_Links`, `Maintainer`, `Version

`

- ≥90% of function entries have `Arguments_Schema` or explicit N/A with reaso

n

- ≥85% of models have `Pricing_In/Out`, `Context_Window`, `Modalities`, `Tool_Use/JSON_Mode

`

**Cross-link**

:

- All routers have ≥1 `Supported_Models_Map` ro

w

- All protocols list ≥1 SDK and ≥1 Example snippe

t

- All functions map to ≥1 `Invocation_Paradigm

`

**Quality**

:

- Timestamps ISO-8601; numeric fields parsed; licenses SPDX; URLs HTTP 200 or archive

d

- Confidence <0.7 ⇒ add "needs-review" t

a

g

If any check fails, automatically invoke Search

 + Deep Research again for the failing rows until thresholds met or mark "needs-review"

.

--

- #

# 6) Final Expor

t

**Export**

:

- `registry_records_enriched.jsonl

`

- `providers.csv`, `models.csv`, `functions.csv`, `mcp_resources.csv`, `a2a_protocols.csv`, `function_benchmarks.csv`, `integration_complexity.csv`, `community_metrics.csv

`

Also export a relationship edge list:

- `relationships.csv` => `source_id`, `target_id`, `relation_type` (depends_on|interoperates_with|superseded

)
