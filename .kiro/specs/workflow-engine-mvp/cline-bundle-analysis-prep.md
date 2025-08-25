# [CLINE-TASK] Bundle Analysis & Optimization Preparation

## Task Overview

**Priority**: 🟡 HIGH - Performance Optimization Prep
**Complexity**: Medium
**Estimated Time**: 2-3 hours
**Model**: Cerebras Qwen-3-32b
**Status**: Ready for Immediate Assignment

## Objective

Analyze current frontend bundle composition, identify optimization opportunities, and prepare detailed recommendations for bundle size reduction from current 1.5MB to target <1MB.

## Current Context

- Bundle analyzer just added to Vite config
- Target: Reduce from 1.5MB to <1MB (33% reduction needed)
- Key problem areas: syntax-highlighter (631kB), charts (323kB)
- React 18 + TypeScript + Tailwind CSS stack

## Analysis Tasks

### 1. Current Bundle Composition Analysis

```bash
# Commands for Cline to run:
cd frontend
npm run build:analyze  # Generate bundle analysis
```

**Expected Analysis:**

- Identify largest dependencies by size
- Map component usage to bundle chunks
- Find unused/duplicate dependencies
- Analyze tree-shaking effectiveness

### 2. Dependency Size Audit

**Files to analyze:**

- `frontend/package.json` - All dependencies
- `frontend/src/**/*.tsx` - Import usage patterns
- `frontend/dist/` - Built bundle structure

**Key Dependencies to Investigate:**

```json
{
  "react-syntax-highlighter": "^5.8.0", // Currently 631kB
  "recharts": "^3.1.0", // Currently 323kB
  "reactflow": "^11.11.4", // Flow builder
  "react-router-dom": "^6.18.0", // Routing
  "axios": "^1.6.0" // HTTP client
}
```

### 3. Code Splitting Opportunities

**Components to analyze for lazy loading:**

- `frontend/src/components/charts/` - Chart components
- `frontend/src/components/WorkflowBuilder.tsx` - Heavy workflow UI
- `frontend/src/components/PerformanceDashboard.tsx` - Dashboard with charts
- `frontend/src/pages/` - Page-level components

### 4. Alternative Library Research

**Research lighter alternatives for:**

#### Syntax Highlighting (Current: 631kB)

- `@uiw/react-md-editor` - Lighter markdown editor
- `prism-react-renderer` - Smaller Prism wrapper
- Custom highlighting with `highlight.js`

#### Charts (Current: 323kB)

- `chart.js` with `react-chartjs-2` - More modular
- `victory` - Smaller footprint
- `nivo` - Tree-shakeable charts
- Native SVG implementations

#### HTTP Client (Current: axios)

- Native `fetch` API - Zero bundle cost
- `ky` - Lighter alternative to axios

## Deliverables

### 1. Bundle Analysis Report

```markdown
# Bundle Analysis Report

## Current State

- Total bundle size: [X]MB
- Largest chunks: [List top 10]
- Unused dependencies: [List]
- Tree-shaking issues: [List]

## Optimization Opportunities

- Lazy loading candidates: [Components]
- Alternative libraries: [Recommendations]
- Code splitting potential: [Estimated savings]
- Dead code elimination: [Estimated savings]

## Implementation Roadmap

- Phase 1: Quick wins (estimated savings)
- Phase 2: Library replacements (estimated savings)
- Phase 3: Advanced optimizations (estimated savings)
```

### 2. Dependency Replacement Plan

```typescript
// Recommended replacements with size comparisons
interface LibraryReplacement {
  current: {
    name: string;
    size: string;
    usage: string[];
  };
  recommended: {
    name: string;
    size: string;
    benefits: string[];
    migration_effort: "Low" | "Medium" | "High";
  };
}
```

### 3. Code Splitting Strategy

```typescript
// Lazy loading implementation plan
const LazyComponents = {
  PerformanceDashboard: {
    currentSize: "XkB",
    lazyLoadSavings: "YkB",
    implementation: "React.lazy() + Suspense",
  },
  // ... other components
};
```

## Technical Requirements

### Bundle Analysis Tools

- Use Vite's built-in `rollup-plugin-visualizer`
- Analyze webpack-bundle-analyzer output
- Check for duplicate dependencies with `npm ls`
- Measure gzip/brotli compression ratios

### Performance Metrics

- Measure First Contentful Paint (FCP) impact
- Calculate Time to Interactive (TTI) improvements
- Assess Core Web Vitals changes
- Document loading performance gains

### Compatibility Checks

- Ensure TypeScript compatibility
- Verify React 18 support
- Check Tailwind CSS integration
- Validate existing component APIs

## Success Criteria

- [ ] Complete bundle composition analysis
- [ ] Identify 500kB+ in optimization opportunities
- [ ] Research 3+ alternative libraries for major dependencies
- [ ] Create implementation roadmap with effort estimates
- [ ] Document performance impact projections
- [ ] Provide code splitting recommendations
- [ ] Zero breaking changes to existing functionality

## Files to Create/Modify

- `.kiro/specs/workflow-engine-mvp/bundle-analysis-report.md`
- `.kiro/specs/workflow-engine-mvp/dependency-replacement-plan.md`
- `frontend/docs/bundle-optimization-strategy.md`
- Update `frontend/package.json` with alternative research

## Next Steps After Completion

1. Review analysis results with development team
2. Prioritize optimizations by impact vs effort
3. Begin implementation of quick wins
4. Plan library migration strategy
5. Set up performance monitoring

---

**This task is ready for immediate Cline assignment and will provide the foundation for significant bundle size reduction work.**
