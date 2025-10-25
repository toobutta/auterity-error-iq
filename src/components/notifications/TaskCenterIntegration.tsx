import React, { useState, useEffect, useCallback } from 'react';
import { TaskCenter } from './TaskCenter';
import { notificationIntegration, StudioNotification } from '../../services/notificationIntegration';
import { taskManagement, StudioTask } from '../../services/taskManagement';

interface TaskCenterIntegrationProps {
  workspaceId?: string;
  projectId?: string;
  userId: string;
}

export const TaskCenterIntegration: React.FC<TaskCenterIntegrationProps> = ({
  workspaceId,
  projectId,
  userId,
}) => {
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const [tasks, setTasks] = useState<StudioTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadTasks();
  }, [workspaceId, projectId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribeNotifications = notificationIntegration.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      unsubscribeNotifications();
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const notificationData = await notificationIntegration.getNotifications({
        workspace_id: workspaceId,
        project_id: projectId,
        limit: 50,
      });
      setNotifications(notificationData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [workspaceId, projectId]);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const taskData = await taskManagement.getTasks({
        workspace_id: workspaceId,
        project_id: projectId,
        status: ['pending', 'running'],
        limit: 20,
      });
      setTasks(taskData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId]);

  const handleNotificationClick = useCallback(async (notification: StudioNotification) => {
    // Handle different notification types
    switch (notification.type) {
      case 'workflow_completed':
      case 'workflow_failed':
        // Navigate to workflow execution details
        if (notification.metadata?.executionId) {
          window.open(`/executions/${notification.metadata.executionId}`, '_blank');
        }
        break;

      case 'ai_execution':
        // Navigate to AI execution details
        if (notification.metadata?.executionId) {
          window.open(`/ai-executions/${notification.metadata.executionId}`, '_blank');
        }
        break;

      case 'approval_required':
        // Navigate to approval workflow
        if (notification.metadata?.workflowId) {
          window.open(`/workflows/${notification.metadata.workflowId}/approve`, '_blank');
        }
        break;

      default:
        console.log('Notification clicked:', notification);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationIntegration.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleDismiss = useCallback(async (notificationId: string) => {
    try {
      await notificationIntegration.dismissNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, []);

  // Transform notifications for TaskCenter component
  const taskCenterNotifications = notifications.map(notification => ({
    id: notification.id,
    type: mapNotificationType(notification.type),
    title: notification.title,
    message: notification.message,
    duration: undefined, // Use undefined for persistent notifications
    persistent: true,
    actions: getNotificationActions(notification),
  }));

  return (
    <div className="task-center-integration">
      <TaskCenter
        notifications={taskCenterNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleMarkAsRead}
        onDismiss={handleDismiss}
      />

      {/* Task Status Summary */}
      <div className="task-summary mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Active Tasks</h3>
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading tasks...</div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.status === 'running' ? 'bg-blue-500' :
                    task.status === 'pending' ? 'bg-yellow-500' :
                    task.status === 'completed' ? 'bg-green-500' :
                    'bg-red-500'
                  }`} />
                  <span className="text-gray-700">{task.title}</span>
                </div>
                <span className="text-xs text-gray-500 capitalize">
                  {task.status}
                </span>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-sm text-gray-500">No active tasks</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function mapNotificationType(type: StudioNotification['type']): 'success' | 'error' | 'warning' | 'info' {
  switch (type) {
    case 'workflow_completed':
    case 'ai_execution':
      return 'success';
    case 'workflow_failed':
      return 'error';
    case 'approval_required':
      return 'warning';
    default:
      return 'info';
  }
}

function getNotificationActions(notification: StudioNotification): Array<{
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}> {
  const actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }> = [];

  switch (notification.type) {
    case 'workflow_failed':
      actions.push({
        label: 'Retry',
        onClick: () => {
          if (notification.metadata?.workflowId) {
            // Trigger workflow retry
            console.log('Retrying workflow:', notification.metadata.workflowId);
          }
        },
        variant: 'primary',
      });
      break;

    case 'approval_required':
      actions.push({
        label: 'Review',
        onClick: () => {
          if (notification.metadata?.workflowId) {
            window.open(`/workflows/${notification.metadata.workflowId}/approve`, '_blank');
          }
        },
        variant: 'primary',
      });
      break;

    case 'workflow_completed':
      actions.push({
        label: 'View Results',
        onClick: () => {
          if (notification.metadata?.executionId) {
            window.open(`/executions/${notification.metadata.executionId}`, '_blank');
          }
        },
        variant: 'secondary',
      });
      break;
  }

  return actions;
}

export default TaskCenterIntegration;
