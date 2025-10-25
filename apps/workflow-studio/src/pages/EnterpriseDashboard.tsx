/**
 * Enterprise Dashboard Page
 * Comprehensive dashboard showing all AI toolkit integrations and enterprise features
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@auterity/design-system';
import { Button } from '@auterity/design-system';
import { Badge } from '@auterity/design-system';
import { Progress } from '@auterity/design-system';
import { enterpriseOrchestrator, EnterpriseHealthStatus } from '../services/enterprise/EnterpriseOrchestrator';
import { unifiedAIOrchestrator } from '../services/langchain/UnifiedAIOrchestrator';

interface DashboardMetrics {
  activeWorkflows: number;
  totalCost: number;
  successRate: number;
  aiRequests: number;
  modelUsage: Record<string, number>;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
}

const EnterpriseDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeWorkflows: 0,
    totalCost: 0,
    successRate: 0,
    aiRequests: 0,
    modelUsage: {},
    systemHealth: 'healthy'
  });
  const [healthStatus, setHealthStatus] = useState<EnterpriseHealthStatus | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const health = enterpriseOrchestrator.getHealthStatus();
      const analytics = await enterpriseOrchestrator.generateAnalytics('day');
      const aiHealth = unifiedAIOrchestrator.getHealthStatus();

      setHealthStatus(health);
      setMetrics({
        activeWorkflows: health.metrics.activeWorkflows,
        totalCost: health.metrics.totalCost,
        successRate: health.metrics.successRate,
        aiRequests: Object.values(aiHealth.litellm?.requestsByModel || {}).reduce((a, b) => a + b, 0),
        modelUsage: aiHealth.litellm?.requestsByModel || {},
        systemHealth: health.overall
      });

      // Mock recent activities
      setRecentActivities([
        {
          id: '1',
          type: 'workflow',
          title: 'AI Content Generation Workflow Completed',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          status: 'success',
          details: 'Generated 5 blog posts using GPT-4 and Claude'
        },
        {
          id: '2',
          type: 'test',
          title: 'API Test Suite Executed',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          status: 'success',
          details: '12/12 tests passed in 45 seconds'
        },
        {
          id: '3',
          type: 'model',
          title: 'New Model Version Deployed',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          status: 'success',
          details: 'Stable Diffusion XL v2.1 deployed to production'
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enterprise Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive overview of your AI toolkit integrations and enterprise features
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button variant="primary" size="sm">
            Create Workflow
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">System Health</h3>
            <span className="text-2xl">{getStatusIcon(metrics.systemHealth)}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              <Badge className={getHealthColor(metrics.systemHealth)}>
                {metrics.systemHealth}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              All enterprise services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Workflows</h3>
            <span className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeWorkflows}</div>
            <p className="text-xs text-gray-600 mt-1">
              Currently executing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">AI Requests</h3>
            <span className="text-2xl">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.aiRequests.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Success Rate</h3>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <Progress value={metrics.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Services Status */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">AI Services Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthStatus && Object.entries(healthStatus.services).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium capitalize">{service}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeof status === 'object' && status !== null && 'totalRequests' in status
                        ? `${status.totalRequests} requests`
                        : 'Active'
                      }
                    </Badge>
                  </div>
                  <span className={`text-sm ${getHealthColor(
                    typeof status === 'object' && status !== null && 'successRate' in status
                      ? (status.successRate > 95 ? 'healthy' : status.successRate > 80 ? 'degraded' : 'unhealthy')
                      : 'healthy'
                  )}`}>
                    {typeof status === 'object' && status !== null && 'successRate' in status
                      ? `${status.successRate.toFixed(1)}%`
                      : 'OK'
                    }
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Usage */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Model Usage Today</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.modelUsage).map(([model, count]) => (
                <div key={model} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{model}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((count / Math.max(...Object.values(metrics.modelUsage))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activities</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <span className="text-lg">
                    {activity.type === 'workflow' ? '🔧' :
                     activity.type === 'test' ? '🧪' :
                     activity.type === 'model' ? '🤖' : '📋'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp.toLocaleString()}
                  </p>
                </div>
                <Badge className={
                  activity.status === 'success' ? 'bg-green-100 text-green-800' :
                  activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Actions</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-2xl">🎨</span>
              <span className="text-sm">New Workflow</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-2xl">🧪</span>
              <span className="text-sm">Run Tests</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-2xl">📊</span>
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <span className="text-2xl">⚙️</span>
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseDashboard;
