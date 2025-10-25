/**
 * Analytics Service
 * Privacy-friendly analytics and user behavior tracking
 * Compatible with Vercel Analytics and custom backend integration
 */

import { AnalyticsEvent, AnalyticsUser, AnalyticsConfig, AnalyticsMetrics } from '../types/analytics';

class AnalyticsService {
  private config: AnalyticsConfig;
  private user: AnalyticsUser | null = null;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      trackPageViews: config.trackPageViews ?? true,
      trackUserInteractions: config.trackUserInteractions ?? true,
      trackErrors: config.trackErrors ?? true,
      trackPerformance: config.trackPerformance ?? true,
      privacyMode: config.privacyMode ?? 'anonymized',
      sampleRate: config.sampleRate ?? 1.0,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  // Initialize analytics service
  private initialize(): void {
    if (this.isInitialized) return;

    // Check if Vercel Analytics is available
    if (typeof window !== 'undefined' && (window as any).va) {
      this.isInitialized = true;
      console.log('Analytics: Vercel Analytics detected');
    }

    // Set up automatic page view tracking
    if (this.config.trackPageViews) {
      this.trackPageView();
    }

    // Set up error tracking
    if (this.config.trackErrors) {
      this.setupErrorTracking();
    }

    // Set up performance tracking
    if (this.config.trackPerformance) {
      this.setupPerformanceTracking();
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set user context
  setUser(user: AnalyticsUser): void {
    this.user = user;

    // Track user identification
    this.track('user_identify', {
      userId: user.id,
      properties: {
        email: this.config.privacyMode === 'anonymized' ? undefined : user.email,
        role: user.role,
        organization: user.organization,
        plan: user.plan
      }
    });
  }

  // Track page view
  trackPageView(path?: string): void {
    if (!this.config.enabled || !this.shouldTrack()) return;

    const pagePath = path || (typeof window !== 'undefined' ? window.location.pathname : '/');

    this.track('page_view', {
      path: pagePath,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });
  }

  // Track custom event
  track(eventName: string, properties: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        userId: this.user?.id,
        path: typeof window !== 'undefined' ? window.location.pathname : undefined
      }
    };

    // Add to local events queue
    this.events.push(event);

    // Send to Vercel Analytics if available
    if (typeof window !== 'undefined' && (window as any).va) {
      try {
        (window as any).va.track(eventName, event.properties);
      } catch (error) {
        console.warn('Analytics: Failed to send to Vercel Analytics', error);
      }
    }

    // Send to custom backend if configured
    if (this.config.backendUrl) {
      this.sendToBackend(event);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Track user interaction
  trackInteraction(element: string, action: string, properties: Record<string, any> = {}): void {
    if (!this.config.trackUserInteractions) return;

    this.track('user_interaction', {
      element,
      action,
      ...properties
    });
  }

  // Track workflow events
  trackWorkflow(workflowId: string, action: string, properties: Record<string, any> = {}): void {
    this.track('workflow_event', {
      workflowId,
      action,
      ...properties
    });
  }

  // Track AI interactions
  trackAIInteraction(model: string, tokens: number, latency: number, success: boolean): void {
    this.track('ai_interaction', {
      model,
      tokens,
      latency,
      success,
      cost: this.calculateAICost(model, tokens)
    });
  }

  // Track errors
  trackError(error: Error, context: Record<string, any> = {}): void {
    if (!this.config.trackErrors) return;

    this.track('error', {
      message: error.message,
      stack: this.config.privacyMode === 'anonymized' ? undefined : error.stack,
      name: error.name,
      context
    });
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, properties: Record<string, any> = {}): void {
    if (!this.config.trackPerformance) return;

    this.track('performance', {
      metric,
      value,
      ...properties
    });
  }

  // Calculate AI cost (simplified)
  private calculateAICost(model: string, tokens: number): number {
    const rates: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'claude-3': { input: 0.015, output: 0.075 },
      'default': { input: 0.01, output: 0.02 }
    };

    const rate = rates[model] || rates.default;
    // Assuming 70% of tokens are output tokens
    const inputTokens = Math.floor(tokens * 0.3);
    const outputTokens = Math.floor(tokens * 0.7);

    return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
  }

  // Check if event should be tracked based on sample rate
  private shouldTrack(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  // Send event to custom backend
  private async sendToBackend(event: AnalyticsEvent): Promise<void> {
    if (!this.config.backendUrl) return;

    try {
      await fetch(`${this.config.backendUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Analytics: Failed to send to backend', error);
    }
  }

  // Set up automatic error tracking
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandledrejection'
      });
    });
  }

  // Set up performance tracking
  private setupPerformanceTracking(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Track Core Web Vitals when available
    if ('web-vitals' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => this.trackPerformance('CLS', metric.value, metric));
        getFID((metric) => this.trackPerformance('FID', metric.value, metric));
        getFCP((metric) => this.trackPerformance('FCP', metric.value, metric));
        getLCP((metric) => this.trackPerformance('LCP', metric.value, metric));
        getTTFB((metric) => this.trackPerformance('TTFB', metric.value, metric));
      });
    }

    // Track navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackPerformance('navigation_timing', navigation.loadEventEnd - navigation.fetchStart, {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            tls: navigation.secureConnectionStart ? navigation.connectEnd - navigation.secureConnectionStart : 0,
            response: navigation.responseEnd - navigation.requestStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
          });
        }
      }, 0);
    });
  }

  // Get analytics metrics
  getMetrics(): AnalyticsMetrics {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(event => event.properties.timestamp > last24h);

    return {
      totalEvents: this.events.length,
      eventsLast24h: recentEvents.length,
      uniqueUsers: new Set(recentEvents.map(e => e.properties.userId).filter(Boolean)).size,
      topEvents: this.getTopEvents(recentEvents),
      averageSessionDuration: this.calculateAverageSessionDuration(),
      bounceRate: this.calculateBounceRate()
    };
  }

  // Get top events
  private getTopEvents(events: AnalyticsEvent[]): Record<string, number> {
    const counts: Record<string, number> = {};
    events.forEach(event => {
      counts[event.name] = (counts[event.name] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [name, count]) => ({ ...acc, [name]: count }), {});
  }

  // Calculate average session duration (simplified)
  private calculateAverageSessionDuration(): number {
    // This would require more complex session tracking
    return 0;
  }

  // Calculate bounce rate (simplified)
  private calculateBounceRate(): number {
    // This would require more complex session tracking
    return 0;
  }

  // Export data for GDPR compliance
  exportUserData(userId: string): AnalyticsEvent[] {
    return this.events.filter(event => event.properties.userId === userId);
  }

  // Delete user data for GDPR compliance
  deleteUserData(userId: string): void {
    this.events = this.events.filter(event => event.properties.userId !== userId);
  }

  // Update configuration
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Reset analytics (useful for testing)
  reset(): void {
    this.events = [];
    this.user = null;
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export class for custom instances
export { AnalyticsService };
export default analytics;
