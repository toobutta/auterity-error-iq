/**
 * Error Triage Workflow
 * AI-assisted error categorization, analysis, and collaborative resolution system
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  TagIcon,
  BellIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useDebounce } from '../../hooks/useDebounce';

interface ErrorRecord {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  stackTrace?: string;
  context: {
    userId?: string;
    sessionId?: string;
    component?: string;
    action?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  };
  status: 'new' | 'triaged' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  assignee?: string;
  tags: string[];
  aiAnalysis?: {
    category: string;
    confidence: number;
    suggestedPriority: 'low' | 'medium' | 'high' | 'critical';
    similarErrors: string[];
    potentialCauses: string[];
    suggestedActions: string[];
    automatedFix?: {
      type: 'config' | 'restart' | 'rollback' | 'patch';
      description: string;
      risk: 'low' | 'medium' | 'high';
      estimatedTime: number;
    };
  };
  comments: ErrorComment[];
  resolution?: {
    type: 'fixed' | 'workaround' | 'wont_fix' | 'duplicate';
    description: string;
    resolvedBy: string;
    resolvedAt: string;
    timeToResolution: number;
  };
}

interface ErrorComment {
  id: string;
  author: string;
  timestamp: string;
  message: string;
  type: 'comment' | 'action' | 'system';
  attachments?: string[];
}

interface TriageWorkflowProps {
  errors: ErrorRecord[];
  onErrorUpdate?: (errorId: string, updates: Partial<ErrorRecord>) => void;
  onBulkAction?: (errorIds: string[], action: string, data?: any) => void;
  onAssignUser?: (errorId: string, userId: string) => void;
  onAddComment?: (errorId: string, comment: Omit<ErrorComment, 'id' | 'timestamp'>) => void;
  currentUser?: { id: string; name: string; role: string };
  collaborators?: Array<{ id: string; name: string; avatar?: string; online: boolean }>;
  className?: string;
}

export const ErrorTriageWorkflow: React.FC<TriageWorkflowProps> = ({
  errors,
  onErrorUpdate,
  onBulkAction,
  onAssignUser,
  onAddComment,
  currentUser,
  collaborators = [],
  className = ''
}) => {
  // State management
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState({
    status: 'all' as string,
    priority: 'all' as string,
    category: 'all' as string,
    assignee: 'all' as string,
    search: '',
    aiAnalyzed: false
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'status'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'investigating' | 'resolved'>('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);

  // Debounced search
  const debouncedSearch = useDebounce(filterState.search, 300);

  // Filtered and sorted errors
  const processedErrors = useMemo(() => {
    let filtered = errors.filter(error => {
      // Tab filter
      if (activeTab !== 'all') {
        if (activeTab === 'new' && error.status !== 'new') return false;
        if (activeTab === 'investigating' && error.status !== 'investigating') return false;
        if (activeTab === 'resolved' && !['resolved', 'closed'].includes(error.status)) return false;
      }

      // Status filter
      if (filterState.status !== 'all' && error.status !== filterState.status) return false;

      // Priority filter
      if (filterState.priority !== 'all' && error.priority !== filterState.priority) return false;

      // Category filter
      if (filterState.category !== 'all' && error.category !== filterState.category) return false;

      // Assignee filter
      if (filterState.assignee !== 'all') {
        if (filterState.assignee === 'unassigned' && error.assignee) return false;
        if (filterState.assignee !== 'unassigned' && error.assignee !== filterState.assignee) return false;
      }

      // AI analysis filter
      if (filterState.aiAnalyzed && !error.aiAnalysis) return false;

      // Search filter
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const searchableText = [
          error.message,
          error.category,
          error.context.component,
          error.context.action,
          error.stackTrace,
          ...(error.tags || [])
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchableText.includes(searchLower)) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'status':
          const statusOrder = { new: 4, triaged: 3, investigating: 2, resolved: 1, closed: 0 };
          comparison = statusOrder[b.status] - statusOrder[a.status];
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [errors, activeTab, filterState, debouncedSearch, sortBy, sortOrder]);

  // Bulk actions
  const handleBulkAction = useCallback((action: string, data?: any) => {
    if (selectedErrors.size === 0) return;

    const errorIds = Array.from(selectedErrors);
    onBulkAction?.(errorIds, action, data);

    // Clear selection
    setSelectedErrors(new Set());
  }, [selectedErrors, onBulkAction]);

  // Single error actions
  const handleErrorAction = useCallback((errorId: string, action: string, data?: any) => {
    onErrorUpdate?.(errorId, data || { status: action });
  }, [onErrorUpdate]);

  // Error selection
  const toggleErrorSelection = useCallback((errorId: string) => {
    const newSelection = new Set(selectedErrors);
    if (newSelection.has(errorId)) {
      newSelection.delete(errorId);
    } else {
      newSelection.add(errorId);
    }
    setSelectedErrors(newSelection);
  }, [selectedErrors]);

  const toggleAllSelection = useCallback(() => {
    if (selectedErrors.size === processedErrors.length) {
      setSelectedErrors(new Set());
    } else {
      setSelectedErrors(new Set(processedErrors.map(e => e.id)));
    }
  }, [processedErrors, selectedErrors]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const assignees = new Set<string>();

    errors.forEach(error => {
      if (error.category) categories.add(error.category);
      if (error.assignee) assignees.add(error.assignee);
    });

    return {
      categories: Array.from(categories).sort(),
      assignees: Array.from(assignees).sort()
    };
  }, [errors]);

  // Statistics
  const stats = useMemo(() => {
    const total = errors.length;
    const byStatus = {
      new: errors.filter(e => e.status === 'new').length,
      triaged: errors.filter(e => e.status === 'triaged').length,
      investigating: errors.filter(e => e.status === 'investigating').length,
      resolved: errors.filter(e => ['resolved', 'closed'].includes(e.status)).length
    };
    const byPriority = {
      critical: errors.filter(e => e.priority === 'critical').length,
      high: errors.filter(e => e.priority === 'high').length,
      medium: errors.filter(e => e.priority === 'medium').length,
      low: errors.filter(e => e.priority === 'low').length
    };
    const aiAnalyzed = errors.filter(e => e.aiAnalysis).length;

    return { total, byStatus, byPriority, aiAnalyzed };
  }, [errors]);

  return (
    <div className={`error-triage-workflow ${className}`}>
      {/* Header with stats and controls */}
      <div className="workflow-header">
        <div className="header-title">
          <ExclamationTriangleIcon className="header-icon" />
          <h2>Error Triage Workflow</h2>
          <span className="error-count">{stats.total} errors</span>
        </div>

        <div className="header-actions">
          <button
            className="action-button secondary"
            onClick={() => setShowAIAnalysis(!showAIAnalysis)}
          >
            <WrenchScrewdriverIcon className="button-icon" />
            {showAIAnalysis ? 'Hide AI Analysis' : 'Show AI Analysis'}
          </button>

          {selectedErrors.size > 0 && (
            <div className="bulk-actions">
              <span>{selectedErrors.size} selected</span>
              <button
                className="action-button"
                onClick={() => handleBulkAction('assign', { assignee: currentUser?.id })}
              >
                Assign to Me
              </button>
              <button
                className="action-button"
                onClick={() => handleBulkAction('status', { status: 'investigating' })}
              >
                Start Investigation
              </button>
              <button
                className="action-button danger"
                onClick={() => handleBulkAction('close')}
              >
                Close Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon new">
            <BellIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.byStatus.new}</div>
            <div className="stat-label">New Errors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon investigating">
            <MagnifyingGlassIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.byStatus.investigating}</div>
            <div className="stat-label">Investigating</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon resolved">
            <CheckCircleIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.byStatus.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon critical">
            <ExclamationTriangleIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.byPriority.critical}</div>
            <div className="stat-label">Critical</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon ai">
            <WrenchScrewdriverIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.aiAnalyzed}</div>
            <div className="stat-label">AI Analyzed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="workflow-tabs">
        {[
          { id: 'all', label: 'All Errors', count: stats.total },
          { id: 'new', label: 'New', count: stats.byStatus.new },
          { id: 'investigating', label: 'Investigating', count: stats.byStatus.investigating },
          { id: 'resolved', label: 'Resolved', count: stats.byStatus.resolved }
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search errors..."
              value={filterState.search}
              onChange={(e) => setFilterState(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filterState.status}
              onChange={(e) => setFilterState(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="triaged">Triaged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filterState.priority}
              onChange={(e) => setFilterState(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Assignee</label>
            <select
              value={filterState.assignee}
              onChange={(e) => setFilterState(prev => ({ ...prev, assignee: e.target.value }))}
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {filterOptions.assignees.map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="timestamp">Time</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="filter-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={filterState.aiAnalyzed}
                onChange={(e) => setFilterState(prev => ({ ...prev, aiAnalyzed: e.target.checked }))}
              />
              AI Analyzed Only
            </label>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="error-list">
        <div className="list-header">
          <div className="header-checkbox">
            <input
              type="checkbox"
              checked={selectedErrors.size === processedErrors.length && processedErrors.length > 0}
              onChange={toggleAllSelection}
            />
          </div>
          <div className="header-content">
            <span>{processedErrors.length} errors found</span>
          </div>
        </div>

        <div className="error-items">
          {processedErrors.map(error => (
            <ErrorItem
              key={error.id}
              error={error}
              isSelected={selectedErrors.has(error.id)}
              onSelect={() => toggleErrorSelection(error.id)}
              onAction={handleErrorAction}
              onAssign={onAssignUser}
              onComment={onAddComment}
              currentUser={currentUser}
              collaborators={collaborators}
              showAIAnalysis={showAIAnalysis}
            />
          ))}
        </div>

        {processedErrors.length === 0 && (
          <div className="empty-state">
            <DocumentTextIcon className="empty-icon" />
            <h3>No errors found</h3>
            <p>Try adjusting your filters or check back later for new errors.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual error item component
interface ErrorItemProps {
  error: ErrorRecord;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (errorId: string, action: string, data?: any) => void;
  onAssign?: (errorId: string, userId: string) => void;
  onComment?: (errorId: string, comment: Omit<ErrorComment, 'id' | 'timestamp'>) => void;
  currentUser?: { id: string; name: string; role: string };
  collaborators: Array<{ id: string; name: string; avatar?: string; online: boolean }>;
  showAIAnalysis: boolean;
}

const ErrorItem: React.FC<ErrorItemProps> = ({
  error,
  isSelected,
  onSelect,
  onAction,
  onAssign,
  onComment,
  currentUser,
  collaborators,
  showAIAnalysis
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleComment = () => {
    if (commentText.trim() && onComment) {
      onComment(error.id, {
        author: currentUser?.name || 'Anonymous',
        message: commentText.trim(),
        type: 'comment'
      });
      setCommentText('');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#dc2626';
      case 'triaged': return '#ea580c';
      case 'investigating': return '#d97706';
      case 'resolved': return '#65a30d';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`error-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="error-header">
        <div className="error-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
          />
        </div>

        <div className="error-main">
          <div className="error-title-row">
            <div className="error-priority">
              <div
                className="priority-indicator"
                style={{ backgroundColor: getPriorityColor(error.priority) }}
              />
              <span className="priority-text">{error.priority}</span>
            </div>

            <div className="error-status">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(error.status) }}
              >
                {error.status}
              </span>
            </div>

            <div className="error-timestamp">
              {new Date(error.timestamp).toLocaleString()}
            </div>

            <button
              className="expand-button"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          <div className="error-message">
            {error.message}
          </div>

          <div className="error-meta">
            {error.category && (
              <span className="meta-item category">
                <TagIcon className="meta-icon" />
                {error.category}
              </span>
            )}

            {error.assignee && (
              <span className="meta-item assignee">
                <UserGroupIcon className="meta-icon" />
                {error.assignee}
              </span>
            )}

            {error.context.component && (
              <span className="meta-item component">
                {error.context.component}
              </span>
            )}

            {error.aiAnalysis && showAIAnalysis && (
              <span className="meta-item ai-confidence">
                <WrenchScrewdriverIcon className="meta-icon" />
                {(error.aiAnalysis.confidence * 100).toFixed(0)}% AI confidence
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="error-details">
          {/* AI Analysis */}
          {error.aiAnalysis && showAIAnalysis && (
            <div className="ai-analysis-section">
              <h4>AI Analysis</h4>
              <div className="ai-insights">
                <div className="insight-item">
                  <strong>Category:</strong> {error.aiAnalysis.category}
                </div>
                <div className="insight-item">
                  <strong>Suggested Priority:</strong> {error.aiAnalysis.suggestedPriority}
                </div>
                <div className="insight-item">
                  <strong>Potential Causes:</strong>
                  <ul>
                    {error.aiAnalysis.potentialCauses.map((cause, index) => (
                      <li key={index}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div className="insight-item">
                  <strong>Suggested Actions:</strong>
                  <ul>
                    {error.aiAnalysis.suggestedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
                {error.aiAnalysis.automatedFix && (
                  <div className="automated-fix">
                    <h5>Automated Fix Available</h5>
                    <p>{error.aiAnalysis.automatedFix.description}</p>
                    <div className="fix-details">
                      <span>Risk: {error.aiAnalysis.automatedFix.risk}</span>
                      <span>Time: {error.aiAnalysis.automatedFix.estimatedTime}min</span>
                    </div>
                    <button
                      className="apply-fix-button"
                      onClick={() => onAction(error.id, 'apply_fix', error.aiAnalysis?.automatedFix)}
                    >
                      Apply Automated Fix
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context Information */}
          <div className="context-section">
            <h4>Error Context</h4>
            <div className="context-grid">
              {error.context.userId && (
                <div className="context-item">
                  <strong>User ID:</strong> {error.context.userId}
                </div>
              )}
              {error.context.sessionId && (
                <div className="context-item">
                  <strong>Session ID:</strong> {error.context.sessionId}
                </div>
              )}
              {error.context.url && (
                <div className="context-item">
                  <strong>URL:</strong> {error.context.url}
                </div>
              )}
              {error.context.action && (
                <div className="context-item">
                  <strong>Action:</strong> {error.context.action}
                </div>
              )}
            </div>
          </div>

          {/* Stack Trace */}
          {error.stackTrace && (
            <div className="stack-trace-section">
              <h4>Stack Trace</h4>
              <pre className="stack-trace">{error.stackTrace}</pre>
            </div>
          )}

          {/* Comments */}
          <div className="comments-section">
            <h4>Discussion</h4>
            <div className="comments-list">
              {error.comments.map(comment => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">{comment.author}</span>
                    <span className="comment-time">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="comment-message">{comment.message}</div>
                </div>
              ))}
            </div>

            {onComment && (
              <div className="add-comment">
                <textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <button
                  className="comment-button"
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                >
                  <ChatBubbleLeftRightIcon className="button-icon" />
                  Add Comment
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="error-actions">
            <button
              className="action-button"
              onClick={() => onAction(error.id, 'triaged')}
              disabled={error.status !== 'new'}
            >
              Mark as Triaged
            </button>

            <button
              className="action-button"
              onClick={() => onAction(error.id, 'investigating')}
            >
              Start Investigation
            </button>

            <select
              className="assignee-select"
              value={error.assignee || ''}
              onChange={(e) => onAssign?.(error.id, e.target.value)}
            >
              <option value="">Assign to...</option>
              <option value={currentUser?.id}>Assign to Me</option>
              {collaborators.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.online ? '(online)' : ''}
                </option>
              ))}
            </select>

            <button
              className="action-button success"
              onClick={() => onAction(error.id, 'resolved', {
                resolution: {
                  type: 'fixed',
                  description: 'Resolved via triage workflow',
                  resolvedBy: currentUser?.name || 'System',
                  resolvedAt: new Date().toISOString(),
                  timeToResolution: Date.now() - new Date(error.timestamp).getTime()
                }
              })}
            >
              <CheckCircleIcon className="button-icon" />
              Mark as Resolved
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorTriageWorkflow;
