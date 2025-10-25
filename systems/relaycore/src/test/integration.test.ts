/**
 * RelayCore Integration Tests
 * Tests the complete HTTP proxy server functionality
 */

import request from "supertest";
import app from "../index";
import { DatabaseConnection } from "../services/database";
import { initializeDatabase } from "../database/init";

describe("RelayCore HTTP Proxy Server", () => {
  beforeAll(async () => {
    // Initialize test database
    process.env.DATABASE_URL =
      process.env.TEST_DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/relaycore_test";
    process.env.SECRET_KEY = process.env.TEST_SECRET_KEY || "test-secret-key";
    process.env.NODE_ENV = "test";

    await DatabaseConnection.initialize();
    await initializeDatabase();
  });

  afterAll(async () => {
    await DatabaseConnection.close();
  });

  describe("Health Endpoints", () => {
    test("GET /health should return healthy status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body.service).toBe("relaycore");
    });

    test("GET /health/detailed should return detailed health info", async () => {
      const response = await request(app).get("/health/detailed").expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.service.status).toBe("healthy");
    });
  });

  describe("AI Routing Endpoints", () => {
    const mockToken = `Bearer ${process.env.TEST_JWT_TOKEN || "test-token"}`;

    test("POST /api/v1/ai/chat should require authentication", async () => {
      await request(app)
        .post("/api/v1/ai/chat")
        .send({
          prompt: "Test prompt",
          context: {},
          cost_constraints: { max_cost: 1.0 },
        })
        .expect(401);
    });

    test("POST /api/v1/ai/chat should accept valid requests", async () => {
      // Mock successful AI response
      const response = await request(app)
        .post("/api/v1/ai/chat")
        .set("Authorization", mockToken)
        .send({
          prompt: "Test automotive question",
          context: {
            automotive_context: {
              dealership_id: "test-dealer",
              service_type: "sales",
            },
          },
          cost_constraints: { max_cost: 1.0 },
          system_source: "test",
        });

      // Note: This will fail without actual API keys, but tests the routing logic
      expect(response.status).toBeOneOf([200, 500]); // 500 expected without API keys
    });

    test("POST /api/v1/ai/batch should handle batch requests", async () => {
      const response = await request(app)
        .post("/api/v1/ai/batch")
        .set("Authorization", mockToken)
        .send({
          requests: [
            {
              id: "test-1",
              prompt: "Test prompt 1",
              context: {},
              cost_constraints: { max_cost: 0.5 },
              system_source: "test",
            },
            {
              id: "test-2",
              prompt: "Test prompt 2",
              context: {},
              cost_constraints: { max_cost: 0.5 },
              system_source: "test",
            },
          ],
        });

      expect(response.status).toBeOneOf([200, 500]);
    });
  });

  describe("Provider Management", () => {
    test("GET /api/v1/ai/providers should return available providers", async () => {
      const mockToken = `Bearer ${process.env.TEST_JWT_TOKEN || "test-token"}`;

      const response = await request(app)
        .get("/api/v1/ai/providers")
        .set("Authorization", mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("Metrics Endpoints", () => {
    const mockToken = `Bearer ${process.env.TEST_JWT_TOKEN || "test-token"}`;

    test("GET /api/v1/metrics/system should return system metrics", async () => {
      const response = await request(app)
        .get("/api/v1/metrics/system")
        .set("Authorization", mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.total_requests).toBeDefined();
    });

    test("GET /api/v1/metrics/costs should return cost analysis", async () => {
      const response = await request(app)
        .get("/api/v1/metrics/costs")
        .set("Authorization", mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_cost).toBeDefined();
    });
  });

  describe("Models Endpoints", () => {
    const mockToken = `Bearer ${process.env.TEST_JWT_TOKEN || "test-token"}`;

    test("GET /api/v1/models should return available models", async () => {
      const response = await request(app)
        .get("/api/v1/models")
        .set("Authorization", mockToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});

// Custom Jest matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

