

# AI Development Context

 - Complete Project Sco

p

e

#

# 🚨 CRITICAL: Full Project Scope for AI Tool

s

**This document ensures ALL AI tools understand the COMPLETE Auterity project scope

* *

#

# 📋 Three-System Architecture Summa

r

y

#

## System 1: AutoMatrix (Core Engine

)

- **Location**: `/backend/

`

 + `/frontend/

`

- **Purpose**: Visual workflow automation platfor

m

- **Technology**: FastAP

I

 + Reac

t

 + PostgreSQ

L

- **Status**: 95% complete, needs TypeScript fixe

s

- **Key Files**: 20

0

+ files across backend/fronten

d

#

## System 2: RelayCore (AI Router

)

- **Location**: `/systems/relaycore/

`

- **Purpose**: AI request routing and cost optimizatio

n

- **Technology**: Node.j

s

 + TypeScrip

t

 + Redi

s

- **Status**: 90% complete, needs admin interfac

e

- **Key Files**: 5

0

+ TypeScript file

s

#

## System 3: NeuroWeaver (Model Management

)

- **Location**: `/systems/neuroweaver/

`

- **Purpose**: Specialized AI model training and deploymen

t

- **Technology**: Pytho

n

 + FastAP

I

 + ML Pipelin

e

- **Status**: 85% complete, needs integratio

n

- **Key Files**: 4

0

+ Python/React file

s

#

# 🎯 MANDATORY Context for ALL Development Task

s

#

## When Working on ANY Component

:

1. **Check Cross-System Impact**: Changes may affect all 3 syste

m

s

2. **Verify Integration Points**: AutoMatrix ↔ RelayCore ↔ NeuroWeav

e

r

3. **Consider Shared Infrastructure**: Auth, monitoring, databa

s

e

4. **Review Enterprise Requirements**: SSO, multi-tenancy, securi

t

y

#

## Critical Integration Points

:

- **AutoMatrix → RelayCore**: All AI calls route through RelayCor

e

- **RelayCore → NeuroWeaver**: Specialized model acces

s

- **Shared Auth**: JWT tokens across all system

s

- **Unified Monitoring**: Prometheus/Grafana for all system

s

#

# 📁 Complete File Structure Contex

t

#

## Core Systems (ALWAYS Consider

)

```
/backend/

# AutoMatrix API (FastAPI)

/frontend/

# AutoMatrix UI (React)

/systems/relaycore/

# AI Router (Node.js)

/systems/neuroweaver/

# Model Manager (Python)

/shared/

# Cross-system component

s

```

#

## Infrastructure (ALWAYS Consider

)

```

/infrastructure/

# Terraform IaC

/monitoring/

# Prometheus/Grafana

/docker-compose.yml



# Development environment

/scripts/

# Automation scripts

```

#

## Specifications (ALWAYS Review

)

```

/docs/

# Complete documentation

/PRD/

# Product requirements

/.kiro/specs/

# AI coordination specs

```

#

# 🔧 Development Rules for AI Tool

s

#

## Rule 1: Always Check Dependencie

s

Before making ANY change, verify impact on:

- Other systems in the three-system architectur

e

- Shared components and librarie

s

- Database schema and migration

s

- API contracts between system

s

#

## Rule 2: Maintain Integration Integrit

y

- AutoMatrix MUST route AI calls through RelayCor

e

- RelayCore MUST integrate with NeuroWeaver model

s

- All systems MUST use unified authenticatio

n

- Monitoring MUST cover all three system

s

#

## Rule 3: Consider Enterprise Requirement

s

- Multi-tenant architectur

e

- SSO integration (SAML/OIDC

)

- Audit logging and complianc

e

- Performance and scalabilit

y

#

# 🚨 Current Critical Issues (Context for ALL Tasks

)

#

##

 1. Test Infrastructure Cris

i

s

- **Impact**: Blocks ALL development across ALL system

s

- **Files**: 22 vitest module resolution error

s

- **Priority**: CRITICA

L

 - Must fix before any other wor

k

#

##

 2. TypeScript Complian

c

e

- **Impact**: Frontend development blocke

d

- **Files**: 108 TypeScript errors in AutoMatrix fronten

d

- **Priority**: HIG

H

 - Blocks clean developmen

t

#

##

 3. Cross-System Integration G

a

p

s

- **Impact**: Three systems not fully connecte

d

- **Files**: Integration protocols incomplet

e

- **Priority**: HIG

H

 - Core architecture requiremen

t

#

# 📊 Project Statistics (Full Scope

)

#

## Codebase Siz

e

- **Total Files**: 50

0

+ files across all system

