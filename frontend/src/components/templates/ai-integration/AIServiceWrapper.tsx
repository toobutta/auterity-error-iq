// AI Service Integration Wrapper Component Template
// Pre-development template for Week 2 implementation

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Loader2, AlertCircle, CheckCircle, Zap, TrendingUp, Settings } from 'lucide-react';
import {
  AIServiceRequest,
  AIServiceResponse,
  AIIntegrationProps,
  UnifiedAIServiceConfig,
  AIServiceAnalytics
} from './types';
import { useUnifiedAIService } from './useUnifiedAIService';
import RoutingPolicySelector from './RoutingPolicySelector';

interface AIServiceWrapperProps extends AIIntegrationProps {
  title?: string;
  description?: string;
  showRoutingSelector?: boolean;
  showAnalytics?: boolean;
  showCostTracking?: boolean;
  compact?: boolean;
}

// Context for sharing AI service state across components
const AIServiceContext = createContext<{
  config: UnifiedAIServiceConfig;
  analytics: AIServiceAnalytics | null;
  updateConfig: (newConfig: Partial<UnifiedAIServiceConfig>) => void;
} | null>(null);

export const useAIServiceContext = () => {
  const context = useContext(AIServiceContext);
  if (!context) {
    throw new Error('useAIServiceContext must be used within AIServiceProvider');
  }
  return context;
};

const AIServiceProvider: React.FC<{
  children: React.ReactNode;
  initialConfig?: UnifiedAIServiceConfig;
}> = ({ children, initialConfig }) => {
  const [config, setConfig] = useState<UnifiedAIServiceConfig>({
    defaultProvider: 'gpt-4',
    enableRouting: true,
    enableCostOptimization: true,
    enableCaching: true,
    fallbackEnabled: true,
    monitoringEnabled: true,
    ...initialConfig
  });

  const [analytics, setAnalytics] = useState<AIServiceAnalytics | null>(null);

  const updateConfig = (newConfig: Partial<UnifiedAIServiceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // Mock analytics data
  useEffect(() => {
    if (config.monitoringEnabled) {
      setAnalytics({
        totalRequests: 1250,
        totalCost: 45.67,
        avgResponseTime: 2.3,
        successRate: 98.7,
        providerUsage: {
          'gpt-4-turbo': 450,
          'claude-3-opus': 380,
          'gpt-3.5-turbo': 420
        },
        costSavings: 15.5,
        period: 'daily'
      });
    }
  }, [config.monitoringEnabled]);

  return (
    <AIServiceContext.Provider value={{ config, analytics, updateConfig }}>
      {children}
    </AIServiceContext.Provider>
  );
};

const AIServiceWrapper: React.FC<AIServiceWrapperProps> = ({
  config: propConfig,
  title = "AI Service Integration",
  description = "Intelligent AI service routing with cost optimization",
  showRoutingSelector = true,
  showAnalytics = false,
  showCostTracking = true,
  compact = false,
  onResponse,
  onError,
  children
}) => {
  const context = useAIServiceContext();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Use context config if available, otherwise use prop config
  const effectiveConfig = context?.config || propConfig || {
    defaultProvider: 'gpt-4',
    enableRouting: true,
    enableCostOptimization: true,
    enableCaching: true,
    fallbackEnabled: true,
    monitoringEnabled: true
  };

  const aiService = useUnifiedAIService(effectiveConfig);

  // Handle policy changes
  const handlePolicyChange = (policyId: string) => {
    setSelectedPolicyId(policyId);
    if (effectiveConfig.enableRouting) {
      // Update routing configuration
      context?.updateConfig({ defaultProvider: policyId });
    }
  };

  // Enhanced execute function with error handling and analytics
  const handleExecute = async (request: AIServiceRequest) => {
    setIsProcessing(true);
    try {
      const response = await aiService.execute(request);
      onResponse?.(response);

      // Update analytics if monitoring is enabled
      if (context?.analytics && effectiveConfig.monitoringEnabled) {
        // In real implementation, this would update the analytics service
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError?.(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {showRoutingSelector && (
          <RoutingPolicySelector
            selectedPolicyId={selectedPolicyId}
            onPolicyChange={handlePolicyChange}
            compact={true}
          />
        )}
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleExecute({ prompt: 'Test request' })}
            disabled={isProcessing}
            size="sm"
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Execute AI Request
          </Button>
          {aiService.lastResponse && (
            <Badge variant="secondary">
              Last: {aiService.lastResponse.metadata.responseTime.toFixed(1)}s
            </Badge>
          )}
        </div>
        {aiService.error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{aiService.error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {effectiveConfig.enableRouting && (
              <Badge variant="secondary">Routing Enabled</Badge>
            )}
            {effectiveConfig.enableCostOptimization && (
              <Badge variant="secondary">Cost Optimized</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Routing Policy Selector */}
        {showRoutingSelector && (
          <div>
            <h3 className="text-sm font-medium mb-3">Routing Configuration</h3>
            <RoutingPolicySelector
              selectedPolicyId={selectedPolicyId}
              onPolicyChange={handlePolicyChange}
              showAnalytics={showAnalytics}
            />
          </div>
        )}

        {/* Configuration Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {effectiveConfig.defaultProvider || 'gpt-4'}
            </div>
            <div className="text-xs text-muted-foreground">Default Provider</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {effectiveConfig.enableRouting ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-muted-foreground">Intelligent Routing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {effectiveConfig.enableCostOptimization ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-muted-foreground">Cost Optimization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {effectiveConfig.enableCaching ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-muted-foreground">Response Caching</div>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && context?.analytics && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-4 w-4" />
              <h3 className="font-medium">Performance Analytics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Requests</div>
                <div className="text-xl font-bold">{context.analytics.totalRequests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-xl font-bold">{context.analytics.avgResponseTime.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-xl font-bold text-green-600">{context.analytics.successRate}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Cost Savings</div>
                <div className="text-xl font-bold text-green-600">{context.analytics.costSavings}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Tracking */}
        {showCostTracking && aiService.lastResponse && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Last Request Cost</h3>
              <Badge variant="outline">
                ${aiService.lastResponse.usage.cost.toFixed(4)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Tokens Used</div>
                <div className="font-medium">{aiService.lastResponse.usage.totalTokens}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Response Time</div>
                <div className="font-medium">{aiService.lastResponse.metadata.responseTime.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Provider Used</div>
                <div className="font-medium">{aiService.lastResponse.provider}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {aiService.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>AI Service Error</AlertTitle>
            <AlertDescription>{aiService.error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing AI request...</span>
          </div>
        )}

        {/* Custom Content */}
        {children && (
          <div className="border-t pt-4">
            {typeof children === 'function'
              ? children({ execute: handleExecute, isLoading: isProcessing })
              : children
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export both components
export { AIServiceProvider };
export default AIServiceWrapper;
