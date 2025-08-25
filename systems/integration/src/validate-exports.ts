/**
 * Validation script to ensure all exports are working correctly
 */
import {
  createCoreServices,
  createSystemIntegrations,
  configureApp,
  initializeServices,
  setupServer,
  setupGracefulShutdown,
  DEFAULT_CONFIG,
} from "./index";

import type { CoreServices, SystemIntegrations, ServerConfig } from "./index";

// Validate that all functions are exported and callable
console.log("Validating exports...");

try {
  // Test that we can create services with default config
  const services: CoreServices = createCoreServices(DEFAULT_CONFIG);
  console.log("✓ createCoreServices working");

  // Test that we can create integrations
  const integrations: SystemIntegrations = createSystemIntegrations(services);
  console.log("✓ createSystemIntegrations working");

  // Test that we can configure the app
  const app = configureApp(services, integrations, DEFAULT_CONFIG);
  console.log("✓ configureApp working");

  // Test that all types are properly exported
  const config: ServerConfig = DEFAULT_CONFIG;
  console.log("✓ All types exported correctly");

  console.log("✅ All exports validated successfully!");
} catch (error) {
  console.error("❌ Export validation failed:", error);
  process.exit(1);
}
