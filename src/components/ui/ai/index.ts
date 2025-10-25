/**
 * AI Components Exports
 * Unified exports for AI-related UI components
 */

// Main Components
export { AIChatInterface } from './AIChatInterface';

// Hooks
export { useAIChat } from './hooks/useAIChat';

// Types
export type {
  AIMessage,
  AIChatProps,
  Tool,
  ToolCall,
  AIServiceConfig,
  WorkflowAIIntegration,
  ErrorAnalysisAI,
  CodeGenerationAI,
  AIResponseType,
  EnhancedAIResponse,
  AIContext,
  AIAnalytics,
  UseAIChatReturn,
  UseAIStreamingReturn,
  AIProvider,
  AIModelConfig,
  AIIntegrationStatus
} from './types';

// Re-export from ai package for convenience
export type { Message } from 'ai';
