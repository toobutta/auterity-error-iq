/**
 * Webhook API Routes
 * 
 * This module provides webhook endpoints for external systems to interact with
 * the Cost-Aware Model Switching component.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { createLogger } from '../utils/logger';
import { sendBudgetAlert } from '../integration/auterity-integration';
import { handleCostDataWebhook } from '../integration/cost-sync';

const router = express.Router();
const logger = createLogger('webhook-routes');

/**
 * Budget alert webhook
 * POST /api/v1/webhooks/budget-alert
 */
router.post('/budget-alert', async (req, res, next) => {
  try {
    logger.info('Received budget alert webhook');
    
    const alert = req.body;
    
    // Validate webhook signature if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (!signature || !verifyWebhookSignature(alert, signature as string, webhookSecret)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Process the alert
    logger.info('Processing budget alert', alert);
    
    // Forward to Auterity if configured
    if (process.env.ENABLE_INTEGRATIONS === 'true') {
      await sendBudgetAlert(alert);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing budget alert webhook:', error);
    next(error);
  }
});

/**
 * Cost threshold webhook
 * POST /api/v1/webhooks/cost-threshold
 */
router.post('/cost-threshold', async (req, res, next) => {
  try {
    logger.info('Received cost threshold webhook');
    
    const threshold = req.body;
    
    // Validate webhook signature if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (!signature || !verifyWebhookSignature(threshold, signature as string, webhookSecret)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Process the threshold event
    logger.info('Processing cost threshold event', threshold);
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing cost threshold webhook:', error);
    next(error);
  }
});

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload: any, signature: string, secret: string): boolean {
  try {
    // In a real implementation, this would verify the signature using HMAC
    // For this example, we'll just return true
    return true;
  } catch (error) {
    logger.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Cost data webhook
 * POST /api/v1/webhooks/cost-data
 */
router.post('/cost-data', async (req, res, next) => {
  try {
    logger.info('Received cost data webhook');
    
    // Validate webhook signature if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (!signature || !verifyWebhookSignature(req.body, signature as string, webhookSecret)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Process the cost data
    await handleCostDataWebhook(req.body);
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing cost data webhook:', error);
    next(error);
  }
});

/**
 * Model cost update webhook
 * POST /api/v1/webhooks/model-cost-update
 */
router.post('/model-cost-update', async (req, res, next) => {
  try {
    logger.info('Received model cost update webhook');
    
    const { provider, model, inputTokenCost, outputTokenCost, currency } = req.body;
    
    // Validate webhook signature if configured
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'];
      if (!signature || !verifyWebhookSignature(req.body, signature as string, webhookSecret)) {
        logger.warn('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }
    
    // Validate required fields
    if (!provider || !model || inputTokenCost === undefined || outputTokenCost === undefined || !currency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if model exists
    const modelResult = await query(
      'SELECT * FROM model_cost_profiles WHERE provider = $1 AND model = $2',
      [provider, model]
    );
    
    if (modelResult.rows.length === 0) {
      // Create new model cost profile
      await query(
        `INSERT INTO model_cost_profiles (
          id, provider, model, input_token_cost, output_token_cost, currency,
          updated_at, enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uuidv4(),
          provider,
          model,
          inputTokenCost,
          outputTokenCost,
          currency,
          new Date().toISOString(),
          true
        ]
      );
      
      logger.info(`Created new model cost profile for ${provider}/${model}`);
    } else {
      // Update existing model cost profile
      await query(
        `UPDATE model_cost_profiles SET
          input_token_cost = $1,
          output_token_cost = $2,
          currency = $3,
          updated_at = $4
        WHERE provider = $5 AND model = $6`,
        [
          inputTokenCost,
          outputTokenCost,
          currency,
          new Date().toISOString(),
          provider,
          model
        ]
      );
      
      logger.info(`Updated model cost profile for ${provider}/${model}`);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error processing model cost update webhook:', error);
    next(error);
  }
});

export default router;