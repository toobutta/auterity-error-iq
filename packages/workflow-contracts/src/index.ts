import { z } from "zod";

export const PortSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
});

export type Port = z.infer<typeof PortSchema>;

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }).optional(),
  data: z.record(z.any()).optional(),
  ports: z.array(PortSchema).optional(),
});

export type Node = z.infer<typeof NodeSchema>;

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourcePort: z.string().optional(),
  targetPort: z.string().optional(),
  label: z.string().optional(),
  routing: z.string().optional(),
});

export type Edge = z.infer<typeof EdgeSchema>;

export const ViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
});

export type Viewport = z.infer<typeof ViewportSchema>;

export const WorkflowSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  id: z.string(),
  metadata: z.record(z.any()).optional(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  viewport: ViewportSchema.optional(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Export adapters
export { canonicalToReactflow } from "./adapters/canonicalToReactflow.js";
export { reactflowToCanonical } from "./adapters/reactflowToCanonical.js";

