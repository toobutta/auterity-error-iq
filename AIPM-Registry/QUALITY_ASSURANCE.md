

# Systematic Self-Check (built into the job)

#

# Completeness gates (fail job if not met)

:

- ≥ 95% of records have non-empty: `Path`, `Record_Type`, `Resource_Name`, `Source_Links`, `Maintainer`, `Version`

.

- ≥ 90% of functions have `Arguments_Schema` (or explicit N/

A

 + reason)

.

- ≥ 85% of models have `Pricing_In/Out`, `Context_Window`, `Modalities`, `Tool_Use/JSON_Mode`

.

- For each top category, at least 1 record exists for every sub-category in the coverage map above

.

- Zero duplicate `Path

`

 + `Resource_Name

`

 + `Version` combos (dedupe key)

.

#

# Quality gates

:

- Every numeric field parsed as numeric (no strings with units)

.

- URLs live (HTTP 200) or marked archived

.

- Timestamps ISO

- 8601.

- Licenses normalized to SPDX where possible

.

- Confidence < 0.7 triggers “needs-review” ta

g

.

#

# Cross-link gate

s

:

- Any `Router_Name` must have ≥1 `Supported_Models_Map` rows

.

- Any `Protocol_Name` must list ≥1 SDK and ≥1 Example

.

- Any `Function` must map to ≥1 `Invocation_Paradigm`

.
