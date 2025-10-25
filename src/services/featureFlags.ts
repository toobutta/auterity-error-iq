/**
 * Feature Flags Service
 * Advanced feature flag management with A/B testing and rollout control
 */

import { FeatureFlag, FeatureFlagConfig, FeatureFlagRule, FeatureFlagUser, FeatureFlagExperiment } from '../types/featureFlags';

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map();
  private config: FeatureFlagConfig;
  private experiments: Map<string, FeatureFlagExperiment> = new Map();
  private userOverrides: Map<string, Map<string, boolean>> = new Map();
  private isInitialized = false;

  constructor(config: FeatureFlagConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      environment: config.environment ?? 'development',
      user: config.user,
      attributes: config.attributes || {},
      onFlagChange: config.onFlagChange,
      persistence: config.persistence ?? 'memory',
      syncInterval: config.syncInterval ?? 60000, // 1 minute
      ...config
    };

    this.initialize();
  }

  // Initialize the service
  private initialize(): void {
    if (this.isInitialized) return;

    // Load persisted flags
    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      this.loadFromStorage();
    }

    // Set up auto-sync if backend URL is provided
    if (this.config.backendUrl && this.config.syncInterval > 0) {
      setInterval(() => this.syncWithBackend(), this.config.syncInterval);
    }

    // Load default flags
    this.loadDefaultFlags();

    this.isInitialized = true;
    console.log('Feature flags service initialized');
  }

  // Load default flags (these would typically come from a config file or backend)
  private loadDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'ai-chat-interface',
        name: 'AI Chat Interface',
        description: 'Enable the new AI chat interface in workflow studio',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [],
        experimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        key: 'analytics-tracking',
        name: 'Analytics Tracking',
        description: 'Enable user behavior analytics',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [],
        experimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        key: 'performance-monitoring',
        name: 'Performance Monitoring',
        description: 'Enable Core Web Vitals tracking',
        enabled: true,
        rolloutPercentage: 100,
        conditions: [],
        experimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        key: 'advanced-editor',
        name: 'Advanced Monaco Editor',
        description: 'Enable enhanced Monaco Editor features',
        enabled: false,
        rolloutPercentage: 50,
        conditions: [],
        experimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        key: 'dnd-kit-integration',
        name: 'DND Kit Integration',
        description: 'Enable new drag-and-drop system',
        enabled: false,
        rolloutPercentage: 25,
        conditions: [
          {
            attribute: 'user.role',
            operator: 'equals',
            value: 'admin'
          }
        ],
        experimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    defaultFlags.forEach(flag => {
      this.flags.set(flag.key, flag);
    });
  }

  // Check if a feature flag is enabled for the current user
  isEnabled(flagKey: string): boolean {
    if (!this.config.enabled) return false;

    const flag = this.flags.get(flagKey);
    if (!flag || !flag.enabled) return false;

    // Check user override first
    const userId = this.config.user?.id;
    if (userId) {
      const userOverrides = this.userOverrides.get(userId);
      if (userOverrides?.has(flagKey)) {
        return userOverrides.get(flagKey)!;
      }
    }

    // Check conditions
    if (!this.evaluateConditions(flag.conditions)) {
      return false;
    }

    // Check rollout percentage
    return this.evaluateRollout(flag.rolloutPercentage);
  }

  // Get all feature flags
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Get a specific feature flag
  getFlag(flagKey: string): FeatureFlag | undefined {
    return this.flags.get(flagKey);
  }

  // Update a feature flag
  updateFlag(flagKey: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(flagKey);
    if (!flag) return;

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: Date.now()
    };

    this.flags.set(flagKey, updatedFlag);

    // Notify listeners
    this.config.onFlagChange?.(flagKey, updatedFlag);

    // Persist changes
    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      this.saveToStorage();
    }

    // Sync with backend
    if (this.config.backendUrl) {
      this.syncFlagWithBackend(updatedFlag);
    }
  }

  // Create a new feature flag
  createFlag(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void {
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.flags.set(flag.key, newFlag);

    // Sync with backend
    if (this.config.backendUrl) {
      this.syncFlagWithBackend(newFlag);
    }
  }

  // Delete a feature flag
  deleteFlag(flagKey: string): void {
    const flag = this.flags.get(flagKey);
    if (!flag) return;

    this.flags.delete(flagKey);

    // Notify listeners
    this.config.onFlagChange?.(flagKey, undefined);

    // Persist changes
    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      this.saveToStorage();
    }

    // Sync with backend
    if (this.config.backendUrl) {
      this.deleteFlagFromBackend(flagKey);
    }
  }

  // Set user override
  setUserOverride(userId: string, flagKey: string, enabled: boolean): void {
    if (!this.userOverrides.has(userId)) {
      this.userOverrides.set(userId, new Map());
    }

    this.userOverrides.get(userId)!.set(flagKey, enabled);

    // Persist changes
    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      this.saveToStorage();
    }
  }

  // Clear user override
  clearUserOverride(userId: string, flagKey: string): void {
    const userOverrides = this.userOverrides.get(userId);
    if (userOverrides) {
      userOverrides.delete(flagKey);
    }

    // Persist changes
    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      this.saveToStorage();
    }
  }

  // Evaluate conditions
  private evaluateConditions(conditions: FeatureFlagRule[]): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const attributeValue = this.getAttributeValue(condition.attribute);
      return this.evaluateCondition(attributeValue, condition.operator, condition.value);
    });
  }

  // Get attribute value from user or context
  private getAttributeValue(attribute: string): any {
    // Check user attributes first
    if (this.config.user && attribute.startsWith('user.')) {
      const userAttr = attribute.substring(5);
      return (this.config.user as any)[userAttr];
    }

    // Check global attributes
    if (attribute in this.config.attributes) {
      return this.config.attributes[attribute];
    }

    // Check environment attributes
    if (attribute === 'environment') {
      return this.config.environment;
    }

    // Check user agent for device/browser detection
    if (attribute === 'userAgent' && typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }

    return undefined;
  }

  // Evaluate individual condition
  private evaluateCondition(value: any, operator: string, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'notEquals':
        return value !== target;
      case 'contains':
        return String(value).includes(String(target));
      case 'notContains':
        return !String(value).includes(String(target));
      case 'greaterThan':
        return Number(value) > Number(target);
      case 'lessThan':
        return Number(value) < Number(target);
      case 'in':
        return Array.isArray(target) && target.includes(value);
      case 'notIn':
        return Array.isArray(target) && !target.includes(value);
      default:
        return false;
    }
  }

  // Evaluate rollout percentage
  private evaluateRollout(percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use user ID or session ID for consistent rollout
    const identifier = this.config.user?.id || 'anonymous';
    const hash = this.simpleHash(identifier);
    const rolloutValue = Math.abs(hash) % 100;

    return rolloutValue < percentage;
  }

  // Simple hash function for rollout calculation
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  // Load flags from localStorage
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedFlags = localStorage.getItem('feature-flags');
      if (storedFlags) {
        const parsed = JSON.parse(storedFlags);
        Object.entries(parsed).forEach(([key, flag]) => {
          this.flags.set(key, flag as FeatureFlag);
        });
      }

      const storedOverrides = localStorage.getItem('feature-flag-overrides');
      if (storedOverrides) {
        const parsed = JSON.parse(storedOverrides);
        Object.entries(parsed).forEach(([userId, overrides]) => {
          this.userOverrides.set(userId, new Map(Object.entries(overrides as any)));
        });
      }
    } catch (error) {
      console.warn('Failed to load feature flags from storage:', error);
    }
  }

  // Save flags to localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const flagsObject = Object.fromEntries(this.flags);
      localStorage.setItem('feature-flags', JSON.stringify(flagsObject));

      const overridesObject: any = {};
      this.userOverrides.forEach((overrides, userId) => {
        overridesObject[userId] = Object.fromEntries(overrides);
      });
      localStorage.setItem('feature-flag-overrides', JSON.stringify(overridesObject));
    } catch (error) {
      console.warn('Failed to save feature flags to storage:', error);
    }
  }

  // Sync with backend
  private async syncWithBackend(): Promise<void> {
    if (!this.config.backendUrl) return;

    try {
      const response = await fetch(`${this.config.backendUrl}/flags`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || ''}`
        }
      });

      if (response.ok) {
        const backendFlags = await response.json();
        backendFlags.forEach((flag: FeatureFlag) => {
          this.flags.set(flag.key, flag);
        });
      }
    } catch (error) {
      console.warn('Failed to sync feature flags with backend:', error);
    }
  }

  // Sync individual flag with backend
  private async syncFlagWithBackend(flag: FeatureFlag): Promise<void> {
    if (!this.config.backendUrl) return;

    try {
      await fetch(`${this.config.backendUrl}/flags/${flag.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || ''}`
        },
        body: JSON.stringify(flag)
      });
    } catch (error) {
      console.warn('Failed to sync flag with backend:', error);
    }
  }

  // Delete flag from backend
  private async deleteFlagFromBackend(flagKey: string): Promise<void> {
    if (!this.config.backendUrl) return;

    try {
      await fetch(`${this.config.backendUrl}/flags/${flagKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || ''}`
        }
      });
    } catch (error) {
      console.warn('Failed to delete flag from backend:', error);
    }
  }

  // Get feature flag statistics
  getStats(): {
    totalFlags: number;
    enabledFlags: number;
    disabledFlags: number;
    flagsByRollout: Record<string, number>;
  } {
    const flags = Array.from(this.flags.values());
    const enabledFlags = flags.filter(flag => flag.enabled).length;
    const disabledFlags = flags.length - enabledFlags;

    const flagsByRollout: Record<string, number> = {};
    flags.forEach(flag => {
      const range = flag.rolloutPercentage === 0 ? '0%' :
                   flag.rolloutPercentage < 25 ? '1-24%' :
                   flag.rolloutPercentage < 50 ? '25-49%' :
                   flag.rolloutPercentage < 75 ? '50-74%' :
                   flag.rolloutPercentage < 100 ? '75-99%' : '100%';
      flagsByRollout[range] = (flagsByRollout[range] || 0) + 1;
    });

    return {
      totalFlags: flags.length,
      enabledFlags,
      disabledFlags,
      flagsByRollout
    };
  }

  // Reset all flags (useful for testing)
  reset(): void {
    this.flags.clear();
    this.userOverrides.clear();
    this.experiments.clear();

    if (this.config.persistence === 'localStorage' && typeof window !== 'undefined') {
      localStorage.removeItem('feature-flags');
      localStorage.removeItem('feature-flag-overrides');
    }

    this.loadDefaultFlags();
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagsService();

// Export class for custom instances
export { FeatureFlagsService };
export default featureFlags;
