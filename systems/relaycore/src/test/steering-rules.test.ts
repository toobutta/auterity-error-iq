import { SteeringRulesEngine } from "../services/steering-rules";
import { AIRequest } from "../models/request";

describe("SteeringRulesEngine", () => {
  let engine: SteeringRulesEngine;

  beforeEach(async () => {
    engine = new SteeringRulesEngine();
    await engine.loadSteeringRules();
  });

  describe("Rule Validation", () => {
    it("should validate rules successfully", async () => {
      const isValid = await engine.validateRules();
      expect(isValid).toBe(true);
    });
  });

  describe("Routing Logic", () => {
    it("should route automotive context to NeuroWeaver", async () => {
      const request: AIRequest = {
        prompt: "Analyze vehicle diagnostics data",
        context: {
          automotive_context: true,
          user_id: "test-user",
        },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.provider).toBe("neuroweaver");
      expect(decision.model).toBe("automotive-specialist-v1");
      expect(decision.routing_rules_applied).toContain("automotive_context");
    });

    it("should route high priority to GPT-4", async () => {
      const request: AIRequest = {
        prompt: "Critical business analysis needed urgently",
        context: {
          priority: "high",
          user_id: "test-user",
        },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.provider).toBe("openai");
      expect(decision.model).toBe("gpt-4");
      expect(decision.routing_rules_applied).toContain("high_priority");
    });

    it("should optimize costs for simple requests", async () => {
      const request: AIRequest = {
        prompt: "Hello",
        context: {
          budget_constraint: "low",
          user_id: "test-user",
        },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.provider).toBe("openai");
      expect(decision.model).toBe("gpt-3.5-turbo");
      expect(decision.estimated_cost).toBeLessThan(0.01);
    });

    it("should route complex reasoning to Claude", async () => {
      const longPrompt = "A".repeat(600);
      const request: AIRequest = {
        prompt: longPrompt,
        context: {
          task_type: "reasoning",
          user_id: "test-user",
        },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.provider).toBe("anthropic");
      expect(decision.model).toBe("claude-3-opus");
    });

    it("should use default routing when no rules match", async () => {
      const request: AIRequest = {
        prompt: "Generic request with no special context",
        context: {
          user_id: "test-user",
        },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.provider).toBe("openai");
      expect(decision.model).toBe("gpt-3.5-turbo");
      expect(decision.routing_rules_applied).toContain("default");
    });
  });

  describe("Cost Constraints", () => {
    it("should respect daily budget limits", async () => {
      // Simulate high daily spend
      for (let i = 0; i < 50; i++) {
        engine.recordRequestCost(2.0);
      }

      const request: AIRequest = {
        prompt: "Test request",
        context: { user_id: "test-user" },
      };

      const decision = await engine.determineRouting(request);

      expect(decision.routing_rules_applied).toContain("budget_constraint");
      expect(decision.reasoning).toContain("budget exceeded");
    });

    it("should track request costs accurately", () => {
      engine.recordRequestCost(0.05);
      engine.recordRequestCost(0.03);

      expect(engine.getDailySpend()).toBe(0.08);
    });

    it("should reset daily tracking", () => {
      engine.recordRequestCost(0.05);
      engine.resetDailyTracking();

      expect(engine.getDailySpend()).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should provide fallback routing on errors", async () => {
      // Create engine without loading rules
      const errorEngine = new SteeringRulesEngine();

      const request: AIRequest = {
        prompt: "Test request",
        context: { user_id: "test-user" },
      };

      const decision = await errorEngine.determineRouting(request);

      expect(decision.provider).toBe("openai");
      expect(decision.model).toBe("gpt-3.5-turbo");
      expect(decision.confidence_score).toBeLessThan(0.8);
    });
  });
});

