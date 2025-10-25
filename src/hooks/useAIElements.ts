/**
 * AI Elements Hook
 * React hook for AI-powered UI components and interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAIChat } from '../components/ui/ai/hooks/useAIChat';
import { AIMessage, AIChatProps, ToolCall } from '../components/ui/ai/types';

export interface UseAIElementsReturn {
  // Chat functionality
  messages: AIMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;

  // Streaming support
  isStreaming: boolean;
  streamingContent: string;
  stopStreaming: () => void;

  // Tool calling
  toolCalls: ToolCall[];
  onToolCall: (toolName: string, args: any) => void;

  // UI state
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  chatPosition: { x: number; y: number };
  setChatPosition: (position: { x: number; y: number }) => void;

  // AI suggestions
  suggestions: string[];
  generateSuggestions: (context: string) => Promise<void>;

  // Auto-complete
  autoComplete: (text: string, cursorPosition: number) => Promise<string[]>;
}

/**
 * Main AI Elements hook
 * Provides comprehensive AI-powered UI functionality
 */
export const useAIElements = (config: AIChatProps = {}): UseAIElementsReturn => {
  const [showChat, setShowChat] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 20, y: 20 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  // AI Chat functionality
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addTool,
    removeTool
  } = useAIChat(config);

  // Streaming state (would be part of the AI chat hook in real implementation)
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Handle tool calls
  const handleToolCall = useCallback((toolCall: ToolCall) => {
    setToolCalls(prev => [...prev, toolCall]);
    // Here you would execute the tool and handle the result
    console.log('Tool call:', toolCall);
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  // Generate AI suggestions based on context
  const generateSuggestions = useCallback(async (context: string) => {
    try {
      setIsStreaming(true);
      // This would call an AI service to generate suggestions
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, type: 'workflow_suggestions' })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  // Auto-complete functionality
  const autoComplete = useCallback(async (text: string, cursorPosition: number): Promise<string[]> => {
    try {
      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          cursorPosition,
          context: 'code' // or 'workflow', 'query', etc.
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.suggestions || [];
      }
    } catch (error) {
      console.error('Auto-complete failed:', error);
    }

    return [];
  }, []);

  // Enhanced send message with tool calling support
  const enhancedSendMessage = useCallback(async (message: string) => {
    // Clear previous tool calls
    setToolCalls([]);

    // Add common workflow tools
    addTool({
      name: 'create_workflow_node',
      description: 'Create a new workflow node',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['ai', 'human', 'condition', 'action'] },
          name: { type: 'string' },
          config: { type: 'object' }
        },
        required: ['type', 'name']
      },
      handler: async (args) => {
        // This would integrate with your workflow system
        console.log('Creating workflow node:', args);
        return { success: true, nodeId: `node_${Date.now()}` };
      }
    });

    await sendMessage(message);
  }, [sendMessage, addTool]);

  return {
    // Chat functionality
    messages,
    isLoading,
    error,
    sendMessage: enhancedSendMessage,
    clearMessages,

    // Streaming support
    isStreaming,
    streamingContent,
    stopStreaming,

    // Tool calling
    toolCalls,
    onToolCall: handleToolCall,

    // UI state
    showChat,
    setShowChat,
    chatPosition,
    setChatPosition,

    // AI suggestions
    suggestions,
    generateSuggestions,

    // Auto-complete
    autoComplete
  };
};

/**
 * Hook for AI-powered code completion
 */
export const useAICodeCompletion = (language: string = 'typescript') => {
  const [completions, setCompletions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getCompletions = useCallback(async (
    code: string,
    cursorPosition: number,
    context?: Record<string, any>
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/code-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          cursorPosition,
          language,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCompletions(data.completions || []);
      }
    } catch (error) {
      console.error('Code completion failed:', error);
      setCompletions([]);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  return {
    completions,
    isLoading,
    getCompletions,
    clearCompletions: useCallback(() => setCompletions([]), [])
  };
};

/**
 * Hook for AI-powered workflow suggestions
 */
export const useAIWorkflowSuggestions = (workflowId?: string) => {
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'node' | 'connection' | 'optimization';
    title: string;
    description: string;
    confidence: number;
    action: () => void;
  }>>([]);

  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/workflow-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          context: 'workflow_builder'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Workflow suggestions failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [workflowId]);

  return {
    suggestions,
    isLoading,
    generateSuggestions,
    clearSuggestions: useCallback(() => setSuggestions([]), [])
  };
};

/**
 * Hook for AI-powered error analysis
 */
export const useAIErrorAnalysis = () => {
  const [analysis, setAnalysis] = useState<{
    error: string;
    analysis: string;
    suggestions: Array<{
      type: 'fix' | 'investigation' | 'prevention';
      title: string;
      description: string;
      code?: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    confidence: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const analyzeError = useCallback(async (errorMessage: string, context?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/error-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: errorMessage,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (error) {
      console.error('Error analysis failed:', error);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analysis,
    isLoading,
    analyzeError,
    clearAnalysis: useCallback(() => setAnalysis(null), [])
  };
};

/**
 * Hook for AI-powered content generation
 */
export const useAIContentGeneration = (contentType: 'documentation' | 'comments' | 'tests' = 'documentation') => {
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const generateContent = useCallback(async (
    input: string,
    context?: Record<string, any>
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/content-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          type: contentType,
          context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.content || '');
      }
    } catch (error) {
      console.error('Content generation failed:', error);
      setGeneratedContent('');
    } finally {
      setIsLoading(false);
    }
  }, [contentType]);

  return {
    generatedContent,
    isLoading,
    generateContent,
    clearContent: useCallback(() => setGeneratedContent(''), [])
  };
};
