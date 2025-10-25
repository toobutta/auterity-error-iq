// Unified AI Service Node for Workflow Builder
// Integrates the unified AI service with intelligent routing and cost optimization

import React, { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, Zap, Settings, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

import { useUnifiedAIService } from '../../templates/ai-integration';
import { AIServiceRequest, AIServiceResponse } from '../../templates/ai-integration';

// Model configuration types
interface ModelConfig {
  name: string;
  provider: string;
  model_family: string;
  max_tokens: number;
  cost_per_token: number;
  input_cost_per_token: number;
  output_cost_per_token: number;
  capabilities: string[];
  context_window: number;
  supports_streaming: boolean;
  supports_function_calling: boolean;
  is_available: boolean;
  description: string;
  endpoint?: string;
}

// Model configuration service
class ModelConfigService {
  private static instance: ModelConfigService;
  private models: ModelConfig[] = [];
  private isLoaded = false;

  static getInstance(): ModelConfigService {
    if (!ModelConfigService.instance) {
      ModelConfigService.instance = new ModelConfigService();
    }
    return ModelConfigService.instance;
  }

  async loadModels(): Promise<ModelConfig[]> {
    if (this.isLoaded) {
      return this.models;
    }

    try {
      // In production, this would fetch from the API
      // For now, using mock data that mirrors the models.yaml structure
      this.models = await this.fetchModelsFromAPI();
      this.isLoaded = true;
      return this.models;
    } catch (error) {
      console.error('Failed to load models:', error);
      // Fallback to hardcoded models if API fails
      return this.getFallbackModels();
    }
  }

  private async fetchModelsFromAPI(): Promise<ModelConfig[]> {
    try {
      const response = await fetch('/api/models/config');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      throw error;
    }
  }

  private getFallbackModels(): ModelConfig[] {
    return [
      // OpenAI models
      {
        name: 'gpt-4o',
        provider: 'openai',
        model_family: 'gpt-4',
        max_tokens: 128000,
        cost_per_token: 0.000005,
        input_cost_per_token: 0.000005,
        output_cost_per_token: 0.000015,
        capabilities: ['text', 'chat', 'function_calling', 'reasoning', 'vision', 'multimodal'],
        context_window: 128000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Most advanced GPT-4 model with vision capabilities'
      },
      {
        name: 'gpt-4o-mini',
        provider: 'openai',
        model_family: 'gpt-4',
        max_tokens: 128000,
        cost_per_token: 0.00000015,
        input_cost_per_token: 0.00000015,
        output_cost_per_token: 0.0000006,
        capabilities: ['text', 'chat', 'function_calling', 'reasoning'],
        context_window: 128000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Cost-effective GPT-4 model for most tasks'
      },
      {
        name: 'claude-3-5-sonnet-20241022',
        provider: 'anthropic',
        model_family: 'claude-3',
        max_tokens: 200000,
        cost_per_token: 0.000003,
        input_cost_per_token: 0.000003,
        output_cost_per_token: 0.000015,
        capabilities: ['text', 'chat', 'reasoning', 'long_context', 'vision', 'multimodal'],
        context_window: 200000,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Most intelligent Claude model with vision'
      },
      // Novita AI models
      {
        name: 'novita-llama-2-70b-chat',
        provider: 'novita',
        model_family: 'llama-2',
        max_tokens: 4096,
        cost_per_token: 0.000001,
        input_cost_per_token: 0.000001,
        output_cost_per_token: 0.000002,
        capabilities: ['text', 'chat', 'function_calling'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Llama 2 70B via Novita AI cloud infrastructure'
      },
      // vLLM local models
      {
        name: 'vllm-meta-llama/Llama-2-7b-chat-hf',
        provider: 'vllm',
        model_family: 'llama-2',
        endpoint: 'http://localhost:8001',
        max_tokens: 4096,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'local'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Llama 2 7B running locally via vLLM'
      },
      // Hugging Face models
      {
        name: 'hf-microsoft/DialoGPT-medium',
        provider: 'huggingface',
        model_family: 'dialogpt',
        endpoint: 'https://api-inference.huggingface.co',
        max_tokens: 1024,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'conversational'],
        context_window: 1024,
        supports_streaming: false,
        supports_function_calling: false,
        is_available: true,
        description: 'DialoGPT for conversational AI via Hugging Face'
      },
      // Ollama models
      {
        name: 'llama2:7b',
        provider: 'ollama',
        model_family: 'llama-2',
        endpoint: 'http://localhost:11434',
        max_tokens: 4096,
        cost_per_token: 0.0,
        input_cost_per_token: 0.0,
        output_cost_per_token: 0.0,
        capabilities: ['text', 'chat', 'local'],
        context_window: 4096,
        supports_streaming: true,
        supports_function_calling: false,
        is_available: true,
        description: 'Llama 2 7B via Ollama local deployment'
      },
      // Google models
      {
        name: 'gemini-pro',
        provider: 'google',
        model_family: 'gemini',
        max_tokens: 32768,
        cost_per_token: 0.0000005,
        input_cost_per_token: 0.0000005,
        output_cost_per_token: 0.0000015,
        capabilities: ['text', 'chat', 'reasoning', 'multimodal', 'vision'],
        context_window: 32768,
        supports_streaming: true,
        supports_function_calling: true,
        is_available: true,
        description: 'Gemini Pro multimodal model from Google'
      }
    ];
  }

  getAvailableModels(): ModelConfig[] {
    return this.models.filter(model => model.is_available);
  }

  getModelsByProvider(provider: string): ModelConfig[] {
    return this.models.filter(model => model.provider === provider && model.is_available);
  }

  getModelsByCapability(capability: string): ModelConfig[] {
    return this.models.filter(model =>
      model.capabilities.includes(capability) && model.is_available
    );
  }

  getModelByName(name: string): ModelConfig | undefined {
    return this.models.find(model => model.name === name);
  }
}

// Global model config service instance
const modelConfigService = ModelConfigService.getInstance();

interface UnifiedAINodeData {
  label: string;
  description: string;
  config: {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    serviceType?: 'chat' | 'completion' | 'embedding';
    enableRouting?: boolean;
    enableCostOptimization?: boolean;
    enableCaching?: boolean;
  };
  validationErrors: string[];
}

const UnifiedAINode: React.FC<NodeProps<UnifiedAINodeData>> = ({ data, selected }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIServiceResponse | null>(null);
  const [testPrompt, setTestPrompt] = useState(data.config.prompt || '');
  const [selectedModel, setSelectedModel] = useState(data.config.model || 'gpt-4o');
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await modelConfigService.loadModels();
        setAvailableModels(models.filter(model => model.is_available));
      } catch (error) {
        console.error('Failed to load models:', error);
        // Fallback models are already loaded in the service
        const fallbackModels = await modelConfigService.getFallbackModels();
        setAvailableModels(fallbackModels);
      } finally {
        setModelsLoading(false);
      }
    };

    loadModels();
  }, []);

  // Use the unified AI service hook
  const aiService = useUnifiedAIService({
    defaultProvider: selectedModel,
    enableRouting: data.config.enableRouting ?? true,
    enableCostOptimization: data.config.enableCostOptimization ?? true,
    enableCaching: data.config.enableCaching ?? true,
    monitoringEnabled: true
  });

  // Handle AI service execution
  const handleExecute = useCallback(async () => {
    if (!testPrompt.trim()) return;

    setIsProcessing(true);
    try {
      const request: AIServiceRequest = {
        prompt: testPrompt,
        model: selectedModel,
        temperature: data.config.temperature || 0.7,
        maxTokens: data.config.maxTokens || 1000,
      };

      const response = await aiService.execute(request);
      setLastResponse(response);

      // Update node data with response
      data.config.prompt = testPrompt;

    } catch (error) {
      console.error('Unified AI execution error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [testPrompt, selectedModel, data.config, aiService]);

  // Handle configuration changes
  const handleConfigChange = useCallback((key: string, value: any) => {
    data.config[key] = value;
  }, [data.config]);

  return (
    <Card className={`w-96 ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Zap className="h-4 w-4 text-blue-600" />
          <span>{data.label}</span>
          <Badge variant="secondary" className="text-xs">
            Unified AI
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          {data.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">AI Model</Label>
          {modelsLoading ? (
            <div className="flex items-center space-x-2 h-8 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-gray-500">Loading models...</span>
            </div>
          ) : (
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {/* Group models by provider */}
                {availableModels.reduce((groups: { [key: string]: ModelConfig[] }, model) => {
                  const provider = model.provider;
                  if (!groups[provider]) {
                    groups[provider] = [];
                  }
                  groups[provider].push(model);
                  return groups;
                }, {}) && Object.entries(
                  availableModels.reduce((groups: { [key: string]: ModelConfig[] }, model) => {
                    const provider = model.provider;
                    if (!groups[provider]) {
                      groups[provider] = [];
                    }
                    groups[provider].push(model);
                    return groups;
                  }, {})
                ).map(([provider, models]) => (
                  <React.Fragment key={provider}>
                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {provider.toUpperCase()}
                    </div>
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm">{model.name}</span>
                          <div className="flex items-center space-x-1 ml-2">
                            {model.capabilities.includes('local') && (
                              <Badge variant="outline" className="text-xs px-1 py-0">Local</Badge>
                            )}
                            {model.capabilities.includes('vision') && (
                              <Badge variant="outline" className="text-xs px-1 py-0">Vision</Badge>
                            )}
                            {model.cost_per_token === 0 && (
                              <Badge variant="outline" className="text-xs px-1 py-0 text-green-600">Free</Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Model Info Display */}
          {selectedModel && availableModels.length > 0 && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {(() => {
                const model = availableModels.find(m => m.name === selectedModel);
                if (!model) return null;
                return (
                  <div>
                    <div className="font-medium">{model.description}</div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span>Context: {model.context_window.toLocaleString()}</span>
                      <span>Cost: ${(model.cost_per_token * 1000).toFixed(4)}/1K</span>
                      {model.supports_streaming && <span className="text-green-600">Streaming</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Service Configuration */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Configuration</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="routing"
                checked={data.config.enableRouting ?? true}
                onChange={(e) => handleConfigChange('enableRouting', e.target.checked)}
                className="w-3 h-3"
              />
              <Label htmlFor="routing" className="text-xs">Smart Routing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cost-opt"
                checked={data.config.enableCostOptimization ?? true}
                onChange={(e) => handleConfigChange('enableCostOptimization', e.target.checked)}
                className="w-3 h-3"
              />
              <Label htmlFor="cost-opt" className="text-xs">Cost Optimization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="caching"
                checked={data.config.enableCaching ?? true}
                onChange={(e) => handleConfigChange('enableCaching', e.target.checked)}
                className="w-3 h-3"
              />
              <Label htmlFor="caching" className="text-xs">Response Caching</Label>
            </div>
          </div>
        </div>

        {/* Test Prompt Input */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Test Prompt</Label>
          <Textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter a prompt to test the AI service..."
            className="h-20 text-xs resize-none"
          />
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={isProcessing || !testPrompt.trim()}
          size="sm"
          className="w-full"
        >
          {isProcessing && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
          {isProcessing ? 'Processing...' : 'Execute AI Request'}
        </Button>

        {/* Last Response Summary */}
        {lastResponse && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Last Response</span>
              <Badge variant="outline" className="text-xs">
                {lastResponse.metadata.responseTime.toFixed(1)}s
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded max-h-20 overflow-hidden">
              {lastResponse.content.substring(0, 100)}...
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Provider: {lastResponse.provider}</span>
              </span>
              <span>Cost: ${lastResponse.usage.cost.toFixed(4)}</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {aiService.error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              {aiService.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Metrics */}
        {lastResponse && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-1 mb-2">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">Performance</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">{lastResponse.metadata.responseTime.toFixed(1)}s</div>
                <div className="text-muted-foreground">Response</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{lastResponse.usage.totalTokens}</div>
                <div className="text-muted-foreground">Tokens</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">
                  ${(lastResponse.usage.cost * 1000).toFixed(1)}k
                </div>
                <div className="text-muted-foreground">Cost</div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {data.validationErrors && data.validationErrors.length > 0 && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              <ul className="list-disc list-inside">
                {data.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default UnifiedAINode;
