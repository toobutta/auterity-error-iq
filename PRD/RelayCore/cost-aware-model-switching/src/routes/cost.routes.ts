/**
 * Cost Analysis API Routes
 */

import express from 'express';
import { query } from '../database';
import { createLogger } from '../utils/logger';

const router = express.Router();
const logger = createLogger('cost-routes');

/**
 * Get cost summary
 * GET /api/v1/cost-analysis/summary
 */
router.get('/summary', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const organizationId = req.query.organizationId as string;
    const teamId = req.query.teamId as string;
    const userId = req.query.userId as string;
    
    // Build query
    let sql = `
      SELECT 
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        COUNT(DISTINCT model) as model_count,
        MIN(timestamp) as first_request,
        MAX(timestamp) as last_request
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;
    
    // Add filters
    if (organizationId) {
      sql += ` AND organization_id = $${paramIndex++}`;
      params.push(organizationId);
    }
    
    if (teamId) {
      sql += ` AND team_id = $${paramIndex++}`;
      params.push(teamId);
    }
    
    if (userId) {
      sql += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    
    // Execute query
    const result = await query(sql, params);
    
    // Get cost by model
    const modelSql = `
      SELECT 
        model,
        provider,
        SUM(cost) as cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
      ${organizationId ? ' AND organization_id = $' + (params.indexOf(organizationId) + 1) : ''}
      ${teamId ? ' AND team_id = $' + (params.indexOf(teamId) + 1) : ''}
      ${userId ? ' AND user_id = $' + (params.indexOf(userId) + 1) : ''}
      GROUP BY model, provider
      ORDER BY cost DESC
    `;
    
    const modelResult = await query(modelSql, params);
    
    // Calculate average cost per request
    const summary = result.rows[0];
    const totalCost = parseFloat(summary.total_cost || '0');
    const requestCount = parseInt(summary.request_count || '0');
    const averageCost = requestCount > 0 ? totalCost / requestCount : 0;
    
    // Return summary
    return res.status(200).json({
      totalCost,
      requestCount,
      averageCost,
      totalInputTokens: parseInt(summary.total_input_tokens || '0'),
      totalOutputTokens: parseInt(summary.total_output_tokens || '0'),
      modelCount: parseInt(summary.model_count || '0'),
      firstRequest: summary.first_request,
      lastRequest: summary.last_request,
      timeRange: {
        startDate,
        endDate
      },
      models: modelResult.rows.map(model => ({
        model: model.model,
        provider: model.provider,
        cost: parseFloat(model.cost),
        requestCount: parseInt(model.request_count),
        inputTokens: parseInt(model.input_tokens),
        outputTokens: parseInt(model.output_tokens),
        percentage: totalCost > 0 ? (parseFloat(model.cost) / totalCost) * 100 : 0
      }))
    });
  } catch (error) {
    logger.error('Error getting cost summary:', error);
    next(error);
  }
});

/**
 * Get costs grouped by model
 * GET /api/v1/cost-analysis/by-model
 */
router.get('/by-model', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const organizationId = req.query.organizationId as string;
    const teamId = req.query.teamId as string;
    
    // Build query
    let sql = `
      SELECT 
        model,
        provider,
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        COUNT(DISTINCT user_id) as user_count
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;
    
    // Add filters
    if (organizationId) {
      sql += ` AND organization_id = $${paramIndex++}`;
      params.push(organizationId);
    }
    
    if (teamId) {
      sql += ` AND team_id = $${paramIndex++}`;
      params.push(teamId);
    }
    
    // Group by model and provider
    sql += ' GROUP BY model, provider ORDER BY total_cost DESC';
    
    // Execute query
    const result = await query(sql, params);
    
    // Calculate total cost
    const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);
    
    // Map results to response format
    const models = result.rows.map(row => ({
      model: row.model,
      provider: row.provider,
      cost: parseFloat(row.total_cost),
      requestCount: parseInt(row.request_count),
      inputTokens: parseInt(row.total_input_tokens),
      outputTokens: parseInt(row.total_output_tokens),
      userCount: parseInt(row.user_count),
      percentage: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0
    }));
    
    // Return results
    return res.status(200).json({
      timeRange: {
        startDate,
        endDate
      },
      totalCost,
      models
    });
  } catch (error) {
    logger.error('Error getting costs by model:', error);
    next(error);
  }
});

