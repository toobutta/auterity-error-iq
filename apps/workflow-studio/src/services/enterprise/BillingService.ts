/**
 * Billing Service for Auterity Error-IQ
 * Manages billing, invoicing, and payment processing
 * Supports multiple payment providers and subscription models
 */

import { z } from "zod";

// Types for billing and invoicing
export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  tier: string;
  deploymentType: string;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  prices: {
    base: number;
    perUser?: number;
    perWorkflow?: number;
    perAPI?: number;
    perStorage?: number;
  };
  features: string[];
  limits: {
    users: number;
    workflows: number;
    apiCalls: number;
    storage: number;
  };
  trialDays?: number;
  isActive: boolean;
}

export interface SubscriptionBilling {
  id: string;
  subscriptionId: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  billingCycle: 'monthly' | 'annual';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  paymentMethod?: PaymentMethod;
  latestInvoice?: Invoice;
  usage: BillingUsage;
}

export interface BillingUsage {
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    users: {
      current: number;
      included: number;
      overage: number;
      rate: number;
    };
    workflows: {
      current: number;
      included: number;
      overage: number;
      rate: number;
    };
    apiCalls: {
      current: number;
      included: number;
      overage: number;
      rate: number;
    };
    storage: {
      current: number; // in GB
      included: number; // in GB
      overage: number;
      rate: number;
    };
  };
  totalAmount: number;
  breakdown: {
    baseAmount: number;
    overageAmount: number;
    taxes: number;
    discounts: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  billingDetails: {
    name: string;
    email: string;
    address?: Address;
  };
}

export interface Invoice {
  id: string;
  number: string;
  subscriptionId: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  currency: string;
  amount: number;
  amountDue: number;
  amountPaid: number;
  subtotal: number;
  tax: number;
  total: number;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  dueDate: Date;
  paidAt?: Date;
  lines: InvoiceLine[];
  paymentIntent?: string;
  pdfUrl?: string;
}

export interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  period: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface BillingAlert {
  id: string;
  type: 'payment_failed' | 'trial_ending' | 'usage_limit' | 'invoice_overdue';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export class BillingService {
  private plans: Map<string, BillingPlan> = new Map();
  private subscriptions: Map<string, SubscriptionBilling> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private alerts: Map<string, BillingAlert> = new Map();
  private paymentProvider: 'stripe' | 'paypal' | 'custom' = 'stripe';

  constructor() {
    this.initializeBillingPlans();
    this.initializePaymentProvider();
  }

  /**
   * Initialize billing plans
   */
  private initializeBillingPlans(): void {
    const plans: BillingPlan[] = [
      // SaaS Plans
      {
        id: 'saas-starter',
        name: 'SaaS Starter',
        description: 'Perfect for small teams getting started',
        tier: 'starter',
        deploymentType: 'saas',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 49,
          perUser: 9,
          perWorkflow: 0.10,
          perAPI: 0.001,
          perStorage: 0.50
        },
        features: [
          'basic-workflows',
          'ai-models',
          'email-support',
          'basic-analytics'
        ],
        limits: {
          users: 5,
          workflows: 100,
          apiCalls: 10000,
          storage: 5
        },
        trialDays: 14,
        isActive: true
      },
      {
        id: 'saas-professional',
        name: 'SaaS Professional',
        description: 'Advanced features for growing teams',
        tier: 'professional',
        deploymentType: 'saas',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 199,
          perUser: 19,
          perWorkflow: 0.05,
          perAPI: 0.0005,
          perStorage: 0.25
        },
        features: [
          'advanced-workflows',
          'temporal-orchestration',
          'weights-biases',
          'postman-postbot',
          'test-sigma',
          'novita-ai',
          'priority-support',
          'advanced-analytics'
        ],
        limits: {
          users: 25,
          workflows: 1000,
          apiCalls: 100000,
          storage: 50
        },
        trialDays: 30,
        isActive: true
      },
      {
        id: 'saas-enterprise',
        name: 'SaaS Enterprise',
        description: 'Full enterprise features and support',
        tier: 'enterprise',
        deploymentType: 'saas',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 999,
          perUser: 39,
          perWorkflow: 0.02,
          perAPI: 0.0002,
          perStorage: 0.10
        },
        features: [
          'all-professional-features',
          'enterprise-security',
          'audit-logs',
          'compliance-reporting',
          'dedicated-support',
          'custom-integrations',
          'unlimited-users'
        ],
        limits: {
          users: 1000,
          workflows: 10000,
          apiCalls: 1000000,
          storage: 500
        },
        trialDays: 0,
        isActive: true
      },

      // White-label Plans
      {
        id: 'white-label-professional',
        name: 'White-label Professional',
        description: 'Professional features with white-label branding',
        tier: 'professional',
        deploymentType: 'white-label',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 499,
          perUser: 29,
          perWorkflow: 0.08,
          perAPI: 0.0008,
          perStorage: 0.40
        },
        features: [
          'all-professional-features',
          'white-label-branding',
          'custom-domain',
          'client-specific-integrations'
        ],
        limits: {
          users: 50,
          workflows: 2000,
          apiCalls: 250000,
          storage: 100
        },
        trialDays: 14,
        isActive: true
      },
      {
        id: 'white-label-enterprise',
        name: 'White-label Enterprise',
        description: 'Enterprise features with complete white-label solution',
        tier: 'enterprise',
        deploymentType: 'white-label',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 1999,
          perUser: 59,
          perWorkflow: 0.05,
          perAPI: 0.0005,
          perStorage: 0.20
        },
        features: [
          'all-enterprise-features',
          'complete-white-label',
          'multi-client-support',
          'custom-development',
          'dedicated-success-manager'
        ],
        limits: {
          users: 5000,
          workflows: 50000,
          apiCalls: 5000000,
          storage: 2000
        },
        trialDays: 0,
        isActive: true
      },

      // Self-hosted Plans
      {
        id: 'self-hosted-community',
        name: 'Self-hosted Community',
        description: 'Free community edition for self-hosted deployment',
        tier: 'community',
        deploymentType: 'self-hosted',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 0,
          perUser: 0,
          perWorkflow: 0,
          perAPI: 0,
          perStorage: 0
        },
        features: [
          'basic-workflows',
          'basic-ai-models',
          'basic-analytics',
          'community-support',
          'self-hosted-deployment'
        ],
        limits: {
          users: 3,
          workflows: 10,
          apiCalls: 1000,
          storage: 1
        },
        trialDays: 0,
        isActive: true
      },
      {
        id: 'self-hosted-professional',
        name: 'Self-hosted Professional',
        description: 'Professional features with self-hosted deployment',
        tier: 'professional',
        deploymentType: 'self-hosted',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 799,
          perUser: 8,
          perWorkflow: 0.16,
          perAPI: 0.0016,
          perStorage: 0.80
        },
        features: [
          'all-professional-features',
          'self-hosted-deployment',
          'local-data-control',
          'custom-security-configurations'
        ],
        limits: {
          users: 100,
          workflows: 500,
          apiCalls: 500000,
          storage: 1000
        },
        trialDays: 14,
        isActive: true
      },
      {
        id: 'self-hosted-enterprise',
        name: 'Self-hosted Enterprise',
        description: 'Enterprise features with self-hosted deployment',
        tier: 'enterprise',
        deploymentType: 'self-hosted',
        currency: 'USD',
        billingCycle: 'monthly',
        prices: {
          base: 2999,
          perUser: 0.30,
          perWorkflow: 0.06,
          perAPI: 0.0003,
          perStorage: 0.15
        },
        features: [
          'all-enterprise-features',
          'self-hosted-deployment',
          'complete-data-sovereignty',
          'advanced-security-compliance',
          'custom-integrations'
        ],
        limits: {
          users: 10000,
          workflows: 10000,
          apiCalls: 10000000,
          storage: 5000
        },
        trialDays: 0,
        isActive: true
      }
    ];

    plans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });

  }

  /**
   * Initialize payment provider
   */
  private initializePaymentProvider(): void {
    const provider = import.meta.env.VITE_PAYMENT_PROVIDER as typeof this.paymentProvider;
    if (provider && ['stripe', 'paypal', 'custom'].includes(provider)) {
      this.paymentProvider = provider;
    }

  }

  /**
   * Create subscription
   */
  async createSubscription(
    organizationId: string,
    planId: string,
    options: {
      trialDays?: number;
      billingCycle?: 'monthly' | 'annual';
      paymentMethodId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<SubscriptionBilling> {
    try {
      const plan = this.plans.get(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const now = new Date();
      const billingCycle = options.billingCycle || plan.billingCycle;
      const periodEnd = new Date(now);

      if (billingCycle === 'monthly') {
        periodEnd.setMonth(now.getMonth() + 1);
      } else {
        periodEnd.setFullYear(now.getFullYear() + 1);
      }

      const trialEnd = options.trialDays ? new Date(now.getTime() + options.trialDays * 24 * 60 * 60 * 1000) : undefined;

      const subscription: SubscriptionBilling = {
        id: subscriptionId,
        subscriptionId,
        organizationId,
        planId,
        status: trialEnd ? 'active' : 'incomplete',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
        cancelAtPeriodEnd: false,
        usage: {
          period: {
            start: now,
            end: periodEnd
          },
          metrics: {
            users: { current: 0, included: plan.limits.users, overage: 0, rate: plan.prices.perUser || 0 },
            workflows: { current: 0, included: plan.limits.workflows, overage: 0, rate: plan.prices.perWorkflow || 0 },
            apiCalls: { current: 0, included: plan.limits.apiCalls, overage: 0, rate: plan.prices.perAPI || 0 },
            storage: { current: 0, included: plan.limits.storage, overage: 0, rate: plan.prices.perStorage || 0 }
          },
          totalAmount: plan.prices.base,
          breakdown: {
            baseAmount: plan.prices.base,
            overageAmount: 0,
            taxes: 0,
            discounts: 0
          }
        }
      };

      this.subscriptions.set(subscriptionId, subscription);

      return subscription;

    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw new Error(`Subscription creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Update subscription usage
   */
  async updateUsage(
    subscriptionId: string,
    usage: {
      users?: number;
      workflows?: number;
      apiCalls?: number;
      storage?: number;
    }
  ): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const plan = this.plans.get(subscription.planId);
      if (!plan) {
        throw new Error(`Plan ${subscription.planId} not found`);
      }

      // Update usage metrics
      if (usage.users !== undefined) {
        subscription.usage.metrics.users.current = usage.users;
        subscription.usage.metrics.users.overage = Math.max(0, usage.users - plan.limits.users);
      }

      if (usage.workflows !== undefined) {
        subscription.usage.metrics.workflows.current = usage.workflows;
        subscription.usage.metrics.workflows.overage = Math.max(0, usage.workflows - plan.limits.workflows);
      }

      if (usage.apiCalls !== undefined) {
        subscription.usage.metrics.apiCalls.current = usage.apiCalls;
        subscription.usage.metrics.apiCalls.overage = Math.max(0, usage.apiCalls - plan.limits.apiCalls);
      }

      if (usage.storage !== undefined) {
        subscription.usage.metrics.storage.current = usage.storage;
        subscription.usage.metrics.storage.overage = Math.max(0, usage.storage - plan.limits.storage);
      }

      // Calculate total amount
      this.calculateTotalAmount(subscription, plan);


    } catch (error) {
      console.error(`Failed to update usage for subscription ${subscriptionId}:`, error);
      throw new Error(`Usage update failed: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate total billing amount
   */
  private calculateTotalAmount(subscription: SubscriptionBilling, plan: BillingPlan): void {
    const { metrics } = subscription.usage;

    const baseAmount = plan.prices.base;
    const userOverage = metrics.users.overage * metrics.users.rate;
    const workflowOverage = metrics.workflows.overage * metrics.workflows.rate;
    const apiOverage = metrics.apiCalls.overage * metrics.apiCalls.rate;
    const storageOverage = metrics.storage.overage * metrics.storage.rate;

    const overageAmount = userOverage + workflowOverage + apiOverage + storageOverage;
    const subtotal = baseAmount + overageAmount;
    const taxes = subtotal * 0.08; // 8% tax rate
    const total = subtotal + taxes;

    subscription.usage.totalAmount = total;
    subscription.usage.breakdown = {
      baseAmount,
      overageAmount,
      taxes,
      discounts: 0
    };
  }

  /**
   * Generate invoice
   */
  async generateInvoice(subscriptionId: string): Promise<Invoice> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const plan = this.plans.get(subscription.planId);
      if (!plan) {
        throw new Error(`Plan ${subscription.planId} not found`);
      }

      const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const invoice: Invoice = {
        id: invoiceId,
        number: `INV-${Date.now()}`,
        subscriptionId,
        status: 'draft',
        currency: plan.currency,
        amount: subscription.usage.totalAmount,
        amountDue: subscription.usage.totalAmount,
        amountPaid: 0,
        subtotal: subscription.usage.breakdown.baseAmount + subscription.usage.breakdown.overageAmount,
        tax: subscription.usage.breakdown.taxes,
        total: subscription.usage.totalAmount,
        billingPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd
        },
        dueDate,
        lines: [
          {
            id: `line_${Date.now()}_base`,
            description: `${plan.name} - Base Fee`,
            amount: subscription.usage.breakdown.baseAmount,
            quantity: 1,
            period: {
              start: subscription.currentPeriodStart,
              end: subscription.currentPeriodEnd
            }
          }
        ]
      };

      // Add overage lines if applicable
      const { metrics } = subscription.usage;

      if (metrics.users.overage > 0) {
        invoice.lines.push({
          id: `line_${Date.now()}_users`,
          description: `Additional Users (${metrics.users.overage})`,
          amount: metrics.users.overage * metrics.users.rate,
          quantity: metrics.users.overage,
          period: {
            start: subscription.currentPeriodStart,
            end: subscription.currentPeriodEnd
          }
        });
      }

      if (metrics.workflows.overage > 0) {
        invoice.lines.push({
          id: `line_${Date.now()}_workflows`,
          description: `Workflow Overage (${metrics.workflows.overage})`,
          amount: metrics.workflows.overage * metrics.workflows.rate,
          quantity: metrics.workflows.overage,
          period: {
            start: subscription.currentPeriodStart,
            end: subscription.currentPeriodEnd
          }
        });
      }

      this.invoices.set(invoiceId, invoice);
      subscription.latestInvoice = invoice;

      return invoice;

    } catch (error) {
      console.error('Failed to generate invoice:', error);
      throw new Error(`Invoice generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    invoiceId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const invoice = this.invoices.get(invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      if (invoice.status === 'paid') {
        return { success: false, error: 'Invoice already paid' };
      }

      // Simulate payment processing
      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        invoice.status = 'paid';
        invoice.amountPaid = invoice.amountDue;
        invoice.paidAt = new Date();

        const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return { success: true, transactionId };

      } else {
        invoice.status = 'uncollectible';

        // Create billing alert
        await this.createBillingAlert({
          type: 'payment_failed',
          severity: 'high',
          title: 'Payment Failed',
          message: `Payment of $${invoice.total.toFixed(2)} for invoice ${invoice.number} failed`,
          actionRequired: true,
          actionUrl: '/billing/payment-methods'
        });

        return { success: false, error: 'Payment failed' };
      }

    } catch (error) {
      console.error('Payment processing failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create billing alert
   */
  async createBillingAlert(alertData: Omit<BillingAlert, 'id' | 'createdAt'>): Promise<string> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const alert: BillingAlert = {
        id: alertId,
        ...alertData,
        createdAt: new Date()
      };

      this.alerts.set(alertId, alert);

      return alertId;

    } catch (error) {
      console.error('Failed to create billing alert:', error);
      throw new Error(`Alert creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get billing alerts
   */
  getBillingAlerts(activeOnly: boolean = true): BillingAlert[] {
    try {
      const alerts = Array.from(this.alerts.values());

      if (activeOnly) {
        return alerts.filter(alert => !alert.resolvedAt);
      }

      return alerts;
    } catch (error) {
      console.error('Failed to get billing alerts:', error);
      return [];
    }
  }

  /**
   * Get subscription billing info
   */
  getSubscriptionBilling(subscriptionId: string): SubscriptionBilling | null {
    try {
      return this.subscriptions.get(subscriptionId) || null;
    } catch (error) {
      console.error(`Failed to get billing for subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  /**
   * Get invoice details
   */
  getInvoice(invoiceId: string): Invoice | null {
    try {
      return this.invoices.get(invoiceId) || null;
    } catch (error) {
      console.error(`Failed to get invoice ${invoiceId}:`, error);
      return null;
    }
  }

  /**
   * Get billing plans
   */
  getBillingPlans(deploymentType?: string): BillingPlan[] {
    try {
      const plans = Array.from(this.plans.values()).filter(plan => plan.isActive);

      if (deploymentType) {
        return plans.filter(plan => plan.deploymentType === deploymentType);
      }

      return plans;
    } catch (error) {
      console.error('Failed to get billing plans:', error);
      return [];
    }
  }

  /**
   * Calculate upgrade cost
   */
  calculateUpgradeCost(
    currentSubscriptionId: string,
    targetPlanId: string
  ): {
    proratedAmount: number;
    nextBillingAmount: number;
    savings: number;
    breakdown: Record<string, number>;
  } {
    try {
      const currentSubscription = this.subscriptions.get(currentSubscriptionId);
      const targetPlan = this.plans.get(targetPlanId);

      if (!currentSubscription || !targetPlan) {
        throw new Error('Invalid subscription or plan');
      }

      const now = new Date();
      const periodEnd = currentSubscription.currentPeriodEnd;
      const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const totalDaysInPeriod = currentSubscription.billingCycle === 'monthly' ? 30 : 365;
      const prorationFactor = daysRemaining / totalDaysInPeriod;

      const currentPlan = this.plans.get(currentSubscription.planId);
      if (!currentPlan) {
        throw new Error('Current plan not found');
      }

      const currentCost = currentPlan.prices.base;
      const targetCost = targetPlan.prices.base;

      const proratedAmount = Math.max(0, (targetCost - currentCost) * prorationFactor);
      const nextBillingAmount = targetCost;
      const savings = currentCost - targetCost;

      return {
        proratedAmount,
        nextBillingAmount,
        savings: savings > 0 ? savings : 0,
        breakdown: {
          currentPlanCost: currentCost,
          targetPlanCost: targetCost,
          unusedCurrentPlanCredit: currentCost * prorationFactor,
          prorationFactor
        }
      };

    } catch (error) {
      console.error('Failed to calculate upgrade cost:', error);
      throw new Error(`Cost calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get billing analytics
   */
  getBillingAnalytics(timeframe: 'month' | 'quarter' | 'year' = 'month'): {
    revenue: {
      total: number;
      recurring: number;
      overage: number;
      growth: number;
    };
    subscriptions: {
      total: number;
      active: number;
      churned: number;
      trial: number;
    };
    usage: {
      averageUsers: number;
      averageWorkflows: number;
      averageAPICalls: number;
      averageStorage: number;
    };
    trends: Array<{
      period: string;
      revenue: number;
      subscriptions: number;
      churnRate: number;
    }>;
  } {
    try {
      const subscriptions = Array.from(this.subscriptions.values());
      const invoices = Array.from(this.invoices.values());

      // Calculate metrics
      const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

      const recurringRevenue = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + sub.usage.breakdown.baseAmount, 0);

      const overageRevenue = subscriptions
        .reduce((sum, sub) => sum + sub.usage.breakdown.overageAmount, 0);

      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
      const trialSubscriptions = subscriptions.filter(sub => sub.status === 'active' && sub.trialEnd).length;
      const churnedSubscriptions = subscriptions.filter(sub => sub.status === 'canceled').length;

      // Mock trends data
      const trends = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        trends.push({
          period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: Math.floor(Math.random() * 50000) + 20000,
          subscriptions: Math.floor(Math.random() * 50) + 100,
          churnRate: Math.random() * 5
        });
      }

      return {
        revenue: {
          total: totalRevenue,
          recurring: recurringRevenue,
          overage: overageRevenue,
          growth: 15.5 // Mock growth rate
        },
        subscriptions: {
          total: subscriptions.length,
          active: activeSubscriptions,
          churned: churnedSubscriptions,
          trial: trialSubscriptions
        },
        usage: {
          averageUsers: 23,
          averageWorkflows: 145,
          averageAPICalls: 45000,
          averageStorage: 12
        },
        trends
      };

    } catch (error) {
      console.error('Failed to get billing analytics:', error);
      throw new Error(`Analytics retrieval failed: ${(error as Error).message}`);
    }
  }
}

// Export singleton instance
export const billingService = new BillingService();
