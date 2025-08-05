import { ToolMessage, ToolType } from './tool-bridge';

export interface MessageQueue {
  enqueue(message: ToolMessage): Promise<void>;
  dequeue(toolType: ToolType): Promise<ToolMessage | null>;
  peek(toolType: ToolType): Promise<ToolMessage | null>;
  getQueueLength(toolType: ToolType): Promise<number>;
  clear(toolType: ToolType): Promise<void>;
}

export interface QueueMessage extends ToolMessage {
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
}

export class InMemoryMessageQueue implements MessageQueue {
  private queues: Map<ToolType, QueueMessage[]> = new Map();
  private processing: Map<string, boolean> = new Map();

  constructor() {
    // Initialize queues for each tool type
    this.queues.set('kiro', []);
    this.queues.set('cline', []);
    this.queues.set('amazon-q', []);
  }

  async enqueue(message: ToolMessage): Promise<void> {
    const queueMessage: QueueMessage = {
      ...message,
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date()
    };

    const queue = this.queues.get(message.to);
    if (!queue) {
      throw new Error(`Invalid tool type: ${message.to}`);
    }

    // Insert based on priority (higher priority first)
    const insertIndex = this.findInsertIndex(queue, message.priority);
    queue.splice(insertIndex, 0, queueMessage);
  }

  async dequeue(toolType: ToolType): Promise<ToolMessage | null> {
    const queue = this.queues.get(toolType);
    if (!queue || queue.length === 0) {
      return null;
    }

    const message = queue.shift();
    if (!message) return null;

    // Check if message is being processed
    if (this.processing.has(message.id)) {
      return this.dequeue(toolType); // Skip to next message
    }

    this.processing.set(message.id, true);
    return message;
  }

  async peek(toolType: ToolType): Promise<ToolMessage | null> {
    const queue = this.queues.get(toolType);
    if (!queue || queue.length === 0) {
      return null;
    }
    return queue[0];
  }

  async getQueueLength(toolType: ToolType): Promise<number> {
    const queue = this.queues.get(toolType);
    return queue ? queue.length : 0;
  }

  async clear(toolType: ToolType): Promise<void> {
    const queue = this.queues.get(toolType);
    if (queue) {
      queue.length = 0;
    }
  }

  private findInsertIndex(queue: QueueMessage[], priority: string): number {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const targetPriority = priorityOrder[priority as keyof typeof priorityOrder];

    for (let i = 0; i < queue.length; i++) {
      const currentPriority = priorityOrder[queue[i].priority as keyof typeof priorityOrder];
      if (targetPriority < currentPriority) {
        return i;
      }
    }
    return queue.length;
  }

  markAsProcessed(messageId: string): void {
    this.processing.delete(messageId);
  }

  async retryMessage(message: QueueMessage): Promise<boolean> {
    if (message.retryCount >= message.maxRetries) {
      return false;
    }

    message.retryCount++;
    message.nextRetryAt = new Date(Date.now() + Math.pow(2, message.retryCount) * 1000);
    
    const queue = this.queues.get(message.to);
    if (queue) {
      queue.unshift(message);
    }

    this.processing.delete(message.id);
    return true;
  }
}

// Persistent message queue for production use
export class PersistentMessageQueue implements MessageQueue {
  private storageKey = 'tool-communication-queue';
  
  async enqueue(message: ToolMessage): Promise<void> {
    const messages = await this.getMessages();
    messages.push({
      ...message,
      retryCount: 0,
      maxRetries: 3
    });
    await this.saveMessages(messages);
  }

  async dequeue(toolType: ToolType): Promise<ToolMessage | null> {
    const messages = await this.getMessages();
    const index = messages.findIndex(msg => msg.to === toolType);
    
    if (index === -1) return null;
    
    const message = messages.splice(index, 1)[0];
    await this.saveMessages(messages);
    
    return message;
  }

  async peek(toolType: ToolType): Promise<ToolMessage | null> {
    const messages = await this.getMessages();
    return messages.find(msg => msg.to === toolType) || null;
  }

  async getQueueLength(toolType: ToolType): Promise<number> {
    const messages = await this.getMessages();
    return messages.filter(msg => msg.to === toolType).length;
  }

  async clear(toolType: ToolType): Promise<void> {
    const messages = await this.getMessages();
    const filtered = messages.filter(msg => msg.to !== toolType);
    await this.saveMessages(filtered);
  }

  private async getMessages(): Promise<any[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveMessages(messages: any[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages:', error);
    }
  }
}
