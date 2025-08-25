/**
 * Handoff Protocols for BYOM Tool Communication
 * Standardized procedures for transferring tasks between AI models
 */

import { ModelCapability } from "./model-registry";
import { UniversalContext } from "./universal-context-manager";

export interface HandoffProtocol {
  id: string;
  name: string;
  description: string;
  triggerConditions: HandoffTrigger[];
  sourceModel: string;
  targetModel: string;
  requiredCapabilities: ModelCapability["type"][];
  handoffProcedure: HandoffProcedure;
  contextTransfer: ContextTransferSpec;
  successCriteria: SuccessCriterion[];
  failureHandling: FailureHandling;
  rollbackProcedure?: RollbackProcedure;
}

export interface HandoffTrigger {
  type: "error" | "performance" | "capability" | "cost" | "manual";
  condition: string;
  threshold?: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface HandoffProcedure {
  steps: HandoffStep[];
  timeout: number; // seconds
  retryPolicy: RetryPolicy;
  validation: ValidationStep[];
}

export interface HandoffStep {
  id: string;
  name: string;
  action: string;
  required: boolean;
  timeout: number;
  rollbackAction?: string;
}

export interface ContextTransferSpec {
  includeFiles: boolean;
  includeErrors: boolean;
  includeSolutions: boolean;
  includeProgress: boolean;
  includeMetadata: boolean;
  compressionLevel: "none" | "light" | "heavy";
  encryption: boolean;
  maxSize: number; // bytes
}

export interface SuccessCriterion {
  type: "validation" | "testing" | "performance" | "manual";
  condition: string;
  timeout: number;
}

export interface FailureHandling {
  strategy: "retry" | "fallback" | "escalate" | "rollback";
  maxRetries: number;
  fallbackModel?: string;
  escalationTarget?: string;
}

export interface RollbackProcedure {
  steps: string[];
  timeout: number;
  validation: string[];
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  initialDelay: number;
  maxDelay: number;
}

export interface ValidationStep {
  type: "syntax" | "semantic" | "performance" | "security";
  validator: string;
  timeout: number;
}

export class HandoffProtocolManager {
  private protocols: Map<string, HandoffProtocol> = new Map();
  private activeHandoffs: Map<string, ActiveHandoff> = new Map();

  constructor() {
    this.initializeDefaultProtocols();
  }

  registerProtocol(protocol: HandoffProtocol): void {
    this.validateProtocol(protocol);
    this.protocols.set(protocol.id, protocol);
  }

  getProtocol(protocolId: string): HandoffProtocol | undefined {
    return this.protocols.get(protocolId);
  }

  getProtocolsForCapability(
    capability: ModelCapability["type"],
  ): HandoffProtocol[] {
    return Array.from(this.protocols.values()).filter((protocol) =>
      protocol.requiredCapabilities.includes(capability),
    );
  }

  async initiateHandoff(
    protocolId: string,
    contextId: string,
    sourceModel: string,
    targetModel: string,
    triggerData: any,
  ): Promise<string> {
    const protocol = this.protocols.get(protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found: ${protocolId}`);
    }

    const handoffId = this.generateHandoffId(protocolId, contextId);

    const activeHandoff: ActiveHandoff = {
      id: handoffId,
      protocolId,
      contextId,
      sourceModel,
      targetModel,
      status: "initiated",
      startTime: new Date(),
      currentStep: 0,
      retryCount: 0,
      triggerData,
      logs: [],
    };

    this.activeHandoffs.set(handoffId, activeHandoff);

    try {
      await this.executeHandoff(handoffId);
      return handoffId;
    } catch (error) {
      activeHandoff.status = "failed";
      activeHandoff.error =
        error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  async getHandoffStatus(handoffId: string): Promise<ActiveHandoff | null> {
    return this.activeHandoffs.get(handoffId) || null;
  }

  async cancelHandoff(handoffId: string): Promise<void> {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff not found: ${handoffId}`);
    }

    handoff.status = "cancelled";
    handoff.endTime = new Date();
  }

  private async executeHandoff(handoffId: string): Promise<void> {
    const handoff = this.activeHandoffs.get(handoffId);
    if (!handoff) {
      throw new Error(`Handoff not found: ${handoffId}`);
    }

    const protocol = this.protocols.get(handoff.protocolId);
    if (!protocol) {
      throw new Error(`Protocol not found: ${handoff.protocolId}`);
    }

    handoff.status = "executing";

    for (let i = 0; i < protocol.handoffProcedure.steps.length; i++) {
      const step = protocol.handoffProcedure.steps[i];
      handoff.currentStep = i;

      try {
        await this.executeStep(step, handoff);
        handoff.logs.push({
          timestamp: new Date(),
          level: "info",
          message: `Completed step: ${step.name}`,
          stepId: step.id,
        });
      } catch (error) {
        handoff.logs.push({
          timestamp: new Date(),
          level: "error",
          message: `Failed step: ${step.name}`,
          stepId: step.id,
          error: error instanceof Error ? error.message : String(error),
        });

        await this.handleStepFailure(step, handoff, error);
        return;
      }
    }

    handoff.status = "completed";
    handoff.endTime = new Date();
  }

  private async executeStep(
    step: HandoffStep,
    handoff: ActiveHandoff,
  ): Promise<void> {
    // Implement step execution logic
    console.log(`Executing step: ${step.name} for handoff ${handoff.id}`);

    // Simulate step execution
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private async handleStepFailure(
    step: HandoffStep,
    handoff: ActiveHandoff,
    error: any,
  ): Promise<void> {
    const protocol = this.protocols.get(handoff.protocolId)!;

    if (handoff.retryCount < protocol.failureHandling.maxRetries) {
      handoff.retryCount++;
      handoff.status = "retrying";

      // Apply retry policy
      const delay = this.calculateRetryDelay(
        protocol.handoffProcedure.retryPolicy,
        handoff.retryCount,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry from failed step
      await this.executeHandoff(handoff.id);
    } else {
      handoff.status = "failed";
    }
  }

  private calculateRetryDelay(
    retryPolicy: RetryPolicy,
    retryCount: number,
  ): number {
    return retryPolicy.initialDelay;
  }

  private validateProtocol(protocol: HandoffProtocol): void {
    if (!protocol.id) throw new Error("Protocol must have id");
  }

  private generateHandoffId(protocolId: string, contextId: string): string {
    return `${protocolId}-${contextId}-${Date.now()}`;
  }

  private initializeDefaultProtocols(): void {}
}

export interface ActiveHandoff {
  id: string;
  protocolId: string;
  contextId: string;
  sourceModel: string;
  targetModel: string;
  status: "initiated" | "executing" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  currentStep: number;
  retryCount: number;
  triggerData: any;
  error?: string;
  logs: HandoffLog[];
}

export interface HandoffLog {
  timestamp: Date;
  level: "info" | "error";
  message: string;
  stepId?: string;
  error?: string;
}
