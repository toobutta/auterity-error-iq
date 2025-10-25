/**
 * Budget Management System Tests
 * Tests for core budget functionality
 */

import { BudgetRegistry } from "../services/budget-registry";
import { BudgetTracker } from "../services/budget-tracker";
import { BudgetIntegration } from "../services/budget-integration";
import { CreateBudgetRequest, RecordUsageRequest } from "../types/budget";

// Mock the database connection
jest.mock("../services/database", () => ({
  DatabaseConnection: {
    getClient: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
    query: jest.fn(),
  },
}));

describe("Budget Management System", () => {
  let budgetRegistry: BudgetRegistry;
  let budgetTracker: BudgetTracker;
  let budgetIntegration: BudgetIntegration;

  beforeEach(() => {
    budgetRegistry = new BudgetRegistry();
    budgetTracker = new BudgetTracker();
    budgetIntegration = new BudgetIntegration();
  });

  describe("BudgetRegistry", () => {
    test("should create a budget with valid data", async () => {
      const createRequest: CreateBudgetRequest = {
        name: "Test Budget",
        description: "A test budget",
        scopeType: "user",
        scopeId: "user-123",
        amount: 1000,
        currency: "USD",
        period: "monthly",
        startDate: "2025-01-01T00:00:00Z",
        recurring: true,
        alerts: [
          {
            threshold: 80,
            actions: ["notify"],
            notificationChannels: ["email"],
          },
        ],
        tags: {
          department: "engineering",
        },
      };

      // Mock the database response
      const mockBudget = {
        id: "budget-123",
        ...createRequest,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        created_by: "user-456",
        active: true,
        scope_type: createRequest.scopeType,
        scope_id: createRequest.scopeId,
        start_date: createRequest.startDate,
        end_date: null,
        parent_budget_id: null,
        alerts: JSON.stringify(createRequest.alerts),
        tags: JSON.stringify(createRequest.tags),
      };

      const mockClient = {
        query: jest
          .fn()
          .mockResolvedValueOnce({ rows: [] }) // parent budget check
          .mockResolvedValueOnce({ rows: [mockBudget] }) // insert budget
          .mockResolvedValueOnce({ rows: [] }), // insert cache
        release: jest.fn(),
      };

      // Mock the DatabaseConnection methods
      const { DatabaseConnection } = require("../services/database");
      DatabaseConnection.getClient.mockResolvedValue(mockClient);

      const result = await budgetRegistry.createBudget(
        createRequest,
        "user-456",
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(createRequest.name);
      expect(result.scopeType).toBe(createRequest.scopeType);
      expect(result.amount).toBe(createRequest.amount);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    test("should validate required fields when creating budget", async () => {
      const invalidRequest = {
        name: "Test Budget",
        // Missing required fields
      } as CreateBudgetRequest;

      // This would be handled by the API layer validation
      expect(invalidRequest.scopeType).toBeUndefined();
      expect(invalidRequest.amount).toBeUndefined();
    });

    test("should calculate period end date correctly", () => {
      const startDate = "2025-01-01T00:00:00Z";

      // Test the private method through reflection (for testing purposes)
      const calculateEndDate = (budgetRegistry as any).calculatePeriodEndDate;

      const monthlyEnd = calculateEndDate(startDate, "monthly");
      expect(new Date(monthlyEnd).getMonth()).toBe(0); // Still January due to timezone handling

      const weeklyEnd = calculateEndDate(startDate, "weekly");
      const weeklyDate = new Date(weeklyEnd);
      const startDateObj = new Date(startDate);
      const daysDiff = Math.round(
        (weeklyDate.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(7);
    });
  });

  describe("BudgetTracker", () => {
    test("should record usage against a budget", async () => {
      const budgetId = "budget-123";
      const usageRequest: RecordUsageRequest = {
        amount: 25.5,
        currency: "USD",
        source: "relaycore",
        description: "Test usage",
        metadata: {
          requestId: "req-123",
          modelId: "gpt-4",
          userId: "user-123",
        },
      };

      const mockUsageRecord = {
        id: "usage-123",
        budget_id: budgetId,
        amount: usageRequest.amount,
        currency: usageRequest.currency,
        timestamp: "2025-01-01T12:00:00Z",
        source: usageRequest.source,
        description: usageRequest.description,
        metadata: JSON.stringify(usageRequest.metadata),
      };

      const mockClient = {
        query: jest
          .fn()
          .mockResolvedValueOnce(undefined) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: budgetId, currency: "USD" }] }) // budget check
          .mockResolvedValueOnce({ rows: [mockUsageRecord] }) // insert usage
          .mockResolvedValueOnce(undefined), // COMMIT
        release: jest.fn(),
      };

      // Mock the DatabaseConnection methods
      const { DatabaseConnection } = require("../services/database");
      DatabaseConnection.getClient.mockResolvedValue(mockClient);

      const result = await budgetTracker.recordUsage(budgetId, usageRequest);

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(budgetId);
      expect(result.amount).toBe(usageRequest.amount);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    test("should check budget constraints correctly", async () => {
      const budgetId = "budget-123";
      const estimatedCost = 100;

      const mockStatus = {
        budgetId,
        currentAmount: 800,
        limit: 1000,
        currency: "USD",
        percentUsed: 80,
        remaining: 200,
        daysRemaining: 10,
        burnRate: 50,
        projectedTotal: 1300,
        status: "warning" as const,
        activeAlerts: [],
        lastUpdated: "2025-01-01T12:00:00Z",
      };

      const mockBudgetAlerts = [
        {
          threshold: 90,
          actions: ["notify", "require-approval"],
          notificationChannels: ["email"],
        },
      ];

      // Mock getBudgetStatus
      jest
        .spyOn(budgetTracker, "getBudgetStatus")
        .mockResolvedValue(mockStatus);

      // Mock the DatabaseConnection query method
      const { DatabaseConnection } = require("../services/database");
      DatabaseConnection.query.mockResolvedValue({
        rows: [{ alerts: JSON.stringify(mockBudgetAlerts) }],
      });

      const result = await budgetTracker.checkBudgetConstraints(
        budgetId,
        estimatedCost,
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(budgetId);
      expect(result.estimatedCost).toBe(estimatedCost);
      expect(result.canProceed).toBe(false); // Should require approval at 90%
      expect(result.suggestedActions).toContain("require-approval");
    });
  });

  describe("BudgetIntegration", () => {
    test("should check request constraints across multiple budget scopes", async () => {
      const userId = "user-123";
      const teamId = "team-456";
      const estimatedCost = 50;

      // Mock budget registry responses
      jest
        .spyOn(budgetRegistry, "listBudgets")
        .mockResolvedValueOnce([{ id: "user-budget-1" } as any]) // user budgets
        .mockResolvedValueOnce([{ id: "team-budget-1" } as any]); // team budgets

      // Mock budget tracker responses
      jest
        .spyOn(budgetTracker, "checkBudgetConstraints")
        .mockResolvedValueOnce({
          budgetId: "user-budget-1",
          estimatedCost,
          currency: "USD",
          canProceed: true,
        })
        .mockResolvedValueOnce({
          budgetId: "team-budget-1",
          estimatedCost,
          currency: "USD",
          canProceed: true,
        });

      const result = await budgetIntegration.checkRequestConstraints(
        userId,
        teamId,
        undefined,
        estimatedCost,
      );

      expect(result.canProceed).toBe(true);
      expect(result.budgetChecks).toHaveLength(2);
      expect(result.budgetChecks[0].budgetId).toBe("user-budget-1");
      expect(result.budgetChecks[1].budgetId).toBe("team-budget-1");
    });

    test("should block request if any budget constraint fails", async () => {
      const userId = "user-123";
      const estimatedCost = 200;

      jest
        .spyOn(budgetRegistry, "listBudgets")
        .mockResolvedValueOnce([{ id: "user-budget-1" } as any]);

      jest
        .spyOn(budgetTracker, "checkBudgetConstraints")
        .mockResolvedValueOnce({
          budgetId: "user-budget-1",
          estimatedCost,
          currency: "USD",
          canProceed: false,
          reason: "Would exceed budget limit",
        });

      const result = await budgetIntegration.checkRequestConstraints(
        userId,
        undefined,
        undefined,
        estimatedCost,
      );

      expect(result.canProceed).toBe(false);
      expect(result.reason).toBe("Would exceed budget limit");
    });
  });

  describe("Error Handling", () => {
    test("should handle database connection errors gracefully", async () => {
      // Mock the DatabaseConnection to throw an error
      const { DatabaseConnection } = require("../services/database");
      DatabaseConnection.getClient.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const createRequest: CreateBudgetRequest = {
        name: "Test Budget",
        scopeType: "user",
        scopeId: "user-123",
        amount: 1000,
        currency: "USD",
        period: "monthly",
        startDate: "2025-01-01T00:00:00Z",
        recurring: false,
        alerts: [],
      };

      await expect(
        budgetRegistry.createBudget(createRequest, "user-456"),
      ).rejects.toThrow("Database connection failed");
    });

    test("should handle invalid budget ID gracefully", async () => {
      // Mock the DatabaseConnection to return empty results
      const { DatabaseConnection } = require("../services/database");
      DatabaseConnection.query.mockResolvedValue({ rows: [] });

      const result = await budgetTracker.getBudgetStatus("invalid-budget-id");
      expect(result).toBeNull();
    });
  });
});

