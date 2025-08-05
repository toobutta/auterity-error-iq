# Refactoring Guide: Moving to Shared Components

This guide explains how to update your imports after the refactoring of shared services and components.

## What Changed

We have moved shared services, utilities, hooks, contexts, and components to a new `/shared` directory to improve code organization and reusability. This change affects how you import these resources in your code.

## How to Update Your Imports

### Before:

```typescript
// API imports
import { apiClient } from "../api/client";

// Utility imports
import { logger, logError } from "../utils/logger";
import { createAppError } from "../utils/errorUtils";
import { retryWithBackoff } from "../utils/retryUtils";

// Hook imports
import { useErrorHandler } from "../hooks/useErrorHandler";
import { onErrorEvent } from "../kiro/hooks/error-intelligence.hook";

// Context imports
import { useAuth, AuthProvider } from "../contexts/AuthContext";
import { useError, ErrorProvider } from "../contexts/ErrorContext";

// Type imports
import { AppError, ErrorCategory } from "../types/error";
```

### After:

```typescript
// API imports
import { apiClient } from "../shared/api/client";
// or
import { apiClient } from "../shared/api";

// Utility imports
import { logger, logError } from "../shared/utils/logger";
import { createAppError } from "../shared/utils/errorUtils";
import { retryWithBackoff } from "../shared/utils/retryUtils";
// or
import { logger, logError, createAppError, retryWithBackoff } from "../shared/utils";

// Hook imports
import { useErrorHandler } from "../shared/hooks/useErrorHandler";
import { onErrorEvent } from "../shared/hooks/error-intelligence.hook";
// or
import { useErrorHandler, onErrorEvent } from "../shared/hooks";

// Context imports
import { useAuth, AuthProvider } from "../shared/contexts/AuthContext";
import { useError, ErrorProvider } from "../shared/contexts/ErrorContext";
// or
import { useAuth, AuthProvider, useError, ErrorProvider } from "../shared/contexts";

// Type imports
import { AppError, ErrorCategory } from "../shared/types/error";
// or
import { AppError, ErrorCategory } from "../shared/types";
```

## Benefits of This Refactoring

1. **Improved Code Organization**: Clear separation of shared code from application-specific code
2. **Better Reusability**: Easier to find and reuse shared components across the application
3. **Reduced Duplication**: Single source of truth for common functionality
4. **Easier Maintenance**: Changes to shared code can be made in one place
5. **Clearer Dependencies**: More explicit about what code is shared vs. specific to a feature

## Next Steps

1. Update your imports as described above
2. Run tests to ensure everything works correctly
3. If you find any issues, please report them to the team

