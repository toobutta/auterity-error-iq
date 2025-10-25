import React, { useCallback, useEffect, useState } from "react";
import { getWorkflows } from "../api/workflows";
import Layout from "../components/Layout";
import { IndustryWorkflowTemplate } from "../types/templates";
import { importTemplateToWorkflow, loadIndustryTemplates } from "../utils/templateManager";

interface TemplateCardProps {
  template: IndustryWorkflowTemplate;
  onImport: (template: IndustryWorkflowTemplate) => void;
  isImporting: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onImport, isImporting }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {template.industry}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {template.complexity}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {template.description}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Steps: {template.workflow.steps?.length || 0}</span>
          <span>Estimated Time: {template.estimatedDuration}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Use Case:</span> {template.useCase}
        </div>
        <button
          onClick={() => onImport(template)}
          disabled={isImporting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Import Template
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const IndustryWorkflowMarketplacePage: React.FC = () => {
  const [templates, setTemplates] = useState<IndustryWorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<IndustryWorkflowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadedTemplates = await loadIndustryTemplates();
        setTemplates(loadedTemplates);
        setFilteredTemplates(loadedTemplates);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load templates";
        setError(errorMessage);

      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // Filter templates based on selected filters and search
  useEffect(() => {
    let filtered = templates;

    if (selectedIndustry !== "all") {
      filtered = filtered.filter(template => template.industry === selectedIndustry);
    }

    if (selectedComplexity !== "all") {
      filtered = filtered.filter(template => template.complexity === selectedComplexity);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedIndustry, selectedComplexity, searchQuery]);

  const handleImportTemplate = useCallback(async (template: IndustryWorkflowTemplate) => {
    try {
      setImportingTemplateId(template.id);
      setImportSuccess(null);

      // Import template to workflow
      await importTemplateToWorkflow(template);

      // Refresh workflows to show the new one
      await getWorkflows();

      setImportSuccess(`Successfully imported "${template.name}" template!`);
      setTimeout(() => setImportSuccess(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import template";
      setError(errorMessage);

    } finally {
      setImportingTemplateId(null);
    }
  }, []);

  const industries = Array.from(new Set(templates.map(t => t.industry)));
  const complexities = Array.from(new Set(templates.map(t => t.complexity)));

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Industry Workflow Marketplace
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Discover and import pre-built workflow templates for your industry
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Industry Filter */}
                <div className="sm:w-48">
                  <select
                    value={selectedIndustry}
                    onChange={(e) => setSelectedIndustry(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Industries</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>

                {/* Complexity Filter */}
                <div className="sm:w-48">
                  <select
                    value={selectedComplexity}
                    onChange={(e) => setSelectedComplexity(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Complexities</option>
                    {complexities.map(complexity => (
                      <option key={complexity} value={complexity}>{complexity}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          {importSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {importSuccess}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading templates...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || selectedIndustry !== "all" || selectedComplexity !== "all"
                  ? "Try adjusting your filters or search query."
                  : "No workflow templates are currently available."
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onImport={handleImportTemplate}
                  isImporting={importingTemplateId === template.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IndustryWorkflowMarketplacePage;


