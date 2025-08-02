# Development Setup Guide

## Prerequisites

### Required Software
- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** 15+
- **Docker** and Docker Compose
- **Git**

### Development Tools
- **VS Code** (recommended) with extensions:
  - Python
  - TypeScript
  - GitLens
  - Docker
  - Amazon Q Developer

## Quick Setup

### 1. Clone Repository
```bash
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq
```

### 2. Environment Setup
```bash
# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Update environment variables
# Edit .env with your database and API keys
```

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Seed template data
python seed_templates.py

# Start backend server
python -m app.main
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Docker Setup (Alternative)
```bash
# Start all services
docker-compose up

# Or for development with hot reload
docker-compose -f docker-compose.yml up
```

## Development Workflow

### Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes

### Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/your-feature-name
```

### Code Quality
```bash
# Backend linting
cd backend
flake8 app/
black app/

# Frontend linting
cd frontend
npm run lint
npm run format

# Run tests
npm run test        # Frontend
python -m pytest   # Backend
```

## Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/auterity
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
CORS_ORIGINS=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Auterity
```

### Database Setup
```bash
# Create database
createdb auterity

# Run migrations
cd backend
alembic upgrade head

# Seed data
python seed_templates.py
```

## Testing

### Backend Tests
```bash
cd backend

# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=app --cov-report=html

# Run specific test file
python -m pytest tests/test_workflows.py
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test
npm run test -- WorkflowBuilder.test.tsx
```

### Integration Tests
```bash
# Run end-to-end tests
npm run test:e2e

# Run API integration tests
cd backend
python -m pytest tests/integration/
```

## Debugging

### Backend Debugging
```bash
# Enable debug mode
export DEBUG=true

# Run with debugger
python -m debugpy --listen 5678 --wait-for-client -m app.main
```

### Frontend Debugging
- Use browser dev tools
- React Developer Tools extension
- VS Code debugger with launch.json

### Database Debugging
```bash
# Connect to database
psql postgresql://user:password@localhost/auterity

# View logs
tail -f /var/log/postgresql/postgresql.log
```

## Common Issues

### Port Conflicts
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql
```

### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### Backend
- Use async/await for database operations
- Implement proper indexing
- Use connection pooling
- Cache frequently accessed data

### Frontend
- Use React.lazy for code splitting
- Implement proper memoization
- Optimize bundle size
- Use proper image optimization

## Security Considerations

### Development
- Never commit secrets to git
- Use environment variables for configuration
- Keep dependencies updated
- Use HTTPS in production

### Production
- Enable CORS properly
- Use secure headers
- Implement rate limiting
- Regular security audits

## Deployment

### Local Development
```bash
# Start all services
docker-compose up

# Or individual services
npm run dev        # Frontend
python -m app.main # Backend
```

### Staging Deployment
```bash
# Build and deploy to staging
git push origin develop
# CI/CD will handle deployment
```

### Production Deployment
```bash
# Create release
git tag v1.0.0
git push origin v1.0.0
# CI/CD will handle production deployment
```

## Resources

### Documentation
- [API Documentation](../api/api-overview.md)
- [Architecture Guide](../architecture/system-architecture.md)
- [Contributing Guidelines](contributing.md)

### Tools
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Community
- [GitHub Issues](https://github.com/toobutta/auterity-error-iq/issues)
- [Discussions](https://github.com/toobutta/auterity-error-iq/discussions)