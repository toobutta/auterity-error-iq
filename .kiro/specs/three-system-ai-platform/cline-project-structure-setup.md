# [CLINE-TASK] Project Structure and Template Creation

## Component Overview

Create unified project directory structure and basic code templates for RelayCore and NeuroWeaver systems integration with existing AutoMatrix.

## Props Interface

```typescript
interface ProjectStructure {
  systems: {
    relaycore: RelayCorePlatform;
    neuroweaver: NeuroWeaverPlatform;
  };
  shared: SharedServices;
}

interface RelayCorePlatform {
  backend: ExpressTypeScriptApp;
  routing: SteeringRulesEngine;
  providers: AIProviderManager;
}

interface NeuroWeaverPlatform {
  backend: FastAPIApp;
  frontend: NextJSApp;
  training: ModelTrainingPipeline;
}
```

## API Integration Details

- **RelayCore Endpoints**: `/api/v1/chat`, `/api/v1/models`, `/api/v1/metrics`
- **NeuroWeaver Endpoints**: `/api/v1/models`, `/api/v1/deploy`, `/api/v1/train`
- **Integration Points**: JWT auth, shared database schemas, cross-service communication

## Styling Requirements

- Follow existing AutoMatrix patterns
- TypeScript strict mode throughout
- Consistent error handling patterns
- Proper logging and monitoring integration

## Error Handling Requirements

- Service unavailability fallbacks
- Network timeout handling
- Authentication failures
- Database connection errors
- AI provider API failures

## Technical Context

### Existing Code Patterns

Reference existing AutoMatrix structure:

- `backend/app/` - FastAPI application structure
- `frontend/src/` - React TypeScript components
- `backend/app/models/` - SQLAlchemy models
- `backend/app/api/` - API route handlers

### Directory Structure to Create

```
systems/
├── relaycore/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
└── neuroweaver/
    ├── backend/
    │   ├── app/
    │   │   ├── api/
    │   │   ├── models/
    │   │   └── services/
    │   └── requirements.txt
    └── frontend/
        ├── src/
        │   ├── components/
        │   ├── pages/
        │   └── utils/
        └── package.json
```

### Files to Create

1. **RelayCore Basic Structure**:
   - `systems/relaycore/src/index.ts` - Express app entry point
   - `systems/relaycore/src/routes/ai.ts` - AI routing endpoints
   - `systems/relaycore/src/services/provider-manager.ts` - AI provider management
   - `systems/relaycore/src/models/request.ts` - Request/response types

2. **NeuroWeaver Basic Structure**:
   - `systems/neuroweaver/backend/app/main.py` - FastAPI entry point
   - `systems/neuroweaver/backend/app/api/models.py` - Model management API
   - `systems/neuroweaver/frontend/src/pages/index.tsx` - Main dashboard
   - `systems/neuroweaver/frontend/src/components/ModelCard.tsx` - Model display component

## Success Criteria

- All directory structures created
- Basic template files with proper TypeScript/Python structure
- Package.json and requirements.txt files configured
- Integration points defined with proper interfaces
- Error handling patterns established
- Code follows existing AutoMatrix conventions

## Testing Strategy

- Create basic test files for each service
- Integration test templates for cross-service communication
- Mock implementations for AI providers
- Database connection tests

## Priority

High - Required before any implementation can begin

## Estimated Time

3-4 hours
