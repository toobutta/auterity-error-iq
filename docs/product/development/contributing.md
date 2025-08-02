# Contributing to Auterity

## 🚀 Development Workflow

### Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

**Scopes:**
- `backend`: Backend changes
- `frontend`: Frontend changes
- `api`: API changes
- `auth`: Authentication
- `workflow`: Workflow engine
- `template`: Template system
- `infra`: Infrastructure

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat(frontend): add workflow builder validation"
   ```

3. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **PR Requirements**
   - [ ] All tests pass
   - [ ] Code review approved
   - [ ] Documentation updated
   - [ ] No merge conflicts

### Code Quality Standards

**Backend (Python):**
- Use `black` for formatting
- Use `flake8` for linting
- Use `pytest` for testing
- Minimum 80% test coverage

**Frontend (TypeScript):**
- Use `prettier` for formatting
- Use `eslint` for linting
- Use `jest/vitest` for testing
- Minimum 80% test coverage

### Security Guidelines

- Never commit secrets or API keys
- Use environment variables for configuration
- Run security audits before merging
- Follow OWASP security practices

### Release Process

1. **Version Bump**
   ```bash
   npm version patch|minor|major
   ```

2. **Create Release Tag**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

3. **Automated Deployment**
   - GitHub Actions will handle deployment
   - Staging: `develop` branch
   - Production: `main` branch

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority
- `priority: medium` - Medium priority
- `priority: low` - Low priority