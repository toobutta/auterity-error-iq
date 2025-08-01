
# .kiro/steering/error.md

## Routing Rules for Error Categories

- If error.type == "validation":
    route: retry_input_modal
- If error.type == "runtime":
    route: show_stack_trace
- If error.type == "ai_service":
    route: escalate_to_agent
- If error.type == "system":
    route: notify_admin + block_execution
