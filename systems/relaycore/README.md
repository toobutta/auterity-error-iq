# RelayCore - AI Routing Hub

RelayCore serves as the central AI request routing system for the three-system platform.

## Architecture

- **HTTP Proxy Server**: Express.js with TypeScript
- **Provider Management**: OpenAI, Anthropic, Claude integrations
- **Cost Optimization**: Intelligent model selection based on budget constraints
- **Steering Rules**: YAML-based routing configuration

## Key Features

- Request/response logging and metrics
- Cost-aware model selection
- Fallback mechanisms
- Performance monitoring
- Integration with NeuroWeaver specialized models

## Development Setup

```bash
cd systems/relaycore
npm install
npm run dev
```

## API Endpoints

- `POST /api/v1/chat` - Route AI chat requests
- `GET /api/v1/models` - List available models
- `GET /api/v1/metrics` - Usage and cost metrics
- `POST /api/v1/steering` - Update routing rules
