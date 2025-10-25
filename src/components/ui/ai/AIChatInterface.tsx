/**
 * AI Chat Interface Component
 * Provides streaming AI chat capabilities with tool calling support
 * Integrates with existing AI SDK and workflow studio
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAIChat } from './hooks/useAIChat';
import { AIMessage, AIChatProps } from './types';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { ErrorBoundary } from '../../ErrorBoundary';

interface AIChatInterfaceProps extends AIChatProps {
  className?: string;
  showToolCalls?: boolean;
  maxHeight?: string;
  onMessageSent?: (message: string) => void;
  onToolCall?: (toolName: string, args: any) => void;
}

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  className = '',
  showToolCalls = true,
  maxHeight = '600px',
  onMessageSent,
  onToolCall,
  ...aiProps
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage
  } = useAIChat(aiProps);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue('');
    onMessageSent?.(message);

    try {
      await sendMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <ErrorBoundary>
      <div className={`ai-chat-interface ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearMessages}
              className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              disabled={isLoading}
            >
              Clear
            </button>
            {error && (
              <button
                onClick={retryLastMessage}
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {/* Messages Container */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ maxHeight, minHeight: '200px' }}
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <p className="text-lg font-medium">How can I help you today?</p>
                <p className="text-sm mt-2">Ask me anything about your workflows, errors, or code.</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                showToolCalls={showToolCalls}
                onToolCall={onToolCall}
              />
            ))
          )}

          {isLoading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <LoadingSpinner size="sm" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800 text-sm">{error.message}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span>Send</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: AIMessage;
  showToolCalls: boolean;
  onToolCall?: (toolName: string, args: any) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showToolCalls,
  onToolCall
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* Tool Calls */}
        {showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.toolCalls.map((toolCall, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  isUser
                    ? 'bg-blue-700 text-blue-100'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <div className="font-medium">🔧 {toolCall.name}</div>
                <div className="mt-1 opacity-75">
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 opacity-70 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default AIChatInterface;
