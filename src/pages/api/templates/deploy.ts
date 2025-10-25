/**
 * Template Deployment API
 *
 * Handles template deployment after successful payment
 * Creates Vercel deployments and provides deployment URLs
 */

import { NextRequest, NextResponse } from 'next/server';

// Template deployment configurations
const TEMPLATE_CONFIGS = {
  'ai-chatbot': {
    name: 'ai-customer-support-chatbot',
    description: 'AI-powered customer support chatbot',
    framework: 'nextjs',
    github: 'https://github.com/auterity/vercel-ai-chatbot-template',
    envVars: {
      'OPENAI_API_KEY': 'required',
      'NEXT_PUBLIC_APP_NAME': 'AI Customer Support'
    }
  },
  'rag-knowledge-base': {
    name: 'rag-document-qa-system',
    description: 'RAG-powered document Q&A system',
    framework: 'nextjs',
    github: 'https://github.com/auterity/vercel-rag-template',
    envVars: {
      'OPENAI_API_KEY': 'required',
      'PINECONE_API_KEY': 'optional',
      'NEXT_PUBLIC_APP_NAME': 'Document Q&A System'
    }
  },
  'streaming-writer': {
    name: 'ai-content-generator',
    description: 'Real-time AI content generator',
    framework: 'nextjs',
    github: 'https://github.com/auterity/vercel-streaming-template',
    envVars: {
      'OPENAI_API_KEY': 'required',
      'NEXT_PUBLIC_APP_NAME': 'AI Content Generator'
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const { templateId, sessionId, customerEmail } = await request.json();

    if (!templateId || !sessionId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, sessionId, customerEmail' },
        { status: 400 }
      );
    }

    // Get template configuration
    const templateConfig = TEMPLATE_CONFIGS[templateId as keyof typeof TEMPLATE_CONFIGS];

    if (!templateConfig) {
      return NextResponse.json(
        { error: 'Template configuration not found' },
        { status: 404 }
      );
    }

    // Generate unique deployment name
    const deploymentName = `${templateConfig.name}-${Date.now()}`;

    // Create Vercel deployment
    const deployment = await createVercelDeployment({
      templateId,
      deploymentName,
      customerEmail,
      templateConfig
    });

    // Store deployment information (in production, save to database)
    const deploymentRecord = {
      id: deployment.id,
      templateId,
      customerEmail,
      deploymentName,
      url: deployment.url,
      status: 'deploying',
      createdAt: new Date().toISOString(),
      config: templateConfig
    };

    // Send confirmation email
    await sendDeploymentConfirmation({
      customerEmail,
      templateName: templateConfig.name,
      deploymentUrl: deployment.url,
      sessionId
    });

    return NextResponse.json({
      success: true,
      deployment: deploymentRecord,
      instructions: {
        url: deployment.url,
        status: 'https://vercel.com/deployments',
        docs: 'https://docs.auterity.com/templates',
        support: 'support@auterity.com'
      }
    });

  } catch (error) {
    console.error('Template deployment error:', error);

    return NextResponse.json(
      { error: 'Failed to deploy template' },
      { status: 500 }
    );
  }
}

async function createVercelDeployment({
  templateId,
  deploymentName,
  customerEmail,
  templateConfig
}: {
  templateId: string;
  deploymentName: string;
  customerEmail: string;
  templateConfig: any;
}) {
  // In production, this would use Vercel's API to create deployments
  // For now, we'll simulate the deployment process

  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken) {
    // Fallback for development/demo
    return {
      id: `deployment-${Date.now()}`,
      url: `https://${deploymentName}.vercel-preview.app`,
      status: 'ready',
      createdAt: new Date().toISOString()
    };
  }

  // Create Vercel deployment via API
  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${vercelToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: deploymentName,
      gitSource: {
        type: 'github',
        repo: templateConfig.github,
        ref: 'main'
      },
      env: Object.entries(templateConfig.envVars).map(([key, value]) => ({
        key,
        value: value === 'required' ? 'PLACEHOLDER' : value,
        type: 'plain'
      })),
      build: {
        env: {
          CUSTOMER_EMAIL: customerEmail,
          TEMPLATE_ID: templateId
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Vercel deployment failed: ${error.message}`);
  }

  const deployment = await response.json();

  return {
    id: deployment.id,
    url: deployment.url,
    status: deployment.status,
    createdAt: deployment.createdAt
  };
}

async function sendDeploymentConfirmation({
  customerEmail,
  templateName,
  deploymentUrl,
  sessionId
}: {
  customerEmail: string;
  templateName: string;
  deploymentUrl: string;
  sessionId: string;
}) {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending deployment confirmation to ${customerEmail}`);
  console.log(`Template: ${templateName}`);
  console.log(`URL: ${deploymentUrl}`);
  console.log(`Session: ${sessionId}`);

  // Simulate email sending
  const emailContent = {
    to: customerEmail,
    subject: `Your ${templateName} is Ready!`,
    html: `
      <h1>Your Template is Deployed!</h1>
      <p>Thank you for your purchase. Your ${templateName} has been successfully deployed.</p>
      <p><strong>Access your application:</strong> <a href="${deploymentUrl}">${deploymentUrl}</a></p>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Configure your API keys in the environment variables</li>
        <li>Customize the template to match your needs</li>
        <li>Test the deployment and make adjustments</li>
        <li>Contact support if you need help</li>
      </ol>
      <p>Order ID: ${sessionId}</p>
      <p>Need help? Reply to this email or contact support@auterity.com</p>
    `
  };

  // In production: await emailService.send(emailContent);
  console.log('Email content:', emailContent);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');

  if (!templateId) {
    return NextResponse.json(
      { error: 'Template ID is required' },
      { status: 400 }
    );
  }

  const templateConfig = TEMPLATE_CONFIGS[templateId as keyof typeof TEMPLATE_CONFIGS];

  if (!templateConfig) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    template: templateConfig,
    deployment: {
      estimatedTime: '2-3 minutes',
      requirements: Object.keys(templateConfig.envVars)
    }
  });
}
