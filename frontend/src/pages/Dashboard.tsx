import React, { useEffect, useState, Suspense, lazy } from 'react';
import Layout from '../components/Layout';
import { getDashboardMetrics, DashboardMetrics } from '../api/workflows';

// Lazy load the PerformanceDashboard to reduce initial bundle size
const PerformanceDashboard = lazy(() => 
  import('../components/PerformanceDashboard').then(module => ({
    default: module.PerformanceDashboard
  }))
);

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon, 
  loading = false 
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center text-sm ${getTrendColor()} mt-2`}>
              <span className="mr-1">{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-gray-400 text-2xl ml-4">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    try {
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load dashboard metrics');
      console.error('Dashboard metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Monitor your workflow automation performance
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={fetchMetrics}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Workflows"
            value={metrics?.totalWorkflows ?? 0}
            subtitle="Active workflows"
            icon="⚙️"
            loading={loading}
          />
          <MetricCard
            title="Success Rate"
            value={metrics ? formatPercentage(metrics.successRate) : '0%'}
            subtitle="Last 30 days"
            trend={metrics && metrics.successRate > 0.85 ? 'up' : metrics && metrics.successRate < 0.7 ? 'down' : 'neutral'}
            trendValue={metrics ? `${metrics.totalExecutions} executions` : '0 executions'}
            icon="✅"
            loading={loading}
          />
          <MetricCard
            title="Avg Execution Time"
            value={metrics ? formatTime(metrics.averageExecutionTime) : '0ms'}
            subtitle="Per workflow"
            icon="⏱️"
            loading={loading}
          />
          <MetricCard
            title="Active Now"
            value={metrics?.activeExecutions ?? 0}
            subtitle="Running workflows"
            icon="🔄"
            loading={loading}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Today's Executions"
            value={metrics?.executionsToday ?? 0}
            subtitle="Workflows executed today"
            icon="📊"
            loading={loading}
          />
          <MetricCard
            title="This Week"
            value={metrics?.executionsThisWeek ?? 0}
            subtitle="Weekly execution count"
            icon="📈"
            loading={loading}
          />
          <MetricCard
            title="Failed Executions"
            value={metrics?.failedExecutions ?? 0}
            subtitle="Requiring attention"
            trend={metrics && metrics.failedExecutions > 0 ? 'down' : 'neutral'}
            icon="❌"
            loading={loading}
          />
        </div>

        {/* Performance Dashboard */}
        <div className="mb-8">
          <Suspense fallback={
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-80 bg-gray-200 rounded"></div>
              </div>
            </div>
          }>
            <PerformanceDashboard showSystemMetrics={true} />
          </Suspense>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/workflows"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mr-3">⚙️</div>
              <div>
                <h3 className="font-medium text-gray-900">Create Workflow</h3>
                <p className="text-sm text-gray-600">Build a new AI workflow</p>
              </div>
            </a>
            <a
              href="/templates"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mr-3">📋</div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Templates</h3>
                <p className="text-sm text-gray-600">Use pre-built templates</p>
              </div>
            </a>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Detailed performance metrics</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;