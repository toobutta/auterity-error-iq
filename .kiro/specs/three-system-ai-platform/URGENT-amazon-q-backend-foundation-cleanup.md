# URGENT: Amazon Q Backend Foundation Cleanup

**Priority**: CRITICAL
**Tool Assignment**: AMAZON Q
**Estimated Time**: 4-6 hours
**Focus**: Clean backend workflow API foundation

## PROBLEM ANALYSIS

The current backend has substantial functionality but critical quality issues that prevent reliable operation:

### Critical Issues Identified:

1. **Code Quality**: 500+ linting violations (imports, formatting, unused code)
2. **Type Safety**: Missing type hints, inconsistent error handling
3. **Test Failures**: Backend tests likely failing due to quality issues
4. **Performance**: Inefficient database queries and connection handling
5. **Security**: Potential vulnerabilities in error handling and data validation

### Current State Assessment:

- ✅ **Models**: Workflow, User, Execution models exist but need cleanup
- ✅ **API Structure**: FastAPI endpoints exist but need quality fixes
- ✅ **Services**: Error correlation and workflow engine exist but need refactoring
- ❌ **Quality**: Extensive linting violations and code quality issues
- ❌ **Testing**: Test infrastructure likely broken due to quality issues

## CLEANUP SPECIFICATIONS

### 1. CODE QUALITY FIXES

#### Linting Violations (Priority 1):

```bash
# Current violations to fix:
# - E402: imports not at top of file
# - F401: unused imports
# - W293: blank line contains whitespace
# - W291: trailing whitespace
# - E501: line too long (>88 characters)
# - E722: bare except clauses
# - F821: undefined name references
```

#### Implementation Strategy:

```bash
cd backend

# 1. Fix import organization
python -m isort . --profile black

# 2. Fix code formatting
python -m black . --line-length 88

# 3. Fix remaining flake8 violations manually
python -m flake8 . --max-line-length=88 --extend-ignore=E203,W503

# 4. Add type hints where missing
python -m mypy . --install-types --non-interactive
```

### 2. BACKEND API CLEANUP

#### Current Files to Clean:

- `backend/app/models/workflow.py` - Fix line length violations
- `backend/app/api/websockets.py` - Clean up error handling
- `backend/app/services/error_correlation.py` - Refactor for maintainability
- `backend/app/api/auth.py` - Ensure security best practices
- `backend/app/exceptions.py` - Standardize error handling

#### Quality Requirements:

```python
# Example of cleaned workflow model
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Workflow(Base):
    """Workflow model for storing workflow definitions and metadata."""

    __tablename__ = "workflows"

    id: UUID = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text)
    user_id: UUID = Column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )
    definition: dict = Column(JSON, nullable=False)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    created_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: datetime = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships with proper type hints
    user = relationship("User", back_populates="workflows")
    executions = relationship(
        "WorkflowExecution",
        back_populates="workflow",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Workflow(id={self.id}, name='{self.name}')>"
```

### 3. ERROR HANDLING STANDARDIZATION

#### Current Issues:

- Inconsistent exception handling
- Missing error sanitization
- No structured error responses
- Potential information leakage

#### Standardized Error Handling:

```python
# backend/app/exceptions.py
from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class WorkflowError(HTTPException):
    """Base workflow error with structured response."""

    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "WORKFLOW_ERROR",
        context: Optional[Dict[str, Any]] = None
    ):
        self.error_code = error_code
        self.context = context or {}
        super().__init__(status_code=status_code, detail=detail)


class WorkflowNotFoundError(WorkflowError):
    """Workflow not found error."""

    def __init__(self, workflow_id: str):
        super().__init__(
            detail=f"Workflow not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="WORKFLOW_NOT_FOUND",
            context={"workflow_id": workflow_id}
        )


class WorkflowExecutionError(WorkflowError):
    """Workflow execution error."""

    def __init__(self, message: str, execution_id: Optional[str] = None):
        super().__init__(
            detail=f"Workflow execution failed: {message}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="EXECUTION_ERROR",
            context={"execution_id": execution_id} if execution_id else {}
        )
```

### 4. DATABASE OPTIMIZATION

#### Current Issues:

- Inefficient queries in error correlation service
- Missing database indexes
- No connection pooling optimization
- Potential N+1 query problems

#### Optimization Strategy:

