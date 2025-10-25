# Frontend AI Integration Templates

*Pre-development templates for Week 2: Unified AI Service Integration*

## Overview

This directory contains reusable React components and hooks for integrating with the Unified AI Service. These templates provide a consistent interface for AI service interactions across the application.

## File Structure

```
frontend/src/components/templates/ai-integration/
├── README.md                    # This documentation
├── types.ts                     # TypeScript interfaces and types
├── useUnifiedAIService.ts       # Custom hook for AI service integration
├── RoutingPolicySelector.tsx    # Policy selection component
├── AIServiceWrapper.tsx         # Main integration wrapper component
└── index.ts                     # Export file
```

## Core Components

### 1. Types and Interfaces (`types.ts`)

Comprehensive TypeScript definitions for AI service integration:

```typescript
// Core request/response types
interface AIServiceRequest {
  prompt?: string;
  messages?: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface AIServiceResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage: TokenUsage;
  metadata: ResponseMetadata;
}

// Configuration types
interface UnifiedAIServiceConfig {
  defaultProvider?: string;
  enableRouting?: boolean;
  enableCostOptimization?: boolean;
  enableCaching?: boolean;
  fallbackEnabled?: boolean;
  monitoringEnabled?: boolean;
}

// Routing policy types
interface RoutingPolicy {
  id: string;
  name: string;
  conditions: RoutingCondition;
  actions: RoutingAction;
  status: 'active' | 'inactive' | 'draft';
}
```

### 2. Unified AI Service Hook (`useUnifiedAIService.ts`)

Custom React hook for AI service interactions:

```typescript
const { execute, isLoading, error, lastResponse } = useUnifiedAIService({
  defaultProvider: 'gpt-4',
  enableRouting: true,
  enableCostOptimization: true
});

// Execute AI request
const response = await execute({
  prompt: "Analyze this data...",
  model: "gpt-4",
  temperature: 0.7
});
```

**Features:**
- ✅ Automatic routing based on policies
- ✅ Cost optimization and caching
- ✅ Retry logic with exponential backoff
- ✅ Streaming support
- ✅ Error handling and recovery

### 3. Routing Policy Selector (`RoutingPolicySelector.tsx`)

Component for selecting and managing routing policies:

```typescript
<RoutingPolicySelector
  selectedPolicyId="enterprise-high-priority"
  onPolicyChange={(policyId) => console.log('Selected:', policyId)}
  showAnalytics={true}
  compact={false}
/>
```

**Features:**
- ✅ Policy selection dropdown
- ✅ Real-time provider status
- ✅ Performance analytics display
- ✅ Compact and full modes
- ✅ Policy configuration preview

### 4. AI Service Wrapper (`AIServiceWrapper.tsx`)

Main integration component that combines all functionality:

```typescript
<AIServiceProvider initialConfig={{ enableRouting: true }}>
  <AIServiceWrapper
    title="AI Content Generator"
    showRoutingSelector={true}
    showAnalytics={true}
    onResponse={(response) => console.log('Response:', response)}
  >
    {/* Custom content */}
    <Button onClick={() => execute({ prompt: "Generate content" })}>
      Generate
    </Button>
  </AIServiceWrapper>
</AIServiceProvider>
```

**Features:**
- ✅ Context-based configuration sharing
- ✅ Integrated routing policy management
- ✅ Analytics and cost tracking
- ✅ Error handling and loading states
- ✅ Customizable layouts (compact/full)

## Usage Patterns

### Basic AI Service Integration

```typescript
import { useUnifiedAIService } from './templates/ai-integration';

function MyComponent() {
  const aiService = useUnifiedAIService();

  const handleGenerate = async () => {
    try {
      const response = await aiService.execute({
        prompt: "Generate a summary...",
        model: "gpt-4"
      });
      console.log('Generated:', response.content);
    } catch (error) {
      console.error('AI Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={aiService.isLoading}>
        {aiService.isLoading ? 'Generating...' : 'Generate'}
      </button>
      {aiService.error && <div className="error">{aiService.error}</div>}
    </div>
  );
}
```

### Advanced Integration with Routing

```typescript
import AIServiceWrapper, { AIServiceProvider } from './templates/ai-integration';

function AdvancedAIComponent() {
  return (
    <AIServiceProvider initialConfig={{
      enableRouting: true,
      enableCostOptimization: true,
      defaultProvider: 'gpt-4'
    }}>
      <AIServiceWrapper
        title="Smart AI Assistant"
        showRoutingSelector={true}
        showAnalytics={true}
        onResponse={(response) => {
          // Handle successful response
          trackAnalytics(response);
        }}
        onError={(error) => {
          // Handle errors
          logError(error);
        }}
      >
        {({ execute, isLoading }) => (
          <div className="ai-interface">
            <textarea placeholder="Enter your prompt..." />
            <button
              onClick={() => execute({ prompt: "Analyze..." })}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          </div>
        )}
      </AIServiceWrapper>
    </AIServiceProvider>
  );
}
```

