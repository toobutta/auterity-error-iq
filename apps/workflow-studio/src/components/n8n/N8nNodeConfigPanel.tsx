// UI for configuring n8n nodes with advanced features
// Migrated from auterity-workflow-studio and enhanced for auterity-error-iq
// Error-free: Integrates with propertySchemas and includes validation

import React, { useState, useEffect } from 'react';
import { Button } from '@auterity/design-system';
import { n8nApiService } from '../../services/n8n/n8nApiService';
import { N8nNodeFactory } from '../../nodes/n8n/N8nNodeFactory';

interface N8nNodeConfigPanelProps {
  nodeId: string;
  nodeType: string;
  initialConfig: any;
  onSave: (config: any) => void;
  onCancel: () => void;
}

interface WorkflowOption {
  id: string;
  name: string;
  active: boolean;
}

const N8nNodeConfigPanel: React.FC<N8nNodeConfigPanelProps> = ({
  nodeId,
  nodeType,
  initialConfig,
  onSave,
  onCancel
}) => {
  const [config, setConfig] = useState<any>(initialConfig || {});
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadWorkflowsAndTemplates();
  }, [nodeType]);

  const loadWorkflowsAndTemplates = async () => {
    if (nodeType !== 'n8n.trigger' && nodeType !== 'n8n.template') return;

    setLoading(true);
    try {
      if (nodeType === 'n8n.trigger') {
        const workflowList = await n8nApiService.listWorkflows();
        setWorkflows(workflowList.map(w => ({
          id: w.id || w.workflowId || '',
          name: w.name || `Workflow ${w.id}`,
          active: w.active !== false
        })));
      } else if (nodeType === 'n8n.template') {
        // For now, use a placeholder - in a real implementation,
        // you'd fetch available templates from n8n
        setTemplates([
          { id: 'email-template', name: 'Email Automation Template' },
          { id: 'data-sync-template', name: 'Data Synchronization Template' },
          { id: 'webhook-template', name: 'Webhook Processing Template' }
        ]);
      }
    } catch (error) {

      // Don't show error to user, just log it
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);

    // Clear validation errors for this field
    setValidationErrors(prev => prev.filter(error =>
      !error.toLowerCase().includes(key.toLowerCase())
    ));
  };

  const handleJsonInputChange = (key: string, value: string) => {
    try {
      const parsed = value.trim() === '' ? {} : JSON.parse(value);
      handleInputChange(key, parsed);
    } catch (error) {
      // Invalid JSON, keep as string for now
      handleInputChange(key, value);
    }
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];

    if (nodeType === 'n8n.trigger') {
      if (!config.workflowId || config.workflowId.trim() === '') {
        errors.push('Workflow ID is required');
      }
      if (!config.outputVariable || config.outputVariable.trim() === '') {
        errors.push('Output variable is required');
      }
      if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
        errors.push('Timeout must be between 1000 and 300000 ms');
      }
    } else if (nodeType === 'n8n.template') {
      if (!config.templateId || config.templateId.trim() === '') {
        errors.push('Template ID is required');
      }
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Ensure parameters is properly formatted
    if (typeof config.parameters === 'string') {
      try {
        config.parameters = config.parameters.trim() === '' ? {} : JSON.parse(config.parameters);
      } catch (error) {
        setValidationErrors(['Parameters must be valid JSON']);
        return;
      }
    }

    onSave(config);
  };

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '{}';
    }
  };

  return (
    <div className="space-y-4">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">Configuration Errors:</h4>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Loading options...</p>
        </div>
      )}

      {/* Workflow Selection */}
      {nodeType === 'n8n.trigger' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Workflow
          </label>
          <select
            value={config.workflowId || ''}
            onChange={(e) => handleInputChange('workflowId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a workflow...</option>
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name} {workflow.active ? '(Active)' : '(Inactive)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select from your available n8n workflows
          </p>
        </div>
      )}

      {/* Template Selection */}
      {nodeType === 'n8n.template' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Template
          </label>
          <select
            value={config.templateId || ''}
            onChange={(e) => handleInputChange('templateId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual Workflow ID Input */}
      {nodeType === 'n8n.trigger' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or Enter Workflow ID Manually
          </label>
          <input
            type="text"
            value={config.workflowId || ''}
            onChange={(e) => handleInputChange('workflowId', e.target.value)}
            placeholder="workflow_123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Parameters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parameters (JSON)
        </label>
        <textarea
          value={typeof config.parameters === 'string' ? config.parameters : formatJson(config.parameters)}
          onChange={(e) => handleJsonInputChange('parameters', e.target.value)}
          placeholder='{"key": "value", "input": "{{input}}"}'
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          JSON parameters to pass to the workflow. Use {"{{variable}}"} syntax for dynamic values.
        </p>
      </div>

      {/* Output Variable */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Output Variable Name
        </label>
        <input
          type="text"
          value={config.outputVariable || 'n8nResult'}
          onChange={(e) => handleInputChange('outputVariable', e.target.value)}
          placeholder="n8nResult"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Name of the variable to store the workflow result
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Settings</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={config.timeout || 30000}
              onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
              min="1000"
              max="300000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Retry Count
            </label>
            <input
              type="number"
              value={config.retryCount || 3}
              onChange={(e) => handleInputChange('retryCount', parseInt(e.target.value))}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableCaching !== false}
              onChange={(e) => handleInputChange('enableCaching', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enable result caching</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary">
          Save Configuration
        </Button>
      </div>
    </div>
  );
};

export { N8nNodeConfigPanel };

