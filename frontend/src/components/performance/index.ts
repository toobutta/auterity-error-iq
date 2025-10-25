// Performance components exports

export { default as PerformanceDashboard } from './PerformanceDashboard';
export type { PerformanceDashboardProps } from './PerformanceDashboard';

export {
  usePerformanceMonitor,
  PerformanceMonitor,
  performanceUtils,
  performanceThresholds,
  getPerformanceRecommendations
} from '../../utils/performance/PerformanceMonitor';

export type { PerformanceMetrics } from '../../utils/performance/PerformanceMonitor';
