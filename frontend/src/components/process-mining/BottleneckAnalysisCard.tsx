import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, Clock, TrendingDown, Lightbulb } from 'lucide-react';

interface BottleneckAnalysis {
  step_name: string;
  avg_duration: number;
  max_duration: number;
  frequency: number;
  impact_score: number;
  recommendations: string[];
}

interface BottleneckAnalysisCardProps {
  bottleneck: BottleneckAnalysis;
}

export const BottleneckAnalysisCard: React.FC<BottleneckAnalysisCardProps> = ({
  bottleneck
}) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getSeverityLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Clock className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const severity = getSeverityLevel(bottleneck.impact_score);

  return (
    <Card className={`h-full border-l-4 ${getSeverityColor(severity).split(' ')[2]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getSeverityIcon(severity)}
            <Badge className={getSeverityColor(severity)}>
              {severity.toUpperCase()}
            </Badge>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Impact: {(bottleneck.impact_score * 100).toFixed(1)}%
          </div>
        </div>
        <CardTitle className="text-lg font-medium">
          {bottleneck.step_name}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Avg Duration</span>
            </div>
            <div className="text-lg font-semibold text-blue-700">
              {formatDuration(bottleneck.avg_duration)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs text-gray-600">Max Duration</span>
            </div>
            <div className="text-lg font-semibold text-red-700">
              {formatDuration(bottleneck.max_duration)}
            </div>
          </div>
        </div>

        {/* Frequency */}
        <div className="space-y-1">
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-gray-600">Execution Frequency</span>
          </div>
          <div className="text-lg font-semibold text-purple-700">
            {bottleneck.frequency} times
          </div>
        </div>

        {/* Recommendations */}
        {bottleneck.recommendations && bottleneck.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Recommendations</span>
            </div>
            <div className="space-y-2">
              {bottleneck.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-2 bg-yellow-50 rounded-md"
                >
                  <div className="flex-shrink-0 w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-yellow-800">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Visualization */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Performance Impact</span>
            <span>{(bottleneck.impact_score * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                severity === 'critical'
                  ? 'bg-red-500'
                  : severity === 'high'
                  ? 'bg-orange-500'
                  : severity === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${bottleneck.impact_score * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


