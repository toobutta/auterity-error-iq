/**
 * Analytics Hook
 * React hook for tracking user interactions and events
 */

import { useCallback, useEffect, useRef } from 'react';
import { analytics } from '../services/analytics';
import { AnalyticsUser } from '../types/analytics';

export interface UseAnalyticsReturn {
  track: (event: string, properties?: Record<string, any>) => void;
  trackPageView: (path?: string) => void;
  trackInteraction: (element: string, action: string, properties?: Record<string, any>) => void;
  trackWorkflow: (workflowId: string, action: string, properties?: Record<string, any>) => void;
  trackAI: (model: string, tokens: number, latency: number, success: boolean) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  trackPerformance: (metric: string, value: number, properties?: Record<string, any>) => void;
  setUser: (user: AnalyticsUser) => void;
}

/**
 * Main analytics hook
 * Provides methods for tracking various user interactions
 */
export const useAnalytics = (): UseAnalyticsReturn => {
  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView();
  }, []);

  const track = useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, []);

  const trackPageView = useCallback((path?: string) => {
    analytics.trackPageView(path);
  }, []);

  const trackInteraction = useCallback((
    element: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackInteraction(element, action, properties);
  }, []);

  const trackWorkflow = useCallback((
    workflowId: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    analytics.trackWorkflow(workflowId, action, properties);
  }, []);

  const trackAI = useCallback((
    model: string,
    tokens: number,
    latency: number,
    success: boolean
  ) => {
    analytics.trackAIInteraction(model, tokens, latency, success);
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context);
  }, []);

  const trackPerformance = useCallback((
    metric: string,
    value: number,
    properties?: Record<string, any>
  ) => {
    analytics.trackPerformance(metric, value, properties);
  }, []);

  const setUser = useCallback((user: AnalyticsUser) => {
    analytics.setUser(user);
  }, []);

  return {
    track,
    trackPageView,
    trackInteraction,
    trackWorkflow,
    trackAI,
    trackError,
    trackPerformance,
    setUser
  };
};

/**
 * Hook for tracking component interactions
 * Automatically tracks mount/unmount and user interactions
 */
export const useComponentAnalytics = (componentName: string, props?: Record<string, any>) => {
  const { trackInteraction } = useAnalytics();
  const mountTime = useRef<number>(Date.now());

  // Track component mount
  useEffect(() => {
    trackInteraction(componentName, 'mount', {
      ...props,
      timestamp: mountTime.current
    });

    // Track component unmount
    return () => {
      const duration = Date.now() - mountTime.current;
      trackInteraction(componentName, 'unmount', {
        ...props,
        duration
      });
    };
  }, [componentName, props, trackInteraction]);

  // Track custom interactions
  const trackClick = useCallback((element?: string, properties?: Record<string, any>) => {
    trackInteraction(
      element || componentName,
      'click',
      { component: componentName, ...properties }
    );
  }, [componentName, trackInteraction]);

  const trackHover = useCallback((element?: string, properties?: Record<string, any>) => {
    trackInteraction(
      element || componentName,
      'hover',
      { component: componentName, ...properties }
    );
  }, [componentName, trackInteraction]);

  const trackFocus = useCallback((element?: string, properties?: Record<string, any>) => {
    trackInteraction(
      element || componentName,
      'focus',
      { component: componentName, ...properties }
    );
  }, [componentName, trackInteraction]);

  return {
    trackClick,
    trackHover,
    trackFocus
  };
};

/**
 * Hook for tracking form interactions
 */
