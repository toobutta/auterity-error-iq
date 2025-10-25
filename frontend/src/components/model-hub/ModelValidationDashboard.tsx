import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { modelConfigurationService, ModelHealthStatus, ModelValidationResult } from '../../../src/services/modelConfigService';

interface ModelValidationDashboardProps {
  className?: string;
}

export const ModelValidationDashboard: React.FC<ModelValidationDashboardProps> = ({
  className = ''
}) => {
  const [healthStatuses, setHealthStatuses] = useState<ModelHealthStatus[]>([]);
  const [validationResults, setValidationResults] = useState<ModelValidationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get all health statuses
      const healthData = modelConfigurationService.getAllModelHealth();
      setHealthStatuses(healthData);

      // Get all validation results
      const validationData = await modelConfigurationService.validateAllModels();
      setValidationResults(validationData);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load validation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      unhealthy: 'bg-red-100 text-red-800',
      unknown: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.unknown}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getHealthSummary = () => {
    const total = healthStatuses.length;
    const healthy = healthStatuses.filter(h => h.status === 'healthy').length;
    const degraded = healthStatuses.filter(h => h.status === 'degraded').length;
    const unhealthy = healthStatuses.filter(h => h.status === 'unhealthy').length;

    return { total, healthy, degraded, unhealthy };
  };

  const getValidationSummary = () => {
    const total = validationResults.length;
    const valid = validationResults.filter(v => v.is_valid).length;
    const invalid = total - valid;
    const warnings = validationResults.reduce((sum, v) => sum + v.warnings.length, 0);
    const errors = validationResults.reduce((sum, v) => sum + v.errors.length, 0);

    return { total, valid, invalid, warnings, errors };
  };

  const healthSummary = getHealthSummary();
  const validationSummary = getValidationSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Model Validation Dashboard</h2>
          <p className="text-gray-600">Monitor AI model health, performance, and configuration</p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={loadData}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthSummary.healthy}/{healthSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((healthSummary.healthy / healthSummary.total) * 100)}% healthy
            </p>
            <Progress
              value={(healthSummary.healthy / healthSummary.total) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Validation Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validationSummary.valid}/{validationSummary.total}</div>
            <p className="text-xs text-muted-foreground">
              {validationSummary.errors} errors, {validationSummary.warnings} warnings
            </p>
            <Progress
              value={(validationSummary.valid / validationSummary.total) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatuses.length > 0
                ? Math.round(healthStatuses.reduce((sum, h) => sum + (h.response_time || 0), 0) / healthStatuses.length)
                : 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>

        {/* Cost Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatuses.reduce((sum, h) => sum + (h.total_requests || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Status</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Health Status Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Health Status</CardTitle>
              <CardDescription>
                Real-time health monitoring of all configured AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthStatuses.map((status) => (
                  <div key={status.model_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status.status)}
                      <div>
                        <h4 className="font-medium">{status.model_name}</h4>
                        <p className="text-sm text-gray-600">{status.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status.status)}
                      {status.response_time && (
                        <span className="text-sm text-gray-500">
                          {status.response_time}ms
                        </span>
                      )}
                      {status.uptime_percentage && (
                        <span className="text-sm text-gray-500">
                          {status.uptime_percentage}% uptime
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {healthStatuses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No health data available. Models may still be initializing.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Validation</CardTitle>
              <CardDescription>
                Validation results for model configurations and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationResults.map((result) => (
                  <div key={result.model_name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{result.model_name}</h4>
                      <div className="flex items-center space-x-2">
                        {result.is_valid ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Errors */}
                    {result.errors.length > 0 && (
                      <Alert className="mb-3 border-red-200">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription>
                          <strong>Errors:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {result.errors.map((error, index) => (
                              <li key={index} className="text-red-700">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                      <Alert className="mb-3 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription>
                          <strong>Warnings:</strong>
                          <ul className="mt-1 list-disc list-inside">
                            {result.warnings.map((warning, index) => (
                              <li key={index} className="text-yellow-700">{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Performance Metrics */}
                    {result.performance_metrics && (
                      <div className="grid grid-cols-3 gap-4 mt-3 p-3 bg-gray-50 rounded">
                        <div>
                          <div className="text-sm text-gray-600">Latency</div>
                          <div className="font-medium">{result.performance_metrics.latency_ms}ms</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Throughput</div>
                          <div className="font-medium">{result.performance_metrics.throughput_req_per_sec} req/sec</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Memory</div>
                          <div className="font-medium">{result.performance_metrics.memory_usage_mb}MB</div>
                        </div>
                      </div>
                    )}

                    {/* Cost Analysis */}
                    {result.cost_analysis && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Est. Monthly Cost</div>
                            <div className="font-medium text-lg">${result.cost_analysis.estimated_monthly_cost}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Per Token</div>
                            <div className="text-sm">
                              In: ${(result.cost_analysis.input_cost_per_token * 1000000).toFixed(2)}/M<br/>
                              Out: ${(result.cost_analysis.output_cost_per_token * 1000000).toFixed(2)}/M
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {validationResults.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No validation data available.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance analysis across all models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Response Time Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Response Time Distribution</h4>
                  <div className="space-y-2">
                    {healthStatuses
                      .filter(h => h.response_time)
                      .sort((a, b) => (a.response_time || 0) - (b.response_time || 0))
                      .slice(0, 10)
                      .map((status) => (
                        <div key={status.model_name} className="flex items-center justify-between">
                          <span className="text-sm truncate">{status.model_name}</span>
                          <span className="text-sm font-medium">{status.response_time}ms</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Usage Statistics */}
                <div>
                  <h4 className="font-medium mb-3">Usage Statistics (24h)</h4>
                  <div className="space-y-2">
                    {healthStatuses
                      .filter(h => h.total_requests)
                      .sort((a, b) => (b.total_requests || 0) - (a.total_requests || 0))
                      .slice(0, 10)
                      .map((status) => (
                        <div key={status.model_name} className="flex items-center justify-between">
                          <span className="text-sm truncate">{status.model_name}</span>
                          <span className="text-sm font-medium">{status.total_requests?.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
