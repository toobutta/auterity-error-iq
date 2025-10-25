/**
 * Stripe Checkout Session Creation API
 *
 * Creates Stripe checkout sessions for template purchases
 * Handles payment processing and template delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Template pricing data (in production, this would come from database)
const TEMPLATE_PRICING = {
  'ai-chatbot': {
    name: 'AI Customer Support Chatbot',
    price: 29900, // $299.00 in cents
    description: 'Intelligent chatbot using Vercel AI SDK for customer support',
    features: ['Real-time chat', 'Multi-provider support', 'Easy deployment']
  },
  'rag-knowledge-base': {
    name: 'Document Q&A System',
    price: 49900, // $499.00 in cents
    description: 'RAG-powered knowledge base with document embeddings',
    features: ['Document upload', 'Semantic search', 'Context-aware answers']
  },
  'streaming-writer': {
    name: 'AI Content Generator',
    price: 19900, // $199.00 in cents
    description: 'Real-time content generation with streaming responses',
    features: ['Real-time generation', 'Multiple formats', 'Progress tracking']
  },
  'generative-ui-builder': {
    name: 'Dynamic Form Builder',
    price: 34900, // $349.00 in cents
    description: 'AI-powered form generation with dynamic UI components',
    features: ['AI form layouts', 'Dynamic fields', 'Validation rules']
  },
  'ai-tool-orchestrator': {
    name: 'AI Tool Orchestrator',
    price: 59900, // $599.00 in cents
    description: 'Multi-tool AI agent with function calling and orchestration',
    features: ['Tool integration', 'Function calling', 'Error handling']
  }
};

export async function POST(request: NextRequest) {
  try {
    const { templateId, customerEmail, successUrl, cancelUrl } = await request.json();

    // Validate input
    if (!templateId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId and customerEmail' },
        { status: 400 }
      );
    }

    // Get template details
    const template = TEMPLATE_PRICING[templateId as keyof typeof TEMPLATE_PRICING];
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: template.name,
              description: template.description,
              images: [`https://auterity.com/templates/${templateId}.jpg`],
              metadata: {
                templateId,
                features: JSON.stringify(template.features)
              }
            },
            unit_amount: template.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&template_id=${templateId}`,
      cancel_url: cancelUrl || `${request.headers.get('origin')}/templates`,
      metadata: {
        templateId,
        customerEmail,
        templateName: template.name,
        templatePrice: template.price.toString()
      },
      payment_intent_data: {
        metadata: {
          templateId,
          customerEmail
        }
      }
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      template
    });

  } catch (error) {
    console.error('Stripe checkout creation error:', error);

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available templates and pricing
  return NextResponse.json({
    templates: TEMPLATE_PRICING,
    currency: 'USD',
    message: 'Template marketplace pricing'
  });
}