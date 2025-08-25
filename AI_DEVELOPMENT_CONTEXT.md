# AI Development Context - Complete Project Scope

## 🚨 CRITICAL: Full Project Scope for AI Tools

**This document ensures ALL AI tools understand the COMPLETE Auterity project scope**

## 📋 Three-System Architecture Summary

### System 1: AutoMatrix (Core Engine)

- **Location**: `/backend/` + `/frontend/`
- **Purpose**: Visual workflow automation platform
- **Technology**: FastAPI + React + PostgreSQL
- **Status**: 95% complete, needs TypeScript fixes
- **Key Files**: 200+ files across backend/frontend

### System 2: RelayCore (AI Router)

- **Location**: `/systems/relaycore/`
- **Purpose**: AI request routing and cost optimization
- **Technology**: Node.js + TypeScript + Redis
- **Status**: 90% complete, needs admin interface
- **Key Files**: 50+ TypeScript files

### System 3: NeuroWeaver (Model Management)

- **Location**: `/systems/neuroweaver/`
- **Purpose**: Specialized AI model training and deployment
- **Technology**: Python + FastAPI + ML Pipeline
- **Status**: 85% complete, needs integration
- **Key Files**: 40+ Python/React files

## 🎯 MANDATORY Context for ALL Development Tasks

### When Working on ANY Component:

1. **Check Cross-System Impact**: Changes may affect all 3 systems
2. **Verify Integration Points**: AutoMatrix ↔ RelayCore ↔ NeuroWeaver
3. **Consider Shared Infrastructure**: Auth, monitoring, database
4. **Review Enterprise Requirements**: SSO, multi-tenancy, security

### Critical Integration Points:

- **AutoMatrix → RelayCore**: All AI calls route through RelayCore
- **RelayCore → NeuroWeaver**: Specialized model access
- **Shared Auth**: JWT tokens across all systems
- **Unified Monitoring**: Prometheus/Grafana for all systems

## 📁 Complete File Structure Context

### Core Systems (ALWAYS Consider)

```
/backend/           # AutoMatrix API (FastAPI)
/frontend/          # AutoMatrix UI (React)
/systems/relaycore/ # AI Router (Node.js)
/systems/neuroweaver/ # Model Manager (Python)
/shared/            # Cross-system components
```

### Infrastructure (ALWAYS Consider)

```
/infrastructure/    # Terraform IaC
/monitoring/        # Prometheus/Grafana
/docker-compose.yml # Development environment
/scripts/           # Automation scripts
```

### Specifications (ALWAYS Review)

```
/docs/              # Complete documentation
/PRD/               # Product requirements
/.kiro/specs/       # AI coordination specs
```

## 🔧 Development Rules for AI Tools

### Rule 1: Always Check Dependencies

Before making ANY change, verify impact on:

- Other systems in the three-system architecture
- Shared components and libraries
- Database schema and migrations
- API contracts between systems

### Rule 2: Maintain Integration Integrity

- AutoMatrix MUST route AI calls through RelayCore
- RelayCore MUST integrate with NeuroWeaver models
- All systems MUST use unified authentication
- Monitoring MUST cover all three systems

### Rule 3: Consider Enterprise Requirements

- Multi-tenant architecture
- SSO integration (SAML/OIDC)
- Audit logging and compliance
- Performance and scalability

## 🚨 Current Critical Issues (Context for ALL Tasks)

### 1. Test Infrastructure Crisis

- **Impact**: Blocks ALL development across ALL systems
- **Files**: 22 vitest module resolution errors
- **Priority**: CRITICAL - Must fix before any other work

### 2. TypeScript Compliance

- **Impact**: Frontend development blocked
- **Files**: 108 TypeScript errors in AutoMatrix frontend
- **Priority**: HIGH - Blocks clean development

### 3. Cross-System Integration Gaps

- **Impact**: Three systems not fully connected
- **Files**: Integration protocols incomplete
- **Priority**: HIGH - Core architecture requirement

## 📊 Project Statistics (Full Scope)

