import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../types/workflow';

interface ExecutionHistory {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'success' | 'failed' | 'timeout';
  resourceUsage: ResourceUsage;
  demandPattern: DemandPattern;
}

interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

interface DemandPattern {
  timeOfDay: number;
  dayOfWeek: number;
  seasonalFactor: number;
  concurrentUsers: number;
}

interface PredictiveModel {
  workflowId: string;
  demandForecast: DemandForecast[];
  resourcePrediction: ResourcePrediction;
  optimizationSchedule: OptimizationSchedule[];
  confidence: number;
  lastUpdated: Date;
}

interface DemandForecast {
  timestamp: Date;
  predictedExecutions: number;
  confidence: number;
  factors: DemandFactor[];
}

interface DemandFactor {
  type: 'seasonal' | 'trend' | 'external' | 'anomaly';
  impact: number;
  description: string;
}

interface ResourcePrediction {
  recommendedCpu: number;
  recommendedMemory: number;
  recommendedInstances: number;
  scalingStrategy: 'horizontal' | 'vertical' | 'hybrid';
  costEstimate: number;
}

interface OptimizationSchedule {
  timestamp: Date;
  action: 'scale_up' | 'scale_down' | 'optimize' | 'maintenance';
  targetResource: string;
  expectedImprovement: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface PredictiveInsights {
  nextPeakTime: Date;
  recommendedOptimizations: string[];
  costSavings: number;
  performanceImprovements: number;
  riskAlerts: RiskAlert[];
}

interface RiskAlert {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendedAction: string;
  impact: number;
}

interface UsePredictiveOrchestrationProps {
  workflowId: string;
  executions: ExecutionHistory[];
  nodes: Node<NodeData>[];
  edges: Edge[];
  currentResources: ResourceUsage;
}

export const usePredictiveOrchestration = ({
  workflowId,
  executions,
  nodes,
  edges,
  currentResources
}: UsePredictiveOrchestrationProps) => {
  const [predictiveModel, setPredictiveModel] = useState<PredictiveModel | null>(null);
  const [insights, setInsights] = useState<PredictiveInsights | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisRef = useRef<PredictiveModel | null>(null);

  // Train predictive model
  const trainPredictiveModel = useCallback(async () => {
    if (executions.length < 10) return null; // Need minimum data for training

    setIsAnalyzing(true);

    try {
      // Analyze historical patterns
      const patterns = analyzeDemandPatterns(executions);
      const demandForecast = generateDemandForecast(patterns, executions);
      const resourcePrediction = predictResourceRequirements(demandForecast, executions);
      const optimizationSchedule = generateOptimizationSchedule(demandForecast, resourcePrediction);

      // Calculate model confidence
      const confidence = calculateModelConfidence(executions, patterns);

      const model: PredictiveModel = {
        workflowId,
        demandForecast,
        resourcePrediction,
        optimizationSchedule,
        confidence,
        lastUpdated: new Date()
      };

      analysisRef.current = model;
      setPredictiveModel(model);

      // Generate insights
      const insightsData = generateInsights(model, executions);
      setInsights(insightsData);

      return model;

    } finally {
      setIsAnalyzing(false);
    }
  }, [executions, workflowId]);

  // Analyze demand patterns
  const analyzeDemandPatterns = useCallback((executions: ExecutionHistory[]) => {
    const patterns: DemandPattern[] = [];

    executions.forEach(execution => {
      patterns.push({
        timeOfDay: execution.startTime.getHours(),
        dayOfWeek: execution.startTime.getDay(),
        seasonalFactor: calculateSeasonalFactor(execution.startTime),
        concurrentUsers: estimateConcurrentUsers(execution.startTime, executions)
      });
    });

    return patterns;
  }, []);

  // Calculate seasonal factor (simplified)
  const calculateSeasonalFactor = useCallback((timestamp: Date) => {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    // Business hours have higher factor
    if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
      return 1.5;
    }
    // Off-hours have lower factor
    return 0.7;
  }, []);

  // Estimate concurrent users (simplified)
  const estimateConcurrentUsers = useCallback((timestamp: Date, allExecutions: ExecutionHistory[]) => {
    const windowStart = new Date(timestamp.getTime() - 5 * 60 * 1000); // 5 minutes window
    const windowEnd = new Date(timestamp.getTime() + 5 * 60 * 1000);

    const concurrent = allExecutions.filter(exec =>
      exec.startTime >= windowStart && exec.startTime <= windowEnd
    ).length;

    return Math.max(1, concurrent);
  }, []);

