# Contributing Guidelines

## Setup

Run the Git hooks setup (required for all contributors):

```bash
./.githooks/setup.sh
```

## Commit Standards

All commits must follow conventional commits format:

```
type(scope): subject

feat(auth): add JWT authentication
fix(api): resolve user validation error
docs(readme): update installation steps
```

## Quality Standards

- No debug statements (`console.log`, `debugger`, `pdb.set_trace`)
- No merge conflict markers
- All tests must pass
- Follow existing code style

## Branch Protection

- `main` and `develop` branches require PR reviews
- All status checks must pass
- Commits must follow conventional format
- No direct pushes allowed

These rules apply regardless of your development environment (VS Code, IntelliJ, command line, etc.).
