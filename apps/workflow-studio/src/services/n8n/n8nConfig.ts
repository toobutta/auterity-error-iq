// Centralized config for n8n API - Migrated from auterity-workflow-studio
// Adapted for auterity-error-iq's architecture
// Error-free: Uses env vars with fallbacks and integrates with existing config systems

export const n8nConfig = {
  // Primary n8n instance configuration
  apiKey: import.meta.env.VITE_N8N_API_KEY ||
          localStorage.getItem('n8nApiKey') ||
          process.env.N8N_API_KEY ||
          '',

  apiUrl: import.meta.env.VITE_N8N_API_URL ||
          localStorage.getItem('n8nApiUrl') ||
          process.env.N8N_API_URL ||
          'http://localhost:5678/api/v1',

  // Integration with auterity-error-iq systems
  relaycoreUrl: import.meta.env.VITE_RELAYCORE_URL ||
                process.env.RELAYCORE_URL ||
                'http://localhost:3001',

  neuroweaverUrl: import.meta.env.VITE_NEUROWEAVER_URL ||
                  process.env.NEUROWEAVER_URL ||
                  'http://localhost:3002',

  // Workflow configuration
  defaultWorkflowTimeout: parseInt(import.meta.env.VITE_N8N_WORKFLOW_TIMEOUT || '30000'),
  maxRetries: parseInt(import.meta.env.VITE_N8N_MAX_RETRIES || '3'),
  enableCaching: import.meta.env.VITE_N8N_ENABLE_CACHING !== 'false',

  // Feature flags
  enableTemplateImport: import.meta.env.VITE_N8N_ENABLE_TEMPLATES !== 'false',
  enableWorkflowExecution: import.meta.env.VITE_N8N_ENABLE_EXECUTION !== 'false',
  enableMCPIntegration: import.meta.env.VITE_N8N_ENABLE_MCP !== 'false',
};

// Validation with detailed error messages
export const validateN8nConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!n8nConfig.apiUrl) {
    errors.push('n8n API URL is not configured. Set VITE_N8N_API_URL or N8N_API_URL environment variable.');
  }

  if (!n8nConfig.apiKey) {
    errors.push('n8n API Key is not configured. Set VITE_N8N_API_KEY or N8N_API_KEY environment variable, or configure via N8nManagementPage.');
  }

  if (n8nConfig.defaultWorkflowTimeout < 1000 || n8nConfig.defaultWorkflowTimeout > 300000) {
    errors.push('n8n workflow timeout must be between 1000ms and 300000ms.');
  }

  if (n8nConfig.maxRetries < 0 || n8nConfig.maxRetries > 10) {
    errors.push('n8n max retries must be between 0 and 10.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Auto-validation on import
const configValidation = validateN8nConfig();
if (!configValidation.isValid) {


}

export default n8nConfig;

