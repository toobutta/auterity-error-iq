/**
 * Phase 1: Orchestration Layer Foundation Types
 * Core TypeScript interfaces for the Optimized AI Workflow Strategy
 */

// Core Enums
export enum AITool {
  AMAZON_Q = 'amazon-q',
  CURSOR_IDE = 'cursor-ide', 
  CLINE = 'cline',
  KIRO = 'kiro'
}

export enum BlockStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  FAILED = 'failed'
}

export enum Priority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum QualityGateType {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
  CODE_QUALITY = 'code-quality',
  ACCESSIBILITY = 'accessibility',
  TYPESCRIPT_COMPLIANCE = 'typescript-compliance'
}

export enum QualityGateStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

export enum ErrorSeverity {
  CRITICAL = 'critical',    // Blocks all development
  HIGH = 'high',           // Blocks current stream
  MEDIUM = 'medium',       // Requires attention
  LOW = 'low'             // Can be deferred
}

export enum ErrorCategory {
  SECURITY = 'security',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
  QUALITY = 'quality',
  DEPENDENCY = 'dependency',
  TYPESCRIPT = 'typescript'
}

// Core Interfaces
export interface DevelopmentBlock {
  id: string;
  name: string;
  description: string;
  assignedTool: AITool;
  dependencies: string[];
  inputs: BlockInput[];
  outputs: BlockOutput[];
  successCriteria: SuccessCriteria[];
  estimatedHours: number;
  priority: Priority;
  status: BlockStatus;
  qualityGates: QualityGate[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface BlockInput {
  id: string;
  name: string;
  type: 'file' | 'data' | 'config' | 'dependency';
  description: string;
  required: boolean;
  source?: string;
  validation?: ValidationRule[];
}

export interface BlockOutput {
  id: string;
  name: string;
  type: 'file' | 'data' | 'artifact' | 'report';
  description: string;
  target?: string;
  validation?: ValidationRule[];
}

export interface SuccessCriteria {
  id: string;
  description: string;
  type: 'automated' | 'manual';
  validation: string; // validation logic or test reference
  weight: number; // 0-1, importance weight
}

export interface ValidationRule {
  type: 'schema' | 'format' | 'custom';
  rule: string;
  errorMessage: string;
}

export interface QualityGate {
  id: string;
  name: string;
  type: QualityGateType;
  criteria: QualityCriteria[];
  automatedChecks: AutomatedCheck[];
  threshold: QualityThreshold;
  status: QualityGateStatus;
  blockId: string;
  executedAt?: Date;
  completedAt?: Date;
  result?: QualityGateResult;
}

export interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  threshold: number;
  metric: string;
}

export interface AutomatedCheck {
  id: string;
  name: string;
  type: 'lint' | 'test' | 'security' | 'performance' | 'integration';
  command: string;
  timeout: number;
  retries: number;
  successCriteria: string;
}

export interface QualityThreshold {
  minScore: number;
  maxErrors: number;
  maxWarnings: number;
  requiredPassing: string[]; // IDs of required checks
}

export interface QualityGateResult {
  score: number;
  passed: boolean;
  errors: QualityError[];
  warnings: QualityWarning[];
  checkResults: CheckResult[];
  metrics: Record<string, number>;
}

export interface QualityError {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  source: string;
  line?: number;
  column?: number;
  rule?: string;
}

export interface QualityWarning {
  id: string;
  message: string;
  source: string;
  line?: number;
  column?: number;
  rule?: string;
}

export interface CheckResult {
  checkId: string;
  passed: boolean;
  score: number;
  duration: number;
  output: string;
  errors: string[];
}

// Progress Tracking
export interface ProgressReport {
  timestamp: Date;
  overallProgress: number; // 0-100
  streamProgress: StreamProgress[];
  blockers: Blocker[];
  qualityMetrics: QualityMetrics;
  timeline: TimelineStatus;
  risks: Risk[];
  recommendations: Recommendation[];
}

export interface StreamProgress {
  tool: AITool;
  completedBlocks: number;
  totalBlocks: number;
  currentBlock: DevelopmentBlock | null;
  velocity: number; // blocks per hour
  qualityScore: number; // 0-100
  utilization: number; // 0-100
  blockers: Blocker[];
}

export interface Blocker {
  id: string;
  type: 'dependency' | 'resource' | 'quality' | 'integration' | 'external';
  severity: ErrorSeverity;
  description: string;
  affectedBlocks: string[];
  estimatedResolutionTime: number; // hours
  assignedTool?: AITool;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface QualityMetrics {
  codeCoverage: number;          // Target: >90%
  testPassRate: number;          // Target: >95%
  securityVulnerabilities: number; // Target: 0 critical/high
  performanceRegression: number;  // Target: <5%
  integrationFailures: number;   // Target: <2%
  codeQualityScore: number;      // Target: >8.5/10
  typeScriptCompliance: number;  // Target: 100%
}

export interface TimelineStatus {
  originalEstimate: number; // hours
  currentEstimate: number; // hours
  elapsed: number; // hours
  remaining: number; // hours
  onTrack: boolean;
  riskFactors: string[];
}

export interface Risk {
  id: string;
  type: 'schedule' | 'quality' | 'resource' | 'technical' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: number; // 0-1
  description: string;
  mitigation: string;
  owner: AITool;
}

export interface Recommendation {
  id: string;
  type: 'optimization' | 'risk-mitigation' | 'quality-improvement' | 'resource-allocation';
  priority: Priority;
  description: string;
  expectedBenefit: string;
  estimatedEffort: number; // hours
  targetTool: AITool;
}

// Tool Specialization
export interface ToolSpecialization {
  tool: AITool;
  primaryCapabilities: Capability[];
  supportCapabilities: Capability[];
  restrictions: string[];
  maxConcurrentBlocks: number;
  averageVelocity: number; // blocks per hour
  qualityWeight: number; // 0-1, how much to weight quality vs speed
}

export interface Capability {
  name: string;
  proficiency: 'expert' | 'proficient' | 'basic';
  blockTypes: string[];
  estimatedVelocity: number; // blocks per hour for this capability
}

// Development Plan
export interface DevelopmentPlan {
  id: string;
  name: string;
  description: string;
  phases: DevelopmentPhase[];
  totalEstimatedHours: number;
  startDate: Date;
  targetEndDate: Date;
  qualityRequirements: QualityRequirements;
  resourceAllocation: ResourceAllocation[];
  riskAssessment: Risk[];
}

export interface DevelopmentPhase {
  id: string;
  name: string;
  description: string;
  blocks: DevelopmentBlock[];
  dependencies: string[]; // other phase IDs
  estimatedHours: number;
  parallelizable: boolean;
  qualityGates: QualityGate[];
}

export interface QualityRequirements {
  minCodeCoverage: number;
  maxSecurityVulnerabilities: number;
  minPerformanceScore: number;
  requiredCompliance: string[];
  typeScriptStrictMode: boolean;
}

export interface ResourceAllocation {
  tool: AITool;
  allocatedHours: number;
  maxConcurrency: number;
  priority: Priority;
  specializations: string[];
}

// Orchestrator Interfaces
export interface KiroOrchestrator {
  planDevelopmentBlocks(requirements: any): Promise<DevelopmentPlan>;
  assignBlock(block: DevelopmentBlock, tool: AITool): Promise<Assignment>;
  resolveConflicts(conflicts: Conflict[]): Promise<Resolution[]>;
  monitorProgress(): Promise<ProgressReport>;
  escalateIssues(issues: Issue[]): Promise<EscalationResponse>;
}

export interface Assignment {
  id: string;
  blockId: string;
  tool: AITool;
  assignedAt: Date;
  expectedStartAt: Date;
  expectedCompletionAt: Date;
  priority: Priority;
  context: AssignmentContext;
}

export interface AssignmentContext {
  dependencies: string[];
  sharedResources: string[];
  constraints: string[];
  qualityRequirements: QualityRequirements;
  communicationChannels: string[];
}

export interface Conflict {
  id: string;
  type: 'resource' | 'dependency' | 'quality' | 'timeline';
  severity: ErrorSeverity;
  description: string;
  affectedBlocks: string[];
  affectedTools: AITool[];
  detectedAt: Date;
}

export interface Resolution {
  conflictId: string;
  strategy: 'reorder' | 'reassign' | 'split' | 'merge' | 'escalate';
  description: string;
  implementedAt: Date;
  impact: ResolutionImpact;
}

export interface ResolutionImpact {
  timelineChange: number; // hours
  resourceChange: number; // percentage
  qualityImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Issue {
  id: string;
  type: 'blocker' | 'quality' | 'resource' | 'integration';
  severity: ErrorSeverity;
  description: string;
  context: any;
  reportedBy: AITool;
  reportedAt: Date;
}

export interface EscalationResponse {
  issueId: string;
  action: 'resolve' | 'reassign' | 'defer' | 'escalate_further';
  description: string;
  assignedTo: AITool;
  expectedResolution: Date;
  followUpRequired: boolean;
}
