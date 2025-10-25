/**
 * Message Queue Integration Adapter
 * Provides enterprise-grade message queue integration with pub/sub,
 * dead letter queues, and message persistence capabilities
 */

import { connect, Connection, Channel, Message as AMQPMessage } from 'amqplib';
import { Kafka, Producer, Consumer, Message as KafkaMessage } from 'kafkajs';
import { createClient as createRedisClient } from 'redis';
import { IntegrationEndpoint, Message } from '../EnterpriseIntegrationBus';

export interface MessageQueueConfig {
  type: 'rabbitmq' | 'kafka' | 'redis';
  host: string;
  port: number;
  username?: string;
  password?: string;
  vhost?: string;
  ssl?: boolean;
  options?: {
    heartbeat?: number;
    connectionTimeout?: number;
    reconnectionDelay?: number;
  };
}

export interface QueueOperation {
  type: 'publish' | 'consume' | 'ack' | 'nack' | 'purge' | 'declare';
  exchange?: string;
  queue?: string;
  routingKey?: string;
  topic?: string;
  partition?: number;
  message?: any;
  options?: {
    persistent?: boolean;
    ttl?: number;
    priority?: number;
    headers?: Record<string, any>;
    deadLetterExchange?: string;
    deadLetterRoutingKey?: string;
  };
}

export interface ConsumerConfig {
  queue: string;
  exchange?: string;
  routingKey?: string;
  topic?: string;
  groupId?: string;
  options?: {
    prefetch?: number;
    noAck?: boolean;
    exclusive?: boolean;
  };
  handler: (message: Message) => Promise<void>;
}

export class MessageQueueAdapter {
  private config: MessageQueueConfig;
  private rabbitmqConnection?: Connection;
  private rabbitmqChannel?: Channel;
  private kafka?: Kafka;
  private kafkaProducer?: Producer;
  private kafkaConsumer?: Consumer;
  private redisClient?: any;
  private consumers: Map<string, ConsumerConfig> = new Map();
  private isConnected = false;

  constructor(config: MessageQueueConfig) {
    this.config = config;
  }

