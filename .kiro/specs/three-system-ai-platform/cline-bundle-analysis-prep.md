# [CLINE-TASK] Bundle Analysis and Optimization Preparation

## Task Overview
Analyze and prepare optimization strategies for the frontend bundle size, which is currently 1.5MB and needs to be reduced to under 1MB. Focus on code splitting, lazy loading, and dependency optimization across the three-system platform.

## Current Bundle Analysis

### Bundle Size Issues (from product.md)
- **Current Size**: 1.5MB (target: < 1MB)
- **Performance Impact**: Slow initial load times
- **User Experience**: Poor mobile performance
- **Target Reduction**: ~33% size reduction needed

## Component Analysis Tasks

### 1. Dependency Audit Component
**File**: `frontend/src/utils/bundleAnalysis.ts`
```typescript
interface DependencyAnalysis {
  name: string;
  size: number;
  gzippedSize: number;
  usage: 'critical' | 'important' | 'optional' | 'unused';
  alternatives?: string[];
  canLazyLoad: boolean;
}

export const analyzeDependencies = (): DependencyAnalysis[] => {
  // Analyze package.json dependencies
  // Identify large libraries that can be optimized
  // Suggest alternatives or removal candidates
};

export const generateOptimizationReport = (): {
  totalSize: number;
  optimizationOpportunities: Array<{
    type: 'remove' | 'replace' | 'lazy-load' | 'tree-shake';
    dependency: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
  }>;
} => {
  // Generate actionable optimization recommendations
};
```

### 2. Code Splitting Strategy Component
**File**: `frontend/src/components/optimization/LazyComponentLoader.tsx`
```typescript
interface LazyComponentLoaderProps {
  componentPath: string;
  fallback?: React.ComponentType;
  errorBoundary?: React.ComponentType<{ error: Error }>;
  preload?: boolean;
  chunkName?: string;
}

export const LazyComponentLoader: React.FC<LazyComponentLoaderProps> = ({
  componentPath,
  fallback: Fallback = () => <div>Loading...</div>,
  errorBoundary: ErrorBoundary,
  preload = false,
  chunkName
}) => {
  // Dynamic import with error handling and preloading
};

// Usage examples for large components
export const LazyUnifiedMonitoringDashboard = lazy(() => 
  import('../UnifiedMonitoringDashboard').then(module => ({
    default: module.UnifiedMonitoringDashboard
  }))
);

export const LazyWorkflowBuilder = lazy(() =>
  import('../WorkflowBuilder').then(module => ({
    default: module.WorkflowBuilder
  }))
);
```

### 3. Route-Based Code Splitting
**File**: `frontend/src/router/LazyRoutes.tsx`
```typescript
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load page components
const Dashboard = lazy(() => import('../pages/Dashboard'));
const WorkflowBuilder = lazy(() => import('../pages/WorkflowBuilder'));
const MonitoringDashboard = lazy(() => import('../pages/MonitoringDashboard'));
const NeuroWeaverDashboard = lazy(() => import('../pages/NeuroWeaverDashboard'));
const RelayCoreSettings = lazy(() => import('../pages/RelayCoreSettings'));

export const LazyRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workflows/*" element={<WorkflowBuilder />} />
        <Route path="/monitoring/*" element={<MonitoringDashboard />} />
        <Route path="/neuroweaver/*" element={<NeuroWeaverDashboard />} />
        <Route path="/relaycore/*" element={<RelayCoreSettings />} />
      </Routes>
    </Suspense>
  );
};
```

### 4. Library Optimization Analysis
**File**: `frontend/src/utils/libraryOptimization.ts`
```typescript
interface LibraryOptimization {
  current: string;
  size: number;
  alternatives: Array<{
    name: string;
    size: number;
    features: string[];
    migrationEffort: 'low' | 'medium' | 'high';
  }>;
  treeShakingOpportunities: string[];
}

export const analyzeLibraries = (): Record<string, LibraryOptimization> => {
  return {
    'recharts': {
      current: 'recharts@2.8.0',
      size: 450000, // ~450KB
      alternatives: [
        {
          name: 'chart.js',
          size: 180000,
          features: ['basic charts', 'animations'],
          migrationEffort: 'medium'
        },
        {
          name: 'lightweight-charts',
          size: 120000,
          features: ['financial charts', 'real-time'],
          migrationEffort: 'high'
        }
      ],
      treeShakingOpportunities: [
        'Remove unused chart types',
        'Import only required components'
      ]
    },
    '@mui/material': {
      current: '@mui/material@5.14.5',
      size: 380000,
      alternatives: [
        {
          name: 'headless-ui',
          size: 45000,
          features: ['unstyled components'],
          migrationEffort: 'high'
        }
      ],
      treeShakingOpportunities: [
        'Use individual component imports',
        'Remove unused icons'
      ]
    }
  };
};
```

## Bundle Optimization Strategies