```python
# Optimized database queries
from sqlalchemy.orm import selectinload, joinedload

class WorkflowService:
    """Optimized workflow service with efficient queries."""

    async def get_workflow_with_executions(
        self,
        workflow_id: UUID,
        db: Session
    ) -> Optional[Workflow]:
        """Get workflow with executions using optimized query."""
        return (
            db.query(Workflow)
            .options(
                selectinload(Workflow.executions),
                joinedload(Workflow.user)
            )
            .filter(Workflow.id == workflow_id)
            .first()
        )

    async def get_user_workflows(
        self,
        user_id: UUID,
        db: Session,
        limit: int = 50
    ) -> List[Workflow]:
        """Get user workflows with pagination."""
        return (
            db.query(Workflow)
            .filter(Workflow.user_id == user_id)
            .filter(Workflow.is_active == True)
            .order_by(Workflow.updated_at.desc())
            .limit(limit)
            .all()
        )
```

### 5. SECURITY HARDENING

#### Security Issues to Address:

- Input validation on all endpoints
- SQL injection prevention
- Error message sanitization
- Authentication bypass prevention

#### Security Implementation:

```python
from pydantic import BaseModel, validator
from typing import Dict, Any

class WorkflowCreateRequest(BaseModel):
    """Validated workflow creation request."""

    name: str
    description: Optional[str] = None
    definition: Dict[str, Any]

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Workflow name cannot be empty')
        if len(v) > 255:
            raise ValueError('Workflow name too long')
        return v.strip()

    @validator('definition')
    def validate_definition(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Definition must be a valid JSON object')
        if 'nodes' not in v or 'edges' not in v:
            raise ValueError('Definition must contain nodes and edges')
        return v

    class Config:
        schema_extra = {
            "example": {
                "name": "Customer Onboarding",
                "description": "Automated customer onboarding workflow",
                "definition": {
                    "nodes": [],
                    "edges": []
                }
            }
        }
```

## TESTING INFRASTRUCTURE FIXES

### Current Test Issues:

- Tests likely failing due to code quality issues
- Missing test database setup
- Inconsistent mock patterns
- Memory leaks in test execution

### Test Infrastructure Cleanup:

```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db, Base
from app.models import User, Workflow

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

@pytest.fixture(scope="function")
def db():
    """Create test database session."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Create test client with database dependency override."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

## SUCCESS CRITERIA

### Code Quality:

- [ ] Zero flake8 violations
- [ ] Zero mypy type errors
- [ ] All imports properly organized
- [ ] Consistent code formatting

### Functionality:

- [ ] All API endpoints working
- [ ] Database operations optimized
- [ ] Error handling standardized
- [ ] Security vulnerabilities addressed

### Testing:

- [ ] All backend tests passing
- [ ] Test coverage >80%
- [ ] No memory leaks in tests
- [ ] Consistent test patterns

### Performance:

- [ ] Database queries optimized
- [ ] API response times <500ms
- [ ] Memory usage stable
- [ ] No resource leaks

## IMPLEMENTATION TIMELINE

### Hour 1-2: Code Quality Fixes

- [ ] Run automated formatting tools
- [ ] Fix import organization
- [ ] Address linting violations
- [ ] Add missing type hints

### Hour 3-4: API Cleanup

- [ ] Standardize error handling
- [ ] Optimize database queries
- [ ] Add input validation
- [ ] Security hardening

### Hour 5-6: Testing Infrastructure

- [ ] Fix test configuration
- [ ] Ensure all tests pass
- [ ] Add missing test coverage
- [ ] Performance validation

## HANDOFF TO CLINE

After Amazon Q completes this cleanup, the backend will have:

- ✅ Clean, maintainable code with zero quality violations
- ✅ Standardized error handling and security measures
- ✅ Optimized database operations
- ✅ Working test infrastructure
- ✅ Type-safe, well-documented APIs

This provides the **secure, clean foundation** that Cline needs to implement the frontend integration and additional workflow functionality without inheriting technical debt.

## CRITICAL SUCCESS FACTORS

1. **Zero Tolerance**: No code quality violations allowed
2. **Security First**: All inputs validated, errors sanitized
3. **Performance**: All queries optimized, no N+1 problems
4. **Type Safety**: Complete type hints throughout
5. **Test Coverage**: All critical paths tested and passing

This cleanup ensures the backend foundation is production-ready and maintainable before building additional functionality on top of it.
