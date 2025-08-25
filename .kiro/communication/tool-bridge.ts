export interface ToolCommunicationBridge {
  sendMessage(
    from: ToolType,
    to: ToolType,
    message: ToolMessage,
  ): Promise<void>;
  receiveMessage(toolType: ToolType): Promise<ToolMessage[]>;
  establishChannel(
    tool1: ToolType,
    tool2: ToolType,
  ): Promise<CommunicationChannel>;
  closeChannel(channelId: string): Promise<void>;
}

export interface ToolMessage {
  id: string;
  from: ToolType;
  to: ToolType;
  type: MessageType;
  content: MessageContent;
  timestamp: Date;
  priority: "low" | "medium" | "high" | "critical";
  context: SharedContext;
}

export type ToolType = "kiro" | "cline" | "amazon-q";
export type MessageType =
  | "handoff"
  | "status"
  | "error"
  | "solution"
  | "completion";

export interface CommunicationChannel {
  id: string;
  tool1: ToolType;
  tool2: ToolType;
  establishedAt: Date;
  isActive: boolean;
}

export interface MessageContent {
  subject: string;
  data: any;
  metadata?: Record<string, any>;
}

export interface SharedContext {
  taskId: string;
  files: FileContext[];
  errors: ErrorContext[];
  solutions: SolutionContext[];
  progress: ProgressContext;
  metadata: Record<string, any>;
}

export interface FileContext {
  path: string;
  content: string;
  changes: FileChange[];
  relevance: "high" | "medium" | "low";
}

export interface ErrorContext {
  type: string;
  message: string;
  stack?: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
}

export interface SolutionContext {
  id: string;
  description: string;
  implementation: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

export interface ProgressContext {
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  estimatedCompletion: Date;
}

export interface FileChange {
  type: "added" | "modified" | "deleted";
  path: string;
  content?: string;
}

// Implementation class
export class ToolCommunicationBridgeImpl implements ToolCommunicationBridge {
  private channels: Map<string, CommunicationChannel> = new Map();
  private messageQueue: MessageQueue;

  constructor(messageQueue: MessageQueue) {
    this.messageQueue = messageQueue;
  }

  async sendMessage(
    from: ToolType,
    to: ToolType,
    message: ToolMessage,
  ): Promise<void> {
    await this.messageQueue.enqueue(message);
  }

  async receiveMessage(toolType: ToolType): Promise<ToolMessage[]> {
    const messages: ToolMessage[] = [];
    let message = await this.messageQueue.dequeue(toolType);

    while (message) {
      messages.push(message);
      message = await this.messageQueue.dequeue(toolType);
    }

    return messages;
  }

  async establishChannel(
    tool1: ToolType,
    tool2: ToolType,
  ): Promise<CommunicationChannel> {
    const channelId = `${tool1}-${tool2}-${Date.now()}`;
    const channel: CommunicationChannel = {
      id: channelId,
      tool1,
      tool2,
      establishedAt: new Date(),
      isActive: true,
    };

    this.channels.set(channelId, channel);
    return channel;
  }

  async closeChannel(channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.isActive = false;
    }
  }

  getChannel(channelId: string): CommunicationChannel | undefined {
    return this.channels.get(channelId);
  }
}

// Message Queue Interface
export interface MessageQueue {
  enqueue(message: ToolMessage): Promise<void>;
  dequeue(toolType: ToolType): Promise<ToolMessage | null>;
  peek(toolType: ToolType): Promise<ToolMessage | null>;
  getQueueLength(toolType: ToolType): Promise<number>;
  clear(toolType: ToolType): Promise<void>;
}
