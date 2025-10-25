

# Quickstart Guid

e

Get Auterity running locally in under 5 minutes.

#

# Prerequisite

s

- **Node.js

* * 1

8

+ and np

m

- **Python

* * 3.1

2

+ and pi

p

- **Docker

* * and Docker Compose (optional

)

#

# Option 1: Docker (Recommended

)

The fastest way to get started:

```bash
git clone https://github.com/toobutta/auterity-error-iq.git

cd auterity-error-iq

docker-compose u

p

```

Access the application:

- **Frontend**: http://localhost:300

0

- **Backend API**: http://localhost:800

0

- **API Docs**: http://localhost:8000/doc

s

#

# Option 2: Manual Setu

p

#

## Backend Setu

p

```

bash
cd backend
pip install -r requirements.txt

python -m app.mai

n

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

# Environment Configuratio

n

Copy the example environment files:

```

bash
cp .env.example .env.production.local
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

```

Update the configuration with your API keys and database settings.

#

# Verificatio

n

1. **Backend Health**: Visit http://localhost:8000/heal

t

h

2. **Frontend**: Visit http://localhost:30

0

0

3. **API Documentation**: Visit http://localhost:8000/do

c

s

#

# Next Step

s

- [System Architecture](/architecture/system-architecture

)

 - Understand the platfor

m

- [Production Deployment](/deployment/production-deployment

)

 - Deploy to productio

n
