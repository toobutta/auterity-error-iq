

# 🏗️ **AI Standardization Registry: Master Taxonomy & Data Dictionar

y

* *

#

# Overvie

w

This document contains the comprehensive Master Taxonomy & Data Dictionary for the AI Standardization Registry, designed to unify all AI-related threads (MCPs, agents, SDKs/APIs, providers, protocols, orchestration, observability, compliance, cookbooks) into one capture schema

.

#

# 📊 **Core Framewor

k

* *

#

## **Registry & Provenance

* * (Applies to Every Recor

d

)

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Path

* * | String | Registry path | `/protocol/mcp`, `/api/litellm/router` |

| **Record_Type

* * | Enum | Entity type | `protocol`, `api`, `sdk`, `model`, `router` |

| **Resource_Name

* * | String | Primary identifier | `LiteLLM Router`, `Claude-3-Opus` |

| **Short_Description

* * | String | Brief description | `Multi-provider LLM routing with cost optimization` |

| **Category/Subcategory

* * | String | Hierarchical classification | `APIs/SDKs > Cross-providers/Routers` |

| **Source_Links

* * | Array | Documentation and reference links | `["https://docs.litellm.ai/"]` |

| **Maintainer

* * | String | Organization/team responsible | `BerriAI`, `Anthropic` |

| **Version

* * | String | Semantic version or doc revision | `1.2.3`, `2024-01-15`

|

| **License

* * | String | SPDX license identifier | `MIT`, `Apache-2.0`

|

| **Discovery_Date

* * | Date | When first discovered | `2024-01-01T00:00:00Z` |

| **Last_Updated_Upstream

* * | Date | Last upstream update | `2024-01-15T00:00:00Z` |

| **Curated_By

* * | String | Agent name that captured | `AI-Registry-Agent-v1` |

| **Capture_Timestamp

* * | DateTime | When captured in registry | `2024-01-15T10:30:00Z` |

| **Lineage

* * | Array | Parent record IDs for deduplication | `["parent-uuid-123"]` |

| **Confidence

* * | Float (0-1) | Data quality confidence | `0.95`

|

| **Notes

* * | String | Additional context | `Enterprise tier required for some features`

|

--

- #

# 🎯 **Category-Specific Field

s

* *

#

## **

1. Identity & Intero

p

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Provider_Name

* * | String | Company/organization | `OpenAI`, `Anthropic`, `Google` |

| **Product_Family

* * | String | Product line grouping | `Claude`, `GPT`, `Gemini`, `Llama` |

| **SKU_or_Plan

* * | String | Pricing tier or plan | `Free`, `Pro`, `Enterprise`, `per-model` |

| **Regions_Available

* * | Array | Geographic availability | `["US", "EU", "APAC"]` |

| **Commercial_Availability

* * | Enum | Release status | `GA`, `Beta`, `Preview`, `Research-only`

|

#

## **

2. Model & Runtim

e

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Model_Name

* * | String | Exact model identifier | `claude-3-opus-20240229` |

| **Model_Alias

* * | Array | Provider alias/route IDs | `["claude-3-opus", "claude-opus"]` |

| **Model_Version/Release_Date

* * | String/Date | Version and release date | `2024.02.29`

|

| **Modalities

* * | Array | Input/output types | `["text", "vision", "tools"]` |

| **Context_Window

* * | Integer | Token context limit | `200000` |

| **Tokenizer

* * | String | Tokenization method | `BPE`, `TikToken` |

| **System_Prompt_Support

* * | Boolean | System prompt capability | `true` |

| **Sampling_Params

* * | Object | Sampling parameters | `{"temperature": 0.7, "top_p": 1.0}`

|

| **Response_Features

* * | Array | Special capabilities | `["json-mode", "tool-use", "streaming"]` |

| **Determinism_Modes

* * | Array | Seed/reproducibility support | `["seed_support", "deterministic"]` |

| **Guardrails/Builtins

* * | Array | Safety features | `["pii_filter", "toxicity_filter"]` |

| **Fine_Tuning_Support

* * | Object | FT capabilities | `{"method": "LoRA", "max_dataset": "1M"}` |

| **Quantization_Support

* * | Array | Quantization formats | `["int4", "int8", "gguf"]` |

| **Hardware_Requirements

* * | Object | Minimum hardware specs | `{"min_vram": "8GB", "gpu": "RTX 3090"}` |

| **Max_Tokens_Per_Day/Second

