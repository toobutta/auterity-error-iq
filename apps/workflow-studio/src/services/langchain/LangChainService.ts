/**
 * LangChain Service for Auterity Error-IQ
 * Provides advanced agent orchestration and workflow chains
 * Integrates with existing Vercel AI SDK and n8n workflows
 */

import { ChatOpenAI, ChatAnthropic, ChatGoogleGenerativeAI } from "@langchain/core/language_models/chat_models";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { z } from "zod";

// Types for LangChain integration
export interface LangChainConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
  streaming?: boolean;
  memory?: boolean;
  systemPrompt?: string;
}

export interface ChainExecution {
  id: string;
  chainType: string;
  input: any;
  output: any;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  name: string;
  role: string;
  capabilities: string[];
  model: LangChainConfig;
  tools?: string[];
  memory?: boolean;
}

export class LangChainService {
  private chatModels: Map<string, any> = new Map();
  private chains: Map<string, any> = new Map();
  private activeExecutions: Map<string, ChainExecution> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize chat models with existing AI SDK providers
   */
  private initializeModels(): void {
    try {
      // GPT-4 via Vercel AI SDK
      this.chatModels.set('gpt-4', new ChatOpenAI({
        openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
        modelName: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      }));

      // Claude via Vercel AI SDK
      this.chatModels.set('claude-3', new ChatAnthropic({
        anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        modelName: 'claude-3-sonnet-20240229',
        temperature: 0.7,
        maxTokens: 1000,
      }));

      // Gemini via Vercel AI SDK
      this.chatModels.set('gemini-pro', new ChatGoogleGenerativeAI({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        modelName: 'gemini-pro',
        temperature: 0.7,
        maxTokens: 1000,
      }));


    } catch (error) {

    }
  }

  /**
   * Get a chat model by name
   */
  getModel(modelName: string): any {
    const model = this.chatModels.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found. Available models: ${Array.from(this.chatModels.keys()).join(', ')}`);
    }
    return model;
  }

  /**
   * Create a conversation chain with memory
   */
  async createConversationChain(config: LangChainConfig, conversationId?: string): Promise<any> {
    try {
      const model = this.getModel(config.model);

      const chainId = conversationId || `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const memory = config.memory !== false ? new BufferMemory() : undefined;

      const chain = new ConversationChain({
        llm: model,
        memory,
        verbose: true,
      });

      // Add system prompt if provided
      if (config.systemPrompt) {
        const systemPrompt = PromptTemplate.fromTemplate(
          `${config.systemPrompt}\n\nCurrent conversation:\n{history}\nHuman: {input}\nAssistant:`
        );
        chain.prompt = systemPrompt;
      }

      this.chains.set(chainId, chain);
      return { chainId, chain };

    } catch (error) {

      throw new Error(`Failed to create conversation chain: ${(error as Error).message}`);
    }
  }

  /**
   * Execute a conversation chain
   */
  async executeChain(chainId: string, input: string, metadata?: Record<string, any>): Promise<any> {
    try {
      const chain = this.chains.get(chainId);
      if (!chain) {
        throw new Error(`Chain ${chainId} not found`);
      }

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create execution record
      const execution: ChainExecution = {
        id: executionId,
        chainType: 'conversation',
        input,
        output: null,
        startTime: new Date(),
        status: 'running',
        metadata
      };

      this.activeExecutions.set(executionId, execution);

      // Execute the chain
      const result = await chain.call({ input });

      // Update execution record
      execution.output = result.response || result.output || result;
      execution.endTime = new Date();
      execution.status = 'completed';


      return execution;

    } catch (error) {


      // Update execution with error
      const execution = Array.from(this.activeExecutions.values())
        .find(exec => exec.status === 'running' && exec.metadata?.chainId === chainId);

      if (execution) {
        execution.status = 'failed';
        execution.error = (error as Error).message;
        execution.endTime = new Date();
      }

      throw new Error(`Chain execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Create a custom chain with multiple steps
   */
  async createCustomChain(steps: any[], chainId?: string): Promise<any> {
    try {
      const id = chainId || `custom_chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Convert steps to RunnableSequence
      const runnables = steps.map(step => {
        if (step.type === 'model') {
          return this.getModel(step.model);
        } else if (step.type === 'prompt') {
          return PromptTemplate.fromTemplate(step.template);
        }
        // Add more step types as needed
        return step;
      });

      const chain = RunnableSequence.from(runnables);
      this.chains.set(id, chain);

      return { chainId: id, chain };

    } catch (error) {

      throw new Error(`Failed to create custom chain: ${(error as Error).message}`);
    }
  }

  /**
   * Create an agent with tools and capabilities
   */
  async createAgent(config: AgentConfig): Promise<any> {
    try {
      const model = this.getModel(config.model.model);

      // Create agent prompt
      const agentPrompt = PromptTemplate.fromTemplate(`
You are ${config.name}, a ${config.role} with the following capabilities: ${config.capabilities.join(', ')}

Guidelines:
- Use your capabilities to help users effectively
- Be helpful, accurate, and professional
- If you need to use tools, explain what you're doing
- Always provide clear, actionable responses

Available tools: ${config.tools?.join(', ') || 'None'}

{history}
Human: {input}
Assistant: Let me help you with that.`);

      const memory = config.memory !== false ? new BufferMemory() : undefined;

      const agent = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        config,
        model,
        prompt: agentPrompt,
        memory,
        createdAt: new Date()
      };


      return agent;

    } catch (error) {

      throw new Error(`Failed to create agent: ${(error as Error).message}`);
    }
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ChainExecution[] {
    return Array.from(this.activeExecutions.values()).filter(exec => exec.status === 'running');
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit = 50): ChainExecution[] {
    return Array.from(this.activeExecutions.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Clean up completed executions (older than specified hours)
   */
  cleanupExecutions(olderThanHours = 24): number {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [id, execution] of this.activeExecutions.entries()) {
      if (execution.endTime && execution.endTime < cutoffTime) {
        this.activeExecutions.delete(id);
        cleanedCount++;
      }
    }


    return cleanedCount;
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    modelsAvailable: string[];
    chainsActive: number;
    executionsActive: number;
    executionsCompleted: number;
  } {
    const executions = Array.from(this.activeExecutions.values());

    return {
      modelsAvailable: Array.from(this.chatModels.keys()),
      chainsActive: this.chains.size,
      executionsActive: executions.filter(e => e.status === 'running').length,
      executionsCompleted: executions.filter(e => e.status === 'completed').length
    };
  }
}

// Export singleton instance
export const langChainService = new LangChainService();

