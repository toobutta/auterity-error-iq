/**
 * Budget Management API Routes
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database';
import { createLogger } from '../utils/logger';
import { validateBudgetCreate, validateBudgetUpdate } from '../validators/budget.validators';

const router = express.Router();
const logger = createLogger('budget-routes');

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const validation = validateBudgetCreate(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const budgetData = validation.data;
    
    // Generate budget ID
    const budgetId = uuidv4();
    
    // Calculate end date based on period if not provided
    let endDate = budgetData.endDate;
    if (!endDate && budgetData.period !== 'custom') {
      const startDate = new Date(budgetData.startDate);
      endDate = calculateEndDate(startDate, budgetData.period);
    }
    
    // Insert budget into database
    const result = await query(
      `INSERT INTO budget_configs (
        id, name, description, scope, scope_id, limit_amount, currency, period,
        start_date, end_date, recurring, warning_threshold, critical_threshold,
        warning_action, critical_action, exhausted_action, allow_overrides,
        override_roles, created_at, updated_at, created_by, enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        budgetId,
        budgetData.name,
        budgetData.description || '',
        budgetData.scopeType,
        budgetData.scopeId,
        budgetData.amount,
        budgetData.currency,
        budgetData.period,
        budgetData.startDate,
        endDate,
        budgetData.recurring || false,
        budgetData.warningThreshold || parseFloat(process.env.DEFAULT_WARNING_THRESHOLD || '70'),
        budgetData.criticalThreshold || parseFloat(process.env.DEFAULT_CRITICAL_THRESHOLD || '90'),
        budgetData.warningAction || process.env.DEFAULT_WARNING_ACTION || 'notify',
        budgetData.criticalAction || process.env.DEFAULT_CRITICAL_ACTION || 'restrict-models',
        budgetData.exhaustedAction || process.env.DEFAULT_EXHAUSTED_ACTION || 'block-all',
        budgetData.allowOverrides || false,
        JSON.stringify(budgetData.overrideRoles || []),
        new Date().toISOString(),
        new Date().toISOString(),
        req.user?.id || 'system',
        true
      ]
    );
    
    // Return created budget
    return res.status(201).json(mapBudgetFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error creating budget:', error);
    next(error);
  }
});

/**
 * Get a specific budget
 * GET /api/v1/budgets/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    
    // Get budget from database
    const result = await query(
      'SELECT * FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    // Check if budget exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Return budget
    return res.status(200).json(mapBudgetFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error getting budget:', error);
    next(error);
  }
});

/**
 * Update a budget
 * PUT /api/v1/budgets/:id
 */
router.put('/:id', async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    
    // Validate request body
    const validation = validateBudgetUpdate(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const budgetData = validation.data;
    
    // Check if budget exists
    const checkResult = await query(
      'SELECT * FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update budget in database
    const result = await query(
      `UPDATE budget_configs SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        limit_amount = COALESCE($3, limit_amount),
        currency = COALESCE($4, currency),
        period = COALESCE($5, period),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        recurring = COALESCE($8, recurring),
        warning_threshold = COALESCE($9, warning_threshold),
        critical_threshold = COALESCE($10, critical_threshold),
        warning_action = COALESCE($11, warning_action),
        critical_action = COALESCE($12, critical_action),
        exhausted_action = COALESCE($13, exhausted_action),
        allow_overrides = COALESCE($14, allow_overrides),
        override_roles = COALESCE($15, override_roles),
        updated_at = $16,
        enabled = COALESCE($17, enabled)
      WHERE id = $18
      RETURNING *`,
      [
        budgetData.name,
        budgetData.description,
        budgetData.amount,
        budgetData.currency,
        budgetData.period,
        budgetData.startDate,
        budgetData.endDate,
        budgetData.recurring,
        budgetData.warningThreshold,
        budgetData.criticalThreshold,
        budgetData.warningAction,
        budgetData.criticalAction,
        budgetData.exhaustedAction,
        budgetData.allowOverrides,
        budgetData.overrideRoles ? JSON.stringify(budgetData.overrideRoles) : null,
        new Date().toISOString(),
        budgetData.enabled,
        budgetId
      ]
    );
    
    // Return updated budget
    return res.status(200).json(mapBudgetFromDb(result.rows[0]));
  } catch (error) {
    logger.error('Error updating budget:', error);
    next(error);
  }
});

/**
 * Delete a budget
 * DELETE /api/v1/budgets/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    
    // Check if budget exists
    const checkResult = await query(
      'SELECT * FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete budget from database
    await query(
      'DELETE FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    // Return success
    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting budget:', error);
    next(error);
  }
});

/**
 * List budgets for a scope
 * GET /api/v1/budgets/scope/:type/:id
 */
