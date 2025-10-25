import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, TrendingUp, Target, ArrowRight } from 'lucide-react';

interface ProcessPattern {
  pattern_id: string;
  pattern_type: string;
  steps: string[];
  frequency: number;
  avg_duration: number;
  success_rate: number;
  confidence: number;
  support: number;
  first_seen: string;
  last_seen: string;
  metadata: Record<string, any>;
}

interface ProcessPatternCardProps {
  pattern: ProcessPattern;
}

export const ProcessPatternCard: React.FC<ProcessPatternCardProps> = ({ pattern }) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getPatternTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'sequence':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'parallel':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'choice':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'loop':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge className={getPatternTypeColor(pattern.pattern_type)}>
            {pattern.pattern_type}
          </Badge>
          <div className={`text-sm font-medium ${getConfidenceColor(pattern.confidence)}`}>
            {(pattern.confidence * 100).toFixed(1)}% confidence
          </div>
        </div>
        <CardTitle className="text-lg">
          Pattern {pattern.pattern_id.split('-').pop()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pattern Steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Execution Flow</h4>
          <div className="flex items-center space-x-2 flex-wrap">
            {pattern.steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="bg-gray-100 px-3 py-1 rounded-md text-sm">
                  {step}
                </div>
                {index < pattern.steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">Frequency</span>
            </div>
            <div className="text-lg font-semibold text-blue-700">
              {pattern.frequency}
            </div>
            <div className="text-xs text-gray-500">
              {(pattern.support * 100).toFixed(1)}% support
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-xs text-gray-600">Avg Duration</span>
            </div>
            <div className="text-lg font-semibold text-green-700">
              {formatDuration(pattern.avg_duration)}
            </div>
            <div className="text-xs text-gray-500">
              {(pattern.success_rate * 100).toFixed(1)}% success
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-gray-500">
            <span>First seen: {new Date(pattern.first_seen).toLocaleDateString()}</span>
            <span>Last seen: {new Date(pattern.last_seen).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Additional Metadata */}
        {pattern.metadata && Object.keys(pattern.metadata).length > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Additional Info</h4>
            <div className="text-xs text-gray-600">
              {Object.entries(pattern.metadata).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


