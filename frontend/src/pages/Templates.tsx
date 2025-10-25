import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import TemplateLibrary from "../components/TemplateLibrary";
import TemplatePreviewModal from "../components/TemplatePreviewModal";
import TemplateComparison from "../components/TemplateComparison";
import { Template } from "../types/template";
import { instantiateTemplate } from "../api/templates";
import { createWorkflow } from "../api/workflows";

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [comparisonTemplates, setComparisonTemplates] = useState<Template[]>(
    [],
  );
  const [showComparison, setShowComparison] = useState(false);
  const [isInstantiating, setIsInstantiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = useCallback((template: Template) => {
    setPreviewTemplate(template);
    setError(null);
  }, []);

  const handleTemplatePreview = useCallback((template: Template) => {
    setPreviewTemplate(template);
    setError(null);
  }, []);

  const handleTemplateInstantiate = useCallback(
    async (
      template: Template,
      parameterValues: { [key: string]: string | number | boolean },
    ) => {
      setIsInstantiating(true);
      setError(null);

      try {
        // Validate template ID to prevent injection
        if (
          !template.id ||
          typeof template.id !== "string" ||
          template.id.trim() === ""
        ) {
          throw new Error("Invalid template ID");
        }

        // Sanitize parameter values
        const sanitizedParams = Object.entries(parameterValues).reduce(
          (acc, [key, value]) => {
            if (typeof key === "string" && key.trim() !== "") {
              acc[key.trim()] = value;
            }
            return acc;
          },
          {} as { [key: string]: string | number | boolean },
        );

        const workflowDefinition = await instantiateTemplate(template.id, {
          name: `${template.name} - ${new Date().toLocaleDateString()}`,
          description: `Created from template: ${template.name}`,
          parameterValues: sanitizedParams,
        });

        const createdWorkflow = await createWorkflow(workflowDefinition);
        navigate(`/workflows/builder/${createdWorkflow.id}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create workflow from template";
        setError(errorMessage);

      } finally {
        setIsInstantiating(false);
      }
    },
    [navigate],
  );

  const handleAddToComparison = useCallback((template: Template) => {
    setComparisonTemplates((prev) => {
      if (prev.find((t) => t.id === template.id)) {
        setShowComparison(true);
        return prev;
      }

      if (prev.length >= 3) {
        setError("You can compare up to 3 templates at once.");
        return prev;
      }

      const newTemplates = [...prev, template];
      // Auto-open comparison when we have 2 templates
      if (newTemplates.length >= 2) {
        setShowComparison(true);
      }
      return newTemplates;
    });
    setError(null);
  }, []);

  const handleRemoveFromComparison = useCallback((templateId: string) => {
    setComparisonTemplates((prev) => {
      const filtered = prev.filter((t) => t.id !== templateId);
      if (filtered.length <= 1) {
        setShowComparison(false);
      }
      return filtered;
    });
  }, []);

  const handleSelectFromComparison = useCallback((template: Template) => {
    setShowComparison(false);
    setPreviewTemplate(template);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
              <p className="mt-2 text-gray-600">
                Browse and use pre-built workflow templates for common
                dealership scenarios
              </p>
            </div>

            {comparisonTemplates.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowComparison(true)}
                  className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Compare ({comparisonTemplates.length})
                </button>
                <button
                  onClick={() => setComparisonTemplates([])}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  title="Clear comparison"
                >
                  <svg
                    className="h-5 w-5"
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
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
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
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={clearError}
                  className="inline-flex text-red-400 hover:text-red-600"
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

        <TemplateLibrary
          onTemplateSelect={handleTemplateSelect}
          onTemplatePreview={handleTemplatePreview}
          onAddToComparison={handleAddToComparison}
          comparisonTemplates={comparisonTemplates}
        />

        {comparisonTemplates.length > 0 && !showComparison && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                Template Comparison
              </h4>
              <button
                onClick={() => setComparisonTemplates([])}
                className="text-gray-400 hover:text-gray-600"
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
            <div className="space-y-2 mb-3">
              {comparisonTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate flex-1 mr-2">{template.name}</span>
                  <button
                    onClick={() => handleRemoveFromComparison(template.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <svg
                      className="h-3 w-3"
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
              ))}
            </div>
            <button
              onClick={() => setShowComparison(true)}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Compare {comparisonTemplates.length} Templates
            </button>
          </div>
        )}

        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onInstantiate={handleTemplateInstantiate}
          onCompare={handleAddToComparison}
        />

        <TemplateComparison
          templates={comparisonTemplates}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          onSelectTemplate={handleSelectFromComparison}
          onRemoveTemplate={handleRemoveFromComparison}
        />

        {isInstantiating && (
          <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span className="text-gray-900">
                Creating workflow from template...
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Templates;


