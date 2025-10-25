/**
 * Enhanced Analytics Dashboard - Pre-defined Page
 * Business Intelligence with ML Correlation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/enhanced/Card';
import { Button } from '../../../ui/enhanced/Button';
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
  Area,
  AreaChart,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  RefreshCw,
  Download,
  Settings,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  DollarSign,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Import scaffolded components
import { UnifiedAnalyticsDashboard } from '../scaffolding/components/UnifiedAnalyticsDashboard';

const EnhancedAnalyticsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'correlations'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demonstration
  const businessMetrics = [
    { name: 'Revenue', value: 125000, change: 12.5, trend: 'up' },
    { name: 'Users', value: 15420, change: 8.2, trend: 'up' },
    { name: 'Conversion', value: 3.2, change: -2.1, trend: 'down' },
    { name: 'Sessions', value: 28500, change: 15.7, trend: 'up' }
  ];

  const userJourneyData = [
    { step: 'Landing', users: 100, conversion: 100, dropoff: 0 },
    { step: 'Dashboard', users: 78, conversion: 78, dropoff: 22 },
    { step: 'Workflow', users: 45, conversion: 45, dropoff: 33 },
    { step: 'Complete', users: 32, conversion: 32, dropoff: 13 }
  ];

  const deviceData = [
    { name: 'Desktop', value: 47.4, count: 1350 },
    { name: 'Mobile', value: 42.2, count: 1200 },
    { name: 'Tablet', value: 10.4, count: 297 }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 95000, users: 12500, conversion: 2.8 },
    { month: 'Feb', revenue: 105000, users: 13500, conversion: 3.0 },
    { month: 'Mar', revenue: 115000, users: 14200, conversion: 3.1 },
    { month: 'Apr', revenue: 120000, users: 14800, conversion: 3.2 },
    { month: 'May', revenue: 125000, users: 15420, conversion: 3.2 }
  ];

  const aiCorrelationData = [
    { userEngagement: 0.8, aiQuality: 0.85, revenue: 120000 },
    { userEngagement: 0.75, aiQuality: 0.78, revenue: 105000 },
    { userEngagement: 0.82, aiQuality: 0.88, revenue: 135000 },
    { userEngagement: 0.79, aiQuality: 0.82, revenue: 118000 },
    { userEngagement: 0.85, aiQuality: 0.90, revenue: 142000 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting data in ${format} format`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Business intelligence with AI/ML correlation insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7D
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30D
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90D
            </Button>
            <Button
              variant={timeRange === '1y' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('1y')}
            >
              1Y
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {businessMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                  <p className="text-2xl font-bold">
                    {metric.name === 'Revenue' && '$'}
                    {metric.name === 'Users' || metric.name === 'Sessions'
                      ? metric.value.toLocaleString()
                      : metric.value
                    }
                    {metric.name === 'Conversion' && '%'}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  metric.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="flex items-center mt-2">
                <Badge
                  variant={metric.change > 0 ? 'success' : 'error'}
                  className="text-xs"
                >
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'detailed', label: 'Detailed Analysis', icon: Activity },
            { id: 'correlations', label: 'AI Correlations', icon: Target }
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

      {/* Content Areas */}
      <div className="space-y-6">
        {activeView === 'overview' && (
          <>
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & User Growth</CardTitle>
                <CardDescription>Monthly revenue and user acquisition trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Revenue ($)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="users"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Distribution</CardTitle>
                  <CardDescription>User access patterns by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Journey</CardTitle>
                  <CardDescription>Conversion funnel analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={userJourneyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="step" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="users" fill="#3b82f6" name="Users" />
                      <Bar dataKey="dropoff" fill="#ef4444" name="Drop-off %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeView === 'detailed' && (
          <>
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Detailed performance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">245ms</div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                    <Badge variant="success" className="mt-1">Good</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">0.8%</div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                    <Badge variant="warning" className="mt-1">Acceptable</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.7%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <Badge variant="success" className="mt-1">Excellent</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,250</div>
                    <div className="text-sm text-muted-foreground">Throughput</div>
                    <Badge variant="info" className="mt-1">req/min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle>Business Intelligence</CardTitle>
                <CardDescription>Revenue, conversion, and growth analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600">$125K</div>
                    <div className="text-sm text-emerald-600">Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">3.2%</div>
                    <div className="text-sm text-blue-600">Conversion</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$100</div>
                    <div className="text-sm text-purple-600">Avg Order</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">15.7%</div>
                    <div className="text-sm text-orange-600">Growth</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'correlations' && (
          <>
            {/* AI-Business Correlations */}
            <Card>
              <CardHeader>
                <CardTitle>AI-Business Intelligence Correlations</CardTitle>
                <CardDescription>How AI performance impacts business outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">User Engagement vs AI Quality</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart data={aiCorrelationData}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="userEngagement" name="User Engagement" />
                        <YAxis type="number" dataKey="aiQuality" name="AI Quality" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Data Points" dataKey="aiQuality" fill="#3b82f6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Correlation: +0.73 (Strong positive relationship)
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-4">AI Quality vs Revenue</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart data={aiCorrelationData}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="aiQuality" name="AI Quality" />
                        <YAxis type="number" dataKey="revenue" name="Revenue ($)" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Data Points" dataKey="revenue" fill="#10b981" />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Correlation: +0.85 (Very strong positive relationship)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Correlation Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>AI-driven insights from correlation analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium text-green-800">Strong AI-Business Correlation</h4>
                    </div>
                    <p className="text-sm text-green-700">
                      Higher AI response quality correlates with increased user engagement and revenue.
                      Optimizing AI models could drive significant business value.
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">Optimization Opportunity</h4>
                    </div>
                    <p className="text-sm text-blue-700">
                      Switching to Claude-3 for creative tasks could save $2,400/month while maintaining
                      or improving response quality.
                    </p>
                  </div>

                  <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <h4 className="font-medium text-orange-800">Response Time Impact</h4>
                    </div>
                    <p className="text-sm text-orange-700">
                      Faster AI responses (under 2 seconds) correlate with 23% higher user satisfaction
                      and 18% better conversion rates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Unified Analytics Integration */}
      <Card className="border-t-4 border-t-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Cross-System Integration
          </CardTitle>
          <CardDescription>
            Unified analytics combining business intelligence with AI/ML insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UnifiedAnalyticsDashboard
              tenantId="demo-tenant"
              config={{
                enableRealtime: true,
                refreshInterval: 30000,
                showPredictions: true,
                showCorrelations: true,
                defaultView: 'overview'
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { EnhancedAnalyticsDashboard };
