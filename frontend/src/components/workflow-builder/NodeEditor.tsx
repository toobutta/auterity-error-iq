import React, { useState, useEffect } from "react";
import { NodeEditorProps } from "../../types/workflow-builder";
// TODO: Re-enable when needed
// import { WorkflowNode, NodeConfig } from '../../types/workflow-builder';

interface FormFieldProps {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "multiselect";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  description?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  placeholder,
  required = false,
  description,
}) => {
  const renderInput = () => {
    switch (type) {
      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[80px]"
            required={required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={required}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={required}
          >
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(
                        currentValues.filter((v: string) => v !== option.value),
                      );
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={required}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      {type !== "checkbox" && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );
};

const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [localData, setLocalData] = useState(node?.data || null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalData(node?.data || null);
    setHasChanges(false);
  }, [node]);

  if (!node || !localData) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500 p-8">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <p className="text-sm">Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: unknown) => {
    const newData = {
      ...localData,
      config: {
        ...localData.config,
        [field]: value,
      },
    };
    setLocalData(newData);
    setHasChanges(true);
  };

  const handleBasicFieldChange = (field: string, value: unknown) => {
    const newData = {
      ...localData,
      [field]: value,
    };
    setLocalData(newData);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (localData) {
      onUpdate(node.id, localData);
      setHasChanges(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this node?")) {
      onDelete(node.id);
    }
  };

  const renderConfigFields = () => {
    const nodeType = localData.type as string;
    const config = localData.config || {};

    // Use string comparison for automotive node types
    if (nodeType === "customer_inquiry") {
      return (
        <>
          <FormField
            label="Inquiry Sources"
            value={config.customerInquiry?.sources || []}
            onChange={(value) =>
              handleFieldChange("customerInquiry", {
                ...config.customerInquiry,
                sources: value,
              })
            }
            type="multiselect"
            options={[
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
              { value: "web_form", label: "Web Form" },
              { value: "chat", label: "Live Chat" },
            ]}
            description="Select which inquiry sources to monitor"
          />
        </>
      );
    } else if (nodeType === "inventory_update") {
      return (
        <>
          <FormField
            label="Event Types"
            value={config.inventoryUpdate?.eventTypes || []}
            onChange={(value) =>
              handleFieldChange("inventoryUpdate", {
                ...config.inventoryUpdate,
                eventTypes: value,
              })
            }
            type="multiselect"
            options={[
              { value: "new_arrival", label: "New Arrival" },
              { value: "price_change", label: "Price Change" },
              { value: "status_change", label: "Status Change" },
            ]}
            description="Select which inventory events to monitor"
          />
          <FormField
            label="Vehicle Make Filter"
            value={
              config.inventoryUpdate?.vehicleFilters?.make?.join(", ") || ""
            }
            onChange={(value) =>
              handleFieldChange("inventoryUpdate", {
                ...config.inventoryUpdate,
                vehicleFilters: {
                  ...config.inventoryUpdate?.vehicleFilters,
                  make: value
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            placeholder="Toyota, Honda, Ford (comma-separated)"
            description="Filter by vehicle makes (leave empty for all)"
          />
        </>
      );
    } else if (nodeType === "send_email") {
      return (
        <>
          <FormField
            label="Email Subject"
            value={config.emailTemplate?.subject || ""}
            onChange={(value) =>
              handleFieldChange("emailTemplate", {
                ...config.emailTemplate,
                subject: value,
              })
            }
            placeholder="Thank you for your inquiry"
            required
          />
          <FormField
            label="Email Body"
            value={config.emailTemplate?.body || ""}
            onChange={(value) =>
              handleFieldChange("emailTemplate", {
                ...config.emailTemplate,
                body: value,
              })
            }
            type="textarea"
            placeholder="Dear {{customer_name}},..."
            required
            description="Use {{variable_name}} for dynamic content"
          />
          <FormField
            label="Recipients"
            value={config.emailTemplate?.recipients?.join(", ") || ""}
            onChange={(value) =>
              handleFieldChange("emailTemplate", {
                ...config.emailTemplate,
                recipients: value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="customer@email.com, manager@dealership.com"
            description="Comma-separated email addresses"
          />
        </>
      );
    } else if (nodeType === "update_crm") {
      return (
        <>
          <FormField
            label="Lead Score"
            value={config.crmFields?.leadScore || 0}
            onChange={(value) =>
              handleFieldChange("crmFields", {
                ...config.crmFields,
                leadScore: value,
              })
            }
            type="number"
            placeholder="0-100"
            description="Lead qualification score (0-100)"
          />
          <FormField
            label="Customer Status"
            value={config.crmFields?.status || ""}
            onChange={(value) =>
              handleFieldChange("crmFields", {
                ...config.crmFields,
                status: value,
              })
            }
            type="select"
            options={[
              { value: "new", label: "New" },
              { value: "contacted", label: "Contacted" },
              { value: "qualified", label: "Qualified" },
              { value: "negotiating", label: "Negotiating" },
              { value: "closed", label: "Closed" },
              { value: "lost", label: "Lost" },
            ]}
            required
          />
          <FormField
            label="Notes"
            value={config.crmFields?.notes || ""}
            onChange={(value) =>
              handleFieldChange("crmFields", {
                ...config.crmFields,
                notes: value,
              })
            }
            type="textarea"
            placeholder="Additional notes about the customer..."
          />
          <FormField
            label="Tags"
            value={config.crmFields?.tags?.join(", ") || ""}
            onChange={(value) =>
              handleFieldChange("crmFields", {
                ...config.crmFields,
                tags: value
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="hot-lead, financing-needed, trade-in"
            description="Comma-separated tags"
          />
        </>
      );
    } else if (nodeType === "schedule_appointment") {
      return (
        <>
          <FormField
            label="Appointment Type"
            value={config.scheduleAppointment?.appointmentType || ""}
            onChange={(value) =>
              handleFieldChange("scheduleAppointment", {
                ...config.scheduleAppointment,
                appointmentType: value,
              })
            }
            type="select"
            options={[
              { value: "sales", label: "Sales Meeting" },
              { value: "service", label: "Service Appointment" },
              { value: "test_drive", label: "Test Drive" },
            ]}
            required
          />
          <FormField
            label="Duration (minutes)"
            value={config.scheduleAppointment?.duration || 60}
            onChange={(value) =>
              handleFieldChange("scheduleAppointment", {
                ...config.scheduleAppointment,
                duration: value,
              })
            }
            type="number"
            placeholder="60"
            required
          />
          <FormField
            label="Location"
            value={config.scheduleAppointment?.location || ""}
            onChange={(value) =>
              handleFieldChange("scheduleAppointment", {
                ...config.scheduleAppointment,
                location: value,
              })
            }
            placeholder="Main Showroom"
          />
          <FormField
            label="Auto Confirm"
            value={config.scheduleAppointment?.autoConfirm || false}
            onChange={(value) =>
              handleFieldChange("scheduleAppointment", {
                ...config.scheduleAppointment,
                autoConfirm: value,
              })
            }
            type="checkbox"
          />
        </>
      );
    } else if (
      [
        "lead_qualification",
        "price_optimization",
        "customer_sentiment",
        "recommendation_engine",
      ].includes(nodeType)
    ) {
      return (
        <>
          <FormField
            label="AI Model"
            value={config.aiPrompt?.model || "gpt-4"}
            onChange={(value) =>
              handleFieldChange("aiPrompt", {
                ...config.aiPrompt,
                model: value,
              })
            }
            type="select"
            options={[
              { value: "gpt-4", label: "GPT-4" },
              { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
            ]}
          />
          <FormField
            label="AI Prompt"
            value={config.aiPrompt?.prompt || ""}
            onChange={(value) =>
              handleFieldChange("aiPrompt", {
                ...config.aiPrompt,
                prompt: value,
              })
            }
            type="textarea"
            placeholder="Analyze this data and provide insights..."
            required
            description="The prompt that will be sent to the AI model"
          />
          <FormField
            label="Temperature"
            value={config.aiPrompt?.temperature || 0.3}
            onChange={(value) =>
              handleFieldChange("aiPrompt", {
                ...config.aiPrompt,
                temperature: value,
              })
            }
            type="number"
            placeholder="0.3"
            description="Controls randomness (0.0 = deterministic, 1.0 = very random)"
          />
          <FormField
            label="Max Tokens"
            value={config.aiPrompt?.maxTokens || 500}
            onChange={(value) =>
              handleFieldChange("aiPrompt", {
                ...config.aiPrompt,
                maxTokens: value,
              })
            }
            type="number"
            placeholder="500"
            description="Maximum number of tokens in the response"
          />
        </>
      );
    } else if (
      [
        "customer_type",
        "budget_range",
        "vehicle_preference",
        "geographic_location",
      ].includes(nodeType)
    ) {
      return (
        <>
          <FormField
            label="Condition Field"
            value={config.conditions?.[0]?.field || ""}
            onChange={(value) => {
              const conditions = config.conditions || [{}];
              conditions[0] = { ...conditions[0], field: value };
              handleFieldChange("conditions", conditions);
            }}
            placeholder="customer_history, budget, vehicle_type"
            required
            description="The field to evaluate in the condition"
          />
          <FormField
            label="Operator"
            value={config.conditions?.[0]?.operator || "equals"}
            onChange={(value) => {
              const conditions = config.conditions || [{}];
              conditions[0] = { ...conditions[0], operator: value };
              handleFieldChange("conditions", conditions);
            }}
            type="select"
            options={[
              { value: "equals", label: "Equals" },
              { value: "contains", label: "Contains" },
              { value: "greater_than", label: "Greater Than" },
              { value: "less_than", label: "Less Than" },
              { value: "in", label: "In List" },
              { value: "not_in", label: "Not In List" },
            ]}
          />
          <FormField
            label="Value"
            value={config.conditions?.[0]?.value || ""}
            onChange={(value) => {
              const conditions = config.conditions || [{}];
              conditions[0] = { ...conditions[0], value: value };
              handleFieldChange("conditions", conditions);
            }}
            placeholder="null, 50000, sedan"
            description="The value to compare against"
          />
        </>
      );
    } else {
      return (
        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
          No specific configuration options available for this node type.
        </div>
      );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 flex items-center">
            <span className="text-xl mr-2">⚙️</span>
            Node Properties
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {localData.type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Properties */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Basic Properties</h4>
          <FormField
            label="Node Label"
            value={localData.label}
            onChange={(value) => handleBasicFieldChange("label", value)}
            placeholder="Enter node label"
            required
          />
          <FormField
            label="Description"
            value={localData.description || ""}
            onChange={(value) => handleBasicFieldChange("description", value)}
            type="textarea"
            placeholder="Describe what this node does..."
          />
        </div>

        {/* Node-specific Configuration */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
          {renderConfigFields()}
        </div>

        {/* Validation Errors */}
        {localData.validationErrors &&
          localData.validationErrors.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-red-600 mb-3">
                Validation Errors
              </h4>
              <div className="space-y-2">
                {localData.validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
        <button
          onClick={handleDelete}
          className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center justify-center space-x-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <span>Delete Node</span>
        </button>

        {hasChanges && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            You have unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeEditor;