### Codebase Size

- **Total Files**: 500+ files across all systems
- **Lines of Code**: ~75,000 lines
- **Languages**: Python, TypeScript, JavaScript, SQL, YAML
- **Systems**: 3 integrated platforms

### Component Breakdown

- **AutoMatrix**: 250+ files (backend + frontend)
- **RelayCore**: 100+ files (Node.js + admin UI)
- **NeuroWeaver**: 80+ files (Python + React)
- **Infrastructure**: 70+ files (Docker, Terraform, monitoring)

## 🎯 Task Context Requirements

### For ANY Development Task:

1. **Read This Document First**: Understand full project scope
2. **Check Integration Impact**: How does this affect other systems?
3. **Review Related Systems**: What other components are involved?
4. **Verify Enterprise Compliance**: Does this meet enterprise requirements?
5. **Test Cross-System**: Ensure all integrations still work

### For Frontend Tasks:

- Consider AutoMatrix frontend AND RelayCore admin interface
- Ensure shared component library compatibility
- Verify cross-system authentication flows
- Check responsive design across all UIs

### For Backend Tasks:

- Consider AutoMatrix API AND NeuroWeaver API
- Ensure RelayCore integration points work
- Verify database schema compatibility
- Check monitoring and logging integration

### For Infrastructure Tasks:

- Consider ALL three systems in deployment
- Ensure monitoring covers all components
- Verify security across entire platform
- Check scalability for all services

## 🔄 Integration Flow (MUST Understand)

```
User Request → AutoMatrix Frontend → AutoMatrix Backend → RelayCore → AI Provider/NeuroWeaver → Response Chain
```

### Critical Integration Points:

1. **Authentication**: JWT tokens shared across all systems
2. **AI Routing**: All AI calls go through RelayCore
3. **Model Access**: RelayCore routes to NeuroWeaver when appropriate
4. **Monitoring**: Unified metrics collection across all systems
5. **Error Handling**: Cross-system error correlation

## 📚 Required Reading for ALL Tasks

### Architecture Documents:

- `/docs/ARCHITECTURE_OVERVIEW.md`
- `/.kiro/specs/three-system-ai-platform/design.md`
- `/PROJECT_STRUCTURE_COMPREHENSIVE.md`

### Integration Specifications:

- `/.kiro/specs/three-system-ai-platform/requirements.md`
- `/PRD/RelayCore/integration_architecture.md`
- `/systems/relaycore/README.md`

### Current Status:

- `/CURRENT_PROJECT_STATUS.md`
- `/.kiro/PROJECT-ROADMAP-AND-STRATEGY.md`
- `/COMPREHENSIVE_PROJECT_OVERVIEW.md`

## ⚠️ WARNING: Scope Blindness Prevention

### Common AI Tool Mistakes:

1. **Tunnel Vision**: Only looking at immediate files
2. **Integration Ignorance**: Not considering cross-system impact
3. **Architecture Amnesia**: Forgetting the three-system design
4. **Enterprise Oversight**: Missing enterprise requirements

### Prevention Protocol:

1. **Always start with this document**
2. **Review integration points before coding**
3. **Check all three systems for impact**
4. **Verify enterprise compliance**
5. **Test cross-system functionality**

## 🎯 Success Criteria for ALL Tasks

### Technical Success:

- All three systems continue to work together
- Integration points remain functional
- Enterprise requirements are met
- Performance standards maintained

### Quality Success:

- Code quality standards across all systems
- Security requirements for entire platform
- Documentation updated for all affected systems
- Tests cover cross-system functionality

---

## 🚀 BOTTOM LINE

**The Auterity project is NOT just AutoMatrix** - it's a comprehensive three-system AI platform with:

1. **AutoMatrix**: Core workflow engine
2. **RelayCore**: AI routing and optimization
3. **NeuroWeaver**: Model management and training

**EVERY development task must consider the FULL scope** to avoid breaking the integrated architecture and enterprise requirements.

**This context document MUST be referenced for ALL development work** to ensure project specifications are properly considered.
