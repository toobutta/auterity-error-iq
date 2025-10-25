import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle, X, Filter } from 'lucide-react';

// Import existing notification types and adapt them
interface TaskNotification {
  id: string;
  type: 'workflow_completed' | 'workflow_failed' | 'ai_execution' | 'system_alert' | 'approval_required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  metadata?: {
    workflowId?: string;
    executionId?: string;
    projectId?: string;
    workspaceId?: string;
  };
}

interface TaskCenterProps {
  onNotificationClick?: (notification: TaskNotification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

export const TaskCenter: React.FC<TaskCenterProps> = ({
  onNotificationClick,
  onMarkAsRead,
  onDismiss,
}) => {
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionable'>('all');
  const [isOpen, setIsOpen] = useState(false);

  // Mock data - in real implementation, this would come from the existing notification service
  useEffect(() => {
    const mockNotifications: TaskNotification[] = [
      {
        id: '1',
        type: 'workflow_completed',
        priority: 'medium',
        title: 'Workflow Execution Completed',
        message: 'Data processing workflow finished successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
        actionable: true,
        metadata: { workflowId: 'wf-123', executionId: 'exec-456' }
      },
      {
        id: '2',
        type: 'ai_execution',
        priority: 'low',
        title: 'AI Function Completed',
        message: 'Text generation task completed in 2.3s',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        read: true,
        actionable: false,
        metadata: { executionId: 'ai-exec-789' }
      },
      {
        id: '3',
        type: 'workflow_failed',
        priority: 'high',
        title: 'Workflow Execution Failed',
        message: 'API call node failed with timeout error',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        actionable: true,
        metadata: { workflowId: 'wf-456', executionId: 'exec-101' }
      },
      {
        id: '4',
        type: 'approval_required',
        priority: 'critical',
        title: 'Approval Required',
        message: 'Production deployment requires your approval',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        read: false,
        actionable: true,
        metadata: { workflowId: 'wf-789', projectId: 'proj-202' }
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filter === 'unread') return !notification.read;
      if (filter === 'actionable') return notification.actionable;
      return true;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: TaskNotification['type'], priority: TaskNotification['priority']) => {
    if (priority === 'critical') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (type === 'workflow_failed') return <X className="w-5 h-5 text-red-500" />;
    if (type === 'workflow_completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (type === 'ai_execution') return <Clock className="w-5 h-5 text-blue-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getPriorityColor = (priority: TaskNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = (notification: TaskNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    onMarkAsRead?.(notificationId);
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    onDismiss?.(notificationId);
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="actionable">Actionable</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type, notification.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>

                        {notification.actionable && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Action Required
                          </span>
                        )}
                      </div>

                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
