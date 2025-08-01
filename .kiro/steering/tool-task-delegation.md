# [TOOL] Task Delegation Guidelines

## Purpose
This steering document provides guidelines for delegating tasks to external tools like Cline, Amazon Q (Claude 3.7), or other AI coding assistants.

## Task Classification

### Amazon Q (Claude 3.7) - Primary QA & Debugging Tool
- **Quality Assurance**: Code review, testing validation, bug identification
- **Debugging**: Terminal errors, runtime issues, compilation problems
- **Problem Resolution**: Error analysis, troubleshooting, diagnostic tasks
- **Code Analysis**: Performance bottlenecks, security vulnerabilities
- **Test Debugging**: Failed test analysis, test coverage improvements
- **Environment Issues**: Docker, dependency, configuration problems

### Cline - Development Implementation Tool
- **Standard Component Development**: React components with clear specifications
- **Data Formatting and Display**: Components that transform and present data
- **Form Generation**: Dynamic forms based on configuration or API responses
- **API Integration**: Connecting frontend components to existing backend APIs
- **Utility Functions**: Helper functions with clear input/output specifications
- **Refactoring Tasks**: Code restructuring with clear requirements

### Kiro - Architecture & Complex Logic
- **UX/UI Design Decisions**: Layout, user experience, and visual design choices
- **Architecture Planning**: System design and technical architecture decisions
- **Complex State Management**: Real-time updates, complex data flows
- **Performance Optimization**: Advanced optimization requiring analysis
- **Security Implementation**: Authentication, authorization, and security features
- **Integration Strategy**: Multi-tool coordination and complex workflows

## Task Specification Requirements

### Minimum Specification Elements
1. **Component Name and File Location**
2. **Props Interface with TypeScript definitions**
3. **API Integration details** (endpoints, request/response formats)
4. **Styling Requirements** (Tailwind classes, responsive design)
5. **Error Handling Requirements** (specific error scenarios)
6. **Success Criteria** (measurable acceptance criteria)

### Technical Context Required
- **Existing Code Patterns**: Reference similar components in codebase
- **API Client Usage**: How to use existing API functions
- **Type Definitions**: Location and usage of TypeScript interfaces
- **Testing Patterns**: Existing test structure and mocking strategies

## Quality Standards

### Code Quality Requirements
- **TypeScript**: Strict typing with no `any` types
- **Error Handling**: Comprehensive error scenarios covered
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Performance**: Memoization, lazy loading where appropriate
- **Testing**: Unit tests with 90%+ coverage

### Documentation Requirements
- **Component Documentation**: Props, usage examples, and behavior
- **API Integration**: How component interacts with backend
- **Error States**: All possible error conditions documented
- **Testing Strategy**: What is tested and how

## Success Metrics

### Primary Metrics
- **Completion Rate**: % of tasks completed without major revisions
- **Quality Score**: Code quality assessment (1-10 scale)
- **Time Accuracy**: Actual vs estimated completion time
- **Independence**: % of tasks completed without human intervention

### Quality Assessment Criteria
- **Functionality**: All requirements met and working correctly
- **Code Quality**: Clean, readable, maintainable code
- **Type Safety**: Proper TypeScript usage throughout
- **Error Handling**: Graceful handling of all error scenarios
- **Testing**: Comprehensive test coverage with reliable tests
- **Documentation**: Clear documentation and code comments

## Task Assignment Process

### 1. Task Preparation
- Create detailed specification document
- Define clear acceptance criteria
- Provide technical context and examples
- Set up tracking and monitoring

### 2. Task Assignment - TIMING STRATEGY
- **Lead Time Principle**: Assign tasks to [TOOL] 1-2 tasks ahead of current Kiro work
- [TOOL] requires development time, so delegate future tasks early
- Use task tags: `[AMAZON-Q-TASK]`, `[CLINE-TASK]`, `[KIRO-TASK]`
- Specify recommended model/configuration
- Include complexity assessment
- Set realistic time estimates

### Tool Selection Priority
1. **Amazon Q First**: For any QA, debugging, or problem resolution tasks
2. **Cline Second**: For standard development implementation tasks
3. **Kiro Last**: For architecture, complex logic, or multi-tool coordination

## Direct Tool Communication Protocol

### Cline ↔ Amazon Q Direct Handoffs
When both tools are active, enable direct communication to reduce Kiro coordination overhead:

#### Cline → Amazon Q Handoff Triggers
- **Build Errors**: Cline encounters compilation/build failures during implementation
- **Test Failures**: Cline's code fails existing or new tests
- **Runtime Issues**: Cline's implementation causes runtime errors
- **Performance Degradation**: Cline's changes impact performance metrics
- **Integration Problems**: Cline's code breaks existing functionality

#### Amazon Q → Cline Handoff Triggers  
- **Fix Implementation**: Amazon Q identifies root cause and provides specific fix instructions
- **Code Improvements**: Amazon Q suggests refactoring or optimization changes
- **Test Updates**: Amazon Q recommends test modifications or additions
- **Dependency Changes**: Amazon Q identifies needed package updates or additions

### Direct Communication Format
```markdown
## DIRECT HANDOFF: [CLINE/AMAZON-Q] → [AMAZON-Q/CLINE]

**Context:** [Brief description of current task/issue]
**Handoff Reason:** [Why this needs the other tool]
**Current State:** [What has been completed/attempted]
**Specific Request:** [Exact action needed from receiving tool]
**Success Criteria:** [How to verify completion]
**Return Conditions:** [When to hand back to original tool]

**Files Involved:**
- [List of relevant files]

**Priority:** High/Medium/Low
**Estimated Time:** [X minutes/hours]
```

