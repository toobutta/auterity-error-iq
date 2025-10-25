/**
 * WORKFLOW STUDIO AI ASSISTANT
 * 
 * Integrates Auterity's existing AI chat and cognitive features with workflow-specific
 * capabilities for contextual assistance, optimization suggestions, and automated workflow generation.
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from '../../contexts/AuthContext.js';
import { useNotifications } from '../../components/notifications/NotificationSystem.js';
// @ts-ignore - External module
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  SparklesIcon,
  CpuChipIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import './WorkflowAIAssistant.css';
import './WorkflowAIAssistantExplainability.css';
import { getConfidenceIcon } from '../../utils/professionalIcons.js';
import { aiSDKService } from '../../services/aiSDKService.js';

// Enhanced interfaces for workflow AI integration
interface WorkflowAIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'suggestion';
  content: string;
  timestamp: Date;
  workflowContext?: {
    workflowId?: string;
    nodeId?: string;
    canvasState?: any;
  };
  suggestions?: WorkflowSuggestion[];
  metadata?: Record<string, any>;
}

interface WorkflowSuggestion {
  id: string;
  type: 'node' | 'connection' | 'optimization' | 'template' | 'query';
  title: string;
  description: string;
  confidence: number;
  action: {
    type: 'add_node' | 'connect_nodes' | 'optimize_workflow' | 'apply_template' | 'create_query';
    data: any;
  };
  preview?: string;
}

interface AIInsight {
  id: string;
  type: 'performance' | 'optimization' | 'error' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  workflowId?: string;
  nodeId?: string;
}

interface ExplainabilityMetrics {
  confidence: number;
  cost: number; // API cost in cents
  latency: number; // Response time in ms
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  reasoning?: string;
  dataSources?: string[];
  riskLevel: 'low' | 'medium' | 'high';
  canOptOut: boolean;
}

interface ExplainableAIAction {
  id: string;
  action: () => void | Promise<void>;
  title: string;
  description: string;
  metrics: ExplainabilityMetrics;
  expandableDetails?: {
    reasoning: string;
    dataLineage: string[];
    alternatives: string[];
    risks: string[];
  };
}

interface WorkflowAIAssistantProps {
  workflowId?: string;
  currentNode?: string;
  canvasState?: any;
  onSuggestionApply?: (suggestion: WorkflowSuggestion) => void;
  onWorkflowGenerate?: (prompt: string) => void;
  className?: string;
}

export const WorkflowAIAssistant: React.FC<WorkflowAIAssistantProps> = ({
  workflowId,
  currentNode,
  canvasState,
  onSuggestionApply,
  onWorkflowGenerate,
  className = ''
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // State management
  const [messages, setMessages] = useState<WorkflowAIMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'suggestions' | 'actions'>('chat');
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [explainableActions, setExplainableActions] = useState<ExplainableAIAction[]>([]);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: WorkflowAIMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Hi ${user?.name || 'there'}! I'm your Workflow AI Assistant. I can help you:

**Build workflows** - "Create a customer onboarding workflow"
**Optimize performance** - "How can I make this workflow faster?"
**Generate queries** - "Show me all orders from last week"
**Suggest improvements** - I'll analyze your workflow and suggest enhancements

What would you like to work on today?`,
      timestamp: new Date(),
      workflowContext: { workflowId }
    };

    setMessages([welcomeMessage]);
    generateContextualInsights();
  }, [user, workflowId]);

  // Generate contextual insights based on workflow state
  const generateContextualInsights = useCallback(async () => {
    if (!workflowId) return;

    // Mock insights generation - in real implementation, this would call AI service
    const mockInsights: AIInsight[] = [
      {
        id: 'perf_1',
        type: 'performance',
        severity: 'medium',
        title: 'Database Query Optimization',
        description: 'Multiple database queries detected in sequence',
        recommendation: 'Consider batching queries or using JOIN operations to reduce database calls',
        confidence: 0.85,
        workflowId,
        nodeId: 'query_node_1'
      },
      {
        id: 'opt_1',
        type: 'optimization',
        severity: 'low',
        title: 'Parallel Execution Opportunity',
        description: 'Independent tasks found that can run in parallel',
        recommendation: 'Use parallel execution to reduce overall workflow time by ~30%',
        confidence: 0.92,
        workflowId
      },
      {
        id: 'sug_1',
        type: 'suggestion',
        severity: 'low',
        title: 'Error Handling Enhancement',
        description: 'Missing error handling in critical path',
        recommendation: 'Add try-catch blocks and retry logic for external API calls',
        confidence: 0.78,
        workflowId
      }
    ];

    setInsights(mockInsights);

    // Generate contextual suggestions
    const mockSuggestions: WorkflowSuggestion[] = [
      {
        id: 'sug_node_1',
        type: 'node',
        title: 'Add Email Notification Node',
        description: 'Send notification when workflow completes',
        confidence: 0.88,
        action: {
          type: 'add_node',
          data: {
            type: 'email_notification',
            position: { x: 400, y: 200 },
            config: {
              template: 'workflow_complete',
              recipients: ['user@example.com']
            }
          }
        },
        preview: 'Email notification node with workflow completion template'
      },
      {
        id: 'sug_opt_1',
        type: 'optimization',
        title: 'Optimize Database Queries',
        description: 'Combine multiple queries into a single optimized query',
        confidence: 0.92,
        action: {
          type: 'optimize_workflow',
          data: {
            optimizationType: 'query_optimization',
            targetNodes: ['query_1', 'query_2', 'query_3']
          }
        },
        preview: 'Reduces database calls from 3 to 1, improving performance by ~60%'
      }
    ];

    setSuggestions(mockSuggestions);

    // Generate explainable AI actions
    generateExplainableActions();
  }, [workflowId]);

  // Generate explainable AI actions with comprehensive metrics
  const generateExplainableActions = useCallback(() => {
    const mockExplainableActions: ExplainableAIAction[] = [
      {
        id: 'action_optimize_workflow',
        action: () => console.log('Optimizing workflow...'),
        title: 'Auto-Optimize Workflow',
        description: 'Apply AI-driven optimizations to improve performance',
        metrics: {
          confidence: 0.87,
          cost: 2.5,
          latency: 1250,
          model: 'GPT-4-Turbo',
          tokens: { input: 450, output: 120, total: 570 },
          reasoning: 'Analysis of workflow patterns shows opportunities for parallelization and query optimization',
          dataSources: ['Workflow execution logs', 'Performance metrics', 'Node dependencies'],
          riskLevel: 'low',
          canOptOut: true
        },
        expandableDetails: {
          reasoning: 'Based on analysis of your workflow execution patterns over the last 30 days, I identified three key optimization opportunities: 1) Parallel execution of independent nodes, 2) Query batching for database operations, 3) Caching of frequently accessed data.',
          dataLineage: [
            'Workflow execution logs (Last 30 days)',
            'Performance metrics database',
            'Node dependency graph analysis',
            'Historical optimization success rates'
          ],
          alternatives: [
            'Manual optimization review',
            'Selective optimization (choose specific improvements)',
            'Conservative optimization (minimal changes)'
          ],
          risks: [
            'Minimal: Potential for temporary performance impact during optimization',
            'Low risk: All changes are reversible',
            'Monitoring: Real-time performance tracking during optimization'
          ]
        }
      },
      {
        id: 'action_generate_query',
        action: () => window.location.href = '/query-builder',
        title: 'Generate Analytics Query',
        description: 'Create a query for workflow performance analysis',
        metrics: {
          confidence: 0.92,
          cost: 1.2,
          latency: 800,
          model: 'Claude-3-Haiku',
          tokens: { input: 320, output: 85, total: 405 },
          reasoning: 'Understanding of your data schema and query patterns enables precise query generation',
          dataSources: ['Database schema', 'Query history', 'Workflow metadata'],
          riskLevel: 'low',
          canOptOut: true
        },
        expandableDetails: {
          reasoning: 'Your workflow processes customer data with order information. I can generate a query that analyzes order completion rates by customer segment and time period.',
          dataLineage: [
            'Database schema analysis',
            'Historical query patterns',
            'Workflow data flow mapping'
          ],
          alternatives: [
            'Use visual query builder',
            'Start with template queries',
            'Import existing queries'
          ],
          risks: [
            'None: Query generation is read-only',
            'Privacy: No sensitive data exposed in suggestions'
          ]
        }
      }
    ];

    setExplainableActions(mockExplainableActions);
  }, []);

  // Process user input and generate AI response
  const processUserInput = useCallback(async (input: string) => {
    if (!input.trim()) return;

    const userMessage: WorkflowAIMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
      workflowContext: { workflowId, nodeId: currentNode, canvasState }
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);

    try {
      // Generate contextual AI response using AI SDK
      const aiResponse = await generateAIResponse(input, userMessage.workflowContext);
      
      setMessages(prev => [...prev, aiResponse]);

      // Generate suggestions if applicable
      if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
        setSuggestions(prev => [...prev, ...aiResponse.suggestions!]);
      }

    } catch (error) {
      const errorMessage: WorkflowAIMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: '❌ Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [workflowId, currentNode, canvasState]);

  // Generate AI response based on input and context using AI SDK
  const generateAIResponse = async (input: string, context?: any): Promise<WorkflowAIMessage> => {
    try {
      // Use AI SDK for generating responses
      const response = await aiSDKService.generateTextResponse(input, context);

      return {
        id: `ai_${Date.now()}`,
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        workflowContext: context,
        suggestions: generateContextualSuggestions(input, response)
      };
    } catch (error) {
      console.error('AI SDK response generation failed:', error);

      // Fallback to basic response
      return {
        id: `ai_${Date.now()}`,
        type: 'assistant',
        content: `I understand you want to: "${input}". I'm here to help you with workflow creation, optimization, and management. Could you provide more details about what you'd like to accomplish?`,
        timestamp: new Date(),
        workflowContext: context
      };
    }
  };

  // Generate contextual suggestions based on input and response
  const generateContextualSuggestions = (input: string, response: string): WorkflowSuggestion[] => {
    const lowerInput = input.toLowerCase();
    const suggestions: WorkflowSuggestion[] = [];

    if (lowerInput.includes('create') || lowerInput.includes('build') || lowerInput.includes('workflow')) {
      suggestions.push({
        id: 'template_suggestion',
        type: 'template',
        title: 'Customer Onboarding Template',
        description: 'Pre-built workflow for customer onboarding process',
        confidence: 0.9,
        action: { type: 'apply_template', data: { templateId: 'customer_onboarding' } },
        preview: 'Includes email verification, profile setup, and welcome sequence'
      });
    }

    if (lowerInput.includes('query') || lowerInput.includes('database') || lowerInput.includes('sql')) {
      suggestions.push({
        id: 'query_builder',
        type: 'query',
        title: 'Open Query Builder',
        description: 'Launch the visual query builder interface',
        confidence: 0.95,
        action: { type: 'create_query', data: { openBuilder: true } },
        preview: 'Visual drag-and-drop query building interface'
      });
    }

    if (lowerInput.includes('optimize') || lowerInput.includes('improve') || lowerInput.includes('faster')) {
      suggestions.push({
        id: 'optimization_suggestion',
        type: 'optimization',
        title: 'Auto-Optimize Workflow',
        description: 'Apply AI-driven optimizations to improve performance',
        confidence: 0.87,
        action: { type: 'optimize_workflow', data: { optimizationType: 'comprehensive' } },
        preview: 'Reduces execution time and improves resource utilization'
      });
    }

    return suggestions;
  };

  // Handle suggestion application
  const handleApplySuggestion = useCallback((suggestion: WorkflowSuggestion) => {
    if (onSuggestionApply) {
      onSuggestionApply(suggestion);
    }

    addNotification({
      type: 'success',
      title: 'Suggestion Applied',
      message: `Applied: ${suggestion.title}`
    });

    // Add confirmation message to chat
    const confirmationMessage: WorkflowAIMessage = {
      id: `confirm_${Date.now()}`,
      type: 'system',
      content: `Applied suggestion: ${suggestion.title}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmationMessage]);
  }, [onSuggestionApply, addNotification]);

  // Handle input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    processUserInput(currentInput);
  }, [currentInput, processUserInput]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processUserInput(currentInput);
    }
  }, [currentInput, processUserInput]);

  // Explainability Chip Component
  const ExplainabilityChip: React.FC<{
    metrics: ExplainabilityMetrics;
    actionId: string;
    onOptOut?: () => void;
  }> = ({ metrics, actionId, onOptOut }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const action = explainableActions.find(a => a.id === actionId);

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'low': return 'text-green-600 bg-green-50 border-green-200';
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'high': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    return (
      <div className="explainability-chip">
        {/* Compact Metrics Display */}
        <div className="metrics-row">
          <div className="metric-item">
            <span className="metric-label">Confidence:</span>
            <span className="metric-value">{Math.round(metrics.confidence * 100)}%</span>
            {getConfidenceIcon(metrics.confidence, { size: 'xs' })}
          </div>
          <div className="metric-item">
            <span className="metric-label">Cost:</span>
            <span className="metric-value">${metrics.cost.toFixed(2)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Latency:</span>
            <span className="metric-value">{metrics.latency}ms</span>
          </div>
          <div className={`metric-item risk-indicator ${getRiskColor(metrics.riskLevel)}`}>
            <span className="metric-label">Risk:</span>
            <span className="metric-value">{metrics.riskLevel}</span>
          </div>
        </div>

        {/* Expandable Details */}
        {action?.expandableDetails && (
          <div className="expandable-section">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="expand-button"
              data-expanded={isExpanded}
              aria-controls="expandable-details"
            >
              <span>{isExpanded ? 'Hide' : 'Show'} details</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isExpanded && (
              <div id="expandable-details" className="expanded-details">
                <div className="detail-section">
                  <h5>AI Reasoning</h5>
                  <p>{action.expandableDetails.reasoning}</p>
                </div>

                <div className="detail-section">
                  <h5>Data Sources</h5>
                  <ul>
                    {action.expandableDetails.dataLineage.map((source, idx) => (
                      <li key={idx}>{source}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section">
                  <h5>Alternatives</h5>
                  <ul>
                    {action.expandableDetails.alternatives.map((alt, idx) => (
                      <li key={idx}>{alt}</li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section">
                  <h5>Risks & Mitigations</h5>
                  <ul>
                    {action.expandableDetails.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>

                <div className="model-info">
                  <div className="model-detail">
                    <span className="label">Model:</span>
                    <span className="value">{metrics.model}</span>
                  </div>
                  <div className="model-detail">
                    <span className="label">Tokens:</span>
                    <span className="value">{metrics.tokens.total} ({metrics.tokens.input} in, {metrics.tokens.output} out)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Opt-out Control */}
        {metrics.canOptOut && onOptOut && (
          <button
            onClick={onOptOut}
            className="opt-out-button"
            title="Opt out of this AI suggestion"
          >
            <XMarkIcon className="w-3 h-3" />
            <span className="sr-only">Opt out of this AI suggestion</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`workflow-ai-assistant ${className}`}>
      {/* Header */}
      <div className="ai-assistant-header">
        <div className="header-title">
          <div className="ai-header-icon">
            <CpuChipIcon className="w-5 h-5" />
          </div>
          <h3>AI Assistant</h3>
          <span className="status-indicator online">Online</span>
        </div>
        <div className="header-tabs">
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button
            className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <LightBulbIcon className="w-4 h-4" />
            <span>Insights ({insights.length})</span>
          </button>
          <button
            className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Suggestions ({suggestions.length})</span>
          </button>
          <button
            className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            <CpuChipIcon className="w-4 h-4" />
            <span>AI Actions ({explainableActions.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="ai-assistant-content">
        {activeTab === 'chat' && (
          <div className="chat-interface">
            {/* Messages */}
            <div className="messages-container">
              {messages.map(message => (
                <div key={message.id} className={`message ${message.type}`}>
                  <div className="message-content">
                    <div className="message-text">{message.content}</div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="inline-suggestions">
                        {message.suggestions.map(suggestion => (
                          <button
                            key={suggestion.id}
                            className="suggestion-button"
                            onClick={() => handleApplySuggestion(suggestion)}
                          >
                            {suggestion.title}
                            <div className="confidence-indicator">
                              {getConfidenceIcon(suggestion.confidence, { size: 'xs' })}
                              <span className="confidence">{Math.round(suggestion.confidence * 100)}%</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="message assistant processing">
                  <div className="message-content">
                                  <div className="typing-indicator">
                <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-500" />
                <span className="sr-only">AI Assistant is thinking...</span>
              </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="chat-input-form">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about workflows, queries, or optimizations..."
                disabled={isProcessing}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={!currentInput.trim() || isProcessing}
                className="send-button"
                aria-label="Send message"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="insights-panel">
            <div className="insights-header">
              <LightBulbIcon className="w-5 h-5" />
              <h4>Workflow Insights</h4>
            </div>
            {insights.length === 0 ? (
              <div className="empty-state">
                <p>No insights available yet. I'll analyze your workflow and provide suggestions as you build.</p>
              </div>
            ) : (
              <div className="insights-list">
                {insights.map(insight => (
                  <div key={insight.id} className={`insight-card ${insight.severity}`}>
                    <div className="insight-header">
                      <h5>{insight.title}</h5>
                      <div className="confidence-indicator">
                        {getConfidenceIcon(insight.confidence, { size: 'xs' })}
                        <span className="confidence">{Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="insight-description">{insight.description}</p>
                    <div className="insight-recommendation">
                      <strong>Recommendation:</strong> {insight.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-panel">
            <div className="suggestions-header">
              <SparklesIcon className="w-5 h-5" />
              <h4>Smart Suggestions</h4>
            </div>
            {suggestions.length === 0 ? (
              <div className="empty-state">
                <p>No suggestions yet. Start building your workflow and I'll provide contextual recommendations!</p>
              </div>
            ) : (
              <div className="suggestions-list">
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} className="suggestion-card">
                    <div className="suggestion-header">
                      <h5>{suggestion.title}</h5>
                      <div className="confidence-indicator">
                        {getConfidenceIcon(suggestion.confidence, { size: 'xs' })}
                        <span className="confidence">{Math.round(suggestion.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="suggestion-description">{suggestion.description}</p>
                    {suggestion.preview && (
                      <div className="suggestion-preview">
                        <strong>Preview:</strong> {suggestion.preview}
                      </div>
                    )}
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="apply-button"
                    >
                      Apply Suggestion
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="explainable-actions-panel">
            <div className="actions-header">
              <CpuChipIcon className="w-5 h-5" />
              <h4>Explainable AI Actions</h4>
              <div className="transparency-notice">
                <InformationCircleIcon className="w-4 h-4" />
                <span>All AI actions include full transparency and opt-out controls</span>
              </div>
            </div>
            {explainableActions.length === 0 ? (
              <div className="empty-state">
                <p>No AI actions available yet. I'll generate explainable actions as you work with your workflows.</p>
              </div>
            ) : (
              <div className="explainable-actions-list">
                {explainableActions.map(action => (
                  <div key={action.id} className="explainable-action-card">
                    <div className="action-header">
                      <h5>{action.title}</h5>
                      <button
                        onClick={() => action.action()}
                        className="execute-action-button"
                      >
                        Execute Action
                      </button>
                    </div>
                    <p className="action-description">{action.description}</p>

                    {/* Explainability Chip */}
                    <ExplainabilityChip
                      metrics={action.metrics}
                      actionId={action.id}
                      onOptOut={() => {
                        setExplainableActions(prev =>
                          prev.filter(a => a.id !== action.id)
                        );
                        addNotification({
                          type: 'info',
                          title: 'AI Action Opted Out',
                          message: `You have opted out of: ${action.title}`
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowAIAssistant;
