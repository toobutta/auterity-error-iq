# [TOOL] Task Tracking Hook

## Purpose

This hook tracks [TOOL]'s performance on delegated tasks to measure success rates and identify patterns for optimal task delegation.

## Trigger

- Manual execution when starting/completing [TOOL] tasks
- Can be automated to run when task status changes in specs

## Tracking Data

### Task Assignment Record

```json
{
  "task_id": "11.1",
  "task_name": "Build workflow execution trigger form component",
  "assigned_date": "2025-01-28",
  "assigned_tool": "[TOOL]",
  "assigned_model": "Cerebras llama-3.3-70b",
  "complexity": "Medium",
  "category": "Frontend Component",
  "estimated_effort": "2-3 hours",
  "requirements": ["2.1", "3.2"]
}
```

### Task Completion Record

```json
{
  "task_id": "11.1",
  "completion_date": "2025-01-28",
  "status": "completed|failed|partial",
  "actual_effort": "2.5 hours",
  "quality_score": 8.5,
  "issues_found": ["TypeScript type errors", "Missing error handling"],
  "human_intervention_required": true,
  "follow_up_tasks": ["Fix type errors", "Add error boundaries"]
}
```

## Success Metrics

### Primary Metrics

- **Completion Rate**: % of tasks completed without major issues
- **Quality Score**: 1-10 rating based on code quality, requirements fulfillment
- **Effort Accuracy**: How close actual effort was to estimated
- **Independence Score**: % of tasks completed without human intervention

### Secondary Metrics

- **Model Performance**: Compare success rates between different models
- **Task Complexity**: Success rate by complexity level
- **Category Performance**: Success rate by task type (Frontend, Backend, Testing)

## Current [TOOL] Task Assignments

### Task 11.1 - Workflow Execution Form [ASSIGNED]

- **Tool**: [TOOL]
- **Model**: Cerebras llama-3.3-70b
- **Assigned**: 2025-01-28
- **Status**: Not Started
- **Complexity**: Medium
- **Estimated Effort**: 2-3 hours

### Task 11.3 - Execution Results Display [PLANNED]

- **Tool**: [TOOL]
- **Model**: Cerebras Qwen-3-32b
- **Status**: Planned
- **Complexity**: Medium
- **Estimated Effort**: 2-3 hours

### Task 11.4 - Execution History View [PLANNED]

- **Tool**: [TOOL]
- **Model**: Cerebras llama-3.3-70b
- **Status**: Planned
- **Complexity**: High
- **Estimated Effort**: 4-5 hours

### Task 11.6 - Component Testing [PLANNED]

- **Tool**: [TOOL]
- **Model**: Cerebras Qwen-3-32b
- **Status**: Planned
- **Complexity**: Medium
- **Estimated Effort**: 3-4 hours

## Hook Actions

### On Task Assignment

1. Log task assignment with metadata
2. Create detailed specification document
3. Set up monitoring for task progress
4. Estimate completion timeline

### On Task Completion

1. Evaluate task completion quality
2. Record actual vs estimated effort
3. Document issues and interventions needed
4. Update success rate metrics
5. Generate lessons learned

### On Task Failure

1. Analyze failure reasons
2. Document what went wrong
3. Determine if task should be reassigned or modified
4. Update model performance metrics

## Reporting

### Weekly Report

- Overall [TOOL] success rate
- Model performance comparison
- Task complexity analysis
- Recommendations for future assignments

### Monthly Analysis

- Trend analysis of [TOOL] performance
- Optimal task types for delegation
- Model selection recommendations
- Process improvements

## Usage Instructions

1. **Starting a [TOOL] Task**: Run this hook to log task assignment
2. **Completing a [TOOL] Task**: Run hook to record completion metrics
3. **Weekly Review**: Generate performance report
4. **Task Planning**: Use historical data to inform future assignments

## Integration with Kiro

This hook can be integrated with Kiro's task management to:

- Automatically detect when [TOOL] tasks are assigned
- Monitor task progress through file changes
- Generate alerts if tasks are taking longer than expected
- Provide recommendations for task delegation based on historical performance
