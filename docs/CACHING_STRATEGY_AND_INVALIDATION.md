

# 🧠 Caching Strategy & Invalidation Pattern

s

#

# Overvie

w

Defines a layered caching approach for performance and cost efficiency, with clear invalidation strategies and correctness guarantees.

#

# Layer

s

- Client cache (HTTP cache, SWR

)

- Edge/CDN cache (static assets, API GET

)

- Service cache (in-memory LRU

)

- Distributed cache (Redis

)

- Computation cache (model results, embeddings

)

#

# Cache Key

s

```typescript
interface CacheKey {
  namespace: string; // e.g., "analytics:dashboard"
  entityId?: string; // e.g., dashboard id
  variant?: string; // e.g., query hash
  tenantId?: string;
}

```

- Use stable, deterministic key

s

- Include tenant and auth scopes when applicabl

e

#

# Invalidatio

n

#

## Time-Based (TTL

)

- Default TTLs per namespace (e.g., metrics: 60s

)

#

## Event-Base

d

- Invalidate on domain events using routing rule

s

```

typescript
interface InvalidationRule {
  onEvent: string; // e.g., workflow.instance.updated.v1
  targets: (event: any) => string[]; // cache keys to invalidate
}

```

#

## Write-Through / Write-Behin

d

- Write-through for strong consistency on hot key

s

- Write-behind for batch-heavy update

s

#

# Coherency & Stalenes

s

- Stale-while-revalidate for non-critical read

s

- Use ETag

s

 + If-None-Match for HTTP GET

s

#

# Caching Pattern

s

#

## Request Result Cache

- Hash request body to key; respect auth scop

e

#

## Query Cache

- Parameterized queries with normalized orderin

g

#

## Composite Cache

- Multi-source aggregation cached with component version vecto

r

#

# Hot Path Example

s

```

typescript
// Redis get-or-set

async function getOrSet<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const value = await fn();
  await redis.set(key, JSON.stringify(value), { EX: ttl });
  return value;
}

```

#

# Observabilit

y

- Metrics: hit rate, evictions, latency, stale rati

o

- Tracing: annotate spans with cache event

s

#

# Risk

s

- Thundering herd: use request coalescing and jittered TTL

s

- Cache stampede: probabilistic early expiratio

n

- Inconsistent reads: use versioning for composite object

s

#

# Related Documentatio

n

- Monitoring & Observabilit

y

- Performance Documentatio

n

- Redis Caching Strateg

y
