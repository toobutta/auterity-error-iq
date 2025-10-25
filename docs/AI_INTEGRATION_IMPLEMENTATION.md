# AI Integration Implementation Guide

## Overview

This document details the comprehensive AI integration system implemented across the Auterity Error IQ platform, including local model hosting, cloud AI services, and unified model management.

## Architecture Components

### 1. Model Configuration System (`services/api/src/config/models.yaml`)

The centralized model configuration file contains comprehensive definitions for all supported AI services:

#### Supported Providers
- **OpenAI** - GPT-4, GPT-3.5-turbo, GPT-4-turbo
- **Anthropic** - Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **Google** - Gemini Pro, Gemini Ultra
- **Novita AI** - 200+ models including Llama 2, Mistral, Stable Diffusion
- **vLLM** - High-throughput local inference server
- **Hugging Face** - Open-source model hub integration
- **Ollama** - Local model deployment and management
- **Together AI** - Distributed inference platform

#### Model Configuration Schema
```yaml
models:
  - name: "model-name"
    provider: "provider-name"
    model_family: "text|vision|multimodal"
    max_tokens: 4096
    cost_per_token: 0.00001
    input_cost_per_token: 0.00001
    output_cost_per_token: 0.00002
    capabilities:
      - "text-generation"
      - "function-calling"
    context_window: 32768
    supports_streaming: true
    supports_function_calling: true
    is_available: true
    description: "Model description"
    endpoint: "optional-custom-endpoint"
```

### 2. Centralized Model Configuration Service (`src/services/modelConfigService.ts`)

Provides unified access to model configurations across the application:

#### Key Features
- **Dynamic Model Loading** - Loads models from YAML configuration
- **Health Monitoring** - Tracks model availability and performance
- **Cost Optimization** - Provides cost comparison and routing
- **Type Safety** - Full TypeScript definitions for all models

#### Usage Example
```typescript
import { modelConfigurationService } from './services/modelConfigService';

// Get all available models
const models = await modelConfigurationService.getAvailableModels();

// Get models by provider
const openaiModels = await modelConfigurationService.getModelsByProvider('openai');

// Get model health status
const healthStatus = await modelConfigurationService.checkModelHealth('gpt-4');
```

### 3. Unified AI Node (`frontend/src/components/workflow-builder/nodes/UnifiedAINode.tsx`)

The workflow builder component that integrates all AI services:

#### Features
- **Dynamic Model Selection** - Loads models from centralized configuration
- **Intelligent Routing** - Automatic provider selection based on cost/performance
- **Real-time Monitoring** - Live performance metrics and cost tracking
- **Error Handling** - Comprehensive error recovery and fallback mechanisms

#### Integration Points
- Connects to `models.yaml` for model definitions
- Uses `modelConfigService` for configuration management
- Integrates with workflow studio for drag-and-drop functionality

### 4. Workflow Studio Integration (`apps/workflow-studio/src/components/ai/UnifiedAIMarketplace.tsx`)

The drag-and-drop interface for AI model selection and orchestration:

#### Marketplace Features
- **Visual Model Selection** - Browse and select models by capability
- **Cost Comparison** - Real-time pricing and performance metrics
- **Usage Analytics** - Track model usage and costs
- **Provider Management** - Configure multiple AI providers

### 5. Backend API Integration (`services/api/src/app/api/models.py`)

RESTful API endpoints for model management:

#### Endpoints
- `GET /api/models/available` - List all available models
- `GET /api/models/usage` - Get usage statistics and costs
- `GET /api/models/health/{model_name}` - Individual model health
- `GET /api/models/health` - All models health status
- `POST /api/models/validate/{model_name}` - Validate specific model
- `GET /api/models/validate` - Validate all models

#### Integration with Main App
```python
# In services/api/src/app/main.py
from app.api import models
app.include_router(models.router)
```

## Local Model Hosting Integration

### vLLM Service (`systems/vllm/`)

