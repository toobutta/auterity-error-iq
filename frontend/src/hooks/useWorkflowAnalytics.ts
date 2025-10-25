import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types/workflow';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'success' | 'failed' | 'timeout';
  nodeExecutions: NodeExecution[];
  performance: PerformanceMetrics;
}

interface NodeExecution {
  nodeId: string;
  nodeName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'failed' | 'skipped';
  inputSize: number;
  outputSize: number;
  error?: string;
}

interface PerformanceMetrics {
  totalExecutionTime: number;
  averageNodeTime: number;
  slowestNode: string;
  fastestNode: string;
  memoryPeak: number;
  cpuAverage: number;
}

interface WorkflowAnalytics {
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  failureRate: number;
  mostFrequentErrors: ErrorFrequency[];
  bottleneckNodes: BottleneckNode[];
  performanceTrends: PerformanceTrend[];
  optimizationOpportunities: OptimizationOpportunity[];
}

interface ErrorFrequency {
  error: string;
  count: number;
  percentage: number;
  affectedNodes: string[];
}

interface BottleneckNode {
  nodeId: string;
  nodeName: string;
  averageExecutionTime: number;
  executionCount: number;
  impactScore: number;
}

interface PerformanceTrend {
  date: string;
  averageTime: number;
  successRate: number;
  executionCount: number;
}

interface OptimizationOpportunity {
  type: 'parallelization' | 'caching' | 'optimization' | 'removal';
  nodeId: string;
  description: string;
  potentialImprovement: number;
  confidence: number;
}

interface UseWorkflowAnalyticsProps {
  workflowId: string;
  executions: WorkflowExecution[];
  nodes: Node<NodeData>[];
  edges: Edge[];
}

