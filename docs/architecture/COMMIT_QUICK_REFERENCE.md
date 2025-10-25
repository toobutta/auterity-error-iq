

# 🤖 AI Commit Message Quick Referenc

e

#

# Format Templat

e

```text
<type>(<scope>): <description>

- What: <what changed

>

- Why: <business reason

>


- How: <technical approach

>

Refs:

#<issue>

Tested: <evidence>

```

#

# Types 🏷

️

- `feat

`

 - New featur

e

- `fix

`

 - Bug fi

x


- `docs

`

 - Documentatio

n

- `style

`

 - Formattin

g

- `refactor

`

 - Code restructur

e

- `perf

`

 - Performanc

e

- `test

`

 - Test

s

- `build

`

 - Dependencie

s

- `ci

`

 - CI/C

D

- `chore

`

 - Maintenanc

e

#

# Scopes

📁

- `backend

`

 - Python/FastAP

I

- `frontend

`

 - React/TypeScrip

t


- `api

`

 - Endpoint

s

- `auth

`

 - Authenticatio

n

- `workflow

`

 - Execution engin

e

- `agent

`

 - AI framewor

k

- `db

`

 - Databas

e

- `ui

`

 - Component

s

- `config

`

 - Setting

s

- `test

`

 - Test file

s

#

# Examples

💡

#

## Simple Fi

x

```

text
fix(auth): handle expired token edge case

```

#

## Full Featur

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

# Rules

✅

- Subject ≤ 50 char

s

- Lowercase, imperativ

e

- No ending perio

d

- Body for changes >5 file

s

- Test evidence require

d

- Reference issues for bug

s

#

# AI Context

🧠

✅ Include: Changed files, diff stats, test changes
❌ Exclude: Temp files, logs, cache, node_modules

#

# Quality Gates

🚪

- Conventional format enforce

d

- Scope validation require

d

- Breaking changes flagge

d

- Security changes reviewe

d
