/**
 * Jest setup file
 * 
 * This file runs before each test file to set up the test environment.
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cost_aware_db_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '3002';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests
process.env.ENABLE_INTEGRATIONS = 'false'; // Disable integrations during tests

// Global setup
beforeAll(async () => {
  // Add any global setup here
  console.log('Setting up test environment...');
});

// Global teardown
afterAll(async () => {
  // Add any global teardown here
  console.log('Tearing down test environment...');
});