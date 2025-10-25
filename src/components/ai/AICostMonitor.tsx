/**
 * AI Cost Monitor Component
 * 
 * Displays real-time cost tracking for AI services
 * Shows savings from local AI (Ollama) usage
 * Provides cost optimization recommendations
 */

import React, { useState, useEffect } from 'react';
import { aiSDKService } from '../../services/aiSDKService.js';

interface CostMetrics {
  total: number;
  byOperation: Record<string, number>;
  byProvider: Record<string, number>;
  savings: { ollama: number; total: number };
}

interface AICostMonitorProps {
  refreshInterval?: number;
  showOptimizationTips?: boolean;
  className?: string;
}

export const AICostMonitor: React.FC<AICostMonitorProps> = ({
  refreshInterval = 30000,
  showOptimizationTips = true,
  className = ''
}) => {
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<CostMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCostData();
    const interval = setInterval(loadCostData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadCostData = async () => {
    try {
      const metrics = aiSDKService.getCostSummary();
      setCostMetrics(metrics);
      
      // Add to historical data (keep last 24 hours)
      setHistoricalData(prev => {
        const updated = [...prev, { ...metrics, timestamp: Date.now() }];
        return updated.slice(-24); // Keep last 24 entries
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load cost data:', error);
      setLoading(false);
    }
  };

  const resetCosts = () => {
    aiSDKService.resetCostTracking();
    loadCostData();
  };

  const getOptimizationTips = (): string[] => {
    if (!costMetrics) return [];

    const tips: string[] = [];

    if (costMetrics.total > 10) {
      tips.push('💡 Consider using Ollama for development and testing to reduce costs');
    }

    if (!aiSDKService.isOllamaAvailable()) {
      tips.push('🚀 Install Ollama for free local AI processing');
    }

    if (costMetrics.byOperation['textResponse_openai'] > costMetrics.byOperation['textResponse_anthropic']) {
      tips.push('💰 Claude (Anthropic) is typically cheaper than GPT-4 for similar quality');
    }

    if (costMetrics.savings.ollama === 0) {
      tips.push('⚡ Switch to Ollama for non-critical tasks to save money');
    }

    return tips.slice(0, 3);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const calculateMonthlySavings = (): number => {
    if (!costMetrics || historicalData.length < 2) return 0;
    
    const dailySpend = costMetrics.total / (historicalData.length / 24);
    const monthlySavings = costMetrics.savings.ollama * 30;
    return monthlySavings;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Cost Monitor</h3>
            <p className="text-sm text-gray-600 mt-1">Track spending and optimize costs</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadCostData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={resetCosts}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Cost Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(costMetrics?.total || 0)}</div>
            <div className="text-sm text-gray-600 mt-1">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(costMetrics?.savings.ollama || 0)}</div>
            <div className="text-sm text-gray-600 mt-1">Ollama Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(calculateMonthlySavings())}</div>
            <div className="text-sm text-gray-600 mt-1">Monthly Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {costMetrics?.savings.ollama && costMetrics?.total > 0 
                ? Math.round((costMetrics.savings.ollama / (costMetrics.total + costMetrics.savings.ollama)) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Efficiency</div>
          </div>
        </div>

        {/* Cost Breakdown */}
        {costMetrics && Object.keys(costMetrics.byOperation).length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Cost by Operation</h4>
            <div className="space-y-2">
              {Object.entries(costMetrics.byOperation).map(([operation, cost]) => {
                const [operationType, provider] = operation.split('_');
                const percentage = costMetrics.total > 0 ? (cost / costMetrics.total) * 100 : 0;
                
                return (
                  <div key={operation} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        provider === 'ollama' ? 'bg-blue-500' :
                        provider === 'openai' ? 'bg-green-500' :
                        provider === 'anthropic' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {operationType} ({provider})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {formatCurrency(cost)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optimization Tips */}
        {showOptimizationTips && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-900 mb-2">💡 Optimization Tips</h4>
            <div className="space-y-2">
              {getOptimizationTips().map((tip, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-blue-800">{tip}</p>
                </div>
              ))}
              
              {getOptimizationTips().length === 0 && (
                <p className="text-sm text-blue-800">🎉 Great job! Your AI usage is already optimized.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICostMonitor;
