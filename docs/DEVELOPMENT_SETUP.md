

# Development Setu

p

#

# Local Developmen

t

#

## Prerequisite

s

- Python 3.1

1

+ - Node.js 1

8

+ - Docker & Docker Compos

e

- Gi

t

#

## Backend Setu

p

```bash
cd backend
python -m venv venv

source venv/bin/activate

# Windows: venv\Scripts\activate

pip install -r requirements.tx

t

```

#

## Frontend Setu

p

```

bash
cd frontend
npm install
npm run dev

```

#

## Database Setu

p

```

bash

# Start PostgreSQL

docker-compose up -d postgres redi

s

# Run migrations

cd backend
alembic upgrade head

# Seed data

python seed_templates.py

```

#

# Development Workflo

w

#

## Code Qualit

y

```

bash

# Backend linting

cd backend
black .
flake8 .
isort .

# Frontend linting

cd frontend
npm run lint
npm run type-chec

k

```

#

## Testin

g

```

bash

# Backend tests

cd backend
pytest

# Frontend tests

cd frontend
npm test

```

#

## Hot Reloa

d

- Backend: `uvicorn app.main:app --reload

`

- Frontend: `npm run dev

`

- Services: `docker-compose up -d

`

#

# Environment Variable

s

Copy `.env.example` to `.env` and configure:

- API keys (OpenAI, Anthropic

)

- Database credential

s

- Service endpoint

s

#

# IDE Configuratio

n

- VSCode: Install Python, TypeScript extension

s

- PyCharm: Configure Python interprete

r

- Enable format on sav

e

- Set up debugging configuration

s
