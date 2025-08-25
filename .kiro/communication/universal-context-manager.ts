/**
 * Universal Context Manager for BYOM Support
 * Handles shared context across different AI models and tools
 */

import { ToolMessage, SharedContext as BaseSharedContext } from "./tool-bridge";
import { ModelRegistration } from "./model-registry";

export interface UniversalContext extends BaseSharedContext {
  modelId?: string;
  modelType?: string;
  contextVersion: string;
  compressionLevel: "none" | "light" | "heavy";
  parentContextId?: string;
  childContexts: string[];
  metadata: UniversalMetadata;
  snapshots: ContextSnapshot[];
}

export interface UniversalMetadata {
  modelCapabilities: string[];
  taskType: string;
  complexity: "low" | "medium" | "high";
  estimatedTokens: number;
  actualTokens: number;
  costEstimate: number;
  privacyLevel: "public" | "internal" | "confidential" | "restricted";
  retentionPolicy: {
    duration: number; // days
    autoArchive: boolean;
    autoDelete: boolean;
  };
  tags: string[];
  customFields: Record<string, any>;
}

export interface ContextSnapshot {
  id: string;
  timestamp: Date;
  modelId: string;
  action: string;
  state: any;
  size: number;
  checksum: string;
}

export interface ContextTranslation {
  fromModel: string;
  toModel: string;
  translationRules: TranslationRule[];
  compatibilityScore: number;
}

export interface TranslationRule {
  type:
    | "field-mapping"
    | "format-conversion"
    | "value-transformation"
    | "filtering";
  source: string;
  target: string;
  transformer?: (value: any) => any;
}

export class UniversalContextManager {
  private contexts: Map<string, UniversalContext> = new Map();
  private contextCache: Map<
    string,
    { context: UniversalContext; lastAccessed: Date }
  > = new Map();
  private translations: Map<string, ContextTranslation> = new Map();
  private maxCacheSize = 100;
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  async createContext(
    taskId: string,
    modelId: string,
    initialData: Partial<UniversalContext>,
  ): Promise<string> {
    const contextId = this.generateContextId(taskId, modelId);

    const context: UniversalContext = {
      taskId,
      modelId,
      modelType: this.getModelType(modelId),
      contextVersion: "1.0.0",
      compressionLevel: "light",
      files: [],
      errors: [],
      solutions: [],
      progress: {
        currentStep: "initialization",
        completedSteps: [],
        totalSteps: 1,
        estimatedCompletion: new Date(Date.now() + 3600000), // 1 hour from now
      },
      childContexts: [],
      metadata: {
        modelCapabilities: [],
        taskType: "general",
        complexity: "medium",
        estimatedTokens: 0,
        actualTokens: 0,
        costEstimate: 0,
        privacyLevel: "internal",
        retentionPolicy: {
          duration: 30,
          autoArchive: true,
          autoDelete: false,
        },
        tags: [],
        customFields: {},
      },
      snapshots: [],
      ...initialData,
    };

    this.contexts.set(contextId, context);
    this.contextCache.set(contextId, { context, lastAccessed: new Date() });

    // Clean up old cache entries
    this.cleanupCache();

    return contextId;
  }

  async getContext(contextId: string): Promise<UniversalContext | null> {
    // Check cache first
    const cached = this.contextCache.get(contextId);
    if (cached) {
      cached.lastAccessed = new Date();
      return cached.context;
    }

    // Check main storage
    const context = this.contexts.get(contextId);
    if (context) {
      this.contextCache.set(contextId, { context, lastAccessed: new Date() });
      return context;
    }

    return null;
  }

  async updateContext(
    contextId: string,
    updates: Partial<UniversalContext>,
  ): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    // Create snapshot before major updates
    if (this.shouldCreateSnapshot(updates)) {
      await this.createSnapshot(contextId);
    }

    // Merge updates
    const updatedContext = { ...context, ...updates };
    updatedContext.metadata.actualTokens = this.estimateTokens(updatedContext);

