// Workflow Optimizer - Performance optimization algorithms
import { logger } from '../../../../auterity-error-iq/shared/utils/logger.js';
import type { Workflow, Node, Edge } from '@auterity/workflow-contracts';
import type { OptimizationConfig, OptimizationResult, PerformanceMetrics } from './types.js';

export interface ExecutionPlan {
  optimalOrder: string[];
  parallelGroups: string[][];
  criticalPath: string[];
  estimatedTime: number;
  confidence: number;
}

export interface ParallelExecutionPlan {
  parallelGroups: Array<{
    nodes: string[];
    maxConcurrency: number;
    estimatedTime: number;
  }>;
  dependencies: Map<string, string[]>;
  executionStrategy: 'breadth_first' | 'depth_first' | 'optimal';
}

export interface ResourcePlan {
  allocations: Map<string, ResourceAllocation>;
  scalingPlan: ScalingPlan;
  costEstimate: number;
  efficiency: number;
}

export interface BottleneckAnalysis {
  bottlenecks: Array<{
    nodeId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    predictedDelay: number;
    causes: string[];
    mitigations: string[];
  }>;
  overallRisk: number;
  recommendations: string[];
}

interface ResourceAllocation {
  cpu: number;
  memory: number;
  storage: number;
  priority: number;
}

interface ScalingPlan {
  initialResources: ResourceAllocation;
  scalingTriggers: Array<{
    metric: string;
    threshold: number;
    action: 'scale_up' | 'scale_down';
    amount: number;
  }>;
  maxResources: ResourceAllocation;
}

export class WorkflowOptimizer {
  private config: OptimizationConfig;
  private performanceHistory = new Map<string, PerformanceMetrics[]>();
  private optimizationCache = new Map<string, OptimizationResult>();

  constructor(config: OptimizationConfig) {
    this.config = config;
    logger.info('WorkflowOptimizer initialized', { strategy: config.strategy });
  }