* * | Object | Usage limits | `{"per_day": 1000000, "per_second": 100}` |

| **Latency_Typical/Throughput

* * | Object | Performance metrics | `{"latency_ms": 234, "throughput_tps": 45}`

|

#

## **

3. Pricing & Limit

s

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Pricing_Input_per_1K

* * | Float | Input token cost | `0.000015`

|

| **Pricing_Output_per_1K

* * | Float | Output token cost | `0.000075`

|

| **Flat_Plans

* * | Array | Monthly subscription plans | `[{"name": "Pro", "price": 20}]` |

| **Overage_Rates

* * | Object | Excess usage pricing | `{"input": 0.00003, "output": 0.00015}`

|

| **Rate_Limits

* * | Object | Usage restrictions | `{"rpm": 60, "tpm": 10000}` |

| **Quota_Reset_Window

* * | String | Reset period | `monthly`, `daily`

|

#

## **

4. Inference Providers & Router

s

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Router_Name

* * | String | Router service name | `LiteLLM`, `OpenRouter` |

| **Provider_Endpoints

* * | Array | Supported upstream providers | `["Together", "Fireworks", "Azure"]` |

| **Routing_Policies

* * | Array | Routing strategies | `["cost-aware", "latency-aware"]` |

| **Caching_Policies

* * | Object | Cache configurations | `{"prompt_cache": true, "kv_cache": false}` |

| **Observability_Integration

* * | Array | Monitoring integrations | `["OpenTelemetry", "Langfuse"]` |

| **Billing_Model

* * | String | Billing approach | `pass-through`, `meta-billing` |

| **Supported_Models_Map

* * | Object | Model ID mappings | `{"gpt-4": "openai/gpt-4"}` |

| **SLA/Regions

* * | Object | Service level agreements | `{"uptime": "99.9%", "regions": ["US", "EU"]}`



|

#

## **

5. Function & Tool Invocatio

n

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Invocation_Paradigm

* * | String | Function calling standard | `OpenAI Functions`, `Anthropic Tool-Use` |

| **Function_Name

* * | String | Function identifier | `get_weather` |

| **Function_Description

* * | String | Function purpose | `Retrieve current weather data` |

| **Arguments_Schema

* * | Object | Input parameter schema | JSON Schema object |

| **Result_Schema

* * | Object | Output response schema | JSON Schema object |

| **Transport

* * | String | Communication protocol | `HTTP REST`, `WebSocket`, `gRPC` |

| **Auth

* * | String | Authentication method | `API key`, `OAuth2` |

| **Idempotency

* * | Object | Duplicate request handling | `{"strategy": "key", "ttl": "24h"}` |

| **Side_Effects

* * | Array | State changes or external calls | `["database_write", "api_call"]` |

| **Error_Taxonomy

* * | Object | Error types and handling | `{"retryable": ["timeout"], "fatal": ["auth"]}` |

| **Tool_Limits

* * | Object | Size and timing constraints | `{"max_payload": "10MB", "timeout": "30s"}` |

| **Streaming_Support

* * | Object | Streaming capabilities | `{"supported": true, "events": ["delta", "done"]}` |

| **Security_Considerations

* * | Array | Security requirements | `["input_validation", "schema_hardening"]` |

| **Compatibility_Tags

* * | Array | Framework compatibility | `["LangChain", "CrewAI", "MCP"]`

|

#

## **

6. Protocols & Standard

s

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Protocol_Name

* * | String | Protocol identifier | `MCP`, `A2A`, `JSON-RPC` |

| **Role_Model

* * | String | Client/server relationships | `client/server`, `peer/peer` |

| **Message_Schema

* * | Object | Message format specifications | JSON Schema for messages |

| **Capabilities_Negotiation

* * | Object | Feature negotiation process | `{"handshake": true, "versioning": "semver"}` |

| **Transport_Bindings

* * | Array | Supported transports | `["HTTP/1.1", "WebSocket", "TCP"]`

|

| **Security

* * | Object | Security mechanisms | `{"auth": "mTLS", "encryption": "TLS 1.3"}`

|

| **Reference_Examples

* * | Array | Code examples | `["minimal_client.py", "server_example.js"]` |

| **Interoperability

* * | Array | Compatible frameworks | `["LangChain", "CrewAI", "TaskWeaver"]`

|

#

## **

7. Orchestration & Workflo

w

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Topology

* * | String | Workflow structure | `chain`, `DAG`, `multi-agent` |

