import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { TrendingUp, Target, Activity, Clock } from 'lucide-react';

interface ProcessMiningResponse {
  workflow_id: string;
  analysis_period: any;
  total_executions: number;
  patterns_discovered: any[];
  bottlenecks: any[];
  efficiency_score: number;
  optimization_opportunities: string[];
  generated_at: string;
}

interface EfficiencyMetricsChartProps {
  analysis: ProcessMiningResponse;
}

export const EfficiencyMetricsChart: React.FC<EfficiencyMetricsChartProps> = ({
  analysis
}) => {
  const getEfficiencyColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getEfficiencyProgressColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate derived metrics
  const avgPatternsPerExecution = analysis.patterns_discovered?.length || 0;
  const bottleneckRatio = analysis.bottlenecks?.length
    ? (analysis.bottlenecks.length / Math.max(analysis.patterns_discovered?.length || 1, 1))
    : 0;

  const metrics = [
    {
      title: 'Overall Efficiency',
      value: `${(analysis.efficiency_score * 100).toFixed(1)}%`,
      icon: Target,
      color: getEfficiencyColor(analysis.efficiency_score),
      bgColor: getEfficiencyBgColor(analysis.efficiency_score),
      progressColor: getEfficiencyProgressColor(analysis.efficiency_score),
      description: 'Workflow performance score'
    },
    {
      title: 'Pattern Discovery',
      value: analysis.patterns_discovered?.length || 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progressColor: 'bg-blue-500',
      description: 'Execution patterns identified'
    },
    {
      title: 'Bottleneck Impact',
      value: `${(bottleneckRatio * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: bottleneckRatio > 0.3 ? 'text-red-600' : bottleneckRatio > 0.1 ? 'text-yellow-600' : 'text-green-600',
      bgColor: bottleneckRatio > 0.3 ? 'bg-red-100' : bottleneckRatio > 0.1 ? 'bg-yellow-100' : 'bg-green-100',
      progressColor: bottleneckRatio > 0.3 ? 'bg-red-500' : bottleneckRatio > 0.1 ? 'bg-yellow-500' : 'bg-green-500',
      description: 'Performance issues ratio'
    },
    {
      title: 'Total Executions',
      value: analysis.total_executions?.toLocaleString() || '0',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      progressColor: 'bg-purple-500',
      description: 'In analysis period'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Efficiency Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Efficiency Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getEfficiencyColor(analysis.efficiency_score)}`}>
                {(analysis.efficiency_score * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Overall Workflow Efficiency</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Performance Level</span>
                <span className={getEfficiencyColor(analysis.efficiency_score)}>
                  {analysis.efficiency_score >= 0.8 ? 'Excellent' :
                   analysis.efficiency_score >= 0.6 ? 'Good' :
                   analysis.efficiency_score >= 0.4 ? 'Fair' : 'Needs Improvement'}
                </span>
              </div>
              <Progress
                value={analysis.efficiency_score * 100}
                className="h-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Efficiency Components */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Efficiency Components</h4>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pattern Recognition</span>
                  <span className="text-sm font-medium">
                    {analysis.patterns_discovered?.length ? 'Excellent' : 'Limited'}
                  </span>
                </div>
                <Progress
                  value={analysis.patterns_discovered?.length ? 85 : 30}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bottleneck Management</span>
                  <span className="text-sm font-medium">
                    {analysis.bottlenecks?.length === 0 ? 'Excellent' :
                     analysis.bottlenecks?.length <= 2 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <Progress
                  value={analysis.bottlenecks?.length === 0 ? 90 :
                         analysis.bottlenecks?.length <= 2 ? 70 : 40}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Execution Consistency</span>
                  <span className="text-sm font-medium">
                    {analysis.efficiency_score >= 0.7 ? 'High' :
                     analysis.efficiency_score >= 0.5 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <Progress
                  value={analysis.efficiency_score * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Recommendations */}
            {analysis.optimization_opportunities?.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Key Recommendations</h4>
                <div className="space-y-2">
                  {analysis.optimization_opportunities.slice(0, 3).map((opportunity, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-xs font-medium text-blue-800">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


