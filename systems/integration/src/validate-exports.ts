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

try {
  // Test that we can create services with default config
  const services: CoreServices = createCoreServices(DEFAULT_CONFIG);

  // Test that we can create integrations
  const integrations: SystemIntegrations = createSystemIntegrations(services);

  // Test that we can configure the app
  const app = configureApp(services, integrations, DEFAULT_CONFIG);

  // Test that all types are properly exported
  const config: ServerConfig = DEFAULT_CONFIG;

} catch (error) {

  process.exit(1);
}

