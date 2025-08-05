/**
 * Integration Module
 * 
 * This module initializes integrations with RelayCore and Auterity.
 */

import { createLogger } from '../utils/logger';
import { initializeRelayCoreIntegration } from './relaycore-integration';
import { initializeAuterityIntegration } from './auterity-integration';

const logger = createLogger('integration');

/**
 * Initialize all integrations
 */
export async function initializeIntegrations(): Promise<void> {
  try {
    logger.info('Initializing integrations');
    
    // Initialize RelayCore integration
    await initializeRelayCoreIntegration();
    
    // Initialize Auterity integration
    await initializeAuterityIntegration();
    
    logger.info('All integrations initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize integrations:', error);
  }
}

// Export individual integration modules
export * from './relaycore-integration';
export * from './auterity-integration';