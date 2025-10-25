/**
 * Template Purchase Success Page
 *
 * Handles successful Stripe payments and template deployment
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TemplateSuccessPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [template, setTemplate] = useState<any>(null);
  const [deployment, setDeployment] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get('session_id');
  const templateId = searchParams.get('template_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    handlePaymentSuccess();
  }, [sessionId, templateId]);

  const handlePaymentSuccess = async () => {
    try {
      // Verify payment with Stripe
      const response = await fetch('/api/payments/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const { payment, template: templateData } = await response.json();

      setTemplate(templateData);

      // Start template deployment
      const deploymentResponse = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          sessionId,
          customerEmail: payment.customer_details?.email
        })
      });

      if (!deploymentResponse.ok) {
        throw new Error('Template deployment failed');
      }

      const deploymentData = await deploymentResponse.json();
      setDeployment(deploymentData);

      setStatus('success');

      // Track successful purchase
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'purchase', {
          transaction_id: sessionId,
          value: templateData.price / 100,
          currency: 'USD',
          items: [{
            item_id: templateId,
            item_name: templateData.name,
            price: templateData.price / 100
          }]
        });
      }

    } catch (error) {
      console.error('Payment success handling failed:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="success-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Processing Your Purchase...</h2>
          <p>Please wait while we verify your payment and deploy your template.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="success-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Payment Processing Error</h2>
          <p>There was an issue processing your payment. Please contact support if the charge appears on your card.</p>
          <div className="error-actions">
            <button onClick={() => router.push('/templates')}>
              Back to Templates
            </button>
            <a href="mailto:support@auterity.com">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">✅</div>

        <h1>Payment Successful!</h1>
        <p className="success-message">
          Thank you for your purchase. Your template is being deployed and will be ready shortly.
        </p>

        {template && (
          <div className="template-details">
            <h2>{template.name}</h2>
            <p>{template.description}</p>
            <div className="template-features">
              <h3>Included Features:</h3>
              <ul>
                {template.features?.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {deployment && (
          <div className="deployment-status">
            <h3>Deployment Status</h3>
            <div className="status-indicator">
              <span className="status-dot deploying"></span>
              <span>Deploying to Vercel...</span>
            </div>
            <p className="deployment-note">
              Your template will be available at: <code>{deployment.url}</code>
            </p>
          </div>
        )}

        <div className="next-steps">
          <h3>What happens next?</h3>
          <ol>
            <li>You'll receive a confirmation email with deployment details</li>
            <li>Your template will be deployed to Vercel within 2-3 minutes</li>
            <li>You can customize the template and redeploy as needed</li>
            <li>Access premium support for implementation assistance</li>
          </ol>
        </div>

        <div className="success-actions">
          <Link href="/dashboard" className="primary-button">
            Go to Dashboard
          </Link>
          <Link href="/templates" className="secondary-button">
            Browse More Templates
          </Link>
          <Link href="/docs" className="secondary-button">
            View Documentation
          </Link>
        </div>

        <div className="support-info">
          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@auterity.com">support@auterity.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
