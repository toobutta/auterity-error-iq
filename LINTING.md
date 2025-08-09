# Auterity Unified Linting Guide

This guide provides instructions for maintaining code quality through linting in the Auterity Unified codebase.

## Overview

The codebase is divided into two main parts:
- **Frontend**: TypeScript/React code in the `frontend` directory
- **Backend**: Python code in the `backend` directory

Each part has its own linting requirements and tools.

## Frontend Linting

### Requirements

- Node.js 16+
- npm

### Tools

- TypeScript compiler (`tsc`)
- ESLint with TypeScript plugin
- Prettier for code formatting

### Common Issues

1. **TypeScript Errors**: Type mismatches, missing type definitions
2. **Explicit `any` Types**: Usage of `any` type instead of proper types
3. **React Component Props**: Missing type definitions for component props

### Running the Linting Fix Script

```bash
cd frontend
node lint_fix.js
```

This script will:
1. Install required dependencies
2. Create ESLint and Prettier configurations if they don't exist
3. Fix known issues in test files
4. Run ESLint to fix auto-fixable issues
5. Run Prettier to format code
6. Run TypeScript compiler to check for remaining issues

### Manual Fixes

For issues that can't be automatically fixed:

1. Replace `unknown` and `any` types with proper interfaces
2. Add missing type definitions for component props
3. Fix React import issues

## Backend Linting

### Requirements

- Python 3.8+
- pip

### Tools

- flake8 for linting
- black for code formatting
- isort for import sorting

### Common Issues

1. **Unused Imports (F401)**: Imports that are not used in the file
2. **Line Length (E501)**: Lines exceeding 88 characters
3. **Whitespace Issues (W291, W293)**: Trailing whitespace, blank lines with whitespace
4. **Missing Newline (W292)**: Missing newline at end of file

### Running the Linting Fix Script

```bash
cd backend
python lint_fix.py
```

This script will:
1. Install required dependencies
2. Remove unused imports
3. Fix whitespace issues
4. Add newlines at end of files
5. Run isort to organize imports
6. Run black to format code
7. Run flake8 to check for remaining issues

### Manual Fixes

For issues that can't be automatically fixed:

1. Refactor long lines (> 88 characters)
2. Fix complex import issues
3. Address logical code issues flagged by linters

## Continuous Integration

It's recommended to add linting checks to your CI/CD pipeline to ensure code quality is maintained. Add the following steps to your CI workflow:

```yaml
# Frontend linting
- name: Frontend Lint Check
  run: |
    cd frontend
    npm install
    npx eslint "src/**/*.{ts,tsx}"
    npx tsc --noEmit

# Backend linting
- name: Backend Lint Check
  run: |
    cd backend
    pip install flake8 black isort
    flake8 app/
    black --check --line-length 88 app/
    isort --check app/
```

## Pre-commit Hooks

To prevent linting issues from being committed, you can set up pre-commit hooks:

1. Install pre-commit: `pip install pre-commit`
2. Create a `.pre-commit-config.yaml` file in the root directory
3. Run `pre-commit install` to set up the hooks

Example `.pre-commit-config.yaml`:

```yaml
repos:
-   repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
    -   id: trailing-whitespace
    -   id: end-of-file-fixer
    -   id: check-yaml
    -   id: check-added-large-files

-   repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
    -   id: isort
        args: ["--profile", "black"]

-   repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
    -   id: black
        args: ["--line-length", "88"]

-   repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
    -   id: flake8
        args: ["--max-line-length", "88"]

-   repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.38.0
    hooks:
    -   id: eslint
        files: \.(js|ts|tsx)$
        types: [file]
        additional_dependencies:
        -   eslint@8.38.0
        -   eslint-plugin-react@7.32.2
        -   @typescript-eslint/eslint-plugin@5.59.0
        -   @typescript-eslint/parser@5.59.0
```

## Conclusion

Maintaining code quality through linting is essential for the long-term health of the codebase. By following these guidelines and using the provided tools, you can ensure that the codebase remains clean, consistent, and free of common issues.