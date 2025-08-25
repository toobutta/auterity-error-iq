# Development Setup

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Git

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

```bash
# Start PostgreSQL
docker-compose up -d postgres redis

# Run migrations
cd backend
alembic upgrade head

# Seed data
python seed_templates.py
```

## Development Workflow

### Code Quality

```bash
# Backend linting
cd backend
black .
flake8 .
isort .

# Frontend linting
cd frontend
npm run lint
npm run type-check
```

### Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Hot Reload

- Backend: `uvicorn app.main:app --reload`
- Frontend: `npm run dev`
- Services: `docker-compose up -d`

## Environment Variables

Copy `.env.example` to `.env` and configure:

- API keys (OpenAI, Anthropic)
- Database credentials
- Service endpoints

## IDE Configuration

- VSCode: Install Python, TypeScript extensions
- PyCharm: Configure Python interpreter
- Enable format on save
- Set up debugging configurations
