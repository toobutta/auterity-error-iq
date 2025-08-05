/**
 * Model Selection Explainer API Routes
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { createLogger } from '../utils/logger';
import { 
  generateExplanation, 
  getExplanationById, 
  getExplanationsByRequestId 
} from '../utils/model-selection-explainer';

const router = express.Router();
const logger = createLogger('explainer-routes');

/**
 * Get explanation by ID
 * GET /api/v1/explainer/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    
    // Get explanation
    const explanation = await getExplanationById(id);
    
    if (!explanation) {
      return res.status(404).json({ error: 'Explanation not found' });
    }
    
    // Return explanation
    return res.status(200).json(explanation);
  } catch (error) {
    logger.error('Error getting explanation:', error);
    next(error);
  }
});

/**
 * Get explanations by request ID
 * GET /api/v1/explainer/request/:requestId
 */
router.get('/request/:requestId', async (req, res, next) => {
  try {
    const requestId = req.params.requestId;
    
    // Get explanations
    const explanations = await getExplanationsByRequestId(requestId);
    
    // Return explanations
    return res.status(200).json({ explanations });
  } catch (error) {
    logger.error('Error getting explanations by request ID:', error);
    next(error);
  }
});

/**
 * Generate explanation for a selection
 * POST /api/v1/explainer/generate
 */
router.post('/generate', async (req, res, next) => {
  try {
    const {
      requestId,
      selectedModel,
      originalModel,
      alternatives,
      budgetStatus,
      budgetPriority,
      qualityRequirement,
      modelOptions
    } = req.body;
    
    // Validate required fields
    if (!requestId || !selectedModel || !modelOptions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate explanation
    const explanation = await generateExplanation(
      requestId,
      selectedModel,
      originalModel,
      alternatives || [],
      budgetStatus,
      budgetPriority || 'balanced',
      qualityRequirement || 'standard',
      modelOptions
    );
    
    // Return explanation
    return res.status(200).json(explanation);
  } catch (error) {
    logger.error('Error generating explanation:', error);
    next(error);
  }
});

/**
 * Get recent explanations
 * GET /api/v1/explainer/recent
 */
router.get('/recent', async (req, res, next) => {
  try {
    // Get limit from query params (default to 10)
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent explanations
    const result = await query(
      `SELECT * FROM model_selection_explanations
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );
    
    const explanations = result.rows.map(row => ({
      id: row.id,
      requestId: row.request_id,
      timestamp: row.timestamp,
      selectedModel: row.selected_model,
      originalModel: row.original_model,
      budgetStatus: row.budget_status,
      reasoning: row.reasoning
    }));
    
    // Return explanations
    return res.status(200).json({ explanations });
  } catch (error) {
    logger.error('Error getting recent explanations:', error);
    next(error);
  }
});

/**
 * Get explanation statistics
 * GET /api/v1/explainer/stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM model_selection_explanations'
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Get model distribution
    const modelResult = await query(
      `SELECT selected_model, COUNT(*) as count
       FROM model_selection_explanations
       GROUP BY selected_model
       ORDER BY count DESC`
    );
    
    const modelDistribution = modelResult.rows;
    
    // Get budget status distribution
    const budgetResult = await query(
      `SELECT budget_status, COUNT(*) as count
       FROM model_selection_explanations
       GROUP BY budget_status
       ORDER BY count DESC`
    );
    
    const budgetDistribution = budgetResult.rows;
    
    // Get model change statistics
    const changeResult = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN original_model IS NOT NULL AND original_model != selected_model THEN 1 END) as changed,
         COUNT(CASE WHEN original_model IS NOT NULL AND original_model = selected_model THEN 1 END) as unchanged
       FROM model_selection_explanations`
    );
    
    const changeStats = changeResult.rows[0];
    
    // Return statistics
    return res.status(200).json({
      total,
      modelDistribution,
      budgetDistribution,
      changeStats: {
        total: parseInt(changeStats.total),
        changed: parseInt(changeStats.changed) || 0,
        unchanged: parseInt(changeStats.unchanged) || 0,
        changeRate: changeStats.total > 0 ? (parseInt(changeStats.changed) / parseInt(changeStats.total)) * 100 : 0
      }
    });
  } catch (error) {
    logger.error('Error getting explanation statistics:', error);
    next(error);
  }
});

export default router;