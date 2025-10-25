

# Implementation Guide: AI Commit Message Rule

s

#

# Quick Setu

p

#

##

 1. VS Code Integration (Already Configure

d

)

The commit message rules are already integrated into your VS Code workspace via `.vscode/settings.json`. The AI will automatically:

- Analyze changed files to determine scop

e

- Select appropriate commit type based on change

s

- Generate structured commit message

s

- Validate format against conventional commit standard

s

#

##

 2. Git Hook Installation (Recommende

d

)

To enforce commit message validation:

```bash

# Copy the validation script to git hooks

cp scripts/validate-commit-msg.js .git/hooks/commit-msg

chmod +x .git/hooks/commit-ms

g

# For Windows (Git Bash):

cp scripts/validate-commit-msg.js .git/hooks/commit-ms

g

```

#

##

 3. Manual Validati

o

n

Test your commit messages:

```

bash

# Test a commit message

node scripts/validate-commit-msg.js commit_message.tx

t

# Example commit message file:

echo "feat(workflow): add parallel execution engine" > test_commit.txt
node scripts/validate-commit-msg.js test_commit.tx

t

```

#

# AI Generation Example

s

Based on the current repository state, here are examples of properly formatted AI-generated commit messages

:

#

## Current Python Formatting Wor

k

```

text
style(backend): apply black formatting and import organization

- What: Reformatted 171 Python files and organized imports in 31 file

s

- Why: Ensure consistent code style across the entire backend codebas

e

- How: Used Black formatter with 88-char limit and isort for import sortin

g

Tested: All tests pass, no functional changes

```

#

## TypeScript Configuration Update

s

```

text
fix(config): update TypeScript moduleResolution to node16

- What: Updated tsconfig.json files to use modern module resolutio

n

- Why: Resolve deprecated "node" moduleResolution warnings in TypeScrip

t

- How: Changed moduleResolution from "node" to "node16" in affected config

s

Refs: Phase 1 of systematic error resolution
Tested: TypeScript compilation works without warnings

```

#

## Multi-File Manual Fix

e

s

```

text
fix(backend): resolve Black formatter parsing errors

- What: Manually corrected syntax errors in 11 Python file

s


- Why: Black formatter failed on files with indentation and syntax issue

s

- How: Fixed indentation, line length, and undefined variable reference

s

Files: tenant_middleware.py, template.py, __init__.py, orchestrator_compatible.py
Tested: All files now pass Black formatting validation

```

#

# Scope Detection Logi

c

The AI uses these patterns to automatically detect scopes:

| File Pattern | Detected Scope | Example |
|--------------|----------------|---------|

| `backend/app/api/**` | `api` | `fix(api): handle malformed requests` |

| `backend/app/auth/**` | `auth` | `feat(auth): add MFA support` |

| `backend/app/services/workflow**` | `workflow` | `perf(workflow): optimize execution batching` |

| `backend/app/services/agents/**` | `agent` | `feat(agent): implement smart triage` |

| `frontend/src/**` | `frontend` | `feat(frontend): add workflow designer` |

| `tests/**` | `test` | `test(auth): add integration test coverage` |

| `*.json`, `*.yaml` | `config` | `chore(config): update environment settings` |

| `requirements*.txt` | `deps` | `build(deps): update FastAPI to v0.104`



|

#

# Type Classification Rule

s

The AI classifies commit types based on:

| Change Pattern | Type | Logic |
|----------------|------|-------|

| New files added | `feat` | New functionality introduced |
| Bug fix keywords | `fix` | Words like "fix", "resolve", "correct" |
| Test files only | `test` | Only changes in test directories |
| Config files only | `chore` | Configuration updates without logic changes |
| Documentation only | `docs` | README, markdown, or doc changes |
| Formatting changes | `style` | Black, isort, or linting fixes |
| Code restructuring | `refactor` | Architecture or organization changes |

#

# Quality Gate

s

#

## Automatic Validatio

n

✅ **Pass Criteria:

* *

- Conventional commit forma

t

- Valid type and scop

e

- Subject ≤ 50 character

s

- No forbidden generic term

s

- Proper capitalization and punctuatio

n

⚠️ **Warning Triggers:

* *

- Unknown scope (not in predefined list

)

- Generic terms like "update", "changes

"

- Missing body for significant change

s

- Long body lines (>72 chars

)

❌ **Fail Criteria:

* *

- Invalid conventional forma

t

- Invalid commit typ

e

- Subject too long (>50 chars

)

- WIP/TODO/TEMP prefixe

s

- Empty commit messag

e

#

## Manual Review Require

d

These changes trigger manual review:

- Breaking changes (API modifications

)

- Security-related change

s

- Database schema modification

s

- Performance-critical change

s

- Cross-system integration

s

#

# Integration with Current Workflo

w

#

## Phase-Based Developme

n

t

Current systematic error resolution work:

```

text

# Phase 1: TypeScript

fix(config): resolve deprecated moduleResolution warnings

# Phase 3: Python Formatting

style(backend): standardize code formatting across backend

# Phase 4: SQLAlchemy (upcoming)

fix(db): resolve column type assignment issues

# Phase 5: Validation (upcoming)

ci(validation): add comprehensive type checking pipeline

```

#

## Multi-Agent Coordinati

o

n

For multi-agent workflows (Grok → Gemini → Claude)

:

```

text

# Grok quick wins

fix(config): resolve TypeScript compilation warnings

# Gemini formatting

style(backend): apply comprehensive code formatting

# Claude validation

ci(validation): implement end-to-end quality check

s

```

#

# Best Practice

s

#

##

 1. Context Inclusi

o

n

Always include relevant context:

- Changed file count for formatting wor

k

- Performance impact for optimization

s


- Breaking change implication

s

- Test coverage evidenc

e

#

##

 2. Business Val

u

e

Connect technical changes to business value:

- "improve developer experience

"

- "enhance system reliability

"

- "reduce maintenance overhead

"

- "increase automation efficiency

"

#

##

 3. Implementation Detai

l

s

For significant changes, include:

- What specific patterns were use

d

- Why this approach was chose

n

- How the solution addresses the proble

m

- What alternatives were considere

d

#

# Troubleshootin

g

#

## Common Issue

s

**Issue**: AI generates generic commit message

s
**Solution**: Ensure changed files provide clear contex

t

**Issue**: Scope detection is incorrec

t
**Solution**: Add file patterns to scope mapping in setting

s

**Issue**: Type classification is wron

g
**Solution**: Include more descriptive keywords in commit conten

t

**Issue**: Validation fails in git hoo

k
**Solution**: Check Node.js is available and script is executabl

e

#

## Suppor

t

- Reference: `AI_COMMIT_MESSAGE_RULES_FORMATTED.md

`

- Quick guide: `COMMIT_QUICK_REFERENCE.md

`

- Validation: `scripts/validate-commit-msg.js

`

- Configuration: `.vscode/settings.json

`

This implementation ensures consistent, high-quality commit messages that provide clear context and traceability for all changes in the Auterity platform

.