  /**
   * Initialize message queue connection
   */
  async connect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'rabbitmq':
          await this.connectRabbitMQ();
          break;
        case 'kafka':
          await this.connectKafka();
          break;
        case 'redis':
          await this.connectRedis();
          break;
        default:
          throw new Error(`Unsupported message queue type: ${this.config.type}`);
      }

      this.isConnected = true;

    } catch (error) {
      console.error('Failed to connect to message queue:', error);
      throw error;
    }
  }

  /**
   * Execute message queue operation
   */
  async execute(operation: QueueOperation): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Message queue not connected');
    }

    try {
      switch (this.config.type) {
        case 'rabbitmq':
          return await this.executeRabbitMQ(operation);
        case 'kafka':
          return await this.executeKafka(operation);
        case 'redis':
          return await this.executeRedis(operation);
        default:
          throw new Error(`Unsupported message queue type: ${this.config.type}`);
      }

    } catch (error) {
      console.error('Message queue operation failed:', error);
      throw error;
    }
  }

  /**
   * Register a message consumer
   */
  async registerConsumer(config: ConsumerConfig): Promise<string> {
    const consumerId = `consumer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.consumers.set(consumerId, config);

    try {
      switch (this.config.type) {
        case 'rabbitmq':
          await this.registerRabbitMQConsumer(consumerId, config);
          break;
        case 'kafka':
          await this.registerKafkaConsumer(consumerId, config);
          break;
        case 'redis':
          await this.registerRedisConsumer(consumerId, config);
          break;
      }

      return consumerId;

    } catch (error) {
      this.consumers.delete(consumerId);
      console.error('Failed to register consumer:', error);
      throw error;
    }
  }

  /**
   * Publish a message to the integration bus
   */
  async publishToBus(message: Message, routingKey?: string): Promise<void> {
    const operation: QueueOperation = {
      type: 'publish',
      exchange: 'auterity.integration',
      routingKey: routingKey || message.destination || 'default',
      message: {
        id: message.id,
        correlationId: message.correlationId,
        timestamp: message.timestamp.toISOString(),
        headers: message.headers,
        body: message.body,
        source: message.source,
        priority: message.priority
      },
      options: {
        persistent: true,
        headers: message.headers,
        priority: message.priority === 'high' ? 10 : message.priority === 'critical' ? 9 : 5
      }
    };

    await this.execute(operation);
  }

  /**
   * Close message queue connection
   */
  async disconnect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'rabbitmq':
          if (this.rabbitmqChannel) {
            await this.rabbitmqChannel.close();
          }
          if (this.rabbitmqConnection) {
            await this.rabbitmqConnection.close();
          }
          break;

        case 'kafka':
          if (this.kafkaProducer) {
            await this.kafkaProducer.disconnect();
          }
          if (this.kafkaConsumer) {
            await this.kafkaConsumer.disconnect();
          }
          break;

        case 'redis':
          if (this.redisClient) {
            await this.redisClient.disconnect();
          }
          break;
      }

      this.isConnected = false;
      this.consumers.clear();

    } catch (error) {
      console.error('Failed to disconnect from message queue:', error);
      throw error;
    }
  }

  // Private methods for different message queue types

  private async connectRabbitMQ(): Promise<void> {
    const connectionString = `amqp${this.config.ssl ? 's' : ''}://${this.config.username || 'guest'}:${this.config.password || 'guest'}@${this.config.host}:${this.config.port}${this.config.vhost || '/'}`;

    this.rabbitmqConnection = await connect(connectionString);
    this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();

    // Declare default exchange
    await this.rabbitmqChannel.assertExchange('auterity.integration', 'topic', {
      durable: true
    });

    // Declare dead letter exchange
    await this.rabbitmqChannel.assertExchange('auterity.dlx', 'direct', {
      durable: true
    });

    // Declare dead letter queue
    await this.rabbitmqChannel.assertQueue('auterity.dead-letter', {
      durable: true
    });

    await this.rabbitmqChannel.bindQueue('auterity.dead-letter', 'auterity.dlx', 'dead-letter');
  }

  private async connectKafka(): Promise<void> {
    this.kafka = new Kafka({
      clientId: 'auterity-integration',
      brokers: [`${this.config.host}:${this.config.port}`],
      ssl: this.config.ssl,
      sasl: this.config.username ? {
        mechanism: 'plain',
        username: this.config.username,
        password: this.config.password || ''
      } : undefined,
      connectionTimeout: this.config.options?.connectionTimeout || 30000,
      requestTimeout: 60000,
      retry: {
        initialRetryTime: this.config.options?.reconnectionDelay || 100,
        retries: 8
      }
    });

    this.kafkaProducer = this.kafka.producer();
    await this.kafkaProducer.connect();
  }

  private async connectRedis(): Promise<void> {
    this.redisClient = createRedisClient({
      url: `redis://${this.config.host}:${this.config.port}`,
      password: this.config.password,
      database: 0,
    });

    await this.redisClient.connect();
  }

  private async executeRabbitMQ(operation: QueueOperation): Promise<any> {
    if (!this.rabbitmqChannel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    switch (operation.type) {
      case 'publish':
        if (!operation.exchange || !operation.routingKey) {
          throw new Error('Exchange and routing key required for publish operation');
        }

        await this.rabbitmqChannel.assertExchange(operation.exchange, 'topic', {
          durable: true
        });

        await this.rabbitmqChannel.publish(
          operation.exchange,
          operation.routingKey,
          Buffer.from(JSON.stringify(operation.message)),
          {
            persistent: operation.options?.persistent !== false,
            messageId: operation.message?.id,
            correlationId: operation.message?.correlationId,
            timestamp: Date.now(),
            userId: operation.message?.userId,
            headers: {
              ...operation.options?.headers,
              priority: operation.options?.priority || 5
            },
            expiration: operation.options?.ttl?.toString()
          }
        );
        break;

      case 'declare':
        if (operation.queue) {
          await this.rabbitmqChannel.assertQueue(operation.queue, {
            durable: true,
            arguments: {
              'x-message-ttl': operation.options?.ttl,
              'x-dead-letter-exchange': operation.options?.deadLetterExchange,
              'x-dead-letter-routing-key': operation.options?.deadLetterRoutingKey,
              'x-max-priority': 10
            }
          });
        }
        break;

      case 'purge':
        if (operation.queue) {
          const result = await this.rabbitmqChannel.purgeQueue(operation.queue);
          return result.messageCount;
        }
        break;

      default:
        throw new Error(`Unsupported RabbitMQ operation: ${operation.type}`);
    }
  }

  private async executeKafka(operation: QueueOperation): Promise<any> {
    if (!this.kafkaProducer) {
      throw new Error('Kafka producer not initialized');
    }

    switch (operation.type) {
      case 'publish':
        if (!operation.topic) {
          throw new Error('Topic required for Kafka publish operation');
        }

        await this.kafkaProducer.send({
          topic: operation.topic,
          messages: [{
            key: operation.message?.id,
            value: JSON.stringify(operation.message),
            partition: operation.partition,
            headers: operation.options?.headers,
            timestamp: Date.now()
          }]
        });
        break;

      default:
        throw new Error(`Unsupported Kafka operation: ${operation.type}`);
    }
  }

  private async executeRedis(operation: QueueOperation): Promise<any> {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }

    switch (operation.type) {
      case 'publish':
        if (!operation.queue) {
          throw new Error('Queue required for Redis publish operation');
        }

        await this.redisClient.xAdd(
          operation.queue,
          '*',
          {
            id: operation.message?.id,
            correlationId: operation.message?.correlationId,
            timestamp: operation.message?.timestamp,
            body: JSON.stringify(operation.message?.body),
            headers: JSON.stringify(operation.message?.headers)
          }
        );
        break;

      case 'consume':
        if (!operation.queue) {
          throw new Error('Queue required for Redis consume operation');
        }

        const result = await this.redisClient.xRead(
          { key: operation.queue, id: '0' },
          { COUNT: 1 }
        );

        if (result && result.length > 0) {
          const message = result[0].messages[0];
          return {
            id: message.id,
            body: JSON.parse(message.message.body || '{}'),
            headers: JSON.parse(message.message.headers || '{}')
          };
        }
        break;

      default:
        throw new Error(`Unsupported Redis operation: ${operation.type}`);
    }
  }

  private async registerRabbitMQConsumer(consumerId: string, config: ConsumerConfig): Promise<void> {
    if (!this.rabbitmqChannel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    // Declare queue
    await this.rabbitmqChannel.assertQueue(config.queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'auterity.dlx',
        'x-dead-letter-routing-key': 'dead-letter'
      }
    });

    // Bind queue to exchange if specified
    if (config.exchange && config.routingKey) {
      await this.rabbitmqChannel.bindQueue(config.queue, config.exchange, config.routingKey);
    }

    // Set prefetch
    if (config.options?.prefetch) {
      await this.rabbitmqChannel.prefetch(config.options.prefetch);
    }

    // Consume messages
    await this.rabbitmqChannel.consume(config.queue, async (msg) => {
      if (!msg) return;

      try {
        const messageBody = JSON.parse(msg.content.toString());
        const message: Message = {
          id: messageBody.id || msg.properties.messageId || consumerId,
          correlationId: messageBody.correlationId || msg.properties.correlationId,
          timestamp: new Date(messageBody.timestamp || msg.properties.timestamp || Date.now()),
          headers: { ...messageBody.headers, ...msg.properties.headers },
          body: messageBody.body,
          source: messageBody.source || 'unknown',
          destination: config.queue,
          priority: this.mapPriority(msg.properties.priority),
          retryCount: 0,
          maxRetries: 3
        };

        await config.handler(message);

        if (!config.options?.noAck) {
          this.rabbitmqChannel!.ack(msg);
        }

      } catch (error) {
        console.error('Message handler error:', error);

        if (!config.options?.noAck) {
          // Send to dead letter queue
          this.rabbitmqChannel!.nack(msg, false, false);
        }
      }
    }, {
      noAck: config.options?.noAck || false,
      exclusive: config.options?.exclusive || false
    });
  }

  private async registerKafkaConsumer(consumerId: string, config: ConsumerConfig): Promise<void> {
    if (!this.kafka) {
      throw new Error('Kafka client not initialized');
    }

    this.kafkaConsumer = this.kafka.consumer({
      groupId: config.groupId || 'auterity-integration'
    });

    await this.kafkaConsumer.connect();

    if (!config.topic) {
      throw new Error('Topic required for Kafka consumer');
    }

    await this.kafkaConsumer.subscribe({
      topic: config.topic,
      fromBeginning: true
    });

    await this.kafkaConsumer.run({
      eachMessage: async ({ message }) => {
        try {
          const messageBody = JSON.parse(message.value?.toString() || '{}');
          const integrationMessage: Message = {
            id: message.key?.toString() || consumerId,
            timestamp: new Date(message.timestamp),
            headers: message.headers || {},
            body: messageBody,
            source: config.topic,
            destination: config.queue || 'kafka-consumer',
            priority: 'normal',
            retryCount: 0,
            maxRetries: 3
          };

          await config.handler(integrationMessage);

        } catch (error) {
          console.error('Kafka message handler error:', error);
        }
      }
    });
  }

  private async registerRedisConsumer(consumerId: string, config: ConsumerConfig): Promise<void> {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }

    if (!config.queue) {
      throw new Error('Queue required for Redis consumer');
    }

    // Redis streams consumer group pattern
    const groupName = config.groupId || 'auterity-integration';

    try {
      await this.redisClient.xGroupCreate(config.queue, groupName, '0', {
        MKSTREAM: true
      });
    } catch (error) {
      // Group might already exist
    }

    // Start consuming
    const consumeMessages = async () => {
      try {
        const result = await this.redisClient.xReadGroup(
          groupName,
          consumerId,
          { key: config.queue, id: '>' },
          { COUNT: 1, BLOCK: 5000 }
        );

        if (result && result.length > 0) {
          const messages = result[0].messages;

          for (const msg of messages) {
            try {
              const messageBody = JSON.parse(msg.message.body || '{}');
              const integrationMessage: Message = {
                id: msg.id,
                timestamp: new Date(),
                headers: JSON.parse(msg.message.headers || '{}'),
                body: messageBody,
                source: config.queue,
                destination: 'redis-consumer',
                priority: 'normal',
                retryCount: 0,
                maxRetries: 3
              };

              await config.handler(integrationMessage);

              // Acknowledge message
              await this.redisClient.xAck(config.queue, groupName, msg.id);

            } catch (error) {
              console.error('Redis message handler error:', error);
              // Negative acknowledge - will be retried
            }
          }
        }
      } catch (error) {
        console.error('Redis consumer error:', error);
      }

      // Continue consuming
      setTimeout(consumeMessages, 100);
    };

    consumeMessages();
  }

  private mapPriority(priority?: number): Message['priority'] {
    if (!priority) return 'normal';
    if (priority >= 8) return 'critical';
    if (priority >= 6) return 'high';
    if (priority >= 4) return 'normal';
    return 'low';
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    queueDepth?: number;
    consumerCount?: number;
  }> {
    const startTime = Date.now();

    try {
      switch (this.config.type) {
        case 'rabbitmq':
          if (this.rabbitmqConnection) {
            // Simple health check
            const channel = await this.rabbitmqConnection.createChannel();
            await channel.close();
          }
          break;

        case 'kafka':
          if (this.kafkaProducer) {
            await this.kafkaProducer.send({
              topic: '__auterity_health_check',
              messages: [{ value: 'health_check' }]
            });
          }
          break;

        case 'redis':
          if (this.redisClient) {
            await this.redisClient.ping();
          }
          break;
      }

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        queueDepth: 0, // Would need to implement queue depth checking
        consumerCount: this.consumers.size
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      };
    }
  }
}

// Factory functions
export function createMessageQueueAdapter(config: MessageQueueConfig): MessageQueueAdapter {
  return new MessageQueueAdapter(config);
}

export function createMessageQueueEndpoint(
  id: string,
  name: string,
  config: MessageQueueConfig,
  consumers: ConsumerConfig[]
): IntegrationEndpoint {
  const adapter = new MessageQueueAdapter(config);

  return {
    id,
    type: 'source',
    name,
    uri: `mq://${config.type}/${config.host}:${config.port}`,
    config: { adapter, consumers },
    enabled: true,
    errorHandler: async (error, message) => {
      console.error(`Message queue endpoint ${id} error:`, error);
    }
  };
}

