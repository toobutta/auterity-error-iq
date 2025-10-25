/**
 * Subscription Demo Component
 * Comprehensive demonstration of subscription management and deployment features
 * Shows how the system detects deployment types and applies feature gating
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@auterity/design-system';
import { Button } from '@auterity/design-system';
import { Badge } from '@auterity/design-system';
import { Progress } from '@auterity/design-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@auterity/design-system';
import { subscriptionService, SubscriptionTier } from '../../services/enterprise/SubscriptionService';
import { deploymentManager } from '../../services/enterprise/DeploymentManager';
import { billingService } from '../../services/enterprise/BillingService';
import { usageAnalyticsService } from '../../services/enterprise/UsageAnalyticsService';
import { FeatureGate, useDeploymentType } from './FeatureGate';

interface DemoSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const DemoSection: React.FC<DemoSectionProps> = ({ title, description, children }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-xl">{title}</CardTitle>
      <p className="text-gray-600">{description}</p>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

const SubscriptionDemo: React.FC = () => {
  const deploymentType = useDeploymentType();
  const [subscription, setSubscription] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [usageLimits, setUsageLimits] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    try {
      const sub = subscriptionService.getCurrentSubscription();
      const p = subscriptionService.getCurrentPlan();
      const limits = subscriptionService.checkUsageLimits();
      const analyticsData = await subscriptionService.getUsageAnalytics();
      const billingData = subscriptionService.getBillingInfo();
      const deploymentData = deploymentManager.getDeploymentStatus();

      setSubscription(sub);
      setPlan(p);
      setUsageLimits(limits);
      setAnalytics(analyticsData);
      setBilling(billingData);
      setDeployment(deploymentData);
    } catch (error) {
      console.error('Failed to load demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateFeatureUsage = async (feature: string, cost: number = 0) => {
    try {
      await usageAnalyticsService.trackEvent({
        userId: 'demo_user',
        organizationId: subscription?.organizationId || 'demo_org',
        eventType: 'feature_usage',
        resource: feature,
        action: 'use',
        metadata: {
          cost,
          feature,
          sessionId: 'demo_session'
        }
      });
      await loadDemoData(); // Refresh data
    } catch (error) {
      console.error('Failed to simulate feature usage:', error);
    }
  };

  const getDeploymentIcon = (type: string) => {
    switch (type) {
      case 'saas': return '☁️';
      case 'white-label': return '🏷️';
      case 'self-hosted': return '🏠';
      default: return '🔧';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-green-100 text-green-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Subscription & Deployment Management Demo
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Comprehensive demonstration of how Auterity Error-IQ manages subscriptions and deployments
        </p>
      </div>

      {/* Deployment Detection Demo */}
      <DemoSection
        title="🔍 Deployment Type Detection"
        description="The system automatically detects your deployment type and applies appropriate configurations"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`border-2 ${deployment?.type === 'saas' ? 'border-blue-500' : 'border-gray-200'}`}>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="font-semibold mb-2">SaaS</h3>
              <p className="text-sm text-gray-600 mb-4">Cloud-hosted multi-tenant platform</p>
              <Badge variant={deployment?.type === 'saas' ? 'default' : 'outline'}>
                {deployment?.type === 'saas' ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>

          <Card className={`border-2 ${deployment?.type === 'white-label' ? 'border-green-500' : 'border-gray-200'}`}>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="font-semibold mb-2">White-label</h3>
              <p className="text-sm text-gray-600 mb-4">Custom branded deployment</p>
              <Badge variant={deployment?.type === 'white-label' ? 'default' : 'outline'}>
                {deployment?.type === 'white-label' ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>

          <Card className={`border-2 ${deployment?.type === 'self-hosted' ? 'border-purple-500' : 'border-gray-200'}`}>
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="font-semibold mb-2">Self-hosted</h3>
              <p className="text-sm text-gray-600 mb-4">On-premise deployment</p>
              <Badge variant={deployment?.type === 'self-hosted' ? 'default' : 'outline'}>
                {deployment?.type === 'self-hosted' ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Current Deployment Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Type:</span>
              <div className="flex items-center mt-1">
                <span className="mr-2">{getDeploymentIcon(deployment?.type || 'unknown')}</span>
                <span className="capitalize">{deployment?.type || 'Unknown'}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Version:</span>
              <div className="font-mono mt-1">{deployment?.version || '1.0.0'}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className="mt-1">
                <Badge className={
                  deployment?.status === 'ready' ? 'bg-green-100 text-green-800' :
                  deployment?.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {deployment?.status || 'unknown'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Health:</span>
              <div className="mt-1">
                <Badge className={
                  deployment?.health?.overall === 'healthy' ? 'bg-green-100 text-green-800' :
                  deployment?.health?.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {deployment?.health?.overall || 'unknown'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* Subscription Management Demo */}
      <DemoSection
        title="📋 Subscription Management"
        description="View and manage your current subscription with real-time usage tracking"
      >
        {subscription && plan && (
          <div className="space-y-6">
            {/* Subscription Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">📊</div>
                    <h3 className="font-semibold mb-2">{plan.name}</h3>
                    <Badge className={getTierColor(plan.tier)}>
                      {plan.tier.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {plan.deploymentType} • {subscription.billingCycle}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">💰</div>
                    <h3 className="font-semibold mb-2">Monthly Cost</h3>
                    <div className="text-2xl font-bold text-green-600">
                      ${plan.pricing.monthly}
                    </div>
                    <p className="text-sm text-gray-600">Billed {subscription.billingCycle}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">📅</div>
                    <h3 className="font-semibold mb-2">Next Billing</h3>
                    <div className="text-lg font-semibold">
                      {billing?.nextBillingDate?.toLocaleDateString()}
                    </div>
                    <p className="text-sm text-gray-600">
                      {Math.ceil((billing?.nextBillingDate?.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {analytics?.utilization && Object.entries(analytics.utilization).map(([metric, percentage]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{metric}</span>
                        <span className={`font-medium ${
                          percentage > 90 ? 'text-red-600' :
                          percentage > 75 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="text-xs text-gray-600">
                        {subscription.usage.current[metric as keyof typeof subscription.usage.current]}/
                        {subscription.usage.limits[metric as keyof typeof subscription.usage.limits]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plan Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Plan Limits & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Resource Limits</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Users:</span>
                        <span>{plan.limits.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Workflows:</span>
                        <span>{plan.limits.workflows}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>API Calls:</span>
                        <span>{plan.limits.apiCalls.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>{plan.limits.storage}GB</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Available Features</h4>
                    <div className="space-y-2">
                      {Object.entries(plan.features).map(([feature, entitlement]) => {
                        const isAvailable = entitlement !== 'disabled';
                        return (
                          <div key={feature} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <Badge variant={isAvailable ? 'default' : 'secondary'} className="text-xs">
                              {isAvailable ? '✓ Available' : '✗ Disabled'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DemoSection>

      {/* Feature Gating Demo */}
      <DemoSection
        title="🔒 Feature Gating in Action"
        description="See how features are automatically enabled/disabled based on your subscription"
      >
        <div className="space-y-6">
          {/* Professional Features */}
          <div>
            <h3 className="font-semibold mb-4 text-green-700">Professional Plan Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureGate
                feature="temporalWorkflows"
                fallback={
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="pt-6 text-center">
                      <span className="text-3xl mb-4 block">⏱️</span>
                      <h4 className="font-semibold mb-2">Temporal Workflows</h4>
                      <p className="text-sm text-gray-600 mb-4">Reliable workflow orchestration</p>
                      <Badge variant="outline">Requires Professional Plan</Badge>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <span className="text-3xl mb-4 block">⏱️</span>
                    <h4 className="font-semibold mb-2">Temporal Workflows</h4>
                    <p className="text-sm text-green-700 mb-4">Reliable workflow orchestration</p>
                    <Badge className="bg-green-100 text-green-800">✓ Available</Badge>
                    <div className="mt-4">
                      <Button size="sm" onClick={() => simulateFeatureUsage('temporalWorkflows')}>
                        Use Feature
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FeatureGate>

              <FeatureGate
                feature="weightsAndBiases"
                fallback={
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="pt-6 text-center">
                      <span className="text-3xl mb-4 block">📊</span>
                      <h4 className="font-semibold mb-2">MLOps Monitoring</h4>
                      <p className="text-sm text-gray-600 mb-4">Experiment tracking & monitoring</p>
                      <Badge variant="outline">Requires Professional Plan</Badge>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <span className="text-3xl mb-4 block">📊</span>
                    <h4 className="font-semibold mb-2">MLOps Monitoring</h4>
                    <p className="text-sm text-green-700 mb-4">Experiment tracking & monitoring</p>
                    <Badge className="bg-green-100 text-green-800">✓ Available</Badge>
                    <div className="mt-4">
                      <Button size="sm" onClick={() => simulateFeatureUsage('weightsAndBiases')}>
                        Use Feature
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FeatureGate>
            </div>
          </div>

          {/* Enterprise Features */}
          <div>
            <h3 className="font-semibold mb-4 text-purple-700">Enterprise Plan Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureGate
                feature="novitaAI"
                fallback={
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="pt-6 text-center">
                      <span className="text-3xl mb-4 block">🤖</span>
                      <h4 className="font-semibold mb-2">200+ AI Models</h4>
                      <p className="text-sm text-gray-600 mb-4">Access to extensive AI model library</p>
                      <Badge variant="outline">Requires Enterprise Plan</Badge>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-6 text-center">
                    <span className="text-3xl mb-4 block">🤖</span>
                    <h4 className="font-semibold mb-2">200+ AI Models</h4>
                    <p className="text-sm text-purple-700 mb-4">Access to extensive AI model library</p>
                    <Badge className="bg-purple-100 text-purple-800">✓ Available</Badge>
                    <div className="mt-4">
                      <Button size="sm" onClick={() => simulateFeatureUsage('novitaAI', 0.5)}>
                        Use Feature ($0.50)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FeatureGate>

              <FeatureGate
                feature="enterpriseSecurity"
                fallback={
                  <Card className="border-dashed border-2 border-gray-300">
                    <CardContent className="pt-6 text-center">
                      <span className="text-3xl mb-4 block">🔐</span>
                      <h4 className="font-semibold mb-2">Enterprise Security</h4>
                      <p className="text-sm text-gray-600 mb-4">Advanced security & compliance</p>
                      <Badge variant="outline">Requires Enterprise Plan</Badge>
                    </CardContent>
                  </Card>
                }
              >
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-6 text-center">
                    <span className="text-3xl mb-4 block">🔐</span>
                    <h4 className="font-semibold mb-2">Enterprise Security</h4>
                    <p className="text-sm text-purple-700 mb-4">Advanced security & compliance</p>
                    <Badge className="bg-purple-100 text-purple-800">✓ Available</Badge>
                    <div className="mt-4">
                      <Button size="sm" onClick={() => simulateFeatureUsage('enterpriseSecurity')}>
                        Use Feature
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FeatureGate>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* Usage Analytics Demo */}
      <DemoSection
        title="📈 Usage Analytics & Insights"
        description="Real-time usage tracking with predictive analytics and optimization recommendations"
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-sm text-gray-600">AI Requests Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-2xl font-bold">$47.50</div>
                  <p className="text-sm text-gray-600">Cost Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-sm text-gray-600">Active Users</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Trends (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.trends?.daily?.slice(-7).map((day: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{day.date}</span>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          {day.events} events, {day.users} users
                        </div>
                        <div className="text-sm font-medium">
                          ${day.cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">💡</span>
                    <div>
                      <h4 className="font-semibold">Cost Optimization Opportunity</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Switch to Gemini Pro for 35% cost savings on similar performance
                      </p>
                      <div className="mt-3">
                        <Badge className="bg-blue-100 text-blue-800">Potential: $15/month savings</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <span className="text-2xl">📈</span>
                    <div>
                      <h4 className="font-semibold">Feature Adoption</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        AI Models feature has 75% adoption rate with growth potential
                      </p>
                      <div className="mt-3">
                        <Badge className="bg-green-100 text-green-800">Growth: +13.3% monthly</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Next Month Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>AI Requests:</span>
                      <span className="font-semibold">1,850 (+48%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Cost:</span>
                      <span className="font-semibold">$69.00 (+45%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-semibold">85%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Potential Savings:</span>
                      <span className="font-semibold text-green-600">$17.25</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>• Model Selection: $11.50</div>
                      <div>• Usage Optimization: $5.75</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DemoSection>

      {/* Real-time Demo */}
      <DemoSection
        title="⚡ Real-time System Monitoring"
        description="Live system metrics and performance monitoring"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-2xl font-bold">23</div>
              <p className="text-sm text-gray-600">Active Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-sm text-gray-600">Requests/min</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl mb-2">⏱️</div>
              <div className="text-2xl font-bold">245ms</div>
              <p className="text-sm text-gray-600">Avg Response</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl mb-2">🟢</div>
              <div className="text-2xl font-bold">99.5%</div>
              <p className="text-sm text-gray-600">Uptime</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-green-500">●</span>
                  <span>AI Model inference completed (GPT-4)</span>
                  <span className="text-gray-500 ml-auto">2s ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-blue-500">●</span>
                  <span>Workflow execution started (Temporal)</span>
                  <span className="text-gray-500 ml-auto">5s ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-purple-500">●</span>
                  <span>API test completed successfully</span>
                  <span className="text-gray-500 ml-auto">8s ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-orange-500">●</span>
                  <span>Usage analytics updated</span>
                  <span className="text-gray-500 ml-auto">12s ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DemoSection>

      {/* Summary */}
      <DemoSection
        title="🎯 Demo Summary"
        description="How this subscription and deployment system benefits different user types"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="font-semibold mb-2">SaaS Enterprise</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Zero infrastructure management</li>
              <li>• Automatic scaling & updates</li>
              <li>• 99.9% uptime SLA</li>
              <li>• Enterprise support</li>
              <li>• Cost: $999/month</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">🏷️</div>
            <h3 className="font-semibold mb-2">White-label</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete brand customization</li>
              <li>• Client-specific features</li>
              <li>• Custom integrations</li>
              <li>• Reseller margins</li>
              <li>• Cost: $1999/month</li>
            </ul>
          </div>

          <div className="text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="font-semibold mb-2">Self-hosted</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Full data control</li>
              <li>• Custom security</li>
              <li>• Local AI models</li>
              <li>• No vendor lock-in</li>
              <li>• Cost: $2999/month</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h4 className="font-semibold text-center mb-4">Key Benefits Across All Deployments</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <div className="font-semibold">Secure</div>
              <div className="text-sm text-gray-600">Enterprise-grade security</div>
            </div>
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold">Fast</div>
              <div className="text-sm text-gray-600">Optimized performance</div>
            </div>
            <div>
              <div className="text-2xl mb-2">💰</div>
              <div className="font-semibold">Cost-Effective</div>
              <div className="text-sm text-gray-600">25-45% cost savings</div>
            </div>
            <div>
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold">Scalable</div>
              <div className="text-sm text-gray-600">Enterprise-grade scaling</div>
            </div>
          </div>
        </div>
      </DemoSection>
    </div>
  );
};

export default SubscriptionDemo;
