/**
 * Auterity Integration
 * 
 * This module provides integration points between the Cost-Aware Model Switching
 * component and Auterity.
 */

import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('auterity-integration');

// Configuration
const AUTERITY_API_URL = process.env.AUTERITY_API_URL || 'http://auterity:3001';

/**
 * Register the Cost-Aware Model Switching component with Auterity
 */
export async function registerWithAuterity(): Promise<boolean> {
  try {
    logger.info('Registering Cost-Aware Model Switching with Auterity');
    
    // Register the component
    const response = await axios.post(`${AUTERITY_API_URL}/api/v1/integrations/register`, {
      name: 'cost-aware-model-switching',
      description: 'Cost-aware model selection for AI requests',
      version: '1.0.0',
      type: 'cost-management',
      apiUrl: process.env.API_URL || 'http://cost-aware-service:3002',
      capabilities: [
        'budget-management',
        'cost-analysis',
        'model-selection'
      ],
      endpoints: {
        budgetStatus: '/api/v1/budgets/status',
        costAnalysis: '/api/v1/cost-analysis/summary',
        modelSelection: '/api/v1/models/select'
      },
      webhooks: {
        budgetAlert: '/api/v1/webhooks/budget-alert',
        costThreshold: '/api/v1/webhooks/cost-threshold'
      }
    });
    
    logger.info('Registration successful', response.data);
    return true;
  } catch (error) {
    logger.error('Failed to register with Auterity:', error);
    return false;
  }
}

/**
 * Send budget alert to Auterity
 */
export async function sendBudgetAlert(alert: any): Promise<boolean> {
  try {
    logger.info('Sending budget alert to Auterity');
    
    await axios.post(`${AUTERITY_API_URL}/api/v1/notifications/budget-alert`, alert);
    
    logger.info('Budget alert sent successfully');
    return true;
  } catch (error) {
    logger.error('Failed to send budget alert to Auterity:', error);
    return false;
  }
}

/**
 * Send cost metrics to Auterity
 */
export async function sendCostMetrics(metrics: any): Promise<boolean> {
  try {
    logger.info('Sending cost metrics to Auterity');
    
    await axios.post(`${AUTERITY_API_URL}/api/v1/metrics/cost`, metrics);
    
    logger.info('Cost metrics sent successfully');
    return true;
  } catch (error) {
    logger.error('Failed to send cost metrics to Auterity:', error);
    return false;
  }
}

/**
 * Get agent configuration from Auterity
 */
export async function getAgentConfiguration(agentId: string): Promise<any> {
  try {
    logger.info(`Getting agent configuration from Auterity for agent ${agentId}`);
    
    const response = await axios.get(`${AUTERITY_API_URL}/api/v1/agents/${agentId}/config`);
    
    return response.data;
  } catch (error) {
    logger.error(`Failed to get agent configuration from Auterity for agent ${agentId}:`, error);
    return null;
  }
}

/**
 * Register cost-aware webhook handlers with Auterity
 */
export async function registerWebhookHandlers(): Promise<boolean> {
  try {
    logger.info('Registering webhook handlers with Auterity');
    
    // Register budget alert handler
    await axios.post(`${AUTERITY_API_URL}/api/v1/webhooks/register`, {
      name: 'budget-alert-handler',
      description: 'Handles budget alerts from Cost-Aware Model Switching',
      eventType: 'budget-alert',
      url: `${process.env.API_URL || 'http://cost-aware-service:3002'}/api/v1/webhooks/budget-alert`,
      secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret'
    });
    
    // Register cost threshold handler
    await axios.post(`${AUTERITY_API_URL}/api/v1/webhooks/register`, {
      name: 'cost-threshold-handler',
      description: 'Handles cost threshold events from Cost-Aware Model Switching',
      eventType: 'cost-threshold',
      url: `${process.env.API_URL || 'http://cost-aware-service:3002'}/api/v1/webhooks/cost-threshold`,
      secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret'
    });
    
    logger.info('Webhook handlers registered successfully');
    return true;
  } catch (error) {
    logger.error('Failed to register webhook handlers with Auterity:', error);
    return false;
  }
}

/**
 * Initialize Auterity integration
 */
export async function initializeAuterityIntegration(): Promise<void> {
  try {
    logger.info('Initializing Auterity integration');
    
    // Register with Auterity
    const registered = await registerWithAuterity();
    
    if (registered) {
      // Register webhook handlers
      await registerWebhookHandlers();
      
      // Send initial cost metrics
      await sendCostMetrics({
        timestamp: new Date().toISOString(),
        totalCost: 0,
        models: {},
        providers: {}
      });
    }
    
    logger.info('Auterity integration initialized');
  } catch (error) {
    logger.error('Failed to initialize Auterity integration:', error);
  }
}