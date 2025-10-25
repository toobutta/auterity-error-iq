/**
 * Chrome DevTools Configuration
 * Configuration settings for Chrome DevTools integration
 */

export const devToolsConfig = {
  // Performance monitoring
  performance: {
    webVitals: {
      enabled: true,
      thresholds: {
        lcp: 2500, // ms
        fid: 100,  // ms
        cls: 0.1,  // score
        fcp: 1800, // ms
        ttfb: 600, // ms
      },
    },
    memory: {
      enabled: true,
      leakDetection: true,
      snapshotInterval: 30000, // ms
      maxSnapshots: 100,
    },
    network: {
      enabled: true,
      logRequests: true,
      trackWebSocket: true,
    },
  },

  // Console enhancement
  console: {
    enabled: true,
    structuredLogging: true,
    performanceMetrics: true,
    correlationIds: true,
    maxLogs: 1000,
  },

  // Accessibility auditing
  accessibility: {
    enabled: true,
    auditInterval: 300000, // 5 minutes
    axeConfig: {
      rules: {},
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
    },
  },

  // Security scanning
  security: {
    enabled: true,
    scanInterval: 600000, // 10 minutes
    headersCheck: true,
    vulnerabilityScan: true,
    mixedContentDetection: true,
  },

  // Environment settings
  environment: {
    development: {
      enabled: true,
      verboseLogging: true,
      performanceAlerts: true,
    },
    staging: {
      enabled: true,
      verboseLogging: false,
      performanceAlerts: true,
    },
    production: {
      enabled: false,
      verboseLogging: false,
      performanceAlerts: false,
    },
  },

  // Global API
  globalAPI: {
    enabled: true,
    namespace: 'devtools',
    methods: [
      'enablePerformanceMonitoring',
      'disablePerformanceMonitoring',
      'runAccessibilityAudit',
      'runSecurityScan',
      'getMetrics',
      'exportReport',
      'clearLogs',
    ],
  },

  // Reporting
  reporting: {
    consoleOutput: true,
    fileExport: true,
    exportPath: './reports/devtools/',
    formats: ['json', 'html', 'csv'],
  },
};

export type DevToolsConfig = typeof devToolsConfig;
