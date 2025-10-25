// Cost Optimization Engine - Financial optimization algorithms
import { logger } from '../../../../auterity-error-iq/shared/utils/logger.js';
import type { Workflow, Node } from '@auterity/workflow-contracts';
import type { OptimizationConfig, CostMetrics } from './types.js';

export interface CostAnalysis {
  totalCost: number;
  costBreakdown: Map<string, number>;
  optimizationPotential: number;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  type: 'resource_reduction' | 'instance_optimization' | 'scheduling' | 'caching';
  description: string;
  estimatedSavings: number;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CostForecast {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  projectedCost: number;
  confidence: number;
  factors: string[];
  optimizedCost: number;
  savings: number;
}

export interface ResourceCostModel {
  cpu: { baseRate: number; scalingFactor: number };
  memory: { baseRate: number; scalingFactor: number };
  storage: { baseRate: number; scalingFactor: number };
  network: { baseRate: number; transferRate: number };
  compute: { instanceTypes: Map<string, number> };
}

export class CostOptimizationEngine {
  private config: OptimizationConfig;
  private costModel: ResourceCostModel;
  private historicalCosts = new Map<string, CostMetrics[]>();

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.costModel = this.initializeCostModel();
    logger.info('CostOptimizationEngine initialized');
  }

  /**
   * Analyze current workflow costs
   */
  async analyzeCosts(workflow: Workflow): Promise<CostAnalysis> {
    try {
      // Calculate resource costs for each node
      const nodeCosts = new Map<string, number>();
      let totalCost = 0;

      for (const node of workflow.nodes) {
        const cost = await this.calculateNodeCost(node);
        nodeCosts.set(node.id, cost);
        totalCost += cost;
      }

      // Calculate optimization potential
      const optimizationPotential = await this.calculateOptimizationPotential(workflow);

      // Generate cost recommendations
      const recommendations = await this.generateCostRecommendations(workflow, nodeCosts);

      const analysis: CostAnalysis = {
        totalCost,
        costBreakdown: nodeCosts,
        optimizationPotential,
        recommendations
      };

      logger.info('Cost analysis completed', {
        workflowId: workflow.id,
        totalCost,
        optimizationPotential,
        recommendationCount: recommendations.length
      });

      return analysis;

    } catch (error) {
      logger.error('Cost analysis failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Optimize resource costs
   */
  async optimizeResourceCosts(workflow: Workflow): Promise<{
    originalCost: number;
    optimizedCost: number;
    savings: number;
    changes: Array<{ nodeId: string; change: string; impact: number }>;
  }> {
    try {
      const originalCost = await this.calculateWorkflowCost(workflow);
      const optimizations = [];
      let optimizedCost = originalCost;

      // Analyze each node for cost optimization opportunities
      for (const node of workflow.nodes) {
        const nodeOptimizations = await this.optimizeNodeCosts(node);
        optimizations.push(...nodeOptimizations);
        
        // Calculate savings from optimizations
        const nodeSavings = nodeOptimizations.reduce((sum, opt) => sum + opt.impact, 0);
        optimizedCost -= nodeSavings;
      }

      const savings = originalCost - optimizedCost;

      logger.info('Resource cost optimization completed', {
        workflowId: workflow.id,
        originalCost,
        optimizedCost,
        savings,
        savingsPercentage: (savings / originalCost) * 100
      });

      return {
        originalCost,
        optimizedCost,
        savings,
        changes: optimizations
      };

    } catch (error) {
      logger.error('Resource cost optimization failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate cost forecasts
   */
  async generateCostForecast(
    workflow: Workflow,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<CostForecast> {
    try {
      // Get historical cost data
      const historicalData = this.getHistoricalCosts(workflow.id);
      
      // Calculate current cost
      const currentCost = await this.calculateWorkflowCost(workflow);
      
      // Calculate execution frequency based on period
      const executionFrequency = this.calculateExecutionFrequency(period);
      
      // Project costs based on usage patterns
      const projectedCost = currentCost * executionFrequency;
      
      // Calculate confidence based on data availability
      const confidence = Math.min(historicalData.length / 30, 1); // Max confidence with 30+ data points
      
      // Identify cost factors
      const factors = this.identifyCostFactors(workflow);
      
      // Calculate optimized cost potential
      const optimization = await this.optimizeResourceCosts(workflow);
      const optimizedCost = (optimization.optimizedCost / optimization.originalCost) * projectedCost;
      const savings = projectedCost - optimizedCost;

      const forecast: CostForecast = {
        period,
        projectedCost,
        confidence,
        factors,
        optimizedCost,
        savings
      };

      logger.info('Cost forecast generated', {
        workflowId: workflow.id,
        period,
        projectedCost,
        optimizedCost,
        savings
      });

      return forecast;

    } catch (error) {
      logger.error('Cost forecast generation failed', {
        workflowId: workflow.id,
        period,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Optimize instance types
   */
  async optimizeInstanceTypes(workflow: Workflow): Promise<Map<string, {
    currentInstance: string;
    recommendedInstance: string;
    costSavings: number;
    performanceImpact: number;
  }>> {
    try {
      const optimizations = new Map<string, {
        currentInstance: string;
        recommendedInstance: string;
        costSavings: number;
        performanceImpact: number;
      }>();

      for (const node of workflow.nodes) {
        const currentInstance = node.data?.instanceType || 'default';
        const resourceRequirements = this.analyzeNodeResourceRequirements(node);
        
        // Find optimal instance type
        const recommendedInstance = this.findOptimalInstanceType(resourceRequirements);
        
        if (recommendedInstance !== currentInstance) {
          const currentCost = this.getInstanceCost(currentInstance);
          const recommendedCost = this.getInstanceCost(recommendedInstance);
          const costSavings = currentCost - recommendedCost;
          
          // Estimate performance impact
          const performanceImpact = this.estimatePerformanceImpact(
            currentInstance,
            recommendedInstance,
            resourceRequirements
          );

          optimizations.set(node.id, {
            currentInstance,
            recommendedInstance,
            costSavings,
            performanceImpact
          });
        }
      }

      logger.info('Instance type optimization completed', {
        workflowId: workflow.id,
        optimizationCount: optimizations.size
      });

      return optimizations;

    } catch (error) {
      logger.error('Instance type optimization failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find cost-effective alternatives
   */
  async findCostEffectiveAlternatives(workflow: Workflow): Promise<{
    alternatives: Array<{
      description: string;
      costReduction: number;
      implementationEffort: 'low' | 'medium' | 'high';
      riskLevel: 'low' | 'medium' | 'high';
    }>;
    totalPotentialSavings: number;
  }> {
    try {
      const alternatives = [];
      let totalPotentialSavings = 0;

      // Spot instance alternatives
      const spotSavings = await this.analyzeSpotInstanceSavings(workflow);
      if (spotSavings > 0) {
        alternatives.push({
          description: 'Use spot instances for non-critical workloads',
          costReduction: spotSavings,
          implementationEffort: 'medium' as const,
          riskLevel: 'medium' as const
        });
        totalPotentialSavings += spotSavings;
      }

      // Reserved instance alternatives
      const reservedSavings = await this.analyzeReservedInstanceSavings(workflow);
      if (reservedSavings > 0) {
        alternatives.push({
          description: 'Purchase reserved instances for predictable workloads',
          costReduction: reservedSavings,
          implementationEffort: 'low' as const,
          riskLevel: 'low' as const
        });
        totalPotentialSavings += reservedSavings;
      }

      // Serverless alternatives
      const serverlessSavings = await this.analyzeServerlessAlternatives(workflow);
      if (serverlessSavings > 0) {
        alternatives.push({
          description: 'Migrate suitable workloads to serverless architecture',
          costReduction: serverlessSavings,
          implementationEffort: 'high' as const,
          riskLevel: 'medium' as const
        });
        totalPotentialSavings += serverlessSavings;
      }

      // Auto-scaling optimizations
      const autoScalingSavings = await this.analyzeAutoScalingSavings(workflow);
      if (autoScalingSavings > 0) {
        alternatives.push({
          description: 'Implement intelligent auto-scaling',
          costReduction: autoScalingSavings,
          implementationEffort: 'medium' as const,
          riskLevel: 'low' as const
        });
        totalPotentialSavings += autoScalingSavings;
      }

      logger.info('Cost-effective alternatives analysis completed', {
        workflowId: workflow.id,
        alternativeCount: alternatives.length,
        totalPotentialSavings
      });

      return {
        alternatives,
        totalPotentialSavings
      };

    } catch (error) {
      logger.error('Cost-effective alternatives analysis failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Private helper methods
  private initializeCostModel(): ResourceCostModel {
    return {
      cpu: { baseRate: 0.0416, scalingFactor: 1.0 }, // $0.0416 per vCPU hour
      memory: { baseRate: 0.0045, scalingFactor: 1.0 }, // $0.0045 per GB hour
      storage: { baseRate: 0.0001, scalingFactor: 1.0 }, // $0.0001 per GB hour
      network: { baseRate: 0.01, transferRate: 0.09 }, // $0.01 base + $0.09 per GB
      compute: {
        instanceTypes: new Map([
          ['t3.micro', 0.0104],
          ['t3.small', 0.0208],
          ['t3.medium', 0.0416],
          ['t3.large', 0.0832],
          ['m5.large', 0.096],
          ['m5.xlarge', 0.192],
          ['c5.large', 0.085],
          ['c5.xlarge', 0.17],
          ['r5.large', 0.126],
          ['r5.xlarge', 0.252]
        ])
      }
    };
  }

  private async calculateNodeCost(node: Node): Promise<number> {
    let cost = 0;

    // CPU cost
    const cpuUnits = node.data?.cpu || 1000;
    const cpuHours = cpuUnits / 1000; // Convert to vCPU hours
    cost += cpuHours * this.costModel.cpu.baseRate;

    // Memory cost
    const memoryMB = node.data?.memory || 512;
    const memoryGB = memoryMB / 1024;
    cost += memoryGB * this.costModel.memory.baseRate;

    // Storage cost
    const storageGB = (node.data?.storage || 100) / 1024;
    cost += storageGB * this.costModel.storage.baseRate;

    // Instance type cost
    const instanceType = node.data?.instanceType || 't3.micro';
    const instanceCost = this.costModel.compute.instanceTypes.get(instanceType) || 0.0104;
    cost += instanceCost;

    return cost;
  }

  private async calculateOptimizationPotential(workflow: Workflow): Promise<number> {
    let potential = 0;

    for (const node of workflow.nodes) {
      // Check for over-provisioned resources
      const utilization = node.data?.utilization || 0.7;
      if (utilization < 0.5) {
        const currentCost = await this.calculateNodeCost(node);
        potential += currentCost * 0.3; // 30% potential savings
      }

      // Check for expensive instance types
      const instanceType = node.data?.instanceType || 't3.micro';
      if (instanceType.includes('large') || instanceType.includes('xlarge')) {
        const currentCost = await this.calculateNodeCost(node);
        potential += currentCost * 0.2; // 20% potential savings
      }
    }

    return potential;
  }

  private async generateCostRecommendations(
    workflow: Workflow,
    nodeCosts: Map<string, number>
  ): Promise<CostRecommendation[]> {
    const recommendations: CostRecommendation[] = [];

    // Analyze high-cost nodes
    const sortedCosts = Array.from(nodeCosts.entries())
      .sort(([, a], [, b]) => b - a);

    // Resource reduction recommendations
    for (const [nodeId, cost] of sortedCosts.slice(0, 3)) {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (node && cost > 0.1) { // Focus on nodes costing more than $0.10
        recommendations.push({
          type: 'resource_reduction',
          description: `Optimize resource allocation for node ${nodeId}`,
          estimatedSavings: cost * 0.25,
          implementation: 'Right-size CPU and memory allocation based on actual usage',
          priority: 'high',
          riskLevel: 'low'
        });
      }
    }

    // Instance optimization recommendations
    const instanceOptimizations = await this.optimizeInstanceTypes(workflow);
    for (const [nodeId, optimization] of instanceOptimizations) {
      if (optimization.costSavings > 0.01) {
        recommendations.push({
          type: 'instance_optimization',
          description: `Switch to ${optimization.recommendedInstance} for node ${nodeId}`,
          estimatedSavings: optimization.costSavings,
          implementation: `Change instance type from ${optimization.currentInstance}`,
          priority: optimization.costSavings > 0.05 ? 'high' : 'medium',
          riskLevel: optimization.performanceImpact < -0.1 ? 'medium' : 'low'
        });
      }
    }

    // Scheduling recommendations
    const totalCost = Array.from(nodeCosts.values()).reduce((sum, cost) => sum + cost, 0);
    if (totalCost > 1.0) { // $1.00 threshold
      recommendations.push({
        type: 'scheduling',
        description: 'Implement off-peak scheduling for non-critical workflows',
        estimatedSavings: totalCost * 0.15,
        implementation: 'Schedule non-critical workloads during off-peak hours',
        priority: 'medium',
        riskLevel: 'low'
      });
    }

    return recommendations;
  }

  private async calculateWorkflowCost(workflow: Workflow): Promise<number> {
    let totalCost = 0;
    for (const node of workflow.nodes) {
      totalCost += await this.calculateNodeCost(node);
    }
    return totalCost;
  }

  private async optimizeNodeCosts(node: Node): Promise<Array<{
    nodeId: string;
    change: string;
    impact: number;
  }>> {
    const optimizations = [];

    // CPU optimization
    const cpuUnits = node.data?.cpu || 1000;
    const utilization = node.data?.utilization || 0.7;
    if (utilization < 0.6 && cpuUnits > 500) {
      const reduction = cpuUnits * 0.2;
      const savings = (reduction / 1000) * this.costModel.cpu.baseRate;
      optimizations.push({
        nodeId: node.id,
        change: `Reduce CPU allocation by ${reduction} units`,
        impact: savings
      });
    }

    // Memory optimization
    const memoryMB = node.data?.memory || 512;
    if (utilization < 0.6 && memoryMB > 256) {
      const reduction = memoryMB * 0.15;
      const savings = (reduction / 1024) * this.costModel.memory.baseRate;
      optimizations.push({
        nodeId: node.id,
        change: `Reduce memory allocation by ${reduction}MB`,
        impact: savings
      });
    }

    return optimizations;
  }

  private getHistoricalCosts(workflowId: string): CostMetrics[] {
    return this.historicalCosts.get(workflowId) || [];
  }

  private calculateExecutionFrequency(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): number {
    switch (period) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
      default: return 1;
    }
  }

  private identifyCostFactors(workflow: Workflow): string[] {
    const factors = [];

    // Check for high-cost components
    const hasLargeInstances = workflow.nodes.some(node => 
      (node.data?.instanceType || '').includes('large'));
    if (hasLargeInstances) {
      factors.push('Large instance types');
    }

    const hasHighCPU = workflow.nodes.some(node => 
      (node.data?.cpu || 0) > 2000);
    if (hasHighCPU) {
      factors.push('High CPU requirements');
    }

    const hasHighMemory = workflow.nodes.some(node => 
      (node.data?.memory || 0) > 1024);
    if (hasHighMemory) {
      factors.push('High memory requirements');
    }

    // Check for cost-driving patterns
    if (workflow.nodes.length > 10) {
      factors.push('Complex workflow with many nodes');
    }

    return factors;
  }

  private analyzeNodeResourceRequirements(node: Node): {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  } {
    return {
      cpu: node.data?.cpu || 1000,
      memory: node.data?.memory || 512,
      storage: node.data?.storage || 100,
      network: node.data?.network || 100
    };
  }

  private findOptimalInstanceType(requirements: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  }): string {
    // Simple logic to recommend instance type based on requirements
    if (requirements.memory > 2048) {
      return 'r5.large'; // Memory optimized
    } else if (requirements.cpu > 2000) {
      return 'c5.large'; // Compute optimized
    } else if (requirements.cpu > 1000 || requirements.memory > 1024) {
      return 'm5.large'; // General purpose
    } else {
      return 't3.medium'; // Burstable performance
    }
  }

  private getInstanceCost(instanceType: string): number {
    return this.costModel.compute.instanceTypes.get(instanceType) || 0.0104;
  }

  private estimatePerformanceImpact(
    currentInstance: string,
    recommendedInstance: string,
    requirements: { cpu: number; memory: number; storage: number; network: number }
  ): number {
    const currentCost = this.getInstanceCost(currentInstance);
    const recommendedCost = this.getInstanceCost(recommendedInstance);
    
    // Rough estimation: performance impact correlates with cost difference
    return (recommendedCost - currentCost) / currentCost;
  }

  private async analyzeSpotInstanceSavings(workflow: Workflow): Promise<number> {
    // Estimate savings from using spot instances (typically 50-90% savings)
    const totalCost = await this.calculateWorkflowCost(workflow);
    const spotEligibleNodes = workflow.nodes.filter(node => 
      node.data?.priority !== 'high' && node.data?.canUseSpot !== false
    );
    
    const spotEligibleCost = spotEligibleNodes.length / workflow.nodes.length * totalCost;
    return spotEligibleCost * 0.7; // Average 70% savings with spot instances
  }

  private async analyzeReservedInstanceSavings(workflow: Workflow): Promise<number> {
    // Estimate savings from reserved instances (typically 30-60% savings)
    const totalCost = await this.calculateWorkflowCost(workflow);
    const predictableNodes = workflow.nodes.filter(node => 
      node.data?.usage === 'predictable' || node.data?.schedulable === true
    );
    
    const reservableNodeCost = predictableNodes.length / workflow.nodes.length * totalCost;
    return reservableNodeCost * 0.45; // Average 45% savings with reserved instances
  }

  private async analyzeServerlessAlternatives(workflow: Workflow): Promise<number> {
    // Estimate savings from serverless architecture
    const totalCost = await this.calculateWorkflowCost(workflow);
    const serverlessEligibleNodes = workflow.nodes.filter(node => 
      node.data?.runtime && node.data.runtime < 15 * 60 * 1000 && // Under 15 minutes
      node.data?.stateless !== false
    );
    
    const serverlessEligibleCost = serverlessEligibleNodes.length / workflow.nodes.length * totalCost;
    return serverlessEligibleCost * 0.3; // Potential 30% savings with serverless
  }

  private async analyzeAutoScalingSavings(workflow: Workflow): Promise<number> {
    // Estimate savings from auto-scaling
    const totalCost = await this.calculateWorkflowCost(workflow);
    const scalableNodes = workflow.nodes.filter(node => 
      node.data?.scalable !== false && (node.data?.utilization || 0.7) < 0.8
    );
    
    const scalableNodeCost = scalableNodes.length / workflow.nodes.length * totalCost;
    return scalableNodeCost * 0.25; // Potential 25% savings with auto-scaling
  }
}
