import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting global E2E test teardown...");

  // Cleanup test data
  // Note: Add any cleanup logic here if needed

  console.log("✨ Global teardown completed successfully!");
}

export default globalTeardown;
