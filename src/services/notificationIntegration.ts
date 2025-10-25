import { apiClient } from './api';
import { websocketService } from '../services/websocket';

// Types that align with existing Auterity notification system
export interface StudioNotification {
  id: string;
  type: 'workflow_completed' | 'workflow_failed' | 'ai_execution' | 'system_alert' | 'approval_required';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: Date;
  read: boolean;
  user_id: string;
  workspace_id?: string;
  project_id?: string;
}

export interface NotificationFilter {
  type?: string[];
  priority?: string[];
  read?: boolean;
  workspace_id?: string;
  project_id?: string;
  limit?: number;
  offset?: number;
}

class NotificationIntegrationService {
  private websocketConnected = false;
  private notificationCallbacks: ((notification: StudioNotification) => void)[] = [];

  constructor() {
    this.setupWebSocketIntegration();
  }

  private setupWebSocketIntegration() {
    // Connect to existing WebSocket service for real-time notifications
    websocketService.on('notification', (data: any) => {
      const notification = this.transformNotification(data);
      this.notifyCallbacks(notification);
    });

    websocketService.on('workflow_completed', (data: any) => {
      const notification = this.createWorkflowNotification('completed', data);
      this.notifyCallbacks(notification);
    });

    websocketService.on('workflow_failed', (data: any) => {
      const notification = this.createWorkflowNotification('failed', data);
      this.notifyCallbacks(notification);
    });

    websocketService.on('ai_execution', (data: any) => {
      const notification = this.createAINotification(data);
      this.notifyCallbacks(notification);
    });
  }

  private transformNotification(data: any): StudioNotification {
    return {
      id: data.id || crypto.randomUUID(),
      type: data.type || 'system_alert',
      priority: data.priority || 'medium',
      title: data.title || 'Notification',
      message: data.message || '',
      data: data.data || {},
      timestamp: new Date(data.timestamp || Date.now()),
      read: data.read || false,
      user_id: data.user_id || '',
      workspace_id: data.workspace_id,
      project_id: data.project_id,
    };
  }

  private createWorkflowNotification(status: 'completed' | 'failed', data: any): StudioNotification {
    const priority = status === 'failed' ? 'high' : 'medium';
    const title = `Workflow ${status === 'completed' ? 'Completed' : 'Failed'}`;

    return {
      id: crypto.randomUUID(),
      type: status === 'completed' ? 'workflow_completed' : 'workflow_failed',
      priority,
      title,
      message: data.message || `Workflow execution ${status}`,
      data: {
        workflow_id: data.workflow_id,
        execution_id: data.execution_id,
        duration: data.duration,
        error: data.error,
      },
      timestamp: new Date(),
      read: false,
      user_id: data.user_id || '',
      workspace_id: data.workspace_id,
      project_id: data.project_id,
    };
  }

  private createAINotification(data: any): StudioNotification {
    return {
      id: crypto.randomUUID(),
      type: 'ai_execution',
      priority: 'low',
      title: 'AI Function Completed',
      message: `AI execution completed in ${data.duration || 'unknown time'}`,
      data: {
        function_name: data.function_name,
        execution_id: data.execution_id,
        tokens_used: data.tokens_used,
        cost: data.cost,
      },
      timestamp: new Date(),
      read: false,
      user_id: data.user_id || '',
      workspace_id: data.workspace_id,
      project_id: data.project_id,
    };
  }

  private notifyCallbacks(notification: StudioNotification) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Public API methods
  async getNotifications(filter?: NotificationFilter): Promise<StudioNotification[]> {
    try {
      // Call existing Auterity notification service
      const response = await apiClient.getWorkflowNotifications?.(filter) ||
                      await this.fetchNotificationsFromAPI(filter);

      return response.map(this.transformNotification);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  private async fetchNotificationsFromAPI(filter?: NotificationFilter): Promise<any[]> {
    // Fallback implementation - would integrate with actual API endpoint
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type.join(','));
    if (filter?.priority) params.append('priority', filter.priority.join(','));
    if (filter?.read !== undefined) params.append('read', filter.read.toString());
    if (filter?.workspace_id) params.append('workspace_id', filter.workspace_id);
    if (filter?.project_id) params.append('project_id', filter.project_id);
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.offset) params.append('offset', filter.offset.toString());

    // This would be replaced with actual API call
    return [];
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Call existing Auterity notification service
      await apiClient.markNotificationRead?.(notificationId) ||
            await this.markAsReadAPI(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  private async markAsReadAPI(notificationId: string): Promise<void> {
    // Fallback implementation
    console.log(`Marking notification ${notificationId} as read`);
  }

  async dismissNotification(notificationId: string): Promise<void> {
    try {
      // Call existing Auterity notification service
      await apiClient.dismissNotification?.(notificationId) ||
            await this.dismissNotificationAPI(notificationId);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }

  private async dismissNotificationAPI(notificationId: string): Promise<void> {
    // Fallback implementation
    console.log(`Dismissing notification ${notificationId}`);
  }

  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    try {
      const notifications = await this.getNotifications();

      return {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        by_type: notifications.reduce((acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_priority: notifications.reduce((acc, n) => {
          acc[n.priority] = (acc[n.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { total: 0, unread: 0, by_type: {}, by_priority: {} };
    }
  }

  // Real-time subscription methods
  onNotification(callback: (notification: StudioNotification) => void): () => void {
    this.notificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.notificationCallbacks.indexOf(callback);
      if (index > -1) {
        this.notificationCallbacks.splice(index, 1);
      }
    };
  }

  // Integration with existing WebSocket service
  connectToWorkflow(workflowId: string, userId: string) {
    websocketService.connect(workflowId, userId, 'Workflow Studio User');
  }

  disconnectFromWorkflow(workflowId: string) {
    websocketService.leaveWorkflow(workflowId);
  }

  // Send workflow-related actions through WebSocket
  sendWorkflowAction(action: string, data: any) {
    websocketService.sendAction({
      type: action,
      timestamp: new Date(),
      data
    });
  }
}

// Export singleton instance
export const notificationIntegration = new NotificationIntegrationService();

// Helper functions for common notification patterns
export const createWorkflowNotification = (
  type: 'completed' | 'failed' | 'started',
  workflowId: string,
  executionId: string,
  metadata?: Record<string, any>
): Partial<StudioNotification> => {
  const titles = {
    completed: 'Workflow Completed',
    failed: 'Workflow Failed',
    started: 'Workflow Started'
  };

  const priorities = {
    completed: 'medium' as const,
    failed: 'high' as const,
    started: 'low' as const
  };

  return {
    type: type === 'completed' ? 'workflow_completed' :
          type === 'failed' ? 'workflow_failed' : 'system_alert',
    priority: priorities[type],
    title: titles[type],
    message: `Workflow ${workflowId} ${type}`,
    data: {
      workflow_id: workflowId,
      execution_id: executionId,
      ...metadata
    }
  };
};

export const createAINotification = (
  functionName: string,
  status: 'completed' | 'failed',
  metadata?: Record<string, any>
): Partial<StudioNotification> => {
  return {
    type: 'ai_execution',
    priority: status === 'failed' ? 'high' : 'low',
    title: `AI Function ${status === 'completed' ? 'Completed' : 'Failed'}`,
    message: `${functionName} execution ${status}`,
    data: {
      function_name: functionName,
      status,
      ...metadata
    }
  };
};
