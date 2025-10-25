import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import WorkflowBuilder from "../components/WorkflowBuilder";
import { InteractiveWorkflowCanvas } from "../components/workflow-builder/InteractiveWorkflowCanvas";
import { WorkflowDefinition } from "../types/workflow";

const WorkflowBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(
    async (workflow: WorkflowDefinition) => {
      setIsLoading(true);
      setNotification(null);

      try {
        // Validate workflow before saving
        if (!workflow || !workflow.name || workflow.name.trim() === "") {
          throw new Error("Workflow name is required");
        }

        if (!workflow.steps || workflow.steps.length === 0) {
          throw new Error("Workflow must have at least one step");
        }

        // Simulate save operation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setNotification("Workflow saved successfully!");

        // Navigate back to workflows page after a brief delay
        setTimeout(() => {
          navigate("/workflows");
        }, 1500);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save workflow";
        setNotification(`Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate],
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <Layout>
      <div className="h-full space-y-8">
        {notification && (
          <div
            className={`p-4 rounded-md ${
              notification.startsWith("Error:")
                ? "bg-red-50 border border-red-200"
                : "bg-green-50 border border-green-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className={`h-5 w-5 ${
                    notification.startsWith("Error:")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {notification.startsWith("Error:") ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm ${
                    notification.startsWith("Error:")
                      ? "text-red-800"
                      : "text-green-800"
                  }`}
                >
                  {notification}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearNotification}
                  className={`inline-flex ${
                    notification.startsWith("Error:")
                      ? "text-red-400 hover:text-red-600"
                      : "text-green-400 hover:text-green-600"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <InteractiveWorkflowCanvas />

        <WorkflowBuilder onSave={handleSave} isLoading={isLoading} />
      </div>
    </Layout>
  );
};

export default WorkflowBuilderPage;


