/**
 * Intelligent Cost Optimization and Resource Management Engine
 * for Auterity Unified AI Platform
 *
 * Tracks, analyzes, and optimizes costs across vLLM, LangGraph, CrewAI,
 * and other AI services with intelligent resource management
 */

import axios from 'axios';
import { z } from 'zod';

// Types and interfaces
export interface CostRecord {
  id: string;
  timestamp: Date;
  service: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  cost: number;
  currency: string;
  units: number;
  unitType: 'tokens' | 'requests' | 'seconds' | 'gb' | 'cpu-hours' | 'gpu-hours';
  metadata?: Record<string, any>;
}

export interface Budget {
  id: string;
  name: string;
  userId?: string;
  teamId?: string;
  service?: string;
  amount: number;
  currency: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  currentSpent: number;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface CostAnalysis {
  period: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  currency: string;
  breakdown: {
    byService: Record<string, number>;
    byOperation: Record<string, number>;
    byUser: Record<string, number>;
    byTime: Array<{
      timestamp: Date;
      cost: number;
    }>;
  };
  trends: {
    dailyGrowth: number;
    weeklyGrowth: number;
    projectedMonthly: number;
  };
  anomalies: Array<{
    timestamp: Date;
    expectedCost: number;
    actualCost: number;
    deviation: number;
    reason: string;
  }>;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  id: string;
  type: 'optimization' | 'alert' | 'budget' | 'resource';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  potentialSavings: number;
  currency: string;
  implementationEffort: 'low' | 'medium' | 'high';
  affectedServices: string[];
  actionItems: Array<{
    action: string;
    impact: string;
    timeline: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ResourceOptimization {
  service: string;
  currentUtilization: number;
  optimalUtilization: number;
  costImpact: number;
  recommendations: Array<{
    type: 'scale-up' | 'scale-down' | 'switch-service' | 'optimize-config';
    description: string;
    potentialSavings: number;
    risk: 'low' | 'medium' | 'high';
  }>;
}

export interface CostPrediction {
  service: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  predictedCost: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
    reason: string;
  }>;
  scenarios: Array<{
    scenario: string;
    probability: number;
    costImpact: number;
  }>;
}

// Validation schemas
const CostRecordSchema = z.object({
  id: z.string().min(1),
  timestamp: z.date(),
  service: z.string().min(1),
  operation: z.string().min(1),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  cost: z.number().min(0),
  currency: z.string().default('USD'),
  units: z.number().min(0),
  unitType: z.enum(['tokens', 'requests', 'seconds', 'gb', 'cpu-hours', 'gpu-hours']),
  metadata: z.record(z.any()).optional()
});

const BudgetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  userId: z.string().optional(),
  teamId: z.string().optional(),
  service: z.string().optional(),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  period: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
  alertThreshold: z.number().min(0).max(100).default(80),
  currentSpent: z.number().default(0),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true)
});

// Cost Optimization Engine
export class CostOptimizationEngine {
  private costRecords: CostRecord[] = [];
  private budgets: Map<string, Budget> = new Map();
  private servicePricing: Map<string, ServicePricing> = new Map();
  private optimizationHistory: CostRecommendation[] = [];

  constructor() {
    this.initializeServicePricing();
    this.startPeriodicTasks();
  }

  /**
   * Record a cost event
   */
  async recordCost(record: CostRecord): Promise<void> {
    try {
      const validated = CostRecordSchema.parse(record);
      this.costRecords.push(validated);

      // Update budgets
      await this.updateBudgets(validated);

      // Check for alerts
      await this.checkBudgetAlerts(validated);

      // Limit storage (keep last 100k records)
      if (this.costRecords.length > 100000) {
        this.costRecords = this.costRecords.slice(-50000);
      }

    } catch (error: any) {
      console.error('Failed to record cost:', error);
      throw error;
    }
  }

  /**
   * Create or update a budget
   */
  async createBudget(budget: Budget): Promise<string> {
    try {
      const validated = BudgetSchema.parse(budget);
      this.budgets.set(validated.id, validated);

      // Calculate current spending
      await this.updateBudgetSpending(validated.id);

      return validated.id;

    } catch (error: any) {
      console.error('Failed to create budget:', error);
      throw error;
    }
  }

  /**
   * Get cost analysis for a time period
   */
  async getCostAnalysis(
    startDate: Date,
    endDate: Date,
    filters?: {
      service?: string;
      userId?: string;
      operation?: string;
    }
  ): Promise<CostAnalysis> {
    try {
      // Filter records
      const filteredRecords = this.costRecords.filter(record => {
        const inRange = record.timestamp >= startDate && record.timestamp <= endDate;
        const serviceMatch = !filters?.service || record.service === filters.service;
        const userMatch = !filters?.userId || record.userId === filters.userId;
        const operationMatch = !filters?.operation || record.operation === filters.operation;

        return inRange && serviceMatch && userMatch && operationMatch;
      });

      // Calculate totals and breakdowns
      const totalCost = filteredRecords.reduce((sum, record) => sum + record.cost, 0);
      const currency = filteredRecords[0]?.currency || 'USD';

      const breakdown = {
        byService: this.groupBy(filteredRecords, 'service', 'cost'),
        byOperation: this.groupBy(filteredRecords, 'operation', 'cost'),
        byUser: this.groupBy(filteredRecords, 'userId', 'cost'),
        byTime: this.groupByTime(filteredRecords, 'cost')
      };

      // Calculate trends
      const trends = this.calculateTrends(filteredRecords, startDate, endDate);

      // Detect anomalies
      const anomalies = this.detectAnomalies(filteredRecords);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(filteredRecords, totalCost);

      return {
        period: { start: startDate, end: endDate },
        totalCost,
        currency,
        breakdown,
        trends,
        anomalies,
        recommendations
      };

    } catch (error: any) {
      console.error('Failed to generate cost analysis:', error);
      throw error;
    }
  }

  /**
   * Get resource optimization recommendations
   */
  async getResourceOptimization(): Promise<ResourceOptimization[]> {
    try {
      const optimizations: ResourceOptimization[] = [];

      // Analyze each service
      for (const [serviceName, pricing] of this.servicePricing.entries()) {
        const serviceRecords = this.costRecords.filter(r => r.service === serviceName);
        if (serviceRecords.length === 0) continue;

        const currentUtilization = this.calculateUtilization(serviceRecords, serviceName);
        const optimalUtilization = this.calculateOptimalUtilization(serviceRecords, pricing);
        const costImpact = this.calculateCostImpact(currentUtilization, optimalUtilization, pricing);

        const recommendations = this.generateServiceRecommendations(
          serviceName,
          currentUtilization,
          optimalUtilization,
          pricing
        );

        optimizations.push({
          service: serviceName,
          currentUtilization,
          optimalUtilization,
          costImpact,
          recommendations
        });
      }

      return optimizations;

    } catch (error: any) {
      console.error('Failed to generate resource optimization:', error);
      throw error;
    }
  }

  /**
   * Predict future costs
   */
  async predictCosts(timeframe: CostPrediction['timeframe']): Promise<CostPrediction[]> {
    try {
      const predictions: CostPrediction[] = [];

      for (const [serviceName] of this.servicePricing.entries()) {
        const serviceRecords = this.costRecords.filter(r => r.service === serviceName);
        if (serviceRecords.length < 10) continue; // Need minimum data

        const prediction = await this.predictServiceCost(serviceRecords, serviceName, timeframe);
        predictions.push(prediction);
      }

      return predictions;

    } catch (error: any) {
      console.error('Failed to predict costs:', error);
      throw error;
    }
  }

  /**
   * Apply cost optimization recommendations
   */
  async applyOptimization(recommendationId: string): Promise<{
    success: boolean;
    appliedChanges: string[];
    estimatedSavings: number;
    rollbackPlan?: string;
  }> {
    try {
      const recommendation = this.optimizationHistory.find(r => r.id === recommendationId);
      if (!recommendation) {
        throw new Error('Recommendation not found');
      }

      const appliedChanges: string[] = [];
      let estimatedSavings = 0;

      // Apply each action item
      for (const action of recommendation.actionItems) {
        const result = await this.applyActionItem(action, recommendation);
        if (result.success) {
          appliedChanges.push(action.action);
          estimatedSavings += result.savings || 0;
        }
      }

      // Store the application for rollback
      await this.storeOptimizationApplication(recommendation, appliedChanges);

      return {
        success: appliedChanges.length > 0,
        appliedChanges,
        estimatedSavings,
        rollbackPlan: this.generateRollbackPlan(recommendation, appliedChanges)
      };

    } catch (error: any) {
      console.error('Failed to apply optimization:', error);
      throw error;
    }
  }

  // Private helper methods

  private initializeServicePricing(): void {
    // Define pricing for each service
    this.servicePricing.set('vllm', {
      baseCost: 0.01,
      unitCosts: {
        tokens: 0.0001,
        requests: 0.001,
        gpu_hours: 2.50,
        cpu_hours: 0.10
      },
      tiers: [
        { threshold: 1000, discount: 0.1 },
        { threshold: 10000, discount: 0.2 },
        { threshold: 100000, discount: 0.3 }
      ]
    });

    this.servicePricing.set('langgraph', {
      baseCost: 0.005,
      unitCosts: {
        tokens: 0.00005,
        requests: 0.0005,
        cpu_hours: 0.08
      },
      tiers: [
        { threshold: 5000, discount: 0.15 },
        { threshold: 50000, discount: 0.25 }
      ]
    });

    this.servicePricing.set('crewai', {
      baseCost: 0.008,
      unitCosts: {
        tokens: 0.00008,
        requests: 0.001,
        cpu_hours: 0.12
      },
      tiers: [
        { threshold: 1000, discount: 0.1 },
        { threshold: 10000, discount: 0.2 }
      ]
    });

    this.servicePricing.set('openai', {
      baseCost: 0.02,
      unitCosts: {
        tokens: 0.00002,
        requests: 0.002
      },
      tiers: []
    });

    this.servicePricing.set('anthropic', {
      baseCost: 0.015,
      unitCosts: {
        tokens: 0.000015,
        requests: 0.0015
      },
      tiers: []
    });
  }

