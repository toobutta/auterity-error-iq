import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  PaintBrushIcon,
  CpuChipIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import './LoginForm.css';

interface LoginFormProps {
  onLoginSuccess?: () => void;
  onLoginError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onLoginError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have an authorization code in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      handleCallback(code, state);
    }
  }, []);

  const handleCallback = async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.handleCallback(code, state);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      onLoginSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      onLoginError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.login();
      // The login method will redirect to the auth provider
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      onLoginError?.(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <div className="login-form-header">
          <h1 className="login-form-title">Auterity Workflow Studio</h1>
          <p className="login-form-subtitle">
            Sign in to create and manage your automated workflows
          </p>
        </div>

        <div className="login-form-body">
          {error && (
            <div className="login-error-message">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="login-loading">
                <div className="login-spinner"></div>
                Signing in...
              </div>
            ) : (
              <>
                <LockClosedIcon className="w-5 h-5" />
                <span>Sign in with Auterity</span>
              </>
            )}
          </button>
        </div>

        <div className="login-form-footer">
          <p className="login-footer-text">
            By signing in, you agree to our{' '}
            <a href="#" className="login-link">Terms of Service</a> and{' '}
            <a href="#" className="login-link">Privacy Policy</a>
          </p>
        </div>
      </div>

      <div className="login-features">
        <div className="login-feature">
          <div className="login-feature-icon">
            <PaintBrushIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h3>Visual Workflow Builder</h3>
          <p>Design complex automation workflows with our drag-and-drop interface</p>
        </div>
        <div className="login-feature">
          <div className="login-feature-icon">
            <CpuChipIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h3>AI-Powered Automation</h3>
          <p>Leverage AI models and function calling for intelligent workflow steps</p>
        </div>
        <div className="login-feature">
          <div className="login-feature-icon">
            <BoltIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h3>Real-Time Execution</h3>
          <p>Monitor and debug your workflows with live execution tracking</p>
        </div>
      </div>
    </div>
  );
};
