/**
 * Cost Tracking Integration for AI Services
 * Automatically tracks and records costs from vLLM, LangGraph, CrewAI, and other services
 */

import axios from 'axios';
import { CostRecord, costOptimizationEngine, recordAICost } from './costOptimizationEngine';

// Service cost calculators
export class CostTrackingIntegration {
  private serviceEndpoints: Map<string, string> = new Map();
  private costCache: Map<string, any> = new Map();

  constructor() {
    this.initializeServiceEndpoints();
  }

  /**
   * Initialize service endpoints for cost tracking
   */
  private initializeServiceEndpoints(): void {
    this.serviceEndpoints.set('vllm', process.env.VLLM_BASE_URL || 'http://localhost:8001');
    this.serviceEndpoints.set('langgraph', process.env.LANGGRAPH_BASE_URL || 'http://localhost:8002');
    this.serviceEndpoints.set('crewai', process.env.CREWAI_BASE_URL || 'http://localhost:8003');
    this.serviceEndpoints.set('openai', 'https://api.openai.com/v1');
    this.serviceEndpoints.set('anthropic', 'https://api.anthropic.com');
  }

  /**
   * Track vLLM inference costs
   */
  async trackVLLMCost(
    request: any,
    response: any,
    userId?: string,
    sessionId?: string
  ): Promise<CostRecord> {
    try {
      const tokens = response.usage?.total_tokens || response.usage?.completion_tokens || 0;
      const model = request.model || 'default';

      // vLLM pricing (example rates - adjust based on your provider)
      const costPerToken = this.getVLLMCostPerToken(model);

      const cost = tokens * costPerToken;

      const costRecord: CostRecord = {
        id: `vllm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        service: 'vllm',
        operation: 'text-generation',
        userId,
        sessionId,
        cost,
        currency: 'USD',
        units: tokens,
        unitType: 'tokens',
        metadata: {
          model,
          prompt_tokens: response.usage?.prompt_tokens,
          completion_tokens: response.usage?.completion_tokens,
          temperature: request.temperature,
          max_tokens: request.max_tokens
        }
      };

      await costOptimizationEngine.recordCost(costRecord);
      return costRecord;

    } catch (error) {
      console.error('Failed to track vLLM cost:', error);
      throw error;
    }
  }

  /**
   * Track LangGraph workflow costs
   */
  async trackLangGraphCost(
    workflowId: string,
    executionTime: number,
    nodeCount: number,
    userId?: string,
    sessionId?: string
  ): Promise<CostRecord> {
    try {
      // LangGraph pricing based on execution time and complexity
      const baseCost = 0.005; // Base cost per execution
      const timeCost = (executionTime / 60) * 0.01; // $0.01 per minute
      const complexityCost = nodeCount * 0.001; // $0.001 per node

      const cost = baseCost + timeCost + complexityCost;

      const costRecord: CostRecord = {
        id: `langgraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        service: 'langgraph',
        operation: 'workflow-execution',
        userId,
        sessionId,
        cost,
        currency: 'USD',
        units: executionTime,
        unitType: 'seconds',
        metadata: {
          workflowId,
          nodeCount,
          executionTime,
          cost_breakdown: {
            base: baseCost,
            time: timeCost,
            complexity: complexityCost
          }
        }
      };

      await costOptimizationEngine.recordCost(costRecord);
      return costRecord;

    } catch (error) {
      console.error('Failed to track LangGraph cost:', error);
      throw error;
    }
  }

