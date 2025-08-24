import React, { useState, useEffect } from 'react';
import { getWorkflow, executeWorkflow } from '../api/workflows';
import { WorkflowDefinition } from '../types/workflow';

// Interface for API error responses
interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: string;
    };
  };
}

interface WorkflowExecutionFormProps {
  workflowId: string;
  onExecutionStart?: (executionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FormField {
  name: string;
  type: 'text' | 'number' | 'email' | 'textarea';
  label: string;
  required: boolean;
  placeholder?: string;
}

const WorkflowExecutionForm: React.FC<WorkflowExecutionFormProps> = ({
  workflowId,
  onExecutionStart,
  onError,
  className = ''
}) => {
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const workflowData = await getWorkflow(workflowId);
        setWorkflow(workflowData);
        
        // Extract input parameters from workflow definition
        const fields = extractFormFields(workflowData);
        setFormFields(fields);
        
        // Initialize form data with empty values
        const initialData: Record<string, unknown> = {};
        fields.forEach(field => {
          initialData[field.name] = field.type === 'number' ? 0 : '';
        });
        setFormData(initialData);
        
      } catch (err: unknown) {
        const apiError = err as ApiErrorResponse;
        const errorMessage = apiError?.response?.data?.detail || (err instanceof Error ? err.message : 'Failed to load workflow');
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (workflowId) {
      fetchWorkflow();
    }
  }, [workflowId, onError]);

  const extractFormFields = (workflow: WorkflowDefinition): FormField[] => {
    const fields: FormField[] = [];
    
    // Look for workflow parameters
    if (workflow.parameters) {
      Object.entries(workflow.parameters).forEach(([key, config]) => {
        if (typeof config === 'object' && config !== null) {
          const configObj = config as Record<string, unknown>;
          fields.push({
            name: key,
            type: (configObj.type as FormField['type']) || 'text',
            label: (configObj.label as string) || key,
            required: (configObj.required as boolean) || false,
            placeholder: configObj.placeholder as string
          });
        } else {
          // Simple parameter definition
          fields.push({
            name: key,
            type: 'text',
            label: key,
            required: true
          });
        }
      });
    }
    
    // Look for input requirements in start step
    const startStep = workflow.steps.find(step => step.type === 'start');
    if (startStep?.config?.parameters) {
      Object.entries(startStep.config.parameters).forEach(([key, config]) => {
        if (!fields.find(f => f.name === key)) {
          if (typeof config === 'object' && config !== null) {
            fields.push({
              name: key,
              type: (config as Record<string, unknown>).type as FormField['type'] || 'text',
              label: (config as Record<string, unknown>).label as string || key,
              required: (config as Record<string, unknown>).required as boolean || false,
              placeholder: (config as Record<string, unknown>).placeholder as string
            });
          } else {
            fields.push({
              name: key,
              type: 'text',
              label: key,
              required: true
            });
          }
        }
      });
    }
    
    // If no parameters found, add a default input field
    if (fields.length === 0) {
      fields.push({
        name: 'input',
        type: 'textarea',
        label: 'Input',
        required: true,
        placeholder: 'Enter your input here...'
      });
    }
    
    return fields;
  };

  const handleInputChange = (name: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear success message when user starts typing
    if (success) {
      setSuccess(null);
    }
  };

  const validateForm = (): string | null => {
    for (const field of formFields) {
      if (field.required && (!formData[field.name] || String(formData[field.name]).trim() === '')) {
        return `${field.label} is required`;
      }
      
      if (field.type === 'email' && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(formData[field.name]))) {
          return `${field.label} must be a valid email address`;
        }
      }
      
      if (field.type === 'number' && formData[field.name] !== '' && isNaN(Number(formData[field.name]))) {
        return `${field.label} must be a valid number`;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Convert form data to appropriate types
      const processedData: Record<string, unknown> = {};
      formFields.forEach(field => {
        let value = formData[field.name];
        if (field.type === 'number' && value !== '') {
          value = Number(value);
        }
        processedData[field.name] = value;
      });
      
      const execution = await executeWorkflow(workflowId, processedData);
      
      setSuccess(`Workflow execution started successfully! Execution ID: ${execution.id}`);
      onExecutionStart?.(execution.id);
      
      // Reset form after successful submission
      const resetData: Record<string, unknown> = {};
      formFields.forEach(field => {
        resetData[field.name] = field.type === 'number' ? 0 : '';
      });
      setFormData(resetData);
      
    } catch (err: unknown) {
      const apiError = err as ApiErrorResponse;
      const errorMessage = apiError?.response?.data?.detail || (err instanceof Error ? err.message : 'Failed to execute workflow');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading workflow...</span>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Failed to load workflow</p>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Execute Workflow</h2>
        <h3 className="text-lg font-semibold text-gray-700">{workflow.name}</h3>
        {workflow.description && (
          <p className="text-gray-600 mt-1">{workflow.description}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {formFields.map((field) => (
          <div key={field.name}>
            <label 
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={String(formData[field.name] || '')}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={String(formData[field.name] || '')}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              const resetData: { [key: string]: string | number } = {};
              formFields.forEach(field => {
                resetData[field.name] = field.type === 'number' ? 0 : '';
              });
              setFormData(resetData);
              setError(null);
              setSuccess(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Executing...
              </>
            ) : (
              'Execute Workflow'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkflowExecutionForm;