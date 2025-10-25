import { apiClient } from './api';

// Types that align with existing Auterity task system
export interface StudioTask {
  id: string;
  type: 'workflow_execution' | 'ai_processing' | 'data_import' | 'validation' | 'deployment';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  progress?: number; // 0-100
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  estimated_duration?: number; // in seconds
  metadata: Record<string, any>;
  user_id: string;
  workspace_id?: string;
  project_id?: string;
  result?: any;
  error?: string;
}

export interface TaskFilter {
  type?: string[];
  status?: string[];
  priority?: string[];
  user_id?: string;
  workspace_id?: string;
  project_id?: string;
  limit?: number;
  offset?: number;
}

export interface TaskQueue {
  id: string;
  name: string;
  description: string;
  concurrency: number;
  active_tasks: number;
  queued_tasks: number;
  completed_today: number;
  failed_today: number;
}

class TaskManagementService {
  private taskCallbacks: Map<string, ((task: StudioTask) => void)[]> = new Map();
  private pollingInterval?: NodeJS.Timeout;

  constructor() {
    this.startPolling();
  }

  private startPolling() {
    // Poll for task updates every 5 seconds
    this.pollingInterval = setInterval(async () => {
      await this.pollTaskUpdates();
    }, 5000);
  }

  private async pollTaskUpdates() {
    try {
      const activeTasks = await this.getTasks({
        status: ['running', 'pending'],
        limit: 50
      });

      for (const task of activeTasks) {
        this.notifyTaskCallbacks(task.id, task);
      }
    } catch (error) {
      console.error('Failed to poll task updates:', error);
    }
  }

