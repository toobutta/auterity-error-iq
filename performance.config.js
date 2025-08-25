module.exports = {
  // Performance testing configuration
  thresholds: {
    // Frontend performance thresholds
    "First Contentful Paint": 1800,
    "Largest Contentful Paint": 2500,
    "First Input Delay": 100,
    "Cumulative Layout Shift": 0.1,

    // Bundle size thresholds
    "bundle-size": {
      maxSize: "500kB",
      maxSizeGzip: "150kB",
    },

    // API performance thresholds
    "api-response-time": 500, // ms
    "workflow-execution-time": 5000, // ms
  },

  // Lighthouse configuration
  lighthouse: {
    options: {
      logLevel: "info",
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    },
    config: {
      extends: "lighthouse:default",
      settings: {
        formFactor: "desktop",
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
  },

  // Load testing configuration
  artillery: {
    config: {
      target: "http://localhost:3000",
      phases: [
        { duration: 60, arrivalRate: 5 }, // Ramp up
        { duration: 120, arrivalRate: 5 }, // Sustained load
        { duration: 60, arrivalRate: 10 }, // Stress test
      ],
    },
    scenarios: [
      {
        name: "Dashboard Load",
        requests: [
          { get: { url: "/dashboard" } },
          { get: { url: "/api/dashboard/metrics" } },
        ],
      },
      {
        name: "Workflow Operations",
        requests: [
          { get: { url: "/api/workflows" } },
          {
            post: {
              url: "/api/workflows",
              json: { name: "test", description: "test" },
            },
          },
        ],
      },
    ],
  },

  // Monitoring configuration
  monitoring: {
    metrics: [
      "response_time",
      "error_rate",
      "throughput",
      "memory_usage",
      "cpu_usage",
    ],
    alerts: {
      response_time_threshold: 2000, // ms
      error_rate_threshold: 0.05, // 5%
      memory_threshold: 80, // %
      cpu_threshold: 70, // %
    },
  },
};