High-throughput inference server for local model deployment:

#### Key Features
- **GPU Acceleration** - Optimized for NVIDIA GPUs
- **Auto-scaling** - Dynamic resource allocation
- **Streaming Support** - Real-time response streaming
- **Monitoring** - Comprehensive performance metrics

#### Deployment Configuration
```yaml
# infrastructure/docker/vllm/docker-compose.yml
services:
  vllm:
    image: vllm/vllm-openai:latest
    environment:
      - MODEL_NAME=meta-llama/Llama-2-7b-chat-hf
      - GPU_MEMORY_UTILIZATION=0.9
    ports:
      - "8000:8000"
```

### NeuroWeaver ML Platform (`systems/neuroweaver/`)

Complete ML model management platform:

#### Components
- **Model Training** - Distributed training pipelines
- **Model Registry** - Version control and artifact management
- **Performance Monitoring** - Real-time metrics and alerts
- **API Gateway** - Unified access to all models

### Ollama Integration

Local model deployment and management:

#### Supported Models
- Llama 2 variants (7B, 13B, 70B)
- Mistral 7B
- Code Llama
- Vicuna models

#### Integration Points
- Auto-installation and setup
- REST API compatibility
- Health monitoring and failover

## Cloud AI Service Integration

### Novita AI (`apps/workflow-studio/src/services/enterprise/NovitaAIService.ts`)

Comprehensive AI service provider integration:

#### Features
- **200+ Models** - Extensive model library
- **GPU Infrastructure** - A100, RTX 4090, RTX 6000 support
- **Global Distribution** - Worldwide deployment
- **Cost Optimization** - Competitive pricing

### Hugging Face Integration

Open-source model hub integration:

#### Key Features
- **Model Hub Access** - Direct integration with Hugging Face Hub
- **Local Inference** - Run models locally with transformers
- **Custom Models** - Support for fine-tuned and custom models

## Model Validation and Health Monitoring

### Validation System

The comprehensive validation system ensures all AI models are properly configured and performing optimally:

#### Configuration Validation
- **Required Fields** - Validates presence of essential model properties
- **Cost Configuration** - Verifies pricing information is accurate
- **Context Window** - Ensures proper token limits are set
- **Endpoint Validation** - Checks local model endpoints are accessible

#### Performance Validation
- **Response Time Measurement** - Tracks latency across all models
- **Throughput Analysis** - Monitors requests per second
- **Memory Usage** - Tracks resource consumption
- **Error Rate Monitoring** - Identifies failing models

#### Cost Analysis
- **Per-Token Pricing** - Validates input/output cost structures
- **Monthly Projections** - Estimates costs based on usage patterns
- **Optimization Recommendations** - Suggests cost-effective alternatives

### Health Monitoring System

Real-time health monitoring ensures model reliability:

#### Health Check Features
- **30-Second Intervals** - Continuous monitoring of all models
- **Provider-Specific Checks** - Tailored health checks for each provider
- **Automatic Failover** - Graceful degradation when models fail
- **Performance Metrics** - Real-time latency and throughput tracking

#### Health Status Types
- **Healthy** - Model responding normally
- **Degraded** - Model slow but functional
- **Unhealthy** - Model failing or unreachable
- **Unknown** - Model status cannot be determined

### Validation Dashboard

The `ModelValidationDashboard` component provides comprehensive monitoring:

#### Dashboard Features
- **Real-time Metrics** - Live health and performance data
- **Configuration Validation** - Detailed error and warning reports
- **Cost Analysis** - Monthly cost projections and optimization
- **Performance Charts** - Visual representation of model metrics

#### Key Metrics Tracked
- Model availability percentage
- Average response times
- Total requests processed
- Cost per request
- Error rates and uptime

### API Endpoints

#### Health Monitoring
```
GET /api/models/health/{model_name}    # Individual model health
GET /api/models/health                 # All models health status
```

