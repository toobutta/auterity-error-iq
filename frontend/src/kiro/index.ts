// Kiro Integration - Main Export
export { onErrorEvent } from "./hooks/error-intelligence.hook";
export {
  applyErrorSteering,
  errorSteeringRules,
} from "./steering/error-routing";
export { checkKiroPermission, kiroRoles } from "./permissions/error-analytics";
export { kiroModules, getEnabledKiroModules } from "./register";
export { testKiroIntegration } from "./test-integration";

export type { KiroErrorEvent } from "./hooks/error-intelligence.hook";
export type { ErrorSteeringRule } from "./steering/error-routing";
export type { KiroRole } from "./permissions/error-analytics";
export type { KiroModule } from "./register";


