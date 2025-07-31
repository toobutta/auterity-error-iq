# Auto Cline Task Delegator Hook

## Purpose
Automatically delegate tasks marked as [CLINE-TASK] to Cline when pre-planning is complete and specifications are ready.

## Trigger Conditions
- Task status changes to "ready for delegation"
- Task specification document is created
- All dependencies are satisfied
- Human approval for delegation is given

## Auto-Delegation Process

### 1. Task Detection
```bash
# Scan for CLINE-TASK items that are ready
grep -n "\[CLINE-TASK\]" .kiro/specs/workflow-engine-mvp/tasks.md
```

### 2. Readiness Check
For each CLINE-TASK, verify:
- [ ] Specification document exists
- [ ] Dependencies are completed
- [ ] Task is marked as "not_started" or "ready"
- [ ] Required files and APIs are available

### 3. Model Selection Logic
```javascript
function selectClineModel(task) {
  const complexity = task.complexity;
  const category = task.category;
  
  if (complexity === "High" || category.includes("form") || category.includes("logic")) {
    return "llama-3.3-70b";
  } else if (category.includes("display") || category.includes("test")) {
    return "Qwen-3-32b";
  }
  
  return "llama-3.3-70b"; // default
}
```

### 4. Task Delegation Message Template
```markdown
# Cline Task Assignment: {task_id}

## Task Overview
**Task**: {task_name}
**Model**: {selected_model}
**Complexity**: {complexity_level}
**Estimated Effort**: {estimated_hours}

## Specification
Please refer to the detailed specification document:
`{spec_file_path}`

## Key Requirements
{requirements_list}

## Acceptance Criteria
{acceptance_criteria}

## Files to Create/Modify
{file_list}

## API Integration Required
{api_endpoints}

## Success Metrics
- Functionality: All acceptance criteria met
- Code Quality: Clean, readable, well-structured code
- Type Safety: No TypeScript errors or warnings
- Error Handling: Graceful handling of all error scenarios

## Next Steps
1. Review the specification document thoroughly
2. Set up the component structure
3. Implement core functionality
4. Add error handling and loading states
5. Test the component thoroughly
6. Update task status to completed

Please confirm you understand the requirements and are ready to begin implementation.
```

## Current Ready Tasks

### Task 11.1 - Workflow Execution Form ✅ READY
- **Status**: Specification complete, ready for delegation
- **Model**: Cerebras llama-3.3-70b
- **Spec File**: `cline-task-11.1-spec.md`
- **Dependencies**: ✅ All satisfied (API client, types, existing components)

### Task 11.3 - Execution Results Display 📋 PLANNED
- **Status**: Awaiting Task 11.1 completion
- **Model**: Cerebras Qwen-3-32b
- **Dependencies**: Task 11.1 (for execution ID handling)

### Task 11.4 - Execution History View 📊 PLANNED
- **Status**: Can be started in parallel with 11.1
- **Model**: Cerebras llama-3.3-70b
- **Dependencies**: API client, existing list patterns

## Auto-Delegation Commands

### Delegate Task 11.1 (Ready Now)
```bash
# Send task to Cline with specification
cline --model llama-3.3-70b --task-spec .kiro/specs/workflow-engine-mvp/cline-task-11.1-spec.md
```

### Delegate Task 11.4 (Ready Now)
```bash
# Can be started in parallel - create spec first
# Then delegate to Cline
cline --model llama-3.3-70b --task-spec .kiro/specs/workflow-engine-mvp/cline-task-11.4-spec.md
```

## Monitoring and Feedback

### Progress Tracking
- Monitor file changes in target directories
- Track commit messages for task-related changes
- Check for TypeScript compilation errors
- Verify component integration

### Quality Gates
- Code compiles without errors
- Components render without crashing
- Basic functionality works as specified
- Error handling is implemented
- Loading states are present

### Escalation Triggers
- Task takes longer than estimated time + 50%
- Multiple compilation errors persist
- Component doesn't meet basic acceptance criteria
- Cline requests human intervention

## Integration with Task Tracker

### On Delegation
```javascript
logTaskAssignment({
  taskId: "11.1",
  assignedModel: "llama-3.3-70b",
  assignedDate: new Date(),
  estimatedEffort: "2-3 hours",
  specificationFile: "cline-task-11.1-spec.md"
});
```

### On Completion
```javascript
logTaskCompletion({
  taskId: "11.1",
  completionDate: new Date(),
  actualEffort: "2.5 hours",
  qualityScore: calculateQualityScore(),
  issuesFound: getIssuesList(),
  humanInterventionRequired: false
});
```

## Usage Instructions

### Manual Delegation
1. Ensure task specification is complete
2. Verify dependencies are satisfied
3. Run the auto-delegator hook
4. Monitor progress through file changes
5. Review and approve completed work

### Automatic Delegation (Future)
1. Hook monitors task status changes
2. Automatically detects ready CLINE-TASK items
3. Sends delegation message to Cline
4. Starts progress monitoring
5. Reports completion status

## Current Action Required

**Task 11.1 is ready for immediate delegation to Cline.**

Specification document: `.kiro/specs/workflow-engine-mvp/cline-task-11.1-spec.md`
Recommended model: `Cerebras llama-3.3-70b`
Estimated completion: 2-3 hours

Would you like me to send the delegation message to Cline now?