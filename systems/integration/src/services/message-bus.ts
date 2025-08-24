import { Connection, Channel, connect } from 'amqplib';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  type: string;
  source: string;
  destination: string;
  payload: any;
  timestamp: string;
  correlationId?: string;
  headers?: Record<string, any>;
}

export interface MessageHandler {
  (message: Message): Promise<void> | void;
}

export class MessageBus extends EventEmitter {
  private connection?: Connection;
  private channel?: Channel;
  private isConnected = false;
  private handlers = new Map<string, MessageHandler[]>();
  private queues = new Set<string>();

  constructor(
    private url: string = process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    private exchange: string = 'auterity.integration'
  ) {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this.connection = await connect(this.url);
      this.channel = await this.connection.createChannel();

      // Create exchange
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      this.isConnected = true;
      console.log('Message bus initialized successfully');

      // Setup error handling
      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
        this.isConnected = false;
        this.emit('connection-error', error);
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.isConnected = false;
        this.emit('connection-closed');
      });

    } catch (error) {
      console.error('Failed to initialize message bus:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('Message bus disconnected');
    } catch (error) {
      console.error('Error disconnecting message bus:', error);
    }
  }

  async publish(
    routingKey: string,
    message: any,
    source: string,
    headers?: Record<string, any>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Message bus not connected');
    }

    const fullMessage: Message = {
      id: uuidv4(),
      type: routingKey,
      source,
      destination: '*',
      payload: message,
      timestamp: new Date().toISOString(),
      headers
    };

    const messageBuffer = Buffer.from(JSON.stringify(fullMessage));

    await this.channel.publish(this.exchange, routingKey, messageBuffer, {
      persistent: true,
      headers
    });

    console.log(`Published message: ${routingKey} from ${source}`);
    this.emit('message-published', fullMessage);
  }

  async subscribe(
    routingKey: string,
    handler: MessageHandler,
    queueName?: string
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Message bus not connected');
    }

    const queue = queueName || `queue.${routingKey}.${Date.now()}`;

    // Assert queue
    await this.channel.assertQueue(queue, { durable: true });

    // Bind queue to exchange
    await this.channel.bindQueue(queue, this.exchange, routingKey);

    // Start consuming
    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const message: Message = JSON.parse(msg.content.toString());

          // Add correlation ID if not present
          if (!message.correlationId) {
            message.correlationId = message.id;
          }

          await handler(message);

          this.channel!.ack(msg);
          this.emit('message-processed', message);

        } catch (error) {
          console.error('Error processing message:', error);
          this.channel!.nack(msg, false, false); // Don't requeue
          this.emit('message-error', { message: msg, error });
        }
      }
    });

    // Store handler for cleanup
    if (!this.handlers.has(routingKey)) {
      this.handlers.set(routingKey, []);
    }
    this.handlers.get(routingKey)!.push(handler);
    this.queues.add(queue);

    console.log(`Subscribed to: ${routingKey} on queue: ${queue}`);
  }

  async request(
    routingKey: string,
    payload: any,
    source: string,
    timeout: number = 30000
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const correlationId = uuidv4();
      const replyQueue = `reply.${correlationId}`;

      // Setup timeout
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        if (this.queues.has(replyQueue)) {
          this.channel?.deleteQueue(replyQueue);
          this.queues.delete(replyQueue);
        }
      };

      // Setup reply handler
      this.subscribe(replyQueue, (message: Message) => {
        if (message.correlationId === correlationId) {
          cleanup();
          resolve(message.payload);
        }
      }, replyQueue).then(() => {
        // Publish request
        this.publish(routingKey, payload, source, {
          correlationId,
          replyTo: replyQueue
        });
      }).catch(reject);
    });
  }

  async broadcast(
    routingKey: string,
    message: any,
    source: string,
    excludeSelf: boolean = false
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('Message bus not connected');
    }

    const fullMessage: Message = {
      id: uuidv4(),
      type: routingKey,
      source,
      destination: 'broadcast',
      payload: message,
      timestamp: new Date().toISOString(),
      headers: { broadcast: true, excludeSelf }
    };

    const messageBuffer = Buffer.from(JSON.stringify(fullMessage));

    await this.channel.publish(this.exchange, routingKey, messageBuffer, {
      persistent: false
    });

    console.log(`Broadcast message: ${routingKey} from ${source}`);
    this.emit('message-broadcast', fullMessage);
  }

  get isHealthy(): boolean {
    return this.isConnected;
  }

  get connectionStatus(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  async getQueueInfo(): Promise<any> {
    if (!this.channel) return {};

    try {
      const queues = Array.from(this.queues);
      const queueInfo: any = {};

      for (const queue of queues) {
        const result = await this.channel.assertQueue(queue, { passive: true });
        queueInfo[queue] = {
          messageCount: result.messageCount,
          consumerCount: result.consumerCount
        };
      }

      return queueInfo;
    } catch (error) {
      console.error('Error getting queue info:', error);
      return {};
    }
  }

  // Add missing methods for integration
  async getStatus(): Promise<any> {
    return {
      status: this.isConnected ? 'healthy' : 'disconnected',
      connection: this.connectionStatus,
      queues: this.queues.size,
      handlers: this.handlers.size,
      timestamp: new Date().toISOString()
    };
  }

  async sendMessage(target: string, message: any, metadata?: any): Promise<string> {
    const messageId = uuidv4();
    await this.publish(target, message, 'integration', metadata);
    return messageId;
  }
}
