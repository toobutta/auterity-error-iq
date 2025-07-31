# [TOOL] Task Delegation Guidelines

## Purpose
This steering document provides guidelines for delegating tasks to external tools like Cline, Claude Dev, or other AI coding assistants.

## Task Classification

### Ideal [TOOL] Tasks
- **Standard Component Development**: React components with clear specifications
- **Data Formatting and Display**: Components that transform and present data
- **Form Generation**: Dynamic forms based on configuration or API responses
- **Testing Implementation**: Unit and integration tests with defined requirements
- **API Integration**: Connecting frontend components to existing backend APIs
- **Utility Functions**: Helper functions with clear input/output specifications

### Human-Retained Tasks
- **UX/UI Design Decisions**: Layout, user experience, and visual design choices
- **Architecture Planning**: System design and technical architecture decisions
- **Complex State Management**: Real-time updates, complex data flows
- **Performance Optimization**: Advanced optimization requiring analysis
- **Security Implementation**: Authentication, authorization, and security features

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
- Use `[[TOOL]-TASK]` tag in task lists
- Specify recommended model/configuration
- Include complexity assessment
- Set realistic time estimates

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

### For Complex Logic Tasks
- **Recommended**: Larger models (70B+ parameters)
- **Use Cases**: Complex form generation, advanced filtering, state management
- **Examples**: llama-3.3-70b, Claude-3.5-Sonnet

### For Standard Implementation Tasks
- **Recommended**: Medium models (7B-32B parameters)
- **Use Cases**: Data display, simple forms, utility functions
- **Examples**: Qwen-3-32b, CodeLlama-34B

### For Testing and Documentation
- **Recommended**: Efficient models optimized for code analysis
- **Use Cases**: Unit tests, integration tests, documentation
- **Examples**: Specialized code models, smaller efficient models

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