s

- **Lines of Code**: ~75,000 line

s

- **Languages**: Python, TypeScript, JavaScript, SQL, YAM

L

- **Systems**: 3 integrated platform

s

#

## Component Breakdow

n

- **AutoMatrix**: 25

0

+ files (backen

d

 + frontend

)

- **RelayCore**: 10

0

+ files (Node.j

s

 + admin UI

)

- **NeuroWeaver**: 8

0

+ files (Pytho

n

 + React

)

- **Infrastructure**: 7

0

+ files (Docker, Terraform, monitoring

)

#

# 🎯 Task Context Requirement

s

#

## For ANY Development Task

:

1. **Read This Document First**: Understand full project sco

p

e

2. **Check Integration Impact**: How does this affect other system

s

?

3. **Review Related Systems**: What other components are involve

d

?

4. **Verify Enterprise Compliance**: Does this meet enterprise requirement

s

?

5. **Test Cross-System**: Ensure all integrations still wo

r

k

#

## For Frontend Tasks

:

- Consider AutoMatrix frontend AND RelayCore admin interfac

e

- Ensure shared component library compatibilit

y

- Verify cross-system authentication flow

s

- Check responsive design across all UI

s

#

## For Backend Tasks

:

- Consider AutoMatrix API AND NeuroWeaver AP

I

- Ensure RelayCore integration points wor

k

- Verify database schema compatibilit

y

- Check monitoring and logging integratio

n

#

## For Infrastructure Tasks

:

- Consider ALL three systems in deploymen

t

- Ensure monitoring covers all component

s

- Verify security across entire platfor

m

- Check scalability for all service

s

#

# 🔄 Integration Flow (MUST Understand

)

```

User Request → AutoMatrix Frontend → AutoMatrix Backend → RelayCore → AI Provider/NeuroWeaver → Response Chain

```

#

## Critical Integration Points

:

1. **Authentication**: JWT tokens shared across all syste

m

s

2. **AI Routing**: All AI calls go through RelayCo

r

e

3. **Model Access**: RelayCore routes to NeuroWeaver when appropria

t

e

4. **Monitoring**: Unified metrics collection across all syste

m

s

5. **Error Handling**: Cross-system error correlati

o

n

#

# 📚 Required Reading for ALL Task

s

#

## Architecture Documents

:

- `/docs/ARCHITECTURE_OVERVIEW.md

`

- `/.kiro/specs/three-system-ai-platform/design.md

`

- `/PROJECT_STRUCTURE_COMPREHENSIVE.md

`

#

## Integration Specifications

:

- `/.kiro/specs/three-system-ai-platform/requirements.md

`

- `/PRD/RelayCore/integration_architecture.md

`

- `/systems/relaycore/README.md

`

#

## Current Status

:

- `/CURRENT_PROJECT_STATUS.md

`

- `/.kiro/PROJECT-ROADMAP-AND-STRATEGY.md

`

- `/COMPREHENSIVE_PROJECT_OVERVIEW.md

`

#

# ⚠️ WARNING: Scope Blindness Preventio

n

#

## Common AI Tool Mistakes

:

1. **Tunnel Vision**: Only looking at immediate fil

e

s

2. **Integration Ignorance**: Not considering cross-system impa

c

t

3. **Architecture Amnesia**: Forgetting the three-system desi

g

n

4. **Enterprise Oversight**: Missing enterprise requiremen

t

s

#

## Prevention Protocol

:

1. **Always start with this documen

t

* *

2. **Review integration points before codin

g

* *

3. **Check all three systems for impac

t

* *

4. **Verify enterprise complianc

e

* *

5. **Test cross-system functionalit

y

* *

#

# 🎯 Success Criteria for ALL Task

s

#

## Technical Success

:

- All three systems continue to work togethe

r

- Integration points remain functiona

l

- Enterprise requirements are me

t

- Performance standards maintaine

d

#

## Quality Success

:

- Code quality standards across all system

s

- Security requirements for entire platfor

m

- Documentation updated for all affected system

s

- Tests cover cross-system functionalit

y

--

- #

# 🚀 BOTTOM LIN

E

**The Auterity project is NOT just AutoMatrix

* *

- it's a comprehensive three-system AI platform with

:

1. **AutoMatrix**: Core workflow engi

n

e

2. **RelayCore**: AI routing and optimizati

o

n

3. **NeuroWeaver**: Model management and traini

n

g

**EVERY development task must consider the FULL scope

* * to avoid breaking the integrated architecture and enterprise requirements

.

**This context document MUST be referenced for ALL development work

* * to ensure project specifications are properly considered

.