/**
 * Get costs grouped by provider
 * GET /api/v1/cost-analysis/by-provider
 */
router.get('/by-provider', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const organizationId = req.query.organizationId as string;
    const teamId = req.query.teamId as string;
    
    // Build query
    let sql = `
      SELECT 
        provider,
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        COUNT(DISTINCT model) as model_count
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;
    
    // Add filters
    if (organizationId) {
      sql += ` AND organization_id = $${paramIndex++}`;
      params.push(organizationId);
    }
    
    if (teamId) {
      sql += ` AND team_id = $${paramIndex++}`;
      params.push(teamId);
    }
    
    // Group by provider
    sql += ' GROUP BY provider ORDER BY total_cost DESC';
    
    // Execute query
    const result = await query(sql, params);
    
    // Calculate total cost
    const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);
    
    // Map results to response format
    const providers = result.rows.map(row => ({
      provider: row.provider,
      cost: parseFloat(row.total_cost),
      requestCount: parseInt(row.request_count),
      inputTokens: parseInt(row.total_input_tokens),
      outputTokens: parseInt(row.total_output_tokens),
      modelCount: parseInt(row.model_count),
      percentage: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0
    }));
    
    // Return results
    return res.status(200).json({
      timeRange: {
        startDate,
        endDate
      },
      totalCost,
      providers
    });
  } catch (error) {
    logger.error('Error getting costs by provider:', error);
    next(error);
  }
});

/**
 * Get costs grouped by user
 * GET /api/v1/cost-analysis/by-user
 */
router.get('/by-user', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const organizationId = req.query.organizationId as string;
    const teamId = req.query.teamId as string;
    const limit = parseInt(req.query.limit as string || '10');
    
    // Build query
    let sql = `
      SELECT 
        user_id,
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        COUNT(DISTINCT model) as model_count
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
      AND user_id IS NOT NULL
    `;
    
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;
    
    // Add filters
    if (organizationId) {
      sql += ` AND organization_id = $${paramIndex++}`;
      params.push(organizationId);
    }
    
    if (teamId) {
      sql += ` AND team_id = $${paramIndex++}`;
      params.push(teamId);
    }
    
    // Group by user
    sql += ' GROUP BY user_id ORDER BY total_cost DESC';
    
    // Add limit
    sql += ` LIMIT $${paramIndex++}`;
    params.push(limit);
    
    // Execute query
    const result = await query(sql, params);
    
    // Calculate total cost
    const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);
    
    // Map results to response format
    const users = result.rows.map(row => ({
      userId: row.user_id,
      cost: parseFloat(row.total_cost),
      requestCount: parseInt(row.request_count),
      inputTokens: parseInt(row.total_input_tokens),
      outputTokens: parseInt(row.total_output_tokens),
      modelCount: parseInt(row.model_count),
      percentage: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0
    }));
    
    // Return results
    return res.status(200).json({
      timeRange: {
        startDate,
        endDate
      },
      totalCost,
      users
    });
  } catch (error) {
    logger.error('Error getting costs by user:', error);
    next(error);
  }
});

/**
 * Get costs grouped by organization
 * GET /api/v1/cost-analysis/by-organization
 */
router.get('/by-organization', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const limit = parseInt(req.query.limit as string || '10');
    
    // Build query
    let sql = `
      SELECT 
        organization_id,
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        COUNT(DISTINCT user_id) as user_count,
        COUNT(DISTINCT model) as model_count
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
      AND organization_id IS NOT NULL
      GROUP BY organization_id
      ORDER BY total_cost DESC
      LIMIT $3
    `;
    
    // Execute query
    const result = await query(sql, [startDate, endDate, limit]);
    
    // Calculate total cost
    const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.total_cost), 0);
    
    // Map results to response format
    const organizations = result.rows.map(row => ({
      organizationId: row.organization_id,
      cost: parseFloat(row.total_cost),
      requestCount: parseInt(row.request_count),
      inputTokens: parseInt(row.total_input_tokens),
      outputTokens: parseInt(row.total_output_tokens),
      userCount: parseInt(row.user_count),
      modelCount: parseInt(row.model_count),
      percentage: totalCost > 0 ? (parseFloat(row.total_cost) / totalCost) * 100 : 0
    }));
    
    // Return results
    return res.status(200).json({
      timeRange: {
        startDate,
        endDate
      },
      totalCost,
      organizations
    });
  } catch (error) {
    logger.error('Error getting costs by organization:', error);
    next(error);
  }
});

/**
 * Get cost trends over time
 * GET /api/v1/cost-analysis/trends
 */
router.get('/trends', async (req, res, next) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate as string || getDefaultStartDate();
    const endDate = req.query.endDate as string || new Date().toISOString();
    const organizationId = req.query.organizationId as string;
    const teamId = req.query.teamId as string;
    const groupBy = req.query.groupBy as string || 'day';
    
    // Validate groupBy
    if (!['hour', 'day', 'week', 'month'].includes(groupBy)) {
      return res.status(400).json({ error: 'Invalid groupBy parameter. Must be one of: hour, day, week, month' });
    }
    
    // Build query
    let timeFormat: string;
    switch (groupBy) {
      case 'hour':
        timeFormat = 'YYYY-MM-DD HH24:00:00';
        break;
      case 'day':
        timeFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        timeFormat = 'YYYY-WW';
        break;
      case 'month':
        timeFormat = 'YYYY-MM';
        break;
      default:
        timeFormat = 'YYYY-MM-DD';
    }
    
    let sql = `
      SELECT 
        TO_CHAR(timestamp, '${timeFormat}') as time_period,
        SUM(cost) as total_cost,
        COUNT(DISTINCT request_id) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens
      FROM cost_tracking
      WHERE timestamp BETWEEN $1 AND $2
    `;
    
    const params: any[] = [startDate, endDate];
    let paramIndex = 3;
    
    // Add filters
    if (organizationId) {
      sql += ` AND organization_id = $${paramIndex++}`;
      params.push(organizationId);
    }
    
    if (teamId) {
      sql += ` AND team_id = $${paramIndex++}`;
      params.push(teamId);
    }
    
    // Group by time period
    sql += ` GROUP BY time_period ORDER BY time_period`;
    
    // Execute query
    const result = await query(sql, params);
    
    // Map results to response format
    const trends = result.rows.map(row => ({
      timePeriod: row.time_period,
      cost: parseFloat(row.total_cost),
      requestCount: parseInt(row.request_count),
      inputTokens: parseInt(row.total_input_tokens),
      outputTokens: parseInt(row.total_output_tokens)
    }));
    
    // Return results
    return res.status(200).json({
      timeRange: {
        startDate,
        endDate
      },
      groupBy,
      trends
    });
  } catch (error) {
    logger.error('Error getting cost trends:', error);
    next(error);
  }
});

/**
 * Estimate cost for a request
 * GET /api/v1/cost-analysis/estimate
 */
router.get('/estimate', async (req, res, next) => {
  try {
    // Get query parameters
    const model = req.query.model as string;
    const inputTokens = parseInt(req.query.inputTokens as string || '0');
    const outputTokens = parseInt(req.query.outputTokens as string || '0');
    
    // Validate parameters
    if (!model) {
      return res.status(400).json({ error: 'Model parameter is required' });
    }
    
    if (inputTokens <= 0 && outputTokens <= 0) {
      return res.status(400).json({ error: 'Either inputTokens or outputTokens must be greater than 0' });
    }
    
    // Get model cost profile
    const modelResult = await query(
      'SELECT * FROM model_cost_profiles WHERE model = $1 AND enabled = true',
      [model]
    );
    
    if (modelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found or not enabled' });
    }
    
    const modelProfile = modelResult.rows[0];
    
    // Calculate cost
    const inputCost = inputTokens * parseFloat(modelProfile.input_token_cost);
    const outputCost = outputTokens * parseFloat(modelProfile.output_token_cost);
    const totalCost = inputCost + outputCost;
    
    // Return estimate
    return res.status(200).json({
      model: modelProfile.model,
      provider: modelProfile.provider,
      inputTokens,
      outputTokens,
      cost: {
        inputCost,
        outputCost,
        totalCost,
        currency: modelProfile.currency
      },
      rates: {
        inputTokenRate: parseFloat(modelProfile.input_token_cost),
        outputTokenRate: parseFloat(modelProfile.output_token_cost)
      }
    });
  } catch (error) {
    logger.error('Error estimating cost:', error);
    next(error);
  }
});

/**
 * Helper function to get default start date (30 days ago)
 */
function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

export default router;