  // Generate demand forecast
  const generateDemandForecast = useCallback((
    patterns: DemandPattern[],
    executions: ExecutionHistory[]
  ): DemandForecast[] => {
    const forecast: DemandForecast[] = [];
    const now = new Date();

    // Generate forecast for next 24 hours
    for (let i = 0; i < 24; i++) {
      const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
      const predictedExecutions = predictExecutionsAtTime(forecastTime, patterns, executions);
      const confidence = calculateForecastConfidence(forecastTime, executions);

      forecast.push({
        timestamp: forecastTime,
        predictedExecutions,
        confidence,
        factors: identifyDemandFactors(forecastTime, patterns)
      });
    }

    return forecast;
  }, []);

  // Predict executions at specific time
  const predictExecutionsAtTime = useCallback((
    timestamp: Date,
    patterns: DemandPattern[],
    executions: ExecutionHistory[]
  ) => {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    // Find similar historical patterns
    const similarPatterns = patterns.filter(p =>
      Math.abs(p.timeOfDay - hour) <= 2 &&
      Math.abs(p.dayOfWeek - day) <= 1
    );

    if (similarPatterns.length === 0) return 1;

    // Calculate weighted average
    const totalWeight = similarPatterns.reduce((sum, p) => sum + p.seasonalFactor, 0);
    const weightedAverage = similarPatterns.reduce((sum, p) =>
      sum + (p.concurrentUsers * p.seasonalFactor), 0
    ) / totalWeight;

    return Math.max(1, Math.round(weightedAverage));
  }, []);

  // Calculate forecast confidence
  const calculateForecastConfidence = useCallback((
    timestamp: Date,
    executions: ExecutionHistory[]
  ) => {
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    // Count historical executions at similar times
    const similarExecutions = executions.filter(exec => {
      const execHour = exec.startTime.getHours();
      const execDay = exec.startTime.getDay();
      return Math.abs(execHour - hour) <= 2 && Math.abs(execDay - day) <= 1;
    });

    // Higher confidence with more historical data
    const baseConfidence = Math.min(0.9, similarExecutions.length / 20);
    return Math.max(0.3, baseConfidence);
  }, []);

  // Identify demand factors
  const identifyDemandFactors = useCallback((
    timestamp: Date,
    patterns: DemandPattern[]
  ): DemandFactor[] => {
    const factors: DemandFactor[] = [];
    const hour = timestamp.getHours();
    const day = timestamp.getDay();

    // Business hours factor
    if (hour >= 9 && hour <= 17 && day >= 1 && day <= 5) {
      factors.push({
        type: 'seasonal',
        impact: 0.4,
        description: 'Business hours demand increase'
      });
    }

    // Weekend factor
    if (day === 0 || day === 6) {
      factors.push({
        type: 'seasonal',
        impact: -0.3,
        description: 'Weekend demand decrease'
      });
    }

    // Peak hours factor
    if (hour >= 10 && hour <= 15) {
      factors.push({
        type: 'trend',
        impact: 0.2,
        description: 'Peak business hours'
      });
    }

    return factors;
  }, []);

  // Predict resource requirements
  const predictResourceRequirements = useCallback((
    demandForecast: DemandForecast[],
    executions: ExecutionHistory[]
  ): ResourcePrediction => {
    const maxPredictedExecutions = Math.max(...demandForecast.map(f => f.predictedExecutions));
    const avgExecutionResources = calculateAverageResourceUsage(executions);

    // Calculate recommended resources based on peak demand
    const recommendedCpu = Math.ceil(maxPredictedExecutions * avgExecutionResources.cpu * 1.2);
    const recommendedMemory = Math.ceil(maxPredictedExecutions * avgExecutionResources.memory * 1.2);
    const recommendedInstances = Math.ceil(maxPredictedExecutions / 10); // Assume 10 executions per instance

    // Determine scaling strategy
    let scalingStrategy: 'horizontal' | 'vertical' | 'hybrid' = 'horizontal';
    if (recommendedCpu > 8) {
      scalingStrategy = 'hybrid'; // Use both horizontal and vertical scaling
    } else if (recommendedInstances > 5) {
      scalingStrategy = 'horizontal';
    } else {
      scalingStrategy = 'vertical';
    }

    // Estimate costs (simplified)
    const costEstimate = (recommendedCpu * 0.05 + recommendedMemory * 0.0005) * 24 * 30;

    return {
      recommendedCpu,
      recommendedMemory,
      recommendedInstances,
      scalingStrategy,
      costEstimate
    };
  }, []);

