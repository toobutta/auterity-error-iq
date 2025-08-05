# RelayCore: AI Integration Gateway

RelayCore is a developer-first, universal HTTP relay service that connects any external tool (IDEs, CLIs, agent orchestrators) to AI model endpoints. It enables smart routing, cost optimization, context injection, and plug-and-play agent interoperability.

![RelayCore Architecture](https://via.placeholder.com/800x400?text=RelayCore+Architecture)

## Key Features

- **AI Request Router**: Intelligently route requests to the most appropriate AI model based on cost, performance, and capability requirements
- **Semantic Input Deduplication**: Identify and merge duplicate or semantically similar requests
- **Configurable Agent Profiles**: Create and manage profiles for different use cases and requirements
- **Advanced Caching System**: Multi-level caching with semantic similarity matching
- **Token & Cost Tracking**: Comprehensive analytics on usage and costs
- **Plugin Ecosystem**: Extensible architecture with plugins for VS Code, Claude CLI, LangChain, and more

## Why RelayCore?

- **Reduce AI API Costs**: Save up to 50% on API costs through intelligent caching, batching, and optimization
- **Unified Interface**: One API to connect all your AI tools and models
- **Developer Experience**: Seamless integration with your favorite IDEs and tools
- **Cost Visibility**: Comprehensive analytics and monitoring of AI usage and costs
- **Extensibility**: Plugin system for adding new integrations and capabilities

## Getting Started

### Prerequisites

- Node.js 18+ or Python 3.9+
- Redis (optional, for distributed caching)
- PostgreSQL (optional, for analytics)

### Installation

#### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/ninjatech/relaycore.git
cd relaycore

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start with Docker Compose
docker-compose up -d
```

#### Manual Installation

```bash
# Clone the repository
git clone https://github.com/ninjatech/relaycore.git
cd relaycore

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Start the server
npm start
```

### Configuration

RelayCore is configured using a YAML configuration file. See [examples/relaycore.config.yaml](examples/relaycore.config.yaml) for a complete example.

```yaml
# Basic configuration example
server:
  port: 3000
  host: "0.0.0.0"

providers:
  openai:
    enabled: true
    apiKey: "${OPENAI_API_KEY}"
    baseUrl: "https://api.openai.com"
  
  anthropic:
    enabled: true
    apiKey: "${ANTHROPIC_API_KEY}"
    baseUrl: "https://api.anthropic.com"
```

## Usage Examples

### Basic Request

```bash
curl -X POST "http://localhost:3000/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

### Request with Caching and Optimization

```bash
curl -X POST "http://localhost:3000/v1/openai/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -H "X-AIHub-Cache: use" \
  -H "X-AIHub-Optimize: moderate" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ],
    "temperature": 0.7,
    "max_tokens": 150
  }'
```

See [examples/client-examples.md](examples/client-examples.md) for more usage examples.

## Documentation

- [Architecture Overview](docs/architecture-overview.md)
- [Optimization Strategies](docs/optimization-strategies.md)
- [HTTP Proxy Specification](docs/http-proxy-specification.md)
- [Product Specification](docs/product-specification.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Client Examples](examples/client-examples.md)
- [Configuration Example](examples/relaycore.config.yaml)

## Plugins

RelayCore supports a variety of plugins for integration with different tools and frameworks:

- **VS Code Extension**: Seamless integration with VS Code
- **Claude CLI Plugin**: Integration with Anthropic's Claude CLI
- **LangChain Integration**: Use RelayCore with LangChain
- **LangGraph Node**: Custom node for LangGraph workflows
- **TaskWeaver Plugin**: Integration with Microsoft's TaskWeaver

## Dashboard

RelayCore includes a web dashboard for monitoring usage, costs, and configuration:

![RelayCore Dashboard](https://via.placeholder.com/800x400?text=RelayCore+Dashboard)

Features include:
- Request logs and history
- Cost analytics and visualization
- Configuration management
- User and team management
- Plugin management

## Deployment Options

- **Local**: Run locally on developer machine
- **Self-hosted (Docker)**: Deploy using Docker containers
- **Cloud**: Secured with token or SSO
- **Embedded**: Integrated directly into IDE plugins

## Pricing

- **Free Tier**: $0/month - 100 requests/day, local cache only
- **Pro Tier**: $10/month - Team quota tools, Redis integration, dashboard access
- **Enterprise Tier**: Custom pricing - SSO, SLA, organization-level usage analytics
- **Open Source**: MIT license - CLI + relay server template for developer use

## Contributing

We welcome contributions to RelayCore! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

RelayCore is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.relaycore.ai](https://docs.relaycore.ai)
- **GitHub Issues**: [github.com/ninjatech/relaycore/issues](https://github.com/ninjatech/relaycore/issues)
- **Discord**: [discord.gg/relaycore](https://discord.gg/relaycore)
- **Email**: support@relaycore.ai

## Roadmap

See our [public roadmap](https://github.com/ninjatech/relaycore/projects/1) for upcoming features and improvements.

## Acknowledgements

RelayCore is built with the following open-source technologies:
- Node.js
- Express.js
- Redis
- PostgreSQL
- React
- TypeScript
- And many more!

We thank the open-source community for their invaluable contributions.