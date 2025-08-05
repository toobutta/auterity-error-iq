/**
 * Model Management API Routes
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { createLogger } from '../utils/logger';
import { validateModelCreate, validateModelUpdate } from '../validators/model.validators';

const router = express.Router();
const logger = createLogger('model-routes');

/**
 * Get all model cost profiles
 * GET /api/v1/models
 */
router.get('/', async (req, res, next) => {
  try {
    // Get query parameters
    const provider = req.query.provider as string;
    const enabled = req.query.enabled === 'true';
    
    // Build query
    let sql = 'SELECT * FROM model_cost_profiles';
    const params: any[] = [];
    
    // Add filters
    const filters: string[] = [];
    
    if (provider) {
      filters.push('provider = $1');
      params.push(provider);
    }
    
    if (req.query.enabled !== undefined) {
      filters.push(`enabled = $${params.length + 1}`);
      params.push(enabled);
    }
    
    // Add WHERE clause if filters exist
    if (filters.length > 0) {
      sql += ' WHERE ' + filters.join(' AND ');
    }
    
    // Add ORDER BY
    sql += ' ORDER BY provider, model';
    
    // Execute query
    const result = await query(sql, params);
    
    // Map models to response format
    const models = result.rows.map(mapModelFromDb);
    
    // Return models
    return res.status(200).json({ models });
  } catch (error) {
    logger.error('Error getting models:', error);
    next(error);
  }
});

/**
 * Create a new model cost profile
 * POST /api/v1/models
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateModelCreate(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const modelData = validation.data;
    
    // Generate model ID
    const modelId = uuidv4();
    
    // Insert model into database
    const result = await query(
      `INSERT INTO model_cost_profiles (
        id, provider, model, input_token_cost, output_token_cost, currency,
        average_latency, throughput, capabilities, alternatives, updated_at, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        modelId,
        modelData.provider,
        modelData.model,
        modelData.costPerToken.input,
        modelData.costPerToken.output,
        modelData.costPerToken.currency,
        modelData.averageLatency || null,
        modelData.throughput || null,
        JSON.stringify(modelData.capabilities || {}),
        JSON.stringify(modelData.alternatives || []),
        new Date().toISOString(),
        modelData.enabled !== undefined ? modelData.enabled : true
      ]
    );
    
    // Return created model
    return res.status(201).json(mapModelFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error creating model:', error);
    next(error);
  }
});

/**
 * Get a specific model cost profile
 * GET /api/v1/models/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const modelId = req.params.id;
    
    // Get model from database
    const result = await query(
      'SELECT * FROM model_cost_profiles WHERE id = $1',
      [modelId]
    );
    
    // Check if model exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Return model
    return res.status(200).json(mapModelFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error getting model:', error);
    next(error);
  }
});

/**
 * Update a model cost profile
 * PUT /api/v1/models/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const modelId = req.params.id;
    
    // Validate request body
    const validation = validateModelUpdate(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const modelData = validation.data;
    
    // Check if model exists
    const checkResult = await query(
      'SELECT * FROM model_cost_profiles WHERE id = $1',
      [modelId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Update model in database
    const result = await query(
      `UPDATE model_cost_profiles SET
        provider = COALESCE($1, provider),
        model = COALESCE($2, model),
        input_token_cost = COALESCE($3, input_token_cost),
        output_token_cost = COALESCE($4, output_token_cost),
        currency = COALESCE($5, currency),
        average_latency = COALESCE($6, average_latency),
        throughput = COALESCE($7, throughput),
        capabilities = COALESCE($8, capabilities),
        alternatives = COALESCE($9, alternatives),
        updated_at = $10,
        enabled = COALESCE($11, enabled)
      WHERE id = $12
      RETURNING *`,
      [
        modelData.provider,
        modelData.model,
        modelData.costPerToken?.input,
        modelData.costPerToken?.output,
        modelData.costPerToken?.currency,
        modelData.averageLatency,
        modelData.throughput,
        modelData.capabilities ? JSON.stringify(modelData.capabilities) : null,
        modelData.alternatives ? JSON.stringify(modelData.alternatives) : null,
        new Date().toISOString(),
        modelData.enabled,
        modelId
      ]
    );
    
    // Return updated model
    return res.status(200).json(mapModelFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error updating model:', error);
    next(error);
  }
});

/**
 * Delete a model cost profile
 * DELETE /api/v1/models/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const modelId = req.params.id;
    
    // Check if model exists
    const checkResult = await query(
      'SELECT * FROM model_cost_profiles WHERE id = $1',
      [modelId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    // Delete model from database
    await query(
      'DELETE FROM model_cost_profiles WHERE id = $1',
      [modelId]
    );
    
    // Return success
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting model:', error);
    next(error);
  }
});

/**
 * Get models by provider
 * GET /api/v1/models/provider/:provider
 */
