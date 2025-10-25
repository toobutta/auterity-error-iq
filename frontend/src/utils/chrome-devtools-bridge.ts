/**
 * Chrome DevTools Integration Bridge
 * Provides seamless integration between Auterity applications and Chrome DevTools
 */

import { initWebVitals, WebVitalsMetric } from './web-vitals';
import { NetworkMonitor } from './network-monitor';
import { MemoryProfiler } from './memory-profiler';
import { ConsoleEnhancer } from './console-enhancer';
import { AccessibilityAuditor } from './accessibility-auditor';
import { SecurityScanner } from './security-scanner';

export interface DevToolsConfig {
  enablePerformanceMonitoring: boolean;
  enableNetworkAnalysis: boolean;
  enableMemoryProfiling: boolean;
  enableConsoleEnhancement: boolean;
  enableAccessibilityAuditing: boolean;
  enableSecurityScanning: boolean;
  environment: 'development' | 'staging' | 'production';
  performanceThresholds: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
  };
}

export interface DevToolsMetrics {
  webVitals: {
    lcp?: number;
    fid?: number;
    cls?: number;
    fcp?: number;
    ttfb?: number;
  };
  performance: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
    networkRequests: number;
  };
  accessibility: {
    score: number;
    violations: number;
    issues: string[];
  };
  security: {
    score: number;
    vulnerabilities: number;
    issues: string[];
  };
}

export interface DevToolsAPI {
  init: () => Promise<void>;
  getMetrics: () => DevToolsMetrics;
  getConfig: () => DevToolsConfig;
  startPerformanceRecording: () => void;
  stopPerformanceRecording: () => void;
  takeHeapSnapshot: () => unknown;
  checkMemoryLeaks: () => unknown;
  getNetworkMetrics: () => unknown;
  runAccessibilityAudit: () => unknown;
  runSecurityScan: () => unknown;
  clearLogs: () => void;
  exportMetrics: () => string;
}

class ChromeDevToolsBridge {
  private config: DevToolsConfig;
  private isInitialized = false;
  private metrics: DevToolsMetrics;
  private monitors: {
    network?: NetworkMonitor;
    memory?: MemoryProfiler;
    console?: ConsoleEnhancer;
    accessibility?: AccessibilityAuditor;
    security?: SecurityScanner;
  } = {};

  constructor(config: Partial<DevToolsConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableNetworkAnalysis: true,
      enableMemoryProfiling: true,
      enableConsoleEnhancement: true,
      enableAccessibilityAuditing: true,
      enableSecurityScanning: true,
      environment: 'development',
      performanceThresholds: {
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 600,
      },
      ...config,
    };