### Communication Rules
1. **Direct Handoffs Only**: Use direct communication when both tools are actively working
2. **Clear Context**: Always provide complete context for seamless transition
3. **Specific Requests**: Make precise, actionable requests to avoid confusion
4. **Status Updates**: Provide brief status updates during long-running tasks
5. **Completion Confirmation**: Confirm task completion before handing back
6. **Escalation Path**: Escalate to Kiro only for complex architectural decisions

### Kiro Intervention Triggers
- **Tool Disagreement**: Cline and Amazon Q have conflicting approaches
- **Scope Expansion**: Task grows beyond original specification
- **Architecture Impact**: Changes affect system design or patterns
- **Resource Constraints**: Task exceeds time/complexity estimates
- **Quality Concerns**: Multiple iterations without satisfactory resolution

### 3. Progress Monitoring
- Regular check-ins on task progress
- Code review upon completion
- Quality assessment and scoring
- Documentation of issues and resolutions

### 4. Completion Process
- Thorough testing and integration
- Update task status and metrics
- Document lessons learned
- Prepare next task assignment

## Model Selection Guidelines

### Amazon Q (Claude 3.7) - QA & Debugging
- **Model**: Claude 3.7 (built-in to Amazon Q)
- **Strengths**: Advanced reasoning, debugging expertise, code analysis
- **Use Cases**: Error diagnosis, test failures, performance issues, security analysis
- **Best For**: Complex debugging scenarios requiring deep code understanding

### Cline - Development Implementation
- **Recommended**: Medium to large models (32B-70B parameters)
- **Use Cases**: Component development, API integration, standard implementations
- **Examples**: Qwen-3-32b, llama-3.3-70b, Claude-3.5-Sonnet
- **Best For**: Structured development tasks with clear specifications

### Kiro - Architecture & Strategy
- **Model**: Built-in advanced reasoning capabilities
- **Use Cases**: System design, complex state management, multi-tool coordination
- **Best For**: High-level planning and complex problem-solving

## Risk Mitigation

### High-Risk Factors
- **Complex State Management**: Real-time updates, complex data flows
- **Performance Requirements**: Large datasets, optimization needs
- **Integration Complexity**: Multiple API dependencies, complex workflows

### Mitigation Strategies
- **Incremental Delivery**: Break complex tasks into smaller pieces
- **Clear Specifications**: Detailed requirements and examples
- **Regular Check-ins**: Monitor progress and provide guidance
- **Fallback Plans**: Human takeover procedures for failed tasks

## Integration with Existing Codebase

### Code Style Compliance
- Follow existing naming conventions
- Use established patterns and structures
- Maintain consistency with current architecture
- Respect existing error handling patterns

### Dependency Management
- Use existing libraries and frameworks
- Don't introduce new dependencies without approval
- Follow established import patterns
- Maintain compatibility with existing code

## Amazon Q Delegation Patterns

### Immediate Delegation Triggers
- **Terminal Errors**: Any command-line errors or build failures
- **Test Failures**: Failed unit tests, integration tests, or CI/CD issues
- **Runtime Exceptions**: Application crashes, API errors, database connection issues
- **Performance Problems**: Slow queries, memory leaks, high CPU usage
- **Security Alerts**: Vulnerability scans, authentication issues, permission errors

### Amazon Q Task Format
```markdown
[AMAZON-Q-TASK] Problem Analysis: [Brief Description]

**Error Context:**
- Error message/stack trace
- Steps to reproduce
- Environment details

**Expected Outcome:**
- Root cause identification
- Specific fix recommendations
- Prevention strategies

**Priority:** High/Medium/Low
**Estimated Time:** [X hours]
```

### Quality Gates for Amazon Q
- **Root Cause Analysis**: Must identify underlying cause, not just symptoms
- **Fix Validation**: Provide testable solution with verification steps
- **Documentation**: Document findings for future reference
- **Prevention**: Suggest improvements to prevent similar issues

## Workflow Optimization for Direct Communication

### Autonomous Operation Mode
When Cline and Amazon Q are both active, they should operate with minimal Kiro oversight:

#### Self-Managing Workflows
1. **Error Detection**: Cline automatically hands off errors to Amazon Q
2. **Fix Implementation**: Amazon Q provides fixes directly to Cline
3. **Validation Loop**: Tools iterate until success criteria are met
4. **Status Reporting**: Brief progress updates to shared task log
5. **Completion Handback**: Final results reported to Kiro for integration

#### Efficiency Metrics
- **Handoff Speed**: < 30 seconds between tool transitions
- **Resolution Rate**: 80%+ of issues resolved without Kiro intervention
- **Iteration Count**: Average < 3 iterations per issue resolution
- **Context Preservation**: 100% of relevant context maintained across handoffs

### Communication Channels
- **Primary**: Direct tool-to-tool messaging via shared task documents
- **Secondary**: Shared status logs for progress tracking
- **Escalation**: Kiro notification only when intervention required

### Success Indicators
- Reduced Kiro coordination messages by 70%+
- Faster issue resolution through direct communication
- Maintained code quality and project standards
- Clear audit trail of tool interactions and decisions

## Continuous Improvement

### Learning from Results
- Track success rates by task type and complexity
- Identify patterns in successful vs failed tasks
- Refine task specifications based on outcomes
- Update guidelines based on experience

### Process Optimization
- Streamline specification creation
- Improve task breakdown strategies
- Enhance monitoring and feedback loops
- Optimize model selection criteria