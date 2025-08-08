# [AMAZON-Q + KIRO COLLABORATION] Backend Quality & Security Foundation

## Collaboration Overview
Direct partnership between Amazon Q and Kiro to resolve critical backend issues while preparing for Auterity Strategic Feature Expansion.

## Current Status Update
- **Cursor IDE**: Now handling all frontend tasks (previously Cline)
- **Cursor Status**: PENDING Amazon Q completion of security fixes
- **Critical Path**: Amazon Q security/backend → Cursor frontend → Expansion features

## Amazon Q Primary Tasks

### 1. Security Vulnerability Resolution (CRITICAL)
- Fix 7 moderate security vulnerabilities in frontend dependencies
- Resolve prismjs DOM Clobbering vulnerability via react-syntax-highlighter
- Ensure no breaking changes in syntax highlighting components
- Success: `npm audit` shows 0 moderate/high vulnerabilities

### 2. Backend Code Quality Emergency (HIGH PRIORITY)
- Fix 500+ backend linting violations (imports, formatting, unused code)
- Resolve bare except clauses with specific exception handling
- Clean up whitespace and line length issues
- Success: <50 linting violations, all tests passing

## Kiro Collaboration Support

### 1. Architecture Guidance (PARALLEL)
- Provide architectural context for Amazon Q's backend decisions
- Ensure quality fixes align with MCP orchestration architecture
- Review proposed solutions for expansion feature compatibility
- Guide integration patterns for upcoming features

### 2. Real-time Consultation
- **Architecture Questions**: Immediate guidance on structural changes
- **Integration Impact**: Assess changes against expansion requirements  
- **Quality Standards**: Define production-ready standards
- **Decision Documentation**: Maintain architectural decision log

## Immediate Collaboration Actions

### Amazon Q - Start Now
```markdown
1. Security Analysis (30 min)
   - Analyze all 7 vulnerabilities and dependency chains
   - Identify safe upgrade paths
   - Test compatibility with existing components

2. Backend Quality Assessment (1 hour)
   - Run comprehensive linting analysis
   - Categorize violations by severity
   - Flag architectural issues for Kiro consultation
```

### Kiro - Parallel Support
```markdown
1. Architecture Review (30 min)
   - Review backend architecture for expansion readiness
   - Identify potential conflicts with quality fixes
   - Prepare guidance for Amazon Q

2. Integration Specs (2 hours)
   - Complete remaining API specifications
   - Finalize database migration plans
   - Prepare Cursor handoff documentation
```

## Communication Protocol
- **Direct Collaboration**: No handoff delays between Amazon Q and Kiro
- **Real-time Decisions**: Architecture questions resolved within 15 minutes
- **Shared Context**: Both maintain awareness of current work and decisions
- **Progress Sync**: Coordinate to avoid conflicts

## Success Criteria for Cursor Handoff
- ✅ Security vulnerabilities resolved (Amazon Q)
- ✅ Backend quality meets standards (Amazon Q + Kiro)
- ✅ Architecture foundation ready (Kiro)
- ✅ Integration specifications complete (Kiro)
- ✅ No blocking issues for frontend development

## Expected Timeline
- **Security Fixes**: 4-6 hours (Amazon Q)
- **Backend Quality**: 4-5 hours (Amazon Q + Kiro)
- **Architecture Prep**: 2-3 hours (Kiro parallel)
- **Total**: 6-8 hours before Cursor can begin

This collaboration ensures efficient foundation completion while maintaining architectural integrity for the strategic expansion.