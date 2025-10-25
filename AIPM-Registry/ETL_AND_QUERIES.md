

# ETL Requirements & Useful Queries

s

This document details the required fields for the data ingestion ETL process and provides a set of useful queries for analyzing the registry data.

#

# Required ETL Field

s

For each `function_variant`, the ETL process must capture the following fields:

- `function_id` (via canonical name matching

)

- `provider_id

`

- `paradigm_id` (at least one is required

)

- `version

`

- `args_schema` & `result_schema` (and their hashes

)

- `transport

`

- `auth

`

- `rate_limits`, `quotas`, `limits

`

- `streaming` suppor

t

- `idempotency` strateg

y

- `side_effects

`

- `error_taxonomy

`

- `compliance_tags

`

- `regions

`

- `source_links` (evidence URLs

)

- `confidence` scor

e

- `last_verified` timestam

p

- (Optional) `models` and `protocols` that the variant is bound to

.

--

- #

# Useful Querie

s

#

## A) Show me siloed implementations first

```sql
SELECT id, canonical_name, provider, paradigm
FROM vw_function_variant_silos
ORDER BY is_provider_unique DESC, paradigm_lock DESC, schema_divergence DESC NULLS LAST;

```

#

## B) Find functions missing a paradigm (data quality gate)

```

sql
SELECT fv.

*
FROM function_variants fv
LEFT JOIN invocation_paradigms ip ON ip.id = fv.paradigm_id
WHERE ip.id IS NULL;

```

#

## C) Surface high divergence within a function

*Assumes a materialized table `function_schema_divergence(fv_id, divergence_score)

`

* ```

sql
SELECT f.canonical_name, p.name AS provider, ip.name AS paradigm, d.divergence_score
FROM function_variants fv
JOIN functions f ON f.id = fv.function_id
JOIN providers p ON p.id = fv.provider_id
JOIN invocation_paradigms ip ON ip.id = fv.paradigm_id
JOIN function_schema_divergence d ON d.fv_id = fv.id
WHERE d.divergence_score > 0.35

ORDER BY d.divergence_score DESC;

```

#

## D) Which providers lock functions to proprietary models?

```

sql
SELECT DISTINCT p.name, f.canonical_name, m.name AS required_model
FROM function_variant_models fvm
JOIN function_variants fv ON fv.id = fvm.function_variant_id
JOIN models m ON m.id = fvm.model_id
JOIN providers p ON p.id = fv.provider_id
JOIN functions f ON f.id = fv.function_id
WHERE fvm.required = TRUE;

```
