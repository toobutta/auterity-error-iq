# Quickstart Guide

Get Auterity running locally in under 5 minutes.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+ and pip
- **Docker** and Docker Compose (optional)

## Option 1: Docker (Recommended)

The fastest way to get started:

```bash
git clone https://github.com/toobutta/auterity-error-iq.git
cd auterity-error-iq
docker-compose up
```

Access the application:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Option 2: Manual Setup

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Environment Configuration

Copy the example environment files:

```bash
cp .env.example .env.production.local
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update the configuration with your API keys and database settings.

## Verification

1. **Backend Health**: Visit http://localhost:8000/health
2. **Frontend**: Visit http://localhost:3000
3. **API Documentation**: Visit http://localhost:8000/docs

## Next Steps

- [System Architecture](/architecture/system-architecture) - Understand the platform
- [Production Deployment](/deployment/production-deployment) - Deploy to production
