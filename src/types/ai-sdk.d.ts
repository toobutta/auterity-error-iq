// Custom type declarations for AI SDK modules
declare module 'ai' {
  export interface CoreMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }

  export function generateText(options: {
    model: any;
    messages: CoreMessage[];
    temperature?: number;
  }): Promise<{ text: string }>;

  export function generateObject(options: {
    model: any;
    schema: any;
    messages: CoreMessage[];
    temperature?: number;
  }): Promise<{ object: any }>;

  export function streamText(options: {
    model: any;
    messages: CoreMessage[];
    temperature?: number;
  }): Promise<{
    textStream: AsyncIterable<string>;
  }>;

  export function tool(options: any): any;
}

declare module '@ai-sdk/openai' {
  export function openai(model: string): any;
}

declare module '@ai-sdk/anthropic' {
  export function anthropic(model: string): any;
}

declare module '@ai-sdk/azure' {
  export function azure(model: string): any;
}

declare module '@ai-sdk/google' {
  export function google(model: string): any;
}

declare module '@ai-sdk/cohere' {
  export function cohere(model: string): any;
}
