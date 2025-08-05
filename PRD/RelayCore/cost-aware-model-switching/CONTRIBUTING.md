# Contributing to Cost-Aware Model Switching

Thank you for considering contributing to the Cost-Aware Model Switching component! This document provides guidelines and instructions for contributing.

## Development Setup

Please refer to the [DEVELOPMENT.md](DEVELOPMENT.md) file for instructions on setting up the development environment.

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Follow the existing code style
- Use interfaces for type definitions
- Use async/await for asynchronous code
- Add appropriate error handling

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use Jest for testing
- Run tests before submitting a pull request

### Documentation

- Document all public APIs
- Update README.md and other documentation as needed
- Use JSDoc comments for functions and classes
- Keep documentation up to date with code changes

## Git Workflow

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run tests
5. Submit a pull request

### Branch Naming

- Use `feature/` prefix for new features
- Use `fix/` prefix for bug fixes
- Use `docs/` prefix for documentation changes
- Use `refactor/` prefix for code refactoring
- Use `test/` prefix for test-related changes

### Commit Messages

- Use clear and descriptive commit messages
- Start with a verb in the present tense
- Keep the first line under 72 characters
- Reference issue numbers when applicable

Example:
```
Add budget alert notification system

- Implement email notifications for budget alerts
- Add Slack integration for critical alerts
- Create notification preferences UI

Fixes #123
```

## Pull Requests

- Create a pull request from your feature branch to the `main` branch
- Provide a clear description of the changes
- Reference any related issues
- Make sure all tests pass
- Request a review from a maintainer

## Code Review

- Be respectful and constructive in code reviews
- Address all review comments
- Make requested changes in the same branch
- Request a re-review after making changes

## Reporting Issues

- Use the issue tracker to report bugs
- Provide a clear description of the issue
- Include steps to reproduce
- Include expected and actual behavior
- Include version information

## Feature Requests

- Use the issue tracker to request features
- Clearly describe the feature and its benefits
- Provide examples of how the feature would be used
- Consider implementation details if possible

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).