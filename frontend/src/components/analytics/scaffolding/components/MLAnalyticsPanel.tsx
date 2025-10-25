/**
 * ML Analytics Panel - AI Model Performance & Optimization
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/enhanced/Card';
import { Badge } from '../../../ui/enhanced/Badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Area,
  AreaChart
} from 'recharts';
import {
  Brain,
  MessageSquare,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

// Import types
import { MLAnalytics, ModelPerformance, PromptAnalytics } from '../types/ml.types';

interface MLAnalyticsPanelProps {
  data: MLAnalytics;
  enableRealtime?: boolean;
  expanded?: boolean;
}

const MLAnalyticsPanel: React.FC<MLAnalyticsPanelProps> = ({
  data,
  enableRealtime = false,
  expanded = false
}) => {
  const { summary, models, performance, promptAnalytics } = data;

  // Prepare chart data
  const modelComparisonData = performance.map(model => ({
    name: model.modelId.split('-')[0], // Shorten name for chart
    requests: model.totalRequests,
    successRate: model.successRate,
    avgRating: model.avgUserRating,
    cost: model.totalCost
  }));

  const promptQualityData = [
    { name: '5 Stars', value: Math.round(promptAnalytics.qualityMetrics.avgRating * 20), count: Math.round(promptAnalytics.totalPrompts * 0.4) },
    { name: '4 Stars', value: Math.round((promptAnalytics.qualityMetrics.avgRating - 1) * 20), count: Math.round(promptAnalytics.totalPrompts * 0.35) },
    { name: '3 Stars', value: Math.round((promptAnalytics.qualityMetrics.avgRating - 2) * 20), count: Math.round(promptAnalytics.totalPrompts * 0.15) },
    { name: '2 Stars', value: Math.round((promptAnalytics.qualityMetrics.avgRating - 3) * 20), count: Math.round(promptAnalytics.totalPrompts * 0.08) },
    { name: '1 Star', value: Math.round((promptAnalytics.qualityMetrics.avgRating - 4) * 20), count: Math.round(promptAnalytics.totalPrompts * 0.02) }
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="space-y-6">
      {!expanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI/ML Analytics Overview
            </CardTitle>
            <CardDescription>
              Model performance, prompt optimization, and cost analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Models</span>
                  <span className="font-medium">{summary.activeModels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="font-medium">{summary.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <span className="font-medium">{summary.avgRating.toFixed(1)} ⭐</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-medium">{(summary.avgResponseTime / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                  <span className="font-medium">{summary.acceptanceRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="font-medium">${summary.totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expanded && (
        <>
          {/* Model Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Model Performance Overview
              </CardTitle>
              <CardDescription>
                Key metrics and performance indicators for all AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{summary.totalRequests.toLocaleString()}</div>
                  <div className="text-sm text-purple-600">Total Requests</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.avgResponseTime.toFixed(0)}ms</div>
                  <div className="text-sm text-blue-600">Avg Response Time</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.avgRating.toFixed(1)}</div>
                  <div className="text-sm text-green-600">Avg User Rating</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">${summary.totalCost.toFixed(2)}</div>
                  <div className="text-sm text-orange-600">Total Cost</div>
                </div>
              </div>

              {/* Model Comparison Chart */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">Model Performance Comparison</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={modelComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="requests"
                      fill="#3b82f6"
                      name="Requests"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="successRate"
                      fill="#10b981"
                      name="Success Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Individual Model Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {performance.map((model) => (
              <Card key={model.modelId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      {model.modelId} {model.modelVersion && `v${model.modelVersion}`}
                    </span>
                    <Badge variant="secondary">
                      {model.acceptanceRate.toFixed(1)}% acceptance
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Performance metrics for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Requests</span>
                          <span className="font-medium">{model.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-medium text-green-600">
                            {model.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Response Time</span>
                          <span className="font-medium">
                            {(model.avgResponseTime / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Tokens</span>
                          <span className="font-medium">{model.avgTokensUsed.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Cost</span>
                          <span className="font-medium">${model.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Rating</span>
                          <span className="font-medium">
                            {model.avgUserRating.toFixed(1)} ⭐
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Confidence Score</span>
                          <span className="font-medium">
                            {(model.avgConfidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cost per Request</span>
                          <span className="font-medium">
                            ${model.avgCostPerRequest.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Indicators */}
                    <div className="flex gap-2">
                      <Badge
                        variant={model.successRate > 95 ? 'success' : model.successRate > 90 ? 'warning' : 'error'}
                      >
                        {model.successRate > 95 ? 'High' : model.successRate > 90 ? 'Medium' : 'Low'} Reliability
                      </Badge>
                      <Badge
                        variant={model.avgResponseTime < 3000 ? 'success' : model.avgResponseTime < 5000 ? 'warning' : 'error'}
                      >
                        {model.avgResponseTime < 3000 ? 'Fast' : model.avgResponseTime < 5000 ? 'Medium' : 'Slow'} Response
                      </Badge>
                      <Badge
                        variant={model.avgUserRating > 4.5 ? 'success' : model.avgUserRating > 4.0 ? 'warning' : 'error'}
                      >
                        {model.avgUserRating > 4.5 ? 'Excellent' : model.avgUserRating > 4.0 ? 'Good' : 'Needs Work'} Quality
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prompt Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Prompt Analytics & Quality
              </CardTitle>
              <CardDescription>
                Analysis of prompt effectiveness and user feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Distribution */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Response Quality Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={promptQualityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, count }) => count > 0 ? `${name}: ${count}` : ''}
                      >
                        {promptQualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Quality vs Performance Correlation */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Quality vs Performance</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <ScatterChart data={[
                      { tokens: 2450, time: 3.2, rating: 5, model: 'gpt-4' },
                      { tokens: 1890, time: 2.8, rating: 4, model: 'claude-3' },
                      { tokens: 3200, time: 4.1, rating: 5, model: 'gpt-4' },
                      { tokens: 1560, time: 2.1, rating: 4, model: 'claude-3' },
                      { tokens: 2780, time: 3.8, rating: 3, model: 'gpt-4' }
                    ]}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="time" name="Response Time (s)" />
                      <YAxis type="number" dataKey="rating" name="User Rating" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Prompts" dataKey="rating" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Quality Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{promptAnalytics.totalPrompts.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Prompts</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{promptAnalytics.uniquePrompts.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Unique Prompts</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{promptAnalytics.qualityMetrics.avgRating.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{promptAnalytics.qualityMetrics.acceptanceRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Acceptance Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Cost Analysis & Optimization
              </CardTitle>
              <CardDescription>
                API usage costs and optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Breakdown */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Cost by Model</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={performance.map(model => ({
                      name: model.modelId.split('-')[0],
                      cost: model.totalCost,
                      percentage: ((model.totalCost / summary.totalCost) * 100).toFixed(1)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cost" fill="#10b981" name="Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Cost Trends */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Cost Trends</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[
                      { day: 'Mon', cost: 2.1, requests: 420 },
                      { day: 'Tue', cost: 2.8, requests: 560 },
                      { day: 'Wed', cost: 2.4, requests: 480 },
                      { day: 'Thu', cost: 3.2, requests: 640 },
                      { day: 'Fri', cost: 3.8, requests: 760 },
                      { day: 'Sat', cost: 1.8, requests: 360 },
                      { day: 'Sun', cost: 1.5, requests: 300 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#10b981"
                        name="Daily Cost ($)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Cost Optimization Opportunities */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Optimization Opportunities
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">Model Routing Optimization</span>
                    <Badge variant="success">Save $240/month</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">Prompt Caching</span>
                    <Badge variant="info">Save $180/month</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">Batch Processing</span>
                    <Badge variant="warning">Save $120/month</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export { MLAnalyticsPanel };
