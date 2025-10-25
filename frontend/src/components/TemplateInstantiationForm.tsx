import React, { useState, useEffect, useCallback } from "react";
import {
  Template,
  TemplateParameter,
  TemplateInstantiateRequest,
} from "../types/template";
import { WorkflowDefinition } from "../types/workflow";
import { getTemplate, instantiateTemplate } from "../api/templates";

interface TemplateInstantiationFormProps {
  templateId: string;
  onSuccess: (workflowId: string) => void;
  onCancel: () => void;
  className?: string;
}

interface FormErrors {
  [key: string]: string;
}

interface FormData {
  [key: string]:
    | string
    | number
    | boolean
    | unknown[]
    | Record<string, unknown>;
}

const TemplateInstantiationForm: React.FC<TemplateInstantiationFormProps> = ({
  templateId,
  onSuccess,
  onCancel,
  className = "",
}) => {
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  // const [currentStep, setCurrentStep] = useState(0); // For future multi-step wizard implementation
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Load template data
  const loadTemplate = useCallback(async () => {
    try {
      setIsLoading(true);
      setGeneralError(null);
      const templateData = await getTemplate(templateId);
      setTemplate(templateData);

      // Initialize form data with default values
      const initialFormData: FormData = {};
      templateData.parameters.forEach((param) => {
        if (param.defaultValue !== undefined) {
          initialFormData[param.name] = param.defaultValue;
        } else {
          // Set appropriate default values based on type
          switch (param.parameterType) {
            case "string":
              initialFormData[param.name] = "";
              break;
            case "number":
              initialFormData[param.name] = 0;
              break;
            case "boolean":
              initialFormData[param.name] = false;
              break;
            case "array":
              initialFormData[param.name] = [];
              break;
            case "object":
              initialFormData[param.name] = {};
              break;
            default:
              initialFormData[param.name] = "";
          }
        }
      });
      setFormData(initialFormData);

      // Set default workflow name based on template
      setWorkflowName(
        `${templateData.name} - ${new Date().toLocaleDateString()}`,
      );
    } catch (error) {

      setGeneralError("Failed to load template. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Validation functions
  const validateField = (
    name: string,
    value: unknown,
    parameter: TemplateParameter,
  ): string | null => {
    // Required validation
    if (
      parameter.isRequired &&
      (value === "" || value === null || value === undefined)
    ) {
      return `${parameter.name} is required`;
    }

    // Skip further validation if field is empty and not required
    if (
      !parameter.isRequired &&
      (value === "" || value === null || value === undefined)
    ) {
      return null;
    }

    // Type validation
    switch (parameter.parameterType) {
      case "number":
        if (
          value !== "" &&
          value !== null &&
          value !== 0 &&
          isNaN(Number(value))
        ) {
          return `${parameter.name} must be a valid number`;
        }
        break;
      case "string":
        if (typeof value !== "string" && value !== "") {
          return `${parameter.name} must be a text value`;
        }
        break;
      case "boolean":
        if (typeof value !== "boolean") {
          return `${parameter.name} must be true or false`;
        }
        break;
    }

    // Custom validation rules - check for number values specifically
    if (
      parameter.validationRules &&
      value !== "" &&
      value !== null &&
      value !== undefined
    ) {
      const rules = parameter.validationRules;

      if (rules.min !== undefined && Number(value) < Number(rules.min)) {
        return `${parameter.name} must be at least ${rules.min}`;
      }

      if (rules.max !== undefined && Number(value) > Number(rules.max)) {
        return `${parameter.name} must be no more than ${rules.max}`;
      }

      if (
        rules.minLength !== undefined &&
        String(value).length < Number(rules.minLength)
      ) {
        return `${parameter.name} must be at least ${rules.minLength} characters`;
      }

      if (
        rules.maxLength !== undefined &&
        String(value).length > Number(rules.maxLength)
      ) {
        return `${parameter.name} must be no more than ${rules.maxLength} characters`;
      }

      if (
        rules.pattern &&
        !new RegExp(String(rules.pattern)).test(String(value))
      ) {
        return `${parameter.name} format is invalid`;
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    if (!template) return false;

    const newErrors: FormErrors = {};

    // Validate workflow name
    if (!workflowName.trim()) {
      newErrors.workflowName = "Workflow name is required";
    }

    // Validate all parameters
    template.parameters.forEach((param) => {
      const error = validateField(param.name, formData[param.name], param);
      if (error) {
        newErrors[param.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form field handlers
  const handleFieldChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleWorkflowNameChange = (value: string) => {
    setWorkflowName(value);
    if (errors.workflowName) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.workflowName;
        return newErrors;
      });
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setGeneralError(null);

      const instantiateRequest: TemplateInstantiateRequest = {
        name: workflowName.trim(),
        description: workflowDescription.trim() || undefined,
        parameterValues: formData,
      };

      const workflow: WorkflowDefinition = await instantiateTemplate(
        templateId,
        instantiateRequest,
      );

      if (workflow.id) {
        onSuccess(workflow.id);
      } else {
        throw new Error("Workflow creation failed - no ID returned");
      }
    } catch (error) {

      setGeneralError("Failed to create workflow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form field based on parameter type
  const renderFormField = (parameter: TemplateParameter) => {
    const value = formData[parameter.name];
    const error = errors[parameter.name];
    const fieldId = `field-${parameter.name}`;

    const baseInputClasses = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
      error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:border-indigo-500"
    }`;

    switch (parameter.parameterType) {
      case "string":
        if (parameter.validationRules?.multiline) {
          return (
            <textarea
              id={fieldId}
              value={String(value || "")}
              onChange={(e) =>
                handleFieldChange(parameter.name, e.target.value)
              }
              placeholder={parameter.description}
              rows={4}
              className={baseInputClasses}
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
          );
        }
        return (
          <input
            type="text"
            id={fieldId}
            value={String(value || "")}
            onChange={(e) => handleFieldChange(parameter.name, e.target.value)}
            placeholder={parameter.description}
            className={baseInputClasses}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        );

      case "number":
        return (
          <input
            type="number"
            id={fieldId}
            value={value === 0 ? "0" : String(value || "")}
            onChange={(e) =>
              handleFieldChange(
                parameter.name,
                e.target.value ? Number(e.target.value) : "",
              )
            }
            placeholder={parameter.description}
            min={parameter.validationRules?.min as number}
            max={parameter.validationRules?.max as number}
            className={baseInputClasses}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={fieldId}
              checked={Boolean(value)}
              onChange={(e) =>
                handleFieldChange(parameter.name, e.target.checked)
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              aria-describedby={error ? `${fieldId}-error` : undefined}
            />
            <label
              htmlFor={fieldId}
              className="ml-2 block text-sm text-gray-700"
            >
              {parameter.description || "Enable this option"}
            </label>
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={fieldId}
            value={String(value || "")}
            onChange={(e) => handleFieldChange(parameter.name, e.target.value)}
            placeholder={parameter.description}
            className={baseInputClasses}
            aria-describedby={error ? `${fieldId}-error` : undefined}
          />
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading template...</span>
      </div>
    );
  }

  // Error state
  if (generalError && !template) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
      >
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{generalError}</p>
            <button
              onClick={loadTemplate}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Create Workflow from Template
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure parameters for &quot;{template.name}&quot; template
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* General Error */}
        {generalError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{generalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Workflow Details */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-900">
            Workflow Details
          </h3>

          <div>
            <label
              htmlFor="workflow-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Workflow Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="workflow-name"
              value={workflowName}
              onChange={(e) => handleWorkflowNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                errors.workflowName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500"
              }`}
              aria-describedby={
                errors.workflowName ? "workflow-name-error" : undefined
              }
            />
            {errors.workflowName && (
              <p id="workflow-name-error" className="mt-1 text-sm text-red-600">
                {errors.workflowName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="workflow-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description (Optional)
            </label>
            <textarea
              id="workflow-description"
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Describe what this workflow does..."
            />
          </div>
        </div>

        {/* Template Parameters */}
        {template.parameters.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">
              Template Parameters
            </h3>

            {template.parameters.map((parameter) => (
              <div key={parameter.id}>
                <label
                  htmlFor={`field-${parameter.name}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {parameter.name}
                  {parameter.isRequired && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {parameter.description && (
                  <p className="text-xs text-gray-500 mb-2">
                    {parameter.description}
                  </p>
                )}

                {renderFormField(parameter)}

                {errors[parameter.name] && (
                  <p
                    id={`field-${parameter.name}-error`}
                    className="mt-1 text-sm text-red-600"
                  >
                    {errors[parameter.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Workflow...
              </span>
            ) : (
              "Create Workflow"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateInstantiationForm;


