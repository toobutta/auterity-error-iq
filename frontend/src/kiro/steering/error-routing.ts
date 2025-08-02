// Kiro Error Steering Rules
export interface ErrorSteeringRule {
  condition: (error: any) => boolean;
  route: string;
  action?: () => void;
}

export const errorSteeringRules: ErrorSteeringRule[] = [
  {
    condition: (error) => error.type === "validation",
    route: "retry_input_modal"
  },
  {
    condition: (error) => error.type === "runtime", 
    route: "show_stack_trace"
  },
  {
    condition: (error) => error.type === "ai_service",
    route: "escalate_to_agent"
  },
  {
    condition: (error) => error.type === "system",
    route: "notify_admin",
    action: () => {
      // Block execution for system errors
      console.warn('System error detected - blocking execution');
    }
  }
];

export const applyErrorSteering = (error: any): string => {
  const rule = errorSteeringRules.find(rule => rule.condition(error));
  if (rule) {
    rule.action?.();
    return rule.route;
  }
  return "default_error_display";
};