### 1. Dynamic Import Utilities
**File**: `frontend/src/utils/dynamicImports.ts`
```typescript
export const createDynamicImport = <T>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preload?: boolean;
    retries?: number;
    timeout?: number;
  } = {}
) => {
  const { preload = false, retries = 3, timeout = 10000 } = options;
  
  let importPromise: Promise<{ default: T }> | null = null;
  
  const load = async (): Promise<{ default: T }> => {
    if (!importPromise) {
      importPromise = Promise.race([
        importFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Import timeout')), timeout)
        )
      ]);
    }
    return importPromise;
  };
  
  if (preload) {
    // Preload during idle time
    requestIdleCallback(() => load().catch(() => {}));
  }
  
  return load;
};

// Preload critical components
export const preloadCriticalComponents = () => {
  const criticalImports = [
    () => import('../components/WorkflowBuilder'),
    () => import('../components/UnifiedMonitoringDashboard'),
  ];
  
  criticalImports.forEach(importFn => {
    requestIdleCallback(() => importFn().catch(() => {}));
  });
};
```

### 2. Tree Shaking Configuration
**File**: `frontend/vite.config.optimization.ts`
```typescript
import { defineConfig } from 'vite';

export const optimizationConfig = defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', '@mui/icons-material'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['axios', 'date-fns'],
          
          // Feature chunks
          'workflow-builder': [
            './src/components/WorkflowBuilder',
            './src/components/nodes',
            './src/components/workflow-builder'
          ],
          'monitoring': [
            './src/components/UnifiedMonitoringDashboard',
            './src/components/charts',
            './src/api/monitoring'
          ],
          'neuroweaver': [
            './src/components/NeuroWeaverDashboard',
            './src/api/neuroweaver'
          ]
        }
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    }
  }
});
```

### 3. Component Size Analysis Tool
**File**: `frontend/src/utils/componentSizeAnalyzer.ts`
```typescript
interface ComponentSizeInfo {
  name: string;
  estimatedSize: number;
  dependencies: string[];
  canBeLazyLoaded: boolean;
  usageFrequency: 'high' | 'medium' | 'low';
  optimizationPotential: number;
}

export const analyzeComponentSizes = (): ComponentSizeInfo[] => {
  // Analyze component dependencies and estimated sizes
  return [
    {
      name: 'UnifiedMonitoringDashboard',
      estimatedSize: 180000,
      dependencies: ['recharts', '@mui/material', 'axios'],
      canBeLazyLoaded: true,
      usageFrequency: 'medium',
      optimizationPotential: 60000
    },
    {
      name: 'WorkflowBuilder',
      estimatedSize: 220000,
      dependencies: ['react-flow-renderer', '@mui/material'],
      canBeLazyLoaded: true,
      usageFrequency: 'high',
      optimizationPotential: 40000
    }
  ];
};

export const generateOptimizationPlan = (components: ComponentSizeInfo[]) => {
  return components
    .filter(c => c.optimizationPotential > 20000)
    .sort((a, b) => b.optimizationPotential - a.optimizationPotential)
    .map(component => ({
      component: component.name,
      currentSize: component.estimatedSize,
      potentialSavings: component.optimizationPotential,
      strategy: component.canBeLazyLoaded ? 'lazy-load' : 'optimize-deps',
      priority: component.usageFrequency === 'low' ? 'high' : 'medium'
    }));
};
```

## Implementation Strategy

### Phase 1: Analysis and Planning
1. **Dependency Audit**: Identify large dependencies and alternatives
2. **Component Analysis**: Map component sizes and usage patterns
3. **Bundle Analysis**: Use webpack-bundle-analyzer equivalent for Vite
4. **Optimization Planning**: Create prioritized optimization roadmap

### Phase 2: Quick Wins
1. **Tree Shaking**: Optimize imports and remove unused code
2. **Dynamic Imports**: Convert large components to lazy loading
3. **Route Splitting**: Implement route-based code splitting
4. **Asset Optimization**: Optimize images and static assets

### Phase 3: Deep Optimization
1. **Library Replacement**: Replace heavy libraries with lighter alternatives
2. **Custom Components**: Replace heavy UI library components with custom ones
3. **Advanced Splitting**: Implement advanced chunk splitting strategies
4. **Performance Monitoring**: Add bundle size monitoring

## Success Criteria
- [ ] Bundle size reduced from 1.5MB to under 1MB
- [ ] Initial page load time improved by 30%+
- [ ] Lazy loading implemented for non-critical components
- [ ] Tree shaking optimized for all major dependencies
- [ ] Bundle analysis tools integrated into build process
- [ ] Performance monitoring dashboard shows improvements

## Technical Context
- Current build system uses Vite
- Existing components in `frontend/src/components/`
- Package.json shows current dependencies
- Target modern browsers (ES2020+)

## Files to Create/Modify
1. `frontend/src/utils/bundleAnalysis.ts`
2. `frontend/src/components/optimization/LazyComponentLoader.tsx`
3. `frontend/src/router/LazyRoutes.tsx`
4. `frontend/src/utils/libraryOptimization.ts`
5. `frontend/src/utils/dynamicImports.ts`
6. `frontend/vite.config.optimization.ts`
7. `frontend/src/utils/componentSizeAnalyzer.ts`
8. `frontend/src/hooks/useLazyComponent.ts`

## Testing Requirements
- Bundle size regression tests
- Lazy loading functionality tests
- Performance benchmarks
- Error boundary tests for dynamic imports

## Priority
High - Critical for meeting performance targets

## Estimated Time
6-8 hours for analysis and initial optimization setup

## Dependencies
- Vite build system
- Existing component library
- Bundle analysis tools
- Performance monitoring setup