router.get('/scope/:type/:id', async (req, res, next) => {
  try {
    const scopeType = req.params.type;
    const scopeId = req.params.id;
    
    // Get budgets from database
    const result = await query(
      'SELECT * FROM budget_configs WHERE scope = $1 AND scope_id = $2 AND enabled = true',
      [scopeType, scopeId]
    );
    
    // Map budgets to response format
    const budgets = result.rows.map(mapBudgetFromDb);
    
    // Return budgets
    return res.status(200).json({ budgets });
  } catch (error) {
    logger.error('Error listing budgets:', error);
    next(error);
  }
});

/**
 * Get budget status
 * GET /api/v1/budgets/:id/status
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    
    // Get budget from database
    const budgetResult = await query(
      'SELECT * FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    // Check if budget exists
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = budgetResult.rows[0];
    
    // Get cost tracking records for this budget
    const trackingResult = await query(
      `SELECT SUM(cost) as total_cost
       FROM cost_tracking
       WHERE budget_id = $1
       AND timestamp BETWEEN $2 AND $3`,
      [budgetId, budget.start_date, budget.end_date || new Date().toISOString()]
    );
    
    // Calculate current amount
    const currentAmount = parseFloat(trackingResult.rows[0]?.total_cost || '0');
    
    // Calculate days remaining in period
    const now = new Date();
    const endDate = budget.end_date ? new Date(budget.end_date) : now;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate burn rate (average daily spend)
    const startDate = new Date(budget.start_date);
    const daysSoFar = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const burnRate = currentAmount / daysSoFar;
    
    // Calculate projected total
    const projectedTotal = currentAmount + (burnRate * daysRemaining);
    
    // Determine status
    let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal';
    const percentUsed = (currentAmount / parseFloat(budget.limit_amount)) * 100;
    
    if (percentUsed >= 100) {
      status = 'exceeded';
    } else if (percentUsed >= parseFloat(budget.critical_threshold)) {
      status = 'critical';
    } else if (percentUsed >= parseFloat(budget.warning_threshold)) {
      status = 'warning';
    }
    
    // Get active alerts
    const alertsResult = await query(
      `SELECT * FROM budget_alerts
       WHERE budget_id = $1
       AND resolved = false
       ORDER BY triggered_at DESC`,
      [budgetId]
    );
    
    const activeAlerts = alertsResult.rows.map(alert => ({
      threshold: parseFloat(alert.threshold),
      triggeredAt: alert.triggered_at,
      actions: alert.actions,
      acknowledged: alert.acknowledged,
      acknowledgedBy: alert.acknowledged_by,
      acknowledgedAt: alert.acknowledged_at
    }));
    
    // Create budget status
    const budgetStatus = {
      budgetId,
      currentAmount,
      limit: parseFloat(budget.limit_amount),
      currency: budget.currency,
      percentUsed,
      remaining: parseFloat(budget.limit_amount) - currentAmount,
      daysRemaining,
      burnRate,
      projectedTotal,
      status,
      activeAlerts,
      lastUpdated: new Date().toISOString()
    };
    
    // Return budget status
    return res.status(200).json(budgetStatus);
  } catch (error) {
    logger.error('Error getting budget status:', error);
    next(error);
  }
});

/**
 * Record usage
 * POST /api/v1/budgets/:id/usage
 */