export const useWorkflowAnalytics = ({
  workflowId,
  executions,
  nodes,
  edges
}: UseWorkflowAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<WorkflowAnalytics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisRef = useRef<WorkflowAnalytics | null>(null);

  // Calculate comprehensive analytics
  const calculateAnalytics = useCallback(() => {
    if (executions.length === 0) return null;

    setIsAnalyzing(true);

    try {
      // Basic metrics
      const executionCount = executions.length;
      const successfulExecutions = executions.filter(e => e.status === 'success');
      const successRate = (successfulExecutions.length / executionCount) * 100;

      // Execution time analysis
      const executionTimes = executions.map(e => e.duration).sort((a, b) => a - b);
      const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
      const medianExecutionTime = executionTimes[Math.floor(executionTimes.length / 2)];
      const p95ExecutionTime = executionTimes[Math.floor(executionTimes.length * 0.95)];

      // Error analysis
      const failedExecutions = executions.filter(e => e.status === 'failed');
      const failureRate = (failedExecutions.length / executionCount) * 100;

      const errorFrequency = analyzeErrorPatterns(failedExecutions);

      // Bottleneck analysis
      const bottleneckNodes = identifyBottlenecks(executions, nodes);

      // Performance trends (last 30 days)
      const performanceTrends = calculatePerformanceTrends(executions);

      // Optimization opportunities
      const optimizationOpportunities = identifyOptimizationOpportunities(
        executions,
        nodes,
        edges,
        bottleneckNodes
      );

      const analyticsResult: WorkflowAnalytics = {
        executionCount,
        successRate,
        averageExecutionTime,
        medianExecutionTime,
        p95ExecutionTime,
        failureRate,
        mostFrequentErrors: errorFrequency,
        bottleneckNodes,
        performanceTrends,
        optimizationOpportunities
      };

      analysisRef.current = analyticsResult;
      setAnalytics(analyticsResult);
      return analyticsResult;

    } finally {
      setIsAnalyzing(false);
    }
  }, [executions, nodes, edges]);

  // Analyze error patterns
  const analyzeErrorPatterns = useCallback((failedExecutions: WorkflowExecution[]): ErrorFrequency[] => {
    const errorMap = new Map<string, { count: number; nodes: Set<string> }>();

    failedExecutions.forEach(execution => {
      execution.nodeExecutions.forEach(nodeExec => {
        if (nodeExec.status === 'failed' && nodeExec.error) {
          const existing = errorMap.get(nodeExec.error) || { count: 0, nodes: new Set() };
          existing.count++;
          existing.nodes.add(nodeExec.nodeId);
          errorMap.set(nodeExec.error, existing);
        }
      });
    });

    return Array.from(errorMap.entries())
      .map(([error, data]) => ({
        error,
        count: data.count,
        percentage: (data.count / failedExecutions.length) * 100,
        affectedNodes: Array.from(data.nodes)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errors
  }, []);

  // Identify bottleneck nodes
  const identifyBottlenecks = useCallback((
    executions: WorkflowExecution[],
    nodes: Node<NodeData>[]
  ): BottleneckNode[] => {
    const nodeStats = new Map<string, { totalTime: number; count: number; name: string }>();

    executions.forEach(execution => {
      execution.nodeExecutions.forEach(nodeExec => {
        const existing = nodeStats.get(nodeExec.nodeId) || {
          totalTime: 0,
          count: 0,
          name: nodeExec.nodeName
        };
        existing.totalTime += nodeExec.duration;
        existing.count++;
        nodeStats.set(nodeExec.nodeId, existing);
      });
    });

    return Array.from(nodeStats.entries())
      .map(([nodeId, stats]) => ({
        nodeId,
        nodeName: stats.name,
        averageExecutionTime: stats.totalTime / stats.count,
        executionCount: stats.count,
        impactScore: (stats.totalTime / stats.count) * stats.count // Impact = avg time × frequency
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5); // Top 5 bottlenecks
  }, []);

  // Calculate performance trends
  const calculatePerformanceTrends = useCallback((executions: WorkflowExecution[]): PerformanceTrend[] => {
    const dailyStats = new Map<string, { times: number[]; successes: number }>();

    executions.forEach(execution => {
      const date = execution.startTime.toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { times: [], successes: 0 };

      existing.times.push(execution.duration);
      if (execution.status === 'success') {
        existing.successes++;
      }

      dailyStats.set(date, existing);
    });

    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        averageTime: stats.times.reduce((sum, time) => sum + time, 0) / stats.times.length,
        successRate: (stats.successes / stats.times.length) * 100,
        executionCount: stats.times.length
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }, []);

  // Identify optimization opportunities
  const identifyOptimizationOpportunities = useCallback((
    executions: WorkflowExecution[],
    nodes: Node<NodeData>[],
    edges: Edge[],
    bottlenecks: BottleneckNode[]
  ): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    // Analyze parallelization opportunities
    const parallelOpportunities = findParallelizationOpportunities(nodes, edges, executions);
    opportunities.push(...parallelOpportunities);

    // Analyze caching opportunities
    const cachingOpportunities = findCachingOpportunities(executions, bottlenecks);
    opportunities.push(...cachingOpportunities);

    // Analyze node optimization opportunities
    const optimizationOpportunities = findNodeOptimizationOpportunities(bottlenecks);
    opportunities.push(...optimizationOpportunities);

    return opportunities.sort((a, b) => b.potentialImprovement - a.potentialImprovement);
  }, []);

  // Find parallelization opportunities
  const findParallelizationOpportunities = useCallback((
    nodes: Node<NodeData>[],
    edges: Edge[],
    executions: WorkflowExecution[]
  ): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    // Find nodes that could run in parallel
    const nodeDependencies = new Map<string, Set<string>>();
    edges.forEach(edge => {
      const deps = nodeDependencies.get(edge.target) || new Set();
      deps.add(edge.source);
      nodeDependencies.set(edge.target, deps);
    });

    nodes.forEach(node => {
      const deps = nodeDependencies.get(node.id) || new Set();
      if (deps.size > 1) {
        // Node has multiple dependencies - check if they could be parallelized
        const avgExecutionTime = executions
          .flatMap(e => e.nodeExecutions)
          .filter(ne => ne.nodeId === node.id)
          .reduce((sum, ne) => sum + ne.duration, 0) / executions.length;

        opportunities.push({
          type: 'parallelization',
          nodeId: node.id,
          description: `Parallelize execution of ${node.data.label} dependencies`,
          potentialImprovement: avgExecutionTime * 0.3, // Estimate 30% improvement
          confidence: 0.7
        });
      }
    });

    return opportunities;
  }, []);

  // Find caching opportunities
  const findCachingOpportunities = useCallback((
    executions: WorkflowExecution[],
    bottlenecks: BottleneckNode[]
  ): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    bottlenecks.forEach(bottleneck => {
      const nodeExecutions = executions.flatMap(e =>
        e.nodeExecutions.filter(ne => ne.nodeId === bottleneck.nodeId)
      );

      // Check if node has similar inputs but different outputs (cache opportunity)
      const uniqueInputs = new Set(nodeExecutions.map(ne => ne.inputSize));
      if (uniqueInputs.size < nodeExecutions.length * 0.5) { // Less than 50% unique inputs
        opportunities.push({
          type: 'caching',
          nodeId: bottleneck.nodeId,
          description: `Add caching for ${bottleneck.nodeName} to reduce redundant computations`,
          potentialImprovement: bottleneck.averageExecutionTime * 0.6, // Estimate 60% improvement
          confidence: 0.8
        });
      }
    });

    return opportunities;
  }, []);

  // Find node optimization opportunities
  const findNodeOptimizationOpportunities = useCallback((
    bottlenecks: BottleneckNode[]
  ): OptimizationOpportunity[] => {
    const opportunities: OptimizationOpportunity[] = [];

    bottlenecks.forEach(bottleneck => {
      if (bottleneck.averageExecutionTime > 5000) { // More than 5 seconds
        opportunities.push({
          type: 'optimization',
          nodeId: bottleneck.nodeId,
          description: `Optimize ${bottleneck.nodeName} performance (currently ${Math.round(bottleneck.averageExecutionTime)}ms avg)`,
          potentialImprovement: bottleneck.averageExecutionTime * 0.4, // Estimate 40% improvement
          confidence: 0.6
        });
      }
    });

    return opportunities;
  }, []);

  // Get insights and recommendations
  const getInsights = useCallback(() => {
    if (!analytics) return [];

    const insights: string[] = [];

    if (analytics.successRate < 90) {
      insights.push(`⚠️ Low success rate (${analytics.successRate.toFixed(1)}%). Consider reviewing error patterns.`);
    }

    if (analytics.averageExecutionTime > 30000) { // More than 30 seconds
      insights.push(`⏱️ Slow execution time (${Math.round(analytics.averageExecutionTime / 1000)}s avg). Performance optimization recommended.`);
    }

    if (analytics.bottleneckNodes.length > 0) {
      const topBottleneck = analytics.bottleneckNodes[0];
      insights.push(`🎯 ${topBottleneck.nodeName} is the primary bottleneck (${Math.round(topBottleneck.averageExecutionTime)}ms avg).`);
    }

    if (analytics.optimizationOpportunities.length > 0) {
      insights.push(`💡 ${analytics.optimizationOpportunities.length} optimization opportunities identified.`);
    }

    return insights;
  }, [analytics]);

  // Auto-analyze when executions change
  useEffect(() => {
    if (executions.length > 0) {
      calculateAnalytics();
    }
  }, [executions, calculateAnalytics]);

  return {
    analytics,
    isAnalyzing,
    calculateAnalytics,
    getInsights,
    // Raw data access for custom analysis
    executions,
    nodes,
    edges
  };
};


