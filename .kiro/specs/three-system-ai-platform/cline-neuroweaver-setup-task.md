# CLINE-TASK: NeuroWeaver Project Structure and Core Services Setup

## Task Overview

Set up NeuroWeaver project structure with FastAPI backend, Next.js frontend, and Docker containers for training and inference services.

## Context

- **Phase**: 3 - NeuroWeaver Integration (Week 3)
- **Priority**: High - Can start in parallel with Amazon Q steering rules work
- **Dependencies**: Unified auth system (Task 3) completed
- **Requirements**: 3.1, 6.2 from requirements.md

## Technical Specifications

### 1. FastAPI Backend Setup

**Directory**: `systems/neuroweaver/backend/`

**File Structure**:

```
systems/neuroweaver/backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── api/
│   │   ├── __init__.py
│   │   ├── models.py          # Model registry endpoints
│   │   ├── training.py        # Training pipeline endpoints
│   │   ├── inference.py       # Model inference endpoints
│   │   └── health.py          # Health check endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   ├── model_registry.py  # SQLAlchemy models
│   │   ├── training_job.py    # Training job models
│   │   └── deployment.py      # Deployment models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── model_manager.py   # Model lifecycle management
│   │   ├── training_service.py # Training orchestration
│   │   └── inference_service.py # Inference handling
│   ├── database.py            # Database connection
│   └── config.py              # Configuration management
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Backend container
└── alembic/                   # Database migrations
    ├── env.py
    └── versions/
```

**Key Dependencies**:

```txt
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
pydantic==2.5.0
httpx==0.25.2
torch==2.1.1
transformers==4.36.0
```

### 2. Next.js Frontend Setup

**Directory**: `systems/neuroweaver/frontend/`

**File Structure**:

```
systems/neuroweaver/frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── models/
│   │   │   ├── page.tsx       # Model registry page
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Model detail page
│   │   ├── training/
│   │   │   └── page.tsx       # Training dashboard
│   │   └── api/
│   │       └── models/
│   │           └── route.ts   # API routes
│   ├── components/
│   │   ├── ModelCard.tsx      # Model display component
│   │   ├── TrainingStatus.tsx # Training progress
│   │   ├── DeploymentPanel.tsx # Deployment controls
│   │   └── PerformanceChart.tsx # Metrics visualization
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── types.ts           # TypeScript interfaces
│   └── styles/
│       └── globals.css        # Global styles
├── package.json               # Node.js dependencies
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS config
└── Dockerfile                 # Frontend container
```

**Key Dependencies**:

```json
{
  "dependencies": {
    "next": "14.0.3",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@mui/material": "5.14.18",
    "@mui/icons-material": "5.14.18",
    "recharts": "2.8.0",
    "axios": "1.6.2",
    "typescript": "5.3.2"
  }
}
```

### 3. Docker Container Configuration

**Files**:

- `systems/neuroweaver/docker-compose.yml`
- `systems/neuroweaver/backend/Dockerfile`
- `systems/neuroweaver/frontend/Dockerfile`

**Services Required**:

- **Backend**: FastAPI application with GPU support
- **Frontend**: Next.js application with static optimization
- **Training**: Separate container for model training with GPU
- **Inference**: Optimized container for model serving
- **Database**: PostgreSQL with model metadata schema

### 4. Core API Endpoints

**Model Registry API** (`app/api/models.py`):

```python
@router.post("/models/register")
async def register_model(model: ModelRegistration) -> ModelResponse:
    """Register a new model in the registry"""

@router.get("/models")
async def list_models(skip: int = 0, limit: int = 100) -> List[ModelResponse]:
    """List all registered models"""

@router.get("/models/{model_id}")
async def get_model(model_id: str) -> ModelResponse:
    """Get model details by ID"""

@router.post("/models/{model_id}/deploy")
async def deploy_model(model_id: str) -> DeploymentResponse:
    """Deploy model to inference service"""
```

**Training API** (`app/api/training.py`):

```python
@router.post("/training/jobs")
async def create_training_job(job: TrainingJobRequest) -> TrainingJobResponse:
    """Start a new training job"""

@router.get("/training/jobs/{job_id}")
async def get_training_status(job_id: str) -> TrainingJobResponse:
    """Get training job status"""
```

## Implementation Requirements

### Database Schema

**Tables to Create**:

- `models` - Model registry with metadata
- `training_jobs` - Training job tracking
- `deployments` - Model deployment status
- `performance_metrics` - Model performance data

### Authentication Integration

- Use unified JWT authentication from Task 3
- Implement role-based access for model management
- Secure API endpoints with proper authorization

### Error Handling

- Comprehensive error responses with proper HTTP status codes
- Logging integration with RelayCore logging system
- Graceful handling of GPU/training resource unavailability

### Performance Requirements

- API response times < 200ms for registry operations
- Support for large model file uploads (up to 5GB)
- Efficient model metadata querying and filtering

## Quality Gates

### Functional Requirements

- [ ] All API endpoints implemented and working
- [ ] Frontend components render correctly
- [ ] Database schema created and migrations working
- [ ] Docker containers build and run successfully

### Integration Requirements

- [ ] Authentication works with unified auth system
- [ ] API client properly handles all endpoints
- [ ] Frontend communicates correctly with backend
- [ ] Health checks pass for all services

### Code Quality Requirements

- [ ] TypeScript strict mode enabled with no errors
- [ ] Python code follows FastAPI best practices
- [ ] Proper error handling throughout
- [ ] Comprehensive logging implemented

## Success Criteria

1. **Structure**: Complete project structure with all required files
2. **Services**: All core services running in Docker containers
3. **API**: All endpoints implemented and tested
4. **Frontend**: Basic UI components working
5. **Integration**: Ready for RelayCore connector implementation

## Next Steps for Amazon Q

After completion, this setup will be ready for:

- Model registry and deployment implementation (Task 8)
- Performance monitoring integration (Task 9)
- RelayCore connector development

## Estimated Completion

**Target**: 12-16 hours
**Priority**: High - Foundation for all NeuroWeaver features

## Files to Create

1. Complete backend FastAPI structure
2. Next.js frontend with Material-UI components
3. Docker configuration for all services
4. Database models and migrations
5. Basic API client and TypeScript interfaces
6. Health check and monitoring endpoints