export const useFormAnalytics = (formName: string) => {
  const { trackInteraction } = useAnalytics();

  const trackFormStart = useCallback((properties?: Record<string, any>) => {
    trackInteraction(formName, 'form_start', properties);
  }, [formName, trackInteraction]);

  const trackFormSubmit = useCallback((success: boolean, properties?: Record<string, any>) => {
    trackInteraction(formName, 'form_submit', {
      success,
      ...properties
    });
  }, [formName, trackInteraction]);

  const trackFormError = useCallback((error: string, properties?: Record<string, any>) => {
    trackInteraction(formName, 'form_error', {
      error,
      ...properties
    });
  }, [formName, trackInteraction]);

  const trackFieldFocus = useCallback((fieldName: string, properties?: Record<string, any>) => {
    trackInteraction(`${formName}_${fieldName}`, 'field_focus', properties);
  }, [formName, trackInteraction]);

  const trackFieldBlur = useCallback((fieldName: string, properties?: Record<string, any>) => {
    trackInteraction(`${formName}_${fieldName}`, 'field_blur', properties);
  }, [formName, trackInteraction]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFieldFocus,
    trackFieldBlur
  };
};

/**
 * Hook for tracking workflow analytics
 */
export const useWorkflowAnalytics = (workflowId: string) => {
  const { trackWorkflow } = useAnalytics();

  const trackWorkflowStart = useCallback((properties?: Record<string, any>) => {
    trackWorkflow(workflowId, 'start', properties);
  }, [workflowId, trackWorkflow]);

  const trackWorkflowComplete = useCallback((success: boolean, duration: number, properties?: Record<string, any>) => {
    trackWorkflow(workflowId, 'complete', {
      success,
      duration,
      ...properties
    });
  }, [workflowId, trackWorkflow]);

  const trackWorkflowError = useCallback((error: string, properties?: Record<string, any>) => {
    trackWorkflow(workflowId, 'error', {
      error,
      ...properties
    });
  }, [workflowId, trackWorkflow]);

  const trackNodeExecute = useCallback((nodeId: string, nodeType: string, properties?: Record<string, any>) => {
    trackWorkflow(workflowId, 'node_execute', {
      nodeId,
      nodeType,
      ...properties
    });
  }, [workflowId, trackWorkflow]);

  const trackWorkflowSave = useCallback((properties?: Record<string, any>) => {
    trackWorkflow(workflowId, 'save', properties);
  }, [workflowId, trackWorkflow]);

  return {
    trackWorkflowStart,
    trackWorkflowComplete,
    trackWorkflowError,
    trackNodeExecute,
    trackWorkflowSave
  };
};

/**
 * Hook for tracking AI interactions
 */
export const useAIAnalytics = () => {
  const { trackAI } = useAnalytics();

  const trackAIRequest = useCallback((
    model: string,
    promptLength: number,
    context?: Record<string, any>
  ) => {
    trackAI(model, promptLength, 0, true); // We'll update latency when response comes back
  }, [trackAI]);

  const trackAIResponse = useCallback((
    model: string,
    tokens: number,
    latency: number,
    success: boolean,
    error?: string
  ) => {
    trackAI(model, tokens, latency, success);

    if (!success && error) {
      // Also track as an error
      analytics.trackError(new Error(`AI Error: ${error}`), {
        model,
        tokens,
        latency
      });
    }
  }, [trackAI]);

  return {
    trackAIRequest,
    trackAIResponse
  };
};

/**
 * Hook for tracking performance metrics
 */
export const usePerformanceAnalytics = () => {
  const { trackPerformance } = useAnalytics();

  const trackRenderTime = useCallback((component: string, time: number) => {
    trackPerformance('component_render', time, { component });
  }, [trackPerformance]);

  const trackAPITime = useCallback((endpoint: string, method: string, time: number, status: number) => {
    trackPerformance('api_call', time, {
      endpoint,
      method,
      status,
      statusCategory: status >= 200 && status < 300 ? 'success' : 'error'
    });
  }, [trackPerformance]);

  const trackUserTiming = useCallback((name: string, time: number, properties?: Record<string, any>) => {
    trackPerformance(`user_timing_${name}`, time, properties);
  }, [trackPerformance]);

  return {
    trackRenderTime,
    trackAPITime,
    trackUserTiming
  };
};
