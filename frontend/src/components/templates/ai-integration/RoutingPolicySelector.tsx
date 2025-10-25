// Routing Policy Selector Component Template
// Pre-development template for Week 2 implementation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertTriangle, Settings, TrendingUp } from 'lucide-react';
import { RoutingPolicy, ProviderConfig, RoutingPolicyHookResult } from './types';

interface RoutingPolicySelectorProps {
  selectedPolicyId?: string;
  onPolicyChange?: (policyId: string) => void;
  showAnalytics?: boolean;
  compact?: boolean;
  className?: string;
}

const RoutingPolicySelector: React.FC<RoutingPolicySelectorProps> = ({
  selectedPolicyId,
  onPolicyChange,
  showAnalytics = false,
  compact = false,
  className = ''
}) => {
  const [policies, setPolicies] = useState<RoutingPolicy[]>([]);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<RoutingPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for pre-development
  useEffect(() => {
    setTimeout(() => {
      setPolicies([
        {
          id: 'enterprise-high-priority',
          name: 'Enterprise High Priority',
          description: 'Optimized routing for enterprise users with high performance requirements',
          priority: 1,
          conditions: {
            userTier: 'enterprise',
            performanceRequirement: 'high'
          },
          actions: {
            primaryProvider: 'gpt-4-turbo',
            fallbackProviders: ['claude-3-opus', 'gpt-4'],
            costOptimization: false,
            cachingEnabled: true
          },
          status: 'active'
        },
        {
          id: 'cost-optimized-standard',
          name: 'Cost Optimized Standard',
          description: 'Balance cost and performance for standard tier users',
          priority: 2,
          conditions: {
            userTier: 'standard',
            costThreshold: 0.01
          },
          actions: {
            primaryProvider: 'gpt-3.5-turbo',
            fallbackProviders: ['claude-3-haiku', 'gpt-4'],
            costOptimization: true,
            cachingEnabled: true
          },
          status: 'active'
        }
      ]);

      setProviders([
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          type: 'openai',
          costPerToken: 0.03,
          avgResponseTime: 2.1,
          capacity: 95,
          status: 'healthy',
          models: ['gpt-4-turbo', 'gpt-4-turbo-preview']
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          type: 'openai',
          costPerToken: 0.002,
          avgResponseTime: 1.5,
          capacity: 100,
          status: 'healthy',
          models: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k']
        }
      ]);

      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (selectedPolicyId && policies.length > 0) {
      const policy = policies.find(p => p.id === selectedPolicyId);
      setSelectedPolicy(policy || null);
    }
  }, [selectedPolicyId, policies]);

  const handlePolicyChange = (policyId: string) => {
    const policy = policies.find(p => p.id === policyId);
    setSelectedPolicy(policy || null);
    onPolicyChange?.(policyId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading routing policies...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Select value={selectedPolicy?.id || ''} onValueChange={handlePolicyChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select routing policy" />
          </SelectTrigger>
          <SelectContent>
            {policies.map((policy) => (
              <SelectItem key={policy.id} value={policy.id}>
                <div className="flex items-center space-x-2">
                  <span>{policy.name}</span>
                  <Badge variant="outline" className="text-xs">
                    P{policy.priority}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPolicy && (
          <Badge variant="secondary">
            {selectedPolicy.actions.primaryProvider}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Routing Policy</span>
        </CardTitle>
        <CardDescription>
          Configure intelligent AI service routing based on your requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Policy Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Active Policy</label>
          <Select value={selectedPolicy?.id || ''} onValueChange={handlePolicyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a routing policy" />
            </SelectTrigger>
            <SelectContent>
              {policies.map((policy) => (
                <SelectItem key={policy.id} value={policy.id}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      <div className="text-xs text-muted-foreground">{policy.description}</div>
                    </div>
                    <Badge variant="outline">P{policy.priority}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Policy Details */}
        {selectedPolicy && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Primary Provider</label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon('healthy')}
                  <span className="font-medium">{selectedPolicy.actions.primaryProvider}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fallback Providers</label>
                <div className="text-sm">{selectedPolicy.actions.fallbackProviders.length}</div>
              </div>
            </div>

            <div className="flex space-x-2">
              {selectedPolicy.actions.costOptimization && (
                <Badge variant="secondary">Cost Optimized</Badge>
              )}
              {selectedPolicy.actions.cachingEnabled && (
                <Badge variant="secondary">Caching Enabled</Badge>
              )}
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {showAnalytics && selectedPolicy && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Performance Metrics</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Avg Response</div>
                <div className="font-medium">2.1s</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cost Savings</div>
                <div className="font-medium text-green-600">15.5%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Success Rate</div>
                <div className="font-medium">98.7%</div>
              </div>
            </div>
          </div>
        )}

        {/* Provider Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Provider Status</span>
            <Badge variant="outline">
              {providers.filter(p => p.status === 'healthy').length} / {providers.length} Healthy
            </Badge>
          </div>
          <div className="space-y-2">
            {providers.slice(0, 3).map((provider) => (
              <div key={provider.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(provider.status)}
                  <span>{provider.name}</span>
                </div>
                <div className="text-muted-foreground">
                  ${provider.costPerToken}/token
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 border-t">
          <Button variant="outline" size="sm">
            Configure Policy
          </Button>
          <Button variant="outline" size="sm">
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoutingPolicySelector;
