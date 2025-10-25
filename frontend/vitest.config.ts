/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts", "./src/setupTests.ts"],
    // Fix module resolution issues
    deps: {
      inline: [
        "pretty-format",
        "@testing-library/jest-dom",
        "@testing-library/react",
        "@testing-library/user-event",
      ],
    },
    // Memory optimization
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/__tests__/**",
      ],
    },
    // Increase timeout for slow tests
    testTimeout: 10000,
    // Optimize memory usage
    logHeapUsage: true,
  },
});