### Policy-Based Routing

```typescript
import { RoutingPolicySelector } from './templates/ai-integration';

function PolicyManagedComponent() {
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');

  return (
    <div>
      <RoutingPolicySelector
        selectedPolicyId={selectedPolicy}
        onPolicyChange={setSelectedPolicy}
        showAnalytics={true}
      />

      <div className="current-policy">
        <h3>Active Policy: {selectedPolicy}</h3>
        {/* Display policy details and performance metrics */}
      </div>
    </div>
  );
}
```

## Configuration Options

### UnifiedAIServiceConfig

```typescript
interface UnifiedAIServiceConfig {
  // Provider settings
  defaultProvider?: string;          // Default AI provider
  enableRouting?: boolean;           // Enable intelligent routing
  enableCostOptimization?: boolean;  // Optimize for cost
  enableCaching?: boolean;          // Cache responses

  // Reliability settings
  fallbackEnabled?: boolean;         // Enable fallback providers
  monitoringEnabled?: boolean;       // Enable usage monitoring

  // Advanced settings
  cache?: AICacheConfig;            // Caching configuration
  monitoring?: AIMonitoringConfig;   // Monitoring configuration
  fallback?: AIFallbackConfig;       // Fallback configuration
}
```

### Component Props

```typescript
interface AIServiceWrapperProps {
  config?: UnifiedAIServiceConfig;
  title?: string;
  description?: string;
  showRoutingSelector?: boolean;
  showAnalytics?: boolean;
  showCostTracking?: boolean;
  compact?: boolean;
  onResponse?: (response: AIServiceResponse) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode | Function;
}
```

## Integration Guidelines

### 1. Error Handling

Always wrap AI service calls in try-catch blocks:

```typescript
try {
  const response = await aiService.execute(request);
  // Handle success
} catch (error) {
  if (error.code === 'AI_SERVICE_ERROR') {
    // Handle AI-specific errors
  } else {
    // Handle general errors
  }
}
```

### 2. Loading States

Use the provided loading states for better UX:

```typescript
if (aiService.isLoading) {
  return <LoadingSpinner />;
}
```

### 3. Configuration Management

Use the context provider for shared configuration:

```typescript
<AIServiceProvider initialConfig={myConfig}>
  {/* Components that need AI service access */}
</AIServiceProvider>
```

### 4. Performance Monitoring

Enable monitoring for production deployments:

```typescript
const config = {
  monitoringEnabled: process.env.NODE_ENV === 'production',
  enableCostOptimization: true,
  enableCaching: true
};
```

## Testing Strategy

### Mock Implementation
All templates include mock implementations for testing:

```typescript
// Test with mock data
const mockResponse = {
  id: 'test-123',
  content: 'Mock response',
  model: 'gpt-4',
  provider: 'openai',
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, cost: 0.001 },
  metadata: { responseTime: 1000, providerUsed: 'mock' }
};
```

### Integration Testing
Test templates with real AI services in staging:

```typescript
// Test routing policies
describe('RoutingPolicySelector', () => {
  it('should select appropriate policy based on conditions', async () => {
    // Test policy selection logic
  });
});
```

## Migration from Legacy Components

### Before (Legacy)
```typescript
// Direct API calls
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello' })
});
```

### After (Templates)
```typescript
// Using templates
const aiService = useUnifiedAIService();
const response = await aiService.execute({ prompt: 'Hello' });
```

## Future Extensions

### Planned Enhancements
- [ ] Real-time streaming with WebSockets
- [ ] Advanced caching strategies (Redis, localStorage)
- [ ] Batch processing capabilities
- [ ] Custom provider integrations
- [ ] Advanced analytics dashboards
- [ ] Multi-tenant policy isolation

### Custom Hooks
- [ ] `useAIServiceWithRetry` - Enhanced retry logic
- [ ] `useAIServiceWithCache` - Advanced caching
- [ ] `useStreamingAIService` - Real-time streaming
- [ ] `useAIServiceAnalytics` - Usage analytics

---

*These templates provide a solid foundation for Week 2's Unified AI Service Integration implementation. All components are designed to be production-ready and easily extensible.*