router.get('/provider/:provider', async (req, res, next) => {
  try {
    const provider = req.params.provider;
    
    // Get models from database
    const result = await query(
      'SELECT * FROM model_cost_profiles WHERE provider = $1 AND enabled = true ORDER BY model',
      [provider]
    );
    
    // Map models to response format
    const models = result.rows.map(mapModelFromDb);
    
    // Return models
    return res.status(200).json({ models });
  } catch (error) {
    logger.error('Error getting models by provider:', error);
    next(error);
  }
});

/**
 * Get models by name
 * GET /api/v1/models/name/:name
 */
router.get('/name/:name', async (req, res, next) => {
  try {
    const modelName = req.params.name;
    
    // Get models from database
    const result = await query(
      'SELECT * FROM model_cost_profiles WHERE model = $1 AND enabled = true',
      [modelName]
    );
    
    // Map models to response format
    const models = result.rows.map(mapModelFromDb);
    
    // Return models
    return res.status(200).json({ models });
  } catch (error) {
    logger.error('Error getting models by name:', error);
    next(error);
  }
});

/**
 * Get model capabilities
 * GET /api/v1/models/capabilities
 */
router.get('/capabilities', async (req, res, next) => {
  try {
    // Get models from database
    const result = await query(
      'SELECT id, provider, model, capabilities, average_latency, throughput, enabled FROM model_cost_profiles WHERE enabled = true'
    );
    
    // Map models to response format
    const models = result.rows.map(model => ({
      id: model.id,
      provider: model.provider,
      model: model.model,
      capabilities: JSON.parse(model.capabilities),
      averageLatency: model.average_latency,
      throughput: model.throughput,
      status: model.enabled ? 'active' : 'inactive'
    }));
    
    // Return models
    return res.status(200).json({ models });
  } catch (error) {
    logger.error('Error getting model capabilities:', error);
    next(error);
  }
});

/**
 * Sync model cost profiles from providers
 * POST /api/v1/models/sync
 */
router.post('/sync', async (req, res, next) => {
  try {
    // TODO: Implement synchronization with provider APIs
    // This would fetch the latest model information from OpenAI, Anthropic, etc.
    
    logger.info('Model sync requested - not yet implemented');
    
    // Return success
    return res.status(200).json({
      message: 'Model sync not yet implemented',
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error syncing models:', error);
    next(error);
  }
});

/**
 * Helper function to map database model to API response format
 */
function mapModelFromDb(dbModel: any): any {
  return {
    id: dbModel.id,
    provider: dbModel.provider,
    model: dbModel.model,
    costPerToken: {
      input: parseFloat(dbModel.input_token_cost),
      output: parseFloat(dbModel.output_token_cost),
      currency: dbModel.currency
    },
    averageLatency: dbModel.average_latency,
    throughput: dbModel.throughput,
    capabilities: JSON.parse(dbModel.capabilities),
    alternatives: JSON.parse(dbModel.alternatives),
    updatedAt: dbModel.updated_at,
    enabled: dbModel.enabled
  };
}

export default router;