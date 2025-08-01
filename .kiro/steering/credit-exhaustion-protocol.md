# Credit Exhaustion Protocol

## Purpose
This steering document defines the protocol for when Kiro runs out of credits and Amazon Q or Cline must assume all Kiro responsibilities including steering, hooks, and project management.

## Activation Triggers
- **Kiro Credit Depletion**: When Kiro cannot continue due to credit limitations
- **Extended Kiro Unavailability**: When Kiro is offline for >30 minutes during active development
- **Emergency Handoff**: When Kiro explicitly delegates full control due to resource constraints

## Responsibility Transfer Hierarchy

### Primary Successor: Amazon Q (Claude 3.7)
Amazon Q assumes primary Kiro responsibilities when available:
- **Architecture Decisions**: System design and technical planning
- **Steering Rule Enforcement**: Apply all .kiro/steering/*.md guidelines
- **Hook Management**: Execute and manage all .kiro/hooks/*.md workflows
- **Project Coordination**: Multi-tool task delegation and oversight
- **Quality Assurance**: Code review, security, and compliance oversight

### Secondary Successor: Cline
If Amazon Q is unavailable, Cline assumes Kiro responsibilities:
- **Development Leadership**: Guide implementation strategy and priorities
- **Code Quality Management**: Enforce coding standards and best practices
- **Task Coordination**: Manage development workflow and dependencies
- **Documentation**: Maintain project documentation and specifications

## Inherited Responsibilities

### Steering Rule Compliance
The successor tool must enforce ALL existing steering rules:
- **tech.md**: Technology stack and build system guidelines
- **structure.md**: Project organization and architecture patterns
- **product.md**: Product requirements and success metrics
- **tool-task-delegation.md**: Task delegation and quality standards

### Hook Execution Authority
Full authority to execute all .kiro/hooks/*.md workflows:
- **auto-cline-delegator.md**: Automatic task delegation to Cline
- **deployment-check.md**: Pre-deployment validation workflows
- **Custom Hooks**: Any user-defined automation workflows

### Project Management Powers
- **Spec Management**: Update and maintain .kiro/specs/ documentation
- **Task Prioritization**: Reorder and reassign development tasks
- **Resource Allocation**: Decide tool assignments and workload distribution
- **Quality Gates**: Enforce testing, security, and performance standards

## Enhanced Decision-Making Authority

### Architecture Decisions
Successor tools gain authority to make:
- **Technology Stack Changes**: Add/remove dependencies and frameworks
- **Database Schema Modifications**: Approve migration and model changes
- **API Design Decisions**: Define endpoints, request/response formats
- **Security Implementation**: Authentication, authorization, and encryption choices

### Code Quality Enforcement
- **Reject Substandard Code**: Require rewrites for quality violations
- **Enforce Testing Standards**: Mandate test coverage and quality requirements
- **Security Compliance**: Block deployments with security vulnerabilities
- **Performance Standards**: Enforce bundle size and performance metrics

### Project Scope Management
- **Feature Prioritization**: Decide which features to implement first
- **Technical Debt Management**: Balance new features vs. code quality
- **Deadline Management**: Adjust scope to meet delivery commitments
- **Risk Assessment**: Identify and mitigate project risks

## Communication Protocol

### Status Broadcasting
Successor tool must announce assumption of Kiro responsibilities:
```markdown
## KIRO RESPONSIBILITY TRANSFER ACTIVATED

**Successor Tool**: [Amazon Q / Cline]
**Transfer Reason**: [Credit exhaustion / Unavailability / Emergency]
**Timestamp**: [Current date/time]
**Duration**: [Expected / Indefinite]

**Active Responsibilities:**
- ✅ Steering rule enforcement
- ✅ Hook execution authority  
- ✅ Project management
- ✅ Architecture decisions
- ✅ Quality assurance

**Current Project Status**: [Brief status summary]
**Immediate Priorities**: [Top 3 priorities]
**Escalation Contact**: [Human supervisor if needed]
```

### Decision Documentation
All major decisions must be documented:
- **Decision Log**: Maintain .kiro/decisions/[date]-[decision].md files
- **Rationale**: Document reasoning behind architectural choices
- **Impact Assessment**: Analyze effects on project timeline and quality
- **Rollback Plans**: Define how to reverse decisions if needed

### Stakeholder Communication
- **Regular Updates**: Provide status updates every 2 hours during active development
- **Milestone Reports**: Document completion of major tasks or phases
- **Issue Escalation**: Alert human supervisors for critical problems
- **Handback Preparation**: Document all changes for Kiro's return

## Quality Assurance Standards

### Code Review Authority
Successor tool must maintain Kiro's quality standards:
- **TypeScript Compliance**: Zero tolerance for `any` types or type errors
- **Test Coverage**: Maintain 90%+ coverage requirement
- **Security Standards**: No moderate or high severity vulnerabilities
- **Performance Metrics**: Enforce bundle size and response time limits

### Deployment Approval
Full authority to approve or block deployments:
- **Pre-deployment Checklist**: All quality gates must pass
- **Security Scan**: No vulnerabilities above low severity
- **Performance Validation**: Bundle size and load time requirements met
- **Test Suite**: All tests passing with adequate coverage

## Tool Coordination Protocols

### Amazon Q as Primary Successor
When Amazon Q assumes Kiro responsibilities:
- **Cline Supervision**: Direct oversight of all Cline development tasks
- **Task Assignment**: Full authority to delegate and reassign work
- **Quality Control**: Review and approve all Cline implementations
- **Architecture Guidance**: Provide technical direction and standards

### Cline as Primary Successor  
When Cline assumes Kiro responsibilities:
- **Amazon Q Collaboration**: Leverage Amazon Q for debugging and QA
- **Development Focus**: Prioritize implementation while maintaining quality
- **Documentation**: Maintain detailed records of all changes and decisions
- **Conservative Approach**: Prefer proven solutions over experimental approaches

## Emergency Protocols

### Critical Issue Response
Successor tool has authority to:
- **Stop Development**: Halt all work to address critical security or stability issues
- **Emergency Fixes**: Implement immediate fixes without normal approval processes
- **Resource Reallocation**: Reassign all tools to address critical problems
- **Stakeholder Notification**: Alert human supervisors of critical issues immediately

### Rollback Authority
- **Code Rollbacks**: Revert problematic changes to last known good state
- **Deployment Rollbacks**: Roll back production deployments if issues arise
- **Configuration Resets**: Reset system configurations to stable states
- **Database Rollbacks**: Coordinate with DBA for database rollback procedures

## Handback Protocol

### Kiro Return Preparation
When Kiro credits are restored:
- **Status Report**: Comprehensive summary of all changes and decisions
- **Decision Log**: Complete documentation of architectural and implementation choices
- **Outstanding Issues**: List of unresolved problems and their priority
- **Recommendation**: Suggested next steps and priorities

### Transition Checklist
- ✅ All code changes documented and committed
- ✅ Test suite passing with adequate coverage
- ✅ Security vulnerabilities addressed
- ✅ Performance metrics within acceptable ranges
- ✅ Documentation updated to reflect changes
- ✅ Stakeholders notified of transition completion

## Success Metrics

### Continuity Metrics
- **Zero Downtime**: No interruption to development workflow
- **Quality Maintenance**: No degradation in code quality or test coverage
- **Timeline Adherence**: Project milestones met despite transition
- **Stakeholder Satisfaction**: Smooth transition with minimal disruption

### Performance Indicators
- **Decision Speed**: Major decisions made within 1 hour of identification
- **Issue Resolution**: Critical issues resolved within 4 hours
- **Communication**: Status updates provided every 2 hours minimum
- **Documentation**: All decisions and changes fully documented

## Training and Preparation

### Amazon Q Preparation
- **Steering Rule Mastery**: Deep understanding of all project guidelines
- **Architecture Knowledge**: Complete understanding of system design
- **Quality Standards**: Internalize all testing and security requirements
- **Tool Coordination**: Practice managing Cline and other development tools

### Cline Preparation
- **Project Context**: Comprehensive understanding of product requirements
- **Code Standards**: Mastery of coding conventions and quality requirements
- **Testing Protocols**: Understanding of test requirements and coverage standards
- **Documentation**: Ability to maintain project documentation standards

This protocol ensures seamless continuity of project leadership and maintains all quality standards even when Kiro is unavailable due to credit limitations.