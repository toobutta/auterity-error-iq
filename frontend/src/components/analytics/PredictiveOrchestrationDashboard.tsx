import React, { useState, useMemo } from 'react';
import { usePredictiveOrchestration } from '../../hooks/usePredictiveOrchestration';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/workflow';

interface ExecutionHistory {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  status: 'success' | 'failed' | 'timeout';
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
  demandPattern: {
    timeOfDay: number;
    dayOfWeek: number;
    seasonalFactor: number;
    concurrentUsers: number;
  };
}

interface PredictiveOrchestrationDashboardProps {
  workflowId: string;
  executions: ExecutionHistory[];
  nodes: Node<NodeData>[];
  edges: Edge[];
  currentResources: {
    cpu: number;
    memory: number;
    network: number;
    storage: number;
  };
}

export const PredictiveOrchestrationDashboard: React.FC<PredictiveOrchestrationDashboardProps> = ({
  workflowId,
  executions,
  nodes,
  edges,
  currentResources
}) => {
  const { predictiveModel, insights, isAnalyzing, trainPredictiveModel } = usePredictiveOrchestration({
    workflowId,
    executions,
    nodes,
    edges,
    currentResources
  });

  const [activeTab, setActiveTab] = useState<'forecast' | 'resources' | 'schedule' | 'insights'>('forecast');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get risk level color
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing predictive patterns...</p>
        </div>
      </div>
    );
  }

  if (!predictiveModel || !insights) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔮</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Predictive Analytics</h3>
        <p className="text-gray-600 mb-4">Train a predictive model to see demand forecasts and optimization recommendations.</p>
        {executions.length >= 10 ? (
          <button
            onClick={trainPredictiveModel}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Train Predictive Model
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Need at least 10 executions to train the model ({executions.length}/10)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Predictive Orchestration</h2>
            <p className="text-gray-600 mt-1">
              AI-powered demand forecasting and automated optimization
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className={`text-lg font-bold px-3 py-1 rounded-full ${getConfidenceColor(predictiveModel.confidence)}`}>
                {Math.round(predictiveModel.confidence * 100)}% Confidence
              </div>
              <div className="text-xs text-gray-600 mt-1">Model Accuracy</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(insights.costSavings)}
              </div>
              <div className="text-sm text-gray-600">Monthly Savings</div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Next Peak</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatDate(insights.nextPeakTime)} {formatTime(insights.nextPeakTime)}
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Performance Gain</p>
                <p className="text-lg font-bold text-green-900">
                  +{insights.performanceImprovements.toFixed(1)}%
                </p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Scaling Strategy</p>
                <p className="text-lg font-bold text-purple-900 capitalize">
                  {predictiveModel.resourcePrediction.scalingStrategy}
                </p>
              </div>
              <div className="text-2xl">🔄</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'forecast', label: 'Demand Forecast', count: predictiveModel.demandForecast.length },
            { id: 'resources', label: 'Resource Planning', count: null },
            { id: 'schedule', label: 'Optimization Schedule', count: predictiveModel.optimizationSchedule.length },
            { id: 'insights', label: 'Risk & Insights', count: insights.riskAlerts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'forecast' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">24-Hour Demand Forecast</h3>
              <div className="text-sm text-gray-600">
                Updated: {predictiveModel.lastUpdated.toLocaleString()}
              </div>
            </div>

            {/* Forecast Chart Placeholder */}
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Demand Forecast Chart</h4>
              <p className="text-gray-600">Interactive forecast visualization</p>
            </div>

            {/* Forecast Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Executions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Key Factors
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {predictiveModel.demandForecast.slice(0, 12).map((forecast, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(forecast.timestamp)} {formatTime(forecast.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {forecast.predictedExecutions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(forecast.confidence)}`}>
                          {Math.round(forecast.confidence * 100)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-wrap gap-1">
                          {forecast.factors.slice(0, 2).map((factor, fIndex) => (
                            <span
                              key={fIndex}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded"
                            >
                              {factor.description}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Resource Planning & Optimization</h3>

            {/* Current vs Recommended */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Current Resources</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU Cores:</span>
                    <span className="font-medium">{currentResources.cpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory (MB):</span>
                    <span className="font-medium">{currentResources.memory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network (Mbps):</span>
                    <span className="font-medium">{currentResources.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage (GB):</span>
                    <span className="font-medium">{currentResources.storage}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-4">Recommended Resources</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">CPU Cores:</span>
                    <span className="font-medium text-blue-900">{predictiveModel.resourcePrediction.recommendedCpu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Memory (MB):</span>
                    <span className="font-medium text-blue-900">{predictiveModel.resourcePrediction.recommendedMemory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Instances:</span>
                    <span className="font-medium text-blue-900">{predictiveModel.resourcePrediction.recommendedInstances}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Strategy:</span>
                    <span className="font-medium text-blue-900 capitalize">{predictiveModel.resourcePrediction.scalingStrategy}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-4">Cost Optimization</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(predictiveModel.resourcePrediction.costEstimate)}
                  </div>
                  <div className="text-sm text-green-700">Optimized Monthly Cost</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(insights.costSavings)}
                  </div>
                  <div className="text-sm text-green-700">Monthly Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {insights.costSavings > 0 ? ((insights.costSavings / predictiveModel.resourcePrediction.costEstimate) * 100).toFixed(1) : '0'}%
                  </div>
                  <div className="text-sm text-green-700">Savings Percentage</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Automated Optimization Schedule</h3>

            {predictiveModel.optimizationSchedule.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">✅</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Optimizations Needed</h4>
                <p className="text-gray-600">Your workflow is already optimally configured.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictiveModel.optimizationSchedule.map((schedule, index) => (
                  <div key={`${schedule.timestamp.getTime()}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                            schedule.action === 'scale_up' ? 'bg-green-100 text-green-800' :
                            schedule.action === 'scale_down' ? 'bg-blue-100 text-blue-800' :
                            schedule.action === 'optimize' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {schedule.action.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(schedule.riskLevel)}`}>
                            {schedule.riskLevel} risk
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {schedule.targetResource} Optimization
                        </h4>
                        <p className="text-gray-600 text-sm mb-2">
                          Scheduled for {formatDate(schedule.timestamp)} at {formatTime(schedule.timestamp)}
                        </p>
                        <div className="text-sm text-gray-600">
                          Expected improvement: +{Math.round(schedule.expectedImprovement * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          +{Math.round(schedule.expectedImprovement * 100)}%
                        </div>
                        <div className="text-xs text-gray-600">improvement</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Risk Alerts & Recommendations</h3>

            {/* Recommendations */}
            {insights.recommendedOptimizations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">💡 Recommended Optimizations</h4>
                <ul className="space-y-2">
                  {insights.recommendedOptimizations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Alerts */}
            {insights.riskAlerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🛡️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Risk Alerts</h4>
                <p className="text-gray-600">Your predictive orchestration is running optimally.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.riskAlerts.map((alert, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    alert.level === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.level === 'high' ? 'bg-orange-50 border-orange-200' :
                    alert.level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getRiskColor(alert.level)}`}>
                            {alert.level} risk
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            Impact: {Math.round(alert.impact * 100)}%
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{alert.message}</h4>
                        <p className="text-gray-700 text-sm">{alert.recommendedAction}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          alert.level === 'critical' ? 'text-red-600' :
                          alert.level === 'high' ? 'text-orange-600' :
                          alert.level === 'medium' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {alert.level === 'critical' ? '🚨' :
                           alert.level === 'high' ? '⚠️' :
                           alert.level === 'medium' ? '⚡' :
                           'ℹ️'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


