/**
 * Continue.dev Panel Component
 * Provides AI-powered code assistance and generation interface
 */

import React, { useState, useCallback } from 'react';
import { useContinueDev } from '../../hooks/useContinueDev';
import { CodeContext } from '../../services/continueDevService';

interface ContinuePanelProps {
  onCodeGeneration?: (code: string) => void;
  currentFile?: any;
  selectedCode?: string;
  className?: string;
}

interface ConversationItem {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  code?: string;
  actions?: ConversationAction[];
}

interface ConversationAction {
  label: string;
  handler: () => void;
  icon: string;
}

export const ContinuePanel: React.FC<ContinuePanelProps> = ({
  onCodeGeneration,
  currentFile,
  selectedCode,
  className = ''
}) => {
  const continueDev = useContinueDev();
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'suggestions' | 'history'>('chat');

  // Quick action templates
  const quickActions = [
    {
      label: 'Generate Component',
      prompt: 'Create a React component for',
      icon: '⚛️'
    },
    {
      label: 'Add Error Handling',
      prompt: 'Add comprehensive error handling to this code',
      icon: '🛡️'
    },
    {
      label: 'Write Tests',
      prompt: 'Generate unit tests for this function',
      icon: '🧪'
    },
    {
      label: 'Optimize Performance',
      prompt: 'Optimize this code for better performance',
      icon: '⚡'
    },
    {
      label: 'Add Documentation',
      prompt: 'Add JSDoc comments and documentation',
      icon: '📚'
    },
    {
      label: 'Refactor Code',
      prompt: 'Refactor this code to be more maintainable',
      icon: '🔧'
    }
  ];

  // Smart suggestions based on current context
  const getSmartSuggestions = useCallback(() => {
    const suggestions = [];

    if (currentFile) {
      suggestions.push({
        type: 'file',
        title: `Complete ${currentFile.name}`,
        description: 'Generate missing parts of this file',
        prompt: `Complete the implementation of ${currentFile.name}`
      });
    }

    if (selectedCode) {
      suggestions.push({
        type: 'selection',
        title: 'Explain Selected Code',
        description: 'Get detailed explanation of selected code',
        prompt: `Explain what this code does: ${selectedCode}`
      });

      suggestions.push({
        type: 'selection',
        title: 'Improve Selected Code',
        description: 'Get suggestions to improve selected code',
        prompt: `Suggest improvements for this code: ${selectedCode}`
      });
    }

    return suggestions;
  }, [currentFile, selectedCode]);

  const handleSendMessage = useCallback(async () => {
    if (!currentPrompt.trim() || isGenerating) return;

    const userMessage: ConversationItem = {
      id: Date.now().toString(),
      type: 'user',
      content: currentPrompt,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentPrompt('');
    setIsGenerating(true);

    try {
      // Build context for Continue.dev
      const context: CodeContext = {
        files: currentFile ? [currentFile] : [],
        selection: selectedCode ? {
          startLine: 0,
          startColumn: 0,
          endLine: 0,
          endColumn: selectedCode.length
        } : undefined
      };

      // Generate code using Continue.dev
      const generatedCode = await continueDev.generateCode(currentPrompt, context);

      const assistantMessage: ConversationItem = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generatedCode?.explanation || 'Code generated successfully',
        timestamp: new Date(),
        code: generatedCode?.code,
        actions: generatedCode?.code ? [
          {
            label: 'Apply to Editor',
            handler: () => onCodeGeneration?.(generatedCode.code!),
            icon: '📝'
          },
          {
            label: 'Copy Code',
            handler: () => navigator.clipboard.writeText(generatedCode.code!),
            icon: '📋'
          },
          {
            label: 'Create Tests',
            handler: () => handleGenerateTests(generatedCode.code!),
            icon: '🧪'
          }
        ] : undefined
      };

      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ConversationItem = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `Error generating code: ${(error as Error).message}`,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  }, [currentPrompt, isGenerating, currentFile, selectedCode, continueDev, onCodeGeneration]);

  const handleQuickAction = useCallback(async (action: typeof quickActions[0]) => {
    const prompt = selectedCode
      ? `${action.prompt}: ${selectedCode}`
      : `${action.prompt} a ${currentFile?.language || 'JavaScript'} function`;

    setCurrentPrompt(prompt);
    await handleSendMessage();
  }, [selectedCode, currentFile, handleSendMessage]);

  const handleGenerateTests = useCallback(async (code: string) => {
    const testPrompt = `Generate comprehensive unit tests for this code: ${code}`;
    const testCode = await continueDev.generateTests(code, currentFile?.language);

    if (testCode) {
      const testMessage: ConversationItem = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Generated unit tests for your code',
        timestamp: new Date(),
        code: testCode,
        actions: [
          {
            label: 'Create Test File',
            handler: () => onCodeGeneration?.(testCode),
            icon: '📄'
          },
          {
            label: 'Copy Tests',
            handler: () => navigator.clipboard.writeText(testCode),
            icon: '📋'
          }
        ]
      };

      setConversation(prev => [...prev, testMessage]);
    }
  }, [continueDev, currentFile, onCodeGeneration]);

  const handleSuggestionClick = useCallback(async (suggestion: any) => {
    setCurrentPrompt(suggestion.prompt);
    await handleSendMessage();
  }, [handleSendMessage]);

  const renderChatTab = () => (
    <div className="continue-chat">
      {/* Conversation History */}
      <div className="conversation-history flex-1 overflow-auto p-3 space-y-4">
        {conversation.length === 0 ? (
          <div className="empty-chat flex flex-col items-center justify-center p-8 text-center">
            <div className="chat-icon text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-200 mb-2">
              AI Code Assistant Ready
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Ask me to generate code, explain concepts, or help with development tasks
            </p>
            <div className="quick-examples text-xs text-gray-500">
              Try: "Create a React component for user authentication" or "Explain async/await"
            </div>
          </div>
        ) : (
          conversation.map((item) => (
            <div
              key={item.id}
              className={`message-item flex ${
                item.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`message-content max-w-xs lg:max-w-md p-3 rounded-lg ${
                  item.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <div className="message-text text-sm mb-2">
                  {item.content}
                </div>

                {item.code && (
                  <div className="message-code mb-3">
                    <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                      <code>{item.code}</code>
                    </pre>
                  </div>
                )}

                {item.actions && (
                  <div className="message-actions flex flex-wrap gap-1">
                    {item.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.handler}
                        className="action-btn flex items-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                      >
                        <span>{action.icon}</span>
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="message-timestamp text-xs opacity-75 mt-1">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div className="generating-indicator flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-300">Generating code...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chat-input-area p-3 border-t border-gray-700">
        <div className="input-container flex space-x-2">
          <input
            type="text"
            value={currentPrompt}
            onChange={(e) => setCurrentPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask me to generate code, explain concepts, or help with development..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
            disabled={isGenerating}
          />
          <button
            onClick={handleSendMessage}
            disabled={!currentPrompt.trim() || isGenerating}
            className="send-btn bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium"
          >
            {isGenerating ? '⏳' : '🚀'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions flex flex-wrap gap-1 mt-2">
          {quickActions.slice(0, 4).map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action)}
              className="quick-action-btn flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              disabled={isGenerating}
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSuggestionsTab = () => {
    const suggestions = getSmartSuggestions();

    return (
      <div className="continue-suggestions">
        <div className="suggestions-header p-3 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-200">Smart Suggestions</h3>
          <p className="text-xs text-gray-400 mt-1">
            AI-powered suggestions based on your current context
          </p>
        </div>

        <div className="suggestions-list p-3 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="suggestion-title text-sm font-medium text-gray-200 mb-1">
                {suggestion.title}
              </div>
              <div className="suggestion-description text-xs text-gray-400">
                {suggestion.description}
              </div>
            </div>
          ))}

          {suggestions.length === 0 && (
            <div className="no-suggestions text-center p-8">
              <div className="text-2xl mb-2">💭</div>
              <div className="text-sm text-gray-400">
                No suggestions available for current context
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="continue-history">
      <div className="history-header p-3 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-200">Conversation History</h3>
        <p className="text-xs text-gray-400 mt-1">
          Previous AI interactions and generated code
        </p>
      </div>

      <div className="history-list p-3 space-y-2">
        {conversation.length === 0 ? (
          <div className="no-history text-center p-8">
            <div className="text-2xl mb-2">📜</div>
            <div className="text-sm text-gray-400">
              No conversation history yet
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Start chatting to see your history here
            </div>
          </div>
        ) : (
          conversation
            .filter(item => item.code) // Only show items with generated code
            .map((item) => (
              <div key={item.id} className="history-item p-3 bg-gray-700 rounded">
                <div className="history-prompt text-sm text-gray-200 mb-2">
                  {item.content}
                </div>
                <div className="history-code text-xs bg-gray-800 p-2 rounded mb-2 overflow-hidden">
                  <code>{item.code?.substring(0, 100)}...</code>
                </div>
                <div className="history-meta flex items-center justify-between text-xs text-gray-400">
                  <span>{item.timestamp.toLocaleDateString()}</span>
                  <button
                    onClick={() => onCodeGeneration?.(item.code!)}
                    className="reuse-btn text-blue-400 hover:text-blue-300"
                  >
                    Reuse
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  return (
    <div className={`continue-panel bg-gray-800 text-white ${className}`}>
      {/* Header */}
      <div className="continue-header p-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-200">AI Assistant</h3>
          <div className="status-indicator flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              continueDev.isConfigured ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-400">
              {continueDev.isConfigured ? 'Ready' : 'Not Configured'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="continue-tabs flex space-x-1">
          {[
            { id: 'chat', label: 'Chat', icon: '💬' },
            { id: 'suggestions', label: 'Suggestions', icon: '💡' },
            { id: 'history', label: 'History', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-btn flex items-center space-x-1 px-3 py-1 rounded text-xs ${
                activeTab === tab.id ? 'bg-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="continue-content flex-1 overflow-hidden">
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'suggestions' && renderSuggestionsTab()}
        {activeTab === 'history' && renderHistoryTab()}
      </div>
    </div>
  );
};