| **Memory/Context

* * | Object | Context management | `{"short_term": "Redis", "long_term": "VectorDB"}` |

| **Policy_Engine

* * | Object | Decision rules | `{"format": "YAML", "rules": ["steering", "guard"]}` |

| **Fallback/Recovery

* * | Object | Error handling strategies | `{"retry": true, "circuit_breaker": true}` |

| **Multi-Agent_Patterns

* * | Array | Agent coordination patterns | `["porter-driver", "planner-workers"]` |

| **State_Persistence

* * | Object | State storage configuration | `{"store": "Redis", "ttl": "24h"}` |

| **Scheduling/Triggers

* * | Array | Execution triggers | `["cron", "evented", "webhooks"]`

|

#

## **

8. Observability & Reliabilit

y

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Tracing

* * | Object | Distributed tracing setup | `{"otel": true, "propagation": "W3C"}` |

| **Metrics

* * | Array | Performance metrics | `["latency", "tokens", "error_rate"]` |

| **Logs

* * | Object | Logging configuration | `{"levels": ["INFO", "ERROR"], "retention": "90d"}` |

| **Replay/Recording

* * | Object | Request/response capture | `{"enabled": true, "redaction": ["api_keys"]}` |

| **SLOs/SLAs

* * | Object | Service level objectives | `{"uptime": "99.9%", "latency_p95": "500ms"}`

|

| **Incident_Taxonomy

* * | Object | Incident classification | `{"sev1": "downtime", "sev2": "degraded"}`

|

#

## **

9. Compliance & Governanc

e

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Compliance_Tags

* * | Array | Regulatory compliance | `["SOC2", "GDPR", "HIPAA"]` |

| **Data_Handling

* * | Object | Data management policies | `{"logging": "encrypted", "retention": "7y"}` |

| **Data_Residency

* * | Array | Geographic data restrictions | `["US", "EU-only"]` |

| **PII/PHI_Policies

* * | Object | Personal data handling | `{"collection": "opt-in", "retention": "30d"}` |

| **Model_Risk_Class

* * | String | Risk classification | `low`, `medium`, `high` |

| **Audit_Artifacts

* * | Array | Compliance documentation | `["model_cards", "data_sheets", "evals"]`

|

#

## **

10. Evaluations & Benchmark

s

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Bench_Suite

* * | Array | Benchmark suites | `["MMLU", "HELM", "HumanEval"]` |

| **Scores

* * | Object | Performance scores | `{"mmlu": 85.2, "humaneval": 78.5}`

|

| **Internal_Bench_Method

* * | String | Custom evaluation methods | `router-specific-latency-test` |

| **Eval_Reproduction_Links

* * | Array | Reproducible evaluation links | `["https://github.com/eval-repo"]`

|

#

## **

11. Community & Adoptio

n

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **GitHub_Stats

* * | Object | Repository metrics | `{"stars": 15000, "issues": 234}` |

| **Ecosystem_Integrations

* * | Array | Integration partners | `["LangChain", "CrewAI", "HuggingFace"]` |

| **Docs_Quality

* * | Integer (1-5) | Documentation quality score | `4` |

| **Community_Mentions

* * | Object | Social media presence | `{"hn": 15, "reddit": 42}` |

| **Enterprise_Adoption_Signals

* * | Array | Enterprise usage indicators | `["case_studies", "logos"]` |

| **Maturity

* * | String | Project maturity level | `alpha`, `beta`, `GA`

|

#

## **

12. Deployment & Packagin

g

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Hosted_Options

* * | Array | Hosting options | `["SaaS", "managed", "on-prem"]` |

| **Self_Hosting

* * | Object | Self-hosting options | `{"docker": true, "helm": true, "compose": true}` |

| **Runtime

* * | Array | Supported runtimes | `["Python", "Node.js", "Go"]` |

| **Config_Format

* * | Array | Configuration formats | `["YAML", "JSON", "TOML"]` |

| **CI/CD

* * | Array | DevOps integrations | `["GitHub Actions", "GitLab CI"]` |

| **Example_Apps

* * | Array | Reference implementations | `["https://github.com/example/app"]`

|

#

## **

13. Relationship

s

* *

| Field | Type | Description | Example |
|-------|------|-------------|---------|

| **Depends_On

* * | Array | Required dependencies | `["protocol/mcp", "api/openai"]` |

| **Extends/Interoperates_With

* * | Array | Compatible systems | `["agent/langchain", "tool/retrieval"]` |

