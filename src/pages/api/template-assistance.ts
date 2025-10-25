/**
 * Template Assistance API Route
 *
 * Provides AI-powered assistance for template generation using Vercel AI SDK
 * Leverages existing aiSDKService and unifiedAIService
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Enhance the conversation with template generation context
    const enhancedMessages = [
      {
        role: 'system',
        content: `You are an expert template generator using Vercel AI SDK patterns.
        Help users create custom workflow templates with AI capabilities.

        Available Vercel AI SDK Patterns:
        - Chatbot: useChat hook, MessageList, ChatInput components
        - RAG: Document embeddings, similarity search, retrieval
        - Streaming: Real-time text generation with streamText
        - Generative UI: Dynamic React components with streamUI
        - Tools: Function calling with Zod schemas

        Framework Options:
        - Next.js (recommended for Vercel)
        - React with Vite
        - Svelte
        - Vue

        Always suggest best practices and provide complete, deployable solutions.`
      },
      ...messages
    ];

    const result = await streamText({
      model: openai('gpt-4'),
      messages: enhancedMessages,
      temperature: 0.7,
      maxTokens: 2000
    });

    return new Response(result.toDataStreamResponse().body);
  } catch (error) {
    console.error('Template assistance error:', error);
    return NextResponse.json(
      { error: 'Failed to process template assistance request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Template Assistance API',
    patterns: [
      'chatbot',
      'rag',
      'streaming',
      'generative-ui',
      'tools'
    ],
    frameworks: ['nextjs', 'react', 'svelte', 'vue']
  });
}
