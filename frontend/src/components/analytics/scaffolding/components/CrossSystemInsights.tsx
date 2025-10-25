/**
 * Cross-System Insights - Unified Analytics & Correlations
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/enhanced/Card';
import { Button } from '../../../ui/enhanced/Button';
import { Badge } from '../../../ui/enhanced/Badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  ArrowRight,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Info,
  X
} from 'lucide-react';

// Import types
import {
  SystemCorrelation,
  UnifiedInsight,
  SystemHealth
} from '../types/integration.types';

interface CrossSystemInsightsProps {
  correlations: SystemCorrelation[];
  insights: UnifiedInsight[];
  health: SystemHealth;
  onInsightAction?: (insightId: string, action: string) => void;
  onAlertAction?: (alertId: string, action: string) => void;
}

const CrossSystemInsights: React.FC<CrossSystemInsightsProps> = ({
  correlations,
  insights,
  health,
  onInsightAction,
  onAlertAction
}) => {
  const [selectedInsight, setSelectedInsight] = useState<UnifiedInsight | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Filter insights by severity
  const filteredInsights = insights.filter(insight =>
    filterSeverity === 'all' || insight.severity === filterSeverity
  );

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  // Prepare correlation chart data
  const correlationData = correlations.map(corr => ({
    systems: `${corr.systems[0]} ↔ ${corr.systems[1]}`,
    correlation: corr.correlation,
    confidence: corr.confidence,
    impact: corr.impact,
    value: corr.businessValue
  }));

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            System Health Overview
          </CardTitle>
          <CardDescription>
            Real-time health status across all integrated systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Health */}
            <div className="text-center p-4 border rounded-lg">
              <div className={`text-3xl font-bold mb-2 ${
                health.overall === 'healthy' ? 'text-green-600' :
                health.overall === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {health.score}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Health</div>
              <Badge
                variant={
                  health.overall === 'healthy' ? 'success' :
                  health.overall === 'warning' ? 'warning' : 'error'
                }
                className="mt-1"
              >
                {health.overall}
              </Badge>
            </div>

            {/* Individual Systems */}
            {Object.entries(health.systems).map(([system, sysHealth]) => (
              <div key={system} className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold mb-1 ${
                  sysHealth.status === 'healthy' ? 'text-green-600' :
                  sysHealth.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {sysHealth.score}%
                </div>
                <div className="text-sm text-muted-foreground capitalize">{system}</div>
                <Badge
                  variant={
                    sysHealth.status === 'healthy' ? 'success' :
                    sysHealth.status === 'warning' ? 'warning' : 'error'
                  }
                  className="mt-1"
                >
                  {sysHealth.status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Integration Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Cross-System Integration</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={health.integration.status === 'healthy' ? 'success' : 'warning'}>
                  {health.integration.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {health.integration.latency}ms latency
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cross-System Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Cross-System Correlations
          </CardTitle>
          <CardDescription>
            Statistical relationships and insights between different systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Correlation Chart */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Correlation Strength</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={correlationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="systems" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Correlation']}
                  />
                  <Bar dataKey="correlation" fill="#3b82f6" name="Correlation" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Correlation Details */}
            <div className="space-y-4">
              {correlations.map((correlation) => (
                <Card key={correlation.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-2">{correlation.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {correlation.description}
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Correlation:</span>
                            <div className="font-medium">
                              {(correlation.correlation * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence:</span>
                            <div className="font-medium">
                              {(correlation.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Business Value:</span>
                            <div className="font-medium text-green-600">
                              ${correlation.businessValue.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={
                            correlation.impact === 'critical' ? 'error' :
                            correlation.impact === 'high' ? 'warning' :
                            correlation.impact === 'medium' ? 'info' : 'success'
                          }
                        >
                          {correlation.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            Unified Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-generated insights and actionable recommendations across all systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Controls */}
          <div className="flex gap-2 mb-6">
            {[
              { value: 'all', label: 'All Insights' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={filterSeverity === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSeverity(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 hover:shadow-md transition-shadow cursor-pointer ${
                  insight.severity === 'critical' ? 'border-l-red-500' :
                  insight.severity === 'high' ? 'border-l-orange-500' :
                  insight.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}
                onClick={() => setSelectedInsight(insight)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(insight.severity)}
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.summary}
                      </p>

                      {/* Key Metrics */}
                      {insight.metrics.length > 0 && (
                        <div className="flex gap-4 mb-3">
                          {insight.metrics.slice(0, 3).map((metric, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-muted-foreground">{metric.name}:</span>
                              <span className="font-medium ml-1">
                                {metric.value.toLocaleString()}{metric.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Affected Systems */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Affects:</span>
                        {insight.affectedSystems.map((system) => (
                          <Badge key={system} variant="outline" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInsightAction?.(insight.id, 'view_details');
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInsightAction?.(insight.id, 'take_action');
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Action
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInsights.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Found</h3>
              <p className="text-muted-foreground">
                {filterSeverity === 'all'
                  ? 'No insights are currently available.'
                  : `No ${filterSeverity} priority insights found.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(selectedInsight.severity)}
                  <CardTitle>{selectedInsight.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedInsight(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Badge className={getSeverityColor(selectedInsight.severity)}>
                {selectedInsight.severity} priority
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{selectedInsight.summary}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Detailed Analysis</h4>
                <p className="text-sm text-muted-foreground">{selectedInsight.detailedAnalysis}</p>
              </div>

              {/* Recommendations */}
              {selectedInsight.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recommended Actions</h4>
                  <div className="space-y-3">
                    {selectedInsight.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{rec.title}</h5>
                          <Badge
                            variant={
                              rec.priority === 'critical' ? 'error' :
                              rec.priority === 'high' ? 'warning' :
                              rec.priority === 'medium' ? 'info' : 'success'
                            }
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span>Effort: {rec.effort}</span>
                          <span className="text-green-600 font-medium">
                            Expected Impact: {rec.expectedImpact.value}{rec.expectedImpact.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    onInsightAction?.(selectedInsight.id, 'implement');
                    setSelectedInsight(null);
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Implement Recommendations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInsight(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { CrossSystemInsights };
