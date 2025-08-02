# [AMAZON-Q-TASK] Test Infrastructure Debug & Repair

## DIRECT HANDOFF: CLINE → AMAZON-Q

**Context:** Test infrastructure repair task - critical dependency resolution failures
**Handoff Reason:** Complex module resolution errors preventing test execution
**Current State:** Vitest dependency conflicts causing 22 unhandled errors
**Specific Request:** Debug and fix vitest/pretty-format module resolution issues
**Success Criteria:** All tests run without dependency errors
**Return Conditions:** When test infrastructure is stable and tests can execute

**Files Involved:**
- frontend/package.json
- frontend/vite.config.ts
- frontend/src/setupTests.ts
- All test files in frontend/src/components/__tests__/
- All test files in frontend/src/tests/

**Priority:** High
**Estimated Time:** 1-2 hours

## Problem Analysis

### Critical Error Pattern
```
Error: Cannot find module '/Users/.../frontend/node_modules/@vitest/snapshot/node_modules/pretty-format/build/index.js'
```

This error occurs 22 times, indicating a fundamental dependency resolution issue with vitest's internal dependencies.

### Root Cause Analysis Needed
1. **Dependency Conflict**: Vitest version 0.34.6 may have incompatible internal dependencies
2. **Module Resolution**: pretty-format module missing from @vitest/snapshot package
3. **Node.js Version Compatibility**: Running Node.js v22.17.1 may have compatibility issues
4. **Package Lock Issues**: npm install may have created inconsistent dependency tree

### Current Configuration State
- **Vitest Version**: 0.34.6 (downgraded from 1.0.0 due to conflicts)
- **Node Memory**: Increased to 4096MB via NODE_OPTIONS
- **Test Environment**: jsdom with global setup
- **Coverage**: Disabled due to dependency conflicts

## Debugging Strategy Required

### Phase 1: Dependency Analysis
1. Analyze current package.json and package-lock.json
2. Check vitest internal dependency tree
3. Identify conflicting or missing dependencies
4. Verify Node.js compatibility with current vitest version

### Phase 2: Resolution Options
1. **Option A**: Fix current vitest 0.34.6 installation
2. **Option B**: Upgrade to stable vitest 1.x with proper dependencies
3. **Option C**: Clean install with dependency resolution
4. **Option D**: Alternative test runner if vitest proves problematic

### Phase 3: Verification
1. Ensure all 250 tests can be discovered and loaded
2. Verify mock configurations work correctly
3. Test memory management improvements
4. Validate coverage reporting functionality

## Expected Deliverables

### 1. Working Test Infrastructure
- All tests discoverable and executable
- No module resolution errors
- Proper mock configurations
- Memory optimization working

### 2. Configuration Files
- Updated package.json with correct dependencies
- Optimized vite.config.ts for testing
- Enhanced setupTests.ts with proper global setup

### 3. Documentation
- Root cause analysis of the dependency issues
- Solution explanation and rationale
- Prevention strategies for future dependency conflicts

## Technical Context

### Current Test Statistics (Before Fix)
- **Total Tests**: 250 (estimated)
- **Test Files**: 22 files
- **Errors**: 22 unhandled dependency errors
- **Status**: Cannot execute any tests

### Target Test Statistics (After Fix)
- **Total Tests**: 250 discoverable and executable
- **Failed Tests**: Address the original 35 failing tests
- **Memory Issues**: Resolved JS heap out of memory errors
- **Mock Issues**: All API mocks working correctly

### Environment Details
- **OS**: macOS (darwin)
- **Node.js**: v22.17.1
- **Package Manager**: npm
- **Build Tool**: Vite 4.5.0
- **Test Framework**: Vitest (needs fixing)

## Success Metrics
- ✅ Zero dependency resolution errors
- ✅ All test files discoverable
- ✅ Test execution completes without crashes
- ✅ Memory usage within acceptable limits
- ✅ Mock configurations working properly
- ✅ Coverage reporting functional (if possible)

## Escalation Conditions
- If vitest cannot be fixed, recommend alternative test framework
- If Node.js version incompatibility, recommend version downgrade
- If fundamental architecture issues, escalate back to Kiro for strategy

---

**AMAZON-Q: Please analyze and fix these dependency resolution issues. The test infrastructure is completely broken and preventing any test execution. Focus on getting the basic test runner working first, then we can address the specific test failures.**