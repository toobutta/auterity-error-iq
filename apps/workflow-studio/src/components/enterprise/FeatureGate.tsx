/**
 * Feature Gate Component
 * Controls feature availability based on subscription tier
 * Supports SaaS, White-label, and Self-hosted deployments
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@auterity/design-system';
import { Button } from '@auterity/design-system';
import { Badge } from '@auterity/design-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@auterity/design-system';
import { subscriptionService, FeatureEntitlement, SubscriptionTier, DeploymentType } from '../../services/enterprise/SubscriptionService';

interface FeatureGateProps {
  feature: keyof typeof subscriptionService.getCurrentPlan()?.features;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgradePrompt?: boolean;
  upgradeMessage?: string;
}

interface FeatureGateProviderProps {
  children: React.ReactNode;
}

interface SubscriptionContextType {
  subscription: any;
  plan: any;
  isFeatureAvailable: (feature: string) => boolean;
  getFeatureEntitlement: (feature: string) => FeatureEntitlement;
  checkUsageLimits: () => any;
  getUsageAnalytics: () => any;
  upgradeSubscription: (planId: string) => Promise<boolean>;
}

// Feature Gate Context
const SubscriptionContext = React.createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = React.useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a FeatureGateProvider');
  }
  return context;
};

// Feature Gate Provider
export const FeatureGateProvider: React.FC<FeatureGateProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const sub = subscriptionService.getCurrentSubscription();
        const p = subscriptionService.getCurrentPlan();

        setSubscription(sub);
        setPlan(p);
      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscription();
  }, []);

  const isFeatureAvailable = (feature: string) => {
    return subscriptionService.isFeatureAvailable(feature as any);
  };

  const getFeatureEntitlement = (feature: string) => {
    return subscriptionService.getFeatureEntitlement(feature as any);
  };

  const checkUsageLimits = () => {
    return subscriptionService.checkUsageLimits();
  };

  const getUsageAnalytics = () => {
    return subscriptionService.getUsageAnalytics();
  };

  const upgradeSubscription = async (planId: string) => {
    return await subscriptionService.upgradeSubscription(planId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const contextValue: SubscriptionContextType = {
    subscription,
    plan,
    isFeatureAvailable,
    getFeatureEntitlement,
    checkUsageLimits,
    getUsageAnalytics,
    upgradeSubscription
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

// Feature Gate Component
export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  children,
  showUpgradePrompt = true,
  upgradeMessage
}) => {
  const { isFeatureAvailable, getFeatureEntitlement, plan } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const isAvailable = isFeatureAvailable(feature);
  const entitlement = getFeatureEntitlement(feature);

  // If feature is available, render children
  if (isAvailable) {
    return <>{children}</>;
  }

  // If fallback provided, render fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt
  if (showUpgradePrompt) {
    return (
      <FeatureUpgradePrompt
        feature={feature}
        entitlement={entitlement}
        currentPlan={plan}
        message={upgradeMessage}
        onUpgrade={() => setShowUpgradeDialog(true)}
      />
    );
  }

  // Return null if no fallback and no upgrade prompt
  return null;
};

// Feature Upgrade Prompt Component
interface FeatureUpgradePromptProps {
  feature: string;
  entitlement: FeatureEntitlement;
  currentPlan: any;
  message?: string;
  onUpgrade: () => void;
}

const FeatureUpgradePrompt: React.FC<FeatureUpgradePromptProps> = ({
  feature,
  entitlement,
  currentPlan,
  message,
  onUpgrade
}) => {
  const getFeatureDisplayName = (feature: string) => {
    const names: Record<string, string> = {
      temporalWorkflows: 'Advanced Workflow Orchestration',
      weightsAndBiases: 'MLOps Monitoring',
      postmanPostbot: 'API Testing Automation',
      testSigma: 'Comprehensive Testing',
      novitaAI: 'Advanced AI Models',
      customModels: 'Custom AI Models',
      multimodalAI: 'Multimodal AI',
      batchProcessing: 'Batch Processing',
      advancedNodes: 'Advanced Workflow Nodes',
      collaborativeEditing: 'Collaborative Editing',
      advancedAnalytics: 'Advanced Analytics',
      customDashboards: 'Custom Dashboards',
      predictiveAnalytics: 'Predictive Analytics',
      enterpriseSecurity: 'Enterprise Security',
      auditLogs: 'Audit Logs',
      complianceReporting: 'Compliance Reporting',
      prioritySupport: 'Priority Support',
      dedicatedSupport: 'Dedicated Support',
      customIntegrations: 'Custom Integrations'
    };
    return names[feature] || feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const getUpgradeMessage = () => {
    if (message) return message;

    const featureName = getFeatureDisplayName(feature);
    return `${featureName} is available in Professional and Enterprise plans. Upgrade your subscription to access this feature.`;
  };

  const getRecommendedPlan = () => {
    if (!currentPlan) return 'professional';

    const tierHierarchy: Record<string, string[]> = {
      'starter': ['professional', 'enterprise'],
      'professional': ['enterprise'],
      'enterprise': []
    };

    const availableUpgrades = tierHierarchy[currentPlan.tier] || [];
    return availableUpgrades[0] || 'enterprise';
  };

  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Premium Feature
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getUpgradeMessage()}
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 mb-4">
            <Badge variant="outline" className="text-xs">
              Current: {currentPlan?.name || 'Free'}
            </Badge>
            <span className="text-gray-400">→</span>
            <Badge className="text-xs bg-blue-100 text-blue-800">
              Recommended: {getRecommendedPlan().replace('-', ' ').toUpperCase()}
            </Badge>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="primary" size="sm">
                Upgrade Plan
              </Button>
            </DialogTrigger>
            <UpgradeDialog
              currentPlan={currentPlan}
              feature={feature}
              onClose={() => {}}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

// Upgrade Dialog Component
interface UpgradeDialogProps {
  currentPlan: any;
  feature: string;
  onClose: () => void;
}

const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ currentPlan, feature, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const availablePlans = subscriptionService.getAvailablePlans().filter(plan =>
    plan.tier.includes('professional') || plan.tier.includes('enterprise')
  );

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsUpgrading(true);
    try {
      const success = await subscriptionService.upgradeSubscription(selectedPlan);
      if (success) {
        // Refresh the page or update context
        window.location.reload();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Upgrade Your Subscription</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
          <p className="text-sm text-gray-600">
            Get access to advanced AI tools, enterprise features, and premium support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePlans.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-sm text-gray-600">{plan.deploymentType} deployment</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${plan.pricing.monthly}
                    </div>
                    <div className="text-sm text-gray-600">/month</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✓ {plan.limits.users} users</div>
                  <div>✓ {plan.limits.workflows} workflows</div>
                  <div>✓ {plan.limits.apiCalls.toLocaleString()} API calls</div>
                  <div>✓ {plan.limits.storage}GB storage</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpgrade}
            disabled={!selectedPlan || isUpgrading}
          >
            {isUpgrading ? 'Upgrading...' : `Upgrade to ${selectedPlan ? availablePlans.find(p => p.id === selectedPlan)?.name : ''}`}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

// Subscription Status Component
export const SubscriptionStatus: React.FC = () => {
  const { subscription, plan, checkUsageLimits, getUsageAnalytics } = useSubscription();
  const [usageLimits, setUsageLimits] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (subscription) {
      setUsageLimits(checkUsageLimits());
      setAnalytics(getUsageAnalytics());
    }
  }, [subscription, checkUsageLimits, getUsageAnalytics]);

  if (!subscription || !plan) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <span className="text-2xl mb-2 block">⚠️</span>
            <h3 className="font-semibold text-orange-900">No Active Subscription</h3>
            <p className="text-sm text-orange-700 mt-1">
              Contact support to activate your subscription
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Subscription Status</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Plan Info */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{plan.name}</h4>
              <p className="text-sm text-gray-600">
                {plan.deploymentType} • {subscription.billingCycle}
              </p>
            </div>
            <Badge className="capitalize">
              {subscription.status}
            </Badge>
          </div>

          {/* Usage Limits */}
          {analytics && (
            <div className="space-y-3">
              <h5 className="font-medium text-sm">Usage This Month</h5>

              {Object.entries(analytics.utilization).map(([metric, percentage]) => (
                <div key={metric} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{metric}</span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(percentage as number)}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(percentage as number, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Limits Warning */}
          {usageLimits && !usageLimits.withinLimits && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h5 className="font-medium text-red-900 text-sm mb-2">Usage Limits Exceeded</h5>
              <div className="space-y-1">
                {usageLimits.violations.map((violation: any, index: number) => (
                  <div key={index} className="text-sm text-red-700">
                    {violation.metric}: {violation.current}/{violation.limit} ({violation.percentage.toFixed(1)}%)
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2">
                Upgrade Plan
              </Button>
            </div>
          )}

          {/* Next Billing */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Next Billing:</span>
              <span className="font-medium">
                {new Date(subscription.startDate.getTime() + (
                  subscription.billingCycle === 'monthly' ? 30 : 365
                ) * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Deployment Type Detector Hook
export const useDeploymentType = (): DeploymentType => {
  const { plan } = useSubscription();

  // Detect deployment type from various sources
  const detectDeploymentType = (): DeploymentType => {
    // Check environment variables
    const envType = import.meta.env.VITE_DEPLOYMENT_TYPE as DeploymentType;
    if (envType && ['saas', 'white-label', 'self-hosted'].includes(envType)) {
      return envType;
    }

    // Check plan deployment type
    if (plan?.deploymentType) {
      return plan.deploymentType;
    }

    // Check license key for white-label/self-hosted
    const licenseKey = localStorage.getItem('license_key');
    if (licenseKey) {
      const validation = subscriptionService.validateLicenseKey(licenseKey);
      if (validation.isValid && validation.deploymentType) {
        return validation.deploymentType;
      }
    }

    // Check domain for white-label detection
    const hostname = window.location.hostname;
    if (hostname !== 'app.auterity.com' && hostname !== 'localhost') {
      return 'white-label';
    }

    // Default to SaaS
    return 'saas';
  };

  const [deploymentType, setDeploymentType] = useState<DeploymentType>(detectDeploymentType);

  useEffect(() => {
    setDeploymentType(detectDeploymentType());
  }, [plan]);

  return deploymentType;
};

// Export components
export { FeatureGate, SubscriptionStatus, useDeploymentType };
export default FeatureGate;
