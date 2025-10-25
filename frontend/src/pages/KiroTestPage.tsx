import React, { useState, useMemo, useCallback } from "react";
import Layout from "../components/Layout";
import { testKiroIntegration } from "../kiro/test-integration";
import { useKiroIntegration } from "../hooks/useKiroIntegration";
import { createAppError } from "../utils/errorUtils";

const KiroTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const { triggerKiroHook, getErrorRoute, hasPermission } =
    useKiroIntegration("admin");

  // Memoize test errors to prevent recreation on every render
  const testErrors = useMemo(
    () => ({
      validation: createAppError("VALIDATION_ERROR", "Test validation error"),
      system: createAppError("SYSTEM_ERROR", "Test system error"),
      ai: createAppError("AI_SERVICE_ERROR", "Test AI service error"),
      mock: createAppError(
        "TEST_ERROR",
        "This is a test error for Kiro integration",
        {
          component: "KiroTestPage",
        },
      ),
    }),
    [],
  );

  const runIntegrationTest = useCallback(async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      const results = await testKiroIntegration();
      setTestResults(results);
      setNotification("Integration test completed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setTestResults({ success: false, error: message });
      setNotification("Integration test failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testErrorHook = useCallback(async () => {
    try {
      await triggerKiroHook("test-workflow-123", testErrors.mock);
      setNotification(
        "Kiro hook triggered successfully! Check browser console and backend logs.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to trigger Kiro hook";
      setNotification(`Error: ${message}`);
    }
  }, [triggerKiroHook, testErrors.mock]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Kiro Integration Test Dashboard
          </h1>

          {notification && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">{notification}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={clearNotification}
                    className="inline-flex text-blue-400 hover:text-blue-600"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Integration Test</h2>
              <button
                onClick={runIntegrationTest}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Testing..." : "Run Integration Test"}
              </button>

              {testResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResults, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Error Hook Test</h2>
              <button
                onClick={testErrorHook}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Trigger Test Error
              </button>
              <p className="text-sm text-gray-600 mt-2">
                This will trigger a Kiro error hook and log to the backend.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Permissions Test</h2>
              <div className="space-y-2 text-sm">
                <div>
                  Dashboard Access:{" "}
                  {hasPermission("error_dashboard") ? "✅" : "❌"}
                </div>
                <div>
                  Stack Trace Access:{" "}
                  {hasPermission("stack_trace") ? "✅" : "❌"}
                </div>
                <div>
                  Error Summary Access:{" "}
                  {hasPermission("error_summary") ? "✅" : "❌"}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Steering Test</h2>
              <div className="space-y-2 text-sm">
                <div>
                  Validation Error → {getErrorRoute(testErrors.validation)}
                </div>
                <div>System Error → {getErrorRoute(testErrors.system)}</div>
                <div>AI Error → {getErrorRoute(testErrors.ai)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KiroTestPage;


