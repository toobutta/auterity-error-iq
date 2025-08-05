/**
 * RelayCore Integration
 * 
 * This module provides integration points between the Cost-Aware Model Switching
 * component and RelayCore.
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('relaycore-integration');

// Configuration
const RELAYCORE_API_URL = process.env.RELAYCORE_API_URL || 'http://relaycore:3000';

/**
 * Register the Cost-Aware Model Switching extension with RelayCore
 */
export async function registerWithRelayCore(): Promise<boolean> {
  try {
    logger.info('Registering Cost-Aware Model Switching with RelayCore');
    
    // Register the extension
    const response = await axios.post(`${RELAYCORE_API_URL}/api/v1/extensions/register`, {
      name: 'cost-aware-model-switching',
      description: 'Cost-aware model selection for RelayCore',
      version: '1.0.0',
      type: 'steering-rule-extension',
      apiUrl: process.env.API_URL || 'http://cost-aware-service:3002',
      capabilities: [
        'model-selection',
        'budget-management',
        'cost-analysis'
      ],
      endpoints: {
        modelSelection: '/api/v1/models/select',
        budgetStatus: '/api/v1/budgets/status',
        costEstimate: '/api/v1/cost-analysis/estimate'
      }
    });
    
    logger.info('Registration successful', response.data);
    return true;
  } catch (error) {
    logger.error('Failed to register with RelayCore:', error);
    return false;
  }
}

/**
 * Get steering rules from RelayCore
 */
export async function getSteeringRules(): Promise<any[]> {
  try {
    logger.info('Getting steering rules from RelayCore');
    
    const response = await axios.get(`${RELAYCORE_API_URL}/api/v1/steering/rules`);
    
    return response.data.rules || [];
  } catch (error) {
    logger.error('Failed to get steering rules from RelayCore:', error);
    return [];
  }
}

/**
 * Create a cost-aware steering rule in RelayCore
 */
export async function createCostAwareSteeringRule(rule: any): Promise<boolean> {
  try {
    logger.info('Creating cost-aware steering rule in RelayCore');
    
    await axios.post(`${RELAYCORE_API_URL}/api/v1/steering/rules`, rule);
    
    logger.info('Rule created successfully');
    return true;
  } catch (error) {
    logger.error('Failed to create cost-aware steering rule in RelayCore:', error);
    return false;
  }
}

/**
 * Create default cost-aware steering rules in RelayCore
 */
export async function createDefaultRules(): Promise<boolean> {
  try {
    logger.info('Creating default cost-aware steering rules in RelayCore');
    
    // Create a rule for cost-aware model selection
    const costAwareRule = {
      id: 'cost-aware-model-selection',
      name: 'Cost-Aware Model Selection',
      description: 'Selects the most cost-effective model based on budget constraints',
      priority: 100,
      enabled: true,
      conditions: [
        {
          field: 'request.path',
          operator: 'regex',
          value: '^/v1/(chat/completions|completions)'
        }
      ],
      operator: 'and',
      actions: [
        {
          type: 'cost-aware-selection',
          params: {
            budgetCheck: true,
            qualityRequirement: 'standard',
            fallbackChain: true
          }
        }
      ],
      continue: true,
      tags: ['cost-aware', 'model-selection']
    };
    
    // Create a rule for budget enforcement
    const budgetEnforcementRule = {
      id: 'budget-enforcement',
      name: 'Budget Enforcement',
      description: 'Enforces budget constraints for AI requests',
      priority: 50,
      enabled: true,
      conditions: [
        {
          field: 'budget.status',
          operator: 'equals',
          value: 'exceeded'
        }
      ],
      operator: 'and',
      actions: [
        {
          type: 'reject',
          params: {
            message: 'Budget exceeded. Please contact your administrator.',
            status: 429
          }
        }
      ],
      continue: false,
      tags: ['cost-aware', 'budget-enforcement']
    };
    
    // Create rules in RelayCore
    await createCostAwareSteeringRule(costAwareRule);
    await createCostAwareSteeringRule(budgetEnforcementRule);
    
    logger.info('Default rules created successfully');
    return true;
  } catch (error) {
    logger.error('Failed to create default rules in RelayCore:', error);
    return false;
  }
}

/**
 * Initialize RelayCore integration
 */
export async function initializeRelayCoreIntegration(): Promise<void> {
  try {
    logger.info('Initializing RelayCore integration');
    
    // Register with RelayCore
    const registered = await registerWithRelayCore();
    
    if (registered) {
      // Create default rules
      await createDefaultRules();
    }
    
    logger.info('RelayCore integration initialized');
  } catch (error) {
    logger.error('Failed to initialize RelayCore integration:', error);
  }
}