# [CLINE] Critical Dependency & Type Resolution

## Task Overview
**Priority**: 🔥 CRITICAL - Blocks all development
**Model**: Cerebras Qwen-3-32b
**Complexity**: Medium - Dependency management and type fixes
**Estimated Time**: 2-3 hours
**Status**: READY FOR IMMEDIATE DELEGATION

## Critical Issues to Fix

### 1. Missing Dependencies
```bash
# Install missing packages
npm install --save-dev @types/react-syntax-highlighter
npm install react-syntax-highlighter
```

### 2. Type Definition Fixes

#### Fix PerformanceMetrics Interface
**File**: `frontend/src/types/performance.ts`
```typescript
export interface PerformanceMetrics {
  executionTime: number;
  resourceUsage: { cpu: number; memory: number };
  workflowId: string;
  timestamp: Date;
  stepCount?: number;        // ADD THIS
  successRate?: number;      // ADD THIS (0-1 decimal)
}
```

#### Fix Chart Component Type Issues
**Files**: 
- `frontend/src/components/charts/LineChart.tsx`
- `frontend/src/components/charts/BarChart.tsx`

**Issues to Fix**:
- Add proper type annotations for `label` parameters
- Handle optional `successRate` property safely
- Fix tooltip formatter type issues

### 3. React Syntax Highlighter Import Fix
**File**: `frontend/src/components/WorkflowExecutionResults.tsx`
```typescript
// WRONG:
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism/dark';

// CORRECT:
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

### 4. Test Configuration Fixes
**Files**: Multiple test files
- Remove unused React imports in test files
- Fix mock implementation return types
- Add proper type annotations for test parameters

### 5. Workflow Builder Type Fixes
**File**: `frontend/src/components/WorkflowBuilder.tsx`
- Fix `connections` mapping to handle ReactNode vs string types
- Add proper type annotations for event handlers
- Fix unused parameter warnings

## Success Criteria
- [ ] All TypeScript compilation errors resolved (0 errors)
- [ ] All dependencies properly installed
- [ ] Chart components render without type errors
- [ ] Test files have proper type definitions
- [ ] Build process completes successfully
- [ ] No unused import warnings

## Validation Commands
```bash
# Must all pass:
npm run build
npx tsc --noEmit
npm run lint
npm test -- --run
```

## Files to Modify
1. `frontend/package.json` - Add missing dependencies
2. `frontend/src/types/performance.ts` - Extend interface
3. `frontend/src/components/charts/LineChart.tsx` - Fix types
4. `frontend/src/components/charts/BarChart.tsx` - Fix types
5. `frontend/src/components/WorkflowExecutionResults.tsx` - Fix import
6. `frontend/src/components/PerformanceDashboard.tsx` - Fix property usage
7. `frontend/src/components/WorkflowBuilder.tsx` - Fix type mismatches
8. Multiple test files - Remove unused imports, fix types

## Expected Outcome
- Clean TypeScript compilation
- All components render properly
- Tests can run without type errors
- Development can proceed without blocking issues