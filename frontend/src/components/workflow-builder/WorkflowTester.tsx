import React, { useState, useEffect, useCallback } from "react";
import { WorkflowTesterProps } from "../../types/workflow-builder";
import { WorkflowExecution } from "../../types/workflow";
// TODO: Re-enable when needed
// import { executeWorkflow } from '../../api/workflows';
import {
  wsClient,
  connectToExecutionStatus,
  subscribeToStatusUpdates,
} from "../../api/websocket";
import WorkflowExecutionResults from "../WorkflowExecutionResults";

interface TestInputField {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: unknown;
}

const WorkflowTester: React.FC<WorkflowTesterProps> = ({
  workflow,
  onExecute,
  isExecuting = false,
}) => {
  const [testInputs, setTestInputs] = useState<Record<string, unknown>>({});
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [, setExecution] = useState<WorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Define test input fields based on workflow triggers
  const getTestInputFields = useCallback((): TestInputField[] => {
    const fields: TestInputField[] = [];

    // Add common automotive workflow inputs
    fields.push(
      {
        name: "customer_name",
        type: "string",
        label: "Customer Name",
        description: "Full name of the customer",
        required: true,
        defaultValue: "John Smith",
      },
      {
        name: "customer_email",
        type: "string",
        label: "Customer Email",
        description: "Customer email address",
        required: true,
        defaultValue: "john.smith@email.com",
      },
      {
        name: "customer_phone",
        type: "string",
        label: "Customer Phone",
        description: "Customer phone number",
        required: false,
        defaultValue: "(555) 123-4567",
      },
      {
        name: "inquiry_type",
        type: "string",
        label: "Inquiry Type",
        description: "Type of customer inquiry",
        required: false,
        defaultValue: "sales",
      },
      {
        name: "budget_max",
        type: "number",
        label: "Maximum Budget",
        description: "Customer maximum budget",
        required: false,
        defaultValue: 35000,
      },
      {
        name: "vehicle_preference",
        type: "object",
        label: "Vehicle Preferences",
        description: "Customer vehicle preferences (JSON)",
        required: false,
        defaultValue: {
          make: "Toyota",
          type: "sedan",
          features: ["automatic", "bluetooth"],
        },
      },
    );

    // Add specific fields based on workflow triggers
    workflow.steps.forEach((step) => {
      const stepType = step.type as string;
      if (stepType === "customer_inquiry") {
        // Already covered by common fields
      } else if (stepType === "inventory_update") {
        fields.push({
          name: "vehicle_data",
          type: "object",
          label: "Vehicle Data",
          description: "Vehicle information for inventory update",
          required: true,
          defaultValue: {
            vin: "1HGBH41JXMN109186",
            make: "Honda",
            model: "Civic",
            year: 2023,
            price: 28500,
            status: "available",
          },
        });
      } else if (stepType === "service_appointment") {
        fields.push({
          name: "appointment_data",
          type: "object",
          label: "Appointment Data",
          description: "Service appointment information",
          required: true,
          defaultValue: {
            service_type: "maintenance",
            scheduled_date: new Date().toISOString().split("T")[0],
            vehicle_vin: "1HGBH41JXMN109186",
          },
        });
      }
    });

    return fields;
  }, [workflow.steps]);

  const inputFields = getTestInputFields();

  // Initialize test inputs with default values
  useEffect(() => {
    const defaultInputs: Record<string, unknown> = {};
    inputFields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaultInputs[field.name] = field.defaultValue;
      }
    });
    setTestInputs(defaultInputs);
  }, [inputFields]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (executionId) {
      const connectAndSubscribe = async () => {
        try {
          await connectToExecutionStatus(executionId);

          const unsubscribe = subscribeToStatusUpdates((statusUpdate) => {
            setExecution((prev) =>
              prev ? { ...prev, ...statusUpdate } : statusUpdate,
            );

            if (
              statusUpdate.status === "completed" ||
              statusUpdate.status === "failed"
            ) {
              setIsRunning(false);
            }
          });

          return unsubscribe;
        } catch (error) {

          setError("Failed to connect to real-time updates");
        }
      };

      connectAndSubscribe();
    }

    return () => {
      wsClient.disconnect();
    };
  }, [executionId]);

  const handleInputChange = (fieldName: string, value: unknown) => {
    setTestInputs((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleExecute = async () => {
    setError(null);
    setLogs([]);
    setIsRunning(true);

    try {
      // Validate required fields
      const missingFields = inputFields
        .filter((field) => field.required && !testInputs[field.name])
        .map((field) => field.label);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Execute workflow
      const newExecutionId = await onExecute(testInputs);
      setExecutionId(newExecutionId);

      // Add initial log
      setLogs((prev) => [
        ...prev,
        `🚀 Workflow execution started (ID: ${newExecutionId})`,
      ]);
    } catch (error) {

      setError(error instanceof Error ? error.message : "Execution failed");
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    // TODO: Implement workflow cancellation
    setIsRunning(false);
    setLogs((prev) => [...prev, "⏹️ Workflow execution stopped by user"]);
  };

  const renderInputField = (field: TestInputField) => {
    const value = testInputs[field.name];

    switch (field.type) {
      case "string":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.description}
            required={field.required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleInputChange(field.name, Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={field.description}
            required={field.required}
          />
        );

      case "boolean":
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.description}</span>
          </label>
        );

      case "object":
        return (
          <textarea
            value={
              typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : value || ""
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(field.name, parsed);
              } catch {
                handleInputChange(field.name, e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-vertical min-h-[100px]"
            placeholder={field.description}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-t border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center">
            <span className="text-xl mr-2">🧪</span>
            Workflow Tester
          </h3>
          <div className="flex items-center space-x-2">
            {isRunning && (
              <div className="flex items-center space-x-2 text-blue-600">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-sm">Running...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Test Inputs Panel */}
        <div className="w-1/3 p-4 border-r border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Test Inputs</h4>

          <div className="space-y-4 mb-6">
            {inputFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderInputField(field)}
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Execute Button */}
          <div className="space-y-2">
            <button
              onClick={handleExecute}
              disabled={isRunning || isExecuting}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Executing...</span>
                </>
              ) : (
                <>
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
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Execute Workflow</span>
                </>
              )}
            </button>

            {isRunning && (
              <button
                onClick={handleStop}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
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
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 10h6v4H9z"
                  />
                </svg>
                <span>Stop Execution</span>
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-red-800 font-medium">Execution Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Execution Logs */}
          {logs.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Execution Log</h5>
              <div className="bg-gray-900 text-green-400 p-3 rounded-md font-mono text-xs max-h-32 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">
                      [{new Date().toLocaleTimeString()}]
                    </span>{" "}
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="flex-1">
          {executionId ? (
            <WorkflowExecutionResults
              executionId={executionId}
              workflowId={workflow.id}
              className="border-0 rounded-none"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-lg font-medium">Ready to Test</p>
                <p className="text-sm">
                  Configure test inputs and click &quot;Execute Workflow&quot;
                  to see results
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTester;


