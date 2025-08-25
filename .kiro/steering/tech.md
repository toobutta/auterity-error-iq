# Technology Stack & Build System

## Backend Stack

- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL 15 with SQLAlchemy ORM
- **AI Integration**: OpenAI API for GPT-powered workflows
- **Authentication**: JWT-based auth system
- **Migration**: Alembic for database migrations

## Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **Workflow UI**: React Flow Renderer for drag-and-drop interface
- **HTTP Client**: Axios for API communication
- **Routing**: React Router DOM v6
- **Charts**: Recharts for data visualization
- **Syntax Highlighting**: React Syntax Highlighter for code display
- **Testing**: Vitest with React Testing Library
- **State Management**: React Context API with custom hooks

## Development Environment

- **Containerization**: Docker and Docker Compose
- **Database**: PostgreSQL container for local development
- **Hot Reload**: Both backend (uvicorn) and frontend (Vite) support hot reload

## Code Quality & Standards

- **Python**: Black formatter (88 char line length), Flake8 linter, isort for imports
- **TypeScript**: ESLint with TypeScript rules, Prettier for formatting
- **Testing**: pytest for backend, Vitest for frontend
- **Async**: Full async/await support in FastAPI backend

## Common Commands

### Development Setup

```bash
# Start full development environment
docker-compose up -d

# Copy environment template
cp .env.example .env
```

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload    # Development server
pytest                          # Run tests
black .                         # Format code
flake8 .                        # Lint code
alembic upgrade head            # Run migrations
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev                     # Development server (port 3000)
npm test                       # Run tests
npm run lint                   # Lint code
npm run build                  # Production build
```

### Database Operations

```bash
# Access PostgreSQL container
docker-compose exec postgres psql -U postgres -d workflow_engine

# Create new migration
cd backend && alembic revision --autogenerate -m "description"
```

## API Documentation

- Automatic OpenAPI docs available at `http://localhost:8000/docs`
- ReDoc format at `http://localhost:8000/redoc`
