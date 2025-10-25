import { io, Socket } from 'socket.io-client';

export interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  lastActive: Date;
  color: string;
}

export interface WorkflowSession {
  workflowId: string;
  users: UserPresence[];
  isActive: boolean;
  lastModified: Date;
}

export interface CollaborativeAction {
  type: 'node_add' | 'node_update' | 'node_delete' | 'edge_add' | 'edge_update' | 'edge_delete' | 'cursor_move';
  userId: string;
  timestamp: Date;
  data: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Event listeners
  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  connect(workflowId: string, userId: string, username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      this.socket = io(wsUrl, {
        query: { workflowId, userId, username },
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {

        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason: string) => {

        this.handleReconnect(workflowId, userId, username);
      });

      this.socket.on('connect_error', (error: Error) => {

        reject(error);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // User presence events
    this.socket.on('user_joined', (data: UserPresence) => {
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data: { userId: string }) => {
      this.emit('user_left', data);
    });

    this.socket.on('user_presence_update', (data: UserPresence) => {
      this.emit('user_presence_update', data);
    });

    // Collaborative action events
    this.socket.on('collaborative_action', (data: CollaborativeAction) => {
      this.emit('collaborative_action', data);
    });

    // Workflow session events
    this.socket.on('session_update', (data: WorkflowSession) => {
      this.emit('session_update', data);
    });

    // Error handling
    this.socket.on('error', (error) => {

      this.emit('error', error);
    });
  }

  private handleReconnect(workflowId: string, userId: string, username: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {

        this.connect(workflowId, userId, username);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {

      this.emit('max_reconnect_attempts_reached', {});
    }
  }

  // Send collaborative actions
  sendAction(action: Omit<CollaborativeAction, 'userId' | 'timestamp'>) {
    if (!this.socket?.connected) {

      return;
    }

    const fullAction: CollaborativeAction = {
      ...action,
      userId: this.getCurrentUserId(),
      timestamp: new Date(),
    };

    this.socket.emit('collaborative_action', fullAction);
  }

  // Update cursor position
  updateCursor(x: number, y: number) {
    if (!this.socket?.connected) return;

    this.socket.emit('cursor_update', { x, y });
  }

  // Join/leave workflow session
  joinWorkflow(workflowId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('join_workflow', { workflowId });
  }

  leaveWorkflow(workflowId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('leave_workflow', { workflowId });
  }

  // Event listener management
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {

        }
      });
    }
  }

  // Utility methods
  getCurrentUserId(): string {
    // This should be replaced with actual user ID from auth context
    return localStorage.getItem('userId') || 'anonymous';
  }

  getCurrentUsername(): string {
    // This should be replaced with actual username from auth context
    return localStorage.getItem('username') || 'Anonymous User';
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = {};
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;


