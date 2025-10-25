import * as amqp from "amqplib";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

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
  (routingKey: string, message: Message): Promise<void> | void;
}

export class MessageBus extends EventEmitter {
  private connection?: amqp.Connection;
  private channel?: amqp.Channel;
  private isConnected = false;
  private handlers = new Map<string, MessageHandler[]>();
  private queues = new Set<string>();
  private inMemoryMessages = new Map<string, Message[]>();
  private useInMemoryFallback = false;

  constructor(
    private url: string = process.env.RABBITMQ_URL || "amqp://localhost:5672",
    private exchange: string = "auterity.integration",
  ) {
    super();
  }

  async initialize(): Promise<void> {
    try {
      this.connection = (await amqp.connect(this.url)) as any;
      this.channel = await (this.connection as any).createChannel();

      // Create exchange
      await (this.channel as any).assertExchange(this.exchange, "topic", {
        durable: true,
      });

      this.isConnected = true;

      // Setup error handling
      (this.connection as any).on("error", (error: any) => {
        this.isConnected = false;
        this.emit("connection-error", error);
      });

      (this.connection as any).on("close", () => {
        this.isConnected = false;
        this.emit("connection-closed");
      });
    } catch (error) {
      this.useInMemoryFallback = true;
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await (this.channel as any).close();
      }
      if (this.connection) {
        await (this.connection as any).close();
      }
      this.isConnected = false;
    } catch (error) {
    }
  }

  async publish(
    routingKey: string,
    message: any,
    source: string,
    headers?: Record<string, any>,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Message bus not connected");
    }

    const fullMessage: Message = {
      id: uuidv4(),
      type: routingKey,
      source,
      destination: "*",
      payload: message,
      timestamp: new Date().toISOString(),
      headers,
    };

    if (this.useInMemoryFallback) {
      // In-memory mode
      const messages = this.inMemoryMessages.get(routingKey) || [];
      messages.push(fullMessage);
      this.inMemoryMessages.set(routingKey, messages);

      // Trigger handlers for this routing key
      const handlers = this.handlers.get(routingKey) || [];
      for (const handler of handlers) {
        try {
          await handler(routingKey, fullMessage);
        } catch (error) {
        }
      }

    } else {
      // RabbitMQ mode
      const messageBuffer = Buffer.from(JSON.stringify(fullMessage));
      await (this.channel as any).publish(
        this.exchange,
        routingKey,
        messageBuffer,
        {
          persistent: true,
          headers,
        },
      );
    }

    this.emit("message-published", fullMessage);
  }

  async subscribe(
    routingKey: string,
    handler: MessageHandler,
    queueName?: string,
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Message bus not connected");
    }

    const queue = queueName || `queue.${routingKey}.${Date.now()}`;

    if (this.useInMemoryFallback) {
      // In-memory mode: just store the handler
      if (!this.handlers.has(routingKey)) {
        this.handlers.set(routingKey, []);
      }
      this.handlers.get(routingKey)!.push(handler);
      this.queues.add(queue);
    } else {
      // RabbitMQ mode
      await (this.channel as any).assertQueue(queue, { durable: true });
      await (this.channel as any).bindQueue(queue, this.exchange, routingKey);

      await (this.channel as any).consume(queue, async (msg: any) => {
        if (msg) {
          try {
            const message: Message = JSON.parse(msg.content.toString());

            // Add correlation ID if not present
            if (!message.correlationId) {
              message.correlationId = message.id;
            }

            await handler(routingKey, message);

            (this.channel as any).ack(msg);
            this.emit("message-processed", message);
          } catch (error) {
            (this.channel as any).nack(msg, false, false); // Don't requeue
            this.emit("message-error", { message: msg, error });
          }
        }
      });

      // Store handler for cleanup
      if (!this.handlers.has(routingKey)) {
        this.handlers.set(routingKey, []);
      }
      this.handlers.get(routingKey)!.push(handler);
      this.queues.add(queue);

    }
  }

  async request(
    routingKey: string,
    payload: any,
    source: string,
    timeout: number = 30000,
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
      this.subscribe(
        replyQueue,
        (routingKey: string, message: Message) => {
          if (message.correlationId === correlationId) {
            cleanup();
            resolve(message.payload);
          }
        },
        replyQueue,
      )
        .then(() => {
          // Publish request
          this.publish(routingKey, payload, source, {
            correlationId,
            replyTo: replyQueue,
          });
        })
        .catch((error) => {

          reject(error);
        });
    });
  }

  async broadcast(
    routingKey: string,
    message: any,
    source: string,
    excludeSelf: boolean = false,
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error("Message bus not connected");
    }

    const fullMessage: Message = {
      id: uuidv4(),
      type: routingKey,
      source,
      destination: "broadcast",
      payload: message,
      timestamp: new Date().toISOString(),
      headers: { broadcast: true, excludeSelf },
    };

    const messageBuffer = Buffer.from(JSON.stringify(fullMessage));

    await this.channel.publish(this.exchange, routingKey, messageBuffer, {
      persistent: false,
    });

    this.emit("message-broadcast", fullMessage);
  }

  get isHealthy(): boolean {
    return this.isConnected;
  }

  get connectionStatus(): string {
    return this.isConnected ? "connected" : "disconnected";
  }

  async getQueueInfo(): Promise<any> {
    if (!this.channel) return {};

    try {
      const queues = Array.from(this.queues);
      const queueInfo: any = {};

      for (const queue of queues) {
        const result = await (this.channel as any).assertQueue(queue, {
          passive: true,
        });
        queueInfo[queue] = {
          messageCount: result.messageCount,
          consumerCount: result.consumerCount,
        };
      }

      return queueInfo;
    } catch (error) {
      return {};
    }
  }

  // Add missing methods for integration
  async getStatus(): Promise<any> {
    return {
      status: this.isConnected ? "healthy" : "disconnected",
      connection: this.connectionStatus,
      queues: this.queues.size,
      handlers: this.handlers.size,
      timestamp: new Date().toISOString(),
    };
  }

  async sendMessage(
    target: string,
    message: any,
    metadata?: any,
  ): Promise<string> {
    const messageId = uuidv4();
    await this.publish(target, message, "integration", metadata);
    return messageId;
  }
}

