import React, { useState } from "react";
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
  const { triggerKiroHook, getErrorRoute, hasPermission } =
    useKiroIntegration("admin");

  const runIntegrationTest = async () => {
    setIsLoading(true);
    try {
      const results = await testKiroIntegration();
      setTestResults(results);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setTestResults({ success: false, error: message });
    } finally {
      setIsLoading(false);
    }
  };

  const testErrorHook = async () => {
    const mockError = createAppError(
      "TEST_ERROR",
      "This is a test error for Kiro integration",
      {
        component: "KiroTestPage",
      },
    );

    await triggerKiroHook("test-workflow-123", mockError);
    alert("Kiro hook triggered! Check browser console and backend logs.");
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Kiro Integration Test Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Integration Test */}
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

            {/* Hook Test */}
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

            {/* Permissions Test */}
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

            {/* Steering Test */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Steering Test</h2>
              <div className="space-y-2 text-sm">
                <div>
                  Validation Error →{" "}
                  {getErrorRoute(createAppError("VALIDATION_ERROR", "Test"))}
                </div>
                <div>
                  System Error →{" "}
                  {getErrorRoute(createAppError("SYSTEM_ERROR", "Test"))}
                </div>
                <div>
                  AI Error →{" "}
                  {getErrorRoute(createAppError("AI_SERVICE_ERROR", "Test"))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default KiroTestPage;
