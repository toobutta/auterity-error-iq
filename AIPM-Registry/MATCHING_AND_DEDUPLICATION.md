

# Matching & De-duplication Logic

i

c

This document describes the logic used to unify functions from different ecosystems by matching names and semantics.

#

#

 1. Name Normalizati

o

n

- Convert function names to lowercase `snake_case`

.

- Strip common vendor prefixes (e.g., `aws_`, `gcp_`, `anthropic_`)

.

#

#

 2. Semantic Hashi

n

g

- Create a "semantic hash" of the `args_schema` and `result_schema`

.

- **Normalization Steps**

:

    1. Sort all keys in the JSON Schema objects alphabetically

.

    2. Remove non-semantic fields like `description`, `title`, and `examples

`

.

    3. Canonicalize types (e.g., map `integer` to `number`)

.

    4. Sort elements within `enum` arrays

.

- Generate a stable hash (e.g., SHA-256) of the normalized, minified JSON string

.

#

#

 3. Equivalence Matchi

n

g

- If the `semantics_hash` of two function variants is an exact match, they are considered equivalent

.

- If the hashes are not an exact match, calculate the Levenshtein or Jaccard distance between the normalized schemas

.

- If the distance is within a predefined threshold (e.g., > 0.95 similarity), they are also considered equivalen

t

.

- For all equivalent variants, create an `equivalent_to` record in the `relationships` table

.

#

#

 4. Dominant Schema Identificati

o

n

- For each canonical function, the "dominant schema" is the one represented by the most frequently occurring `semantics_hash` among its variants

.

- The `schema_divergence` for other variants is calculated based on their distance from this dominant schema

.
