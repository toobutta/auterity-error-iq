# Three-System Integration Layer

A robust integration service that connects Auterity, RelayCore, and NeuroWeaver systems with unified authentication, cross-system caching, and comprehensive monitoring.

## 🚀 Features

- **Unified Authentication**: Single sign-on across all three systems
- **Cross-System Messaging**: RabbitMQ-based message bus for inter-system communication
- **Distributed Caching**: Redis-backed cache with local fallback
- **Health Monitoring**: Real-time system health checks and alerting
- **Comprehensive Logging**: Structured logging with correlation IDs
- **Security**: JWT-based authentication with role-based access control

## 📋 Prerequisites

- Node.js 18+
- Redis server
- RabbitMQ server
- TypeScript

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env

# Build the project
npm run build

# Start in development mode
npm run dev

# Start in production mode
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable                | Description                | Default                  |
| ----------------------- | -------------------------- | ------------------------ |
| `NODE_ENV`              | Environment mode           | `development`            |
| `INTEGRATION_PORT`      | Server port                | `3002`                   |
| `JWT_SECRET`            | JWT signing secret         | Required                 |
| `REDIS_URL`             | Redis connection URL       | `redis://localhost:6379` |
| `RABBITMQ_URL`          | RabbitMQ connection URL    | `amqp://localhost:5672`  |
| `HEALTH_CHECK_INTERVAL` | Health check interval (ms) | `30000`                  |

## 📡 API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

### System Status

- `GET /api/v1/integration/status` - All system status
- `GET /api/v1/metrics` - System metrics
- `GET /api/v1/metrics/system` - Detailed system metrics

### Cross-System Operations

- `POST /api/v1/integration/message` - Send cross-system message
- `GET /api/v1/integration/cache/:key` - Get cached value
- `POST /api/v1/integration/cache/:key` - Set cached value

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Auterity     │    │   RelayCore     │    │  NeuroWeaver    │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 3003)   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │  Integration Layer        │
                    │     (Port 3002)          │
                    │                          │
                    │  ┌─────────────────────┐ │
                    │  │  Unified Auth       │ │
                    │  │  Message Bus        │ │
                    │  │  Cross-System Cache │ │
                    │  │  Health Monitor     │ │
                    │  └─────────────────────┘ │
                    └──────────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Infrastructure        │
                    │                          │
                    │  Redis     RabbitMQ      │
                    │ (Cache)   (Messages)     │
                    └──────────────────────────┘
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- System-to-system authentication
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization

## 📊 Monitoring & Observability

### Health Monitoring

- Automatic health checks for all connected systems
- Configurable alert rules with multiple severity levels
- Real-time status dashboard
- Performance metrics collection

### Logging

- Structured JSON logging
- Correlation ID tracking across systems
- Log levels: DEBUG, INFO, WARN, ERROR
- Integration with external log aggregation systems

### Metrics

- System performance metrics
- Cache hit/miss ratios
- Message bus throughput
- Authentication success/failure rates

## 🚨 Error Handling

- Graceful degradation when external systems are unavailable
- Automatic retry mechanisms with exponential backoff
- Circuit breaker pattern for external service calls
- Comprehensive error logging and alerting

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📈 Performance Optimization

- Local caching with Redis fallback
- Connection pooling for database connections
- Efficient message routing and filtering
- Lazy loading of non-critical components
- Memory usage monitoring and optimization

## 🔄 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker-compose up -d
```

## 🛡️ Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **JWT Secrets**: Use strong, randomly generated secrets
3. **Rate Limiting**: Configure appropriate limits for your use case
4. **CORS**: Restrict origins to trusted domains only
5. **Input Validation**: Validate all incoming data
6. **Logging**: Avoid logging sensitive information

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**: Check if Redis/RabbitMQ services are running
2. **Authentication Failures**: Verify JWT secrets are correctly configured
3. **High Memory Usage**: Check cache size limits and cleanup policies
4. **Message Delivery Issues**: Verify RabbitMQ queue configurations

### Debug Mode

```bash
DEBUG=* npm run dev
```

## 📚 API Documentation

Full API documentation is available at `/docs` when running in development mode.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
