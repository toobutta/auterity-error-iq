import React, { useState, useCallback } from "react";
import { useNotificationHelpers } from "../notifications/NotificationSystem";

// Enhanced form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface FieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "file";
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
  validation?: ValidationRule;
  defaultValue?: string | number | boolean | File | null;
  disabled?: boolean;
  helpText?: string;
}

export interface FormConfig {
  title: string;
  description?: string;
  fields: FieldConfig[];
  submitText?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface FormErrors {
  [fieldName: string]: string;
}

interface FormData {
  [fieldName: string]: string | number | boolean | File | null;
}

export const EnhancedForm: React.FC<FormConfig> = ({
  title,
  description,
  fields,
  submitText = "Submit",
  onSubmit,
  autoSave = false,
  autoSaveInterval = 5000,
}) => {
  const { success, error, info } = useNotificationHelpers();

  // Initialize form data with default values
  const [formData, setFormData] = useState<FormData>(() => {
    const initial: FormData = {};
    fields.forEach((field) => {
      initial[field.name] =
        field.defaultValue || (field.type === "checkbox" ? false : "");
    });
    return initial;
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Validation logic
  const validateField = useCallback(
    (field: FieldConfig, value: unknown): string | null => {
      const { validation } = field;
      if (!validation) return null;

      // Required validation
      if (
        validation.required &&
        (!value || (typeof value === "string" && value.trim() === ""))
      ) {
        return `${field.label} is required`;
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return null;
      }

      // String validations
      if (typeof value === "string") {
        if (validation.minLength && value.length < validation.minLength) {
          return `${field.label} must be at least ${validation.minLength} characters`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          return `${field.label} must be no more than ${validation.maxLength} characters`;
        }
        if (validation.pattern && !validation.pattern.test(value)) {
          return `${field.label} format is invalid`;
        }
      }

      // Custom validation
      if (validation.custom) {
        return validation.custom(value);
      }

      return null;
    },
    [],
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  }, [fields, formData, validateField]);

  // Handle field changes
  const handleFieldChange = useCallback(
    (fieldName: string, value: string | number | boolean | File | null) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));

      // Mark field as touched
      setTouchedFields((prev) => new Set(prev).add(fieldName));

      // Validate field on change if it was previously touched
      if (touchedFields.has(fieldName)) {
        const field = fields.find((f) => f.name === fieldName);
        if (field) {
          const error = validateField(field, value);
          setErrors((prev) => ({
            ...prev,
            [fieldName]: error || "",
          }));
        }
      }
    },
    [fields, touchedFields, validateField],
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error("Validation Error", "Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      success("Success", "Form submitted successfully");
    } catch (err) {
      error("Submission Error", "Failed to submit form. Please try again.");

    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-save functionality
  React.useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(async () => {
      if (Object.keys(formData).some((key) => formData[key] !== "")) {
        setIsAutoSaving(true);
        try {
          // In a real app, this would save to localStorage or backend
          localStorage.setItem(`form-draft-${title}`, JSON.stringify(formData));
          info("Auto-saved", "Your progress has been saved", {
            duration: 2000,
          });
        } catch (err) {

        } finally {
          setIsAutoSaving(false);
        }
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, formData, title, info]);

  // Load draft on mount
  React.useEffect(() => {
    if (autoSave) {
      try {
        const draft = localStorage.getItem(`form-draft-${title}`);
        if (draft) {
          const draftData = JSON.parse(draft);
          setFormData((prev) => ({ ...prev, ...draftData }));
          info("Draft Loaded", "Your previous progress has been restored");
        }
      } catch (err) {

      }
    }
  }, [autoSave, title, info]);

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    const hasError = errors[field.name] && touchedFields.has(field.name);
    const value = formData[field.name];

    const commonProps = {
      id: field.name,
      name: field.name,
      disabled: field.disabled || isSubmitting,
      className: `w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        hasError
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      } text-gray-900 dark:text-gray-100`,
      onBlur: () => setTouchedFields((prev) => new Set(prev).add(field.name)),
    };

    switch (field.type) {
      case "select":
        return (
          <select
            {...commonProps}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          >
            <option value="">
              {field.placeholder || `Select ${field.label}`}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "textarea":
        return (
          <textarea
            {...commonProps}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={4}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={value}
              disabled={field.disabled || isSubmitting}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor={field.name}
              className="ml-2 text-gray-700 dark:text-gray-300"
            >
              {field.label}
            </label>
          </div>
        );

      case "file":
        return (
          <input
            type="file"
            {...commonProps}
            onChange={(e) => handleFieldChange(field.name, e.target.files?.[0])}
            className={`${commonProps.className} file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
          />
        );

      default:
        return (
          <input
            type={field.type}
            {...commonProps}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
        {autoSave && (
          <div className="mt-2 flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${isAutoSaving ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isAutoSaving ? "Auto-saving..." : "Auto-save enabled"}
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field) => (
          <div key={field.name}>
            {field.type !== "checkbox" && (
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {field.label}
                {field.validation?.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
            )}

            {renderField(field)}

            {/* Help text */}
            {field.helpText && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {field.helpText}
              </p>
            )}

            {/* Error message */}
            {errors[field.name] && touchedFields.has(field.name) && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}

        {/* Submit button */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : (
              submitText
            )}
          </button>

          {autoSave && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(`form-draft-${title}`);
                setFormData(() => {
                  const initial: FormData = {};
                  fields.forEach((field) => {
                    initial[field.name] =
                      field.defaultValue ||
                      (field.type === "checkbox" ? false : "");
                  });
                  return initial;
                });
                info("Draft Cleared", "Form has been reset");
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear Draft
            </button>
          )}
        </div>
      </form>
    </div>
  );
};


