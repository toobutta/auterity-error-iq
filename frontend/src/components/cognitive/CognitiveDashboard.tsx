import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  RefreshCw,
  Play,
  Settings,
  Eye
} from 'lucide-react';

interface CognitiveInsight {
  insight_type: string;
  workflow_id: string;
  description: string;
  severity: string;
  metrics: Record<string, any>;
  recommendations: string[];
  confidence: number;
}

interface OptimizationRecommendation {
  workflow_id: string;
  optimization_type: string;
  priority: string;
  description: string;
  expected_impact: Record<string, number>;
  implementation_complexity: string;
  confidence_score: number;
  suggested_changes: Record<string, any>;
}

interface CognitiveStats {
  insights_generated: number;
  recommendations_generated: number;
  performance_model_accuracy?: number;
  clustering_model_silhouette_score?: number;
  cache_hit_rate: number;
  average_analysis_time: number;
  total_optimizations_performed: number;
}

const CognitiveDashboard: React.FC = () => {
  const [insights, setInsights] = useState<CognitiveInsight[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [stats, setStats] = useState<CognitiveStats | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'recommendations' | 'optimization' | 'evolution'>('insights');

  useEffect(() => {
    loadCognitiveStats();
  }, []);

  const loadCognitiveStats = async () => {
    try {
      const response = await fetch('/api/cognitive/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {

    }
  };

  const analyzeWorkflow = async (workflowId: string) => {
    if (!workflowId) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/cognitive/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId })
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
        setActiveTab('insights');
      }
    } catch (error) {

    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = async (workflowId: string) => {
    if (!workflowId) return;

    try {
      const response = await fetch('/api/cognitive/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
        setActiveTab('recommendations');
      }
    } catch (error) {

    }
  };

  const optimizeWorkflow = async (workflowId: string, optimizationType: string) => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/cognitive/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          optimization_type: optimizationType
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Optimization completed! Estimated improvements: ${JSON.stringify(result.estimated_improvements, null, 2)}`);
      }
    } catch (error) {

    } finally {
      setIsOptimizing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cognitive Automation</h1>
            <p className="text-gray-600">AI-powered workflow optimization and insights</p>
          </div>
        </div>
        <Button
          onClick={loadCognitiveStats}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Insights Generated</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.insights_generated}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Recommendations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recommendations_generated}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{(stats.cache_hit_rate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Optimizations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_optimizations_performed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Analysis</CardTitle>
          <CardDescription>
            Select a workflow to analyze with AI-powered cognitive automation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter workflow ID"
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              onClick={() => analyzeWorkflow(selectedWorkflow)}
              disabled={isAnalyzing || !selectedWorkflow}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Analyze
            </Button>
            <Button
              onClick={() => generateRecommendations(selectedWorkflow)}
              disabled={!selectedWorkflow}
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Recommendations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'insights', label: 'Insights', icon: Eye },
          { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
          { id: 'optimization', label: 'Optimization', icon: Zap },
          { id: 'evolution', label: 'Evolution', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Cognitive Insights</h2>
            {insights.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No insights available. Analyze a workflow to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {insights.map((insight, index) => (
                  <Card key={index} className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{insight.insight_type.replace('_', ' ').toUpperCase()}</CardTitle>
                        <Badge className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>
                      <CardDescription>{insight.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Metrics:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(insight.metrics).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 p-2 rounded">
                                <p className="text-xs text-gray-600">{key}</p>
                                <p className="text-sm font-medium">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {insight.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-600">{rec}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <Progress value={insight.confidence * 100} className="flex-1" />
                          <span className="text-sm font-medium">{(insight.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Optimization Recommendations</h2>
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recommendations available. Generate recommendations for a workflow.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{rec.description}</CardTitle>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority}
                        </Badge>
                      </div>
                      <CardDescription>
                        Type: {rec.optimization_type} | Complexity: {rec.implementation_complexity}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Expected Impact:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(rec.expected_impact).map(([key, value]) => (
                              <div key={key} className="bg-green-50 p-2 rounded">
                                <p className="text-xs text-gray-600">{key.replace('_', ' ')}</p>
                                <p className="text-sm font-medium text-green-700">
                                  +{(value * 100).toFixed(1)}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Confidence:</span>
                          <Progress value={rec.confidence_score * 100} className="flex-1" />
                          <span className="text-sm font-medium">{(rec.confidence_score * 100).toFixed(1)}%</span>
                        </div>
                        <Button
                          onClick={() => optimizeWorkflow(rec.workflow_id, rec.optimization_type)}
                          disabled={isOptimizing}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {isOptimizing ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Apply Optimization
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Workflow Optimization</h2>
            <Card>
              <CardHeader>
                <CardTitle>Automated Optimization</CardTitle>
                <CardDescription>
                  Apply AI-powered optimizations to improve workflow performance, cost, reliability, or efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { type: 'performance', label: 'Performance Optimization', icon: TrendingUp, color: 'bg-blue-500' },
                    { type: 'cost', label: 'Cost Optimization', icon: Target, color: 'bg-green-500' },
                    { type: 'reliability', label: 'Reliability Enhancement', icon: CheckCircle, color: 'bg-purple-500' },
                    { type: 'efficiency', label: 'Efficiency Improvement', icon: Zap, color: 'bg-orange-500' }
                  ].map((opt) => (
                    <Button
                      key={opt.type}
                      onClick={() => optimizeWorkflow(selectedWorkflow, opt.type)}
                      disabled={isOptimizing || !selectedWorkflow}
                      variant="outline"
                      className="h-24 flex flex-col items-center space-y-2"
                    >
                      <opt.icon className={`h-6 w-6 ${opt.color.replace('bg-', 'text-')}`} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Evolution Tab */}
        {activeTab === 'evolution' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Workflow Evolution</h2>
            <Card>
              <CardHeader>
                <CardTitle>Evolutionary Optimization</CardTitle>
                <CardDescription>
                  Use genetic algorithms to evolve workflows through multiple generations of optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Evolutionary optimization may take several minutes to complete.
                    The system will automatically evolve the workflow through multiple generations.
                  </AlertDescription>
                </Alert>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => {
                      // This would trigger the evolution endpoint
                      alert('Evolution feature coming soon! This will run genetic algorithms to optimize workflows.');
                    }}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Start Evolution
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CognitiveDashboard;


