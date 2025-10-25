

# RelayCore

 - AI Routing H

u

b

RelayCore serves as the central AI request routing system for the three-system platform

.

#

# Architectur

e

- **HTTP Proxy Server**: Express.js with TypeScrip

t

- **Provider Management**: OpenAI, Anthropic, Claude integration

s

- **Cost Optimization**: Intelligent model selection based on budget constraint

s

- **Steering Rules**: YAML-based routing configuratio

n

#

# Key Feature

s

- Request/response logging and metric

s

- Cost-aware model selectio

n

- Fallback mechanism

s

- Performance monitorin

g

- Integration with NeuroWeaver specialized model

s

#

# Development Setu

p

```bash
cd systems/relaycore
npm install
npm run dev

```

#

# API Endpoint

s

- `POST /api/v1/chat

`

 - Route AI chat request

s

- `GET /api/v1/models

`

 - List available model

s

- `GET /api/v1/metrics

`

 - Usage and cost metric

s

- `POST /api/v1/steering

`

 - Update routing rule

s
