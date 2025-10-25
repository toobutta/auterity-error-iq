

# Capture Checklist & API Schema

a

This document provides a checklist for the data capture process and an optional JSON Schema for API-based ingestion

.

#

# Parallel AI Capture Checklis

t

- [ ] Ensure every `function` row has at least one `invocation_paradigm` (block job if missing)

.

- [ ] Always store `args_schema` and `result_schema`, along with their computed hashes

.

- [ ] Always store `auth`, `rate_limits`, `quotas`, and `limits` information

.

- [ ] Attach at least 3 evidence links (`source_links`) for pricing, limits, and behavior claims

.

- [ ] Compute `equivalent_to` relationship edges during the enrichment phase

.

- [ ] Compute the `SiloScore` for each variant during the enrichment phase

.

- [ ] Trigger a re-crawl/verification for variants where `confidence` is less than 0.7 or `schema_divergence` is greater than

0

.

35. --

- #

# Optional JSON Schema (for API ingestion

)

```json
{
  "$id": "aipm.function_variant.v1",
  "type": "object",
  "required": ["function", "provider", "invocation_paradigm", "version", "args_schema", "result_schema", "source_links"],
  "properties": {
    "function": { "type": "string" },
    "provider": { "type": "string" },
    "invocation_paradigm": { "type": "string" },
    "version": { "type": "string" },
    "args_schema": { "type": "object" },
    "result_schema": { "type": "object" },
    "transport": { "type": "array", "items": { "type": "string" } },
    "auth": { "type": "array", "items": { "type": "string" } },
    "rate_limits": { "type": "object" },
    "quotas": { "type": "object" },
    "limits": { "type": "object" },
    "streaming": { "type": "boolean" },
    "idempotency": { "type": "string" },
    "side_effects": { "type": "string" },
    "error_taxonomy": { "type": "object" },
    "compliance_tags": { "type": "array", "items": { "type": "string" } },
    "regions": { "type": "array", "items": { "type": "string" } },
    "models": { "type": "array", "items": { "type": "string" } },
    "protocols": { "type": "array", "items": { "type": "string" } },
    "source_links": { "type": "array", "items": { "type": "string", "format": "uri" } },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "last_verified": { "type": "string", "format": "date-time" }

  }
}

```
