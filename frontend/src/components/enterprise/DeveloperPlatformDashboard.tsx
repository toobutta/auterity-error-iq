/**
 * Developer Platform Component
 * Provides SDK management and documentation interface
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";

interface SDK {
  language: string;
  version: string;
  downloadUrl: string;
  documentationUrl: string;
  lastUpdated: string;
  size: string;
  status: "available" | "generating" | "error";
}

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  parameters: number;
  authenticated: boolean;
}

export const DeveloperPlatformDashboard: React.FC = () => {
  const [sdks, setSDKs] = useState<SDK[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlatformData();
  }, []);

  const loadPlatformData = async (): Promise<void> => {
    try {
      setLoading(true);

      // Mock data for demonstration
      setSDKs([
        {
          language: "TypeScript",
          version: "1.0.0",
          downloadUrl: "/api/sdks/typescript/download",
          documentationUrl: "/docs/typescript",
          lastUpdated: "2024-01-15",
          size: "2.3 MB",
          status: "available",
        },
        {
          language: "Python",
          version: "1.0.0",
          downloadUrl: "/api/sdks/python/download",
          documentationUrl: "/docs/python",
          lastUpdated: "2024-01-15",
          size: "1.8 MB",
          status: "available",
        },
        {
          language: "Java",
          version: "0.9.0",
          downloadUrl: "/api/sdks/java/download",
          documentationUrl: "/docs/java",
          lastUpdated: "2024-01-10",
          size: "3.2 MB",
          status: "generating",
        },
      ]);

      setEndpoints([
        {
          path: "/api/v1/workflows",
          method: "GET",
          description: "List all workflows",
          parameters: 3,
          authenticated: true,
        },
        {
          path: "/api/v1/workflows",
          method: "POST",
          description: "Create new workflow",
          parameters: 1,
          authenticated: true,
        },
        {
          path: "/api/v1/workflows/{id}",
          method: "GET",
          description: "Get workflow by ID",
          parameters: 1,
          authenticated: true,
        },
        {
          path: "/api/v1/ai/chat",
          method: "POST",
          description: "Send chat request",
          parameters: 2,
          authenticated: true,
        },
        {
          path: "/api/v1/models",
          method: "GET",
          description: "List available models",
          parameters: 2,
          authenticated: true,
        },
      ]);
    } catch (error) {

    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSDK = async (language: string): Promise<void> => {
    try {
      setGenerating(language);

      // Simulate SDK generation
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update SDK status
      setSDKs((prev) =>
        prev.map((sdk) =>
          sdk.language === language
            ? {
                ...sdk,
                status: "available" as const,
                lastUpdated: new Date().toISOString().split("T")[0],
              }
            : sdk,
        ),
      );
    } catch (error) {

      setSDKs((prev) =>
        prev.map((sdk) =>
          sdk.language === language
            ? { ...sdk, status: "error" as const }
            : sdk,
        ),
      );
    } finally {
      setGenerating(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodColor = (method: string): string => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading developer platform...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Developer Platform</h1>
        <Button onClick={loadPlatformData}>Refresh</Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Available SDKs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sdks.filter((sdk) => sdk.status === "available").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{endpoints.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Developers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
          </CardContent>
        </Card>
      </div>

      {/* SDK Management */}
      <Card>
        <CardHeader>
          <CardTitle>SDK Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sdks.map((sdk) => (
              <div
                key={sdk.language}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">
                      {sdk.language === "Python" ? "Python Library" : `${sdk.language} SDK`}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Version {sdk.version} • {sdk.size} • Updated{" "}
                      {sdk.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(sdk.status)}>
                    {sdk.status}
                  </Badge>
                  <div className="flex space-x-2">
                    {sdk.status === "available" && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={sdk.downloadUrl} download>
                            Download
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={sdk.documentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Docs
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleGenerateSDK(sdk.language)}
                      disabled={generating === sdk.language}
                    >
                      {generating === sdk.language
                        ? "Generating..."
                        : "Regenerate"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {endpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Badge className={getMethodColor(endpoint.method)}>
                    {endpoint.method}
                  </Badge>
                  <div>
                    <span className="font-mono text-sm">{endpoint.path}</span>
                    <p className="text-sm text-gray-500">
                      {endpoint.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {endpoint.parameters} params
                  </span>
                  {endpoint.authenticated && (
                    <Badge variant="outline">Auth Required</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation & Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">API Reference</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete API documentation with interactive examples
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/docs/api" target="_blank" rel="noopener noreferrer">
                  View Docs
                </a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Quick Start Guide</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get up and running with our platform in minutes
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="/docs/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get Started
                </a>
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Code Examples</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sample code and integration examples
              </p>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="/docs/examples"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Examples
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generating && (
        <Alert>
          <AlertDescription>
            Generating {generating} SDK... This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};


