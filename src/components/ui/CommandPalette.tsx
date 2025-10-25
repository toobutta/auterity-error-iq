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
import { getConfidenceIcon } from '../../utils/professionalIcons';

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
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setVoiceState(prev => ({
          ...prev,
          transcript: finalTranscript || interimTranscript
        }));

        if (finalTranscript) {
          setQuery(finalTranscript);
          setVoiceState(prev => ({ ...prev, isListening: false }));
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: `Voice recognition error: ${event.error}`
        }));
      };

      recognitionRef.current.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Available commands based on context
  const getAvailableCommands = useCallback((context: any): CommandAction[] => {
    const baseCommands: CommandAction[] = [
      // Navigation commands
      {
        id: 'nav-dashboard',
        type: 'navigation',
        title: 'Go to Dashboard',
        description: 'Navigate to main dashboard',
        shortcut: ['g', 'd'],
        category: 'Navigation',
        icon: <DocumentIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/dashboard',
        keywords: ['dashboard', 'home', 'main']
      },
      {
        id: 'nav-workflows',
        type: 'navigation',
        title: 'Browse Workflows',
        description: 'View all workflows',
        shortcut: ['g', 'w'],
        category: 'Navigation',
        icon: <CodeBracketIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/workflows',
        keywords: ['workflows', 'browse', 'list']
      },
      {
        id: 'nav-ai-assistant',
        type: 'navigation',
        title: 'Open AI Assistant',
        description: 'Get AI-powered help',
        shortcut: ['g', 'a'],
        category: 'Navigation',
        icon: <ChatBubbleLeftRightIcon className="w-4 h-4" />,
        handler: () => window.location.href = '/ai-assistant',
        keywords: ['ai', 'assistant', 'help', 'chat']
      }
    ];

    const workflowCommands: CommandAction[] = context.workflowId ? [
      {
        id: 'workflow-save',
        type: 'action',
        title: 'Save Workflow',
        description: 'Save current workflow changes',
        shortcut: ['ctrl', 's'],
        category: 'Workflow',
        icon: <CloudArrowUpIcon className="w-4 h-4" />,
        handler: () => console.log('Save workflow'),
        keywords: ['save', 'workflow', 'persist']
      },
      {
        id: 'workflow-run',
        type: 'action',
        title: 'Run Workflow',
        description: 'Execute the current workflow',
        shortcut: ['ctrl', 'r'],
        category: 'Workflow',
        icon: <PaperAirplaneIcon className="w-4 h-4" />,
        handler: () => console.log('Run workflow'),
        keywords: ['run', 'execute', 'workflow']
      }
    ] : [];

    return [...baseCommands, ...workflowCommands];
  }, []);

  // Generate AI suggestions based on query
  const generateAISuggestions = useCallback(async (searchQuery: string, context: any): Promise<AISuggestion[]> => {
    if (!searchQuery.trim()) return [];

    const suggestions: AISuggestion[] = [];
    const query = searchQuery.toLowerCase();

    // AI-powered query generation
    if (query.includes('query') || query.includes('database') || query.includes('sql')) {
      suggestions.push({
        id: 'ai-query-builder',
        type: 'query',
        title: `Generate query: "${searchQuery}"`,
        description: 'AI will create a SQL query based on your description',
        confidence: 0.92,
        action: () => window.location.href = `/query-builder?prompt=${encodeURIComponent(searchQuery)}`,
        category: 'AI Query'
      });
    }

    // Workflow creation suggestions
    if (query.includes('create') || query.includes('build') || query.includes('workflow')) {
      suggestions.push({
        id: 'ai-workflow-create',
        type: 'action',
        title: `Create workflow: "${searchQuery}"`,
        description: 'AI will generate a workflow based on your description',
        confidence: 0.89,
        action: () => console.log('Create workflow from AI'),
        category: 'AI Action'
      });
    }

    // Error analysis suggestions
    if (query.includes('error') || query.includes('issue') || query.includes('problem')) {
      suggestions.push({
        id: 'ai-error-analyze',
        type: 'action',
        title: 'Analyze recent errors',
        description: 'AI will analyze recent error patterns and suggest fixes',
        confidence: 0.87,
        action: () => window.location.href = '/analytics?focus=errors',
        category: 'AI Analysis'
      });
    }

    // Performance optimization suggestions
    if (query.includes('optimize') || query.includes('performance') || query.includes('slow')) {
      suggestions.push({
        id: 'ai-performance-optimize',
        type: 'action',
        title: 'Optimize performance',
        description: 'AI will analyze and suggest performance improvements',
        confidence: 0.85,
        action: () => window.location.href = '/analytics?focus=performance',
        category: 'AI Optimization'
      });
    }

    return suggestions;
  }, []);

  // Filter commands based on query
  const filterCommands = useCallback((commands: CommandAction[], searchQuery: string) => {
    if (!searchQuery.trim()) return commands;

    const query = searchQuery.toLowerCase();
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query) ||
      cmd.keywords.some(keyword => keyword.includes(query)) ||
      cmd.category.toLowerCase().includes(query)
    );
  }, []);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      setVoiceState(prev => ({
        ...prev,
        error: 'Voice recognition not supported in this browser'
      }));
      return;
    }

    if (voiceState.isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [voiceState.isListening]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const commands = getAvailableCommands(currentContext);
    const filteredCommands = filterCommands(commands, query);
    const allItems = [...filteredCommands, ...aiSuggestions];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[selectedIndex]) {
          if ('handler' in allItems[selectedIndex]) {
            (allItems[selectedIndex] as CommandAction).handler(currentContext);
          } else {
            (allItems[selectedIndex] as AISuggestion).action();
          }
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [query, selectedIndex, aiSuggestions, currentContext, onClose, getAvailableCommands, filterCommands]);

  // Update AI suggestions when query changes
  useEffect(() => {
    const updateSuggestions = async () => {
      if (query.trim()) {
        setIsProcessing(true);
        const suggestions = await generateAISuggestions(query, currentContext);
        setAiSuggestions(suggestions);
        setIsProcessing(false);
      } else {
        setAiSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(updateSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, currentContext, generateAISuggestions]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = getAvailableCommands(currentContext);
  const filteredCommands = filterCommands(commands, query);
  const allItems = [...filteredCommands, ...aiSuggestions];

  return (
    <div className={`command-palette-overlay ${className}`}>
      <div className="command-palette-modal" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="command-palette-header">
          <div className="search-input-container">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, ask questions, or describe what you want to do..."
              className="search-input"
              spellCheck={false}
              autoComplete="off"
            />

            {/* Voice input button */}
            <button
              onClick={handleVoiceInput}
              className={`voice-button ${voiceState.isListening ? 'listening' : ''}`}
              title="Voice input"
              aria-label={voiceState.isListening ? 'Stop voice input' : 'Start voice input'}
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="close-button"
              title="Close command palette"
              aria-label="Close command palette"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Voice status */}
          {voiceState.isListening && (
            <div className="voice-status">
              <div className="listening-indicator">
                <div className="pulse-ring"></div>
                <MicrophoneIcon className="w-4 h-4" />
              </div>
              <span>Listening...</span>
              {voiceState.transcript && (
                <span className="transcript-preview">{voiceState.transcript}</span>
              )}
            </div>
          )}

          {voiceState.error && (
            <div className="voice-error">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>{voiceState.error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="command-palette-results">
          {isProcessing && (
            <div className="processing-indicator">
              <CpuChipIcon className="w-4 h-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}

          {allItems.length === 0 && query && !isProcessing && (
            <div className="no-results">
              <p>No commands found for "{query}"</p>
              <p className="suggestion">Try asking the AI assistant for help!</p>
            </div>
          )}

          {/* Commands */}
          {filteredCommands.map((command, index) => (
            <div
              key={command.id}
              className={`command-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => {
                command.handler(currentContext);
                onClose();
              }}
            >
              <div className="command-icon">
                {command.icon}
              </div>
              <div className="command-content">
                <div className="command-title">{command.title}</div>
                <div className="command-description">{command.description}</div>
                {command.shortcut && (
                  <div className="command-shortcut">
                    {command.shortcut.map(key => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </div>
                )}
              </div>
              <div className="command-category">{command.category}</div>
            </div>
          ))}

          {/* AI Suggestions */}
          {aiSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`ai-suggestion-item ${selectedIndex === index + filteredCommands.length ? 'selected' : ''}`}
              onClick={() => {
                suggestion.action();
                onClose();
              }}
            >
              <div className="suggestion-icon">
                <CpuChipIcon className="w-4 h-4" />
              </div>
              <div className="suggestion-content">
                <div className="suggestion-title">
                  {suggestion.title}
                  <div className="confidence-indicator">
                    {getConfidenceIcon(suggestion.confidence, { size: 'xs' })}
                    <span className="confidence">{Math.round(suggestion.confidence * 100)}%</span>
                  </div>
                </div>
                <div className="suggestion-description">{suggestion.description}</div>
              </div>
              <div className="suggestion-category">{suggestion.category}</div>
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="command-palette-footer">
          <div className="hints">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
            <span>🎤 Voice input</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
