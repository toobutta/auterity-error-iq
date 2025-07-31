# AutoMatrix AI Hub Workflow Engine MVP

A streamlined workflow automation platform for automotive dealerships that demonstrates core AI-powered workflow capabilities with production-ready deployment.

## Project Structure

```
├── backend/                 # FastAPI backend application
│   ├── app/                # Application code
│   │   ├── api/           # API routes
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic services
│   │   └── main.py        # FastAPI application entry point
│   ├── tests/             # Backend tests
│   ├── Dockerfile         # Backend Docker configuration
│   └── requirements.txt   # Python dependencies
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   ├── Dockerfile         # Frontend Docker configuration
│   └── package.json       # Node.js dependencies
├── nginx/                 # Nginx reverse proxy configuration
├── scripts/               # Deployment and maintenance scripts
├── docker-compose.yml     # Development environment setup
├── docker-compose.prod.yml # Production environment setup
├── .env.example          # Environment variables template
├── .env.production       # Production environment template
├── .env.staging          # Staging environment template
└── DEPLOYMENT.md         # Detailed deployment guide
```

## Quick Start

### Production Deployment

1. **Prerequisites**
   - Docker and Docker Compose
   - OpenAI API key
   - At least 2GB RAM and 10GB disk space

2. **Deploy to Production**
   ```bash
   cp .env.production .env
   # Edit .env with your configuration (see DEPLOYMENT.md)
   ./scripts/deploy.sh production
   ```

3. **Verify Deployment**
   ```bash
   ./scripts/deploy-check.sh
   ```

4. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Health Checks: http://localhost:8000/api/monitoring/health

### Development Setup

1. **Prerequisites**
   - Docker and Docker Compose
   - Node.js 18+ (for local frontend development)
   - Python 3.11+ (for local backend development)

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

4. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - PostgreSQL: localhost:5432

## Development Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # Run development server
pytest                        # Run tests
black .                       # Format code
flake8 .                      # Lint code
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # Run development server
npm test                     # Run tests
npm run lint                 # Lint code
npm run build                # Build for production
```

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, OpenAI API
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Development**: Docker, pytest, Jest, ESLint, Black
- **Database**: PostgreSQL 15

## Features

- Visual drag-and-drop workflow builder
- AI-powered workflow execution with OpenAI GPT
- Real-time execution monitoring and logging
- Pre-built workflow templates
- JWT-based authentication
- RESTful API with automatic documentation
- Production-ready deployment with Docker
- Health checks and monitoring endpoints
- Nginx reverse proxy with SSL support
- Database backup and maintenance scripts

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Commands

```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy to staging  
./scripts/deploy.sh staging

# Health check
./scripts/deploy-check.sh

# Backup database
./scripts/backup.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Monitoring

The application includes comprehensive health monitoring:

- **Application Health**: `/api/monitoring/health`
- **Detailed Health**: `/api/monitoring/health/detailed`  
- **System Metrics**: `/api/monitoring/metrics/system`
- **Container Health**: Built-in Docker health checks