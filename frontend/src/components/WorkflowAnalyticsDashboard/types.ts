// WorkflowAnalyticsDashboard component types
export interface WorkflowAnalyticsDashboardData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket message types
export interface WorkflowAnalyticsDashboardWebSocketMessage {
  type: 'update' | 'notification' | 'error';
  payload: any;
  timestamp: Date;
}

