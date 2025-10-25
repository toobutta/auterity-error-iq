// n8n Management Page: Allows users to configure n8n settings and view integrations
// Migrated from auterity-workflow-studio and adapted for auterity-error-iq
// Error-free: Uses React hooks, TypeScript, and integrates with auterity-error-iq's navigation

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@auterity/design-system';
import { n8nApiService } from '../../services/n8n/n8nApiService';
import { n8nConfig, validateN8nConfig } from '../../services/n8n/n8nConfig';

interface WorkflowInfo {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

const N8nManagementPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load existing config from localStorage and env
    const savedKey = localStorage.getItem('n8nApiKey') || n8nConfig.apiKey;
    const savedUrl = localStorage.getItem('n8nApiUrl') || n8nConfig.apiUrl;
    setApiKey(savedKey);
    setApiUrl(savedUrl);

    // Validate configuration
    const validation = validateN8nConfig();
    setConfigErrors(validation.errors);

    // Test connection if config is valid
    if (validation.isValid) {
      testConnection(savedKey, savedUrl);
    }
  }, []);

  const testConnection = async (key: string, url: string) => {
    setIsLoading(true);
    try {
      // Test with a simple API call to verify connection
      const testWorkflows = await n8nApiService.listWorkflows();
      setWorkflows(testWorkflows.slice(0, 5)); // Show first 5 workflows
      setIsConnected(true);
      setConfigErrors([]);
    } catch (error: any) {

      setIsConnected(false);
      setConfigErrors([error.message || 'Connection failed']);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || !apiUrl.trim()) {
      setConfigErrors(['API Key and URL are required']);
      return;
    }

    try {
      setIsLoading(true);

      // Test connection before saving
      await testConnection(apiKey, apiUrl);

      // Save to localStorage for persistence
      localStorage.setItem('n8nApiKey', apiKey);
      localStorage.setItem('n8nApiUrl', apiUrl);

      // Also save to sessionStorage for immediate use
      sessionStorage.setItem('n8nApiKey', apiKey);
      sessionStorage.setItem('n8nApiUrl', apiUrl);

      // Update environment variables if possible (client-side limitation)
      if (window.location.protocol === 'http:' || window.location.hostname === 'localhost') {

      }

    } catch (error: any) {
      setConfigErrors([error.message || 'Failed to save configuration']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = () => {
    if (!apiKey.trim() || !apiUrl.trim()) {
      setConfigErrors(['Please enter both API Key and URL before testing']);
      return;
    }
    testConnection(apiKey, apiUrl);
  };

  const handleBackToWorkflows = () => {
    navigate('/workflows');
  };

  const handleCreateWorkflow = () => {
    navigate('/workflows/create');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">n8n Integration Management</h1>
          <p className="text-lg text-gray-600">
            Configure and manage your n8n workflow automation integration
          </p>
        </div>

        {/* Configuration Section */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Configuration</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 mb-1">
                n8n API URL
              </label>
              <input
                id="apiUrl"
                type="url"
                placeholder="https://your-n8n-instance.com/api/v1"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Your n8n instance URL (usually ends with /api/v1)
              </p>
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                n8n API Key
              </label>
              <input
                id="apiKey"
                type="password"
                placeholder="n8n_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                API key from your n8n instance settings
              </p>
            </div>

            {/* Configuration Errors */}
            {configErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Configuration Issues</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        {configErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isConnected && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Connected Successfully</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Your n8n instance is properly configured and accessible.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleTestConnection}
                disabled={isLoading || !apiKey.trim() || !apiUrl.trim()}
                variant="outline"
                className="flex items-center"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
              </Button>

              <Button
                onClick={handleSave}
                disabled={isLoading || !apiKey.trim() || !apiUrl.trim()}
                variant="primary"
                className="flex items-center"
              >
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>

        {/* Workflows Section */}
        {isConnected && workflows.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Workflows</h2>
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{workflow.name}</h3>
                    <p className="text-sm text-gray-500">ID: {workflow.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      onClick={() => navigate(`/workflows/n8n/${workflow.id}`)}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button onClick={handleBackToWorkflows} variant="outline">
            Back to Workflows
          </Button>

          <Button
            onClick={handleCreateWorkflow}
            variant="primary"
            disabled={!isConnected}
          >
            Create New Workflow
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Need Help?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Having trouble connecting to n8n? Make sure your n8n instance is running and accessible.
                  Check the{' '}
                  <a
                    href="https://docs.n8n.io/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-800"
                  >
                    n8n API documentation
                  </a>
                  {' '}for more information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default N8nManagementPage;