  private startPeriodicTasks(): void {
    // Update budgets every hour
    setInterval(() => {
      this.updateAllBudgets();
    }, 60 * 60 * 1000);

    // Generate optimization recommendations daily
    setInterval(() => {
      this.generateDailyOptimizations();
    }, 24 * 60 * 60 * 1000);

    // Clean up old data weekly
    setInterval(() => {
      this.cleanupOldData();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  private async updateBudgets(record: CostRecord): Promise<void> {
    for (const [budgetId, budget] of this.budgets.entries()) {
      if (budget.isActive &&
          (!budget.service || budget.service === record.service) &&
          (!budget.userId || budget.userId === record.userId)) {

        // Check if we're in the budget period
        if (this.isInBudgetPeriod(budget, record.timestamp)) {
          budget.currentSpent += record.cost;
          this.budgets.set(budgetId, budget);
        }
      }
    }
  }

  private async checkBudgetAlerts(record: CostRecord): Promise<void> {
    for (const budget of this.budgets.values()) {
      if (budget.isActive &&
          (!budget.service || budget.service === record.service) &&
          (!budget.userId || budget.userId === record.userId)) {

        const usagePercentage = (budget.currentSpent / budget.amount) * 100;

        if (usagePercentage >= budget.alertThreshold) {
          await this.sendBudgetAlert(budget, usagePercentage);
        }

        if (budget.currentSpent >= budget.amount) {
          await this.sendBudgetExceededAlert(budget);
        }
      }
    }
  }

  private async updateBudgetSpending(budgetId: string): Promise<void> {
    const budget = this.budgets.get(budgetId);
    if (!budget) return;

    const relevantRecords = this.costRecords.filter(record => {
      if (!budget.isActive) return false;
      if (budget.service && record.service !== budget.service) return false;
      if (budget.userId && record.userId !== budget.userId) return false;
      return this.isInBudgetPeriod(budget, record.timestamp);
    });

    budget.currentSpent = relevantRecords.reduce((sum, record) => sum + record.cost, 0);
    this.budgets.set(budgetId, budget);
  }

  private async updateAllBudgets(): Promise<void> {
    for (const budgetId of this.budgets.keys()) {
      await this.updateBudgetSpending(budgetId);
    }
  }

  private isInBudgetPeriod(budget: Budget, timestamp: Date): boolean {
    if (timestamp < budget.startDate) return false;
    if (budget.endDate && timestamp > budget.endDate) return false;

    // Check period boundaries (simplified)
    const hoursDiff = (timestamp.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60);

    switch (budget.period) {
      case 'hourly': return hoursDiff < 1;
      case 'daily': return hoursDiff < 24;
      case 'weekly': return hoursDiff < 168;
      case 'monthly': return hoursDiff < 720; // ~30 days
      case 'yearly': return hoursDiff < 8760; // ~365 days
      default: return true;
    }
  }

  private groupBy(records: CostRecord[], key: keyof CostRecord, valueKey: keyof CostRecord): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const record of records) {
      const groupKey = String(record[key] || 'unknown');
      const value = Number(record[valueKey]) || 0;
      groups[groupKey] = (groups[groupKey] || 0) + value;
    }

    return groups;
  }

  private groupByTime(records: CostRecord[], valueKey: keyof CostRecord): Array<{ timestamp: Date; cost: number }> {
    const hourlyGroups: Record<string, number> = {};

    for (const record of records) {
      const hour = new Date(record.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      const value = Number(record[valueKey]) || 0;
      hourlyGroups[key] = (hourlyGroups[key] || 0) + value;
    }

    return Object.entries(hourlyGroups).map(([timestamp, cost]) => ({
      timestamp: new Date(timestamp),
      cost
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateTrends(records: CostRecord[], startDate: Date, endDate: Date) {
    const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sortedRecords.length < 2) {
      return { dailyGrowth: 0, weeklyGrowth: 0, projectedMonthly: 0 };
    }

    // Calculate daily growth
    const firstDay = sortedRecords[0].timestamp;
    const lastDay = sortedRecords[sortedRecords.length - 1].timestamp;
    const daysDiff = (lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24);

    const firstDayCost = sortedRecords.slice(0, Math.ceil(sortedRecords.length / daysDiff)).reduce((sum, r) => sum + r.cost, 0);
    const lastDayCost = sortedRecords.slice(-Math.ceil(sortedRecords.length / daysDiff)).reduce((sum, r) => sum + r.cost, 0);

    const dailyGrowth = daysDiff > 0 ? ((lastDayCost - firstDayCost) / firstDayCost) * 100 : 0;

    // Simple projections (can be enhanced with ML)
    const totalCost = sortedRecords.reduce((sum, r) => sum + r.cost, 0);
    const avgDailyCost = totalCost / Math.max(daysDiff, 1);
    const projectedMonthly = avgDailyCost * 30;

    return {
      dailyGrowth,
      weeklyGrowth: dailyGrowth * 7,
      projectedMonthly
    };
  }

  private detectAnomalies(records: CostRecord[]): Array<{
    timestamp: Date;
    expectedCost: number;
    actualCost: number;
    deviation: number;
    reason: string;
  }> {
    if (records.length < 10) return [];

    const anomalies = [];
    const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Simple moving average for baseline
    for (let i = 7; i < sortedRecords.length; i++) {
      const window = sortedRecords.slice(i - 7, i);
      const avgCost = window.reduce((sum, r) => sum + r.cost, 0) / window.length;
      const stdDev = Math.sqrt(
        window.reduce((sum, r) => sum + Math.pow(r.cost - avgCost, 2), 0) / window.length
      );

      const currentCost = sortedRecords[i].cost;
      const deviation = Math.abs(currentCost - avgCost) / stdDev;

      if (deviation > 2) { // 2 standard deviations
        anomalies.push({
          timestamp: sortedRecords[i].timestamp,
          expectedCost: avgCost,
          actualCost: currentCost,
          deviation,
          reason: deviation > 3 ? 'Significant cost spike' : 'Unusual cost pattern'
        });
      }
    }

    return anomalies;
  }

  private async generateRecommendations(records: CostRecord[], totalCost: number): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];

    // Analyze service usage
    const serviceUsage = this.groupBy(records, 'service', 'cost');

    // Recommend switching expensive services
    for (const [service, cost] of Object.entries(serviceUsage)) {
      if (service === 'openai' && cost > totalCost * 0.5) {
        recommendations.push({
          id: `switch_${service}_${Date.now()}`,
          type: 'optimization',
          priority: 'high',
          title: `Switch from ${service} to cost-effective alternative`,
          description: `${service} accounts for ${(cost / totalCost * 100).toFixed(1)}% of costs. Consider switching to vLLM or Anthropic for better pricing.`,
          potentialSavings: cost * 0.4, // Estimate 40% savings
          currency: 'USD',
          implementationEffort: 'medium',
          affectedServices: [service],
          actionItems: [
            {
              action: 'Evaluate vLLM as replacement',
              impact: '40% cost reduction',
              timeline: '1-2 weeks'
            },
            {
              action: 'Migrate workloads gradually',
              impact: 'Zero downtime transition',
              timeline: '2-4 weeks'
            }
          ]
        });
      }
    }

    // Recommend budget creation
    if (!this.budgets.size && totalCost > 100) {
      recommendations.push({
        id: `budget_${Date.now()}`,
        type: 'budget',
        priority: 'medium',
        title: 'Create cost budget and monitoring',
        description: 'Implement budget controls to prevent unexpected cost increases.',
        potentialSavings: totalCost * 0.1, // Estimate 10% savings through control
        currency: 'USD',
        implementationEffort: 'low',
        affectedServices: [],
        actionItems: [
          {
            action: 'Set up monthly budget of $' + Math.ceil(totalCost * 1.2),
            impact: 'Cost visibility and control',
            timeline: '1 day'
          },
          {
            action: 'Configure budget alerts at 80% threshold',
            impact: 'Early warning system',
            timeline: '1 day'
          }
        ]
      });
    }

    // Cache optimization recommendations
    const cacheRecords = records.filter(r => r.operation.includes('cache'));
    if (cacheRecords.length < records.length * 0.3) {
      recommendations.push({
        id: `cache_${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: 'Implement result caching',
        description: 'Add caching layer to reduce redundant API calls and associated costs.',
        potentialSavings: totalCost * 0.2, // Estimate 20% savings
        currency: 'USD',
        implementationEffort: 'medium',
        affectedServices: Object.keys(serviceUsage),
        actionItems: [
          {
            action: 'Implement Redis caching layer',
            impact: '30% reduction in API calls',
            timeline: '1 week'
          },
          {
            action: 'Add cache headers to responses',
            impact: 'Browser-level caching',
            timeline: '2 days'
          }
        ]
      });
    }

    return recommendations;
  }

  private calculateUtilization(records: CostRecord[], service: string): number {
    // Simplified utilization calculation
    const servicePricing = this.servicePricing.get(service);
    if (!servicePricing) return 0;

    const totalUnits = records.reduce((sum, record) => sum + record.units, 0);
    const maxCapacity = 1000; // Service-specific capacity

    return Math.min((totalUnits / maxCapacity) * 100, 100);
  }

  private calculateOptimalUtilization(records: CostRecord[], pricing: ServicePricing): number {
    // Calculate optimal utilization based on pricing tiers
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    // Find best tier
    let bestTier = 0;
    for (let i = 0; i < pricing.tiers.length; i++) {
      if (totalCost >= pricing.tiers[i].threshold) {
        bestTier = i;
      }
    }

    return Math.max(70, Math.min(90, 60 + bestTier * 10)); // 70-90% optimal range
  }

  private calculateCostImpact(currentUtil: number, optimalUtil: number, pricing: ServicePricing): number {
    const efficiency = Math.min(currentUtil / optimalUtil, 2); // Max 2x impact
    return pricing.baseCost * (efficiency - 1) * 100; // Percentage impact
  }

  private generateServiceRecommendations(
    service: string,
    currentUtil: number,
    optimalUtil: number,
    pricing: ServicePricing
  ): Array<{
    type: 'scale-up' | 'scale-down' | 'switch-service' | 'optimize-config';
    description: string;
    potentialSavings: number;
    risk: 'low' | 'medium' | 'high';
  }> {
    const recommendations = [];

    if (currentUtil > optimalUtil * 1.5) {
      recommendations.push({
        type: 'scale-down',
        description: `Reduce ${service} capacity to optimize costs`,
        potentialSavings: pricing.baseCost * 0.3,
        risk: 'medium'
      });
    } else if (currentUtil < optimalUtil * 0.7) {
      recommendations.push({
        type: 'scale-up',
        description: `Increase ${service} capacity for better performance`,
        potentialSavings: -pricing.baseCost * 0.2, // Cost increase but performance benefit
        risk: 'low'
      });
    }

    if (service === 'openai' || service === 'anthropic') {
      recommendations.push({
        type: 'switch-service',
        description: `Switch to vLLM for cost-effective alternative to ${service}`,
        potentialSavings: pricing.baseCost * 0.5,
        risk: 'medium'
      });
    }

    recommendations.push({
      type: 'optimize-config',
      description: `Optimize ${service} configuration for better cost efficiency`,
      potentialSavings: pricing.baseCost * 0.1,
      risk: 'low'
    });

    return recommendations;
  }

  private async predictServiceCost(
    records: CostRecord[],
    service: string,
    timeframe: CostPrediction['timeframe']
  ): Promise<CostPrediction> {
    if (records.length < 5) {
      throw new Error('Insufficient data for prediction');
    }

    const sortedRecords = records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentRecords = sortedRecords.slice(-10);

    // Simple linear regression for prediction
    const costs = recentRecords.map(r => r.cost);
    const timestamps = recentRecords.map(r => r.timestamp.getTime());

    const n = costs.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = costs.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * costs[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict based on timeframe
    const timeMultipliers = {
      '1h': 1 / 24,
      '24h': 1,
      '7d': 7,
      '30d': 30
    };

    const lastTimestamp = sortedRecords[sortedRecords.length - 1].timestamp.getTime();
    const predictTimestamp = lastTimestamp + (timeMultipliers[timeframe] * 24 * 60 * 60 * 1000);
    const predictedCost = slope * predictTimestamp + intercept;

    return {
      service,
      timeframe,
      predictedCost: Math.max(0, predictedCost),
      confidence: Math.min(0.9, n / 20), // Higher confidence with more data
      factors: [
        {
          factor: 'historical_trend',
          impact: slope > 0 ? slope * 100 : 0,
          reason: slope > 0 ? 'Costs are increasing' : 'Costs are stable or decreasing'
        }
      ],
      scenarios: [
        {
          scenario: 'conservative',
          probability: 0.3,
          costImpact: predictedCost * 0.8
        },
        {
          scenario: 'expected',
          probability: 0.5,
          costImpact: predictedCost
        },
        {
          scenario: 'worst_case',
          probability: 0.2,
          costImpact: predictedCost * 1.5
        }
      ]
    };
  }

  private async sendBudgetAlert(budget: Budget, usagePercentage: number): Promise<void> {
    // Send alert through monitoring system
    console.warn(`Budget alert: ${budget.name} is at ${usagePercentage.toFixed(1)}% usage`);

    // Could integrate with email, Slack, etc.
  }

  private async sendBudgetExceededAlert(budget: Budget): Promise<void> {
    console.error(`Budget exceeded: ${budget.name} has exceeded its limit of ${budget.amount} ${budget.currency}`);

    // Could integrate with notification systems
  }

  private async applyActionItem(action: any, recommendation: CostRecommendation): Promise<{
    success: boolean;
    savings?: number;
  }> {
    // Implementation would depend on the specific action
    // This is a placeholder for the actual implementation

    return {
      success: true,
      savings: recommendation.potentialSavings / recommendation.actionItems.length
    };
  }

  private async storeOptimizationApplication(recommendation: CostRecommendation, appliedChanges: string[]): Promise<void> {
    // Store for rollback capability
  }

  private generateRollbackPlan(recommendation: CostRecommendation, appliedChanges: string[]): string {
    return `To rollback: ${appliedChanges.map(change => `Revert: ${change}`).join(', ')}`;
  }

  private async generateDailyOptimizations(): Promise<void> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentRecords = this.costRecords.filter(r => r.timestamp >= last30Days);
    if (recentRecords.length === 0) return;

    const totalCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
    const recommendations = await this.generateRecommendations(recentRecords, totalCost);

    this.optimizationHistory.push(...recommendations);

    // Limit history
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-50);
    }
  }

  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days

    this.costRecords = this.costRecords.filter(r => r.timestamp >= cutoffDate);
    this.optimizationHistory = this.optimizationHistory.filter(r => {
      const recommendationDate = new Date(r.id.split('_').pop() || 0);
      return recommendationDate >= cutoffDate;
    });
  }

  // Public getters
  getBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  getCostRecords(limit?: number): CostRecord[] {
    return this.costRecords.slice(-(limit || 1000));
  }

  getOptimizationHistory(limit?: number): CostRecommendation[] {
    return this.optimizationHistory.slice(-(limit || 100));
  }

  getServicePricing(): Record<string, ServicePricing> {
    return Object.fromEntries(this.servicePricing.entries());
  }
}

// Service pricing interface
interface ServicePricing {
  baseCost: number;
  unitCosts: Record<string, number>;
  tiers: Array<{
    threshold: number;
    discount: number;
  }>;
}

// Export singleton instance
export const costOptimizationEngine = new CostOptimizationEngine();

// Export types
export type { CostRecord, Budget, CostAnalysis, CostRecommendation, ResourceOptimization, CostPrediction };

// Convenience functions
export const recordAICost = (
  service: string,
  operation: string,
  cost: number,
  units: number,
  unitType: CostRecord['unitType'],
  metadata?: Record<string, any>
) => {
  return costOptimizationEngine.recordCost({
    id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    service,
    operation,
    cost,
    currency: 'USD',
    units,
    unitType,
    metadata
  });
};

export const createBudget = (budget: Omit<Budget, 'id' | 'currentSpent'>) => {
  const budgetWithId: Budget = {
    ...budget,
    id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    currentSpent: 0
  };
  return costOptimizationEngine.createBudget(budgetWithId);
};

export const getCostAnalysis = costOptimizationEngine.getCostAnalysis.bind(costOptimizationEngine);
export const getResourceOptimization = costOptimizationEngine.getResourceOptimization.bind(costOptimizationEngine);
export const predictCosts = costOptimizationEngine.predictCosts.bind(costOptimizationEngine);
export const applyOptimization = costOptimizationEngine.applyOptimization.bind(costOptimizationEngine);

