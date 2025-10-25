/**
 * Workflow AI Assistant Component
 *
 * Provides AI-powered assistance for workflow optimization and creation
 * Integrates with the workflow canvas to provide contextual suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import { CpuChipIcon, PaperAirplaneIcon, UserIcon } from '@heroicons/react/24/outline';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestions?: string[];
    workflowId?: string;
    nodeCount?: number;
  };
}

interface WorkflowAIAssistantProps {
  workflowContext?: {
    nodes: any[];
    edges: any[];
    workflowId: string;
  };
  onSuggestionApply?: (suggestion: any) => void;
  className?: string;
}

export const WorkflowAIAssistant: React.FC<WorkflowAIAssistantProps> = ({
  workflowContext,
  onSuggestionApply,
  className = ''
}) => {
  // Add CSS for animation delays
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .animate-delay-100 { animation-delay: 0.1s; }
      .animate-delay-200 { animation-delay: 0.2s; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'assistant',
        content: "👋 Hi! I'm your AI workflow assistant. I can help you optimize workflows, suggest improvements, and create new workflows from natural language descriptions. What would you like to work on?",
        timestamp: new Date(),
        metadata: {
          suggestions: [
            "Optimize my current workflow",
            "Create a customer onboarding workflow",
            "Add error handling to selected nodes",
            "Suggest performance improvements"
          ]
        }
      }]);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      // Simulate AI response for now
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I understand you want to ${inputValue}. Let me analyze your workflow and provide some suggestions...`,
          timestamp: new Date(),
          metadata: {
            suggestions: [
              "Add error handling nodes",
              "Optimize node connections",
              "Consider adding parallel processing"
            ]
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
        setIsStreaming(false);
      }, 2000);

    } catch (error) {
      console.error('AI Assistant error:', error);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const applySuggestion = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <div className={`workflow-ai-assistant bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <CpuChipIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {workflowContext && (
            <span>{workflowContext.nodes.length} nodes</span>
          )}
          {isStreaming && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {message.type === 'user' ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  <CpuChipIcon className="w-4 h-4" />
                )}
                <span className="text-xs opacity-75">
                  {message.type === 'user' ? 'You' : 'AI Assistant'}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              {message.metadata?.suggestions && (
                <div className="mt-3 space-y-1">
                  {message.metadata.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion(suggestion)}
                      className="block w-full text-left text-xs bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-2 py-1 transition-colors"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animate-delay-100"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce animate-delay-200"></div>
                </div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your workflow..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
            title="Send message"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send • AI-powered workflow assistance
        </div>
      </div>
    </div>
  );
};

export default WorkflowAIAssistant;
