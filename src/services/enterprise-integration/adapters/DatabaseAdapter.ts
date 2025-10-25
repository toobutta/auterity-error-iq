/**
 * Database Integration Adapter
 * Provides enterprise-grade database integration with connection pooling,
 * transaction management, and data transformation capabilities
 */

import { Pool, Client } from 'pg';
import { MongoClient } from 'mongodb';
import { createClient as createRedisClient } from 'redis';
import { IntegrationEndpoint, Message } from '../EnterpriseIntegrationBus';

export interface DatabaseConfig {
  type: 'postgresql' | 'mongodb' | 'redis' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionPool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}

export interface DatabaseOperation {
  type: 'select' | 'insert' | 'update' | 'delete' | 'bulk_insert' | 'bulk_update';
  table?: string;
  collection?: string;
  key?: string;
  query: any;
  data?: any;
  options?: {
    limit?: number;
    offset?: number;
    upsert?: boolean;
    multi?: boolean;
  };
}

export class DatabaseAdapter {
  private config: DatabaseConfig;
  private pgPool?: Pool;
  private mongoClient?: MongoClient;
  private redisClient?: any;
  private isConnected = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'postgresql':
          await this.connectPostgreSQL();
          break;
        case 'mongodb':
          await this.connectMongoDB();
          break;
        case 'redis':
          await this.connectRedis();
          break;
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }

      this.isConnected = true;

    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Execute database operation
   */
  async execute(operation: DatabaseOperation): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      switch (this.config.type) {
        case 'postgresql':
          return await this.executePostgreSQL(operation);
        case 'mongodb':
          return await this.executeMongoDB(operation);
        case 'redis':
          return await this.executeRedis(operation);
        default:
          throw new Error(`Unsupported database type: ${this.config.type}`);
      }

    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  /**
   * Execute operation within a transaction
   */
  async executeTransaction(operations: DatabaseOperation[]): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      switch (this.config.type) {
        case 'postgresql':
          return await this.executePostgreSQLTransaction(operations);
        case 'mongodb':
          return await this.executeMongoDBTransaction(operations);
        default:
          // Execute operations sequentially for non-transactional databases
          const results = [];
          for (const operation of operations) {
            results.push(await this.execute(operation));
          }
          return results;
      }

    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    try {
      switch (this.config.type) {
        case 'postgresql':
          if (this.pgPool) {
            await this.pgPool.end();
          }
          break;
        case 'mongodb':
          if (this.mongoClient) {
            await this.mongoClient.close();
          }
          break;
        case 'redis':
          if (this.redisClient) {
            await this.redisClient.disconnect();
          }
          break;
      }

      this.isConnected = false;

    } catch (error) {
      console.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  // Private methods for different database types

  private async connectPostgreSQL(): Promise<void> {
    this.pgPool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      min: this.config.connectionPool?.min || 2,
      max: this.config.connectionPool?.max || 20,
      idleTimeoutMillis: this.config.connectionPool?.idleTimeoutMillis || 30000,
    });

    // Test connection
    const client = await this.pgPool.connect();
    await client.release();
  }

  private async connectMongoDB(): Promise<void> {
    const uri = `mongodb://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
    this.mongoClient = new MongoClient(uri);
    await this.mongoClient.connect();

    // Test connection
    await this.mongoClient.db(this.config.database).admin().ping();
  }

  private async connectRedis(): Promise<void> {
    this.redisClient = createRedisClient({
      url: `redis://${this.config.host}:${this.config.port}`,
      password: this.config.password,
      database: parseInt(this.config.database) || 0,
    });

    await this.redisClient.connect();

    // Test connection
    await this.redisClient.ping();
  }

  private async executePostgreSQL(operation: DatabaseOperation): Promise<any> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const client = await this.pgPool.connect();

    try {
      let query: string;
      let values: any[] = [];

      switch (operation.type) {
        case 'select':
          query = `SELECT * FROM ${operation.table} WHERE ${this.buildWhereClause(operation.query)}`;
          if (operation.options?.limit) {
            query += ` LIMIT ${operation.options.limit}`;
          }
          if (operation.options?.offset) {
            query += ` OFFSET ${operation.options.offset}`;
          }
          break;

        case 'insert':
          const columns = Object.keys(operation.data);
          const placeholders = columns.map((_, i) => `$${i + 1}`);
          query = `INSERT INTO ${operation.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
          values = columns.map(col => operation.data[col]);
          break;

        case 'update':
          const updateColumns = Object.keys(operation.data);
          const setClause = updateColumns.map((col, i) => `${col} = $${i + 1}`).join(', ');
          query = `UPDATE ${operation.table} SET ${setClause} WHERE ${this.buildWhereClause(operation.query)} RETURNING *`;
          values = [...updateColumns.map(col => operation.data[col]), ...Object.values(operation.query)];
          break;

        case 'delete':
          query = `DELETE FROM ${operation.table} WHERE ${this.buildWhereClause(operation.query)} RETURNING *`;
          values = Object.values(operation.query);
          break;

        case 'bulk_insert':
          // Handle bulk insert
          const bulkData = operation.data as any[];
          if (bulkData.length === 0) return [];

          const bulkColumns = Object.keys(bulkData[0]);
          const bulkPlaceholders = bulkData.map((_, rowIndex) =>
            `(${bulkColumns.map((_, colIndex) => `$${rowIndex * bulkColumns.length + colIndex + 1}`).join(', ')})`
          ).join(', ');

          query = `INSERT INTO ${operation.table} (${bulkColumns.join(', ')}) VALUES ${bulkPlaceholders} RETURNING *`;
          values = bulkData.flatMap(row => bulkColumns.map(col => row[col]));
          break;

        default:
          throw new Error(`Unsupported operation type: ${operation.type}`);
      }

      const result = await client.query(query, values);
      return result.rows;

    } finally {
      client.release();
    }
  }

  private async executeMongoDB(operation: DatabaseOperation): Promise<any> {
    if (!this.mongoClient) {
      throw new Error('MongoDB client not initialized');
    }

    const db = this.mongoClient.db(this.config.database);
    const collection = db.collection(operation.collection || 'default');

    switch (operation.type) {
      case 'select':
        return await collection.find(operation.query, operation.options).toArray();

      case 'insert':
        const insertResult = await collection.insertOne(operation.data);
        return { ...operation.data, _id: insertResult.insertedId };

      case 'update':
        return await collection.updateMany(
          operation.query,
          { $set: operation.data },
          { upsert: operation.options?.upsert }
        );

      case 'delete':
        return await collection.deleteMany(operation.query);

      case 'bulk_insert':
        return await collection.insertMany(operation.data);

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async executeRedis(operation: DatabaseOperation): Promise<any> {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }

    switch (operation.type) {
      case 'select':
        if (operation.key) {
          return await this.redisClient.get(operation.key);
        } else {
          // Get all keys matching pattern
          const keys = await this.redisClient.keys(operation.query.pattern || '*');
          const values = await Promise.all(keys.map(key => this.redisClient.get(key)));
          return keys.reduce((acc, key, index) => {
            acc[key] = values[index];
            return acc;
          }, {});
        }

      case 'insert':
        if (operation.key) {
          return await this.redisClient.set(operation.key, JSON.stringify(operation.data));
        }
        break;

      case 'update':
        if (operation.key) {
          return await this.redisClient.set(operation.key, JSON.stringify(operation.data));
        }
        break;

      case 'delete':
        if (operation.key) {
          return await this.redisClient.del(operation.key);
        } else if (operation.query.pattern) {
          const keys = await this.redisClient.keys(operation.query.pattern);
          return await this.redisClient.del(keys);
        }
        break;

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private async executePostgreSQLTransaction(operations: DatabaseOperation[]): Promise<any> {
    if (!this.pgPool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const operation of operations) {
        const result = await this.executePostgreSQL(operation);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;

    } finally {
      client.release();
    }
  }

  private async executeMongoDBTransaction(operations: DatabaseOperation[]): Promise<any> {
    if (!this.mongoClient) {
      throw new Error('MongoDB client not initialized');
    }

    const session = this.mongoClient.startSession();

    try {
      const results = await session.withTransaction(async () => {
        const db = this.mongoClient!.db(this.config.database);
        const operationResults = [];

        for (const operation of operations) {
          const collection = db.collection(operation.collection || 'default');
          let result;

          switch (operation.type) {
            case 'insert':
              result = await collection.insertOne(operation.data, { session });
              break;
            case 'update':
              result = await collection.updateMany(operation.query, { $set: operation.data }, { session });
              break;
            case 'delete':
              result = await collection.deleteMany(operation.query, { session });
              break;
            default:
              result = await this.executeMongoDB(operation);
          }

          operationResults.push(result);
        }

        return operationResults;
      });

      return results;

    } finally {
      await session.endSession();
    }
  }

  private buildWhereClause(query: any): string {
    const conditions = Object.entries(query).map(([key, value], index) => {
      return `${key} = $${index + 1}`;
    });

    return conditions.join(' AND ');
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    connectionCount?: number;
  }> {
    const startTime = Date.now();

    try {
      switch (this.config.type) {
        case 'postgresql':
          if (this.pgPool) {
            const client = await this.pgPool.connect();
            await client.query('SELECT 1');
            await client.release();
          }
          break;

        case 'mongodb':
          if (this.mongoClient) {
            await this.mongoClient.db(this.config.database).admin().ping();
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
        connectionCount: this.getConnectionCount()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime
      };
    }
  }

  private getConnectionCount(): number | undefined {
    switch (this.config.type) {
      case 'postgresql':
        return this.pgPool?.totalCount;
      case 'mongodb':
        // MongoDB doesn't expose connection count easily
        return undefined;
      case 'redis':
        // Redis connection count would need to be tracked separately
        return undefined;
      default:
        return undefined;
    }
  }
}

// Factory function to create database adapters
export function createDatabaseAdapter(config: DatabaseConfig): DatabaseAdapter {
  return new DatabaseAdapter(config);
}

// Integration endpoint factory
export function createDatabaseEndpoint(
  id: string,
  name: string,
  config: DatabaseConfig,
  operations: DatabaseOperation[]
): IntegrationEndpoint {
  const adapter = new DatabaseAdapter(config);

  return {
    id,
    type: 'sink',
    name,
    uri: `db://${config.type}/${config.database}`,
    config: { adapter, operations },
    enabled: true,
    errorHandler: async (error, message) => {
      console.error(`Database endpoint ${id} error:`, error);
      // Could send to dead letter queue or retry
    }
  };
}

