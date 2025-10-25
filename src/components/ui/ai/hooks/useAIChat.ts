/**
 * AI Chat Hook
 * Provides chat functionality with streaming support and tool calling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AIMessage, AIChatProps, Tool, UseAIChatReturn } from '../types';

export const useAIChat = (props: AIChatProps = {}): UseAIChatReturn => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tools, setTools] = useState<Tool[]>(props.tools || []);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Default configuration
  const config = {
    apiEndpoint: props.apiEndpoint || '/api/ai/chat',
    model: props.model || 'gpt-4',
    temperature: props.temperature || 0.7,
    maxTokens: props.maxTokens || 1000,
    systemPrompt: props.systemPrompt || 'You are a helpful AI assistant.',
    enableStreaming: props.enableStreaming ?? true,
    ...props
  };

  // Add tool to the tools list
  const addTool = useCallback((tool: Tool) => {
    setTools(prev => [...prev, tool]);
  }, []);

  // Remove tool from the tools list
  const removeTool = useCallback((toolName: string) => {
    setTools(prev => prev.filter(tool => tool.name !== toolName));
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    setError(null);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare request payload
      const payload = {
        messages: [
          // Add system prompt if provided
          ...(config.systemPrompt ? [{
            role: 'system' as const,
            content: config.systemPrompt
          }] : []),
          // Add conversation history (last 10 messages to avoid token limits)
          ...messages.slice(-10),
          userMessage
        ].map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.enableStreaming,
        tools: tools.length > 0 ? tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
          }
        })) : undefined
      };

      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (config.enableStreaming) {
        await handleStreamingResponse(response);
      } else {
        await handleRegularResponse(response);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      const errorMessage = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorMessage);
      props.onError?.(errorMessage);

      // Add error message to chat
      const errorResponse: AIMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage.message}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, tools, config, props.onError]);

  // Handle streaming response
  const handleStreamingResponse = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let assistantMessage: AIMessage | null = null;
    let toolCalls: any[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta) {
                // Initialize assistant message
                if (!assistantMessage) {
                  assistantMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                    toolCalls: []
                  };
                }

                // Handle content
                if (delta.content) {
                  assistantMessage.content += delta.content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.id === assistantMessage!.id) {
                      lastMessage.content = assistantMessage!.content;
                    } else {
                      newMessages.push({ ...assistantMessage! });
                    }
                    return newMessages;
                  });
                }

                // Handle tool calls
                if (delta.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    if (toolCall.function) {
                      const toolCallData = {
                        id: toolCall.id,
                        name: toolCall.function.name,
                        arguments: JSON.parse(toolCall.function.arguments || '{}'),
                        status: 'pending' as const
                      };

                      toolCalls.push(toolCallData);
                      props.onToolCall?.(toolCallData);
                    }
                  }
                }
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Finalize assistant message with tool calls
      if (assistantMessage) {
        assistantMessage.toolCalls = toolCalls;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage?.id === assistantMessage!.id) {
            lastMessage.toolCalls = toolCalls;
          }
          return newMessages;
        });
      }

    } finally {
      reader.releaseLock();
    }
  };

  // Handle regular (non-streaming) response
  const handleRegularResponse = async (response: Response) => {
    const data = await response.json();
    const assistantContent = data.choices?.[0]?.message?.content || 'No response';
    const toolCalls = data.choices?.[0]?.message?.tool_calls || [];

    const assistantMessage: AIMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: Date.now(),
      toolCalls: toolCalls.map((call: any) => ({
        id: call.id,
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments || '{}'),
        status: 'pending' as const
      }))
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Handle tool calls
    for (const toolCall of toolCalls) {
      props.onToolCall?.({
        id: toolCall.id,
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments || '{}'),
        status: 'pending'
      });
    }
  };

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // Remove messages after the last user message
      const lastUserIndex = messages.lastIndexOf(lastUserMessage);
      setMessages(prev => prev.slice(0, lastUserIndex + 1));
      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    addTool,
    removeTool
  };
};
