/**
 * AI Components Types
 * TypeScript definitions for AI chat interface and related components
 */

import { Message } from 'ai';

// Base AI Message Interface
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
}

// Tool Call Interface
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// AI Chat Props
export interface AIChatProps {
  apiEndpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: Tool[];
  onError?: (error: Error) => void;
  onToolCall?: (toolCall: ToolCall) => void;
  enableStreaming?: boolean;
}

// Tool Definition
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any) => Promise<any>;
}

// Streaming Message Interface
export interface StreamingMessage extends AIMessage {
  isStreaming: boolean;
  streamingContent: string;
}

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  apiKey: string;
  baseURL?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

// Workflow AI Integration
export interface WorkflowAIIntegration {
  workflowId: string;
  aiEnabled: boolean;
  aiModel: string;
  aiPrompts: Record<string, string>;
  aiTools: Tool[];
  aiContext: Record<string, any>;
}

// Error Analysis AI
export interface ErrorAnalysisAI {
  errorId: string;
  analysis: string;
  suggestions: string[];
  confidence: number;
  timestamp: number;
}

// Code Generation AI
export interface CodeGenerationAI {
  prompt: string;
  language: string;
  framework?: string;
  generatedCode: string;
  explanation: string;
  timestamp: number;
}

// AI Response Types
export type AIResponseType =
  | 'text'
  | 'code'
  | 'json'
  | 'markdown'
  | 'tool_call'
  | 'error';

// Enhanced AI Response
export interface EnhancedAIResponse {
  type: AIResponseType;
  content: string;
  metadata: {
    model: string;
    tokens: number;
    latency: number;
    confidence?: number;
  };
  suggestions?: string[];
  relatedContent?: any[];
}

// AI Context Interface
export interface AIContext {
  userId?: string;
  sessionId: string;
  conversationId: string;
  workflowContext?: Record<string, any>;
  userPreferences?: Record<string, any>;
  previousInteractions?: AIMessage[];
}

// AI Analytics Interface
export interface AIAnalytics {
  totalInteractions: number;
  averageResponseTime: number;
  successRate: number;
  popularTools: string[];
  userSatisfaction: number;
  errorRate: number;
  timestamp: number;
}

// AI Hook Return Type
export interface UseAIChatReturn {
  messages: AIMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  addTool: (tool: Tool) => void;
  removeTool: (toolName: string) => void;
}

// AI Streaming Hook
export interface UseAIStreamingReturn extends UseAIChatReturn {
  isStreaming: boolean;
  streamingContent: string;
  stopStreaming: () => void;
}

// AI Provider Interface
export interface AIProvider {
  name: string;
  models: string[];
  capabilities: string[];
  maxTokens: number;
  pricing: {
    input: number;
    output: number;
  };
  isAvailable: boolean;
}

// AI Model Configuration
export interface AIModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsTools: boolean;
  supportsStreaming: boolean;
  pricing: {
    inputPerToken: number;
    outputPerToken: number;
  };
}

// AI Integration Status
export interface AIIntegrationStatus {
  isConnected: boolean;
  lastHealthCheck: number;
  modelsAvailable: AIModelConfig[];
  currentModel: string;
  rateLimitRemaining: number;
  errorCount: number;
}

// Export all types
export type {
  Message,
  ToolCall,
  AIChatProps,
  Tool,
  StreamingMessage,
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
};
