# Shared Components and Services

This directory contains shared components, services, utilities, and hooks that are used across multiple parts of the application.

## Directory Structure

- `/api`: Shared API clients and services
- `/components`: Reusable UI components
- `/contexts`: React contexts for state management
- `/hooks`: Custom React hooks
- `/types`: TypeScript interfaces and types
- `/utils`: Utility functions

## Usage

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

## Guidelines

1. Keep shared code focused on reusability
2. Avoid project-specific logic in shared components
3. Document complex utilities and components
4. Write tests for shared code
5. Keep dependencies minimal
