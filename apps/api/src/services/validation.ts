import { Workflow, WorkflowSchema } from '@auterity/workflow-contracts';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class ValidationService {
  private ajv: Ajv;
  private workflowJsonSchema: any;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    
    // Generate JSON Schema from Zod
    this.workflowJsonSchema = zodToJsonSchema(WorkflowSchema, 'Workflow');
    this.ajv.addSchema(this.workflowJsonSchema, 'workflow');
  }

  validateWorkflow(data: unknown): { valid: boolean; errors?: any[] } {
    const validate = this.ajv.getSchema('workflow');
    if (!validate) {
      throw new Error('Workflow schema not found');
    }

    const valid = validate(data);
    return {
      valid,
      errors: validate.errors || undefined
    };
  }

  // Also validate with Zod for type safety
  validateWithZod(data: unknown): { success: boolean; data?: Workflow; error?: any } {
    const result = WorkflowSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      error: result.success ? undefined : result.error
    };
  }

  getJsonSchema() {
    return this.workflowJsonSchema;
  }
}
