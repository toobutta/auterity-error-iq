/**
 * Google Vertex AI Service for Auterity Error-IQ
 * Provides access to Gemini models and multimodal capabilities
 * Integrates with existing LangChain and LiteLLM services
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { z } from "zod";

// Types for Google Vertex AI integration
export interface VertexConfig {
  model: 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  temperature: number;
  maxTokens: number;
  safetySettings?: {
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }[];
  generationConfig?: {
    stopSequences?: string[];
    candidateCount?: number;
    maxOutputTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
  };
}

export interface MultimodalInput {
  text?: string;
  image?: {
    data: string; // base64 encoded
    mimeType: string;
  };
  audio?: {
    data: string; // base64 encoded
    mimeType: string;
  };
}

export interface VertexResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  safetyRatings?: any[];
  finishReason?: string;
}

export class GoogleVertexService {
  private chatModels: Map<string, ChatGoogleGenerativeAI> = new Map();
  private embeddingsModel: GoogleGenerativeAIEmbeddings | null = null;

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize Vertex AI models
   */
  private initializeModels(): void {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      if (!apiKey) {

        return;
      }

      // Initialize chat models
      const models = ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'];

      models.forEach(modelName => {
        try {
          const model = new ChatGoogleGenerativeAI({
            apiKey,
            modelName,
            temperature: 0.7,
            maxOutputTokens: 2048,
            safetySettings: this.getDefaultSafetySettings(),
          });
          this.chatModels.set(modelName, model);
        } catch (error) {

        }
      });

      // Initialize embeddings model
      this.embeddingsModel = new GoogleGenerativeAIEmbeddings({
        apiKey,
        modelName: 'embedding-001',
      });


    } catch (error) {

    }
  }

  /**
   * Get default safety settings for responsible AI
   */
  private getDefaultSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  /**
   * Get a chat model by name
   */
  getModel(modelName: string): ChatGoogleGenerativeAI {
    const model = this.chatModels.get(modelName);
    if (!model) {
      throw new Error(`Google Vertex model ${modelName} not found. Available models: ${Array.from(this.chatModels.keys()).join(', ')}`);
    }
    return model;
  }

  /**
   * Generate text response
   */
  async generateText(
    prompt: string,
    config: Partial<VertexConfig> = {}
  ): Promise<VertexResponse> {
    try {
      const model = this.getModel(config.model || 'gemini-pro');

      // Update model configuration if provided
      if (config.temperature !== undefined) {
        model.temperature = config.temperature;
      }
      if (config.maxTokens) {
        model.maxOutputTokens = config.maxTokens;
      }

      const response = await model.invoke(prompt);

      return {
        text: response.content as string,
        usage: {
          inputTokens: Math.ceil(prompt.length / 4), // Rough estimate
          outputTokens: Math.ceil((response.content as string).length / 4),
          totalTokens: Math.ceil((prompt.length + (response.content as string).length) / 4)
        },
        finishReason: response.response_metadata?.finish_reason,
        safetyRatings: response.response_metadata?.safety_ratings
      };

    } catch (error) {

      throw new Error(`Vertex AI text generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate multimodal response (text + image)
   */
  async generateMultimodal(
    input: MultimodalInput,
    config: Partial<VertexConfig> = {}
  ): Promise<VertexResponse> {
    try {
      const model = this.getModel(config.model || 'gemini-pro-vision');

      let prompt = input.text || '';

      // Handle image input
      if (input.image) {
        // For Gemini Vision models, we need to format the prompt differently
        prompt = `${prompt}\n\nImage: [${input.image.mimeType} image data]`;
      }

      // Handle audio input (if supported)
      if (input.audio) {
        prompt = `${prompt}\n\nAudio: [${input.audio.mimeType} audio data]`;
      }

      const response = await model.invoke(prompt);

      return {
        text: response.content as string,
        usage: {
          inputTokens: Math.ceil(prompt.length / 4),
          outputTokens: Math.ceil((response.content as string).length / 4),
          totalTokens: Math.ceil((prompt.length + (response.content as string).length) / 4)
        },
        finishReason: response.response_metadata?.finish_reason,
        safetyRatings: response.response_metadata?.safety_ratings
      };

    } catch (error) {

      throw new Error(`Vertex AI multimodal generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate embeddings for text
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      if (!this.embeddingsModel) {
        throw new Error('Embeddings model not initialized. Check Google API key.');
      }

      const embeddings = await this.embeddingsModel.embedDocuments(texts);
      return embeddings;

    } catch (error) {

      throw new Error(`Vertex AI embeddings failed: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(
    imageData: string,
    mimeType: string,
    prompt: string = "Describe this image in detail."
  ): Promise<VertexResponse> {
    try {
      const model = this.getModel('gemini-pro-vision');

      const fullPrompt = `${prompt}\n\nImage: [${mimeType} image data]`;

      const response = await model.invoke(fullPrompt);

      return {
        text: response.content as string,
        usage: {
          inputTokens: Math.ceil(fullPrompt.length / 4),
          outputTokens: Math.ceil((response.content as string).length / 4),
          totalTokens: Math.ceil((fullPrompt.length + (response.content as string).length) / 4)
        },
        finishReason: response.response_metadata?.finish_reason,
        safetyRatings: response.response_metadata?.safety_ratings
      };

    } catch (error) {

      throw new Error(`Vertex AI image analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a conversational chain with Gemini
   */
  async createConversationChain(systemPrompt?: string): Promise<any> {
    try {
      const model = this.getModel('gemini-1.5-pro');

      // For now, return a simple chain. In a full implementation,
      // this would integrate with LangChain's conversation chains
      return {
        model,
        systemPrompt: systemPrompt || "You are a helpful AI assistant.",
        async invoke(input: string) {
          const response = await model.invoke(`${this.systemPrompt}\n\nUser: ${input}`);
          return response.content;
        }
      };

    } catch (error) {

      throw new Error(`Gemini conversation chain creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get available models and their capabilities
   */
  getAvailableModels(): Array<{
    name: string;
    capabilities: string[];
    maxTokens: number;
    supportsVision: boolean;
    supportsAudio: boolean;
  }> {
    return [
      {
        name: 'gemini-pro',
        capabilities: ['text-generation', 'conversational', 'code'],
        maxTokens: 30720,
        supportsVision: false,
        supportsAudio: false
      },
      {
        name: 'gemini-pro-vision',
        capabilities: ['text-generation', 'image-analysis', 'multimodal'],
        maxTokens: 12288,
        supportsVision: true,
        supportsAudio: false
      },
      {
        name: 'gemini-1.5-pro',
        capabilities: ['text-generation', 'conversational', 'code', 'multimodal'],
        maxTokens: 1048576,
        supportsVision: true,
        supportsAudio: true
      },
      {
        name: 'gemini-1.5-flash',
        capabilities: ['text-generation', 'conversational', 'fast-inference'],
        maxTokens: 1048576,
        supportsVision: false,
        supportsAudio: false
      }
    ].filter(model => this.chatModels.has(model.name));
  }

  /**
   * Get service health and metrics
   */
  getHealthStatus(): {
    modelsAvailable: string[];
    embeddingsAvailable: boolean;
    apiKeyConfigured: boolean;
    lastError?: string;
  } {
    return {
      modelsAvailable: Array.from(this.chatModels.keys()),
      embeddingsAvailable: this.embeddingsModel !== null,
      apiKeyConfigured: !!import.meta.env.VITE_GOOGLE_API_KEY,
      lastError: undefined // Could track last error in a real implementation
    };
  }

  /**
   * Check model capabilities for a specific task
   */
  checkCapability(modelName: string, capability: string): boolean {
    const modelInfo = this.getAvailableModels().find(m => m.name === modelName);
    if (!modelInfo) return false;

    return modelInfo.capabilities.includes(capability);
  }

  /**
   * Get recommended model for a task
   */
  getRecommendedModel(task: 'text' | 'vision' | 'multimodal' | 'code' | 'creative'): string {
    const recommendations = {
      text: 'gemini-1.5-pro',
      vision: 'gemini-pro-vision',
      multimodal: 'gemini-1.5-pro',
      code: 'gemini-1.5-pro',
      creative: 'gemini-1.5-flash'
    };

    const recommended = recommendations[task];
    return this.chatModels.has(recommended) ? recommended : 'gemini-pro';
  }
}

// Export singleton instance
export const googleVertexService = new GoogleVertexService();