  // Calculate average resource usage
  const calculateAverageResourceUsage = useCallback((executions: ExecutionHistory[]) => {
    if (executions.length === 0) {
      return { cpu: 0.5, memory: 256, network: 10, storage: 50 };
    }

    const totalCpu = executions.reduce((sum, exec) => sum + exec.resourceUsage.cpu, 0);
    const totalMemory = executions.reduce((sum, exec) => sum + exec.resourceUsage.memory, 0);
    const totalNetwork = executions.reduce((sum, exec) => sum + exec.resourceUsage.network, 0);
    const totalStorage = executions.reduce((sum, exec) => sum + exec.resourceUsage.storage, 0);

    return {
      cpu: totalCpu / executions.length,
      memory: totalMemory / executions.length,
      network: totalNetwork / executions.length,
      storage: totalStorage / executions.length
    };
  }, []);

  // Generate optimization schedule
  const generateOptimizationSchedule = useCallback((
    demandForecast: DemandForecast[],
    resourcePrediction: ResourcePrediction
  ): OptimizationSchedule[] => {
    const schedule: OptimizationSchedule[] = [];
    const now = new Date();

    demandForecast.forEach((forecast, index) => {
      if (forecast.predictedExecutions > 5) { // High demand period
        schedule.push({
          timestamp: forecast.timestamp,
          action: 'scale_up',
          targetResource: 'instances',
          expectedImprovement: 0.3,
          riskLevel: 'low'
        });
      } else if (forecast.predictedExecutions < 2) { // Low demand period
        schedule.push({
          timestamp: forecast.timestamp,
          action: 'scale_down',
          targetResource: 'instances',
          expectedImprovement: 0.1,
          riskLevel: 'medium'
        });
      }

      // Add maintenance windows during low-demand periods
      if (forecast.predictedExecutions < 3 && index % 6 === 0) { // Every 6 hours during low demand
        schedule.push({
          timestamp: new Date(forecast.timestamp.getTime() + 30 * 60 * 1000), // 30 minutes later
          action: 'maintenance',
          targetResource: 'all',
          expectedImprovement: 0.05,
          riskLevel: 'low'
        });
      }
    });

    return schedule.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, []);

  // Calculate model confidence
  const calculateModelConfidence = useCallback((
    executions: ExecutionHistory[],
    patterns: DemandPattern[]
  ) => {
    if (executions.length < 10) return 0.3;

    // Higher confidence with more data and consistent patterns
    const dataConfidence = Math.min(0.8, executions.length / 100);
    const patternConsistency = calculatePatternConsistency(patterns);

    return (dataConfidence + patternConsistency) / 2;
  }, []);

  // Calculate pattern consistency
  const calculatePatternConsistency = useCallback((patterns: DemandPattern[]) => {
    if (patterns.length < 5) return 0.5;

    // Calculate variance in patterns
    const avgSeasonal = patterns.reduce((sum, p) => sum + p.seasonalFactor, 0) / patterns.length;
    const variance = patterns.reduce((sum, p) =>
      sum + Math.pow(p.seasonalFactor - avgSeasonal, 2), 0
    ) / patterns.length;

    // Lower variance = higher consistency = higher confidence
    const consistency = Math.max(0, 1 - variance);
    return Math.min(0.9, consistency);
  }, []);

  // Generate insights
  const generateInsights = useCallback((
    model: PredictiveModel,
    executions: ExecutionHistory[]
  ): PredictiveInsights => {
    const nextPeakTime = findNextPeakTime(model.demandForecast);
    const recommendedOptimizations = generateOptimizationRecommendations(model);
    const costSavings = calculatePotentialSavings(model, executions);
    const performanceImprovements = calculatePerformanceImprovements(model);
    const riskAlerts = generateRiskAlerts(model, executions);

    return {
      nextPeakTime,
      recommendedOptimizations,
      costSavings,
      performanceImprovements,
      riskAlerts
    };
  }, []);

  // Find next peak time
  const findNextPeakTime = useCallback((demandForecast: DemandForecast[]) => {
    const now = new Date();
    const futureForecasts = demandForecast.filter(f => f.timestamp > now);

    if (futureForecasts.length === 0) return now;

    // Find forecast with highest predicted executions
    const peakForecast = futureForecasts.reduce((peak, current) =>
      current.predictedExecutions > peak.predictedExecutions ? current : peak
    );

    return peakForecast.timestamp;
  }, []);

  // Generate optimization recommendations
  const generateOptimizationRecommendations = useCallback((model: PredictiveModel) => {
    const recommendations: string[] = [];

    if (model.resourcePrediction.scalingStrategy === 'hybrid') {
      recommendations.push('Implement hybrid scaling strategy for optimal resource utilization');
    }

    if (model.optimizationSchedule.filter(s => s.action === 'scale_up').length > 3) {
      recommendations.push('Consider increasing baseline instance count to reduce scaling frequency');
    }

    if (model.confidence < 0.6) {
      recommendations.push('Collect more execution data to improve prediction accuracy');
    }

    const highRiskActions = model.optimizationSchedule.filter(s => s.riskLevel === 'high');
    if (highRiskActions.length > 0) {
      recommendations.push('Review high-risk optimization actions before implementation');
    }

    return recommendations;
  }, []);

  // Calculate potential savings
  const calculatePotentialSavings = useCallback((
    model: PredictiveModel,
    executions: ExecutionHistory[]
  ) => {
    const currentCost = calculateCurrentMonthlyCost(executions);
    const optimizedCost = model.resourcePrediction.costEstimate;

    return Math.max(0, currentCost - optimizedCost);
  }, []);

  // Calculate current monthly cost (simplified)
  const calculateCurrentMonthlyCost = useCallback((executions: ExecutionHistory[]) => {
    const avgResources = calculateAverageResourceUsage(executions);
    return (avgResources.cpu * 0.05 + avgResources.memory * 0.0005) * 24 * 30;
  }, [calculateAverageResourceUsage]);

  // Calculate performance improvements
  const calculatePerformanceImprovements = useCallback((model: PredictiveModel) => {
    const avgImprovement = model.optimizationSchedule.reduce((sum, schedule) =>
      sum + schedule.expectedImprovement, 0
    ) / model.optimizationSchedule.length;

    return avgImprovement * 100; // Convert to percentage
  }, []);

  // Generate risk alerts
  const generateRiskAlerts = useCallback((
    model: PredictiveModel,
    executions: ExecutionHistory[]
  ): RiskAlert[] => {
    const alerts: RiskAlert[] = [];

    // Low confidence alert
    if (model.confidence < 0.5) {
      alerts.push({
        level: 'medium',
        message: 'Prediction confidence is low due to insufficient historical data',
        recommendedAction: 'Continue collecting execution data for better predictions',
        impact: 0.3
      });
    }

    // High scaling frequency alert
    const scalingActions = model.optimizationSchedule.filter(s =>
      s.action === 'scale_up' || s.action === 'scale_down'
    );
    if (scalingActions.length > 10) {
      alerts.push({
        level: 'high',
        message: 'High scaling frequency may impact performance and increase costs',
        recommendedAction: 'Optimize baseline resource allocation',
        impact: 0.6
      });
    }

    // Resource constraint alert
    if (model.resourcePrediction.recommendedCpu > 16 || model.resourcePrediction.recommendedMemory > 32768) {
      alerts.push({
        level: 'critical',
        message: 'Predicted resource requirements exceed typical instance limits',
        recommendedAction: 'Consider distributed processing or architecture optimization',
        impact: 0.8
      });
    }

    return alerts;
  }, []);

  // Auto-train model when executions change significantly
  useEffect(() => {
    if (executions.length >= 10) {
      const shouldRetrain = shouldRetrainModel(executions);
      if (shouldRetrain) {
        trainPredictiveModel();
      }
    }
  }, [executions, trainPredictiveModel]);

  // Check if model should be retrained
  const shouldRetrainModel = useCallback((executions: ExecutionHistory[]) => {
    if (!analysisRef.current) return true;

    const lastExecution = executions[executions.length - 1];
    const timeSinceLastUpdate = Date.now() - analysisRef.current.lastUpdated.getTime();

    // Retrain if it's been more than 1 hour since last update
    // or if we have 20% more executions than when last trained
    return timeSinceLastUpdate > 60 * 60 * 1000 ||
           executions.length > (analysisRef.current as any).trainingSize * 1.2;
  }, []);

  return {
    predictiveModel,
    insights,
    isAnalyzing,
    trainPredictiveModel,
    // Utility functions
    calculateAverageResourceUsage,
    findNextPeakTime,
    generateOptimizationRecommendations
  };
};