    this.metrics = {
      webVitals: {},
      performance: {
        fps: 0,
        memoryUsage: 0,
        renderTime: 0,
        networkRequests: 0,
      },
      accessibility: {
        score: 0,
        violations: 0,
        issues: [],
      },
      security: {
        score: 0,
        vulnerabilities: 0,
        issues: [],
      },
    };
  }

  /**
   * Initialize Chrome DevTools integration
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // Only initialize in development/staging environments
    if (this.config.environment === 'production') {

      return;
    }

    try {
      // Initialize Web Vitals monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.initWebVitals();
      }

      // Initialize network monitoring
      if (this.config.enableNetworkAnalysis) {
        this.monitors.network = new NetworkMonitor();
        this.monitors.network.init();
      }

      // Initialize memory profiling
      if (this.config.enableMemoryProfiling) {
        this.monitors.memory = new MemoryProfiler();
        this.monitors.memory.init();
      }

      // Initialize console enhancement
      if (this.config.enableConsoleEnhancement) {
        this.monitors.console = new ConsoleEnhancer();
        this.monitors.console.init();
      }

      // Initialize accessibility auditing
      if (this.config.enableAccessibilityAuditing) {
        this.monitors.accessibility = new AccessibilityAuditor();
        this.monitors.accessibility.init();
      }

      // Initialize security scanning
      if (this.config.enableSecurityScanning) {
        this.monitors.security = new SecurityScanner();
        this.monitors.security.init();
      }

      // Set up global DevTools API
      this.setupGlobalAPI();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;

    } catch (error) {

    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private async initWebVitals(): Promise<void> {
    try {
      initWebVitals((metric: WebVitalsMetric) => {
        this.metrics.webVitals[metric.name.toLowerCase() as keyof typeof this.metrics.webVitals] = metric.value;

        // Log to console for DevTools visibility

        // Check thresholds and alert if needed
        this.checkPerformanceThresholds(metric);
      });
    } catch (error) {

    }
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  private checkPerformanceThresholds(metric: WebVitalsMetric): void {
    const thresholds = this.config.performanceThresholds;
    const metricName = metric.name.toLowerCase();
    const value = metric.value;
    const threshold = thresholds[metricName as keyof typeof thresholds];

    if (threshold && value > threshold) {

    }
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor FPS and memory usage
    let lastTime = performance.now();
    let frameCount = 0;

    const monitorPerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.performance.fps = fps;

        // Get memory usage if available
        const perfMemory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        if (perfMemory) {
          this.metrics.performance.memoryUsage = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
        }

        // Log performance metrics

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(monitorPerformance);
    };

    requestAnimationFrame(monitorPerformance);
  }

  /**
   * Set up global DevTools API for browser console access
   */
  private setupGlobalAPI(): void {
    (window as Window & { devtools?: DevToolsAPI }).devtools = {
      // Core methods
      init: () => this.init(),
      getMetrics: () => this.getMetrics(),
      getConfig: () => this.config,

      // Performance methods
      startPerformanceRecording: () => {
        if (window.performance && window.performance.mark) {
          window.performance.mark('devtools-recording-start');

        }
      },
      stopPerformanceRecording: () => {
        if (window.performance && window.performance.mark) {
          window.performance.mark('devtools-recording-end');
          window.performance.measure('devtools-session', 'devtools-recording-start', 'devtools-recording-end');

        }
      },

      // Memory methods
      takeHeapSnapshot: () => {
        if (this.monitors.memory) {
          return this.monitors.memory.createHeapSnapshot();
        }
      },
      checkMemoryLeaks: () => {
        if (this.monitors.memory) {
          return this.monitors.memory.analyzeMemoryLeaks();
        }
      },

      // Network methods
      getNetworkMetrics: () => {
        if (this.monitors.network) {
          return this.monitors.network.getMetrics();
        }
      },

      // Accessibility methods
      runAccessibilityAudit: () => {
        if (this.monitors.accessibility) {
          return this.monitors.accessibility.runAudit();
        }
      },

      // Security methods
      runSecurityScan: () => {
        if (this.monitors.security) {
          return this.monitors.security.runScan();
        }
      },

      // Utility methods
      clearLogs: () => console.clear(),
      exportMetrics: () => this.exportMetrics(),
    };

  }

  /**
   * Get current metrics
   */
  public getMetrics(): DevToolsMetrics {
    // Update security metrics from scanner
    if (this.monitors.security) {
      const securityMetrics = this.monitors.security.getMetrics();
      this.metrics.security.score = securityMetrics.score;
      this.metrics.security.vulnerabilities = securityMetrics.criticalIssues + securityMetrics.highIssues;
      this.metrics.security.issues = this.monitors.security.getReport()?.issues.map((issue: { title: string }) => issue.title) || [];
    }

    // Update accessibility metrics from auditor
    if (this.monitors.accessibility) {
      const accessibilityMetrics = this.monitors.accessibility.getMetrics();
      this.metrics.accessibility.score = accessibilityMetrics.score;
      this.metrics.accessibility.violations = accessibilityMetrics.violations;
      this.metrics.accessibility.issues = [
        ...Array(accessibilityMetrics.criticalIssues).fill('Critical accessibility issue'),
        ...Array(accessibilityMetrics.seriousIssues).fill('Serious accessibility issue'),
        ...Array(accessibilityMetrics.moderateIssues).fill('Moderate accessibility issue'),
        ...Array(accessibilityMetrics.minorIssues).fill('Minor accessibility issue'),
      ];
    }

    return { ...this.metrics };
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clean up DevTools integration
   */
  public destroy(): void {
    if (!this.isInitialized) return;

    // Clean up monitors
    Object.values(this.monitors).forEach(monitor => {
      if (monitor && typeof monitor.destroy === 'function') {
        monitor.destroy();
      }
    });

    // Remove global API
    const windowWithDevTools = window as Window & { devtools?: DevToolsAPI };
    if (windowWithDevTools.devtools) {
      delete windowWithDevTools.devtools;
    }

    this.isInitialized = false;

  }
}

// Global instance
let devToolsInstance: ChromeDevToolsBridge | null = null;

/**
 * Initialize Chrome DevTools integration
 */
export function initChromeDevTools(config?: Partial<DevToolsConfig>): ChromeDevToolsBridge {
  if (!devToolsInstance) {
    devToolsInstance = new ChromeDevToolsBridge(config);
  }
  return devToolsInstance;
}

/**
 * Get current DevTools instance
 */
export function getChromeDevTools(): ChromeDevToolsBridge | null {
  return devToolsInstance;
}

/**
 * Auto-initialize in development environment
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initChromeDevTools().init();
    });
  } else {
    initChromeDevTools().init();
  }
}

export { ChromeDevToolsBridge };
export default ChromeDevToolsBridge;


