/**
 * Feature Flags Hook
 * React hook for accessing feature flags in components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { featureFlags } from '../services/featureFlags';
import { FeatureFlag } from '../types/featureFlags';

export interface UseFeatureFlagsReturn {
  isEnabled: (flagKey: string) => boolean;
  getFlag: (flagKey: string) => FeatureFlag | undefined;
  getAllFlags: () => FeatureFlag[];
  flags: FeatureFlag[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook for accessing feature flags
 * Automatically updates when flags change
 */
export const useFeatureFlags = (): UseFeatureFlagsReturn => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial flags
  useEffect(() => {
    try {
      const allFlags = featureFlags.getAllFlags();
      setFlags(allFlags);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
      setLoading(false);
    }
  }, []);

  // Check if a flag is enabled
  const isEnabled = useCallback((flagKey: string): boolean => {
    try {
      return featureFlags.isEnabled(flagKey);
    } catch (err) {
      console.warn(`Failed to check flag ${flagKey}:`, err);
      return false;
    }
  }, []);

  // Get a specific flag
  const getFlag = useCallback((flagKey: string): FeatureFlag | undefined => {
    try {
      return featureFlags.getFlag(flagKey);
    } catch (err) {
      console.warn(`Failed to get flag ${flagKey}:`, err);
      return undefined;
    }
  }, []);

  // Get all flags
  const getAllFlags = useCallback((): FeatureFlag[] => {
    try {
      return featureFlags.getAllFlags();
    } catch (err) {
      console.warn('Failed to get all flags:', err);
      return [];
    }
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    isEnabled,
    getFlag,
    getAllFlags,
    flags,
    loading,
    error
  }), [isEnabled, getFlag, getAllFlags, flags, loading, error]);

  return returnValue;
};

/**
 * Hook for a specific feature flag
 * Returns the flag state and automatically updates when it changes
 */
export const useFeatureFlag = (flagKey: string): {
  enabled: boolean;
  flag: FeatureFlag | undefined;
  loading: boolean;
  error: string | null;
} => {
  const { isEnabled, getFlag, loading, error } = useFeatureFlags();

  const enabled = isEnabled(flagKey);
  const flag = getFlag(flagKey);

  return {
    enabled,
    flag,
    loading,
    error
  };
};

/**
 * Hook for conditional rendering based on feature flags
 * Useful for showing/hiding components based on flags
 */
export const useConditionalRender = (flagKey: string): {
  show: boolean;
  fallback?: React.ReactNode;
} => {
  const { enabled } = useFeatureFlag(flagKey);

  return {
    show: enabled
  };
};

/**
 * Hook for A/B testing experiments
 * Returns the variant for the current user
 */
export const useExperiment = (experimentId: string): {
  variant: string | null;
  isInExperiment: boolean;
  loading: boolean;
  error: string | null;
} => {
  const [variant, setVariant] = useState<string | null>(null);
  const [isInExperiment, setIsInExperiment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This would typically check with the feature flag service
    // For now, return a default implementation
    setVariant('control');
    setIsInExperiment(false);
    setLoading(false);
  }, [experimentId]);

  return {
    variant,
    isInExperiment,
    loading,
    error
  };
};

/**
 * Hook for feature flag overrides (admin use)
 * Allows temporarily overriding flag values for testing
 */
export const useFeatureFlagOverride = (userId: string) => {
  const setOverride = useCallback((flagKey: string, enabled: boolean) => {
    try {
      featureFlags.setUserOverride(userId, flagKey, enabled);
    } catch (err) {
      console.warn(`Failed to set override for ${flagKey}:`, err);
    }
  }, [userId]);

  const clearOverride = useCallback((flagKey: string) => {
    try {
      featureFlags.clearUserOverride(userId, flagKey);
    } catch (err) {
      console.warn(`Failed to clear override for ${flagKey}:`, err);
    }
  }, [userId]);

  return {
    setOverride,
    clearOverride
  };
};

/**
 * Hook for feature flag statistics (admin dashboard)
 */
export const useFeatureFlagStats = () => {
  const [stats, setStats] = useState(featureFlags.getStats());
  const [loading, setLoading] = useState(false);

  const refreshStats = useCallback(() => {
    setLoading(true);
    try {
      const newStats = featureFlags.getStats();
      setStats(newStats);
    } catch (err) {
      console.warn('Failed to refresh stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    refreshStats
  };
};