  /**
   * Track CrewAI collaboration costs
   */
  async trackCrewAICost(
    crewId: string,
    task: string,
    agentCount: number,
    executionTime: number,
    totalTokens: number,
    userId?: string,
    sessionId?: string
  ): Promise<CostRecord> {
    try {
      // CrewAI pricing based on agents, time, and tokens
      const baseCost = 0.008; // Base cost per crew execution
      const agentCost = agentCount * 0.002; // $0.002 per agent
      const timeCost = (executionTime / 60) * 0.005; // $0.005 per minute
      const tokenCost = totalTokens * 0.00008; // $0.00008 per token

      const cost = baseCost + agentCost + timeCost + tokenCost;

      const costRecord: CostRecord = {
        id: `crewai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        service: 'crewai',
        operation: 'crew-execution',
        userId,
        sessionId,
        cost,
        currency: 'USD',
        units: totalTokens,
        unitType: 'tokens',
        metadata: {
          crewId,
          task,
          agentCount,
          executionTime,
          totalTokens,
          cost_breakdown: {
            base: baseCost,
            agents: agentCost,
            time: timeCost,
            tokens: tokenCost
          }
        }
      };

      await costOptimizationEngine.recordCost(costRecord);
      return costRecord;

    } catch (error) {
      console.error('Failed to track CrewAI cost:', error);
      throw error;
    }
  }

  /**
   * Track OpenAI API costs
   */
  async trackOpenAICost(
    request: any,
    response: any,
    userId?: string,
    sessionId?: string
  ): Promise<CostRecord> {
    try {
      const model = request.model || 'gpt-3.5-turbo';
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || (inputTokens + outputTokens);

      // OpenAI pricing (as of 2024 - update as needed)
      const pricing = this.getOpenAIPricing(model);
      const inputCost = inputTokens * pricing.input;
      const outputCost = outputTokens * pricing.output;
      const cost = inputCost + outputCost;

      const costRecord: CostRecord = {
        id: `openai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        service: 'openai',
        operation: 'api-call',
        userId,
        sessionId,
        cost,
        currency: 'USD',
        units: totalTokens,
        unitType: 'tokens',
        metadata: {
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_breakdown: {
            input: inputCost,
            output: outputCost
          }
        }
      };

      await costOptimizationEngine.recordCost(costRecord);
      return costRecord;

    } catch (error) {
      console.error('Failed to track OpenAI cost:', error);
      throw error;
    }
  }

