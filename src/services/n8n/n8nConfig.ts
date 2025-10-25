// Centralized config for n8n API. Error-free: Uses env vars with fallbacks.

export const n8nConfig = {
  apiKey: import.meta.env.VITE_N8N_API_KEY || localStorage.getItem('n8nApiKey') || '',
  apiUrl: import.meta.env.VITE_N8N_API_URL || localStorage.getItem('n8nApiUrl') || 'http://localhost:5678/api/v1',
};

// Validation
if (!n8nConfig.apiKey) {
  console.warn('n8n API Key not found. Please configure in N8nManagementPage.');
}
