/**
 * Chrome DevTools Integration Bridge
 * Provides seamless integration between Auterity applications and Chrome DevTools
 */

import { webVitals } from './web-vitals';
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
      console.warn('[DevTools] Chrome DevTools integration disabled in production');
      return;
    }

    console.log('[DevTools] Initializing Chrome DevTools integration...');

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
      console.log('[DevTools] Chrome DevTools integration initialized successfully');

    } catch (error) {
      console.error('[DevTools] Failed to initialize Chrome DevTools integration:', error);
    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private async initWebVitals(): Promise<void> {
    try {
      await webVitals.init((metric) => {
        this.metrics.webVitals[metric.name.toLowerCase() as keyof typeof this.metrics.webVitals] = metric.value;

        // Log to console for DevTools visibility
        console.log(`[WebVitals] ${metric.name}: ${metric.value} (${metric.rating})`);

        // Check thresholds and alert if needed
        this.checkPerformanceThresholds(metric);
      });
    } catch (error) {
      console.error('[DevTools] Failed to initialize Web Vitals:', error);
    }
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  private checkPerformanceThresholds(metric: any): void {
    const thresholds = this.config.performanceThresholds;
    const metricName = metric.name.toLowerCase();
    const value = metric.value;
    const threshold = thresholds[metricName as keyof typeof thresholds];

    if (threshold && value > threshold) {
      console.warn(`[Performance Alert] ${metric.name} exceeded threshold: ${value} > ${threshold}`);

      // Send to performance monitor if available
      if (window.performanceMonitor) {
        window.performanceMonitor.recordThresholdViolation(metric.name, value, threshold);
      }
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
        if ((performance as any).memory) {
          this.metrics.performance.memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }

        // Log performance metrics
        console.log(`[Performance] FPS: ${fps}, Memory: ${this.metrics.performance.memoryUsage}MB`);

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
    (window as any).devtools = {
      // Core methods
      init: () => this.init(),
      getMetrics: () => this.getMetrics(),
      getConfig: () => this.config,

      // Performance methods
      startPerformanceRecording: () => {
        if (window.performance && window.performance.mark) {
          window.performance.mark('devtools-recording-start');
          console.log('[DevTools] Performance recording started');
        }
      },
      stopPerformanceRecording: () => {
        if (window.performance && window.performance.mark) {
          window.performance.mark('devtools-recording-end');
          window.performance.measure('devtools-session', 'devtools-recording-start', 'devtools-recording-end');
          console.log('[DevTools] Performance recording stopped');
        }
      },

      // Memory methods
      takeHeapSnapshot: () => {
        if (this.monitors.memory) {
          return this.monitors.memory.takeSnapshot();
        }
      },
      checkMemoryLeaks: () => {
        if (this.monitors.memory) {
          return this.monitors.memory.detectLeaks();
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

    console.log('[DevTools] Global API available at window.devtools');
  }

  /**
   * Get current metrics
   */
  public getMetrics(): DevToolsMetrics {
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
    if ((window as any).devtools) {
      delete (window as any).devtools;
    }

    this.isInitialized = false;
    console.log('[DevTools] Chrome DevTools integration destroyed');
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
