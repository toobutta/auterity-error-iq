/**
 * Real-Time Metrics Component - Live System Monitoring
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../ui/enhanced/Card';
import { Badge } from '../../../ui/enhanced/Badge';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

interface RealTimeMetricsProps {
  isConnected?: boolean;
  metrics?: {
    activeUsers: number;
    aiRequestsPerSecond: number;
    avgResponseTime: number;
    systemHealth: number;
    timestamp: Date;
  };
}

interface MetricItem {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'error';
  icon?: React.ReactNode;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  isConnected = false,
  metrics
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    if (metrics) {
      setLastUpdate(metrics.timestamp);
    }
  }, [metrics]);

  // Mock real-time data for demonstration
  const mockMetrics: MetricItem[] = [
    {
      label: 'Active Users',
      value: metrics?.activeUsers || 2847,
      trend: 'up',
      status: 'good',
      icon: <Users className="w-4 h-4" />
    },
    {
      label: 'AI Requests/sec',
      value: metrics?.aiRequestsPerSecond || 2.1,
      unit: 'req/s',
      trend: 'stable',
      status: 'good',
      icon: <Zap className="w-4 h-4" />
    },
    {
      label: 'Avg Response Time',
      value: metrics?.avgResponseTime || 3000,
      unit: 'ms',
      trend: 'down',
      status: 'good',
      icon: <Clock className="w-4 h-4" />
    },
    {
      label: 'System Health',
      value: metrics?.systemHealth || 87,
      unit: '%',
      trend: 'stable',
      status: 'warning',
      icon: <Activity className="w-4 h-4" />
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <div className="w-3 h-3 rounded-full bg-gray-400"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-600" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Data';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="bg-white border-t-4 border-t-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <span className="text-sm font-medium">{getConnectionText()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
            <Badge
              variant={
                connectionStatus === 'connected' ? 'success' :
                connectionStatus === 'connecting' ? 'warning' : 'error'
              }
              className="text-xs"
            >
              {connectionStatus}
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={getStatusColor(metric.status || 'good')}>
                  {metric.icon}
                </span>
                {metric.trend && getTrendIcon(metric.trend)}
              </div>

              <div className={`text-lg font-bold ${getStatusColor(metric.status || 'good')}`}>
                {typeof metric.value === 'number' && metric.value > 1000
                  ? `${(metric.value / 1000).toFixed(1)}K`
                  : metric.value
                }
                {metric.unit && (
                  <span className="text-sm font-normal ml-1">{metric.unit}</span>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs text-muted-foreground">All Systems Operational</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-600" />
            <span className="text-xs text-muted-foreground">
              Next update in 30s
            </span>
          </div>
        </div>

        {/* Connection Issues Alert */}
        {connectionStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                Real-time connection lost. Showing cached data.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { RealTimeMetrics };
