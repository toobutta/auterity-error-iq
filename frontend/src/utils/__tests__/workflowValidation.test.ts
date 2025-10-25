import { describe, it, expect } from "vitest";
import { validateWorkflow, validateStep } from "../workflowValidation";
import { WorkflowDefinition, WorkflowStep } from "../../types/workflow";

describe("workflowValidation", () => {
  describe("validateWorkflow", () => {
    it("validates a simple valid workflow", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        description: "A test workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start",
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: "ai-1",
            type: "ai_process",
            name: "AI Process",
            config: { prompt: "Test prompt" },
            position: { x: 0, y: 100 },
          },
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 200 },
          },
        ],
        connections: [
          { id: "conn-1", source: "start-1", target: "ai-1" },
          { id: "conn-2", source: "ai-1", target: "end-1" },
        ],
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toHaveLength(0);
    });

    it("detects missing start node", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toContainEqual({
        type: "missing_start",
        message: "Workflow must have at least one start node",
      });
    });

    it("detects missing end node", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start",
            config: {},
            position: { x: 0, y: 0 },
          },
        ],
        connections: [],
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toContainEqual({
        type: "missing_end",
        message: "Workflow must have at least one end node",
      });
    });

    it("detects multiple start nodes", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start 1",
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: "start-2",
            type: "start",
            name: "Start 2",
            config: {},
            position: { x: 100, y: 0 },
          },
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 100 },
          },
        ],
        connections: [],
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toContainEqual({
        type: "invalid_step",
        message: "Workflow can only have one start node",
      });
    });

    it("detects disconnected nodes", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start",
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: "ai-1",
            type: "ai_process",
            name: "AI Process",
            config: { prompt: "Test prompt" },
            position: { x: 0, y: 100 },
          },
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 200 },
          },
        ],
        connections: [], // No connections
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toContainEqual({
        type: "missing_connection",
        message: 'Start node "Start" must have outgoing connections',
        stepId: "start-1",
      });
      expect(errors).toContainEqual({
        type: "missing_connection",
        message:
          'Node "AI Process" must have both incoming and outgoing connections',
        stepId: "ai-1",
      });
      expect(errors).toContainEqual({
        type: "missing_connection",
        message: 'End node "End" must have incoming connections',
        stepId: "end-1",
      });
    });

    it("detects circular dependencies", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start",
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: "ai-1",
            type: "ai_process",
            name: "AI Process 1",
            config: { prompt: "Test prompt" },
            position: { x: 0, y: 100 },
          },
          {
            id: "ai-2",
            type: "ai_process",
            name: "AI Process 2",
            config: { prompt: "Test prompt" },
            position: { x: 0, y: 200 },
          },
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 300 },
          },
        ],
        connections: [
          { id: "conn-1", source: "start-1", target: "ai-1" },
          { id: "conn-2", source: "ai-1", target: "ai-2" },
          { id: "conn-3", source: "ai-2", target: "ai-1" }, // Creates cycle
          { id: "conn-4", source: "ai-2", target: "end-1" },
        ],
      };

      const errors = validateWorkflow(workflow);
      expect(errors.some((error) => error.type === "circular_dependency")).toBe(
        true,
      );
    });

    it("detects AI process nodes without prompts", () => {
      const workflow: WorkflowDefinition = {
        name: "Test Workflow",
        steps: [
          {
            id: "start-1",
            type: "start",
            name: "Start",
            config: {},
            position: { x: 0, y: 0 },
          },
          {
            id: "ai-1",
            type: "ai_process",
            name: "AI Process",
            config: {}, // No prompt
            position: { x: 0, y: 100 },
          },
          {
            id: "end-1",
            type: "end",
            name: "End",
            config: {},
            position: { x: 0, y: 200 },
          },
        ],
        connections: [
          { id: "conn-1", source: "start-1", target: "ai-1" },
          { id: "conn-2", source: "ai-1", target: "end-1" },
        ],
      };

      const errors = validateWorkflow(workflow);
      expect(errors).toContainEqual({
        type: "invalid_step",
        message: 'AI Process node "AI Process" must have a prompt configured',
        stepId: "ai-1",
      });
    });
  });

  describe("validateStep", () => {
    it("validates a valid start step", () => {
      const step: WorkflowStep = {
        id: "start-1",
        type: "start",
        name: "Start",
        config: {},
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toHaveLength(0);
    });

    it("detects missing step name", () => {
      const step: WorkflowStep = {
        id: "start-1",
        type: "start",
        name: "",
        config: {},
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toContain("Step name is required");
    });

    it("validates AI process step with prompt", () => {
      const step: WorkflowStep = {
        id: "ai-1",
        type: "ai_process",
        name: "AI Process",
        config: { prompt: "Test prompt" },
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toHaveLength(0);
    });

    it("detects AI process step without prompt", () => {
      const step: WorkflowStep = {
        id: "ai-1",
        type: "ai_process",
        name: "AI Process",
        config: {},
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toContain("AI prompt is required");
    });

    it("detects condition step without condition", () => {
      const step: WorkflowStep = {
        id: "cond-1",
        type: "condition",
        name: "Condition",
        config: {},
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toContain("Condition expression is required");
    });

    it("detects action step without action", () => {
      const step: WorkflowStep = {
        id: "action-1",
        type: "action",
        name: "Action",
        config: {},
        position: { x: 0, y: 0 },
      };

      const errors = validateStep(step);
      expect(errors).toContain("Action configuration is required");
    });
  });
});


