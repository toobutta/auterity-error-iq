// Global test setup
import dotenv from 'dotenv';

// Load environment variables from .env.test file if it exists
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock Redis if needed
jest.mock('ioredis', () => {
  const Redis = require('ioredis-mock');
  return Redis;
});

// Global beforeAll hook
beforeAll(async () => {
  // Setup any global test dependencies here
  console.log('Starting test suite...');
});

// Global afterAll hook
afterAll(async () => {
  // Clean up any global test dependencies here
  console.log('Test suite completed.');
});