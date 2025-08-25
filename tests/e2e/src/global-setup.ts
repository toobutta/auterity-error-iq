import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global E2E test setup...");

  // Create test data directory
  if (!fs.existsSync("test-data")) {
    fs.mkdirSync("test-data", { recursive: true });
  }

  // Setup test database state
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("⚡ Performing health checks on all services...");

    // Health check AutoMatrix Backend
    await page.goto("http://localhost:8000/health", {
      waitUntil: "networkidle",
    });
    console.log("✅ AutoMatrix Backend is healthy");

    // Health check RelayCore
    await page.goto("http://localhost:3001/health", {
      waitUntil: "networkidle",
    });
    console.log("✅ RelayCore is healthy");

    // Health check NeuroWeaver Backend
    await page.goto("http://localhost:8001/health", {
      waitUntil: "networkidle",
    });
    console.log("✅ NeuroWeaver Backend is healthy");

    console.log("🎉 Global setup completed successfully!");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
