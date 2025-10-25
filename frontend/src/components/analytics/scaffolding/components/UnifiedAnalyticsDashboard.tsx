/**
 * Unified Analytics Dashboard - Orchestrator Component
 * Combines Business Intelligence + ML Analytics + Cross-System Correlation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/enhanced/Card';
import { Button } from '../../../ui/enhanced/Button';
import { Badge } from '../../../ui/enhanced/Badge';
import {
  RefreshCw,
  Download,
  Settings,
  Bell,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain,
  BarChart3,
  Users,
  Clock
} from 'lucide-react';

// Import our scaffolded components
import { BusinessAnalyticsPanel } from './BusinessAnalyticsPanel';
import { MLAnalyticsPanel } from './MLAnalyticsPanel';
import { CrossSystemInsights } from './CrossSystemInsights';
import { RealTimeMetrics } from './RealTimeMetrics';

// Import types
import { UnifiedAnalytics, UnifiedAnalyticsConfig } from '../types/integration.types';

interface UnifiedAnalyticsDashboardProps {
  tenantId?: string;
  config?: Partial<UnifiedAnalyticsConfig>;
  onInsightAction?: (insightId: string, action: string) => void;
  onAlertAction?: (alertId: string, action: string) => void;
  className?: string;
}

interface UnifiedAnalyticsConfig {
  enableRealtime: boolean;
  refreshInterval: number;
  showPredictions: boolean;
  showCorrelations: boolean;
  defaultView: 'overview' | 'business' | 'ml' | 'insights';
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'tabs' | 'split';
}

const UnifiedAnalyticsDashboard: React.FC<UnifiedAnalyticsDashboardProps> = ({
  tenantId = 'default',
  config = {},
  onInsightAction,
  onAlertAction,
  className = ''
}) => {
  // Configuration with defaults
  const dashboardConfig: UnifiedAnalyticsConfig = {
    enableRealtime: true,
    refreshInterval: 30000,
    showPredictions: true,
    showCorrelations: true,
    defaultView: 'overview',
    theme: 'light',
    layout: 'tabs',
    ...config
  };

  // State management
  const [activeView, setActiveView] = useState(dashboardConfig.defaultView);
  const [unifiedData, setUnifiedData] = useState<UnifiedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Mock data for demonstration
  const mockUnifiedData: UnifiedAnalytics = useMemo(() => ({
    tenantId,
    timestamp: new Date(),

    auterity: {
      userAnalytics: {
        totalUsers: 15420,
        activeUsers: 2847,
        newUsers: 245,
        returningUsers: 2602,
        sessionDuration: 8.5,
        pageViews: 45230,
        bounceRate: 23.4,
        userJourney: [
          { step: 'Landing', users: 100, dropoff: 0, conversion: 100, avgTime: 120 },
          { step: 'Dashboard View', users: 78, dropoff: 22, conversion: 78, avgTime: 180 },
          { step: 'Workflow Creation', users: 45, dropoff: 42, conversion: 45, avgTime: 300 }
        ],
        deviceBreakdown: [
          { device: 'desktop', users: 1350, percentage: 47.4, sessions: 1800, avgSessionTime: 9.2 },
          { device: 'mobile', users: 1200, percentage: 42.2, sessions: 1500, avgSessionTime: 7.8 },
          { device: 'tablet', users: 297, percentage: 10.4, sessions: 400, avgSessionTime: 8.1 }
        ],
        geographicData: [
          { country: 'United States', users: 1200, percentage: 42.2, avgSessionTime: 9.1 },
          { country: 'United Kingdom', users: 450, percentage: 15.8, avgSessionTime: 8.7 },
          { country: 'Germany', users: 380, percentage: 13.4, avgSessionTime: 7.9 }
        ]
      },
      systemPerformance: {
        responseTime: 245,
        errorRate: 0.8,
        throughput: 1250,
        uptime: 99.7,
        cpuUsage: 68.5,
        memoryUsage: 72.3,
        diskUsage: 45.2,
        networkTraffic: 850
      },
      businessMetrics: {
        revenue: 125000,
        transactions: 1250,
        conversionRate: 3.2,
        averageOrderValue: 100,
        customerLifetimeValue: 850,
        churnRate: 2.1,
        retentionRate: 97.9,
        growthRate: 15.7
      }
    },

    neuroweaver: {
      models: [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', version: '2024-01', modelType: 'text', capabilities: ['text-generation', 'analysis'], supportedTasks: ['chat', 'analysis'], maxTokens: 8192, contextWindow: 8192, costPer1kTokens: 0.03, avgLatency: 1200, status: 'active' },
        { id: 'claude-3', name: 'Claude 3 Opus', provider: 'anthropic', version: 'opus', modelType: 'text', capabilities: ['text-generation', 'reasoning'], supportedTasks: ['chat', 'coding'], maxTokens: 4096, contextWindow: 4096, costPer1kTokens: 0.015, avgLatency: 1000, status: 'active' }
      ],
      performance: [
        {
          modelId: 'gpt-4',
          modelVersion: '2024-01',
          timeRange: { from: new Date('2024-01-01'), to: new Date() },
          totalRequests: 1250,
          successfulRequests: 1220,
          failedRequests: 30,
          successRate: 97.6,
          avgResponseTime: 3200,
          p95ResponseTime: 4800,
          p99ResponseTime: 6500,
          minResponseTime: 800,
          maxResponseTime: 12000,
          totalTokensUsed: 240000,
          promptTokens: 180000,
          completionTokens: 60000,
          avgTokensPerRequest: 192,
          totalCost: 7.2,
          avgCostPerRequest: 0.00576,
          costPer1kTokens: 0.03,
          avgConfidenceScore: 0.91,
          avgUserRating: 4.7,
          acceptanceRate: 85.2,
          errorRate: 2.4,
          topErrors: [
            { error: 'rate_limit_exceeded', count: 15, percentage: 50 },
            { error: 'invalid_request', count: 10, percentage: 33.3 },
            { error: 'server_error', count: 5, percentage: 16.7 }
          ],
          hourlyMetrics: [],
          lastUpdated: new Date()
        }
      ],
      prompts: [],
      promptAnalytics: {
        totalPrompts: 1250,
        uniquePrompts: 890,
        avgPromptLength: 145,
        avgOutputLength: 380,
        categoryPerformance: [],
        patterns: [],
        qualityMetrics: {
          avgRating: 4.6,
          acceptanceRate: 85.2,
          rejectionRate: 14.8,
          improvementSuggestions: []
        },
        trendingTopics: []
      },
      experiments: [],
      costOptimization: {
        totalCost: 15.8,
        projectedSavings: 3.2,
        optimizationOpportunities: [],
        costByModel: [],
        costByTime: [],
        recommendations: []
      },
      modelHealth: [],
      summary: {
        totalModels: 2,
        activeModels: 2,
        totalRequests: 2140,
        avgResponseTime: 3000,
        totalCost: 15.8,
        avgRating: 4.6,
        acceptanceRate: 85.2
      }
    },

    relaycore: {
      workflowAnalytics: {
        totalWorkflows: 450,
        activeWorkflows: 120,
        completedWorkflows: 25000,
        failedWorkflows: 1250,
        executionMetrics: {
          avgExecutionTime: 45000,
          successRate: 95.2,
          throughput: 45,
          resourceUtilization: 68.5
        },
        popularNodes: [
          { nodeType: 'ai_processor', usage: 1250, successRate: 96.8, avgExecutionTime: 5200 },
          { nodeType: 'data_transformer', usage: 890, successRate: 98.2, avgExecutionTime: 1200 },
          { nodeType: 'api_connector', usage: 675, successRate: 92.1, avgExecutionTime: 3200 }
        ],
        optimizationOpportunities: []
      },
      executionMetrics: {
        totalExecutions: 26250,
        successfulExecutions: 25000,
        failedExecutions: 1250,
        avgExecutionTime: 45000,
        p95ExecutionTime: 120000,
        throughput: 45,
        hourlyMetrics: [],
        topErrors: [],
        resourceMetrics: {
          cpuUsage: 68.5,
          memoryUsage: 72.3,
          networkTraffic: 850,
          diskUsage: 45.2
        }
      },
      optimizationInsights: []
    },

    correlations: [
      {
        id: 'user_ai_correlation',
        title: 'User Engagement vs AI Response Quality',
        description: 'Correlation between user session duration and AI response ratings',
        systems: ['auterity', 'neuroweaver'],
        correlation: 0.73,
        confidence: 0.89,
        statisticalSignificance: 0.001,
        impact: 'high',
        businessValue: 25000,
        chartType: 'scatter',
        data: {},
        recommendations: [],
        lastCalculated: new Date(),
        calculationMethod: 'pearson_correlation',
        dataPoints: 1250
      }
    ],

    insights: [
      {
        id: 'ai_performance_optimization',
        title: 'AI Model Performance Optimization Opportunity',
        type: 'opportunity',
        severity: 'medium',
        description: 'Switching to Claude-3 for creative tasks could save $2,400/month',
        summary: 'Model routing optimization identified',
        detailedAnalysis: 'Analysis of 2,140 AI requests shows Claude-3 outperforms GPT-4 for creative tasks by 28% while costing 50% less.',
        affectedSystems: ['neuroweaver', 'auterity'],
        primarySystem: 'neuroweaver',
        metrics: [
          { name: 'Monthly Savings', value: 2400, unit: 'USD' },
          { name: 'Performance Improvement', value: 28, unit: '%' },
          { name: 'User Satisfaction', value: 12, unit: '%' }
        ],
        confidence: 0.89,
        evidence: [],
        recommendations: [
          {
            id: 'implement_routing',
            title: 'Implement Smart Model Routing',
            description: 'Automatically route tasks to optimal models based on content analysis',
            actionType: 'short_term',
            priority: 'high',
            effort: 'medium',
            expectedImpact: { value: 2400, unit: 'USD', timeframe: 'monthly' },
            responsibleSystem: 'neuroweaver',
            dependencies: ['ai_model_orchestration_service']
          }
        ],
        detectedAt: new Date(),
        lastUpdated: new Date(),
        status: 'active'
      }
    ],

    health: {
      overall: 'healthy',
      score: 87,
      systems: {
        auterity: { status: 'healthy', score: 92, uptime: 99.7, avgResponseTime: 245, errorRate: 0.8, activeIssues: 0 },
        neuroweaver: { status: 'healthy', score: 85, uptime: 99.8, avgResponseTime: 3000, errorRate: 2.4, activeIssues: 1 },
        relaycore: { status: 'warning', score: 78, uptime: 98.5, avgResponseTime: 45000, errorRate: 4.8, activeIssues: 3 }
      },
      integration: {
        status: 'healthy',
        uptime: 99.9,
        latency: 150,
        errorRate: 0.1
      },
      activeIssues: [],
      predictions: {
        potentialIssues: []
      },
      lastUpdated: new Date()
    }
  }), [tenantId]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUnifiedData(mockUnifiedData);
        setRealtimeConnected(dashboardConfig.enableRealtime);
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    };

    loadData();

    // Set up auto-refresh
    const interval = setInterval(loadData, dashboardConfig.refreshInterval);
    return () => clearInterval(interval);
  }, [dashboardConfig.refreshInterval, dashboardConfig.enableRealtime, mockUnifiedData]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastRefresh(new Date());
    } catch (err) {
      setError('Refresh failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle export
  const handleExport = (format: string) => {
    // Implementation for export functionality
    console.log(`Exporting data in ${format} format`);
  };

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!unifiedData) return null;

    return {
      totalUsers: unifiedData.auterity.userAnalytics.totalUsers,
      activeModels: unifiedData.neuroweaver.summary.activeModels,
      totalWorkflows: unifiedData.relaycore.workflowAnalytics.totalWorkflows,
      systemHealth: unifiedData.health.score,
      aiRequests: unifiedData.neuroweaver.summary.totalRequests,
      businessRevenue: unifiedData.auterity.businessMetrics.revenue
    };
  }, [unifiedData]);

  if (loading && !unifiedData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading unified analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unified Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Cross-system intelligence combining business, AI, and workflow analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dashboardConfig.enableRealtime && (
            <Badge variant={realtimeConnected ? 'success' : 'warning'} className="mr-2">
              <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
              {realtimeConnected ? 'Live' : 'Offline'}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{summaryMetrics.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Models</p>
                  <p className="text-2xl font-bold">{summaryMetrics.activeModels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                  <p className="text-2xl font-bold">{summaryMetrics.totalWorkflows}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold">{summaryMetrics.systemHealth}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Requests</p>
                  <p className="text-2xl font-bold">{summaryMetrics.aiRequests.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold">${summaryMetrics.businessRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'business', label: 'Business', icon: Users },
            { id: 'ml', label: 'AI/ML', icon: Brain },
            { id: 'insights', label: 'Insights', icon: Lightbulb }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeView === 'overview' && unifiedData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BusinessAnalyticsPanel
              data={unifiedData.auterity}
              enableRealtime={dashboardConfig.enableRealtime}
            />
            <MLAnalyticsPanel
              data={unifiedData.neuroweaver}
              enableRealtime={dashboardConfig.enableRealtime}
            />
          </div>
        )}

        {activeView === 'business' && unifiedData && (
          <BusinessAnalyticsPanel
            data={unifiedData.auterity}
            enableRealtime={dashboardConfig.enableRealtime}
            expanded={true}
          />
        )}

        {activeView === 'ml' && unifiedData && (
          <MLAnalyticsPanel
            data={unifiedData.neuroweaver}
            enableRealtime={dashboardConfig.enableRealtime}
            expanded={true}
          />
        )}

        {activeView === 'insights' && unifiedData && (
          <CrossSystemInsights
            correlations={unifiedData.correlations}
            insights={unifiedData.insights}
            health={unifiedData.health}
            onInsightAction={onInsightAction}
            onAlertAction={onAlertAction}
          />
        )}
      </div>

      {/* Real-time Metrics Footer */}
      {dashboardConfig.enableRealtime && (
        <RealTimeMetrics
          isConnected={realtimeConnected}
          metrics={unifiedData ? {
            activeUsers: unifiedData.auterity.userAnalytics.activeUsers,
            aiRequestsPerSecond: 2.1,
            avgResponseTime: 3000,
            systemHealth: unifiedData.health.score,
            timestamp: new Date()
          } : undefined}
        />
      )}
    </div>
  );
};

export default UnifiedAnalyticsDashboard;
