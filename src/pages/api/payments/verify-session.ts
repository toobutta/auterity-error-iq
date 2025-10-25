/**
 * Stripe Session Verification API
 *
 * Verifies Stripe checkout sessions and retrieves payment details
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Template data (in production, this would come from database)
const TEMPLATE_DATA = {
  'ai-chatbot': {
    id: 'ai-chatbot',
    name: 'AI Customer Support Chatbot',
    description: 'Intelligent chatbot using Vercel AI SDK for customer support',
    price: 29900,
    features: ['Real-time chat', 'Multi-provider support', 'Easy deployment']
  },
  'rag-knowledge-base': {
    id: 'rag-knowledge-base',
    name: 'Document Q&A System',
    description: 'RAG-powered knowledge base with document embeddings',
    price: 49900,
    features: ['Document upload', 'Semantic search', 'Context-aware answers']
  }
};

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer_details']
    });

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get template information
    const templateId = session.metadata?.templateId;
    const template = TEMPLATE_DATA[templateId as keyof typeof TEMPLATE_DATA];

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Return payment and template details
    const paymentDetails = {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email,
      templateId,
      templateName: template.name,
      paymentIntentId: session.payment_intent?.id
    };

    return NextResponse.json({
      success: true,
      payment: paymentDetails,
      template,
      session
    });

  } catch (error) {
    console.error('Payment verification error:', error);

    return NextResponse.json(
      { error: 'Failed to verify payment session' },
      { status: 500 }
    );
  }
}
