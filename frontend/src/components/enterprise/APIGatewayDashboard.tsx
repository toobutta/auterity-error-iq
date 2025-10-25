/**
 * API Gateway Management Dashboard Component
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";

interface ServiceStatus {
  name: string;
  status: "healthy" | "unhealthy" | "error";
  url: string;
  response_time?: number;
  error?: string;
}

interface GatewayMetrics {
  total_requests: number;
  error_rate: number;
  avg_response_time: number;
  timestamp: string;
}

interface RateLimitConfig {
  global: { windowMs: number; max: number };
  api: { windowMs: number; max: number };
  auth: { windowMs: number; max: number };
}

export const APIGatewayDashboard: React.FC = () => {
  const [services, setServices] = useState<{ [key: string]: ServiceStatus }>(
    {},
  );
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGatewayData();
    const interval = setInterval(fetchGatewayData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchGatewayData = async () => {
    try {
      setLoading(true);

      const [servicesRes, metricsRes, rateLimitsRes] = await Promise.all([
        fetch("/api/gateway/services"),
        fetch("/api/gateway/metrics"),
        fetch("/api/gateway/rate-limits"),
      ]);

      if (!servicesRes.ok || !metricsRes.ok || !rateLimitsRes.ok) {
        throw new Error("Failed to fetch gateway data");
      }

      const [servicesData, metricsData, rateLimitsData] = await Promise.all([
        servicesRes.json(),
        metricsRes.json(),
        rateLimitsRes.json(),
      ]);

      setServices(servicesData.services);
      setMetrics(metricsData);
      setRateLimits(rateLimitsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "unhealthy":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading gateway status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          API Gateway Dashboard
        </h1>
        <Button onClick={fetchGatewayData} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Error loading gateway data: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Gateway Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_requests.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.error_rate.toFixed(2) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_response_time.toFixed(0) || 0}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(services).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(services).map(([name, service]) => (
              <div
                key={name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium capitalize">{name}</h3>
                    <p className="text-sm text-gray-500">{service.url}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {service.response_time && (
                    <span className="text-sm text-gray-500">
                      {service.response_time}ms
                    </span>
                  )}
                  <Badge className={getStatusColor(service.status)}>
                    {service.status}
                  </Badge>
                </div>
                {service.error && (
                  <div className="mt-2 text-sm text-red-600">
                    Error: {service.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          {rateLimits && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">Global</h3>
                <p className="text-sm text-gray-600">
                  {rateLimits.global.max} requests per{" "}
                  {rateLimits.global.windowMs / 60000} minutes
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">API</h3>
                <p className="text-sm text-gray-600">
                  {rateLimits.api.max} requests per{" "}
                  {rateLimits.api.windowMs / 60000} minutes
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">Authentication</h3>
                <p className="text-sm text-gray-600">
                  {rateLimits.auth.max} requests per{" "}
                  {rateLimits.auth.windowMs / 60000} minutes
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


