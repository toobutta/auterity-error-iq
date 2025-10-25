/**
 * Subscription Service for Auterity Error-IQ
 * Manages subscription tiers, feature entitlements, and billing
 * Supports SaaS Enterprise, White-label, and Self-hosted deployments
 */

import { z } from "zod";

// Types for subscription management
export type SubscriptionTier = 'saas-enterprise' | 'saas-professional' | 'saas-starter' | 'white-label-enterprise' | 'white-label-professional' | 'self-hosted-enterprise' | 'self-hosted-professional' | 'self-hosted-community';

export type DeploymentType = 'saas' | 'white-label' | 'self-hosted';

export type FeatureEntitlement = 'basic' | 'premium' | 'enterprise' | 'disabled';

export interface APICostLimits {
  // AI Inference APIs
  aiInferenceRequests: number; // per month
  aiStreamingRequests: number; // per month
  aiBatchRequests: number; // per month

  // Advanced AI APIs
  smartInferenceRequests: number; // per month
  modelOptimizationRequests: number; // per month
  batchJobRequests: number; // per month
  fineTuneJobs: number; // per month
  abTestRuns: number; // per month

  // Model Management
  modelLoads: number; // per month
  customModelStorage: number; // in GB

  // Cost Limits
  monthlyAPIBudget: number; // in USD
  maxCostPerRequest: number; // in USD
  costAlertThreshold: number; // percentage (e.g., 80)

  // Rate Limits
  requestsPerMinute: number;
  requestsPerHour: number;
  concurrentRequests: number;
}

export interface SubscriptionFeatures {
  // AI Services
  aiModelAccess: FeatureEntitlement;
  customModels: FeatureEntitlement;
  multimodalAI: FeatureEntitlement;
  batchProcessing: FeatureEntitlement;

  // Advanced AI Features
  smartInference: FeatureEntitlement;
  modelOptimization: FeatureEntitlement;
  advancedBatchProcessing: FeatureEntitlement;
  fineTuning: FeatureEntitlement;
  abTesting: FeatureEntitlement;
  realTimeCollaboration: FeatureEntitlement;
  modelMarketplace: FeatureEntitlement;

  // Workflow Features
  workflowCanvas: FeatureEntitlement;
  advancedNodes: FeatureEntitlement;
  workflowTemplates: FeatureEntitlement;
  collaborativeEditing: FeatureEntitlement;

  // Enterprise Features
  temporalWorkflows: FeatureEntitlement;
  weightsAndBiases: FeatureEntitlement;
  postmanPostbot: FeatureEntitlement;
  testSigma: FeatureEntitlement;
  novitaAI: FeatureEntitlement;

  // Analytics & Monitoring
  basicAnalytics: FeatureEntitlement;
  advancedAnalytics: FeatureEntitlement;
  customDashboards: FeatureEntitlement;
  predictiveAnalytics: FeatureEntitlement;

  // Security & Compliance
  basicSecurity: FeatureEntitlement;
  enterpriseSecurity: FeatureEntitlement;
  auditLogs: FeatureEntitlement;
  complianceReporting: FeatureEntitlement;

  // Support & Services
  emailSupport: FeatureEntitlement;
  prioritySupport: FeatureEntitlement;
  dedicatedSupport: FeatureEntitlement;
  customIntegrations: FeatureEntitlement;

  // Limits & Quotas
  maxWorkflows: number;
  maxUsers: number;
  maxAPIRequests: number;
  storageLimit: number; // in GB
  computeHours: number; // monthly

  // API Cost & Usage Limits
  apiCostLimits: APICostLimits;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  deploymentType: DeploymentType;
  features: SubscriptionFeatures;
  pricing: {
    monthly: number;
    annual: number;
    currency: string;
  };
  limits: {
    users: number;
    workflows: number;
    apiCalls: number;
    storage: number;
  };
  isActive: boolean;
  trialDays?: number;
}

export interface APICostUsage {
  // Monthly usage counters
  aiInferenceRequests: number;
  aiStreamingRequests: number;
  aiBatchRequests: number;
  smartInferenceRequests: number;
  modelOptimizationRequests: number;
  batchJobRequests: number;
  fineTuneJobs: number;
  abTestRuns: number;
  modelLoads: number;

  // Cost tracking
  totalAPICost: number;
  monthlyAPICost: number;
  costByEndpoint: Record<string, number>;
  costByModel: Record<string, number>;

  // Usage analytics
  averageCostPerRequest: number;
  peakUsageDay: string;
  usageTrend: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
}

export interface Subscription {
  id: string;
  planId: string;
  organizationId: string;
  organizationName: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'trial';
  startDate: Date;
  endDate?: Date;
  trialEndDate?: Date;
  billingCycle: 'monthly' | 'annual';
  autoRenew: boolean;
  paymentMethod?: string;
  usage: {
    current: {
      users: number;
      workflows: number;
      apiCalls: number;
      storage: number;
    };
    limits: {
      users: number;
      workflows: number;
      apiCalls: number;
      storage: number;
    };
  };
  apiCostUsage: APICostUsage;
  metadata?: Record<string, any>;
}

