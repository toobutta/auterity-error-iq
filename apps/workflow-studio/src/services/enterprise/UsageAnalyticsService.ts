/**
 * Usage Analytics Service for Auterity Error-IQ
 * Provides comprehensive usage tracking, analytics, and optimization insights
 * Supports real-time monitoring and predictive analytics
 */

import { z } from "zod";

// Types for usage analytics
export interface UsageEvent {
  id: string;
  userId: string;
  organizationId: string;
  eventType: 'api_call' | 'workflow_execution' | 'model_inference' | 'ui_interaction' | 'error' | 'login' | 'feature_usage';
  resource: string;
  action: string;
  timestamp: Date;
  duration?: number;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    feature?: string;
    model?: string;
    workflowId?: string;
    cost?: number;
    tokens?: number;
    errorCode?: string;
    [key: string]: any;
  };
}

export interface UsageMetrics {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    uniqueOrganizations: number;
    totalCost: number;
    totalDuration: number;
    errorRate: number;
  };
  byEventType: Record<string, {
    count: number;
    percentage: number;
    avgDuration?: number;
    totalCost?: number;
  }>;
  byResource: Record<string, {
    count: number;
    uniqueUsers: number;
    avgDuration?: number;
    errorRate: number;
  }>;
  byUser: Array<{
    userId: string;
    eventCount: number;
    totalCost: number;
    avgSessionDuration: number;
    lastActivity: Date;
    topFeatures: string[];
  }>;
  byOrganization: Array<{
    organizationId: string;
    userCount: number;
    eventCount: number;
    totalCost: number;
    avgCostPerUser: number;
    topResources: string[];
  }>;
  trends: {
    daily: Array<{
      date: string;
      events: number;
      users: number;
      cost: number;
      errors: number;
    }>;
    hourly: Array<{
      hour: string;
      events: number;
      users: number;
      cost: number;
    }>;
  };
}

export interface OptimizationInsight {
  id: string;
  type: 'cost_optimization' | 'performance' | 'usage_pattern' | 'feature_adoption' | 'error_reduction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    potentialSavings?: number;
    performanceImprovement?: number;
    userExperienceImpact?: string;
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    expectedBenefit: string;
  }>;
  data: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PredictiveAnalytics {
  userChurnRisk: Array<{
    userId: string;
    riskScore: number;
    riskFactors: string[];
    predictedChurnDate?: Date;
    retentionRecommendations: string[];
  }>;
  usageForecast: {
    nextMonth: {
      events: number;
      cost: number;
      confidence: number;
    };
    nextQuarter: {
      events: number;
      cost: number;
      confidence: number;
    };
  };
  featureAdoption: Array<{
    feature: string;
    currentAdoption: number;
    predictedAdoption: number;
    growthRate: number;
    recommendations: string[];
  }>;
  costOptimization: {
    potentialSavings: number;
    optimizationOpportunities: Array<{
      category: string;
      savings: number;
      actions: string[];
    }>;
  };
}

export interface RealTimeMetrics {
  activeUsers: number;
  activeSessions: number;
  currentThroughput: number;
  averageResponseTime: number;
  errorRate: number;
  systemLoad: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  queueDepth: {
    apiRequests: number;
    workflowExecutions: number;
    modelInferences: number;
  };
  recentErrors: Array<{
    timestamp: Date;
    error: string;
    userId?: string;
    resource: string;
  }>;
}

