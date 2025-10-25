/**
 * Hugging Face Service for Auterity Error-IQ
 * Provides access to 100K+ pre-trained models for various AI tasks
 * Integrates with existing LangChain and LiteLLM services
 */

import { pipeline, Pipeline } from "@huggingface/transformers";
import { HfInference } from "@huggingface/inference";
import { z } from "zod";

// Types for Hugging Face integration
export interface HFModelConfig {
  model: string;
  task: 'text-generation' | 'text-classification' | 'token-classification' | 'question-answering' | 'summarization' | 'translation' | 'image-classification' | 'image-to-text' | 'text-to-image';
  device?: 'cpu' | 'gpu' | 'auto';
  dtype?: 'fp32' | 'fp16' | 'int8';
  useCache?: boolean;
}

export interface HFModel {
  id: string;
  name: string;
  task: string;
  tags: string[];
  downloads: number;
  likes: number;
  pipeline_tag: string;
  library_name?: string;
  modelId: string;
}

export interface InferenceResult {
  result: any;
  model: string;
  task: string;
  processingTime: number;
  device: string;
  confidence?: number;
}

export class HuggingFaceService {
  private inferenceClient: HfInference;
  private localPipelines: Map<string, Pipeline> = new Map();
  private modelCache: Map<string, HFModel> = new Map();

  constructor() {
    this.initializeInferenceClient();
  }

  /**
   * Initialize Hugging Face Inference client
   */
  private initializeInferenceClient(): void {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

    if (apiKey) {
      this.inferenceClient = new HfInference(apiKey);

    } else {

      // Initialize without API key for public models
      this.inferenceClient = new HfInference();
    }
  }