export interface LicenseKey {
  id: string;
  key: string;
  subscriptionId: string;
  deploymentType: DeploymentType;
  features: string[];
  issuedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  isValid: boolean;
  metadata?: Record<string, any>;
}

export class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, SubscriptionPlan> = new Map();
  private licenseKeys: Map<string, LicenseKey> = new Map();
  private currentSubscription: Subscription | null = null;

  constructor() {
    this.initializeSubscriptionPlans();
    this.loadCurrentSubscription();
  }

  /**
   * Initialize all available subscription plans
   */
  private initializeSubscriptionPlans(): void {
    const plans: SubscriptionPlan[] = [
      // SaaS Plans
      {
        id: 'saas-starter',
        name: 'SaaS Starter',
        tier: 'saas-starter',
        deploymentType: 'saas',
        pricing: { monthly: 49, annual: 490, currency: 'USD' },
        limits: { users: 5, workflows: 10, apiCalls: 10000, storage: 5 },
        isActive: true,
        features: this.getStarterFeatures()
      },
      {
        id: 'saas-professional',
        name: 'SaaS Professional',
        tier: 'saas-professional',
        deploymentType: 'saas',
        pricing: { monthly: 199, annual: 1990, currency: 'USD' },
        limits: { users: 25, workflows: 100, apiCalls: 100000, storage: 50 },
        isActive: true,
        features: this.getProfessionalFeatures()
      },
      {
        id: 'saas-enterprise',
        name: 'SaaS Enterprise',
        tier: 'saas-enterprise',
        deploymentType: 'saas',
        pricing: { monthly: 999, annual: 9990, currency: 'USD' },
        limits: { users: 1000, workflows: 1000, apiCalls: 1000000, storage: 500 },
        isActive: true,
        features: this.getEnterpriseFeatures()
      },

      // White-label Plans
      {
        id: 'white-label-professional',
        name: 'White-label Professional',
        tier: 'white-label-professional',
        deploymentType: 'white-label',
        pricing: { monthly: 499, annual: 4990, currency: 'USD' },
        limits: { users: 50, workflows: 200, apiCalls: 250000, storage: 100 },
        isActive: true,
        features: this.getProfessionalFeatures()
      },
      {
        id: 'white-label-enterprise',
        name: 'White-label Enterprise',
        tier: 'white-label-enterprise',
        deploymentType: 'white-label',
        pricing: { monthly: 1999, annual: 19990, currency: 'USD' },
        limits: { users: 5000, workflows: 5000, apiCalls: 5000000, storage: 2000 },
        isActive: true,
        features: this.getEnterpriseFeatures()
      },

      // Self-hosted Plans
      {
        id: 'self-hosted-community',
        name: 'Self-hosted Community',
        tier: 'self-hosted-community',
        deploymentType: 'self-hosted',
        pricing: { monthly: 0, annual: 0, currency: 'USD' },
        limits: { users: 3, workflows: 10, apiCalls: 1000, storage: 1 },
        isActive: true,
        trialDays: 0,
        features: this.getCommunityFeatures()
      },
      {
        id: 'self-hosted-professional',
        name: 'Self-hosted Professional',
        tier: 'self-hosted-professional',
        deploymentType: 'self-hosted',
        pricing: { monthly: 799, annual: 7990, currency: 'USD' },
        limits: { users: 100, workflows: 500, apiCalls: 500000, storage: 1000 },
        isActive: true,
        features: this.getProfessionalFeatures()
      },
      {
        id: 'self-hosted-enterprise',
        name: 'Self-hosted Enterprise',
        tier: 'self-hosted-enterprise',
        deploymentType: 'self-hosted',
        pricing: { monthly: 2999, annual: 29990, currency: 'USD' },
        limits: { users: 10000, workflows: 10000, apiCalls: 10000000, storage: 5000 },
        isActive: true,
        features: this.getEnterpriseFeatures()
      }
    ];

    plans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });

  }

  /**
   * Get community tier features
   */
  private getCommunityFeatures(): SubscriptionFeatures {
    return {
      // AI Services
      aiModelAccess: 'basic',
      customModels: 'disabled',
      multimodalAI: 'disabled',
      batchProcessing: 'disabled',

      // Advanced AI Features
      smartInference: 'disabled',
      modelOptimization: 'disabled',
      advancedBatchProcessing: 'disabled',
      fineTuning: 'disabled',
      abTesting: 'disabled',
      realTimeCollaboration: 'disabled',
      modelMarketplace: 'disabled',

      // Workflow Features
      workflowCanvas: 'basic',
      advancedNodes: 'disabled',
      workflowTemplates: 'basic',
      collaborativeEditing: 'disabled',

      // Enterprise Features
      temporalWorkflows: 'disabled',
      weightsAndBiases: 'disabled',
      postmanPostbot: 'disabled',
      testSigma: 'disabled',
      novitaAI: 'disabled',

      // Analytics & Monitoring
      basicAnalytics: 'basic',
      advancedAnalytics: 'disabled',
      customDashboards: 'disabled',
      predictiveAnalytics: 'disabled',

      // Security & Compliance
      basicSecurity: 'basic',
      enterpriseSecurity: 'disabled',
      auditLogs: 'disabled',
      complianceReporting: 'disabled',

      // Support & Services
      emailSupport: 'basic',
      prioritySupport: 'disabled',
      dedicatedSupport: 'disabled',
      customIntegrations: 'disabled',

      // Limits & Quotas
      maxWorkflows: 10,
      maxUsers: 3,
      maxAPIRequests: 1000,
      storageLimit: 1,
      computeHours: 10,

      // API Cost & Usage Limits
      apiCostLimits: {
        aiInferenceRequests: 500,
        aiStreamingRequests: 100,
        aiBatchRequests: 50,
        smartInferenceRequests: 0,
        modelOptimizationRequests: 0,
        batchJobRequests: 0,
        fineTuneJobs: 0,
        abTestRuns: 0,
        modelLoads: 10,
        customModelStorage: 0,
        monthlyAPIBudget: 5.00,
        maxCostPerRequest: 0.01,
        costAlertThreshold: 90,
        requestsPerMinute: 10,
        requestsPerHour: 100,
        concurrentRequests: 2
      }
    };
  }

  /**
   * Get starter tier features
   */
  private getStarterFeatures(): SubscriptionFeatures {
    return {
      // AI Services
      aiModelAccess: 'basic',
      customModels: 'disabled',
      multimodalAI: 'disabled',
      batchProcessing: 'basic',

      // Advanced AI Features
      smartInference: 'basic',
      modelOptimization: 'disabled',
      advancedBatchProcessing: 'disabled',
      fineTuning: 'disabled',
      abTesting: 'disabled',
      realTimeCollaboration: 'basic',
      modelMarketplace: 'basic',

      // Workflow Features
      workflowCanvas: 'basic',
      advancedNodes: 'disabled',
      workflowTemplates: 'basic',
      collaborativeEditing: 'disabled',

      // Enterprise Features
      temporalWorkflows: 'disabled',
      weightsAndBiases: 'disabled',
      postmanPostbot: 'disabled',
      testSigma: 'disabled',
      novitaAI: 'disabled',

      // Analytics & Monitoring
      basicAnalytics: 'basic',
      advancedAnalytics: 'disabled',
      customDashboards: 'disabled',
      predictiveAnalytics: 'disabled',

      // Security & Compliance
      basicSecurity: 'basic',
      enterpriseSecurity: 'disabled',
      auditLogs: 'disabled',
      complianceReporting: 'disabled',

      // Support & Services
      emailSupport: 'basic',
      prioritySupport: 'disabled',
      dedicatedSupport: 'disabled',
      customIntegrations: 'disabled',

      // Limits & Quotas
      maxWorkflows: 10,
      maxUsers: 5,
      maxAPIRequests: 10000,
      storageLimit: 5,
      computeHours: 50,

      // API Cost & Usage Limits
      apiCostLimits: {
        aiInferenceRequests: 5000,
        aiStreamingRequests: 1000,
        aiBatchRequests: 500,
        smartInferenceRequests: 1000,
        modelOptimizationRequests: 0,
        batchJobRequests: 0,
        fineTuneJobs: 0,
        abTestRuns: 0,
        modelLoads: 50,
        customModelStorage: 0,
        monthlyAPIBudget: 25.00,
        maxCostPerRequest: 0.02,
        costAlertThreshold: 85,
        requestsPerMinute: 30,
        requestsPerHour: 500,
        concurrentRequests: 5
      }
    };
  }

  /**
   * Get professional tier features
   */
  private getProfessionalFeatures(): SubscriptionFeatures {
    return {
      // AI Services
      aiModelAccess: 'premium',
      customModels: 'basic',
      multimodalAI: 'basic',
      batchProcessing: 'premium',

      // Advanced AI Features
      smartInference: 'premium',
      modelOptimization: 'premium',
      advancedBatchProcessing: 'premium',
      fineTuning: 'basic',
      abTesting: 'basic',
      realTimeCollaboration: 'premium',
      modelMarketplace: 'premium',

      // Workflow Features
      workflowCanvas: 'premium',
      advancedNodes: 'premium',
      workflowTemplates: 'premium',
      collaborativeEditing: 'premium',

      // Enterprise Features
      temporalWorkflows: 'premium',
      weightsAndBiases: 'premium',
      postmanPostbot: 'premium',
      testSigma: 'premium',
      novitaAI: 'premium',

      // Analytics & Monitoring
      basicAnalytics: 'premium',
      advancedAnalytics: 'premium',
      customDashboards: 'premium',
      predictiveAnalytics: 'basic',

      // Security & Compliance
      basicSecurity: 'premium',
      enterpriseSecurity: 'basic',
      auditLogs: 'premium',
      complianceReporting: 'basic',

      // Support & Services
      emailSupport: 'premium',
      prioritySupport: 'premium',
      dedicatedSupport: 'disabled',
      customIntegrations: 'basic',

      // Limits & Quotas
      maxWorkflows: 100,
      maxUsers: 25,
      maxAPIRequests: 100000,
      storageLimit: 50,
      computeHours: 500,

      // API Cost & Usage Limits
      apiCostLimits: {
        aiInferenceRequests: 50000,
        aiStreamingRequests: 10000,
        aiBatchRequests: 5000,
        smartInferenceRequests: 10000,
        modelOptimizationRequests: 1000,
        batchJobRequests: 500,
        fineTuneJobs: 10,
        abTestRuns: 50,
        modelLoads: 500,
        customModelStorage: 10,
        monthlyAPIBudget: 250.00,
        maxCostPerRequest: 0.05,
        costAlertThreshold: 80,
        requestsPerMinute: 100,
        requestsPerHour: 2000,
        concurrentRequests: 20
      }
    };
  }

  /**
   * Get enterprise tier features
   */
  private getEnterpriseFeatures(): SubscriptionFeatures {
    return {
      // AI Services
      aiModelAccess: 'enterprise',
      customModels: 'enterprise',
      multimodalAI: 'enterprise',
      batchProcessing: 'enterprise',

      // Advanced AI Features
      smartInference: 'enterprise',
      modelOptimization: 'enterprise',
      advancedBatchProcessing: 'enterprise',
      fineTuning: 'enterprise',
      abTesting: 'enterprise',
      realTimeCollaboration: 'enterprise',
      modelMarketplace: 'enterprise',

      // Workflow Features
      workflowCanvas: 'enterprise',
      advancedNodes: 'enterprise',
      workflowTemplates: 'enterprise',
      collaborativeEditing: 'enterprise',

      // Enterprise Features
      temporalWorkflows: 'enterprise',
      weightsAndBiases: 'enterprise',
      postmanPostbot: 'enterprise',
      testSigma: 'enterprise',
      novitaAI: 'enterprise',

      // Analytics & Monitoring
      basicAnalytics: 'enterprise',
      advancedAnalytics: 'enterprise',
      customDashboards: 'enterprise',
      predictiveAnalytics: 'enterprise',

      // Security & Compliance
      basicSecurity: 'enterprise',
      enterpriseSecurity: 'enterprise',
      auditLogs: 'enterprise',
      complianceReporting: 'enterprise',

      // Support & Services
      emailSupport: 'enterprise',
      prioritySupport: 'enterprise',
      dedicatedSupport: 'enterprise',
      customIntegrations: 'enterprise',

      // Limits & Quotas
      maxWorkflows: 1000,
      maxUsers: 1000,
      maxAPIRequests: 1000000,
      storageLimit: 500,
      computeHours: 5000,

      // API Cost & Usage Limits
      apiCostLimits: {
        aiInferenceRequests: 500000,
        aiStreamingRequests: 100000,
        aiBatchRequests: 50000,
        smartInferenceRequests: 100000,
        modelOptimizationRequests: 10000,
        batchJobRequests: 5000,
        fineTuneJobs: 100,
        abTestRuns: 500,
        modelLoads: 5000,
        customModelStorage: 100,
        monthlyAPIBudget: 2500.00,
        maxCostPerRequest: 0.10,
        costAlertThreshold: 75,
        requestsPerMinute: 500,
        requestsPerHour: 10000,
        concurrentRequests: 100
      }
    };
  }

  /**
   * Load current subscription from storage/API
   */
  private async loadCurrentSubscription(): Promise<void> {
    try {
      // In a real implementation, this would load from API or local storage
      // For demo purposes, we'll set a default SaaS Enterprise subscription

      const mockSubscription: Subscription = {
        id: 'sub_demo_001',
        planId: 'saas-enterprise',
        organizationId: 'org_demo',
        organizationName: 'Demo Organization',
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        billingCycle: 'monthly',
        autoRenew: true,
        usage: {
          current: {
            users: 45,
            workflows: 125,
            apiCalls: 45000,
            storage: 12
          },
          limits: {
            users: 1000,
            workflows: 1000,
            apiCalls: 1000000,
            storage: 500
          }
        },
        apiCostUsage: {
          aiInferenceRequests: 125000,
          aiStreamingRequests: 25000,
          aiBatchRequests: 12000,
          smartInferenceRequests: 45000,
          modelOptimizationRequests: 2500,
          batchJobRequests: 1200,
          fineTuneJobs: 25,
          abTestRuns: 150,
          modelLoads: 1200,
          totalAPICost: 1250.75,
          monthlyAPICost: 1250.75,
          costByEndpoint: {
            '/api/ai/inference': 450.25,
            '/api/ai/inference/stream': 280.50,
            '/api/ai/advanced/inference/smart': 320.00,
            '/api/ai/advanced/batch/create': 200.00
          },
          costByModel: {
            'gpt-4': 650.50,
            'claude-3-opus': 425.25,
            'llama-2-70b': 175.00
          },
          averageCostPerRequest: 0.0085,
          peakUsageDay: '2024-01-15',
          usageTrend: [
            { date: '2024-01-01', requests: 3200, cost: 27.20 },
            { date: '2024-01-02', requests: 3800, cost: 32.30 },
            { date: '2024-01-03', requests: 2900, cost: 24.65 },
            { date: '2024-01-04', requests: 4200, cost: 35.70 },
            { date: '2024-01-05', requests: 3900, cost: 33.15 },
            { date: '2024-01-06', requests: 4600, cost: 39.10 },
            { date: '2024-01-07', requests: 4800, cost: 40.80 }
          ]
        }
      };

      this.subscriptions.set(mockSubscription.id, mockSubscription);
      this.currentSubscription = mockSubscription;

    } catch (error) {
      // Failed to load subscription - error logged elsewhere
    }
  }

  /**
   * Get current subscription
   */
  getCurrentSubscription(): Subscription | null {
    return this.currentSubscription;
  }

  /**
   * Get current subscription plan
   */
  getCurrentPlan(): SubscriptionPlan | null {
    if (!this.currentSubscription) return null;
    return this.plans.get(this.currentSubscription.planId) || null;
  }

  /**
   * Check if a feature is available in current subscription
   */
  isFeatureAvailable(feature: keyof SubscriptionFeatures): boolean {
    const plan = this.getCurrentPlan();
    if (!plan) return false;

    const entitlement = plan.features[feature];
    return entitlement !== 'disabled';
  }

  /**
   * Get feature entitlement level
   */
  getFeatureEntitlement(feature: keyof SubscriptionFeatures): FeatureEntitlement {
    const plan = this.getCurrentPlan();
    if (!plan) return 'disabled';

    return plan.features[feature];
  }

  /**
   * Check if usage is within limits
   */
  checkUsageLimits(): {
    withinLimits: boolean;
    violations: Array<{
      metric: string;
      current: number;
      limit: number;
      percentage: number;
    }>;
  } {
    if (!this.currentSubscription) {
      return { withinLimits: false, violations: [] };
    }

    const { current, limits } = this.currentSubscription.usage;
    const violations = [];

    // Check each metric
    if (current.users > limits.users) {
      violations.push({
        metric: 'users',
        current: current.users,
        limit: limits.users,
        percentage: (current.users / limits.users) * 100
      });
    }

    if (current.workflows > limits.workflows) {
      violations.push({
        metric: 'workflows',
        current: current.workflows,
        limit: limits.workflows,
        percentage: (current.workflows / limits.workflows) * 100
      });
    }

    if (current.apiCalls > limits.apiCalls) {
      violations.push({
        metric: 'apiCalls',
        current: current.apiCalls,
        limit: limits.apiCalls,
        percentage: (current.apiCalls / limits.apiCalls) * 100
      });
    }

    if (current.storage > limits.storage) {
      violations.push({
        metric: 'storage',
        current: current.storage,
        limit: limits.storage,
        percentage: (current.storage / limits.storage) * 100
      });
    }

    return {
      withinLimits: violations.length === 0,
      violations
    };
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(): {
    utilization: Record<string, number>;
    trends: Array<{
      date: string;
      users: number;
      workflows: number;
      apiCalls: number;
      storage: number;
    }>;
    predictions: {
      nextMonthUsage: Record<string, number>;
      recommendedPlan?: string;
    };
  } {
    if (!this.currentSubscription) {
      return {
        utilization: {},
        trends: [],
        predictions: { nextMonthUsage: {} }
      };
    }

    const { current, limits } = this.currentSubscription.usage;

    // Calculate utilization percentages
    const utilization = {
      users: (current.users / limits.users) * 100,
      workflows: (current.workflows / limits.workflows) * 100,
      apiCalls: (current.apiCalls / limits.apiCalls) * 100,
      storage: (current.storage / limits.storage) * 100
    };

    // Mock trends data (last 7 days)
    const trends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        users: Math.max(1, current.users - Math.floor(Math.random() * 10)),
        workflows: Math.max(1, current.workflows - Math.floor(Math.random() * 20)),
        apiCalls: Math.max(1000, current.apiCalls - Math.floor(Math.random() * 5000)),
        storage: Math.max(1, current.storage - Math.floor(Math.random() * 5))
      });
    }

    // Predict next month usage
    const growthRate = 1.15; // 15% growth
    const nextMonthUsage = {
      users: Math.ceil(current.users * growthRate),
      workflows: Math.ceil(current.workflows * growthRate),
      apiCalls: Math.ceil(current.apiCalls * growthRate),
      storage: Math.ceil(current.storage * growthRate)
    };

    // Recommend plan upgrade if needed
    let recommendedPlan;
    if (nextMonthUsage.users > limits.users * 0.9 ||
        nextMonthUsage.workflows > limits.workflows * 0.9 ||
        nextMonthUsage.apiCalls > limits.apiCalls * 0.9) {
      recommendedPlan = 'Upgrade recommended for increased limits';
    }

    return {
      utilization,
      trends,
      predictions: {
        nextMonthUsage,
        recommendedPlan
      }
    };
  }

  /**
   * Create license key for white-label/self-hosted deployments
   */
  createLicenseKey(subscriptionId: string, deploymentType: DeploymentType, features: string[], expiresAt?: Date): string {
    const licenseKey: LicenseKey = {
      id: `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key: this.generateLicenseKey(),
      subscriptionId,
      deploymentType,
      features,
      issuedAt: new Date(),
      expiresAt,
      isValid: true
    };

    this.licenseKeys.set(licenseKey.id, licenseKey);

    return licenseKey.key;
  }

  /**
   * Validate license key
   */
  validateLicenseKey(key: string): {
    isValid: boolean;
    subscription?: Subscription;
    plan?: SubscriptionPlan;
    deploymentType?: DeploymentType;
    features?: string[];
    expiresAt?: Date;
    error?: string;
  } {
    const licenseKey = Array.from(this.licenseKeys.values()).find(lk => lk.key === key);

    if (!licenseKey) {
      return { isValid: false, error: 'License key not found' };
    }

    if (!licenseKey.isValid) {
      return { isValid: false, error: 'License key has been revoked' };
    }

    if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
      return { isValid: false, error: 'License key has expired' };
    }

    const subscription = this.subscriptions.get(licenseKey.subscriptionId);
    const plan = subscription ? this.plans.get(subscription.planId) : null;

    return {
      isValid: true,
      subscription: subscription || undefined,
      plan: plan || undefined,
      deploymentType: licenseKey.deploymentType,
      features: licenseKey.features,
      expiresAt: licenseKey.expiresAt
    };
  }

  /**
   * Get all available plans
   */
  getAvailablePlans(deploymentType?: DeploymentType): SubscriptionPlan[] {
    const plans = Array.from(this.plans.values()).filter(plan => plan.isActive);

    if (deploymentType) {
      return plans.filter(plan => plan.deploymentType === deploymentType);
    }

    return plans;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(newPlanId: string): Promise<boolean> {
    try {
      if (!this.currentSubscription) {
        throw new Error('No active subscription found');
      }

      const newPlan = this.plans.get(newPlanId);
      if (!newPlan) {
        throw new Error('Invalid plan ID');
      }

      // Update subscription
      this.currentSubscription.planId = newPlanId;
      this.currentSubscription.usage.limits = {
        users: newPlan.limits.users,
        workflows: newPlan.limits.workflows,
        apiCalls: newPlan.limits.apiCalls,
        storage: newPlan.limits.storage
      };

      return true;

    } catch (error) {
      // Failed to upgrade subscription - error handled elsewhere
      return false;
    }
  }

  /**
   * Generate a license key
   */
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];

    for (let i = 0; i < 4; i++) {
      let segment = '';
      for (let j = 0; j < 5; j++) {
        segment += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      segments.push(segment);
    }

    return segments.join('-');
  }

  /**
   * Get subscription billing information
   */
  getBillingInfo(): {
    currentPlan: SubscriptionPlan | null;
    nextBillingDate: Date | null;
    amountDue: number;
    billingHistory: Array<{
      date: Date;
      amount: number;
      status: 'paid' | 'pending' | 'failed';
      invoiceId: string;
    }>;
  } {
    if (!this.currentSubscription) {
      return {
        currentPlan: null,
        nextBillingDate: null,
        amountDue: 0,
        billingHistory: []
      };
    }

    const plan = this.getCurrentPlan();
    if (!plan) {
      return {
        currentPlan: null,
        nextBillingDate: null,
        amountDue: 0,
        billingHistory: []
      };
    }

    // Calculate next billing date
    const nextBillingDate = new Date(this.currentSubscription.startDate);
    if (this.currentSubscription.billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Mock billing history
    const billingHistory = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const billDate = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
      billingHistory.push({
        date: billDate,
        amount: this.currentSubscription.billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.annual,
        status: 'paid',
        invoiceId: `INV-${billDate.getTime()}`
      });
    }

    return {
      currentPlan: plan,
      nextBillingDate,
      amountDue: this.currentSubscription.billingCycle === 'monthly' ? plan.pricing.monthly : plan.pricing.annual,
      billingHistory
    };
  }

  /**
   * Track API cost and usage
   */
  trackAPICost(endpoint: string, modelId: string, cost: number, requestType: keyof APICostLimits): void {
    if (!this.currentSubscription) return;

    // Update usage counters
    if (requestType in this.currentSubscription.apiCostUsage) {
      (this.currentSubscription.apiCostUsage as any)[requestType]++;
    }

    // Update cost tracking
    this.currentSubscription.apiCostUsage.totalAPICost += cost;
    this.currentSubscription.apiCostUsage.monthlyAPICost += cost;

    // Update cost by endpoint
    if (!this.currentSubscription.apiCostUsage.costByEndpoint[endpoint]) {
      this.currentSubscription.apiCostUsage.costByEndpoint[endpoint] = 0;
    }
    this.currentSubscription.apiCostUsage.costByEndpoint[endpoint] += cost;

    // Update cost by model
    if (!this.currentSubscription.apiCostUsage.costByModel[modelId]) {
      this.currentSubscription.apiCostUsage.costByModel[modelId] = 0;
    }
    this.currentSubscription.apiCostUsage.costByModel[modelId] += cost;

    // Update average cost per request
    const totalRequests = Object.values(this.currentSubscription.apiCostUsage).filter(
      (value): value is number => typeof value === 'number' && !isNaN(value)
    ).reduce((sum, count) => sum + count, 0);
    this.currentSubscription.apiCostUsage.averageCostPerRequest =
      this.currentSubscription.apiCostUsage.totalAPICost / Math.max(totalRequests, 1);
  }

  /**
   * Check API cost limits
   */
  checkAPICostLimits(): {
    withinLimits: boolean;
    costViolations: Array<{
      metric: string;
      current: number;
      limit: number;
      percentage: number;
    }>;
    recommendations: string[];
  } {
    if (!this.currentSubscription) {
      return { withinLimits: false, costViolations: [], recommendations: [] };
    }

    const plan = this.getCurrentPlan();
    if (!plan) {
      return { withinLimits: false, costViolations: [], recommendations: [] };
    }

    const costLimits = plan.features.apiCostLimits;
    const currentUsage = this.currentSubscription.apiCostUsage;
    const violations = [];
    const recommendations = [];

    // Check monthly API budget
    const budgetUsagePercent = (currentUsage.monthlyAPICost / costLimits.monthlyAPIBudget) * 100;
    if (budgetUsagePercent >= costLimits.costAlertThreshold) {
      violations.push({
        metric: 'monthlyAPIBudget',
        current: currentUsage.monthlyAPICost,
        limit: costLimits.monthlyAPIBudget,
        percentage: budgetUsagePercent
      });
    }

    // Check individual request limits
    const requestLimits = [
      { key: 'aiInferenceRequests', name: 'AI Inference Requests' },
      { key: 'aiStreamingRequests', name: 'AI Streaming Requests' },
      { key: 'aiBatchRequests', name: 'AI Batch Requests' },
      { key: 'smartInferenceRequests', name: 'Smart Inference Requests' },
      { key: 'modelOptimizationRequests', name: 'Model Optimization Requests' },
      { key: 'batchJobRequests', name: 'Batch Job Requests' },
      { key: 'fineTuneJobs', name: 'Fine-tune Jobs' },
      { key: 'abTestRuns', name: 'A/B Test Runs' }
    ];

    for (const limit of requestLimits) {
      const current = (currentUsage as any)[limit.key] || 0;
      const max = (costLimits as any)[limit.key];
      const percentage = (current / max) * 100;

      if (percentage >= 90) {
        violations.push({
          metric: limit.name,
          current,
          limit: max,
          percentage
        });
      }
    }

    // Generate recommendations
    if (violations.length > 0) {
      recommendations.push('Consider upgrading to a higher tier plan for increased limits');
      recommendations.push('Monitor your API usage patterns to optimize costs');
      recommendations.push('Use batch processing for multiple similar requests');
    }

    if (budgetUsagePercent >= costLimits.costAlertThreshold) {
      recommendations.push('You are approaching your monthly API budget limit');
      recommendations.push('Consider setting up budget alerts for better cost control');
    }

    return {
      withinLimits: violations.length === 0,
      costViolations: violations,
      recommendations
    };
  }

  /**
   * Get API cost analytics
   */
  getAPICostAnalytics(): {
    totalCost: number;
    monthlyCost: number;
    averageCostPerRequest: number;
    costByEndpoint: Record<string, number>;
    costByModel: Record<string, number>;
    usageEfficiency: {
      mostUsedEndpoint: string;
      mostExpensiveModel: string;
      costPerRequestTrend: number[];
    };
    budgetUtilization: number;
    recommendations: string[];
  } {
    if (!this.currentSubscription) {
      return {
        totalCost: 0,
        monthlyCost: 0,
        averageCostPerRequest: 0,
        costByEndpoint: {},
        costByModel: {},
        usageEfficiency: { mostUsedEndpoint: '', mostExpensiveModel: '', costPerRequestTrend: [] },
        budgetUtilization: 0,
        recommendations: []
      };
    }

    const plan = this.getCurrentPlan();
    const costLimits = plan?.features.apiCostLimits;
    const usage = this.currentSubscription.apiCostUsage;

    const recommendations = [];

    // Find most used endpoint
    const mostUsedEndpoint = Object.entries(usage.costByEndpoint).reduce(
      (max, [endpoint, cost]) => cost > max.cost ? { endpoint, cost } : max,
      { endpoint: '', cost: 0 }
    );

    // Find most expensive model
    const mostExpensiveModel = Object.entries(usage.costByModel).reduce(
      (max, [model, cost]) => cost > max.cost ? { model, cost } : max,
      { model: '', cost: 0 }
    );

    // Calculate budget utilization
    const budgetUtilization = costLimits ?
      (usage.monthlyAPICost / costLimits.monthlyAPIBudget) * 100 : 0;

    // Generate recommendations
    if (mostUsedEndpoint.cost > usage.totalAPICost * 0.5) {
      recommendations.push(`Optimize usage of ${mostUsedEndpoint.endpoint} - it accounts for 50% of costs`);
    }

    if (budgetUtilization > 80) {
      recommendations.push('Consider upgrading your plan or optimizing usage to stay within budget');
    }

    if (usage.averageCostPerRequest > 0.05) {
      recommendations.push('Your average cost per request is high - consider using smaller models or batch processing');
    }

    return {
      totalCost: usage.totalAPICost,
      monthlyCost: usage.monthlyAPICost,
      averageCostPerRequest: usage.averageCostPerRequest,
      costByEndpoint: usage.costByEndpoint,
      costByModel: usage.costByModel,
      usageEfficiency: {
        mostUsedEndpoint: mostUsedEndpoint.endpoint,
        mostExpensiveModel: mostExpensiveModel.model,
        costPerRequestTrend: usage.usageTrend.map(day => day.cost / Math.max(day.requests, 1))
      },
      budgetUtilization,
      recommendations
    };
  }

  /**
   * Reset monthly API usage counters
   */
  resetMonthlyAPIUsage(): void {
    if (!this.currentSubscription) return;

    // Reset usage counters
    this.currentSubscription.apiCostUsage.aiInferenceRequests = 0;
    this.currentSubscription.apiCostUsage.aiStreamingRequests = 0;
    this.currentSubscription.apiCostUsage.aiBatchRequests = 0;
    this.currentSubscription.apiCostUsage.smartInferenceRequests = 0;
    this.currentSubscription.apiCostUsage.modelOptimizationRequests = 0;
    this.currentSubscription.apiCostUsage.batchJobRequests = 0;
    this.currentSubscription.apiCostUsage.fineTuneJobs = 0;
    this.currentSubscription.apiCostUsage.abTestRuns = 0;
    this.currentSubscription.apiCostUsage.modelLoads = 0;

    // Reset monthly cost
    this.currentSubscription.apiCostUsage.monthlyAPICost = 0;

    // Keep historical data
    this.currentSubscription.apiCostUsage.usageTrend = [];
  }

  /**
   * Get subscription health status
   */
  getSubscriptionHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
    nextRenewal: Date | null;
    utilizationAlerts: Array<{
      metric: string;
      level: 'low' | 'medium' | 'high';
      message: string;
    }>;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const utilizationAlerts: Array<{ metric: string; level: 'low' | 'medium' | 'high'; message: string }> = [];

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (!this.currentSubscription) {
      return {
        status: 'critical',
        issues: ['No active subscription found'],
        recommendations: ['Contact support to activate subscription'],
        nextRenewal: null,
        utilizationAlerts: []
      };
    }

    const { current, limits } = this.currentSubscription.usage;
    const plan = this.getCurrentPlan();

    // Check utilization
    const userUtilization = (current.users / limits.users) * 100;
    const workflowUtilization = (current.workflows / limits.workflows) * 100;
    const apiUtilization = (current.apiCalls / limits.apiCalls) * 100;
    const storageUtilization = (current.storage / limits.storage) * 100;

    if (userUtilization > 90) {
      status = 'warning';
      utilizationAlerts.push({
        metric: 'users',
        level: userUtilization > 95 ? 'high' : 'medium',
        message: `User utilization at ${userUtilization.toFixed(1)}%`
      });
    }

    if (workflowUtilization > 90) {
      status = 'warning';
      utilizationAlerts.push({
        metric: 'workflows',
        level: workflowUtilization > 95 ? 'high' : 'medium',
        message: `Workflow utilization at ${workflowUtilization.toFixed(1)}%`
      });
    }

    if (apiUtilization > 90) {
      status = 'warning';
      utilizationAlerts.push({
        metric: 'apiCalls',
        level: apiUtilization > 95 ? 'high' : 'medium',
        message: `API utilization at ${apiUtilization.toFixed(1)}%`
      });
    }

    if (storageUtilization > 90) {
      status = 'warning';
      utilizationAlerts.push({
        metric: 'storage',
        level: storageUtilization > 95 ? 'high' : 'medium',
        message: `Storage utilization at ${storageUtilization.toFixed(1)}%`
      });
    }

    // Check trial status
    if (this.currentSubscription.status === 'trial' && this.currentSubscription.trialEndDate) {
      const daysLeft = Math.ceil((this.currentSubscription.trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 7) {
        status = 'warning';
        issues.push(`Trial expires in ${daysLeft} days`);
        recommendations.push('Consider upgrading to a paid plan');
      }
    }

    // Check renewal
    let nextRenewal = null;
    if (this.currentSubscription.endDate) {
      nextRenewal = this.currentSubscription.endDate;
      const daysUntilRenewal = Math.ceil((nextRenewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilRenewal <= 30) {
        if (daysUntilRenewal <= 7) status = 'critical';
        else if (daysUntilRenewal <= 14) status = 'warning';

        issues.push(`Subscription renews in ${daysUntilRenewal} days`);
        recommendations.push('Review auto-renewal settings or prepare payment method');
      }
    }

    // General recommendations
    if (plan && plan.tier.includes('starter')) {
      recommendations.push('Consider upgrading to Professional for advanced features');
    }

    return {
      status,
      issues,
      recommendations,
      nextRenewal,
      utilizationAlerts
    };
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
