import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  StatCard,
  MetricCard,
  FeatureCard
} from '../ui/enhanced/Card';
import { Button } from '../ui/enhanced/Button';
import { Badge } from '../ui/enhanced/Badge';
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
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsDashboardProps {
  dateRange?: {
    from: Date;
    to: Date;
  };
  refreshInterval?: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dateRange,
  refreshInterval = 30000
}) => {
  // Main analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Tab management
  const [activeTab, setActiveTab] = useState<'overview' | 'performance'>('overview');

  // Mock data for demonstration - in real app, this would come from API

  const mockData = useMemo(() => ({
    summary: {
      totalEvents: 15420,
      uniqueUsers: 2847,
      totalSessions: 3892,
      avgSessionTime: 8.5,
      bounceRate: 23.4,
      pageViews: 45230
    },
    timeSeries: [
      { date: '2024-01-01', events: 1200, users: 340, sessions: 450 },
      { date: '2024-01-02', events: 1350, users: 380, sessions: 490 },
      { date: '2024-01-03', events: 1180, users: 320, sessions: 420 },
      { date: '2024-01-04', events: 1420, users: 410, sessions: 530 },
      { date: '2024-01-05', events: 1380, users: 395, sessions: 510 },
      { date: '2024-01-06', events: 1590, users: 450, sessions: 580 },
      { date: '2024-01-07', events: 1620, users: 470, sessions: 600 }
    ],
    deviceBreakdown: [
      { name: 'Desktop', value: 45.2, color: '#3b82f6' },
      { name: 'Mobile', value: 38.7, color: '#10b981' },
      { name: 'Tablet', value: 16.1, color: '#f59e0b' }
    ],
    topPages: [
      { page: '/dashboard', views: 8420, bounce: 15.2 },
      { page: '/workflows', views: 6230, bounce: 22.1 },
      { page: '/analytics', views: 4890, bounce: 18.7 },
      { page: '/settings', views: 3450, bounce: 31.2 },
      { page: '/reports', views: 2980, bounce: 25.8 }
    ],
    userJourney: [
      { step: 'Landing', users: 100, dropoff: 0 },
      { step: 'Dashboard View', users: 78, dropoff: 22 },
      { step: 'Workflow Creation', users: 45, dropoff: 42 },
      { step: 'Analytics Review', users: 32, dropoff: 29 },
      { step: 'Report Generation', users: 28, dropoff: 12 }
    ],
    performance: {
      avgResponseTime: 245,
      errorRate: 0.8,
      uptime: 99.7,
      throughput: 1250
    }
  }), []);

  // Load main analytics data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // In real app, fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockData);
      setLoading(false);
      setLastRefresh(new Date());
    };

    loadData();

    // Auto-refresh
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [dateRange, refreshInterval, mockData]);



  const handleRefresh = async () => {
    setLoading(true);
    // In real app, refetch data
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
    setLastRefresh(new Date());
  };

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    // In real app, trigger export
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into user behavior, system performance, and AI model analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
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
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={analyticsData.summary.totalEvents.toLocaleString()}
          change={{
            value: 12.5,
            trend: 'up',
            label: 'vs last week'
          }}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="Active Users"
          value={analyticsData.summary.uniqueUsers.toLocaleString()}
          change={{
            value: 8.3,
            trend: 'up',
            label: 'vs last week'
          }}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Avg Session Time"
          value={`${analyticsData.summary.avgSessionTime}m`}
          change={{
            value: 5.2,
            trend: 'up',
            label: 'vs last week'
          }}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Page Views"
          value={analyticsData.summary.pageViews.toLocaleString()}
          change={{
            value: 15.7,
            trend: 'up',
            label: 'vs last week'
          }}
          icon={<Eye className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Activity Over Time
            </CardTitle>
            <CardDescription>
              Daily events, users, and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="events"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Device Breakdown
            </CardTitle>
            <CardDescription>
              User distribution by device type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {analyticsData.deviceBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Response Time"
          value={`${analyticsData.performance.avgResponseTime}ms`}
          unit="ms"
          target={200}
          showProgress={true}
          color="success"
        />
        <MetricCard
          title="Error Rate"
          value={`${analyticsData.performance.errorRate}%`}
          unit="%"
          target={1}
          showProgress={true}
          color="warning"
        />
        <MetricCard
          title="System Uptime"
          value={`${analyticsData.performance.uptime}%`}
          unit="%"
          target={99.9}
          showProgress={true}
          color="success"
        />
        <MetricCard
          title="Throughput"
          value={analyticsData.performance.throughput.toLocaleString()}
          unit="req/min"
          target={1000}
          showProgress={true}
          color="info"
        />
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>
              Most visited pages and their bounce rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPages.map((page: any, index: number) => (
                <div key={page.page} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{page.page}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.views.toLocaleString()} views
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{page.bounce}%</p>
                    <p className="text-sm text-muted-foreground">bounce rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Journey */}
        <Card>
          <CardHeader>
            <CardTitle>User Journey</CardTitle>
            <CardDescription>
              Conversion funnel through key user flows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.userJourney.map((step: any, index: number) => (
                <div key={step.step} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{step.step}</p>
                      <p className="text-sm text-muted-foreground">
                        {step.users}% of users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={step.dropoff > 20 ? 'error' : step.dropoff > 10 ? 'warning' : 'success'}
                    >
                      {step.dropoff}% dropoff
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Generate reports and take actions based on insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              title="Generate Report"
              description="Create a detailed analytics report"
              icon={<BarChart3 className="w-5 h-5" />}
              action={
                <Button size="sm" onClick={() => handleExport('pdf')}>
                  Generate
                </Button>
              }
            />
            <FeatureCard
              title="Export Data"
              description="Download raw analytics data"
              icon={<Download className="w-5 h-5" />}
              action={
                <Button size="sm" variant="outline" onClick={() => handleExport('csv')}>
                  Export CSV
                </Button>
              }
            />
            <FeatureCard
              title="Schedule Report"
              description="Set up automated report delivery"
              icon={<Calendar className="w-5 h-5" />}
              action={
                <Button size="sm" variant="outline">
                  Schedule
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Models and ML Analytics moved to separate ModelHub component */}
    </div>
  );
};

export default AnalyticsDashboard;
