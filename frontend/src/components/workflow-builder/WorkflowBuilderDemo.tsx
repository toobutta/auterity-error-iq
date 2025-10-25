import React, { useState } from "react";
import EnhancedWorkflowBuilder from "./EnhancedWorkflowBuilder";
import { Workflow } from "../../types/workflow-builder";
import { sanitizeLog } from "../../utils/sanitizer";

const WorkflowBuilderDemo: React.FC = () => {
  const [savedWorkflow, setSavedWorkflow] = useState<Workflow | null>(null);
  const [, setExecutionResult] = useState<string | null>(null);

  const handleSave = (workflow: Workflow) => {
    setSavedWorkflow(workflow);
    // Show success notification
    alert(`Workflow "${sanitizeLog(workflow.name)}" saved successfully!`);
  };

  const handleTest = (workflow: Workflow) => {
    setExecutionResult(`Testing workflow: ${sanitizeLog(workflow.name)}`);
  };

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🚗 Automotive Workflow Builder
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop components to build powerful automotive dealership
              workflows
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enhanced Builder
              </span>
            </div>

            {savedWorkflow && (
              <div className="text-sm text-gray-600">
                Last saved: {savedWorkflow.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Workflow Builder */}
      <div className="h-full">
        <EnhancedWorkflowBuilder
          onSave={handleSave}
          onTest={handleTest}
          className="h-full"
        />
      </div>

      {/* Demo Instructions Overlay */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-bold text-gray-900 mb-2">🎯 Quick Start Guide</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Drag nodes from the left palette to the canvas</li>
          <li>• Connect nodes by dragging from output to input handles</li>
          <li>• Click nodes to configure their properties</li>
          <li>• Use the tester panel to run workflows with sample data</li>
          <li>• Save your workflow when ready</li>
        </ul>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-1">
            Available Node Types:
          </h4>
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Triggers
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              Actions
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
              Conditions
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              AI Powered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderDemo;