#### Validation
```
POST /api/models/validate/{model_name}  # Validate specific model
GET /api/models/validate               # Validate all models
```

### Integration with Workflow Studio

The validation system integrates seamlessly with the drag-and-drop workflow builder:

- **Model Selection** - Only shows healthy, validated models
- **Real-time Updates** - Live health status in model picker
- **Error Prevention** - Warns about misconfigured models
- **Performance Optimization** - Suggests best models for tasks

## Workflow Studio Drag-and-Drop Integration

### Unified AI Marketplace

The drag-and-drop interface provides:

1. **Model Discovery** - Browse available models by category
2. **Configuration Management** - Set model parameters and preferences
3. **Workflow Integration** - Connect models to workflow nodes
4. **Performance Monitoring** - Real-time metrics and analytics

### Node Configuration

Each AI node in the workflow supports:
- **Model Selection** - Choose from available models
- **Parameter Tuning** - Adjust temperature, max tokens, etc.
- **Routing Rules** - Define fallback and routing logic
- **Cost Tracking** - Monitor usage and costs

## Security and Compliance

### Authentication
- **API Key Management** - Secure storage and rotation
- **Provider Authentication** - Individual provider credentials
- **Token Validation** - Request validation and rate limiting

### Compliance
- **Data Privacy** - GDPR and CCPA compliance
- **Audit Logging** - Comprehensive request/response logging
- **Access Control** - Role-based model access

## Monitoring and Analytics

### Performance Monitoring
- **Response Times** - Track latency and throughput
- **Error Rates** - Monitor failure rates and recovery
- **Cost Analysis** - Usage and cost optimization insights

### Health Checks
- **Model Availability** - Real-time health status
- **Provider Status** - Monitor service availability
- **Resource Utilization** - Track GPU and CPU usage

## Deployment and Configuration

### Environment Setup
1. **Local Development** - Docker Compose for local testing
2. **Cloud Deployment** - Kubernetes manifests for production
3. **Model Serving** - GPU-enabled infrastructure

### Configuration Files
- `models.yaml` - Model definitions and costs
- `docker-compose.yml` - Local deployment configuration
- `infrastructure/` - Production deployment manifests

## API Integration Examples

### Frontend Integration
```typescript
import { useUnifiedAIService } from './hooks/useUnifiedAIService';

const MyComponent = () => {
  const aiService = useUnifiedAIService({
    defaultProvider: 'gpt-4',
    enableRouting: true,
    enableCostOptimization: true
  });

  const handleRequest = async (prompt: string) => {
    const response = await aiService.processRequest({
      prompt,
      model: 'gpt-4',
      temperature: 0.7
    });
    return response;
  };
};
```

### Backend Integration
```python
from app.services.ai_model_orchestration_service import AIModelOrchestrationService

class MyService:
    def __init__(self):
        self.ai_service = AIModelOrchestrationService()

    async def process_ai_request(self, request_data):
        response = await self.ai_service.process_request(
            model_name=request_data.get('model', 'gpt-4'),
            prompt=request_data['prompt'],
            parameters=request_data.get('parameters', {})
        )
        return response
```

## Future Enhancements

### Planned Features
- **Model Auto-tuning** - Automatic parameter optimization
- **Federated Learning** - Distributed model training
- **Edge Deployment** - On-device model inference
- **Multi-modal Support** - Enhanced vision and audio capabilities

### Performance Optimizations
- **Model Caching** - Intelligent model loading and caching
- **Request Batching** - Batch processing for efficiency
- **Load Balancing** - Advanced load distribution

## Troubleshooting

### Common Issues
1. **Model Loading Errors** - Check model availability and API keys
2. **Performance Issues** - Monitor resource utilization
3. **Cost Overruns** - Review usage patterns and routing rules

### Support Resources
- **Documentation** - This implementation guide
- **API Reference** - Model service API documentation
- **Monitoring Dashboard** - Real-time system metrics

---

*Last Updated: [Current Date]*
*Version: 1.0.0*
