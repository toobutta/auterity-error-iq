/**
 * Budget Management API Sample Implementation
 * 
 * This file provides a sample implementation of the Budget Management API
 * for the Cost-Aware Model Switching component of the RelayCore and Auterity integration.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  BudgetDefinition, 
  BudgetStatus, 
  UsageRecord, 
  BudgetAlert,
  BudgetAction,
  BudgetAlertStatus
} from './types';

// Sample in-memory database (replace with actual database in production)
const budgets: Record<string, BudgetDefinition> = {};
const usageRecords: Record<string, UsageRecord[]> = {};
const alertHistory: Record<string, BudgetAlertStatus[]> = {};

// Create Express router
const router = express.Router();

/**
 * Create a new budget
 * POST /api/v1/budgets
 */
router.post('/budgets', (req, res) => {
  try {
    const budgetData = req.body;
    
    // Validate required fields
    if (!budgetData.name || !budgetData.scopeType || !budgetData.scopeId || 
        !budgetData.amount || !budgetData.currency || !budgetData.period || 
        !budgetData.startDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate budget ID
    const budgetId = `budget-${uuidv4()}`;
    
    // Calculate end date based on period if not provided
    let endDate = budgetData.endDate;
    if (!endDate && budgetData.period !== 'custom') {
      const startDate = new Date(budgetData.startDate);
      endDate = calculateEndDate(startDate, budgetData.period);
    }
    
    // Create budget definition
    const budget: BudgetDefinition = {
      id: budgetId,
      name: budgetData.name,
      description: budgetData.description || '',
      scopeType: budgetData.scopeType,
      scopeId: budgetData.scopeId,
      amount: budgetData.amount,
      currency: budgetData.currency,
      period: budgetData.period,
      startDate: budgetData.startDate,
      endDate: endDate,
      recurring: budgetData.recurring || false,
      alerts: budgetData.alerts || [],
      tags: budgetData.tags || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.id || 'system',
      parentBudgetId: budgetData.parentBudgetId
    };
    
    // Store budget
    budgets[budgetId] = budget;
    usageRecords[budgetId] = [];
    
    // Return created budget
    return res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get a specific budget
 * GET /api/v1/budgets/:id
 */
router.get('/budgets/:id', (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Return budget
    return res.status(200).json(budgets[budgetId]);
  } catch (error) {
    console.error('Error getting budget:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update a budget
 * PUT /api/v1/budgets/:id
 */
router.put('/budgets/:id', (req, res) => {
  try {
    const budgetId = req.params.id;
    const budgetData = req.body;
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Update budget fields
    const updatedBudget: BudgetDefinition = {
      ...budgets[budgetId],
      ...budgetData,
      id: budgetId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Store updated budget
    budgets[budgetId] = updatedBudget;
    
    // Return updated budget
    return res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a budget
 * DELETE /api/v1/budgets/:id
 */
router.delete('/budgets/:id', (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Delete budget
    delete budgets[budgetId];
    delete usageRecords[budgetId];
    
    // Return success
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * List budgets for a scope
 * GET /api/v1/budgets/scope/:type/:id
 */
router.get('/budgets/scope/:type/:id', (req, res) => {
  try {
    const scopeType = req.params.type;
    const scopeId = req.params.id;
    
    // Find budgets for the scope
    const scopeBudgets = Object.values(budgets).filter(
      budget => budget.scopeType === scopeType && budget.scopeId === scopeId
    );
    
    // Return budgets
    return res.status(200).json({ budgets: scopeBudgets });
  } catch (error) {
    console.error('Error listing budgets:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get budget status
 * GET /api/v1/budgets/:id/status
 */
router.get('/budgets/:id/status', (req, res) => {
  try {
    const budgetId = req.params.id;
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = budgets[budgetId];
    const records = usageRecords[budgetId] || [];
    
    // Calculate current amount
    const currentAmount = records.reduce((sum, record) => sum + record.amount, 0);
    
    // Calculate days remaining in period
    const now = new Date();
    const endDate = new Date(budget.endDate || now);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate burn rate (average daily spend)
    const startDate = new Date(budget.startDate);
    const daysSoFar = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const burnRate = currentAmount / daysSoFar;
    
    // Calculate projected total
    const projectedTotal = currentAmount + (burnRate * daysRemaining);
    
    // Determine status
    let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal';
    const percentUsed = (currentAmount / budget.amount) * 100;
    
    if (percentUsed >= 100) {
      status = 'exceeded';
    } else if (percentUsed >= 90) {
      status = 'critical';
    } else if (percentUsed >= 70) {
      status = 'warning';
    }
    
    // Get active alerts
    const activeAlerts = checkAlertThresholds(budget, percentUsed);
    
    // Create budget status
    const budgetStatus: BudgetStatus = {
      budgetId,
      currentAmount,
      limit: budget.amount,
      currency: budget.currency,
      percentUsed,
      remaining: budget.amount - currentAmount,
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
    console.error('Error getting budget status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Record usage
 * POST /api/v1/budgets/:id/usage
 */
router.post('/budgets/:id/usage', (req, res) => {
  try {
    const budgetId = req.params.id;
    const usageData = req.body;
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    // Validate required fields
    if (!usageData.amount || !usageData.currency || !usageData.timestamp || !usageData.source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create usage record
    const usageRecord: UsageRecord = {
      id: `usage-${uuidv4()}`,
      budgetId,
      amount: usageData.amount,
      currency: usageData.currency,
      timestamp: usageData.timestamp,
      source: usageData.source,
      description: usageData.description || '',
      metadata: usageData.metadata || {}
    };
    
    // Store usage record
    if (!usageRecords[budgetId]) {
      usageRecords[budgetId] = [];
    }
    usageRecords[budgetId].push(usageRecord);
    
    // Check budget status after recording usage
    const budget = budgets[budgetId];
    const currentAmount = usageRecords[budgetId].reduce((sum, record) => sum + record.amount, 0);
    const percentUsed = (currentAmount / budget.amount) * 100;
    
    // Check for alerts
    checkAlertThresholds(budget, percentUsed);
    
    // Return usage record with recorded timestamp
    return res.status(201).json({
      ...usageRecord,
      recorded: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording usage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get budget reports
 * GET /api/v1/budgets/:id/reports
 */
router.get('/budgets/:id/reports', (req, res) => {
  try {
    const budgetId = req.params.id;
    const timeRange = req.query.timeRange as string || 'current-period';
    const groupBy = req.query.groupBy as string || 'day';
    
    // Check if budget exists
    if (!budgets[budgetId]) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    const budget = budgets[budgetId];
    const records = usageRecords[budgetId] || [];
    
    // Determine date range
    let startDate: Date;
    let endDate: Date;
    
    if (timeRange === 'current-period') {
      startDate = new Date(budget.startDate);
      endDate = budget.endDate ? new Date(budget.endDate) : new Date();
    } else if (timeRange === 'last-7-days') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'last-30-days') {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === 'custom') {
      startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(budget.startDate);
      endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    } else {
      startDate = new Date(budget.startDate);
      endDate = new Date();
    }
    
    // Filter records by date range
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    // Calculate total spend
    const totalSpend = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
    
    // Group data based on groupBy parameter
    const groupedData = groupUsageData(filteredRecords, groupBy);
    
    // Get top spenders (users)
    const topSpenders = getTopSpenders(filteredRecords);
    
    // Get model usage
    const modelUsage = getModelUsage(filteredRecords);
    
    // Create report
    const report = {
      budgetId,
      timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSpend,
      limit: budget.amount,
      currency: budget.currency,
      groupedData,
      topSpenders,
      modelUsage,
      generatedAt: new Date().toISOString()
    };
    
    // Return report
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
function checkAlertThresholds(budget: BudgetDefinition, percentUsed: number): BudgetAlertStatus[] {
  const activeAlerts: BudgetAlertStatus[] = [];
  
  // Check each alert threshold
  for (const alert of budget.alerts) {
    if (percentUsed >= alert.threshold) {
      // Create alert status
      const alertStatus: BudgetAlertStatus = {
        threshold: alert.threshold,
        triggeredAt: new Date().toISOString(),
        actions: alert.actions,
        acknowledged: false
      };
      
      // Store alert in history
      if (!alertHistory[budget.id]) {
        alertHistory[budget.id] = [];
      }
      alertHistory[budget.id].push(alertStatus);
      
      // Add to active alerts
      activeAlerts.push(alertStatus);
      
      // TODO: Trigger actual alert actions (notifications, etc.)
      triggerAlertActions(budget, alert, percentUsed);
    }
  }
  
  return activeAlerts;
}

/**
 * Helper function to trigger alert actions
 */
function triggerAlertActions(budget: BudgetDefinition, alert: BudgetAlert, percentUsed: number): void {
  // Implement actual alert actions here
  console.log(`Alert triggered for budget ${budget.id}: ${percentUsed.toFixed(2)}% used (threshold: ${alert.threshold}%)`);
  
  // Handle different actions
  for (const action of alert.actions) {
    switch (action) {
      case 'notify':
        // Send notifications
        if (alert.notificationChannels) {
          for (const channel of alert.notificationChannels) {
            console.log(`Sending notification to ${channel}`);
            // TODO: Implement actual notification sending
          }
        }
        break;
      case 'restrict-models':
        console.log(`Restricting access to expensive models for budget ${budget.id}`);
        // TODO: Implement model restriction
        break;
      case 'require-approval':
        console.log(`Requiring approval for further spending on budget ${budget.id}`);
        // TODO: Implement approval requirement
        break;
      case 'block-all':
        console.log(`Blocking all further spending on budget ${budget.id}`);
        // TODO: Implement spending block
        break;
      case 'auto-downgrade':
        console.log(`Enabling automatic model downgrading for budget ${budget.id}`);
        // TODO: Implement auto-downgrading
        break;
    }
  }
}

/**
 * Helper function to group usage data
 */
function groupUsageData(records: UsageRecord[], groupBy: string): any[] {
  const groups: Record<string, number> = {};
  
  for (const record of records) {
    let groupKey: string;
    
    switch (groupBy) {
      case 'day':
        groupKey = record.timestamp.substring(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const date = new Date(record.timestamp);
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        groupKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
        break;
      case 'month':
        groupKey = record.timestamp.substring(0, 7); // YYYY-MM
        break;
      case 'model':
        groupKey = record.metadata.modelId || 'unknown';
        break;
      case 'user':
        groupKey = record.metadata.userId || 'unknown';
        break;
      case 'team':
        groupKey = record.metadata.teamId || 'unknown';
        break;
      default:
        groupKey = record.timestamp.substring(0, 10); // Default to day
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = 0;
    }
    
    groups[groupKey] += record.amount;
  }
  
  // Convert to array and calculate percentages
  const totalAmount = Object.values(groups).reduce((sum, amount) => sum + amount, 0);
  
  return Object.entries(groups).map(([group, amount]) => ({
    group,
    amount,
    percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
  }));
}

/**
 * Helper function to get week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Helper function to get top spenders
 */
function getTopSpenders(records: UsageRecord[]): any[] {
  const spenders: Record<string, number> = {};
  
  for (const record of records) {
    const userId = record.metadata.userId || 'unknown';
    
    if (!spenders[userId]) {
      spenders[userId] = 0;
    }
    
    spenders[userId] += record.amount;
  }
  
  // Calculate total amount
  const totalAmount = Object.values(spenders).reduce((sum, amount) => sum + amount, 0);
  
  // Convert to array, calculate percentages, and sort
  return Object.entries(spenders)
    .map(([userId, amount]) => ({
      userId,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10); // Top 10
}

/**
 * Helper function to get model usage
 */
function getModelUsage(records: UsageRecord[]): any[] {
  const models: Record<string, number> = {};
  
  for (const record of records) {
    const modelId = record.metadata.modelId || 'unknown';
    
    if (!models[modelId]) {
      models[modelId] = 0;
    }
    
    models[modelId] += record.amount;
  }
  
  // Calculate total amount
  const totalAmount = Object.values(models).reduce((sum, amount) => sum + amount, 0);
  
  // Convert to array, calculate percentages, and sort
  return Object.entries(models)
    .map(([modelId, amount]) => ({
      modelId,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount);
}

export default router;