

# AI-Generated Commit Message Rul

e

s

#

# Overvie

w

This document defines the exact format and rules for AI-generated commit messages in the Auterity Error IQ platform. These rules ensure consistency, clarity, and traceability across all code changes

.

#

# Core Forma

t

#

## Conventional Commits Structur

e

```text
<type>(<scope>): <description>

<body>

<footer>

```

#

## Required Element

s

1. **Type**: One of the predefined commit typ

e

s

2. **Scope**: Component or area affected (recommende

d

)


3. **Description**: Brief, imperative description (max 50 char

s

)

4. **Body**: Structured explanation for significant chang

e

s

5. **Footer**: References and metada

t

a

#

# Commit Type

s

| Type | Purpose | Example |
|------|---------|---------|

| `feat` | New feature | `feat(workflow): add parallel execution engine` |
| `fix` | Bug fix | `fix(auth): resolve token validation race condition` |
| `docs` | Documentation | `docs(api): update workflow execution endpoints` |
| `style` | Code formatting | `style(backend): apply black formatting to auth module` |
| `refactor` | Code restructuring | `refactor(backend): standardize error handling patterns` |
| `perf` | Performance improvements | `perf(workflow): optimize step execution batching` |
| `test` | Test changes | `test(auth): add integration tests for JWT flow` |
| `build` | Build/dependency changes | `build(deps): update fastapi to latest version` |
| `ci` | CI/CD changes | `ci(github): add code quality gates` |
| `chore` | Maintenance tasks | `chore(config): update environment variables` |
| `revert` | Revert previous commit | `revert: feat(auth): implement SSO integration` |

#

# Scope

s

| Scope | Description | File Patterns |
|-------|-------------|---------------|

| `backend` | Backend Python/FastAPI | `backend/**`, `app/**`, `*.py` |

| `frontend` | Frontend React/TypeScript | `frontend/**`, `src/**`, `*.tsx`, `*.ts` |

| `api` | API endpoints | `**/api/**`, `**/routes/**` |

| `db` | Database models/migrations | `**/models/**`, `**/migrations/**` |

| `auth` | Authentication/authorization | `**/auth/**`, `**/security/**` |

| `workflow` | Workflow execution engine | `**/workflow/**`, `**/execution/**` |

| `agent` | AI agent framework | `**/agents/**`, `**/orchestrator/**` |

| `ui` | User interface components | `**/components/**`, `**/styles/**` |

| `config` | Configuration files | `*.json`, `*.yaml`, `*.toml`, `.env*` |

| `infra` | Infrastructure/deployment | `docker/**`, `kubernetes/**` |

| `deps` | Dependencies | `requirements*.txt`, `package*.json` |

| `test` | Test files | `tests/**`, `**/*.test.*` |

| `ci` | CI/CD configuration | `.github/**`, `*.yml` |

| `docs` | Documentation | `docs/**`, `*.md`

|

#

# Message Structure Rule

s

#

## Subject Lin

e

- **Format**: `<type>(<scope>): <description>

`

- **Length**: Maximum 50 character

s

- **Case**: Lowercase, imperative moo

d

- **Punctuation**: No period at the en

d

- **Pattern**: `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z-]+\))?: .{1,50}$

`

#

## Body (For Significant Changes

)

Use structured format with bullet points:

```

text

- What: <clear description of what changed

>

- Why: <business reason or problem being solved

>

- How: <brief technical implementation detail

>

```

**Requirements**

:

- Start with blank line after subjec

t

- Maximum 72 characters per lin

e

- Use present tense, imperative moo

d

- Focus on what and why, not ho

w

#

## Footer (Optional

)

```

text
Refs:

#<issue_number>

Tested: <testing evidence>
Breaking Change: <if applicable>
Co-authored-by: <if applicable

>

```

#

# Example

s

#

## Simple Bug Fi

x

```

text
fix(auth): handle expired token edge case

```

#

## Feature with Full Structur

e