router.post('/:id/usage', async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const usageData = req.body;
    
    // Check if budget exists
    const budgetResult = await query(
      'SELECT * FROM budget_configs WHERE id = $1',
      [budgetId]
    );
    
    if (budgetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Validate required fields
    if (!usageData.amount || !usageData.currency || !usageData.timestamp || !usageData.source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate usage record ID
    const usageId = uuidv4();
    
    // Insert usage record into database
    const result = await query(
      `INSERT INTO cost_tracking (
        id, budget_id, request_id, user_id, organization_id, team_id, project_id,
        provider, model, input_tokens, output_tokens, cost, currency, timestamp,
        original_model, downgraded, budget_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        usageId,
        budgetId,
        usageData.metadata?.requestId || uuidv4(),
        usageData.metadata?.userId,
        usageData.metadata?.organizationId,
        usageData.metadata?.teamId,
        usageData.metadata?.projectId,
        usageData.metadata?.provider || 'unknown',
        usageData.metadata?.modelId || 'unknown',
        usageData.metadata?.inputTokens || 0,
        usageData.metadata?.outputTokens || 0,
        usageData.amount,
        usageData.currency,
        usageData.timestamp,
        usageData.metadata?.originalModel,
        usageData.metadata?.downgraded || false,
        usageData.metadata?.budgetStatus || 'normal'
      ]
    );
    
    // Check budget status after recording usage
    const budget = budgetResult.rows[0];
    
    // Get updated cost tracking records for this budget
    const trackingResult = await query(
      `SELECT SUM(cost) as total_cost
       FROM cost_tracking
       WHERE budget_id = $1
       AND timestamp BETWEEN $2 AND $3`,
      [budgetId, budget.start_date, budget.end_date || new Date().toISOString()]
    );
    
    // Calculate current amount and percentage used
    const currentAmount = parseFloat(trackingResult.rows[0]?.total_cost || '0');
    const percentUsed = (currentAmount / parseFloat(budget.limit_amount)) * 100;
    
    // Check for alerts
    await checkAlertThresholds(budget, percentUsed, currentAmount);
    
    // Return usage record with recorded timestamp
    return res.status(201).json({
      id: usageId,
      budgetId,
      amount: usageData.amount,
      currency: usageData.currency,
      timestamp: usageData.timestamp,
      source: usageData.source,
      description: usageData.description || '',
      metadata: usageData.metadata || {},
      recorded: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error recording usage:', error);
    next(error);
  }
});

/**
 * Helper function to calculate end date based on period
 */
function calculateEndDate(startDate: Date, period: string): string {
  const endDate = new Date(startDate);
  
  switch (period) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'annual':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  // Set to end of day
  endDate.setHours(23, 59, 59, 999);
  
  return endDate.toISOString();
}

/**
 * Helper function to check alert thresholds
 */
async function checkAlertThresholds(budget: any, percentUsed: number, currentAmount: number): Promise<void> {
  // Check warning threshold
  if (percentUsed >= parseFloat(budget.warning_threshold)) {
    await createAlert(budget, 'warning', parseFloat(budget.warning_threshold), currentAmount, percentUsed);
  }
  
  // Check critical threshold
  if (percentUsed >= parseFloat(budget.critical_threshold)) {
    await createAlert(budget, 'critical', parseFloat(budget.critical_threshold), currentAmount, percentUsed);
  }
  
  // Check exceeded threshold
  if (percentUsed >= 100) {
    await createAlert(budget, 'exceeded', 100, currentAmount, percentUsed);
  }
}

/**
 * Helper function to create an alert
 */
async function createAlert(budget: any, alertType: string, threshold: number, spendAmount: number, percentage: number): Promise<void> {
  try {
    // Check if alert already exists
    const existingAlert = await query(
      `SELECT * FROM budget_alerts
       WHERE budget_id = $1
       AND alert_type = $2
       AND resolved = false`,
      [budget.id, alertType]
    );
    
    // If alert already exists, don't create a new one
    if (existingAlert.rows.length > 0) {
      return;
    }
    
    // Create alert
    await query(
      `INSERT INTO budget_alerts (
        id, budget_id, alert_type, threshold, triggered_at,
        spend_amount, limit_amount, percentage, notified_users,
        resolved, resolved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        uuidv4(),
        budget.id,
        alertType,
        threshold,
        new Date().toISOString(),
        spendAmount,
        parseFloat(budget.limit_amount),
        percentage,
        JSON.stringify([]),
        false,
        null
      ]
    );
    
    // TODO: Trigger alert actions (notifications, etc.)
    logger.info(`Alert triggered for budget ${budget.id}: ${percentage.toFixed(2)}% used (threshold: ${threshold}%)`);
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
}

/**
 * Helper function to map database budget to API response format
 */
function mapBudgetFromDb(dbBudget: any): any {
  return {
    id: dbBudget.id,
    name: dbBudget.name,
    description: dbBudget.description,
    scopeType: dbBudget.scope,
    scopeId: dbBudget.scope_id,
    amount: parseFloat(dbBudget.limit_amount),
    currency: dbBudget.currency,
    period: dbBudget.period,
    startDate: dbBudget.start_date,
    endDate: dbBudget.end_date,
    recurring: dbBudget.recurring,
    warningThreshold: parseFloat(dbBudget.warning_threshold),
    criticalThreshold: parseFloat(dbBudget.critical_threshold),
    warningAction: dbBudget.warning_action,
    criticalAction: dbBudget.critical_action,
    exhaustedAction: dbBudget.exhausted_action,
    allowOverrides: dbBudget.allow_overrides,
    overrideRoles: dbBudget.override_roles ? JSON.parse(dbBudget.override_roles) : [],
    createdAt: dbBudget.created_at,
    updatedAt: dbBudget.updated_at,
    createdBy: dbBudget.created_by,
    enabled: dbBudget.enabled
  };
}

export default router;