    this.contexts.set(contextId, updatedContext);
    this.contextCache.set(contextId, {
      context: updatedContext,
      lastAccessed: new Date(),
    });
  }

  async translateContext(
    contextId: string,
    fromModelId: string,
    toModelId: string,
  ): Promise<UniversalContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const translationKey = `${fromModelId}->${toModelId}`;
    const translation = this.translations.get(translationKey);

    if (!translation) {
      throw new Error(`No translation available: ${translationKey}`);
    }

    // Apply translation rules
    const translatedContext = this.applyTranslation(context, translation);

    // Update model-specific fields
    translatedContext.modelId = toModelId;
    translatedContext.modelType = this.getModelType(toModelId);

    return translatedContext;
  }

  async archiveContext(contextId: string): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    context.metadata.retentionPolicy.autoArchive = true;
    context.metadata.retentionPolicy.autoDelete = false;

    // Compress context
    const compressed = await this.compressContext(context);
    this.contexts.set(contextId, compressed);
    this.contextCache.delete(contextId);
  }

  async deleteContext(contextId: string): Promise<void> {
    this.contexts.delete(contextId);
    this.contextCache.delete(contextId);

    // Clean up child contexts
    const childContexts = Array.from(this.contexts.values())
      .filter((ctx) => ctx.parentContextId === contextId)
      .map((ctx) => this.generateContextId(ctx.taskId, ctx.modelId!));

    for (const childId of childContexts) {
      await this.deleteContext(childId);
    }
  }

  async createSnapshot(contextId: string): Promise<string> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const snapshot: ContextSnapshot = {
      id: this.generateSnapshotId(),
      timestamp: new Date(),
      modelId: context.modelId!,
      action: "manual_snapshot",
      state: this.serializeContext(context),
      size: this.estimateContextSize(context),
      checksum: this.generateChecksum(context),
    };

    context.snapshots.push(snapshot);
    await this.updateContext(contextId, { snapshots: context.snapshots });

    return snapshot.id;
  }

  async restoreSnapshot(contextId: string, snapshotId: string): Promise<void> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const snapshot = context.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }

    const restoredContext = this.deserializeContext(snapshot.state);
    await this.updateContext(contextId, restoredContext);
  }

  async compressContext(context: UniversalContext): Promise<UniversalContext> {
    // Implement context compression
    const compressed = { ...context };

    // Compress file contents
    compressed.files = context.files.map((file) => ({
      ...file,
      content: this.compressContent(file.content),
    }));

    // Compress error messages
    compressed.errors = context.errors.map((error) => ({
      ...error,
      message: this.compressContent(error.message),
      stack: error.stack ? this.compressContent(error.stack) : undefined,
    }));

    compressed.compressionLevel = "heavy";

    return compressed;
  }

  async decompressContext(
    context: UniversalContext,
  ): Promise<UniversalContext> {
    // Implement context decompression
    const decompressed = { ...context };

    decompressed.files = context.files.map((file) => ({
      ...file,
      content: this.decompressContent(file.content),
    }));

    decompressed.errors = context.errors.map((error) => ({
      ...error,
      message: this.decompressContent(error.message),
      stack: error.stack ? this.decompressContent(error.stack) : undefined,
    }));

    decompressed.compressionLevel = "none";

    return decompressed;
  }

  async getContextHistory(contextId: string): Promise<ContextSnapshot[]> {
    const context = await this.getContext(contextId);
    if (!context) {
      return [];
    }

    return context.snapshots.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  async getRelatedContexts(taskId: string): Promise<UniversalContext[]> {
    const related = Array.from(this.contexts.values()).filter(
      (ctx) => ctx.taskId === taskId || ctx.parentContextId === taskId,
    );

    return related;
  }

  // Utility methods
  private generateContextId(taskId: string, modelId: string): string {
    return `${taskId}_${modelId}_${Date.now()}`;
  }

  private generateSnapshotId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getModelType(modelId: string): string {
    // This would typically query the model registry
    return "unknown";
  }

  private shouldCreateSnapshot(updates: Partial<UniversalContext>): boolean {
    // Create snapshot for major changes
    return !!(
      updates.files?.length ||
      updates.errors?.length ||
      updates.solutions?.length
    );
  }

  private estimateTokens(context: UniversalContext): number {
    let totalTokens = 0;

    // Estimate tokens for files
    context.files.forEach((file) => {
      totalTokens += Math.ceil(file.content.length / 4); // Rough estimate
    });

    // Estimate tokens for errors
    context.errors.forEach((error) => {
      totalTokens += Math.ceil(error.message.length / 4);
    });

    // Estimate tokens for solutions
    context.solutions.forEach((solution) => {
      totalTokens += Math.ceil(solution.description.length / 4);
    });

    return totalTokens;
  }

  private estimateContextSize(context: UniversalContext): number {
    return JSON.stringify(context).length;
  }

  private serializeContext(context: UniversalContext): any {
    return JSON.parse(JSON.stringify(context));
  }

  private deserializeContext(state: any): Partial<UniversalContext> {
    return state;
  }

  private generateChecksum(context: UniversalContext): string {
    const str = JSON.stringify(context);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private compressContent(content: string): string {
    // Simple compression - in production, use proper compression
    return content; // Placeholder
  }

  private decompressContent(content: string): string {
    // Simple decompression - in production, use proper decompression
    return content; // Placeholder
  }

  private applyTranslation(
    context: UniversalContext,
    translation: ContextTranslation,
  ): UniversalContext {
    const translated = { ...context };

    translation.translationRules.forEach((rule) => {
      if (rule.type === "field-mapping") {
        // Apply field mapping
        const sourceValue = this.getNestedValue(context, rule.source);
        this.setNestedValue(translated, rule.target, sourceValue);
      }
    });

    return translated;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private cleanupCache(): void {
    if (this.contextCache.size <= this.maxCacheSize) return;

    const entries = Array.from(this.contextCache.entries());
    const now = Date.now();

    // Remove expired entries
    const expired = entries.filter(
      ([, cached]) => now - cached.lastAccessed.getTime() > this.cacheExpiry,
    );

    expired.forEach(([id]) => this.contextCache.delete(id));

    // If still over limit, remove oldest
    if (this.contextCache.size > this.maxCacheSize) {
      const sorted = entries.sort(
        ([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime(),
      );

      const toRemove = sorted.slice(
        0,
        this.contextCache.size - this.maxCacheSize,
      );
      toRemove.forEach(([id]) => this.contextCache.delete(id));
    }
  }
}

// Global context manager instance
export const universalContextManager = new UniversalContextManager();
