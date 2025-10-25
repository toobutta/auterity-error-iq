import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  Target,
  BarChart3,
  Zap,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { ProcessMiningService } from '../../services/processMiningService';
import { ProcessPatternCard } from './ProcessPatternCard';
import { BottleneckAnalysisCard } from './BottleneckAnalysisCard';
import { EfficiencyMetricsChart } from './EfficiencyMetricsChart';
import { PatternVisualization } from './PatternVisualization';

interface ProcessMiningDashboardProps {
  workflowId: string;
  className?: string;
}

export const ProcessMiningDashboard: React.FC<ProcessMiningDashboardProps> = ({
  workflowId,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const processMiningService = new ProcessMiningService();

  const analyzeWorkflow = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await processMiningService.analyzeWorkflow(workflowId);
      setAnalysis(result);
      setLastAnalyzed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const loadCachedAnalysis = async () => {
    try {
      const cached = await processMiningService.getCachedAnalysis(workflowId);
      if (cached) {
        setAnalysis(cached);
        setLastAnalyzed(new Date());
      }
    } catch (err) {

    }
  };

  useEffect(() => {
    loadCachedAnalysis();
  }, [workflowId]);

  const getEfficiencyColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBadgeVariant = (score: number) => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Process Mining Analysis</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Intelligent workflow pattern discovery and optimization insights
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzeWorkflow}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Efficiency Score</span>
                </div>
                <div className={`text-2xl font-bold mt-2 ${getEfficiencyColor(analysis.efficiency_score)}`}>
                  {(analysis.efficiency_score * 100).toFixed(1)}%
                </div>
                <Progress value={analysis.efficiency_score * 100} className="mt-2" />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Patterns Found</span>
                </div>
                <div className="text-2xl font-bold mt-2 text-green-700">
                  {analysis.patterns_discovered?.length || 0}
                </div>
                <p className="text-xs text-green-600 mt-1">Execution patterns identified</p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Bottlenecks</span>
                </div>
                <div className="text-2xl font-bold mt-2 text-orange-700">
                  {analysis.bottlenecks?.length || 0}
                </div>
                <p className="text-xs text-orange-600 mt-1">Performance issues detected</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Total Executions</span>
                </div>
                <div className="text-2xl font-bold mt-2 text-purple-700">
                  {analysis.total_executions?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-purple-600 mt-1">In analysis period</p>
              </div>
            </div>
          )}

          {lastAnalyzed && (
            <div className="text-sm text-gray-500">
              Last analyzed: {lastAnalyzed.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Tabs defaultValue="patterns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analysis.patterns_discovered?.map((pattern: any, index: number) => (
                <ProcessPatternCard key={index} pattern={pattern} />
              )) || (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No patterns discovered yet. Run analysis to identify workflow patterns.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bottlenecks" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analysis.bottlenecks?.map((bottleneck: any, index: number) => (
                <BottleneckAnalysisCard key={index} bottleneck={bottleneck} />
              )) || (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No bottlenecks detected. Your workflow is performing optimally.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4">
            <EfficiencyMetricsChart analysis={analysis} />
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            <PatternVisualization patterns={analysis.patterns_discovered || []} />
          </TabsContent>
        </Tabs>
      )}

      {/* Optimization Recommendations */}
      {analysis?.optimization_opportunities?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span>Optimization Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.optimization_opportunities.map((recommendation: string, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-yellow-800">{index + 1}</span>
                  </div>
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


