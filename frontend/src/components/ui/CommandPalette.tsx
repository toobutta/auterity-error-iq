/**
 * UNIVERSAL COMMAND PALETTE + COPILOT
 *
 * Global command interface with AI assistance and multimodal input support
 * Implements 2025 UX trends: conversational UI, universal command palette, multimodal input
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  CodeBracketIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Command palette action types
interface CommandAction {
  id: string;
  type: 'navigation' | 'action' | 'ai_query' | 'create' | 'search';
  title: string;
  description: string;
  shortcut?: string[];
  category: string;
  icon: React.ReactNode;
  handler: (context?: any) => void | Promise<void>;
  keywords: string[];
  confidence?: number;
  preview?: string;
}

// AI suggestion result
interface AISuggestion {
  id: string;
  type: 'command' | 'query' | 'action';
  title: string;
  description: string;
  confidence: number;
  action: () => void | Promise<void>;
  category: string;
}

// Voice recognition state
interface VoiceState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: {
    page: string;
    workflowId?: string;
    nodeId?: string;
    selectedItems?: string[];
  };
  onAction?: (action: CommandAction) => void;
  className?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentContext = { page: 'dashboard' },
  onAction,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    transcript: '',
    error: null
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true, error: null }));
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');

        setVoiceState(prev => ({ ...prev, transcript }));
        setQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: event.error
        }));
      };

      recognitionRef.current.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Generate command actions based on context
  const getCommandActions = useCallback((): CommandAction[] => {
    const actions: CommandAction[] = [
      // Navigation commands
      {
        id: 'nav-dashboard',
        type: 'navigation',
        title: 'Go to Dashboard',
        description: 'Navigate to the main dashboard',
        shortcut: ['g', 'd'],
        category: 'Navigation',
        icon: <DocumentIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/dashboard',
        keywords: ['dashboard', 'home', 'main']
      },
      {
        id: 'nav-workflows',
        type: 'navigation',
        title: 'Go to Workflows',
        description: 'Browse and manage workflows',
        shortcut: ['g', 'w'],
        category: 'Navigation',
        icon: <CloudArrowUpIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/workflows',
        keywords: ['workflows', 'workflow', 'automation']
      },
      {
        id: 'nav-templates',
        type: 'navigation',
        title: 'Browse Templates',
        description: 'Explore workflow templates',
        shortcut: ['g', 't'],
        category: 'Navigation',
        icon: <CodeBracketIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/templates',
        keywords: ['templates', 'template', 'examples']
      },

      // Action commands
      {
        id: 'create-workflow',
        type: 'create',
        title: 'Create New Workflow',
        description: 'Start building a new workflow',
        shortcut: ['c', 'w'],
        category: 'Actions',
        icon: <CheckCircleIcon className="w-4 h-4" />,
        handler: () => {
          // Handle workflow creation
        },
        keywords: ['create', 'new', 'workflow', 'build']
      },
      {
        id: 'import-workflow',
        type: 'action',
        title: 'Import Workflow',
        description: 'Import workflow from file or URL',
        shortcut: ['i', 'w'],
        category: 'Actions',
        icon: <CloudArrowUpIcon className="w-4 h-4" />,
        handler: () => {
          // Handle workflow import
        },
        keywords: ['import', 'upload', 'load']
      },

      // AI commands
      {
        id: 'ai-assist',
        type: 'ai_query',
        title: 'AI Assistant',
        description: 'Get help from AI assistant',
        shortcut: ['a', 'i'],
        category: 'AI',
        icon: <CpuChipIcon className="w-4 h-4" />,
        handler: () => {
          // Handle AI assistance
        },
        keywords: ['ai', 'assistant', 'help', 'support']
      }
    ];

    // Filter actions based on query
    if (query.trim()) {
      return actions.filter(action =>
        action.title.toLowerCase().includes(query.toLowerCase()) ||
        action.description.toLowerCase().includes(query.toLowerCase()) ||
        action.keywords.some(keyword =>
          keyword.toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    return actions;
  }, [query]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    if (voiceState.isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [voiceState.isListening]);

  // Handle command execution
  const executeCommand = useCallback(async (action: CommandAction) => {
    setIsProcessing(true);
    try {
      await action.handler(currentContext);
      onAction?.(action);
      onClose();
      setQuery('');
    } catch (error) {
      console.error('Command execution failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentContext, onAction, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const actions = getCommandActions();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < actions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (actions[selectedIndex]) {
          executeCommand(actions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        setQuery('');
        setSelectedIndex(0);
        break;
    }
  }, [getCommandActions, selectedIndex, executeCommand, onClose]);

  const actions = getCommandActions();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center pt-20 ${className}`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder-gray-500"
            />

            {/* Voice input button */}
            {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
              <button
                onClick={handleVoiceInput}
                className={`ml-3 p-2 rounded-md transition-colors ${
                  voiceState.isListening
                    ? 'bg-red-100 text-red-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={voiceState.isListening ? 'Stop listening' : 'Start voice input'}
              >
                <MicrophoneIcon className="w-4 h-4" />
              </button>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close command palette"
              title="Close command palette"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {actions.length > 0 ? (
              <div className="py-2">
                {actions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => executeCommand(action)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 text-gray-400">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {action.description}
                      </div>
                    </div>
                    {action.shortcut && (
                      <div className="flex-shrink-0 flex space-x-1">
                        {action.shortcut.map((key, i) => (
                          <kbd
                            key={i}
                            className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded"
                          >
                            {key.toUpperCase()}
                          </kbd>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <CpuChipIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No commands found</p>
                <p className="text-sm">Try searching for something else</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>↑↓ Navigate • Enter Select • Esc Close</span>
              {voiceState.transcript && (
                <span className="text-blue-600">
                  🎤 {voiceState.transcript}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
