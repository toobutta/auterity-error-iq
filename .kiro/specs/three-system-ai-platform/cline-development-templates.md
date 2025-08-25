# CLINE RAPID DEVELOPMENT TEMPLATES

## TEMPLATE: API Integration Task

```markdown
**Task**: [Brief description]
**Files**: [Specific files to modify]
**API Endpoints**: [Exact endpoints to implement]
**Types**: [TypeScript interfaces needed]
**Tests**: [Test files to create/update]
**Time**: [Estimated hours]

### Implementation Steps:

1. Create/update TypeScript interfaces
2. Implement API client functions
3. Add error handling
4. Write unit tests
5. Update integration points

### Success Criteria:

- All endpoints working
- Types properly defined
- Tests passing
- Error handling complete
```

## TEMPLATE: Component Development Task

```markdown
**Component**: [ComponentName]
**Location**: [File path]
**Props**: [Interface definition]
**Styling**: [Tailwind classes]
**State**: [State management approach]
**API**: [API integration details]

### Implementation:

1. Create component file with TypeScript
2. Implement props interface
3. Add styling with Tailwind
4. Integrate with API
5. Add error boundaries
6. Write component tests

### Quality Gates:

- TypeScript strict mode compliant
- Responsive design
- Accessibility compliant
- Test coverage >90%
```

## TEMPLATE: Database/Backend Task

```markdown
**Models**: [SQLAlchemy models to create/update]
**Endpoints**: [FastAPI routes to implement]
**Services**: [Business logic services]
**Migrations**: [Alembic migrations needed]

### Implementation:

1. Update/create SQLAlchemy models
2. Generate Alembic migration
3. Implement FastAPI endpoints
4. Add service layer logic
5. Write API tests
6. Update OpenAPI docs

### Validation:

- Database schema correct
- API endpoints functional
- Tests passing
- Documentation updated
```

## RAPID HANDOFF PROTOCOL

When Amazon Q completes security fixes:

1. Amazon Q updates task status to completed
2. Cline immediately begins Phase 2 Task 2 (unified project structure)
3. No approval delays - execute based on specifications
4. Direct tool-to-tool communication for any issues
