# [AMAZON-Q-TASK] Backend Code Quality Emergency Fix

## Task Overview
Fix 500+ backend linting violations to achieve production-ready code quality standards.

## Current Issue Analysis
From PROJECT_HEALTH_AUDIT_REPORT.md:
- 500+ linting violations across backend codebase
- Major categories: import organization, unused imports, whitespace, line length, bare except clauses

## Violation Categories to Fix

### 1. Import Organization (50+ violations - E402)
**Issue**: Imports not at top of file
**Fix Strategy**: Move all imports to file top, group by: standard library → third party → local

### 2. Unused Imports (100+ violations - F401)
**Issue**: Dead code from unused imports
**Fix Strategy**: Remove unused imports, indicates potential dead code

### 3. Whitespace Issues (200+ violations - W293, W291)
**Issue**: Trailing whitespace, blank line issues
**Fix Strategy**: Automated cleanup with black formatter

### 4. Line Length (50+ violations - E501)
**Issue**: Lines >88 characters
**Fix Strategy**: Break long lines, use proper line continuation

### 5. Bare Except Clauses (Multiple - E722)
**Issue**: `except:` without specific exception type
**Fix Strategy**: Replace with specific exception handling

## Implementation Strategy

### Step 1: Automated Formatting
```bash
cd backend
# Install formatting tools if not present
pip install black isort flake8

# Run automated formatters
python -m black . --line-length 88
python -m isort . --profile black
```

### Step 2: Manual Fixes for Remaining Issues
After automated formatting, manually fix:

**Bare Except Clauses:**
```python
# Replace this pattern:
try:
    risky_operation()
except:
    handle_error()

# With specific exceptions:
try:
    risky_operation()
except (ValueError, TypeError) as e:
    logger.error(f"Operation failed: {e}")
    handle_error()
```

**Import Organization:**
```python
# Correct order:
import os
import sys
from typing import Dict, List

import fastapi
import sqlalchemy
from pydantic import BaseModel

from app.models import Workflow
from app.services import WorkflowService
from .utils import helper_function
```

### Step 3: Remove Unused Imports
```bash
# Find unused imports
python -m flake8 . --select=F401

# Remove each unused import manually to avoid breaking dependencies
```

## Key Files to Focus On
Based on typical FastAPI structure:
- `app/main.py` - Application entry point
- `app/api/*.py` - API route handlers  
- `app/models/*.py` - Database models
- `app/services/*.py` - Business logic
- `app/database.py` - Database configuration

## Validation Commands
```bash
cd backend
python -m flake8 .                    # Should show <50 violations
python -m black . --check             # Should show no changes needed
python -m isort . --check-only         # Should show no changes needed
python -m pytest                      # All tests should pass
```

## Success Criteria
- [ ] Flake8 violations reduced from 500+ to <50
- [ ] All import organization issues (E402) fixed
- [ ] All unused imports (F401) removed
- [ ] All whitespace issues (W293, W291) fixed
- [ ] All bare except clauses (E722) replaced with specific exceptions
- [ ] Line length violations (E501) reduced to <10
- [ ] All existing tests still pass
- [ ] No new runtime errors introduced

## Critical Safety Checks
- **Test After Each Major Change**: Run tests frequently to catch breaking changes
- **Preserve Functionality**: Don't remove imports that might be used dynamically
- **Database Migrations**: Ensure alembic still works after model file changes
- **API Endpoints**: Verify all endpoints still respond correctly

## Context Files to Reference
- `PROJECT_HEALTH_AUDIT_REPORT.md` - Detailed violation analysis
- `backend/requirements.txt` - Dependencies for import organization
- `backend/alembic.ini` - Database migration configuration
- `backend/app/` - Main application code

## Expected Timeline
- Automated formatting: 30 minutes
- Manual import fixes: 2 hours
- Bare except clause fixes: 1 hour
- Testing and validation: 1 hour
- Total: 4-5 hours

## Risk Mitigation
- **Backup Current State**: Commit current code before starting
- **Incremental Approach**: Fix one category at a time
- **Continuous Testing**: Run tests after each major change
- **Rollback Plan**: Keep git history clean for easy rollback

## Handoff Notes
After completion, document any architectural issues discovered that need Kiro's attention for the MCP orchestration layer planning.