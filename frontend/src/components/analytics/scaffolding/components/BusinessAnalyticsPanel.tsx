/**
 * Business Analytics Panel - User Behavior & System Performance
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
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Target
} from 'lucide-react';

// Import types
import { UserAnalytics, SystemPerformance, BusinessMetrics } from '../types/analytics.types';

interface BusinessAnalyticsPanelProps {
  data: {
    userAnalytics: UserAnalytics;
    systemPerformance: SystemPerformance;
    businessMetrics: BusinessMetrics;
  };
  enableRealtime?: boolean;
  expanded?: boolean;
}

const BusinessAnalyticsPanel: React.FC<BusinessAnalyticsPanelProps> = ({
  data,
  enableRealtime = false,
  expanded = false
}) => {
  const { userAnalytics, systemPerformance, businessMetrics } = data;

  // Prepare chart data
  const userJourneyData = userAnalytics.userJourney.map(step => ({
    step: step.step.split(' ')[0], // Shorten for chart
    users: step.users,
    dropoff: step.dropoff
  }));

  const deviceData = userAnalytics.deviceBreakdown.map(device => ({
    name: device.device.charAt(0).toUpperCase() + device.device.slice(1),
    value: device.percentage,
    count: device.users
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {!expanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Business Intelligence Overview
            </CardTitle>
            <CardDescription>
              User behavior, system performance, and business metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="font-medium">{userAnalytics.activeUsers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Session Time</span>
                  <span className="font-medium">{userAnalytics.sessionDuration}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Page Views</span>
                  <span className="font-medium">{userAnalytics.pageViews.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-medium">{systemPerformance.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Uptime</span>
                  <span className="font-medium">{systemPerformance.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-medium">${businessMetrics.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expanded && (
        <>
          {/* User Analytics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                User Analytics
              </CardTitle>
              <CardDescription>
                Detailed user behavior and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{userAnalytics.totalUsers.toLocaleString()}</div>
                  <div className="text-sm text-blue-600">Total Users</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{userAnalytics.activeUsers.toLocaleString()}</div>
                  <div className="text-sm text-green-600">Active Users</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{userAnalytics.sessionDuration}m</div>
                  <div className="text-sm text-purple-600">Avg Session</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{userAnalytics.pageViews.toLocaleString()}</div>
                  <div className="text-sm text-orange-600">Page Views</div>
                </div>
              </div>

              {/* User Journey Chart */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4">User Journey</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={userJourneyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Device Breakdown */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Device Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
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
              </div>
            </CardContent>
          </Card>

          {/* System Performance Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                System Performance
              </CardTitle>
              <CardDescription>
                Infrastructure health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{systemPerformance.responseTime}ms</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                  <Badge variant={systemPerformance.responseTime < 300 ? 'success' : 'warning'} className="mt-1">
                    {systemPerformance.responseTime < 300 ? 'Good' : 'Slow'}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{systemPerformance.errorRate}%</div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <Badge variant={systemPerformance.errorRate < 1 ? 'success' : 'error'} className="mt-1">
                    {systemPerformance.errorRate < 1 ? 'Low' : 'High'}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{systemPerformance.uptime}%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                  <Badge variant={systemPerformance.uptime > 99 ? 'success' : 'warning'} className="mt-1">
                    {systemPerformance.uptime > 99 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{systemPerformance.throughput}</div>
                  <div className="text-sm text-muted-foreground">Throughput</div>
                  <Badge variant="info" className="mt-1">req/min</Badge>
                </div>
              </div>

              {/* Performance Trends */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Performance Trends</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { time: '00:00', responseTime: 245, throughput: 1250 },
                    { time: '04:00', responseTime: 260, throughput: 1180 },
                    { time: '08:00', responseTime: 280, throughput: 1420 },
                    { time: '12:00', responseTime: 295, throughput: 1380 },
                    { time: '16:00', responseTime: 275, throughput: 1350 },
                    { time: '20:00', responseTime: 250, throughput: 1200 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      name="Response Time (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="throughput"
                      stroke="#10b981"
                      name="Throughput"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Business Metrics Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Business Metrics
              </CardTitle>
              <CardDescription>
                Revenue, conversion, and growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${businessMetrics.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-600">Revenue</div>
                  <Badge variant="success" className="mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12.5%
                  </Badge>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {businessMetrics.conversionRate}%
                  </div>
                  <div className="text-sm text-blue-600">Conversion Rate</div>
                  <Badge variant="info" className="mt-1">
                    <Target className="w-3 h-3 mr-1" />
                    Target: 4%
                  </Badge>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${businessMetrics.averageOrderValue}
                  </div>
                  <div className="text-sm text-purple-600">Avg Order Value</div>
                  <Badge variant="success" className="mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8.2%
                  </Badge>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {businessMetrics.growthRate}%
                  </div>
                  <div className="text-sm text-orange-600">Growth Rate</div>
                  <Badge variant="success" className="mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +15.7%
                  </Badge>
                </div>
              </div>

              {/* Business Trends */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Business Trends</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[
                    { month: 'Jan', revenue: 95000, orders: 950, conversion: 2.8 },
                    { month: 'Feb', revenue: 105000, orders: 1050, conversion: 3.0 },
                    { month: 'Mar', revenue: 115000, orders: 1150, conversion: 3.1 },
                    { month: 'Apr', revenue: 120000, orders: 1200, conversion: 3.2 },
                    { month: 'May', revenue: 125000, orders: 1250, conversion: 3.2 }
                  ]}>
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
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Revenue ($)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversion"
                      stackId="2"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Conversion Rate (%)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export { BusinessAnalyticsPanel };
