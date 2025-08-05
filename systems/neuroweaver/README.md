# NeuroWeaver - Model Specialization Platform

NeuroWeaver provides specialized AI model training and deployment for automotive domain expertise.

## Architecture
- **Backend**: FastAPI with PostgreSQL for model registry
- **Frontend**: Next.js with Material-UI components
- **Training**: Docker containers for model fine-tuning
- **Deployment**: Model serving with health checks

## Key Features
- Model registry with versioning
- Automated fine-tuning pipeline using QLoRA and RLAIF
- Automotive-specific prompt templates
- Performance monitoring and automatic model switching
- Integration with RelayCore for model registration

## Development Setup
```bash
cd systems/neuroweaver
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install
npm run dev
```

## API Endpoints
- `POST /api/v1/models` - Register new model
- `GET /api/v1/models` - List available models
- `POST /api/v1/deploy` - Deploy model to production
- `GET /api/v1/metrics` - Model performance metrics