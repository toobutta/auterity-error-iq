/**
 * Stripe Payment Service
 *
 * Handles payment processing for template marketplace and subscriptions
 * Enables monetization of AI-generated templates and premium features
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

class StripeService {
  private stripe: Stripe | null = null;
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    // Initialize Stripe with publishable key
    this.stripePromise = this.initializeStripe();
  }

  private async initializeStripe(): Promise<Stripe | null> {
    try {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!stripeKey) {
        console.warn('Stripe publishable key not found');
        return null;
      }

      this.stripe = await loadStripe(stripeKey);
      return this.stripe;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      return null;
    }
  }

  /**
   * Create checkout session for template purchase
   */
  async createTemplateCheckout(
    templateId: string,
    customerEmail: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{ sessionId: string; url: string }> {
    const response = await fetch('/api/payments/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        customerEmail,
        successUrl: successUrl || `${window.location.origin}/templates/success`,
        cancelUrl: cancelUrl || `${window.location.origin}/templates/cancel`
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const session = await response.json();
    return session;
  }

  /**
   * Create subscription checkout for premium plans
   */
  async createSubscriptionCheckout(
    planId: string,
    customerEmail: string,
    returnUrl?: string
  ): Promise<{ url: string }> {
    const response = await fetch('/api/payments/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        customerEmail,
        returnUrl: returnUrl || `${window.location.origin}/billing/success`
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }

    return await response.json();
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(sessionId: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await this.stripe.redirectToCheckout({
      sessionId
    });

    if (error) {
      throw error;
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(timeRange: string = '30d'): Promise<any> {
    const response = await fetch(`/api/payments/analytics?range=${timeRange}`);

    if (!response.ok) {
      throw new Error('Failed to fetch payment analytics');
    }

    return await response.json();
  }

  /**
   * Process template purchase
   */
  async purchaseTemplate(templateId: string, customerEmail: string): Promise<void> {
    const session = await this.createTemplateCheckout(templateId, customerEmail);
    await this.redirectToCheckout(session.sessionId);
  }

  /**
   * Process subscription upgrade
   */
  async upgradeSubscription(planId: string, customerEmail: string): Promise<void> {
    const session = await this.createSubscriptionCheckout(planId, customerEmail);
    window.location.href = session.url;
  }

  /**
   * Check if Stripe is available
   */
  isAvailable(): boolean {
    return !!this.stripe;
  }

  /**
   * Get Stripe instance
   */
  getStripe(): Stripe | null {
    return this.stripe;
  }
}

// Export singleton instance
export const stripeService = new StripeService();
