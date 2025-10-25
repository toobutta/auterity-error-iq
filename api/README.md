

# Auterity Analytics AP

I

A high-performance, secure API for Auterity's analytics stack, integrating ClickHouse and Kafka for real-time data processing and analytics

.

#

# 🚀 Feature

s

- **Real-time Analytics**: ClickHouse integration for fast OLAP querie

s

- **Data Ingestion**: Kafka producer/consumer for streaming dat

a

- **Security**: JWT authentication with role-based access contro

l

- **Performance**: Caching, connection pooling, and rate limitin

g

- **Monitoring**: Prometheus metrics and health check

s

- **Scalability**: Docker-based infrastructure with resource limit

s

#

# 📋 Prerequisite

s

- Node.js 1

6

+ - Docker and Docker Compos

e

- Gi

t

#

# 🛠️ Installatio

n

1. **Clone the repository**

:



```bash
   git clone https://github.com/toobutta/auterity-error-iq.git

   cd auterity-error-iq



```

2. **Start infrastructure**

:



```

bash
   cd infrastructure
   docker-compose up -d



```

3. **Install API dependencies**

:



```

bash
   cd ../api
   npm install --legacy-peer-deps



```

4. **Configure environment**

:



```

bash
   cp .env.example .env


# Edit .env with your configuration



```

5. **Run linting and tests**

:



```

bash
   npm run lint
   npm test


```

6. **Start the API**

:



```

bash
   npm start


```

#

# 📖 API Documentatio

n

#

## Authenticatio

n

All protected endpoints require JWT authentication. Include the token in the Authorization header:

```

Authorization: Bearer <your-jwt-token

>

```

#

### Login

```

http
POST /login
Content-Type: application/jso

n

{
  "username": "admin",
  "password": "password"
}

```

Response:

```

json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

}

```

#

## ClickHouse Endpoint

s

#

### Query ClickHouse

```

http
GET /api/clickhouse/query?sql=SELECT%201
Authorization: Bearer <token>

```

Response:

```

json
{
  "data": [...],
  "cached": false
}

```

#

### Clear Cache

```

http
POST /api/clickhouse/clear-cache

Authorization: Bearer <token>

```

#

## Kafka Endpoint

s

#

### Produce Message

```

http
POST /api/kafka/produce
Authorization: Bearer <token>
Content-Type: application/jso

n

{
  "topic": "analytics-data",

  "message": {
    "event": "user_action",
    "timestamp": "2025-09-02T16:00:00Z",

    "data": {...}
  }
}

```

#

## Monitoring Endpoint

s

#

### Health Check

```

http
GET /health

```

Response:

```

json
{
  "status": "API is running"
}

```

#

### Prometheus Metrics

```

http
GET /metrics

```

#

# 🔧 Configuratio

n

#

## Environment Variable

s

| Variable | Description | Default |
|----------|-------------|---------|

| `PORT` | API server port | `3000` |
| `JWT_SECRET` | JWT signing secret | Required |
| `CLICKHOUSE_URL` | ClickHouse server URL | `http://localhost` |
| `CLICKHOUSE_PORT` | ClickHouse port | `8123` |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:9092` |
| `PROMETHEUS_PORT` | Prometheus metrics port | `9090` |

#

## Docker Resource Limit

s

The infrastructure is configured with optimized resource limits:

- **ClickHouse**: 8GB RAM, 2 CPU

s

- **Kafka**: 2GB RAM, 1 CP

U

- **Zookeeper**: 512MB RAM, 0.5 C

P

U

- **Superset**: 2GB RAM, 1 CP

U

#

# 🚀 Deploymen

t

#

## Automated Deployment

```

bash
./deploy-api.s

h

```

#

## Manual Deployment

1. Start infrastructur

e

2. Install dependencie

s

3. Configure environmen

t

4. Run test

s

5. Start AP

I

#

# 📊 Performance Optimization

s

- **Caching**: 5-minute TTL cache for ClickHouse querie

s

- **Connection Pooling**: Up to 10 concurrent ClickHouse connection

s

- **Rate Limiting**: 100 requests per 15 minutes per I

P

- **Compression**: Gzip enabled for response

s

- **Resource Limits**: Docker containers with CPU/memory constraint

s

#

# 🔒 Security Feature

s

- JWT-based authenticatio

n

- Role-based access control (admin/user

)

- Rate limiting to prevent abus

e

- Input validation and sanitizatio

n

- Environment-based configuratio

n

- No hardcoded secret

s

#

# 📈 Monitorin

g

#

## Metrics

- HTTP request duration histogram

s

- Request count by method/route/statu

s

- Cache hit/miss ratio

s

- Connection pool usag

e

#

## Health Checks

- API availabilit

y

- Database connectivit

y

- Kafka broker statu

s

#

# 🧪 Testin

g

```

bash

# Run all tests

npm test

# Run with coverage

npm test -

- --coverag

e

# Run linting

npm run lint

```

#

# 📝 Developmen

t

#

## Project Structure

```

api/
├── app.js

# Main application

├── routes/
│   ├── clickhouse.js

# ClickHouse endpoints

│   └── kafka.js

# Kafka endpoints

├── middleware/
│   ├── auth.js

# Authentication middleware

│   └── metrics.js

# Monitoring middleware

├── tests/
│   └── api.test.js

# API tests

├── .env.example

# Environment template

├── .eslintrc.json

# Linting configuration

└── package.json

# Dependencies

```

#

## Adding New Endpoints

1. Create route file in `routes/

`

2. Import and use in `app.js

`

3. Add authentication if neede

d

4. Update test

s

5. Update documentatio

n

#

# 🤝 Contributin

g

1. Fork the repositor

y

2. Create a feature branc

h

3. Make changes with test

s

4. Run linting and test

s

5. Submit a pull reques

t

#

# 📄 Licens

e

ISC License

 - see LICENSE file for details

.

#

# 🆘 Suppor

t

For issues and questions:

- Create an issue on GitHu

b

- Check the documentatio

n

- Review the health endpoint for system statu

s