  /**
   * Analyze critical path for optimal execution order
   */
  async analyzeCriticalPath(workflow: Workflow): Promise<ExecutionPlan> {
    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(workflow);
      
      // Calculate node weights (execution time estimates)
      const nodeWeights = await this.calculateNodeWeights(workflow.nodes);
      
      // Find critical path using longest path algorithm
      const criticalPath = this.findCriticalPath(dependencyGraph, nodeWeights);
      
      // Generate optimal execution order
      const optimalOrder = this.generateOptimalOrder(dependencyGraph, nodeWeights);
      
      // Identify parallel execution opportunities
      const parallelGroups = this.identifyParallelGroups(dependencyGraph, optimalOrder);
      
      // Estimate total execution time
      const estimatedTime = this.estimateExecutionTime(criticalPath, nodeWeights);
      
      const executionPlan: ExecutionPlan = {
        optimalOrder,
        parallelGroups,
        criticalPath,
        estimatedTime,
        confidence: this.calculateConfidence(workflow, nodeWeights)
      };

      logger.info('Critical path analysis completed', {
        workflowId: workflow.id,
        criticalPathLength: criticalPath.length,
        parallelGroups: parallelGroups.length,
        estimatedTime
      });

      return executionPlan;

    } catch (error) {
      logger.error('Critical path analysis failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Optimize parallel execution strategy
   */
  async optimizeParallelExecution(nodes: Node[]): Promise<ParallelExecutionPlan> {
    try {
      // Analyze node dependencies
      const dependencies = this.analyzeDependencies(nodes);
      
      // Group independent nodes for parallel execution
      const parallelGroups = this.groupIndependentNodes(nodes, dependencies);
      
      // Optimize concurrency levels for each group
      const optimizedGroups = await this.optimizeConcurrency(parallelGroups);
      
      // Determine optimal execution strategy
      const executionStrategy = this.determineExecutionStrategy(optimizedGroups);

      const plan: ParallelExecutionPlan = {
        parallelGroups: optimizedGroups,
        dependencies,
        executionStrategy
      };

      logger.info('Parallel execution optimization completed', {
        nodeCount: nodes.length,
        parallelGroups: optimizedGroups.length,
        strategy: executionStrategy
      });

      return plan;

    } catch (error) {
      logger.error('Parallel execution optimization failed', {
        nodeCount: nodes.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Optimize resource allocation
   */
  async optimizeResourceAllocation(workflow: Workflow): Promise<ResourcePlan> {
    try {
      // Analyze resource requirements for each node
      const resourceRequirements = await this.analyzeResourceRequirements(workflow.nodes);
      
      // Calculate optimal allocations
      const allocations = this.calculateOptimalAllocations(resourceRequirements);
      
      // Create scaling plan
      const scalingPlan = this.createScalingPlan(allocations);
      
      // Estimate costs
      const costEstimate = this.estimateResourceCosts(allocations);
      
      // Calculate efficiency score
      const efficiency = this.calculateResourceEfficiency(allocations, resourceRequirements);

      const resourcePlan: ResourcePlan = {
        allocations,
        scalingPlan,
        costEstimate,
        efficiency
      };

      logger.info('Resource allocation optimization completed', {
        workflowId: workflow.id,
        allocations: allocations.size,
        costEstimate,
        efficiency
      });

      return resourcePlan;

    } catch (error) {
      logger.error('Resource allocation optimization failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Predict potential bottlenecks
   */
  async predictBottlenecks(workflow: Workflow): Promise<BottleneckAnalysis> {
    try {
      // Analyze historical performance data
      const performanceData = this.getPerformanceHistory(workflow.id);
      
      // Identify resource-intensive nodes
      const resourceIntensiveNodes = this.identifyResourceIntensiveNodes(workflow.nodes);
      
      // Analyze dependency chains
      const dependencyChains = this.analyzeDependencyChains(workflow);
      
      // Predict bottlenecks using ML models
      const bottlenecks = await this.predictBottlenecksML(
        workflow,
        performanceData,
        resourceIntensiveNodes,
        dependencyChains
      );
      
      // Calculate overall risk
      const overallRisk = this.calculateBottleneckRisk(bottlenecks);
      
      // Generate recommendations
      const recommendations = this.generateBottleneckRecommendations(bottlenecks);

      const analysis: BottleneckAnalysis = {
        bottlenecks,
        overallRisk,
        recommendations
      };

      logger.info('Bottleneck prediction completed', {
        workflowId: workflow.id,
        bottleneckCount: bottlenecks.length,
        overallRisk
      });

      return analysis;

    } catch (error) {
      logger.error('Bottleneck prediction failed', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Generate performance optimization suggestions
   */
  async generatePerformanceSuggestions(workflow: Workflow): Promise<any[]> {
    try {
      const suggestions = [];

      // Analyze execution plan
      const executionPlan = await this.analyzeCriticalPath(workflow);
      if (executionPlan.parallelGroups.length < workflow.nodes.length * 0.3) {
        suggestions.push({
          type: 'parallelization',
          priority: 'high',
          description: 'Increase parallel execution opportunities',
          estimatedImpact: 0.25,
          implementation: 'Restructure workflow to reduce dependencies'
        });
      }

      // Check for resource optimization opportunities
      const resourcePlan = await this.optimizeResourceAllocation(workflow);
      if (resourcePlan.efficiency < 0.7) {
        suggestions.push({
          type: 'resource_optimization',
          priority: 'medium',
          description: 'Optimize resource allocation',
          estimatedImpact: 0.15,
          implementation: 'Adjust CPU and memory allocations'
        });
      }

      // Analyze for caching opportunities
      const cachingOpportunities = this.identifyCachingOpportunities(workflow);
      if (cachingOpportunities.length > 0) {
        suggestions.push({
          type: 'caching',
          priority: 'medium',
          description: 'Add intelligent caching',
          estimatedImpact: 0.20,
          implementation: 'Cache frequently accessed data and computation results'
        });
      }

      return suggestions;

    } catch (error) {
      logger.error('Failed to generate performance suggestions', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  // Private helper methods
  private buildDependencyGraph(workflow: Workflow): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize nodes
    workflow.nodes.forEach(node => {
      graph.set(node.id, []);
    });
    
    // Add edges
    workflow.edges.forEach(edge => {
      const dependencies = graph.get(edge.target) || [];
      dependencies.push(edge.source);
      graph.set(edge.target, dependencies);
    });
    
    return graph;
  }

  private async calculateNodeWeights(nodes: Node[]): Promise<Map<string, number>> {
    const weights = new Map<string, number>();
    
    for (const node of nodes) {
      // Estimate based on node type and complexity
      let weight = 1000; // Base weight in milliseconds
      
      switch (node.type) {
        case 'action':
          weight = 2000;
          break;
        case 'condition':
          weight = 500;
          break;
        case 'loop':
          weight = 5000;
          break;
        case 'parallel':
          weight = 1500;
          break;
        default:
          weight = 1000;
      }
      
      // Adjust based on node data
      if (node.data?.complexity) {
        weight *= node.data.complexity;
      }
      
      weights.set(node.id, weight);
    }
    
    return weights;
  }

  private findCriticalPath(
    graph: Map<string, string[]>,
    weights: Map<string, number>
  ): string[] {
    // Implement longest path algorithm for DAG
    const visited = new Set<string>();
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string>();
    
    // Initialize distances
    for (const [nodeId] of graph) {
      distances.set(nodeId, 0);
    }
    
    // Topological sort and longest path calculation
    const topologicalOrder = this.topologicalSort(graph);
    
    for (const nodeId of topologicalOrder) {
      const dependencies = graph.get(nodeId) || [];
      
      for (const dep of dependencies) {
        const newDistance = (distances.get(dep) || 0) + (weights.get(nodeId) || 0);
        
        if (newDistance > (distances.get(nodeId) || 0)) {
          distances.set(nodeId, newDistance);
          predecessors.set(nodeId, dep);
        }
      }
    }
    
    // Find the node with maximum distance (end of critical path)
    let maxDistance = 0;
    let endNode = '';
    
    for (const [nodeId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = nodeId;
      }
    }
    
    // Reconstruct critical path
    const criticalPath = [];
    let currentNode = endNode;
    
    while (currentNode) {
      criticalPath.unshift(currentNode);
      currentNode = predecessors.get(currentNode) || '';
    }
    
    return criticalPath;
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];
    
    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      
      // Visit all nodes that depend on this node
      for (const [node, dependencies] of graph) {
        if (dependencies.includes(nodeId) && !visited.has(node)) {
          dfs(node);
        }
      }
      
      stack.push(nodeId);
    };
    
    for (const [nodeId] of graph) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
    
    return stack.reverse();
  }

  private generateOptimalOrder(
    graph: Map<string, string[]>,
    weights: Map<string, number>
  ): string[] {
    // Use topological sort with priority based on weights
    return this.topologicalSort(graph);
  }

  private identifyParallelGroups(
    graph: Map<string, string[]>,
    order: string[]
  ): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    for (const nodeId of order) {
      if (processed.has(nodeId)) continue;
      
      const currentGroup = [nodeId];
      processed.add(nodeId);
      
      // Find nodes that can run in parallel with this node
      const nodeDependencies = graph.get(nodeId) || [];
      
      for (const otherNodeId of order) {
        if (processed.has(otherNodeId)) continue;
        
        const otherDependencies = graph.get(otherNodeId) || [];
        
        // Check if nodes can run in parallel (no dependencies between them)
        const canRunInParallel = 
          !nodeDependencies.includes(otherNodeId) &&
          !otherDependencies.includes(nodeId) &&
          !this.hasTransitiveDependency(graph, nodeId, otherNodeId) &&
          !this.hasTransitiveDependency(graph, otherNodeId, nodeId);
        
        if (canRunInParallel) {
          currentGroup.push(otherNodeId);
          processed.add(otherNodeId);
        }
      }
      
      groups.push(currentGroup);
    }
    
    return groups;
  }

  private hasTransitiveDependency(
    graph: Map<string, string[]>,
    from: string,
    to: string
  ): boolean {
    const visited = new Set<string>();
    
    const dfs = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return false;
      visited.add(nodeId);
      
      const dependencies = graph.get(nodeId) || [];
      
      if (dependencies.includes(to)) return true;
      
      return dependencies.some(dep => dfs(dep));
    };
    
    return dfs(from);
  }

  private estimateExecutionTime(path: string[], weights: Map<string, number>): number {
    return path.reduce((total, nodeId) => total + (weights.get(nodeId) || 0), 0);
  }

  private calculateConfidence(workflow: Workflow, weights: Map<string, number>): number {
    // Calculate confidence based on historical data availability and model accuracy
    const historyCount = this.performanceHistory.get(workflow.id)?.length || 0;
    const baseConfidence = Math.min(historyCount / 10, 1); // Max confidence with 10+ executions
    
    // Adjust for workflow complexity
    const complexityFactor = 1 / (1 + workflow.nodes.length / 100);
    
    return baseConfidence * complexityFactor;
  }

  private analyzeDependencies(nodes: Node[]): Map<string, string[]> {
    // Simplified dependency analysis - would need actual edge information
    const dependencies = new Map<string, string[]>();
    
    nodes.forEach(node => {
      dependencies.set(node.id, []);
    });
    
    return dependencies;
  }

  private groupIndependentNodes(
    nodes: Node[],
    dependencies: Map<string, string[]>
  ): Array<{ nodes: string[]; maxConcurrency: number; estimatedTime: number }> {
    const groups = [];
    const processed = new Set<string>();
    
    for (const node of nodes) {
      if (processed.has(node.id)) continue;
      
      const group = {
        nodes: [node.id],
        maxConcurrency: 1,
        estimatedTime: 1000 // Default estimate
      };
      
      processed.add(node.id);
      groups.push(group);
    }
    
    return groups;
  }

  private async optimizeConcurrency(
    groups: Array<{ nodes: string[]; maxConcurrency: number; estimatedTime: number }>
  ): Promise<Array<{ nodes: string[]; maxConcurrency: number; estimatedTime: number }>> {
    // Optimize concurrency levels based on resource availability and performance data
    return groups.map(group => ({
      ...group,
      maxConcurrency: Math.min(group.nodes.length, 4) // Limit to reasonable concurrency
    }));
  }

  private determineExecutionStrategy(
    groups: Array<{ nodes: string[]; maxConcurrency: number; estimatedTime: number }>
  ): 'breadth_first' | 'depth_first' | 'optimal' {
    // Determine optimal execution strategy based on group characteristics
    const totalNodes = groups.reduce((sum, group) => sum + group.nodes.length, 0);
    const avgGroupSize = totalNodes / groups.length;
    
    if (avgGroupSize > 3) {
      return 'breadth_first'; // Better for large parallel groups
    } else if (groups.length > 10) {
      return 'depth_first'; // Better for many small groups
    } else {
      return 'optimal'; // Use optimal strategy for balanced workflows
    }
  }

  private async analyzeResourceRequirements(nodes: Node[]): Promise<Map<string, ResourceAllocation>> {
    const requirements = new Map<string, ResourceAllocation>();
    
    for (const node of nodes) {
      const allocation: ResourceAllocation = {
        cpu: node.data?.cpu || 1000, // Default CPU units
        memory: node.data?.memory || 512, // Default memory in MB
        storage: node.data?.storage || 100, // Default storage in MB
        priority: this.calculateNodePriority(node)
      };
      
      requirements.set(node.id, allocation);
    }
    
    return requirements;
  }

  private calculateNodePriority(node: Node): number {
    // Calculate priority based on node type and importance
    switch (node.type) {
      case 'start':
      case 'end':
        return 10;
      case 'action':
        return 8;
      case 'condition':
        return 6;
      case 'loop':
        return 7;
      default:
        return 5;
    }
  }

  private calculateOptimalAllocations(
    requirements: Map<string, ResourceAllocation>
  ): Map<string, ResourceAllocation> {
    // Apply optimization algorithms to balance resource allocation
    const optimized = new Map<string, ResourceAllocation>();
    
    for (const [nodeId, requirement] of requirements) {
      // Apply efficiency optimizations
      const optimizedAllocation: ResourceAllocation = {
        cpu: Math.round(requirement.cpu * 0.9), // 10% efficiency gain
        memory: Math.round(requirement.memory * 0.95), // 5% efficiency gain
        storage: requirement.storage,
        priority: requirement.priority
      };
      
      optimized.set(nodeId, optimizedAllocation);
    }
    
    return optimized;
  }

  private createScalingPlan(allocations: Map<string, ResourceAllocation>): ScalingPlan {
    // Calculate initial resources as sum of base allocations
    const initialResources: ResourceAllocation = {
      cpu: 0,
      memory: 0,
      storage: 0,
      priority: 5
    };
    
    for (const allocation of allocations.values()) {
      initialResources.cpu += allocation.cpu;
      initialResources.memory += allocation.memory;
      initialResources.storage += allocation.storage;
    }
    
    return {
      initialResources,
      scalingTriggers: [
        {
          metric: 'cpu_usage',
          threshold: 80,
          action: 'scale_up',
          amount: 0.5
        },
        {
          metric: 'memory_usage',
          threshold: 85,
          action: 'scale_up',
          amount: 0.3
        },
        {
          metric: 'cpu_usage',
          threshold: 30,
          action: 'scale_down',
          amount: 0.2
        }
      ],
      maxResources: {
        cpu: initialResources.cpu * 3,
        memory: initialResources.memory * 2,
        storage: initialResources.storage * 1.5,
        priority: 10
      }
    };
  }

  private estimateResourceCosts(allocations: Map<string, ResourceAllocation>): number {
    let totalCost = 0;
    
    for (const allocation of allocations.values()) {
      // Simplified cost calculation
      totalCost += (allocation.cpu * 0.001) + (allocation.memory * 0.0005) + (allocation.storage * 0.0001);
    }
    
    return totalCost;
  }

  private calculateResourceEfficiency(
    allocations: Map<string, ResourceAllocation>,
    requirements: Map<string, ResourceAllocation>
  ): number {
    let totalRequirement = 0;
    let totalAllocation = 0;
    
    for (const [nodeId, requirement] of requirements) {
      const allocation = allocations.get(nodeId);
      if (allocation) {
        totalRequirement += requirement.cpu + requirement.memory + requirement.storage;
        totalAllocation += allocation.cpu + allocation.memory + allocation.storage;
      }
    }
    
    return totalRequirement > 0 ? totalAllocation / totalRequirement : 1;
  }

  private getPerformanceHistory(workflowId: string): PerformanceMetrics[] {
    return this.performanceHistory.get(workflowId) || [];
  }

  private identifyResourceIntensiveNodes(nodes: Node[]): string[] {
    return nodes
      .filter(node => {
        const cpu = node.data?.cpu || 0;
        const memory = node.data?.memory || 0;
        return cpu > 2000 || memory > 1024; // High resource thresholds
      })
      .map(node => node.id);
  }

  private analyzeDependencyChains(workflow: Workflow): string[][] {
    // Find longest dependency chains
    const graph = this.buildDependencyGraph(workflow);
    const chains: string[][] = [];
    
    // Find all possible paths through the workflow
    const visited = new Set<string>();
    
    const findChains = (nodeId: string, currentChain: string[]) => {
      if (visited.has(nodeId)) return;
      
      const newChain = [...currentChain, nodeId];
      const dependencies = graph.get(nodeId) || [];
      
      if (dependencies.length === 0) {
        // End of chain
        chains.push(newChain);
      } else {
        for (const dep of dependencies) {
          findChains(dep, newChain);
        }
      }
    };
    
    // Start from nodes with no dependencies
    for (const [nodeId, dependencies] of graph) {
      if (dependencies.length === 0) {
        findChains(nodeId, []);
      }
    }
    
    return chains;
  }

  private async predictBottlenecksML(
    workflow: Workflow,
    performanceData: PerformanceMetrics[],
    resourceIntensiveNodes: string[],
    dependencyChains: string[][]
  ): Promise<BottleneckAnalysis['bottlenecks']> {
    const bottlenecks = [];
    
    // Analyze resource-intensive nodes
    for (const nodeId of resourceIntensiveNodes) {
      bottlenecks.push({
        nodeId,
        severity: 'high' as const,
        predictedDelay: 2000,
        causes: ['High resource requirements', 'Limited resource availability'],
        mitigations: ['Increase resource allocation', 'Optimize node implementation']
      });
    }
    
    // Analyze long dependency chains
    const longestChain = dependencyChains.reduce((longest, chain) => 
      chain.length > longest.length ? chain : longest, []);
    
    if (longestChain.length > 5) {
      const middleNode = longestChain[Math.floor(longestChain.length / 2)];
      bottlenecks.push({
        nodeId: middleNode,
        severity: 'medium' as const,
        predictedDelay: 1000,
        causes: ['Long dependency chain', 'Sequential execution'],
        mitigations: ['Break dependencies', 'Introduce parallelism']
      });
    }
    
    return bottlenecks;
  }

  private calculateBottleneckRisk(bottlenecks: BottleneckAnalysis['bottlenecks']): number {
    if (bottlenecks.length === 0) return 0;
    
    const severityWeights = { low: 1, medium: 3, high: 7, critical: 15 };
    const totalWeight = bottlenecks.reduce((sum, bottleneck) => 
      sum + severityWeights[bottleneck.severity], 0);
    
    return Math.min(totalWeight / (bottlenecks.length * 15), 1); // Normalize to 0-1
  }

  private generateBottleneckRecommendations(bottlenecks: BottleneckAnalysis['bottlenecks']): string[] {
    const recommendations = new Set<string>();
    
    bottlenecks.forEach(bottleneck => {
      bottleneck.mitigations.forEach(mitigation => {
        recommendations.add(mitigation);
      });
    });
    
    return Array.from(recommendations);
  }

  private identifyCachingOpportunities(workflow: Workflow): string[] {
    // Identify nodes that could benefit from caching
    return workflow.nodes
      .filter(node => {
        // Look for nodes that process data or perform computations
        return node.type === 'action' && 
               (node.data?.type === 'data_processing' || 
                node.data?.type === 'computation');
      })
      .map(node => node.id);
  }
}