  /**
   * Search for models by task and criteria
   */
  async searchModels(
    query: string = '',
    task?: string,
    limit: number = 20,
    sort: 'downloads' | 'likes' | 'created' = 'downloads'
  ): Promise<HFModel[]> {
    try {
      // In a real implementation, this would call the Hugging Face API
      // For now, return mock data based on common models

      const mockModels: HFModel[] = [
        {
          id: 'microsoft/DialoGPT-medium',
          name: 'DialoGPT Medium',
          task: 'text-generation',
          tags: ['conversational', 'dialogue'],
          downloads: 1500000,
          likes: 850,
          pipeline_tag: 'text-generation',
          modelId: 'microsoft/DialoGPT-medium'
        },
        {
          id: 'distilbert-base-uncased-finetuned-sst-2-english',
          name: 'DistilBERT SST-2',
          task: 'text-classification',
          tags: ['sentiment-analysis', 'english'],
          downloads: 2200000,
          likes: 1200,
          pipeline_tag: 'text-classification',
          modelId: 'distilbert-base-uncased-finetuned-sst-2-english'
        },
        {
          id: 'deepset/roberta-base-squad2',
          name: 'RoBERTa SQuAD2',
          task: 'question-answering',
          tags: ['qa', 'squad2'],
          downloads: 1800000,
          likes: 950,
          pipeline_tag: 'question-answering',
          modelId: 'deepset/roberta-base-squad2'
        },
        {
          id: 'facebook/blenderbot-400M-distill',
          name: 'BlenderBot 400M',
          task: 'text-generation',
          tags: ['conversational', 'chatbot'],
          downloads: 950000,
          likes: 650,
          pipeline_tag: 'text-generation',
          modelId: 'facebook/blenderbot-400M-distill'
        }
      ];

      let filteredModels = mockModels;

      if (query) {
        filteredModels = filteredModels.filter(model =>
          model.name.toLowerCase().includes(query.toLowerCase()) ||
          model.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
      }

      if (task) {
        filteredModels = filteredModels.filter(model => model.task === task);
      }

      // Sort by specified criteria
      filteredModels.sort((a, b) => {
        switch (sort) {
          case 'downloads':
            return b.downloads - a.downloads;
          case 'likes':
            return b.likes - a.likes;
          case 'created':
            return b.id.localeCompare(a.id); // Simple sort by ID
          default:
            return 0;
        }
      });

      return filteredModels.slice(0, limit);

    } catch (error) {

      throw new Error(`Model search failed: ${(error as Error).message}`);
    }
  }

  /**
   * Run inference on a model
   */
  async runInference(
    modelId: string,
    inputs: any,
    options: {
      task?: string;
      parameters?: Record<string, any>;
      useGPU?: boolean;
    } = {}
  ): Promise<InferenceResult> {
    try {
      const startTime = Date.now();
      let result: any;

      // Determine task if not provided
      const task = options.task || this.inferTaskFromModel(modelId);

      // Use different inference methods based on task and availability
      if (this.shouldUseLocalPipeline(task)) {
        result = await this.runLocalPipeline(modelId, inputs, options);
      } else {
        result = await this.runRemoteInference(modelId, inputs, options);
      }

      const processingTime = Date.now() - startTime;

      return {
        result,
        model: modelId,
        task,
        processingTime,
        device: options.useGPU ? 'gpu' : 'cpu',
        confidence: result.confidence || result.score
      };

    } catch (error) {

      throw new Error(`Inference failed: ${(error as Error).message}`);
    }
  }

  /**
   * Run inference using local pipeline (for client-side models)
   */
  private async runLocalPipeline(
    modelId: string,
    inputs: any,
    options: any
  ): Promise<any> {
    try {
      // Check if pipeline is already loaded
      let pipelineInstance = this.localPipelines.get(modelId);

      if (!pipelineInstance) {
        // Load the pipeline
        pipelineInstance = await pipeline('text-classification', modelId, {
          device: options.useGPU ? 'gpu' : 'cpu',
          dtype: options.parameters?.dtype || 'fp32'
        });

        this.localPipelines.set(modelId, pipelineInstance);
      }

      // Run inference
      const result = await pipelineInstance(inputs, options.parameters);
      return result;

    } catch (error) {

      throw error;
    }
  }

  /**
   * Run inference using remote Hugging Face API
   */
  private async runRemoteInference(
    modelId: string,
    inputs: any,
    options: any
  ): Promise<any> {
    try {
      const task = options.task || this.inferTaskFromModel(modelId);

      switch (task) {
        case 'text-generation':
          return await this.inferenceClient.textGeneration({
            model: modelId,
            inputs,
            parameters: options.parameters
          });

        case 'text-classification':
          return await this.inferenceClient.textClassification({
            model: modelId,
            inputs,
            parameters: options.parameters
          });

        case 'question-answering':
          return await this.inferenceClient.questionAnswering({
            model: modelId,
            inputs,
            parameters: options.parameters
          });

        case 'summarization':
          return await this.inferenceClient.summarization({
            model: modelId,
            inputs,
            parameters: options.parameters
          });

        case 'translation':
          return await this.inferenceClient.translation({
            model: modelId,
            inputs,
            parameters: options.parameters
          });

        default:
          throw new Error(`Task ${task} not supported for remote inference`);
      }

    } catch (error) {

      throw error;
    }
  }

  /**
   * Determine if local pipeline should be used
   */
  private shouldUseLocalPipeline(task: string): boolean {
    // Use local pipeline for lightweight tasks that work well in browser
    const localTasks = ['text-classification', 'token-classification', 'feature-extraction'];
    return localTasks.includes(task) && typeof window !== 'undefined';
  }

  /**
   * Infer task from model ID
   */
  private inferTaskFromModel(modelId: string): string {
    const modelName = modelId.toLowerCase();

    if (modelName.includes('sentiment') || modelName.includes('sst')) {
      return 'text-classification';
    } else if (modelName.includes('qa') || modelName.includes('squad')) {
      return 'question-answering';
    } else if (modelName.includes('gpt') || modelName.includes('llama') || modelName.includes('dialogpt')) {
      return 'text-generation';
    } else if (modelName.includes('summarization')) {
      return 'summarization';
    } else if (modelName.includes('translation')) {
      return 'translation';
    }

    return 'text-classification'; // Default fallback
  }

  /**
   * Get model information and capabilities
   */
  async getModelInfo(modelId: string): Promise<HFModel | null> {
    try {
      // Check cache first
      if (this.modelCache.has(modelId)) {
        return this.modelCache.get(modelId)!;
      }

      // In a real implementation, this would call the Hugging Face API
      // For now, return mock data
      const mockModel: HFModel = {
        id: modelId,
        name: modelId.split('/').pop() || modelId,
        task: this.inferTaskFromModel(modelId),
        tags: ['ai', 'ml', 'huggingface'],
        downloads: Math.floor(Math.random() * 1000000),
        likes: Math.floor(Math.random() * 1000),
        pipeline_tag: this.inferTaskFromModel(modelId),
        modelId
      };

      this.modelCache.set(modelId, mockModel);
      return mockModel;

    } catch (error) {

      return null;
    }
  }

  /**
   * Get popular models by task
   */
  async getPopularModelsByTask(task: string, limit: number = 10): Promise<HFModel[]> {
    try {
      return await this.searchModels('', task, limit, 'downloads');
    } catch (error) {

      return [];
    }
  }

  /**
   * Download and cache a model locally
   */
  async downloadModel(modelId: string, progressCallback?: (progress: number) => void): Promise<void> {
    try {


      // This would implement actual model downloading in a real application
      // For now, just simulate the process

      if (progressCallback) {
        for (let i = 0; i <= 100; i += 10) {
          progressCallback(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }



    } catch (error) {

      throw new Error(`Model download failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get service health and available features
   */
  getHealthStatus(): {
    inferenceAvailable: boolean;
    localPipelinesAvailable: boolean;
    apiKeyConfigured: boolean;
    cachedModels: number;
    activePipelines: number;
  } {
    return {
      inferenceAvailable: !!this.inferenceClient,
      localPipelinesAvailable: typeof pipeline !== 'undefined',
      apiKeyConfigured: !!import.meta.env.VITE_HUGGINGFACE_API_KEY,
      cachedModels: this.modelCache.size,
      activePipelines: this.localPipelines.size
    };
  }

  /**
   * Clear cache and reset pipelines
   */
  clearCache(): void {
    this.modelCache.clear();
    this.localPipelines.clear();

  }

  /**
   * Get supported tasks
   */
  getSupportedTasks(): string[] {
    return [
      'text-generation',
      'text-classification',
      'token-classification',
      'question-answering',
      'summarization',
      'translation',
      'image-classification',
      'image-to-text',
      'text-to-image',
      'feature-extraction'
    ];
  }
}

// Export singleton instance
export const huggingFaceService = new HuggingFaceService();

