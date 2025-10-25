/**
 * Budget Management System Demo
 * Demonstrates Phase 1 functionality: Registry, Tracker, and Config API
 */

import { BudgetRegistry } from "../services/budget-registry";
import { BudgetTracker } from "../services/budget-tracker";
import { BudgetIntegration } from "../services/budget-integration";
import { CreateBudgetRequest, RecordUsageRequest } from "../types/budget";
import { logger } from "../utils/logger";

async function demonstrateBudgetManagement() {
  logger.info("=== Budget Management System Demo ===");

  const budgetRegistry = new BudgetRegistry();
  const budgetTracker = new BudgetTracker();
  const budgetIntegration = new BudgetIntegration();

  try {
    // 1. Create a team budget
    logger.info("1. Creating a team budget...");
    const teamBudgetRequest: CreateBudgetRequest = {
      name: "Q1 2025 AI Development Budget",
      description: "Budget for AI development activities in Q1 2025",
      scopeType: "team",
      scopeId: "team-engineering-ai",
      amount: 5000,
      currency: "USD",
      period: "quarterly",
      startDate: "2025-01-01T00:00:00Z",
      recurring: true,
      alerts: [
        {
          threshold: 50,
          actions: ["notify"],
          notificationChannels: ["email", "slack"],
        },
        {
          threshold: 80,
          actions: ["notify", "restrict-models"],
          notificationChannels: ["email", "slack", "dashboard"],
        },
        {
          threshold: 95,
          actions: ["notify", "require-approval"],
          notificationChannels: ["email", "slack", "dashboard"],
        },
      ],
      tags: {
        department: "engineering",
        purpose: "ai-development",
        priority: "high",
      },
    };

    // Note: In a real demo, this would work with a database
    // For now, we'll show the structure and API design
    logger.info("Budget request prepared:", {
      name: teamBudgetRequest.name,
      amount: teamBudgetRequest.amount,
      currency: teamBudgetRequest.currency,
      alertThresholds: teamBudgetRequest.alerts.map((a) => a.threshold),
    });

    // 2. Create a user budget (child of team budget)
    logger.info("2. Creating a user budget...");
    const userBudgetRequest: CreateBudgetRequest = {
      name: "John Doe - AI Development",
      description: "Personal budget for John Doe within the team budget",
      scopeType: "user",
      scopeId: "user-john-doe",
      amount: 1000,
      currency: "USD",
      period: "monthly",
      startDate: "2025-01-01T00:00:00Z",
      recurring: true,
      alerts: [
        {
          threshold: 75,
          actions: ["notify"],
          notificationChannels: ["email"],
        },
        {
          threshold: 90,
          actions: ["notify", "auto-downgrade"],
          notificationChannels: ["email", "dashboard"],
        },
      ],
      tags: {
        user: "john-doe",
        role: "senior-engineer",
      },
    };

    logger.info("User budget request prepared:", {
      name: userBudgetRequest.name,
      amount: userBudgetRequest.amount,
      parentScope: "team-engineering-ai",
    });

    // 3. Demonstrate usage recording
    logger.info("3. Demonstrating usage recording...");
    const usageRequests: RecordUsageRequest[] = [
      {
        amount: 25.5,
        currency: "USD",
        source: "relaycore",
        description: "GPT-4 API call for code review",
        metadata: {
          requestId: "req-001",
          modelId: "gpt-4",
          userId: "user-john-doe",
          teamId: "team-engineering-ai",
          tags: {
            feature: "code-review",
            environment: "production",
          },
        },
      },
      {
        amount: 12.75,
        currency: "USD",
        source: "relaycore",
        description: "Claude-3 API call for documentation",
        metadata: {
          requestId: "req-002",
          modelId: "claude-3-sonnet",
          userId: "user-john-doe",
          teamId: "team-engineering-ai",
          tags: {
            feature: "documentation",
            environment: "development",
          },
        },
      },
    ];

    for (const usage of usageRequests) {
      logger.info("Usage record prepared:", {
        amount: usage.amount,
        model: usage.metadata.modelId,
        feature: usage.metadata.tags?.feature,
      });
    }

    // 4. Demonstrate budget constraint checking
    logger.info("4. Demonstrating budget constraint checking...");
    const constraintChecks = [
      { estimatedCost: 50, description: "High-cost GPT-4 request" },
      { estimatedCost: 5, description: "Low-cost GPT-3.5 request" },
      { estimatedCost: 200, description: "Very expensive batch processing" },
    ];

    for (const check of constraintChecks) {
      logger.info("Constraint check scenario:", {
        estimatedCost: check.estimatedCost,
        description: check.description,
        // In real implementation, this would return actual constraint results
        wouldCheck: "budget limits, alert thresholds, and available balance",
      });
    }

    // 5. Demonstrate integration with AI requests
    logger.info("5. Demonstrating AI request integration...");
    const aiRequestScenarios = [
      {
        userId: "user-john-doe",
        teamId: "team-engineering-ai",
        modelId: "gpt-4",
        estimatedCost: 30,
        description: "Code generation request",
      },
      {
        userId: "user-jane-smith",
        teamId: "team-engineering-ai",
        modelId: "claude-3-haiku",
        estimatedCost: 8,
        description: "Quick documentation query",
      },
    ];

    for (const scenario of aiRequestScenarios) {
      logger.info("AI request scenario:", {
        user: scenario.userId,
        model: scenario.modelId,
        estimatedCost: scenario.estimatedCost,
        // In real implementation, this would show actual budget checks
        budgetChecksWouldInclude: [
          "User budget availability",
          "Team budget availability",
          "Alert threshold evaluation",
          "Action recommendations",
        ],
      });
    }

    // 6. Show API endpoints that would be available
    logger.info("6. Available API endpoints:");
    const apiEndpoints = [
      "POST /api/v1/budgets - Create budget",
      "GET /api/v1/budgets/:id - Get budget details",
      "PUT /api/v1/budgets/:id - Update budget",
      "DELETE /api/v1/budgets/:id - Delete budget",
      "GET /api/v1/budgets/scope/:type/:id - List budgets for scope",
      "GET /api/v1/budgets/:id/status - Get budget status",
      "POST /api/v1/budgets/:id/usage - Record usage",
      "POST /api/v1/budgets/:id/check-constraints - Check constraints",
      "GET /api/v1/budgets/:id/usage - Get usage history",
      "GET /api/v1/budgets/:id/usage/summary - Get usage summary",
    ];

    apiEndpoints.forEach((endpoint) => logger.info(`  ${endpoint}`));

    logger.info("=== Demo completed successfully ===");
    logger.info("Phase 1 Implementation includes:");
    logger.info("✓ Budget Registry - Create, read, update, delete budgets");
    logger.info(
      "✓ Budget Tracker - Record usage, calculate status, check constraints",
    );
    logger.info(
      "✓ Budget Config API - RESTful endpoints for budget management",
    );
    logger.info("✓ Database Schema - Comprehensive tables and functions");
    logger.info("✓ Integration Service - Connect budgets with AI requests");
    logger.info("✓ Type Definitions - Complete TypeScript interfaces");
    logger.info("✓ Error Handling - Graceful error management");
    logger.info("✓ Testing Framework - Unit tests for core functionality");
  } catch (error) {
    logger.error("Demo failed:", error);
  }
}

// Export for use in other modules
export { demonstrateBudgetManagement };

// Run demo if called directly
if (require.main === module) {
  demonstrateBudgetManagement()
    .then(() => {
      logger.info("Budget Management Demo completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Budget Management Demo failed:", error);
      process.exit(1);
    });
}

