// n8n Management Page: Allows users to configure n8n settings and view integrations.
// Error-free: Uses React hooks, TypeScript, and handles API errors gracefully.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Assuming toast library is available

const N8nManagementPage: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load existing config (from localStorage or env)
    const savedKey = localStorage.getItem('n8nApiKey') || '';
    const savedUrl = localStorage.getItem('n8nApiUrl') || 'http://localhost:5678/api/v1';
    setApiKey(savedKey);
    setApiUrl(savedUrl);
  }, []);

  const handleSave = async () => {
    try {
      // Validate inputs
      if (!apiKey || !apiUrl) throw new Error('API Key and URL are required.');

      // Test connection (simple API call)
      const response = await fetch(`${apiUrl}/workflows`, {
        headers: { 'X-N8N-API-KEY': apiKey },
      });
      if (!response.ok) throw new Error('Connection failed. Check credentials.');

      // Save to localStorage
      localStorage.setItem('n8nApiKey', apiKey);
      localStorage.setItem('n8nApiUrl', apiUrl);
      setIsConnected(true);
      toast.success('n8n connected successfully!');
    } catch (error) {
      console.error('Error saving n8n config:', error);
      toast.error(`Error: ${(error as Error).message}`);
      setIsConnected(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">n8n Integration Management</h1>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="API URL"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded">
          Save & Test Connection
        </button>
        {isConnected && <p className="text-green-600">✅ Connected</p>}
        <button onClick={() => navigate('/canvas')} className="bg-gray-500 text-white px-4 py-2 rounded">
          Back to Canvas
        </button>
      </div>
    </div>
  );
};

export default N8nManagementPage;
