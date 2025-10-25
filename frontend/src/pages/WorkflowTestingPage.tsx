import React, { useCallback, useEffect, useState } from "react";
import { getWorkflows } from "../api/workflows";
import Layout from "../components/Layout";
import { WorkflowTestingSandbox } from "../components/testing/WorkflowTestingSandbox";
import { WorkflowDefinition } from "../types/workflow";

interface TestResult {
  success: boolean;
  executionTime: number;
  logs: string[];
  metrics: {
    nodesExecuted: number;
    errors: number;
    warnings: number;
  };
  output: any;
}

const WorkflowTestingPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);

  // Load workflows on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedWorkflows = await getWorkflows();
        setWorkflows(fetchedWorkflows);

        // Auto-select first workflow if available
        if (fetchedWorkflows.length > 0) {
          setSelectedWorkflow(fetchedWorkflows[0]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load workflows";
        setError(errorMessage);

      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  const handleWorkflowSelect = useCallback((workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setSelectedWorkflow(workflow);
      setLastTestResult(null); // Clear previous results when switching workflows
    }
  }, [workflows]);

  const handleTestComplete = useCallback((result: TestResult) => {
    setLastTestResult(result);
  }, []);

  const handleRefreshWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedWorkflows = await getWorkflows();
      setWorkflows(fetchedWorkflows);

      // If current selection is still valid, keep it; otherwise select first
      if (selectedWorkflow) {
        const stillExists = fetchedWorkflows.some(w => w.id === selectedWorkflow.id);
        if (!stillExists && fetchedWorkflows.length > 0) {
          setSelectedWorkflow(fetchedWorkflows[0]);
        }
      } else if (fetchedWorkflows.length > 0) {
        setSelectedWorkflow(fetchedWorkflows[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh workflows";
      setError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkflow]);

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
                    Workflow Testing & Simulation
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Test your workflows with mock data in a safe sandbox environment
                  </p>
                </div>
                <button
                  onClick={handleRefreshWorkflows}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? "Refreshing..." : "Refresh Workflows"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    Error Loading Workflows
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !error ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading workflows...</span>
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workflows found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a workflow first to start testing.
              </p>
              <div className="mt-6">
                <a
                  href="/workflow-builder"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Workflow
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Workflow Selector Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Select Workflow
                  </h2>
                  <div className="space-y-2">
                    {workflows.map((workflow) => (
                      <button
                        key={workflow.id}
                        onClick={() => handleWorkflowSelect(workflow.id!)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedWorkflow?.id === workflow.id
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium truncate">
                          {workflow.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {workflow.steps?.length || 0} steps
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Summary */}
                {lastTestResult && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Last Test Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lastTestResult.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {lastTestResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Execution Time</span>
                        <span className="text-sm font-medium">
                          {lastTestResult.executionTime}ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nodes Executed</span>
                        <span className="text-sm font-medium">
                          {lastTestResult.metrics.nodesExecuted}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Testing Sandbox */}
              <div className="lg:col-span-3">
                {selectedWorkflow ? (
                  <WorkflowTestingSandbox
                    workflow={selectedWorkflow}
                    onTestComplete={handleTestComplete}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No workflow selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Select a workflow from the sidebar to begin testing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WorkflowTestingPage;


