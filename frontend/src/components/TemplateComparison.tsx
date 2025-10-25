import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { AIProcessNode } from "./nodes/AIProcessNode";
import { EndNode } from "./nodes/EndNode";
import { Template } from "../types/template";
import { NodeData, WorkflowStep } from "../types/workflow";

const nodeTypes: NodeTypes = {
  start: StartNode,
  ai_process: AIProcessNode,
  end: EndNode,
};

interface TemplateComparisonProps {
  templates: Template[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onRemoveTemplate: (templateId: string) => void;
}

const TemplateComparison: React.FC<TemplateComparisonProps> = ({
  templates,
  isOpen,
  onClose,
  onSelectTemplate,
  onRemoveTemplate,
}) => {
  // Convert template definitions to React Flow nodes and edges for each template
  const templateFlows = useMemo(() => {
    return templates.map((template) => {
      if (!template.definition.steps) {
        return { template, nodes: [], edges: [] };
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

      return { template, nodes: flowNodes, edges: flowEdges };
    });
  }, [templates]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "sales":
        return "bg-blue-100 text-blue-800";
      case "service":
        return "bg-green-100 text-green-800";
      case "parts":
        return "bg-yellow-100 text-yellow-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen || templates.length === 0) {
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Template Comparison
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Compare {templates.length} templates side by side
                </p>
              </div>
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

          {/* Content */}
          <div className="bg-white" style={{ height: "80vh" }}>
            {/* Comparison summary */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      templates.reduce(
                        (sum, t) => sum + t.parameters.length,
                        0,
                      ) / templates.length,
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Avg Parameters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      templateFlows.reduce(
                        (sum, t) => sum + t.nodes.length,
                        0,
                      ) / templateFlows.length,
                    )}
                  </div>
                  <div className="text-xs text-gray-500">Avg Steps</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {templates.filter((t) => t.isActive).length}/
                    {templates.length}
                  </div>
                  <div className="text-xs text-gray-500">Active Templates</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 h-full overflow-y-auto">
              {templateFlows.map(({ template, nodes, edges }) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Template header */}
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                        {template.name}
                      </h4>
                      <button
                        onClick={() => onRemoveTemplate(template.id)}
                        className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                        title="Remove from comparison"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}
                      >
                        {template.category}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          template.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {template.description || "No description available"}
                    </p>

                    {/* Enhanced stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-medium text-gray-900">
                          {nodes.length}
                        </div>
                        <div className="text-gray-500">Steps</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-medium text-gray-900">
                          {edges.length}
                        </div>
                        <div className="text-gray-500">Connections</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-medium text-gray-900">
                          {template.parameters.length}
                        </div>
                        <div className="text-gray-500">Parameters</div>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <div className="font-medium text-gray-900">
                          {
                            template.parameters.filter((p) => p.isRequired)
                              .length
                          }
                        </div>
                        <div className="text-gray-500">Required</div>
                      </div>
                    </div>
                  </div>

                  {/* Workflow visualization */}
                  <div className="flex-1 relative bg-gray-50">
                    {nodes.length > 0 ? (
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        fitView
                        attributionPosition="bottom-left"
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        minZoom={0.1}
                        maxZoom={1}
                      >
                        <Background color="#e2e8f0" gap={16} />
                        <Controls showInteractive={false} />
                      </ReactFlow>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-8 w-8 text-gray-400"
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
                          <p className="text-xs text-gray-500 mt-1">
                            No visual workflow
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Enhanced template details */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="space-y-3 text-xs">
                      {/* Complexity indicator */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          Complexity:
                        </span>
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
                      </div>

                      {/* Parameter breakdown */}
                      {template.parameters.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Parameter Types:
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Array.from(
                              new Set(
                                template.parameters.map((p) => p.parameterType),
                              ),
                            ).map((type) => (
                              <span
                                key={type}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Age indicator */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">Age:</span>
                        <span className="text-gray-600">
                          {Math.floor(
                            (Date.now() -
                              new Date(template.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => onSelectTemplate(template)}
                      disabled={!template.isActive}
                      className="w-full mt-4 px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
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
                      <span>
                        {template.isActive
                          ? "Use This Template"
                          : "Template Inactive"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Comparing {templates.length} template
                {templates.length !== 1 ? "s" : ""}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateComparison;


