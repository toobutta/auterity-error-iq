/**
 * Proactive Alerts Dashboard Component
 *
 * Comprehensive interface for managing proactive alerts with Copilot suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  proactiveAlertsService,
  ProactiveAlert,
  CopilotSuggestion,
  AlertSeverity,
  AlertCategory
} from '../../services/proactiveAlertsService';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  LightBulbIcon,
  PlayIcon,
  StopIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon as ClockSolidIcon,
  BellIcon as BellSolidIcon
} from '@heroicons/react/24/solid';

interface ProactiveAlertsDashboardProps {
  tenantId?: string;
  userId?: string;
  onAlertAction?: (action: string, alertId: string, data?: any) => void;
  onSuggestionImplement?: (alertId: string, suggestionId: string) => void;
  className?: string;
}

export const ProactiveAlertsDashboard: React.FC<ProactiveAlertsDashboardProps> = ({
  tenantId = 'default_tenant',
  userId = 'current_user',
  onAlertAction,
  onSuggestionImplement,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<ProactiveAlert | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CopilotSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'acknowledged' | 'resolved' | 'all'>('active');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<AlertCategory | 'all'>('all');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const allAlerts = await proactiveAlertsService.getAlerts({
        status: status as any,
        severity: filterSeverity === 'all' ? undefined : filterSeverity,
        category: filterCategory === 'all' ? undefined : filterCategory,
        limit: 100
      });
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, [activeTab, filterSeverity, filterCategory]);

  useEffect(() => {
    loadAlerts();
    setIsLoading(false);
  }, [loadAlerts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadAlerts]);

  // Listen for alert events
  useEffect(() => {
    const handleAlertGenerated = (alert: ProactiveAlert) => {
      setAlerts(prev => [alert, ...prev]);
    };

    const handleAlertAcknowledged = ({ alert }: { alert: ProactiveAlert }) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    };

    const handleAlertResolved = ({ alert }: { alert: ProactiveAlert }) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    };

    const handleSuggestionImplemented = ({ alert, suggestion }: { alert: ProactiveAlert; suggestion: CopilotSuggestion }) => {
      setAlerts(prev => prev.map(a => a.id === alert.id ? alert : a));
    };

    proactiveAlertsService.on('alert:generated', handleAlertGenerated);
    proactiveAlertsService.on('alert:acknowledged', handleAlertAcknowledged);
    proactiveAlertsService.on('alert:resolved', handleAlertResolved);
    proactiveAlertsService.on('suggestion:implemented', handleSuggestionImplemented);

    return () => {
      proactiveAlertsService.off('alert:generated', handleAlertGenerated);
      proactiveAlertsService.off('alert:acknowledged', handleAlertAcknowledged);
      proactiveAlertsService.off('alert:resolved', handleAlertResolved);
      proactiveAlertsService.off('suggestion:implemented', handleSuggestionImplemented);
    };
  }, []);

  // Alert actions
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const notes = prompt('Add notes (optional):');
      await proactiveAlertsService.acknowledgeAlert(alertId, userId, notes || undefined);

      if (onAlertAction) {
        onAlertAction('acknowledge', alertId, { notes });
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      alert('Failed to acknowledge alert');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const notes = prompt('Resolution notes:');
      if (!notes) return;

      await proactiveAlertsService.resolveAlert(alertId, userId, notes);

      if (onAlertAction) {
        onAlertAction('resolve', alertId, { notes });
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert');
    }
  };

  const handleSuppressAlert = async (alertId: string) => {
    try {
      const duration = parseInt(prompt('Suppress duration in minutes:', '60') || '60');
      const reason = prompt('Reason for suppression:');
      if (!reason) return;

      await proactiveAlertsService.suppressAlert(alertId, userId, duration * 60 * 1000, reason);

      if (onAlertAction) {
        onAlertAction('suppress', alertId, { duration, reason });
      }
    } catch (error) {
      console.error('Failed to suppress alert:', error);
      alert('Failed to suppress alert');
    }
  };

  const handleImplementSuggestion = async (alertId: string, suggestionId: string) => {
    try {
      const effectiveness = parseFloat(prompt('Rate effectiveness (0-1):', '0.8') || '0.8');
      await proactiveAlertsService.implementSuggestion(alertId, suggestionId, userId, effectiveness);

      if (onSuggestionImplement) {
        onSuggestionImplement(alertId, suggestionId);
      }

      setShowSuggestionModal(false);
      setSelectedSuggestion(null);
    } catch (error) {
      console.error('Failed to implement suggestion:', error);
      alert('Failed to implement suggestion');
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ExclamationTriangleSolidIcon className="h-5 w-5 text-red-500" />;
      case 'acknowledged':
        return <ClockSolidIcon className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircleSolidIcon className="h-5 w-5 text-green-500" />;
      case 'suppressed':
        return <StopIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <Cog6ToothIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get severity icon and color
  const getSeverityStyle = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          icon: <ExclamationTriangleSolidIcon className="h-4 w-4" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'high':
        return {
          icon: <ExclamationTriangleIcon className="h-4 w-4" />,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      case 'medium':
        return {
          icon: <ClockIcon className="h-4 w-4" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'low':
        return {
          icon: <CheckCircleIcon className="h-4 w-4" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'info':
        return {
          icon: <BellIcon className="h-4 w-4" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
      default:
        return {
          icon: <Cog6ToothIcon className="h-4 w-4" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Format duration
  const formatDuration = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // Render alert card
  const renderAlertCard = (alert: ProactiveAlert) => {
    const severityStyle = getSeverityStyle(alert.severity);

    return (
      <div
        key={alert.id}
        className={`bg-white border-l-4 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
          selectedAlert?.id === alert.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedAlert(alert)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon(alert.status)}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-2">{alert.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${severityStyle.bgColor} ${severityStyle.textColor}`}>
              {severityStyle.icon}
              {alert.severity.toUpperCase()}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
              {alert.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Source:</span>
            <div>{alert.source.system}/{alert.source.component}</div>
          </div>
          <div>
            <span className="font-medium">Priority:</span>
            <div>{alert.priority}/5</div>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <div>{formatDuration(alert.created_at)}</div>
          </div>
          <div>
            <span className="font-medium">Suggestions:</span>
            <div>{alert.copilot_suggestions.length}</div>
          </div>
        </div>

        {/* AI Analysis Preview */}
        {alert.ai_analysis && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <LightBulbIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">AI Analysis</span>
            </div>
            <p className="text-sm text-blue-800 mb-1">
              Root Cause: {(alert.ai_analysis.root_cause_probability * 100).toFixed(1)}% confidence
            </p>
            <p className="text-sm text-blue-700 line-clamp-1">
              {alert.ai_analysis.predicted_impact}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            {alert.status === 'active' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcknowledgeAlert(alert.id);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Acknowledge
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSuppressAlert(alert.id);
                  }}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Suppress
                </button>
              </>
            )}
            {(alert.status === 'active' || alert.status === 'acknowledged') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResolveAlert(alert.id);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Resolve
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAlert(alert);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {alert.copilot_suggestions.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSuggestion(alert.copilot_suggestions[0]);
                  setShowSuggestionModal(true);
                }}
                className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
                title="View Copilot Suggestions"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {alert.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {alert.tags.map(tag => (
              <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`proactive-alerts-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Proactive Alerts</h2>
            <p className="text-gray-600">AI-powered alerts with Copilot suggestions</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={loadAlerts}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{alerts.filter(a => a.status === 'active').length}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <ExclamationTriangleSolidIcon className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{alerts.filter(a => a.status === 'acknowledged').length}</div>
                <div className="text-sm text-gray-500">Acknowledged</div>
              </div>
              <ClockSolidIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'resolved').length}</div>
                <div className="text-sm text-gray-500">Resolved</div>
              </div>
              <CheckCircleSolidIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{alerts.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <BellSolidIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {alerts.reduce((sum, alert) => sum + alert.copilot_suggestions.length, 0)}
                </div>
                <div className="text-sm text-gray-500">Suggestions</div>
              </div>
              <LightBulbIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'active', label: 'Active', count: alerts.filter(a => a.status === 'active').length },
            { id: 'acknowledged', label: 'Acknowledged', count: alerts.filter(a => a.status === 'acknowledged').length },
            { id: 'resolved', label: 'Resolved', count: alerts.filter(a => a.status === 'resolved').length },
            { id: 'all', label: 'All', count: alerts.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  tab.id === 'active' ? 'bg-red-100 text-red-800' :
                  activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="availability">Availability</option>
              <option value="capacity">Capacity</option>
              <option value="configuration">Configuration</option>
              <option value="data_quality">Data Quality</option>
              <option value="user_experience">User Experience</option>
              <option value="system_health">System Health</option>
              <option value="business_impact">Business Impact</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alerts.map(alert => renderAlertCard(alert))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
          <p className="text-gray-600">All systems are running smoothly!</p>
        </div>
      )}

      {/* Alert Details Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={() => handleAcknowledgeAlert(selectedAlert.id)}
          onResolve={() => handleResolveAlert(selectedAlert.id)}
          onSuppress={() => handleSuppressAlert(selectedAlert.id)}
          onSuggestionClick={(suggestion) => {
            setSelectedSuggestion(suggestion);
            setShowSuggestionModal(true);
          }}
        />
      )}

      {/* Copilot Suggestion Modal */}
      {showSuggestionModal && selectedSuggestion && (
        <CopilotSuggestionModal
          suggestion={selectedSuggestion}
          onClose={() => {
            setShowSuggestionModal(false);
            setSelectedSuggestion(null);
          }}
          onImplement={() => {
            if (selectedAlert) {
              handleImplementSuggestion(selectedAlert.id, selectedSuggestion.id);
            }
          }}
        />
      )}
    </div>
  );
};

// Alert Details Modal Component
const AlertDetailsModal: React.FC<{
  alert: ProactiveAlert;
  onClose: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
  onSuppress: () => void;
  onSuggestionClick: (suggestion: CopilotSuggestion) => void;
}> = ({ alert, onClose, onAcknowledge, onResolve, onSuppress, onSuggestionClick }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{alert.title}</h2>
                <p className="text-gray-600">Alert ID: {alert.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                alert.status === 'active' ? 'bg-red-100 text-red-800' :
                alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {alert.status.toUpperCase()}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {alert.severity.toUpperCase()}
              </span>
            </div>

            <div className="flex gap-2">
              {alert.status === 'active' && (
                <>
                  <button
                    onClick={onAcknowledge}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={onSuppress}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Suppress
                  </button>
                </>
              )}
              {(alert.status === 'active' || alert.status === 'acknowledged') && (
                <button
                  onClick={onResolve}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{alert.description}</p>
          </div>

          {/* AI Analysis */}
          {alert.ai_analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5" />
                AI Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-blue-800">Root Cause Probability:</span>
                  <div className="text-lg font-semibold text-blue-900">
                    {(alert.ai_analysis.root_cause_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-blue-800">Predicted Impact:</span>
                  <div className="text-blue-900">{alert.ai_analysis.predicted_impact}</div>
                </div>
                {alert.ai_analysis.time_to_incident && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Time to Incident:</span>
                    <div className="text-blue-900">{alert.ai_analysis.time_to_incident} minutes</div>
                  </div>
                )}
                {alert.ai_analysis.business_value_at_risk && (
                  <div>
                    <span className="text-sm font-medium text-blue-800">Business Value at Risk:</span>
                    <div className="text-blue-900">${alert.ai_analysis.business_value_at_risk.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Copilot Suggestions */}
          {alert.copilot_suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                Copilot Suggestions ({alert.copilot_suggestions.length})
              </h3>
              <div className="space-y-3">
                {alert.copilot_suggestions.map((suggestion, index) => (
                  <div key={suggestion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{suggestion.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          suggestion.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                          suggestion.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(suggestion.confidence * 100).toFixed(0)}% confidence
                        </span>
                        <button
                          onClick={() => onSuggestionClick(suggestion)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <div className="text-gray-600 capitalize">{suggestion.type.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Est. Time:</span>
                        <div className="text-gray-600">{suggestion.implementation.estimated_time} min</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Risk:</span>
                        <div className="text-gray-600 capitalize">{suggestion.implementation.risk_level}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Impact:</span>
                        <div className="text-gray-600">
                          {(suggestion.impact.severity_reduction * 100).toFixed(0)}% reduction
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Source Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">System:</span>
                <div className="text-gray-600">{alert.source.system}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Component:</span>
                <div className="text-gray-600">{alert.source.component}</div>
              </div>
              {alert.source.instance && (
                <div>
                  <span className="font-medium text-gray-700">Instance:</span>
                  <div className="text-gray-600">{alert.source.instance}</div>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <div className="text-gray-600">{alert.created_at.toLocaleString()}</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Priority:</span>
                <div className="text-gray-600">{alert.priority}/5</div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Category:</span>
                <div className="text-gray-600 capitalize">{alert.category.replace('_', ' ')}</div>
              </div>
            </div>
          </div>

          {/* Response History */}
          {alert.responses.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Response History</h3>
              <div className="space-y-2">
                {alert.responses.map((response, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 capitalize">
                          {response.type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {response.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">by {response.user_id}</div>
                      {response.notes && (
                        <div className="text-sm text-gray-700 mt-1">{response.notes}</div>
                      )}
                      {response.effectiveness !== undefined && (
                        <div className="text-sm text-gray-700 mt-1">
                          Effectiveness: {(response.effectiveness * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Copilot Suggestion Modal Component
const CopilotSuggestionModal: React.FC<{
  suggestion: CopilotSuggestion;
  onClose: () => void;
  onImplement: () => void;
}> = ({ suggestion, onClose, onImplement }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{suggestion.title}</h2>
                <p className="text-gray-600">Copilot Suggestion</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Confidence and Impact */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(suggestion.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {(suggestion.impact.severity_reduction * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Severity Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {suggestion.implementation.estimated_time}
              </div>
              <div className="text-sm text-gray-500">Est. Time (min)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {suggestion.impact.time_to_resolution}
              </div>
              <div className="text-sm text-gray-500">Time Saved (min)</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{suggestion.description}</p>
          </div>

          {/* Implementation Steps */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Implementation Steps</h3>
            <div className="space-y-2">
              {suggestion.implementation.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          {suggestion.prerequisites.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Prerequisites</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {suggestion.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Criteria */}
          {suggestion.success_criteria.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Success Criteria</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {suggestion.success_criteria.map((criteria, index) => (
                  <li key={index}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-yellow-900 mb-2">Risk Assessment</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-yellow-800">Risk Level:</span>
                <div className="text-yellow-900 capitalize">{suggestion.implementation.risk_level}</div>
              </div>
              <div>
                <span className="font-medium text-yellow-800">Rollback Plan:</span>
                <div className="text-yellow-900">
                  {suggestion.implementation.rollback_plan.length > 0 ? 'Available' : 'None specified'}
                </div>
              </div>
            </div>
          </div>

          {/* Expected Impact */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-900 mb-2">Expected Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Severity Reduction:</span>
                <div className="text-green-900">{(suggestion.impact.severity_reduction * 100).toFixed(0)}%</div>
              </div>
              <div>
                <span className="font-medium text-green-800">Time Saved:</span>
                <div className="text-green-900">{suggestion.impact.time_to_resolution} min</div>
              </div>
              <div>
                <span className="font-medium text-green-800">Cost Savings:</span>
                <div className="text-green-900">${suggestion.impact.cost_savings}</div>
              </div>
              <div>
                <span className="font-medium text-green-800">Automation:</span>
                <div className="text-green-900">{(suggestion.impact.automation_potential * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onImplement}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            Implement Suggestion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProactiveAlertsDashboard;