| **Conflicts_With

* * | Array | Incompatibilities | `["protocol/legacy-rpc"]` |

| **Superseded_By

* * | Array | Replacement systems | `["model/gpt-4-turbo"]`

|

--

- #

# 📋 **CSV Export Template

s

* *

#

## **providers.csv

* *

```csv
Provider_Name,Org_Link,License,Regions,Plans,SLA,Contact,Notes
OpenAI,https://openai.com,Proprietary,US/EU/APAC,Free/Pro/Enterprise,99.9%,support@openai.com,API-first compa

n

y

```

#

## **models.csv

* *

```

csv
Provider_Name,Model_Name,Version,Modalities,Context_Window,JSON_Mode,Tool_Use,Latency,Throughput,Pricing_In,Pricing_Out,Plan_Inclusions,Fine_Tuning,Quantization,Hardware,Regions,Notes
OpenAI,GPT-4,4.0,text/code/vision,8192,true,true,234ms,45tps,0.00003,0.00006,1000 tokens/month,LoRA,int4,8GB VRAM,US/EU,Most capable mod

e

l

```

#

## **functions.csv

* *

```

csv
Provider/Framework,Invocation_Paradigm,Function_Name,Description,Arguments_Schema_Link,Result_Schema_Link,Transport,Auth,Rate_Limits,Side_Effects,Error_Taxonomy,Streaming,Compatibility_Tags,Notes
OpenAI,OpenAI Functions,get_weather,Retrieve weather data,https://api.openai.com/schema/weather,https://api.openai.com/schema/weather-result,HTTP REST,API key,60 RPM,None,retryable:timeout,supported,LangChain/CrewAI,Global coverag

e

```

#

## **mcp_resources.csv

* *

```

csv
Server_Name,Tool_Name,Capability,Schema_Link,Transport,Auth,Limits,Examples,Compatible_Clients,Version,Notes
WeatherServer,get_weather,weather_data,https://weather.example.com/schema,MCP,API key,1000/day,https://examples.com/weather,LiteLLM/Cursor,1.0.0,Real-time weather da

t

a

```

#

## **Additional Templates

* *

- `a2a_protocols.csv

`

 - Agent-to-agent protocol specification

s

- `function_benchmarks.csv

`

 - Function performance benchmark

s

- `integration_complexity.csv

`

 - Integration difficulty assessment

s

- `community_metrics.csv

`

 - Community adoption metric

s

--

- #

# 🔍 **Reverse-Engineered Coverage Ma

p

* *

#

## **Categories → Sub-Categories → Examples

* *

- **Protocols

* * → MCP, A2A, JSON-RPC, gRPC, OpenAPI, GraphQ

L

- **APIs/SDKs

* * → Provider APIs, Cross-providers/Routers, Cloud runtime

s

- **Agents/Frameworks

* * → LangChain, LangGraph, CrewAI, TaskWeave

r

- **Tools/Functions

* * → retrieval, web_browse, code_run, eval, embedding

s

- **Models

* * → code LLMs, reasoning LLMs, multimodal LLM

s

- **Observability

* * → Langfuse, OpenTelemetry exporter

s

- **Compliance

* * → SOC2, ISO 27001, GDPR, EU AI Ac

t

- **Cookbooks

* * → routing policies, guardrails, failure playbook

s

- **Deployment

* * → SaaS, on-prem, docker/hel

m

- **Evaluations

* * → MMLU, HELM, HumanEval, SWE-benc

h

- **Community

* * → Stars, issues, releases, mentions, case studie

s

--

- #

# ✅ **Quality Assurance Framewor

k

* *

#

## **Completeness Gates

* *

- ≥95% records with core fields populate

d

- ≥90% functions with argument schema

s

- ≥85% models with pricing and specification

s

- All categories represented in registr

y

#

## **Quality Gates

* *

- Numeric fields properly parse

d

- URLs validated (HTTP 200 or archived

)

- Timestamps in ISO-8601 forma

t

- Licenses normalized to SPD

X

- Confidence scoring with rational

e

#

## **Cross-Link Validation

* *

- Routers map to supported model

s

- Protocols list compatible SDK

s

- Functions map to invocation paradigm

s

- Dependencies properly linke

d

--

- *This Master Taxonomy provides the foundation for a comprehensive AI Standardization Registry that can catalog, relate, and analyze all AI ecosystem components with consistent metadata and quality standards

.

*