```

text
feat(workflow): add parallel execution engine

- What: Implemented concurrent step processing with dependency resolutio

n

- Why: Improve workflow performance for complex automation task

s


- How: Added TopologicalExecutor with async batch processin

g

Refs:

#147

Tested: Unit tests, integration tests, performance benchmarks

```

#

## Refactoring Exampl

e

```

text
refactor(backend): standardize error handling patterns

- What: Unified exception hierarchy and response formattin

g

- Why: Reduce code duplication and improve error consistenc

y

- How: Created BaseAppException with proper HTTP status mappin

g

Tested: All existing tests pass, error scenarios covered

```

#

## Breaking Change Exampl

e

```

text
feat(api): implement new authentication flow

- What: Replaced JWT with OAuth

2

 + PKCE for enhanced securit

y

- Why: Address security vulnerabilities in current auth syste

m

- How: Integrated with industry-standard OAuth2 provider

s

Breaking Change: Existing API tokens will be invalidated
Migration: See docs/auth-migration-guide.m

d

Refs:

#203

Tested: Full regression suite, security audit

```

#

# AI Generation Contex

t

#

## Analysis Input

s

- Changed files and their type

s

- Diff statistics (additions, deletions, modifications

)

- Directory structure affecte

d

- Test file change

s

- Configuration change

s

- Breaking change detectio

n

#

## Scope Detection Logi

c

1. Analyze file patterns to determine primary scop

e

2. If multiple scopes affected, choose the most business-critic

a

l

3. For cross-cutting changes, use broader scope (e.g., `backend`, `frontend

`

)

4. Prioritize business logic over infrastructure change

s

#

## Type Classificatio

n

- **New files**: Usually `feat

`

- **Deleted files**: Usually `refactor

`

- **Test files only**: Use `test

`

- **Config files only**: Use `chore

`

- **Documentation only**: Use `docs

`

- **Bug fix keywords**: Use `fix

`

- **Feature keywords**: Use `feat

`

#

# Validation Rule

s

#

## Forbidden Pattern

s

- Generic subjects: "update", "changes", "misc", "stuff", "work

"

- Capitalized first letter (except proper nouns

)

- Ending perio

d

- Missing type or malformed typ

e

- WIP/TODO/TEMP prefixe

s

#

## Required for Large Change

s

- Body explanation for changes affecting >5 file

s

- Test evidence for new feature

s

- Issue reference for bug fixe

s

- Breaking change notice if applicabl

e

#

# Quality Check

s

#

## Automated Validatio

n

1. Conventional commit format complianc

e

2. Subject length validatio

n

3. Scope existence validatio

n


4. Body structure for complex change

s

5. Footer format validatio

n

#

## Manual Review Trigger

s

- Breaking change

s

- Security-related change

s

- Performance modification

s

- Database schema change

s

- API contract change

s

#

# Implementatio

n

#

## VS Code Setting

s

The rules are configured in `.vscode/settings.json` with:

- Git input validatio

n

- Commit message template

s

- AI generation contex

t

- Project-specific mapping

s

#

## Git Hooks (Recommended

)

```

bash

#!/bin/s

h

# .git/hooks/commit-ms

g

node .git/hooks/validate-commit-msg.js "$1

"

```

#

## IDE Integratio

n

- Configure commit message template

s

- Enable conventional commit validatio

n

- Set up auto-completion for types/scope

s

- Configure AI context inclusio

n

#

# Project-Specific Guidelin

e

s

#

## Auterity Error IQ Platfor

m

- **Business Domains**: Workflow automation, AI agent orchestration, multi-tenant aut

h

- **Technical Areas**: FastAPI backend, React frontend, PostgreSQL, Redis, Docke

r

- **Quality Standards**: All changes need tests, breaking changes need migration guide

s

#

## Priority Keyword

s

- Authentication, workflow, agent, security, performanc

e

- Database, API, frontend, backend, complianc

e

- Error handling, testing, documentatio

n

This comprehensive rule set ensures that all AI-generated commit messages maintain high quality, consistency, and provide clear context for code changes across the Auterity platform

.
