

# Contributing to Auterity Unified AI Platfor

m

#

# Welcome!

🎉

Thank you for your interest in contributing to the Auterity Unified AI Platform. This document provides guidelines and information for contributors.

#

# Table of Content

s

- [Code of Conduct]

(

#code-of-conduct

)

- [Getting Started]

(

#getting-started

)

- [Development Workflow]

(

#development-workflow

)

- [Coding Standards]

(

#coding-standards

)

- [Testing Guidelines]

(

#testing-guidelines

)

- [Commit Guidelines]

(

#commit-guidelines

)

- [Pull Request Process]

(

#pull-request-process

)

- [Reporting Issues]

(

#reporting-issue

s

)

#

# Code of Conduc

t

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusiv

e

- Focus on constructive feedbac

k

- Accept responsibility and apologize for mistake

s

- Show empathy towards other community member

s

#

# Getting Starte

d

#

## Prerequisite

s

- Node.js 18.x or high

e

r

- npm 8.x or high

e

r

- Python 3.12 or higher (for backend developmen

t

)

- Gi

t

#

## Development Setu

p

1. **Fork the repositor

y

* *


```bash
   git clone https://github.com/your-username/auterity-error-iq.git

   cd auterity-error-iq



```

2. **Install dependencie

s

* *


```

bash
   npm install
   cd frontend && npm install && cd ..
   cd apps/workflow-studio && npm install && cd ..



```

3. **Set up environment variable

s

* *


```

bash
   cp .env.example .env


# Edit .env with your configuration



```

4. **Start development server

s

* *


```

bash
   npm run dev


```

#

# Development Workflo

w

#

##

 1. Choose an Issu

e

- Check [GitHub Issues](https://github.com/toobutta/auterity-error-iq/issues) for open task

s

- Comment on the issue to indicate you're working on i

t

- Wait for maintainer assignmen

t

#

##

 2. Create a Feature Branc

h

```

bash
git checkout -b feature/your-feature-nam

e

# or

git checkout -b fix/issue-number-descriptio

n

```

#

##

 3. Make Change

s

- Follow the coding standards belo

w

- Write tests for new functionalit

y

- Update documentation as neede

d

- Ensure all tests pas

s

#

##

 4. Commit Change

s

```

bash
git add .
git commit -m "feat: add new feature description

"

```

#

##

 5. Push and Create Pull Reques

t

```

bash
git push origin feature/your-feature-nam

e

```
Then create a pull request on GitHub.

#

# Coding Standard

s

#

## TypeScript/JavaScript

- Use TypeScript for all new cod

e

- Strict type checking enable

d

- ESLint configuration must pas

s

- Prettier formatting require

d

- Maximum line length: 100 character

s

#

## Python (Backend)

- Black code formattin

g

- isort import sortin

g

- Type hints require

d

- Docstrings for all function

s

#

## File Naming

- Use kebab-case for files: `user-profile.tsx

`

- Use PascalCase for components: `UserProfile.tsx

`

- Use camelCase for utilities: `formatDate.ts

`

#

## Commit Messages

Follow conventional commits:

```

feat: add new feature
fix: resolve bug in user authentication
docs: update API documentation
style: format code with prettier
refactor: restructure user service
test: add unit tests for login component
chore: update dependencies

```

#

# Testing Guideline

s

#

## Test Coverage

- Minimum 80% code coverage require

d

- All new features must include test

s

- Integration tests for API endpoint

s

- E2E tests for critical user flow

s

#

## Running Tests

```

bash

# Frontend unit tests

cd frontend && npm run test:coverage

# Backend tests

cd backend && python -m pytest --cov=. --cov-report=htm

l

# Integration tests

npm run test:integration

# E2E tests

npm run test:e2e

```

#

## Test Structure

```

src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
      Button.stories.tsx
  services/
    apiService.ts
    apiService.test.ts

```

#

# Pull Request Proces

s

#

## Before Submitting

- [ ] Code follows project style guideline

s

- [ ] Self-review complete

d

- [ ] No console.log or debug statement

s

- [ ] Security considerations addresse

d

- [ ] Tests pass locall

y

- [ ] Documentation update

d

- [ ] Commit messages follow guideline

s

#

## PR Template

Use the provided PR template with:

- Clear description of change

s

- Type of change (bug fix, feature, etc.

)

- Testing complete

d

- Breaking changes note

d

- Screenshots for UI change

s

#

## Review Process

1. Automated checks must pas

s

2. At least one maintainer review require

d

3. Address review feedbac

k

4. Squash commits before merg

e

5. Delete feature branch after merg

e

#

# Reporting Issue

s

#

## Bug Reports

- Use the bug report templat

e

- Include steps to reproduc

e

- Provide environment detail

s

- Attach screenshots/log

s

#

## Feature Requests

- Use the feature request templat

e

- Describe the problem you're solvin

g

- Explain your proposed solutio

n

- Consider alternative approache

s

#

## Security Issues

- **DO NOT

* * create public issues for security vulnerabilitie

s

- Email security@auterity.com directl

y

- Include detailed reproduction step

s

#

# Recognitio

n

Contributors are recognized through:

- GitHub contributor statistic

s

- Mention in release note

s

- Attribution in documentatio

n

- Community recognitio

n

#

# Getting Hel

p

- **Documentation**: [docs/](./docs/

)

- **Discussions**: [GitHub Discussions](https://github.com/toobutta/auterity-error-iq/discussions

)

- **Issues**: [GitHub Issues](https://github.com/toobutta/auterity-error-iq/issues

)

Thank you for contributing to Auterity! 🚀
