import React, { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  NodeTypes,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { AIProcessNode } from "./nodes/AIProcessNode";
import { EndNode } from "./nodes/EndNode";
import { Template, TemplateParameter } from "../types/template";
import { NodeData, WorkflowStep } from "../types/workflow";

const nodeTypes: NodeTypes = {
  start: StartNode,
  ai_process: AIProcessNode,
  end: EndNode,
};

interface TemplatePreviewModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  onInstantiate: (
    template: Template,
    parameterValues: { [key: string]: string | number | boolean },
  ) => void;
  onCompare?: (template: Template) => void;
}

// Enhanced workflow visualization component with better UX
const WorkflowVisualization: React.FC<{
  nodes: Node<NodeData>[];
  edges: Edge[];
}> = ({ nodes, edges }) => {
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      // Auto-fit view when nodes change
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 100);
    }
  }, [nodes, reactFlowInstance]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
    >
      <Background color="#f1f5f9" gap={20} size={1} />
      <Controls
        showInteractive={false}
        showZoom={true}
        showFitView={true}
        position="top-left"
      />
      <MiniMap
        nodeColor="#e2e8f0"
        maskColor="rgba(0, 0, 0, 0.1)"
        position="bottom-right"
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      />

      <Panel position="top-right">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Steps:</span>
              <span className="font-medium">{nodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">{edges.length}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            Interactive preview - zoom and pan enabled
          </div>
        </div>
      </Panel>
    </ReactFlow>
  );
};

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onInstantiate,
  onCompare,
}) => {
  const [activeTab, setActiveTab] = useState<
    "preview" | "parameters" | "details"
  >("preview");
  const [parameterValues, setParameterValues] = useState<{
    [key: string]: string | number | boolean;
  }>({});
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Initialize parameter values with defaults when template changes
  useEffect(() => {
    if (template) {
      const initialValues: { [key: string]: string | number | boolean } = {};
      template.parameters.forEach((param) => {
        initialValues[param.name] = param.defaultValue ?? "";
      });
      setParameterValues(initialValues);
      setValidationErrors({});
    }
  }, [template]);

  // Convert template definition to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!template || !template.definition.steps) {
      return { nodes: [], edges: [] };
    }

    const flowNodes: Node<NodeData>[] = template.definition.steps.map(
      (step: WorkflowStep) => ({
        id: step.id,
        type: step.type,
        position: step.position,
        data: {
          label: step.name,
          description: step.description,
          type: step.type,
          config: step.config,
        },
      }),
    );

    const flowEdges: Edge[] = (template.definition.connections || []).map(
      (conn: {
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
      }) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        label: conn.label,
        animated: true,
      }),
    );

    return { nodes: flowNodes, edges: flowEdges };
  }, [template]);

  const validateParameter = (
    param: TemplateParameter,
    value: string | number | boolean,
  ): string | null => {
    if (param.isRequired && (!value || value === "")) {
      return `${param.name} is required`;
    }

    if (value && param.parameterType === "number" && isNaN(Number(value))) {
      return `${param.name} must be a valid number`;
    }

    if (param.validationRules) {
      if (
        param.validationRules.minLength &&
        value.length < param.validationRules.minLength
      ) {
        return `${param.name} must be at least ${param.validationRules.minLength} characters`;
      }
      if (
        param.validationRules.maxLength &&
        value.length > param.validationRules.maxLength
      ) {
        return `${param.name} must be no more than ${param.validationRules.maxLength} characters`;
      }
      if (
        param.validationRules.pattern &&
        !new RegExp(param.validationRules.pattern).test(value)
      ) {
        return `${param.name} format is invalid`;
      }
    }

    return null;
  };

  const handleParameterChange = (
    paramName: string,
    value: string | number | boolean,
  ) => {
    setParameterValues((prev) => ({ ...prev, [paramName]: value }));

    // Clear validation error for this parameter
    if (validationErrors[paramName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
  };

  const validateAllParameters = (): boolean => {
    if (!template) return false;

    const errors: { [key: string]: string } = {};
    let isValid = true;

    template.parameters.forEach((param) => {
      const error = validateParameter(param, parameterValues[param.name]);
      if (error) {
        errors[param.name] = error;
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleInstantiate = () => {
    if (!template) return;

    if (validateAllParameters()) {
      onInstantiate(template, parameterValues);
      onClose();
    }
  };

  const renderParameterInput = (param: TemplateParameter) => {
    const value = parameterValues[param.name] ?? "";
    const error = validationErrors[param.name];

    switch (param.parameterType) {
      case "boolean":
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={param.name}
              checked={Boolean(value)}
              onChange={(e) =>
                handleParameterChange(param.name, e.target.checked)
              }
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor={param.name}
              className="ml-2 block text-sm text-gray-900"
            >
              {param.description || param.name}
            </label>
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            id={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            placeholder={param.description}
          />
        );

      case "array":
        return (
          <textarea
            id={param.name}
            value={Array.isArray(value) ? value.join("\n") : value}
            onChange={(e) =>
              handleParameterChange(
                param.name,
                e.target.value.split("\n").filter((v) => v.trim()),
              )
            }
            rows={3}
            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="Enter one item per line"
          />
        );

      default: // string
        return (
          <input
            type="text"
            id={param.name}
            value={value}
            onChange={(e) => handleParameterChange(param.name, e.target.value)}
            className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            placeholder={param.description}
          />
        );
    }
  };

  if (!isOpen || !template) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {template.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {onCompare && (
                  <button
                    onClick={() => onCompare(template)}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Compare
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                {["preview", "parameters", "details"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() =>
                      setActiveTab(tab as "preview" | "parameters" | "details")
                    }
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4" style={{ height: "600px" }}>
            {activeTab === "preview" && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Workflow Visualization
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                      <span>Start</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                      <span>AI Process</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                      <span>End</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                  <ReactFlowProvider>
                    <WorkflowVisualization nodes={nodes} edges={edges} />
                  </ReactFlowProvider>
                </div>
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No workflow steps
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This template doesn&apos;t have a visual workflow.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "parameters" && (
              <div className="h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Template Parameters
                  </h4>
                  {template.parameters.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {template.parameters.filter((p) => p.isRequired).length}{" "}
                      required,{" "}
                      {template.parameters.length -
                        template.parameters.filter((p) => p.isRequired)
                          .length}{" "}
                      optional
                    </div>
                  )}
                </div>
                {template.parameters.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No parameters required
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This template is ready to use without any configuration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Required parameters first */}
                    {template.parameters.filter((p) => p.isRequired).length >
                      0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                          Required Parameters
                        </h5>
                        <div className="space-y-4">
                          {template.parameters
                            .filter((p) => p.isRequired)
                            .map((param) => (
                              <div
                                key={param.id}
                                className="bg-red-50 border border-red-200 rounded-lg p-4"
                              >
                                <label
                                  htmlFor={param.name}
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  {param.name}
                                  <span className="text-red-500 ml-1">*</span>
                                </label>
                                {param.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {param.description}
                                  </p>
                                )}
                                <div className="mt-2">
                                  {renderParameterInput(param)}
                                </div>
                                {validationErrors[param.name] && (
                                  <p className="text-red-600 text-xs mt-1 flex items-center">
                                    <svg
                                      className="h-3 w-3 mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {validationErrors[param.name]}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Optional parameters */}
                    {template.parameters.filter((p) => !p.isRequired).length >
                      0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                          Optional Parameters
                        </h5>
                        <div className="space-y-4">
                          {template.parameters
                            .filter((p) => !p.isRequired)
                            .map((param) => (
                              <div
                                key={param.id}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                              >
                                <label
                                  htmlFor={param.name}
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  {param.name}
                                </label>
                                {param.description && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {param.description}
                                  </p>
                                )}
                                <div className="mt-2">
                                  {renderParameterInput(param)}
                                </div>
                                {validationErrors[param.name] && (
                                  <p className="text-red-600 text-xs mt-1 flex items-center">
                                    <svg
                                      className="h-3 w-3 mr-1"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    {validationErrors[param.name]}
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "details" && (
              <div className="h-full overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Template Details
                </h4>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Basic Information
                    </h5>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Category
                        </dt>
                        <dd className="text-sm text-gray-900">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.category === "sales"
                                ? "bg-blue-100 text-blue-800"
                                : template.category === "service"
                                  ? "bg-green-100 text-green-800"
                                  : template.category === "parts"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {template.category.charAt(0).toUpperCase() +
                              template.category.slice(1)}
                          </span>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Status
                        </dt>
                        <dd>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Workflow Structure */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Workflow Structure
                    </h5>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Total Steps
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium">
                          {nodes.length}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Connections
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium">
                          {edges.length}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Complexity
                        </dt>
                        <dd className="text-sm text-gray-900">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              nodes.length <= 3
                                ? "bg-green-100 text-green-800"
                                : nodes.length <= 6
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {nodes.length <= 3
                              ? "Simple"
                              : nodes.length <= 6
                                ? "Medium"
                                : "Complex"}
                          </span>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Parameters Summary */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Parameters
                    </h5>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Total Parameters
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium">
                          {template.parameters.length}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Required
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium text-red-600">
                          {
                            template.parameters.filter((p) => p.isRequired)
                              .length
                          }
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">
                          Optional
                        </dt>
                        <dd className="text-sm text-gray-900 font-medium text-gray-600">
                          {
                            template.parameters.filter((p) => !p.isRequired)
                              .length
                          }
                        </dd>
                      </div>
                    </dl>
                    {template.parameters.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="text-xs text-gray-600 mb-2">
                          Parameter Types:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(
                            new Set(
                              template.parameters.map((p) => p.parameterType),
                            ),
                          ).map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Timeline
                    </h5>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Created
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(template.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Last Updated
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(template.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Usage Recommendations */}
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-900 uppercase tracking-wide mb-3">
                      Usage Recommendations
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700">
                      {template.parameters.filter((p) => p.isRequired)
                        .length === 0 ? (
                        <div className="flex items-start space-x-2">
                          <svg
                            className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Ready to use immediately - no configuration required
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-start space-x-2">
                          <svg
                            className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Requires configuration before use - review
                            parameters tab
                          </span>
                        </div>
                      )}
                      {nodes.length > 6 && (
                        <div className="flex items-start space-x-2">
                          <svg
                            className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            Complex workflow - may take longer to execute
                          </span>
                        </div>
                      )}
                      <div className="flex items-start space-x-2">
                        <svg
                          className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          Best suited for {template.category} department
                          workflows
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              {/* Status indicators */}
              <div className="flex items-center space-x-4 text-sm">
                {template.parameters.filter((p) => p.isRequired).length > 0 && (
                  <div className="flex items-center space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        Object.keys(validationErrors).length === 0
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-gray-600">
                      {Object.keys(validationErrors).length === 0
                        ? "Ready to create"
                        : "Configuration needed"}
                    </span>
                  </div>
                )}
                {!template.isActive && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-red-600">Template inactive</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                {onCompare && (
                  <button
                    onClick={() => onCompare(template)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Add to Compare
                  </button>
                )}
                <button
                  onClick={handleInstantiate}
                  disabled={
                    !template.isActive ||
                    Object.keys(validationErrors).length > 0
                  }
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Create Workflow</span>
                </button>
              </div>
            </div>

            {/* Help text */}
            {activeTab === "parameters" && template.parameters.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 Tip: Required parameters are highlighted in red. You can
                  always modify these values later in the workflow builder.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;


