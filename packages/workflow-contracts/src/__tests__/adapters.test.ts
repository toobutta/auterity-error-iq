import { describe, expect, it } from "vitest";
import { canonicalToReactflow } from "../adapters/canonicalToReactflow";
import { reactflowToCanonical } from "../adapters/reactflowToCanonical";
import { WorkflowSchema } from "../index";
import { largeWorkflow, mediumWorkflow, smallWorkflow } from "./fixtures";

const workflows = [smallWorkflow, mediumWorkflow, largeWorkflow];

describe("Adapter round-trip conversion", () => {
  workflows.forEach((wf, idx) => {
    it(`should convert RF → Canonical → RF (fixture ${idx})`, () => {
      const canonical = reactflowToCanonical(wf);
      const parsed = WorkflowSchema.safeParse(canonical);
      expect(parsed.success).toBe(true);
      const rf2 = canonicalToReactflow(canonical);
      expect(rf2.id).toBe(wf.id);
      expect(rf2.nodes.length).toBe(wf.nodes.length);
      expect(rf2.edges.length).toBe(wf.edges.length);
    });
  });
});
