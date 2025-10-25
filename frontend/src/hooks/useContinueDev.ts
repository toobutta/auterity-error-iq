/**
 * React Hook for Continue.dev Integration
 * Provides easy access to AI-powered code generation and analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { ContinueDevService, GeneratedCode, CompletionItem, CodeAnalysis, CodeContext } from '../services/continueDevService';

let continueServiceInstance: ContinueDevService | null = null;

export const useContinueDev = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Initialize service on mount
  useEffect(() => {
    if (!continueServiceInstance) {
      continueServiceInstance = new ContinueDevService();
    }
    setIsConfigured(continueServiceInstance.isConfigured());
  }, []);

  // Generate code using Continue.dev
  const generateCode = useCallback(async (
    prompt: string,
    context?: CodeContext
  ): Promise<GeneratedCode | null> => {
    if (!continueServiceInstance || !isConfigured) {
      setError('Continue.dev service not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await continueServiceInstance.generateCode(prompt, context);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code generation failed';
      setError(errorMessage);
      console.error('Continue.dev code generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Get code completions
  const getCompletions = useCallback(async (context: {
    code: string;
    position: { lineNumber: number; column: number };
    language: string;
  }): Promise<CompletionItem[]> => {
    if (!continueServiceInstance || !isConfigured) {
      return [];
    }

    try {
      return await continueServiceInstance.getCompletions(context);
    } catch (err) {
      console.error('Continue.dev completions error:', err);
      return [];
    }
  }, [isConfigured]);

  // Analyze code
  const analyzeCode = useCallback(async (
    code: string,
    language?: string
  ): Promise<CodeAnalysis | null> => {
    if (!continueServiceInstance || !isConfigured) {
      setError('Continue.dev service not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await continueServiceInstance.analyzeCode(code, language);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Code analysis failed';
      setError(errorMessage);
      console.error('Continue.dev analysis error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Generate tests
  const generateTests = useCallback(async (
    code: string,
    language?: string
  ): Promise<string | null> => {
    if (!continueServiceInstance || !isConfigured) {
      setError('Continue.dev service not configured');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await continueServiceInstance.generateTests(code, language);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test generation failed';
      setError(errorMessage);
      console.error('Continue.dev test generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured]);

  // Get service status
  const getServiceStatus = useCallback(() => {
    return {
      isConfigured,
      isLoading,
      error,
      service: continueServiceInstance
    };
  }, [isConfigured, isLoading, error]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Core functionality
    generateCode,
    getCompletions,
    analyzeCode,
    generateTests,

    // Status and state
    isLoading,
    error,
    isConfigured,
    getServiceStatus,

    // Utilities
    clearError
  };
};
