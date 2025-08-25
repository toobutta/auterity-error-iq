# Code Style Guide

This document outlines the code style guidelines for the Auterity Unified project.

## Python Code Style

### Formatting Tools

We use the following tools to maintain consistent code style:

1. **Black**: An opinionated code formatter that automatically formats Python code to conform to PEP 8 guidelines with some modifications.
   - Line length: 88 characters
   - Target Python version: 3.11

2. **isort**: A utility to sort imports alphabetically and automatically separate them into sections.
   - Configured to be compatible with Black

3. **Flake8**: A linting tool that checks Python code against coding style (PEP 8) and programming errors.
   - Line length: 88 characters (matching Black)
   - Additional plugins: flake8-docstrings for docstring style checking

### How to Use

#### Automatic Formatting with Pre-commit

We use pre-commit hooks to automatically format code before committing. To set up pre-commit:

```bash
# Install pre-commit
pip install pre-commit

# Install the git hooks
pre-commit install
```

Once installed, pre-commit will automatically run on `git commit` and format your code.

#### Manual Formatting

To manually format Python files:

```bash
# Format a specific file with Black
black path/to/file.py

# Sort imports in a file
isort path/to/file.py

# Check a file with Flake8
flake8 path/to/file.py
```

#### Formatting Migration Files

For Alembic migration files, we provide a script to ensure proper formatting:

```bash
./scripts/format_migration_file.sh
```

### Style Guidelines

1. **Line Length**: Maximum line length is 88 characters.
2. **Docstrings**: Use Google-style docstrings.
3. **Imports**: Group imports in the following order:
   - Standard library imports
   - Related third-party imports
   - Local application/library specific imports
4. **Quotes**: Use double quotes for docstrings and single quotes for regular strings.
5. **Naming Conventions**:
   - Classes: `CamelCase`
   - Functions and variables: `snake_case`
   - Constants: `UPPER_CASE_WITH_UNDERSCORES`
   - Private methods/variables: Prefix with underscore (`_private_method`)

## JavaScript/TypeScript Code Style

We use ESLint with TypeScript support to enforce consistent code style in JavaScript and TypeScript files.

### Configuration

ESLint is configured with the following plugins:

- eslint-plugin-react
- eslint-plugin-react-hooks
- @typescript-eslint/eslint-plugin

### How to Use

```bash
# Check a file with ESLint
npx eslint path/to/file.js

# Fix issues automatically where possible
npx eslint --fix path/to/file.js
```

## Markdown Style

We use markdownlint to ensure consistent Markdown formatting.

### How to Use

```bash
# Check a Markdown file
npx markdownlint path/to/file.md

# Fix issues automatically where possible
npx markdownlint --fix path/to/file.md
```

## Shell Script Style

We use ShellCheck to ensure shell scripts follow best practices.

### How to Use

```bash
# Check a shell script
shellcheck path/to/script.sh
```

## Troubleshooting

### Common Issues

1. **Line Length Errors**: If you're getting line length errors with Flake8 but your code passes Black, ensure that your Flake8 configuration matches Black's line length (88 characters).

2. **Import Sorting Issues**: If isort and Black disagree on import formatting, ensure isort is configured with `profile = "black"`.

3. **Pre-commit Hook Failures**: If pre-commit hooks fail, fix the issues and try committing again. You can temporarily bypass hooks with `git commit --no-verify` if necessary.

### Getting Help

If you encounter issues with code formatting or linting, please refer to the documentation for the specific tool or ask for help from the development team.
