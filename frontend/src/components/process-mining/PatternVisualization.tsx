import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Network, ArrowRight, Circle, Square } from 'lucide-react';

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

interface PatternVisualizationProps {
  patterns: ProcessPattern[];
}

export const PatternVisualization: React.FC<PatternVisualizationProps> = ({
  patterns
}) => {
  if (!patterns || patterns.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns to Visualize</h3>
            <p className="text-gray-600">Run analysis to discover workflow patterns for visualization.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPatternTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sequence':
        return <ArrowRight className="h-4 w-4" />;
      case 'parallel':
        return <Network className="h-4 w-4" />;
      case 'choice':
        return <Square className="h-4 w-4" />;
      case 'loop':
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
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

  const getNodeColor = (stepName: string, index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Pattern Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="h-5 w-5 text-blue-600" />
            <span>Pattern Visualization</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Visual representation of discovered workflow patterns and their relationships
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{patterns.length}</div>
              <div className="text-sm text-gray-600">Total Patterns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {patterns.filter(p => p.pattern_type === 'sequence').length}
              </div>
              <div className="text-sm text-gray-600">Sequences</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {patterns.filter(p => p.pattern_type === 'choice').length}
              </div>
              <div className="text-sm text-gray-600">Choices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {patterns.filter(p => p.pattern_type === 'parallel').length}
              </div>
              <div className="text-sm text-gray-600">Parallel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Flow Diagrams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {patterns.map((pattern, patternIndex) => (
          <Card key={pattern.pattern_id} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPatternTypeIcon(pattern.pattern_type)}
                  <Badge className={getPatternTypeColor(pattern.pattern_type)}>
                    {pattern.pattern_type}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(pattern.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
              <CardTitle className="text-base">
                Pattern {pattern.pattern_id.split('-').pop()}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* Visual Flow Representation */}
              <div className="space-y-4">
                {/* Pattern Steps Flow */}
                <div className="relative">
                  <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
                    {pattern.steps.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <div className="flex flex-col items-center space-y-2 min-w-max">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-sm ${getNodeColor(step, stepIndex)}`}>
                            {stepIndex + 1}
                          </div>
                          <div className="text-xs text-center max-w-20 truncate" title={step}>
                            {step}
                          </div>
                        </div>
                        {stepIndex < pattern.steps.length - 1 && (
                          <div className="flex items-center">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Pattern Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Frequency</div>
                    <div className="text-lg font-semibold text-blue-700">
                      {pattern.frequency}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Success Rate</div>
                    <div className="text-lg font-semibold text-green-700">
                      {(pattern.success_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Pattern Details */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Support: {(pattern.support * 100).toFixed(1)}%</div>
                  <div>Avg Duration: {Math.round(pattern.avg_duration)}s</div>
                  <div className="truncate">
                    First seen: {new Date(pattern.first_seen).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pattern Relationships */}
      {patterns.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pattern Relationships</CardTitle>
            <p className="text-sm text-gray-600">
              How different patterns interact within the workflow
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Pattern Connection Matrix */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Pattern</th>
                      <th className="text-left py-2 px-4">Type</th>
                      <th className="text-left py-2 px-4">Steps</th>
                      <th className="text-left py-2 px-4">Frequency</th>
                      <th className="text-left py-2 px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patterns.map((pattern, index) => (
                      <tr key={pattern.pattern_id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 font-medium">
                          {pattern.pattern_id.split('-').pop()}
                        </td>
                        <td className="py-2 px-4">
                          <Badge className={getPatternTypeColor(pattern.pattern_type)}>
                            {pattern.pattern_type}
                          </Badge>
                        </td>
                        <td className="py-2 px-4">
                          {pattern.steps.length} steps
                        </td>
                        <td className="py-2 px-4">
                          {pattern.frequency}
                        </td>
                        <td className="py-2 px-4">
                          {(pattern.confidence * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pattern Insights */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Pattern Insights</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Most frequent pattern: {
                    patterns.reduce((prev, current) =>
                      prev.frequency > current.frequency ? prev : current
                    ).pattern_type
                  }</li>
                  <li>• Highest confidence pattern: {
                    patterns.reduce((prev, current) =>
                      prev.confidence > current.confidence ? prev : current
                    ).pattern_type
                  }</li>
                  <li>• Total patterns analyzed: {patterns.length}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


