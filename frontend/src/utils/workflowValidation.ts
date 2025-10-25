import {
  WorkflowDefinition,
  WorkflowValidationError,
  WorkflowStep,
} from "../types/workflow";

export const validateWorkflow = (
  workflow: WorkflowDefinition,
): WorkflowValidationError[] => {
  const errors: WorkflowValidationError[] = [];
  const { steps, connections } = workflow;

  // Check for start node
  const startNodes = steps.filter((step) => step.type === "start");
  if (startNodes.length === 0) {
    errors.push({
      type: "missing_start",
      message: "Workflow must have at least one start node",
    });
  } else if (startNodes.length > 1) {
    errors.push({
      type: "invalid_step",
      message: "Workflow can only have one start node",
    });
  }

  // Check for end node
  const endNodes = steps.filter((step) => step.type === "end");
  if (endNodes.length === 0) {
    errors.push({
      type: "missing_end",
      message: "Workflow must have at least one end node",
    });
  }

  // Check for disconnected nodes (except start and end)
  steps.forEach((step) => {
    const hasIncoming = connections.some((conn) => conn.target === step.id);
    const hasOutgoing = connections.some((conn) => conn.source === step.id);

    if (step.type === "start" && !hasOutgoing) {
      errors.push({
        type: "missing_connection",
        message: `Start node "${step.name}" must have outgoing connections`,
        stepId: step.id,
      });
    } else if (step.type === "end" && !hasIncoming) {
      errors.push({
        type: "missing_connection",
        message: `End node "${step.name}" must have incoming connections`,
        stepId: step.id,
      });
    } else if (
      step.type !== "start" &&
      step.type !== "end" &&
      (!hasIncoming || !hasOutgoing)
    ) {
      errors.push({
        type: "missing_connection",
        message: `Node "${step.name}" must have both incoming and outgoing connections`,
        stepId: step.id,
      });
    }
  });

  // Check for circular dependencies
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCycle = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingConnections = connections.filter(
      (conn) => conn.source === nodeId,
    );
    for (const connection of outgoingConnections) {
      if (hasCycle(connection.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const step of steps) {
    if (hasCycle(step.id)) {
      errors.push({
        type: "circular_dependency",
        message: "Workflow contains circular dependencies",
        stepId: step.id,
      });
      break;
    }
  }

  // Validate step configurations
  steps.forEach((step) => {
    if (step.type === "ai_process" && !step.config.prompt) {
      errors.push({
        type: "invalid_step",
        message: `AI Process node "${step.name}" must have a prompt configured`,
        stepId: step.id,
      });
    }
  });

  return errors;
};

export const validateStep = (step: WorkflowStep): string[] => {
  const errors: string[] = [];

  if (!step.name || step.name.trim() === "") {
    errors.push("Step name is required");
  }

  switch (step.type) {
    case "ai_process":
      if (!step.config.prompt || step.config.prompt.trim() === "") {
        errors.push("AI prompt is required");
      }
      break;
    case "condition":
      if (!step.config.condition || step.config.condition.trim() === "") {
        errors.push("Condition expression is required");
      }
      break;
    case "action":
      if (!step.config.action || step.config.action.trim() === "") {
        errors.push("Action configuration is required");
      }
      break;
  }

  return errors;
};