export class UsageAnalyticsService {
  private events: UsageEvent[] = [];
  private insights: Map<string, OptimizationInsight> = new Map();
  private realTimeMetrics: RealTimeMetrics = {
    activeUsers: 0,
    activeSessions: 0,
    currentThroughput: 0,
    averageResponseTime: 0,
    errorRate: 0,
    systemLoad: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    },
    queueDepth: {
      apiRequests: 0,
      workflowExecutions: 0,
      modelInferences: 0
    },
    recentErrors: []
  };

  constructor() {
    this.initializeRealTimeMonitoring();
    this.generateMockData();
  }

  /**
   * Track usage event
   */
  async trackEvent(event: Omit<UsageEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const usageEvent: UsageEvent = {
        id: eventId,
        ...event,
        timestamp: new Date()
      };

      this.events.push(usageEvent);

      // Update real-time metrics
      this.updateRealTimeMetrics(usageEvent);

      // Check for optimization opportunities
      await this.checkOptimizationTriggers(usageEvent);

      return eventId;

    } catch (error) {
      console.error('Failed to track usage event:', error);
      throw new Error(`Event tracking failed: ${(error as Error).message}`);
    }
  }

  /**
   * Update real-time metrics
   */
  private updateRealTimeMetrics(event: UsageEvent): void {
    // Update active users (simplified - would use session tracking in real implementation)
    if (event.eventType === 'login') {
      this.realTimeMetrics.activeUsers++;
    }

    // Update throughput
    this.realTimeMetrics.currentThroughput++;

    // Update response time
    if (event.duration) {
      const currentAvg = this.realTimeMetrics.averageResponseTime;
      const totalEvents = this.events.length;
      this.realTimeMetrics.averageResponseTime = (currentAvg * (totalEvents - 1) + event.duration) / totalEvents;
    }

    // Update error rate
    if (event.eventType === 'error') {
      this.realTimeMetrics.errorRate = (this.realTimeMetrics.errorRate + 1) / this.events.length;
      this.realTimeMetrics.recentErrors.unshift({
        timestamp: event.timestamp,
        error: event.metadata.errorCode || 'Unknown error',
        userId: event.userId,
        resource: event.resource
      });
      this.realTimeMetrics.recentErrors = this.realTimeMetrics.recentErrors.slice(0, 10);
    }

    // Update queue depths
    if (event.eventType === 'api_call') {
      this.realTimeMetrics.queueDepth.apiRequests++;
    } else if (event.eventType === 'workflow_execution') {
      this.realTimeMetrics.queueDepth.workflowExecutions++;
    } else if (event.eventType === 'model_inference') {
      this.realTimeMetrics.queueDepth.modelInferences++;
    }
  }

  /**
   * Get usage metrics for a time period
   */
  async getUsageMetrics(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<UsageMetrics> {
    try {
      // Filter events by time period and organization
      let filteredEvents = this.events.filter(event =>
        event.timestamp >= startDate &&
        event.timestamp <= endDate
      );

      if (organizationId) {
        filteredEvents = filteredEvents.filter(event => event.organizationId === organizationId);
      }

      // Calculate summary metrics
      const totalEvents = filteredEvents.length;
      const uniqueUsers = new Set(filteredEvents.map(e => e.userId)).size;
      const uniqueOrganizations = new Set(filteredEvents.map(e => e.organizationId)).size;
      const totalCost = filteredEvents.reduce((sum, e) => sum + (e.metadata.cost || 0), 0);
      const totalDuration = filteredEvents.reduce((sum, e) => sum + (e.duration || 0), 0);
      const errorCount = filteredEvents.filter(e => e.eventType === 'error').length;
      const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;

      // Group by event type
      const byEventType: Record<string, any> = {};
      const eventGroups = this.groupBy(filteredEvents, 'eventType');

      Object.entries(eventGroups).forEach(([eventType, events]) => {
        const eventsArray = events as UsageEvent[];
        const totalDuration = eventsArray.reduce((sum, e) => sum + (e.duration || 0), 0);
        const totalCost = eventsArray.reduce((sum, e) => sum + (e.metadata.cost || 0), 0);

        byEventType[eventType] = {
          count: eventsArray.length,
          percentage: (eventsArray.length / totalEvents) * 100,
          avgDuration: eventsArray.length > 0 ? totalDuration / eventsArray.length : undefined,
          totalCost: totalCost > 0 ? totalCost : undefined
        };
      });

      // Group by resource
      const byResource: Record<string, any> = {};
      const resourceGroups = this.groupBy(filteredEvents, 'resource');

      Object.entries(resourceGroups).forEach(([resource, events]) => {
        const eventsArray = events as UsageEvent[];
        const uniqueUsers = new Set(eventsArray.map(e => e.userId)).size;
        const totalDuration = eventsArray.reduce((sum, e) => sum + (e.duration || 0), 0);
        const errorCount = eventsArray.filter(e => e.eventType === 'error').length;

        byResource[resource] = {
          count: eventsArray.length,
          uniqueUsers,
          avgDuration: eventsArray.length > 0 ? totalDuration / eventsArray.length : undefined,
          errorRate: eventsArray.length > 0 ? (errorCount / eventsArray.length) * 100 : 0
        };
      });

      // Calculate user analytics
      const byUser = this.calculateUserAnalytics(filteredEvents, startDate, endDate);

      // Calculate organization analytics
      const byOrganization = this.calculateOrganizationAnalytics(filteredEvents);

      // Generate trends
      const trends = this.calculateTrends(filteredEvents, startDate, endDate);

      return {
        period: { start: startDate, end: endDate },
        summary: {
          totalEvents,
          uniqueUsers,
          uniqueOrganizations,
          totalCost,
          totalDuration,
          errorRate
        },
        byEventType,
        byResource,
        byUser,
        byOrganization,
        trends
      };

    } catch (error) {
      console.error('Failed to get usage metrics:', error);
      throw new Error(`Metrics retrieval failed: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate user analytics
   */
  private calculateUserAnalytics(events: UsageEvent[], startDate: Date, endDate: Date): any[] {
    const userGroups = this.groupBy(events, 'userId');

    return Object.entries(userGroups).map(([userId, userEvents]) => {
      const eventsArray = userEvents as UsageEvent[];
      const totalCost = eventsArray.reduce((sum, e) => sum + (e.metadata.cost || 0), 0);
      const totalDuration = eventsArray.reduce((sum, e) => sum + (e.duration || 0), 0);
      const sessionCount = eventsArray.filter(e => e.eventType === 'login').length;

      // Calculate top features
      const featureUsage = this.groupBy(eventsArray.filter(e => e.metadata.feature), 'metadata.feature');
      const topFeatures = Object.entries(featureUsage)
        .sort(([, a], [, b]) => (b as UsageEvent[]).length - (a as UsageEvent[]).length)
        .slice(0, 5)
        .map(([feature]) => feature);

      return {
        userId,
        eventCount: eventsArray.length,
        totalCost,
        avgSessionDuration: sessionCount > 0 ? totalDuration / sessionCount : 0,
        lastActivity: eventsArray.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp,
        topFeatures
      };
    });
  }

  /**
   * Calculate organization analytics
   */
  private calculateOrganizationAnalytics(events: UsageEvent[]): any[] {
    const orgGroups = this.groupBy(events, 'organizationId');

    return Object.entries(orgGroups).map(([orgId, orgEvents]) => {
      const eventsArray = orgEvents as UsageEvent[];
      const userCount = new Set(eventsArray.map(e => e.userId)).size;
      const totalCost = eventsArray.reduce((sum, e) => sum + (e.metadata.cost || 0), 0);

      // Calculate top resources
      const resourceUsage = this.groupBy(eventsArray, 'resource');
      const topResources = Object.entries(resourceUsage)
        .sort(([, a], [, b]) => (b as UsageEvent[]).length - (a as UsageEvent[]).length)
        .slice(0, 5)
        .map(([resource]) => resource);

      return {
        organizationId: orgId,
        userCount,
        eventCount: eventsArray.length,
        totalCost,
        avgCostPerUser: userCount > 0 ? totalCost / userCount : 0,
        topResources
      };
    });
  }

  /**
   * Calculate usage trends
   */
  private calculateTrends(events: UsageEvent[], startDate: Date, endDate: Date): any {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Daily trends
    const daily: any[] = [];
    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEvents = events.filter(e =>
        e.timestamp.toDateString() === date.toDateString()
      );

      daily.push({
        date: date.toISOString().split('T')[0],
        events: dayEvents.length,
        users: new Set(dayEvents.map(e => e.userId)).size,
        cost: dayEvents.reduce((sum, e) => sum + (e.metadata.cost || 0), 0),
        errors: dayEvents.filter(e => e.eventType === 'error').length
      });
    }

    // Hourly trends (last 24 hours)
    const hourly: any[] = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourEvents = events.filter(e =>
        e.timestamp >= hourStart && e.timestamp < hourEnd
      );

      hourly.push({
        hour: hourStart.getHours().toString().padStart(2, '0') + ':00',
        events: hourEvents.length,
        users: new Set(hourEvents.map(e => e.userId)).size,
        cost: hourEvents.reduce((sum, e) => sum + (e.metadata.cost || 0), 0)
      });
    }

    return { daily, hourly };
  }

  /**
   * Generate optimization insights
   */
  async generateOptimizationInsights(organizationId?: string): Promise<OptimizationInsight[]> {
    try {
      const insights: OptimizationInsight[] = [];

      // Get recent usage data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const metrics = await this.getUsageMetrics(startDate, endDate, organizationId);

      // Cost optimization insights
      if (metrics.summary.totalCost > 1000) {
        const highCostUsers = metrics.byUser.filter(u => u.totalCost > 100);
        if (highCostUsers.length > 0) {
          insights.push({
            id: `cost_opt_${Date.now()}`,
            type: 'cost_optimization',
            severity: 'medium',
            title: 'High Usage Cost Detected',
            description: `${highCostUsers.length} users account for $${highCostUsers.reduce((sum, u) => sum + u.totalCost, 0).toFixed(2)} in costs`,
            impact: {
              potentialSavings: highCostUsers.reduce((sum, u) => sum + u.totalCost * 0.2, 0)
            },
            recommendations: [
              {
                action: 'Implement usage quotas for high-cost users',
                priority: 'high',
                effort: 'medium',
                expectedBenefit: '20% cost reduction'
              },
              {
                action: 'Optimize model selection for cost-effective alternatives',
                priority: 'medium',
                effort: 'low',
                expectedBenefit: '15% cost reduction'
              }
            ],
            data: { highCostUsers },
            createdAt: new Date()
          });
        }
      }

      // Performance insights
      if (metrics.summary.errorRate > 5) {
        insights.push({
          id: `perf_opt_${Date.now()}`,
          type: 'performance',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `Error rate of ${metrics.summary.errorRate.toFixed(2)}% exceeds recommended threshold`,
          impact: {
            userExperienceImpact: 'Poor user experience due to frequent errors'
          },
          recommendations: [
            {
              action: 'Implement comprehensive error monitoring',
              priority: 'high',
              effort: 'medium',
              expectedBenefit: '50% error reduction'
            },
            {
              action: 'Add retry logic for failed operations',
              priority: 'medium',
              effort: 'low',
              expectedBenefit: '30% error reduction'
            }
          ],
          data: { errorRate: metrics.summary.errorRate },
          createdAt: new Date()
        });
      }

      // Feature adoption insights
      const featureUsage = metrics.byEventType.feature_usage;
      if (featureUsage && featureUsage.count < metrics.summary.totalEvents * 0.1) {
        insights.push({
          id: `adoption_opt_${Date.now()}`,
          type: 'feature_adoption',
          severity: 'low',
          title: 'Low Feature Adoption',
          description: 'Users are not fully utilizing available features',
          impact: {
            userExperienceImpact: 'Suboptimal user experience'
          },
          recommendations: [
            {
              action: 'Implement guided tutorials for unused features',
              priority: 'medium',
              effort: 'medium',
              expectedBenefit: '40% increase in feature adoption'
            },
            {
              action: 'Add feature discovery prompts in UI',
              priority: 'low',
              effort: 'low',
              expectedBenefit: '25% increase in feature adoption'
            }
          ],
          data: { featureUsage },
          createdAt: new Date()
        });
      }

      return insights;

    } catch (error) {
      console.error('Failed to generate optimization insights:', error);
      return [];
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(organizationId?: string): Promise<PredictiveAnalytics> {
    try {
      // Get historical data for predictions
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      const metrics = await this.getUsageMetrics(startDate, endDate, organizationId);

      // Mock predictive calculations (would use ML models in real implementation)
      const currentEvents = metrics.summary.totalEvents;
      const currentCost = metrics.summary.totalCost;

      // Simple linear regression for forecasting
      const growthRate = 1.15; // 15% growth assumption
      const nextMonthEvents = Math.round(currentEvents * growthRate);
      const nextMonthCost = currentCost * growthRate;

      const nextQuarterEvents = Math.round(currentEvents * Math.pow(growthRate, 3));
      const nextQuarterCost = currentCost * Math.pow(growthRate, 3);

      // Mock user churn risk analysis
      const userChurnRisk = metrics.byUser
        .filter(u => u.eventCount < 10) // Low activity users
        .slice(0, 5)
        .map(u => ({
          userId: u.userId,
          riskScore: Math.random() * 100,
          riskFactors: ['Low activity', 'Infrequent usage'],
          retentionRecommendations: [
            'Send re-engagement email',
            'Offer personalized tutorial',
            'Provide usage incentives'
          ]
        }));

      // Mock feature adoption predictions
      const featureAdoption = [
        {
          feature: 'ai-models',
          currentAdoption: 75,
          predictedAdoption: 85,
          growthRate: 13.3,
          recommendations: ['Continue marketing AI capabilities', 'Add success stories']
        },
        {
          feature: 'workflows',
          currentAdoption: 60,
          predictedAdoption: 80,
          growthRate: 33.3,
          recommendations: ['Create more templates', 'Improve drag-and-drop UX']
        }
      ];

      return {
        userChurnRisk,
        usageForecast: {
          nextMonth: {
            events: nextMonthEvents,
            cost: nextMonthCost,
            confidence: 85
          },
          nextQuarter: {
            events: nextQuarterEvents,
            cost: nextQuarterCost,
            confidence: 75
          }
        },
        featureAdoption,
        costOptimization: {
          potentialSavings: currentCost * 0.25,
          optimizationOpportunities: [
            {
              category: 'Model Selection',
              savings: currentCost * 0.15,
              actions: ['Use cost-optimized models', 'Implement model routing']
            },
            {
              category: 'Usage Optimization',
              savings: currentCost * 0.10,
              actions: ['Implement quotas', 'Add usage alerts']
            }
          ]
        }
      };

    } catch (error) {
      console.error('Failed to get predictive analytics:', error);
      throw new Error(`Predictive analytics failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get real-time metrics
   */
  getRealTimeMetrics(): RealTimeMetrics {
    return { ...this.realTimeMetrics };
  }

  /**
   * Check optimization triggers
   */
  private async checkOptimizationTriggers(event: UsageEvent): Promise<void> {
    // Check for high-cost events
    if (event.metadata.cost && event.metadata.cost > 10) {
      await this.createOptimizationInsight({
        type: 'cost_optimization',
        severity: 'medium',
        title: 'High-Cost Operation Detected',
        description: `Operation costing $${event.metadata.cost} detected for user ${event.userId}`,
        impact: { potentialSavings: event.metadata.cost * 0.3 },
        recommendations: [{
          action: 'Review high-cost operations',
          priority: 'medium',
          effort: 'low',
          expectedBenefit: 'Cost reduction opportunity'
        }],
        data: { event },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      });
    }

    // Check for error patterns
    if (event.eventType === 'error') {
      const recentErrors = this.events
        .filter(e => e.eventType === 'error' &&
                    e.resource === event.resource &&
                    e.timestamp > new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        .length;

      if (recentErrors > 5) {
        await this.createOptimizationInsight({
          type: 'error_reduction',
          severity: 'high',
          title: 'Error Pattern Detected',
          description: `${recentErrors} errors in the last hour for resource ${event.resource}`,
          impact: { userExperienceImpact: 'Degraded user experience' },
          recommendations: [{
            action: 'Investigate error pattern',
            priority: 'high',
            effort: 'medium',
            expectedBenefit: 'Improved reliability'
          }],
          data: { errorCount: recentErrors, resource: event.resource },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        });
      }
    }
  }

  /**
   * Create optimization insight
   */
  private async createOptimizationInsight(insight: Omit<OptimizationInsight, 'id' | 'createdAt'>): Promise<void> {
    const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullInsight: OptimizationInsight = {
      id: insightId,
      ...insight,
      createdAt: new Date()
    };

    this.insights.set(insightId, fullInsight);
  }

  /**
   * Get optimization insights
   */
  getOptimizationInsights(activeOnly: boolean = true): OptimizationInsight[] {
    try {
      const insights = Array.from(this.insights.values());

      if (activeOnly) {
        return insights.filter(insight =>
          !insight.expiresAt || insight.expiresAt > new Date()
        );
      }

      return insights;
    } catch (error) {
      console.error('Failed to get optimization insights:', error);
      return [];
    }
  }

  /**
   * Initialize real-time monitoring
   */
  private initializeRealTimeMonitoring(): void {
    // Update metrics every 30 seconds
    setInterval(() => {
      // Simulate system load updates
      this.realTimeMetrics.systemLoad = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        network: Math.random() * 100
      };

      // Gradually decrease queue depths (simulating processing)
      Object.keys(this.realTimeMetrics.queueDepth).forEach(key => {
        const current = this.realTimeMetrics.queueDepth[key as keyof typeof this.realTimeMetrics.queueDepth];
        this.realTimeMetrics.queueDepth[key as keyof typeof this.realTimeMetrics.queueDepth] =
          Math.max(0, current - Math.floor(Math.random() * 5));
      });

      // Update throughput
      this.realTimeMetrics.currentThroughput = Math.floor(Math.random() * 100) + 50;
    }, 30000);
  }

  /**
   * Generate mock data for demonstration
   */
  private generateMockData(): void {
    // Generate mock events for the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 10000; i++) {
      const timestamp = new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));

      const eventTypes = ['api_call', 'workflow_execution', 'model_inference', 'ui_interaction', 'login', 'error'];
      const resources = ['gpt-4', 'claude-3', 'gemini-pro', 'workflow-1', 'dashboard', 'settings'];
      const users = ['user_' + Math.floor(Math.random() * 100)];
      const organizations = ['org_' + Math.floor(Math.random() * 10)];

      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];

      const event: UsageEvent = {
        id: `mock_${i}`,
        userId: users[0],
        organizationId: organizations[0],
        eventType: eventType as any,
        resource,
        action: 'use',
        timestamp,
        duration: eventType === 'api_call' ? Math.random() * 5000 + 100 : undefined,
        metadata: {
          cost: eventType === 'model_inference' ? Math.random() * 5 : undefined,
          tokens: eventType === 'model_inference' ? Math.floor(Math.random() * 1000) : undefined,
          errorCode: eventType === 'error' ? 'SIMULATED_ERROR' : undefined,
          sessionId: `session_${Math.floor(Math.random() * 1000)}`,
          userAgent: 'Mozilla/5.0 (Mock Browser)',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
        }
      };

      this.events.push(event);
    }

  }

  /**
   * Utility function to group events
   */
  private groupBy<T>(array: T[], key: string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = (item as any)[key] || 'unknown';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Cleanup old events (keep last 90 days)
   */
  cleanup(olderThanDays: number = 90): number {
    const cutoffTime = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    const initialLength = this.events.length;

    this.events = this.events.filter(event => event.timestamp >= cutoffTime);

    // Clean up expired insights
    for (const [id, insight] of this.insights.entries()) {
      if (insight.expiresAt && insight.expiresAt < new Date()) {
        this.insights.delete(id);
      }
    }

    const cleanedCount = initialLength - this.events.length;

    return cleanedCount;
  }
}

// Export singleton instance
export const usageAnalyticsService = new UsageAnalyticsService();
