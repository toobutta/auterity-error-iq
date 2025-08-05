import { Pool } from 'pg';
import { configManager } from '../config/configManager';
import { logger } from '../utils/logger';

// Database pool
let pool: Pool | null = null;

// Connect to database
export async function connectDatabase(): Promise<Pool> {
  try {
    const config = configManager.getConfig();
    const connectionString = config.analytics?.storage?.postgres?.connectionString || process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('Database connection string not provided');
    }
    
    // Create database pool
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Create tables if they don't exist
    await createTables();
    
    logger.info('Connected to database');
    
    return pool;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

// Get database pool
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  return pool;
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

// Create database tables
async function createTables(): Promise<void> {
  const client = await getPool().connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        input_tokens INTEGER,
        output_tokens INTEGER,
        estimated_cost DECIMAL(10, 6),
        cache_status VARCHAR(20),
        optimizations_applied JSONB,
        request_time TIMESTAMP,
        response_time TIMESTAMP,
        latency INTEGER,
        status_code INTEGER,
        error_type VARCHAR(50),
        request_id VARCHAR(255) UNIQUE
      )
    `);
    
    // Create index on requests table
    await client.query('CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_requests_provider ON requests(provider)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_requests_request_time ON requests(request_time)');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        api_key VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create api_keys table
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    logger.info('Database tables created');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Database operations

// Track request
export async function trackRequest(requestData: {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  cacheStatus: string;
  optimizationsApplied: any;
  requestTime: Date;
  responseTime: Date;
  latency: number;
  statusCode: number;
  errorType?: string;
  requestId: string;
}): Promise<void> {
  try {
    const pool = getPool();
    
    await pool.query(
      `INSERT INTO requests (
        user_id, provider, model, input_tokens, output_tokens,
        estimated_cost, cache_status, optimizations_applied,
        request_time, response_time, latency, status_code, error_type, request_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        requestData.userId,
        requestData.provider,
        requestData.model,
        requestData.inputTokens,
        requestData.outputTokens,
        requestData.estimatedCost,
        requestData.cacheStatus,
        JSON.stringify(requestData.optimizationsApplied || {}),
        requestData.requestTime,
        requestData.responseTime,
        requestData.latency,
        requestData.statusCode,
        requestData.errorType || null,
        requestData.requestId,
      ]
    );
  } catch (error) {
    logger.error('Error tracking request:', error);
    throw error;
  }
}

// Get usage statistics
export async function getUsageStats(userId?: string, startDate?: Date, endDate?: Date): Promise<any> {
  try {
    const pool = getPool();
    
    // Build query
    let query = `
      SELECT 
        provider,
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(estimated_cost) as total_cost,
        AVG(latency) as avg_latency
      FROM requests
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    
    if (startDate) {
      query += ` AND request_time >= $${paramIndex++}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND request_time <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ` GROUP BY provider, model`;
    
    const result = await pool.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    throw error;
  }
}

// Get request history
export async function getRequestHistory(userId?: string, limit = 100, offset = 0): Promise<any> {
  try {
    const pool = getPool();
    
    // Build query
    let query = `
      SELECT *
      FROM requests
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }
    
    query += ` ORDER BY request_time DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return result.rows;
  } catch (error) {
    logger.error('Error getting request history:', error);
    throw error;
  }
}