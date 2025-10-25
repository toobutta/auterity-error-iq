

# Shared Components and Service

s

This directory contains shared components, services, utilities, and hooks that are used across multiple parts of the application.

#

# Directory Structur

e

- `/api`: Shared API clients and service

s

- `/components`: Reusable UI component

s

- `/contexts`: React contexts for state managemen

t

- `/hooks`: Custom React hook

s

- `/types`: TypeScript interfaces and type

s

- `/utils`: Utility function

s

#

# Usag

e

Import shared components and services directly from their respective directories:

```typescript
// Import from specific subdirectory
import { apiClient } from "../shared/api/client";
import { logger } from "../shared/utils/logger";
import { useErrorHandler } from "../shared/hooks/useErrorHandler";

// Or use the index files
import { apiClient } from "../shared/api";
import { logger } from "../shared/utils";
import { useErrorHandler } from "../shared/hooks";

```

#

# Guideline

s

1. Keep shared code focused on reusabilit

y

2. Avoid project-specific logic in shared componen

t

s

3. Document complex utilities and component

s

4. Write tests for shared cod

e

5. Keep dependencies minima

l
