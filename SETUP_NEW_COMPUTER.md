# New Computer Setup Guide

## 1. Install Core Software

### Python 3.11+
```bash
winget install Python.Python.3.11
```

### Docker Desktop
```bash
winget install Docker.DockerDesktop
```

### Git
```bash
winget install Git.Git
```

### Visual Studio Code
```bash
winget install Microsoft.VisualStudioCode
```

## 2. Configure Environment

### Create .env file
```bash
copy .env.example .env
```

### Install Python dependencies
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Install Node.js dependencies
```bash
cd frontend
npm install
```

### Install RelayCore dependencies
```bash
cd systems\relaycore
npm install
```

### Install NeuroWeaver dependencies
```bash
cd systems\neuroweaver\frontend
npm install
```

## 3. Required API Keys

Add these to your .env file:
- `OPENAI_API_KEY=your_key_here`
- `ANTHROPIC_API_KEY=your_key_here`
- `SECRET_KEY=generate_secure_key`

## 4. Start Services

### Full stack with Docker
```bash
docker-compose up -d
```

### Development mode
```bash
# Backend
cd backend && python -m app.main

# Frontend
cd frontend && npm run dev

# RelayCore
cd systems\relaycore && npm run dev
```

## 5. Verify Installation

### Check services
- Backend: http://localhost:8000/docs
- Frontend: http://localhost:3000
- RelayCore: http://localhost:3001
- Grafana: http://localhost:3003 (admin/admin123)

### Run tests
```bash
cd frontend && npm run test
cd backend && pytest
```

## 6. Development Tools Setup

### VS Code Extensions
- Python
- TypeScript and JavaScript
- Docker
- GitLens
- Prettier
- ESLint

### Configure Git
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 7. Production Readiness Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Tests passing
- [ ] Docker containers running
- [ ] Monitoring dashboards accessible
- [ ] API keys configured
- [ ] SSL certificates (for production)