# TypeScript Linting Fixes - Task Specification

## Task Overview

Fix all 108 TypeScript linting errors currently blocking clean development workflow. This is a systematic code quality improvement task that requires no architectural changes, only proper typing and cleanup.

## Current Status

- **Total Errors**: 108 errors, 1 warning
- **Lint Command**: `npm run lint` (currently failing)
- **Target**: 0 errors, 0 warnings
- **Priority**: HIGH - Blocking clean development workflow

## Error Categories & Counts

### 1. `any` Type Violations (78 errors)

**Most Critical Issue** - Replace all `any` types with proper TypeScript interfaces

- **Files Affected**: 15 files
- **Existing Types Available**: Use types from `/src/types/` directory
  - `workflow.ts` - WorkflowStep, WorkflowDefinition, NodeData, etc.
  - `execution.ts` - ExecutionLogEntry, ExecutionDetails, ExecutionStep
  - `workflow-builder.ts` - Custom workflow builder types
  - `error.ts`, `template.ts`, `performance.ts`

### 2. Unused Variables/Imports (21 errors)

- Remove unused imports and variables
- Follow ESLint rule: unused args must match `/^_/u` pattern
- **Key Files**: Test files, workflow-builder components

### 3. React Hook Dependencies (1 warning)

- Fix useEffect dependency arrays
- Move functions inside useEffect or wrap in useCallback

### 4. HTML Entity Escaping (4 errors)

- Replace unescaped quotes with proper HTML entities
- Use `&quot;` instead of `"`
- **Files**: NodePalette.tsx, WorkflowTester.tsx

### 5. React Props Issues (1 error)

- Fix children prop passing in LazyCodeHighlighter.tsx

## Priority Files (Fix First)

### 1. Test Files with Mock Typing Issues

```
src/components/__tests__/WorkflowExecutionInterface.test.tsx
src/components/__tests__/WorkflowExecutionResults.test.tsx
src/hooks/__tests__/useWebSocketLogs.test.ts
src/components/__tests__/setup.ts
```

### 2. retryUtils.ts

```
src/utils/retryUtils.ts
```

### 3. Workflow Builder Components

```
src/components/workflow-builder/EnhancedWorkflowBuilder.tsx
src/components/workflow-builder/NodeEditor.tsx
src/components/workflow-builder/WorkflowCanvas.tsx
src/components/workflow-builder/WorkflowTester.tsx
src/components/workflow-builder/templates/workflow-templates.ts
```

## Specific Fix Requirements

### Type Replacements

Replace `any` with appropriate types:

- **Event handlers**: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent`
- **Node data**: Use `NodeData` interface from workflow.ts
- **Execution data**: Use `ExecutionDetails`, `ExecutionStep` from execution.ts
- **Workflow data**: Use `WorkflowDefinition`, `WorkflowStep` from workflow.ts
- **Generic objects**: `Record<string, unknown>` instead of `any`

### Import Cleanup

- Remove unused imports: `WorkflowConnection`, `ErrorCategory`, `Edge`, etc.
- Remove unused variables: `deleteNode`, `updateNodeData`, `execution`, etc.
- Prefix unused function parameters with `_` (e.g., `_data` instead of `data`)

### HTML Entity Fixes

```typescript
// Replace this:
"Create a new workflow"
// With this:
&quot;Create a new workflow&quot;
```

### React Hook Dependencies

```typescript
// Fix useEffect dependencies
useEffect(
  () => {
    // Move loadWorkflow inside or use useCallback
  },
  [
    /* add missing dependencies */
  ],
);
```

## Project Context

### Technology Stack

- **Frontend**: React 18.2.0 + TypeScript 5.2.2
- **Build Tool**: Vite 7.0.6
- **Linting**: ESLint 8.53.0 + @typescript-eslint
- **Testing**: Vitest 3.2.4

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ]
  }
}
```

### TypeScript Configuration

- **Target**: ES2020
- **Strict Mode**: Enabled
- **No Unused Locals**: Enabled
- **No Unused Parameters**: Enabled

## Success Criteria

1. **Zero Linting Errors**: `npm run lint` passes with 0 errors, 0 warnings
2. **Proper Typing**: All `any` types replaced with specific interfaces
3. **Clean Imports**: No unused variables or imports
4. **Functional Preservation**: All existing functionality maintained
5. **React Compliance**: Proper hook dependencies and prop usage

## Implementation Strategy

### Phase 1: Type Definitions (Priority Files)

1. Fix test files - replace mock `any` types with proper interfaces
2. Fix retryUtils.ts - add proper function parameter types
3. Fix workflow-builder components - use existing workflow types

### Phase 2: Systematic Cleanup

1. Remove unused imports and variables across all files
2. Fix HTML entity escaping issues
3. Resolve React hook dependency warnings
4. Fix React prop usage issues

### Phase 3: Validation

1. Run `npm run lint` - must pass with 0 errors/warnings
2. Run `npm run test` - ensure no functionality broken
3. Verify all components render correctly

## File Structure Reference

```
frontend/src/
├── types/
│   ├── workflow.ts          # WorkflowStep, WorkflowDefinition, NodeData
│   ├── execution.ts         # ExecutionDetails, ExecutionStep, ExecutionLogEntry
│   ├── workflow-builder.ts  # Custom builder types
│   ├── error.ts            # Error types
│   ├── template.ts         # Template types
│   └── performance.ts      # Performance types
├── components/
│   ├── workflow-builder/   # Main focus area
│   └── __tests__/         # Test files needing type fixes
├── hooks/
│   └── __tests__/         # Hook test files
├── utils/
│   └── retryUtils.ts      # Priority file
└── api/
    └── websocket.ts       # WebSocket typing issues
```

## Notes for Cline

- **No Architecture Changes**: Only fix typing and cleanup, preserve all functionality
- **Use Existing Types**: Leverage comprehensive type definitions already in `/src/types/`
- **Batch Similar Fixes**: Group similar error types for efficient resolution
- **Test After Changes**: Verify functionality preserved with `npm run test`
- **Incremental Approach**: Fix priority files first, then systematic cleanup

## Expected Outcome

Clean, properly typed TypeScript codebase that passes all linting checks and maintains full functionality, enabling smooth development workflow.
