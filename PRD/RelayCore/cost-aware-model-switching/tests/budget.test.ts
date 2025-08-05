/**
 * Budget API Tests
 */

import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/cost_aware_db_test';

// Import app after setting environment variables
import app from '../src/app';

describe('Budget API', () => {
  // Test budget data
  const testBudget = {
    name: 'Test Budget',
    scopeType: 'organization',
    scopeId: 'org-test-123',
    amount: 1000,
    currency: 'USD',
    period: 'monthly',
    startDate: new Date().toISOString(),
    recurring: true
  };
  
  let budgetId: string;
  
  // Test creating a budget
  describe('POST /api/v1/budgets', () => {
    it('should create a new budget', async () => {
      const response = await request(app)
        .post('/api/v1/budgets')
        .send(testBudget);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testBudget.name);
      expect(response.body.scopeType).toBe(testBudget.scopeType);
      expect(response.body.scopeId).toBe(testBudget.scopeId);
      expect(response.body.amount).toBe(testBudget.amount);
      
      // Save budget ID for later tests
      budgetId = response.body.id;
    });
    
    it('should return 400 for invalid budget data', async () => {
      const invalidBudget = {
        name: 'Invalid Budget'
        // Missing required fields
      };
      
      const response = await request(app)
        .post('/api/v1/budgets')
        .send(invalidBudget);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  // Test getting a budget
  describe('GET /api/v1/budgets/:id', () => {
    it('should get a specific budget', async () => {
      // Skip if budget ID is not available
      if (!budgetId) {
        return;
      }
      
      const response = await request(app)
        .get(`/api/v1/budgets/${budgetId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', budgetId);
      expect(response.body.name).toBe(testBudget.name);
    });
    
    it('should return 404 for non-existent budget', async () => {
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .get(`/api/v1/budgets/${nonExistentId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  // Test updating a budget
  describe('PUT /api/v1/budgets/:id', () => {
    it('should update a budget', async () => {
      // Skip if budget ID is not available
      if (!budgetId) {
        return;
      }
      
      const updates = {
        name: 'Updated Test Budget',
        amount: 2000
      };
      
      const response = await request(app)
        .put(`/api/v1/budgets/${budgetId}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', budgetId);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.amount).toBe(updates.amount);
    });
  });
  
  // Test getting budget status
  describe('GET /api/v1/budgets/:id/status', () => {
    it('should get budget status', async () => {
      // Skip if budget ID is not available
      if (!budgetId) {
        return;
      }
      
      const response = await request(app)
        .get(`/api/v1/budgets/${budgetId}/status`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('budgetId', budgetId);
      expect(response.body).toHaveProperty('currentAmount');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('percentUsed');
      expect(response.body).toHaveProperty('status');
    });
  });
  
  // Test recording usage
  describe('POST /api/v1/budgets/:id/usage', () => {
    it('should record usage against a budget', async () => {
      // Skip if budget ID is not available
      if (!budgetId) {
        return;
      }
      
      const usageData = {
        amount: 50,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        source: 'test',
        description: 'Test usage',
        metadata: {
          requestId: uuidv4(),
          modelId: 'gpt-4',
          userId: 'user-123'
        }
      };
      
      const response = await request(app)
        .post(`/api/v1/budgets/${budgetId}/usage`)
        .send(usageData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('budgetId', budgetId);
      expect(response.body).toHaveProperty('amount', usageData.amount);
      expect(response.body).toHaveProperty('recorded');
    });
  });
  
  // Test deleting a budget
  describe('DELETE /api/v1/budgets/:id', () => {
    it('should delete a budget', async () => {
      // Skip if budget ID is not available
      if (!budgetId) {
        return;
      }
      
      const response = await request(app)
        .delete(`/api/v1/budgets/${budgetId}`);
      
      expect(response.status).toBe(204);
    });
  });
});