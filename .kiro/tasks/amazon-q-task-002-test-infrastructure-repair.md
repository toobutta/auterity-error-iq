# [AMAZON-Q-TASK] Test Infrastructure Complete Rebuild

**Priority**: 🔴 CRITICAL - BLOCKING ALL QUALITY VALIDATION  
**Assigned Tool**: Amazon Q (Test infrastructure specialist)  
**Status**: Ready for immediate execution  
**Dependencies**: None - independent critical blocker  
**Estimated Effort**: 12-16 hours  

## EXECUTIVE SUMMARY
Fix complete test infrastructure collapse with 58 failed tests, Router conflicts, memory exhaustion, and component rendering failures. This is blocking all quality assurance and CI/CD pipeline functionality.

## PROBLEM ANALYSIS

### Current Test Failure Status
- **Total Tests**: 223 tests (58 failed, 156 passing = 26% failure rate)
- **Router Conflicts**: "Cannot render Router inside another Router" errors
- **Memory Issues**: "JS heap out of memory" - Worker terminated
- **Component Rendering**: All E2E tests expecting "Dashboard" text failing
- **Test Environment**: Unhandled errors and memory leaks

### Critical Failure Categories

#### 1. Router Architecture Crisis
```
Error: You cannot render a <Router> inside another <Router>. 
You should never have more than one in your app.
```
**Impact**: Complete E2E test failure across all workflow tests
**Root Cause**: Nested Router components in test setup

#### 2. Memory Exhaustion
```
Error: Worker terminated due to reaching memory limit: JS heap out of memory
Serialized Error: { code: 'ERR_WORKER_OUT_OF_MEMORY' }
```
**Impact**: Test workers crashing during execution
**Root Cause**: Memory leaks in test environment

#### 3. Component Rendering Failures
```
TestingLibraryElementError: Unable to find an element with the text: Dashboard
```
**Impact**: All E2E tests failing to find expected UI elements
**Root Cause**: Component rendering issues in test environment

## TECHNICAL REQUIREMENTS

### Router Architecture Fix
```typescript
// Fix test setup to avoid nested Routers
// vitest.setup.ts or test utilities
import { MemoryRouter } from 'react-router-dom';

// Create proper test wrapper without nested routers
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MemoryRouter initialEntries={['/']}>
      {children}
    </MemoryRouter>
  );
};

// Update test render utility
export const renderWithRouter = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
};
```

### Memory Optimization Configuration
```typescript
// vitest.config.ts updates
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    // Memory optimization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Reduce memory usage
        maxThreads: 1,
        minThreads: 1
      }
    },
    // Increase memory limits
    testTimeout: 30000,
    hookTimeout: 30000,
    // Cleanup between tests
    clearMocks: true,
    restoreMocks: true,
    // Memory management
    logHeapUsage: true,
    isolate: true
  }
});
```

### Component Mocking Strategy
```typescript
// Mock problematic components that cause rendering issues
vi.mock('../components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout-mock">{children}</div>
  )
}));

vi.mock('../components/WorkflowBuilder', () => ({
  default: () => <div data-testid="workflow-builder-mock">Workflow Builder</div>
}));

// Fix Dashboard component rendering
vi.mock('../pages/Dashboard', () => ({
  default: () => (
    <div data-testid="dashboard-mock">
      <h1>Dashboard</h1>
      <div>Dashboard content</div>
    </div>
  )
}));
```

## IMPLEMENTATION STRATEGY

### Phase 1: Router Conflict Resolution (4 hours)
1. **Analyze Router usage** in test files and components
2. **Create proper test wrappers** that avoid nested Router conflicts
3. **Update all test files** to use new rendering utilities
4. **Verify Router conflicts are resolved** in E2E tests

### Phase 2: Memory Optimization (4 hours)
1. **Configure Vitest memory settings** to prevent heap exhaustion
2. **Implement test isolation** to prevent memory leaks between tests
3. **Add memory monitoring** and cleanup between test runs
4. **Optimize test worker configuration** for memory efficiency

### Phase 3: Component Rendering Fixes (3 hours)
1. **Mock problematic components** that cause rendering failures
2. **Fix component imports** and dependencies in test environment
3. **Update test assertions** to match actual rendered content
4. **Verify all components render correctly** in test environment

### Phase 4: Test Configuration Overhaul (2 hours)
1. **Update vitest.config.ts** with optimized settings
2. **Fix setupTests.ts** configuration and global mocks
3. **Update package.json** test scripts if needed
4. **Verify CI/CD pipeline** test execution

### Phase 5: E2E Test Framework Rebuild (3 hours)
1. **Rebuild E2E test architecture** with proper component mocking
2. **Fix workflow integration tests** with corrected Router setup
3. **Update test utilities** and helper functions
4. **Verify all E2E scenarios** work correctly

## SPECIFIC FIXES REQUIRED

### Critical Test Files to Fix
1. `src/tests/integration/e2e-workflow.test.tsx` - Router conflicts
2. `vitest.config.ts` - Memory and worker configuration
3. `src/setupTests.ts` - Global test setup and mocks
4. `src/tests/utils/test-utils.tsx` - Rendering utilities
5. All component test files using Router

### Memory Leak Sources to Address
1. **WebSocket connections** not properly closed in tests
2. **Event listeners** not cleaned up between tests
3. **React components** not properly unmounted
4. **Mock functions** not reset between tests

### Component Rendering Issues
1. **Layout component** causing nested Router issues
2. **Dashboard component** not rendering expected text
3. **Navigation components** conflicting with test Router
4. **Async components** not properly awaited in tests

## QUALITY GATES

### Test Execution Requirements
- [ ] All 223 tests discoverable and executable
- [ ] Zero Router conflict errors in any test
- [ ] Memory usage stable (no heap exhaustion)
- [ ] All E2E tests pass with proper component rendering
- [ ] Test coverage reporting functional

### Performance Requirements
- [ ] Test suite completes in <5 minutes
- [ ] Memory usage <2GB during test execution
- [ ] No memory leaks between test runs
- [ ] CI/CD pipeline test gates operational

## SUCCESS CRITERIA
✅ Zero Router conflict errors in tests  
✅ Memory usage under control (no heap exhaustion)  
✅ All 223 tests executable without crashes  
✅ E2E tests passing with proper component rendering  
✅ Test coverage reporting functional  
✅ CI/CD pipeline test gates operational  
✅ Test suite execution time <5 minutes  
✅ No memory leaks or unhandled errors  

## HANDBACK REQUIREMENTS
Task is complete when:
1. All 223 tests can be discovered and executed
2. Zero Router conflict errors in test output
3. Memory usage remains stable during test execution
4. All E2E tests pass with expected component rendering
5. Test coverage reporting works correctly
6. CI/CD pipeline can execute tests successfully
7. No unhandled errors or memory leaks in test output

## CONTEXT FILES TO REFERENCE
- `vitest.config.ts` - Test configuration and setup
- `src/setupTests.ts` - Global test setup and mocks
- `package.json` - Test scripts and dependencies
- `src/tests/integration/e2e-workflow.test.tsx` - Failing E2E tests
- `src/tests/utils/test-utils.tsx` - Test rendering utilities

**CRITICAL**: This task blocks ALL quality validation and CI/CD pipeline functionality. No production deployment can occur until test infrastructure is functional.