  /**
   * Track Anthropic API costs
   */
  async trackAnthropicCost(
    request: any,
    response: any,
    userId?: string,
    sessionId?: string
  ): Promise<CostRecord> {
    try {
      const model = request.model || 'claude-3-sonnet-20240229';
      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;

      // Anthropic pricing (as of 2024 - update as needed)
      const pricing = this.getAnthropicPricing(model);
      const cost = totalTokens * pricing.perToken;

      const costRecord: CostRecord = {
        id: `anthropic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        service: 'anthropic',
        operation: 'api-call',
        userId,
        sessionId,
        cost,
        currency: 'USD',
        units: totalTokens,
        unitType: 'tokens',
        metadata: {
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens
        }
      };

      await costOptimizationEngine.recordCost(costRecord);
      return costRecord;

    } catch (error) {
      console.error('Failed to track Anthropic cost:', error);
      throw error;
    }
  }

  /**
   * Auto-discover and track costs from service logs
   */
  async discoverCostsFromLogs(logEntries: any[]): Promise<CostRecord[]> {
    const costRecords: CostRecord[] = [];

    for (const logEntry of logEntries) {
      try {
        const costRecord = await this.extractCostFromLog(logEntry);
        if (costRecord) {
          costRecords.push(costRecord);
          await costOptimizationEngine.recordCost(costRecord);
        }
      } catch (error) {
        console.warn('Failed to extract cost from log:', error);
      }
    }

    return costRecords;
  }

  /**
   * Extract cost information from service logs
   */
  private async extractCostFromLog(logEntry: any): Promise<CostRecord | null> {
    try {
      const { message, timestamp, service, level } = logEntry;

      // Look for cost-related patterns in logs
      if (message.includes('cost') || message.includes('billing') || message.includes('usage')) {
        // Parse cost from log message (implementation depends on log format)
        const costMatch = message.match(/cost[:\s]+[\$]?(\d+\.?\d*)/i);
        const tokensMatch = message.match(/tokens[:\s]+(\d+)/i);

        if (costMatch) {
          const cost = parseFloat(costMatch[1]);
          const tokens = tokensMatch ? parseInt(tokensMatch[1]) : 0;

          return {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(timestamp),
            service: service || 'unknown',
            operation: 'logged-operation',
            cost,
            currency: 'USD',
            units: tokens || 1,
            unitType: tokens ? 'tokens' : 'requests',
            metadata: {
              source: 'log-parsing',
              original_message: message,
              log_level: level
            }
          };
        }
      }

      return null;

    } catch (error) {
      console.warn('Failed to parse cost from log:', error);
      return null;
    }
  }

  /**
   * Get real-time cost metrics for dashboard
   */
  async getRealtimeCostMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalCost: number;
    serviceBreakdown: Record<string, number>;
    topCostDrivers: Array<{ service: string; operation: string; cost: number }>;
    costTrend: Array<{ timestamp: Date; cost: number }>;
    efficiency: number;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      // Set time range
      switch (timeRange) {
        case '1h':
          startDate.setHours(startDate.getHours() - 1);
          break;
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }

      const analysis = await costOptimizationEngine.getCostAnalysis(startDate, endDate);

      // Calculate efficiency (lower is better)
      const efficiency = this.calculateCostEfficiency(analysis.breakdown.byService);

      // Get top cost drivers
      const topCostDrivers = this.getTopCostDrivers(analysis.breakdown.byOperation, 5);

      return {
        totalCost: analysis.totalCost,
        serviceBreakdown: analysis.breakdown.byService,
        topCostDrivers,
        costTrend: analysis.breakdown.byTime,
        efficiency
      };

    } catch (error) {
      console.error('Failed to get real-time cost metrics:', error);
      throw error;
    }
  }

  /**
   * Generate cost alerts and notifications
   */
  async generateCostAlerts(): Promise<Array<{
    type: 'budget' | 'anomaly' | 'trend' | 'optimization';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionable: boolean;
    suggestedActions?: string[];
  }>> {
    const alerts = [];

    try {
      // Check budget alerts
      const budgets = costOptimizationEngine.getBudgets();
      for (const budget of budgets) {
        if (budget.isActive) {
          const usagePercentage = (budget.currentSpent / budget.amount) * 100;

          if (usagePercentage >= 100) {
            alerts.push({
              type: 'budget',
              severity: 'critical',
              title: `Budget Exceeded: ${budget.name}`,
              message: `Budget of ${budget.amount} ${budget.currency} has been exceeded by ${budget.currentSpent - budget.amount} ${budget.currency}`,
              actionable: true,
              suggestedActions: [
                'Review and optimize high-cost services',
                'Implement rate limiting',
                'Consider budget increase or service downgrade'
              ]
            });
          } else if (usagePercentage >= budget.alertThreshold) {
            alerts.push({
              type: 'budget',
              severity: 'high',
              title: `Budget Alert: ${budget.name}`,
              message: `Budget usage is at ${usagePercentage.toFixed(1)}% (${budget.currentSpent} / ${budget.amount} ${budget.currency})`,
              actionable: true,
              suggestedActions: [
                'Monitor usage closely',
                'Review recent cost increases',
                'Consider optimization measures'
              ]
            });
          }
        }
      }

      // Check for cost anomalies
      const recentRecords = costOptimizationEngine.getCostRecords(1000);
      const anomalies = this.detectCostAnomalies(recentRecords);

      for (const anomaly of anomalies) {
        alerts.push({
          type: 'anomaly',
          severity: 'medium',
          title: 'Cost Anomaly Detected',
          message: `Unusual cost pattern detected for ${anomaly.service}: ${anomaly.expectedCost.toFixed(2)} → ${anomaly.actualCost.toFixed(2)} ${anomaly.currency}`,
          actionable: true,
          suggestedActions: [
            'Review recent usage patterns',
            'Check for unexpected API calls',
            'Verify service configurations'
          ]
        });
      }

      // Check optimization opportunities
      const optimizations = await costOptimizationEngine.getResourceOptimization();
      for (const optimization of optimizations) {
        if (optimization.costImpact > 10) { // More than $10 potential savings
          alerts.push({
            type: 'optimization',
            severity: 'low',
            title: `Cost Optimization Opportunity: ${optimization.service}`,
            message: `Potential savings of $${optimization.costImpact.toFixed(2)} by optimizing ${optimization.service} usage`,
            actionable: true,
            suggestedActions: optimization.recommendations.map(r => r.description)
          });
        }
      }

    } catch (error) {
      console.error('Failed to generate cost alerts:', error);
    }

    return alerts;
  }

  // Private helper methods

  private getVLLMCostPerToken(model: string): number {
    // vLLM cost per token (example rates)
    const rates: Record<string, number> = {
      'llama-2-7b': 0.0001,
      'llama-2-13b': 0.0002,
      'llama-2-70b': 0.0005,
      'default': 0.00015
    };
    return rates[model] || rates.default;
  }

  private getOpenAIPricing(model: string): { input: number; output: number } {
    // OpenAI pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 }
    };
    return pricing[model] || pricing['gpt-3.5-turbo'];
  }

  private getAnthropicPricing(model: string): { perToken: number } {
    // Anthropic pricing per 1K tokens (as of 2024)
    const pricing: Record<string, { perToken: number }> = {
      'claude-3-opus-20240229': { perToken: 0.015 },
      'claude-3-sonnet-20240229': { perToken: 0.003 },
      'claude-3-haiku-20240307': { perToken: 0.00025 }
    };
    return pricing[model] || { perToken: 0.003 };
  }

  private calculateCostEfficiency(serviceBreakdown: Record<string, number>): number {
    if (!serviceBreakdown || Object.keys(serviceBreakdown).length === 0) {
      return 1.0;
    }

    const totalCost = Object.values(serviceBreakdown).reduce((sum, cost) => sum + cost, 0);
    const serviceCount = Object.keys(serviceBreakdown).length;

    // Efficiency based on service diversity and cost distribution
    const maxServiceCost = Math.max(...Object.values(serviceBreakdown));
    const concentrationRatio = maxServiceCost / totalCost;

    // Lower concentration ratio indicates better cost distribution (higher efficiency)
    return Math.max(0.1, Math.min(1.0, 1 - (concentrationRatio - 1/serviceCount)));
  }

  private getTopCostDrivers(operationBreakdown: Record<string, number>, limit: number): Array<{ service: string; operation: string; cost: number }> {
    const drivers: Array<{ service: string; operation: string; cost: number }> = [];

    // Parse service and operation from breakdown keys
    for (const [key, cost] of Object.entries(operationBreakdown)) {
      // Assuming key format: "service.operation"
      const parts = key.split('.');
      if (parts.length >= 2) {
        drivers.push({
          service: parts[0],
          operation: parts.slice(1).join('.'),
          cost
        });
      } else {
        drivers.push({
          service: 'unknown',
          operation: key,
          cost
        });
      }
    }

    return drivers
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);
  }

  private detectCostAnomalies(records: any[]): Array<{
    service: string;
    expectedCost: number;
    actualCost: number;
    currency: string;
    deviation: number;
  }> {
    if (records.length < 10) return [];

    const anomalies = [];
    const serviceGroups: Record<string, any[]> = {};

    // Group by service
    for (const record of records) {
      if (!serviceGroups[record.service]) {
        serviceGroups[record.service] = [];
      }
      serviceGroups[record.service].push(record);
    }

    // Check each service for anomalies
    for (const [service, serviceRecords] of Object.entries(serviceGroups)) {
      if (serviceRecords.length < 5) continue;

      const sortedRecords = serviceRecords.sort((a, b) => a.timestamp - b.timestamp);
      const recentRecords = sortedRecords.slice(-10);
      const olderRecords = sortedRecords.slice(-20, -10);

      if (olderRecords.length === 0) continue;

      const recentAvg = recentRecords.reduce((sum, r) => sum + r.cost, 0) / recentRecords.length;
      const olderAvg = olderRecords.reduce((sum, r) => sum + r.cost, 0) / olderRecords.length;

      const deviation = Math.abs(recentAvg - olderAvg) / olderAvg;

      if (deviation > 0.5) { // 50% deviation
        anomalies.push({
          service,
          expectedCost: olderAvg,
          actualCost: recentAvg,
          currency: recentRecords[0].currency || 'USD',
          deviation
        });
      }
    }

    return anomalies;
  }
}

// Export singleton instance
export const costTrackingIntegration = new CostTrackingIntegration();

// Export convenience functions
export const trackVLLMCost = costTrackingIntegration.trackVLLMCost.bind(costTrackingIntegration);
export const trackLangGraphCost = costTrackingIntegration.trackLangGraphCost.bind(costTrackingIntegration);
export const trackCrewAICost = costTrackingIntegration.trackCrewAICost.bind(costTrackingIntegration);
export const trackOpenAICost = costTrackingIntegration.trackOpenAICost.bind(costTrackingIntegration);
export const trackAnthropicCost = costTrackingIntegration.trackAnthropicCost.bind(costTrackingIntegration);
export const getRealtimeCostMetrics = costTrackingIntegration.getRealtimeCostMetrics.bind(costTrackingIntegration);
export const generateCostAlerts = costTrackingIntegration.generateCostAlerts.bind(costTrackingIntegration);

