// build.js: Generate JSON Schema from Zod
// Import from the compiled output to avoid ESM/TS path issues during build
import { writeFileSync } from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { WorkflowSchema } from "./dist/index.js";

const schema = zodToJsonSchema(WorkflowSchema, "Workflow");
writeFileSync("./dist/workflow.schema.json", JSON.stringify(schema, null, 2));
console.log("Generated dist/workflow.schema.json");