  private notifyTaskCallbacks(taskId: string, task: StudioTask) {
    const callbacks = this.taskCallbacks.get(taskId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(task);
        } catch (error) {
          console.error('Error in task callback:', error);
        }
      });
    }
  }

  // Public API methods
  async createTask(
    type: StudioTask['type'],
    title: string,
    metadata: Record<string, any> = {},
    options: {
      priority?: StudioTask['priority'];
      estimated_duration?: number;
      workspace_id?: string;
      project_id?: string;
    } = {}
  ): Promise<StudioTask> {
    try {
      // Create task via existing Auterity task system (Celery)
      const response = await apiClient.createTask?.({
        type,
        title,
        priority: options.priority || 'medium',
        estimated_duration: options.estimated_duration,
        metadata,
        workspace_id: options.workspace_id,
        project_id: options.project_id,
      }) || await this.createTaskAPI(type, title, metadata, options);

      const task = this.transformTaskResponse(response);
      return task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  private async createTaskAPI(
    type: StudioTask['type'],
    title: string,
    metadata: Record<string, any>,
    options: any
  ): Promise<any> {
    // Fallback implementation - would integrate with actual task creation API
    const taskId = crypto.randomUUID();

    return {
      id: taskId,
      type,
      status: 'pending',
      priority: options.priority || 'medium',
      title,
      metadata,
      created_at: new Date().toISOString(),
      workspace_id: options.workspace_id,
      project_id: options.project_id,
      estimated_duration: options.estimated_duration,
    };
  }

  async getTasks(filter?: TaskFilter): Promise<StudioTask[]> {
    try {
      // Get tasks from existing Auterity task system
      const response = await apiClient.getTasks?.(filter) ||
                      await this.getTasksAPI(filter);

      return response.map(this.transformTaskResponse);
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  private async getTasksAPI(filter?: TaskFilter): Promise<any[]> {
    // Fallback implementation
    // In real implementation, this would call the existing task management API
    return [];
  }

  async getTask(taskId: string): Promise<StudioTask | null> {
    try {
      const response = await apiClient.getTask?.(taskId) ||
                      await this.getTaskAPI(taskId);

      return response ? this.transformTaskResponse(response) : null;
    } catch (error) {
      console.error('Failed to get task:', error);
      return null;
    }
  }

  private async getTaskAPI(taskId: string): Promise<any | null> {
    // Fallback implementation
    return null;
  }

  async cancelTask(taskId: string): Promise<void> {
    try {
      await apiClient.cancelTask?.(taskId) ||
            await this.cancelTaskAPI(taskId);
    } catch (error) {
      console.error('Failed to cancel task:', error);
      throw error;
    }
  }

  private async cancelTaskAPI(taskId: string): Promise<void> {
    // Fallback implementation
    console.log(`Cancelling task ${taskId}`);
  }

  async retryTask(taskId: string): Promise<void> {
    try {
      await apiClient.retryTask?.(taskId) ||
            await this.retryTaskAPI(taskId);
    } catch (error) {
      console.error('Failed to retry task:', error);
      throw error;
    }
  }

  private async retryTaskAPI(taskId: string): Promise<void> {
    // Fallback implementation
    console.log(`Retrying task ${taskId}`);
  }

  async getTaskQueues(): Promise<TaskQueue[]> {
    try {
      const response = await apiClient.getTaskQueues?.() ||
                      await this.getTaskQueuesAPI();

      return response.map(this.transformQueueResponse);
    } catch (error) {
      console.error('Failed to get task queues:', error);
      return [];
    }
  }

  private async getTaskQueuesAPI(): Promise<any[]> {
    // Fallback implementation - would return mock queue data
    return [
      {
        id: 'celery',
        name: 'Celery Default Queue',
        description: 'Default task processing queue',
        concurrency: 4,
        active_tasks: 2,
        queued_tasks: 5,
        completed_today: 127,
        failed_today: 3,
      },
      {
        id: 'ai-queue',
        name: 'AI Processing Queue',
        description: 'High-priority AI function processing',
        concurrency: 2,
        active_tasks: 1,
        queued_tasks: 3,
        completed_today: 89,
        failed_today: 1,
      }
    ];
  }

  private transformTaskResponse(response: any): StudioTask {
    return {
      id: response.id,
      type: response.type || 'workflow_execution',
      status: response.status || 'pending',
      priority: response.priority || 'medium',
      title: response.title || 'Task',
      description: response.description,
      progress: response.progress,
      created_at: new Date(response.created_at || Date.now()),
      started_at: response.started_at ? new Date(response.started_at) : undefined,
      completed_at: response.completed_at ? new Date(response.completed_at) : undefined,
      estimated_duration: response.estimated_duration,
      metadata: response.metadata || {},
      user_id: response.user_id || '',
      workspace_id: response.workspace_id,
      project_id: response.project_id,
      result: response.result,
      error: response.error,
    };
  }

  private transformQueueResponse(response: any): TaskQueue {
    return {
      id: response.id,
      name: response.name || 'Task Queue',
      description: response.description || '',
      concurrency: response.concurrency || 1,
      active_tasks: response.active_tasks || 0,
      queued_tasks: response.queued_tasks || 0,
      completed_today: response.completed_today || 0,
      failed_today: response.failed_today || 0,
    };
  }

  // Real-time task monitoring
  onTaskUpdate(taskId: string, callback: (task: StudioTask) => void): () => void {
    if (!this.taskCallbacks.has(taskId)) {
      this.taskCallbacks.set(taskId, []);
    }
    this.taskCallbacks.get(taskId)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.taskCallbacks.get(taskId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.taskCallbacks.delete(taskId);
        }
      }
    };
  }

  // Bulk operations
  async cancelMultipleTasks(taskIds: string[]): Promise<void> {
    const promises = taskIds.map(id => this.cancelTask(id));
    await Promise.allSettled(promises);
  }

  async retryMultipleTasks(taskIds: string[]): Promise<void> {
    const promises = taskIds.map(id => this.retryTask(id));
    await Promise.allSettled(promises);
  }

  // Task statistics
  async getTaskStats(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    average_duration: number;
    by_type: Record<string, number>;
    by_status: Record<string, number>;
  }> {
    try {
      const tasks = await this.getTasks({ limit: 1000 });

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const failedTasks = tasks.filter(t => t.status === 'failed');

      const averageDuration = completedTasks.length > 0
        ? completedTasks.reduce((sum, task) => {
            if (task.started_at && task.completed_at) {
              return sum + (task.completed_at.getTime() - task.started_at.getTime());
            }
            return sum;
          }, 0) / completedTasks.length / 1000 // Convert to seconds
        : 0;

      return {
        total_tasks: tasks.length,
        completed_tasks: completedTasks.length,
        failed_tasks: failedTasks.length,
        average_duration: averageDuration,
        by_type: tasks.reduce((acc, task) => {
          acc[task.type] = (acc[task.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_status: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Failed to get task stats:', error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        average_duration: 0,
        by_type: {},
        by_status: {},
      };
    }
  }

  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.taskCallbacks.clear();
  }
}

// Export singleton instance
export const taskManagement = new TaskManagementService();

// Helper functions for common task patterns
export const createWorkflowExecutionTask = (
  workflowId: string,
  inputData: any,
  options?: { priority?: StudioTask['priority']; workspace_id?: string; project_id?: string }
): Promise<StudioTask> => {
  return taskManagement.createTask(
    'workflow_execution',
    `Execute workflow ${workflowId}`,
    {
      workflow_id: workflowId,
      input_data: inputData,
    },
    options
  );
};

export const createAIProcessingTask = (
  functionName: string,
  parameters: Record<string, any>,
  options?: { priority?: StudioTask['priority']; workspace_id?: string; project_id?: string }
): Promise<StudioTask> => {
  return taskManagement.createTask(
    'ai_processing',
    `AI function: ${functionName}`,
    {
      function_name: functionName,
      parameters,
    },
    options
  );
};

export const createDataImportTask = (
  source: string,
  destination: string,
  options?: { priority?: StudioTask['priority']; workspace_id?: string; project_id?: string }
): Promise<StudioTask> => {
  return taskManagement.createTask(
    'data_import',
    `Import data from ${source}`,
    {
      source,
      destination,
    },
    options
  );
};
