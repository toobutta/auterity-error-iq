# Development Hooks Configuration

This directory contains automated hooks to streamline development while maintaining code quality and stability.

## Available Hooks

### Automatic (On File Save)

- **format-on-save**: Auto-formats Python code with Black and isort
- **test-on-save**: Runs relevant tests when backend files are saved
- **migration-check**: Alerts when model changes might need migrations
- **api-docs-update**: Updates API documentation when routes change
- **workflow-validation**: Validates workflow engine after core changes
- **frontend-lint**: Lints and type-checks TypeScript files

### Manual (On-Demand)

- **security-check**: Comprehensive security vulnerability scan
- **deployment-check**: Pre-deployment validation checklist

## Recommended Setup

For maximum efficiency with minimal interruption:

1. **Enable automatic hooks** for immediate feedback
2. **Use manual hooks** before major commits or deployments
3. **Customize file patterns** based on your workflow preferences

## Balancing Automation vs Control

- **High automation**: Enable all file-save hooks for immediate feedback
- **Moderate automation**: Enable formatting and linting only
- **Manual control**: Use only manual hooks when you want to run checks

## Hook Performance Tips

- Hooks run in the background and won't block your editor
- Failed hooks show notifications but don't prevent saving
- You can disable individual hooks by renaming the `.md` files

## Customization

Edit any hook file to:

- Change file patterns that trigger the hook
- Modify the commands that run
- Add additional validation steps
- Adjust notification messages
