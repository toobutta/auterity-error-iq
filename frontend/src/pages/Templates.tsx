import React, { useState } from "react";
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

  const handleTemplateSelect = (template: Template) => {
    // Open the template in preview mode for instantiation
    setPreviewTemplate(template);
  };

  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template);
  };

  const handleTemplateInstantiate = async (
    template: Template,
    parameterValues: { [key: string]: string | number | boolean },
  ) => {
    setIsInstantiating(true);
    try {
      // First, instantiate the template to get the workflow definition
      const workflowDefinition = await instantiateTemplate(template.id, {
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        description: `Created from template: ${template.name}`,
        parameterValues,
      });

      // Then create the workflow
      const createdWorkflow = await createWorkflow(workflowDefinition);

      // Navigate to the workflow builder with the new workflow
      navigate(`/workflows/builder/${createdWorkflow.id}`);
    } catch (error) {
      console.error("Failed to instantiate template:", error);
      alert("Failed to create workflow from template. Please try again.");
    } finally {
      setIsInstantiating(false);
    }
  };

  const handleAddToComparison = (template: Template) => {
    if (comparisonTemplates.find((t) => t.id === template.id)) {
      // Template already in comparison, show comparison view
      setShowComparison(true);
      return;
    }

    if (comparisonTemplates.length >= 3) {
      alert("You can compare up to 3 templates at once.");
      return;
    }

    setComparisonTemplates((prev) => [...prev, template]);

    // Auto-open comparison if we have 2 or more templates
    if (comparisonTemplates.length >= 1) {
      setShowComparison(true);
    }
  };

  const handleRemoveFromComparison = (templateId: string) => {
    setComparisonTemplates((prev) => prev.filter((t) => t.id !== templateId));

    // Close comparison if no templates left
    if (comparisonTemplates.length <= 1) {
      setShowComparison(false);
    }
  };

  const handleSelectFromComparison = (template: Template) => {
    setShowComparison(false);
    setPreviewTemplate(template);
  };

  const handleClosePreview = () => {
    setPreviewTemplate(null);
  };

  const handleCloseComparison = () => {
    setShowComparison(false);
  };

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

            {/* Comparison indicator */}
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

        <TemplateLibrary
          onTemplateSelect={handleTemplateSelect}
          onTemplatePreview={handleTemplatePreview}
          onAddToComparison={handleAddToComparison}
          comparisonTemplates={comparisonTemplates}
        />

        {/* Quick comparison panel */}
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

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={!!previewTemplate}
          onClose={handleClosePreview}
          onInstantiate={handleTemplateInstantiate}
          onCompare={handleAddToComparison}
        />

        {/* Template Comparison Modal */}
        <TemplateComparison
          templates={comparisonTemplates}
          isOpen={showComparison}
          onClose={handleCloseComparison}
          onSelectTemplate={handleSelectFromComparison}
          onRemoveTemplate={handleRemoveFromComparison}
        />

        {/* Loading overlay for instantiation */}
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
