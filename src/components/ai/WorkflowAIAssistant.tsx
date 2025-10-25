/**
 * Workflow AI Assistant Component
 * 
 * Provides AI-powered assistance for workflow optimization and creation
 * Integrates with the workflow canvas to provide contextual suggestions
 */

import React, { useState, useEffect, useRef } from 'react';
import { aiSDKService } from '../../services/aiSDKService.js';

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
      // Prepare context for AI
      const context = {
        workflowId: workflowContext?.workflowId,
        nodeCount: workflowContext?.nodes.length || 0,
        edgeCount: workflowContext?.edges.length || 0,
        currentNodes: workflowContext?.nodes.map(n => ({ type: n.type, id: n.id })) || []
      };

      // Create system message with workflow context
      const systemMessage = {
        role: 'system' as const,
        content: `You are an expert workflow optimization assistant. You help users improve their workflows, suggest optimizations, and create new workflows. 
        
        Current workflow context: ${JSON.stringify(context)}
        
        Provide helpful, actionable suggestions. If optimizing a workflow, be specific about which nodes or connections to modify. If creating a workflow, provide a clear step-by-step structure.`
      };

      const userChatMessage = {
        role: 'user' as const,
        content: inputValue
      };

      // Generate streaming response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      let fullResponse = '';
      
      for await (const chunk of aiSDKService.generateChatResponse([systemMessage, userChatMessage], context)) {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      }

      // Analyze response for actionable suggestions
      const suggestions = extractSuggestions(fullResponse);
      if (suggestions.length > 0) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, metadata: { suggestions } }
            : msg
        ));
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ Sorry, I encountered an error processing your request. Please try again or check your AI provider settings.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const extractSuggestions = (content: string): string[] => {
    // Simple extraction of actionable suggestions from AI response
    const suggestions: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('suggest') || line.includes('recommend') || line.includes('add') || line.includes('optimize')) {
        const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          suggestions.push(cleaned);
        }
      }
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleApplySuggestion = (suggestion: string) => {
    if (onSuggestionApply) {
      onSuggestionApply({ type: 'suggestion', content: suggestion });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-600">Workflow optimization and creation</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isStreaming && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Suggestions */}
              {message.metadata?.suggestions && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-gray-600">Quick suggestions:</div>
                  {message.metadata.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex space-x-2">
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex-1 text-left px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                      <button
                        onClick={() => handleApplySuggestion(suggestion)}
                        className="px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        title="Apply suggestion"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about workflow optimization, creation, or improvement..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowAIAssistant;
