/**
 * Enterprise Platform Dashboard
 * Main dashboard that integrates all enterprise features
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  APIGatewayDashboard,
  DeveloperPlatformDashboard,
  WhiteLabelCustomizer,
} from "./index";

type DashboardTab =
  | "overview"
  | "api-gateway"
  | "developer-platform"
  | "white-label";

export const EnterpriseDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: "📊" },
    { id: "api-gateway" as const, label: "API Gateway", icon: "🚪" },
    {
      id: "developer-platform" as const,
      label: "Developer Platform",
      icon: "👨‍💻",
    },
    { id: "white-label" as const, label: "White-Label", icon: "🎨" },
  ];

  const overviewStats = [
    { title: "API Requests", value: "1.2M", change: "+12%", trend: "up" },
    { title: "Active Developers", value: "89", change: "+5%", trend: "up" },
    { title: "SDK Downloads", value: "1,247", change: "+23%", trend: "up" },
    { title: "White-Label Clients", value: "12", change: "+3%", trend: "up" },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Enterprise Platform
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive enterprise-grade features for API management, developer
          experience, and white-label solutions.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                <Badge
                  className={`${
                    stat.trend === "up"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab("api-gateway")}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🚪</span>
              <span>API Gateway</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Manage API security, rate limiting, and service routing with
              enterprise-grade controls.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Centralized API management</li>
              <li>• Advanced rate limiting</li>
              <li>• Real-time monitoring</li>
              <li>• Security policies</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab("developer-platform")}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">👨‍💻</span>
              <span>Developer Platform</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Provide SDKs, documentation, and tools to accelerate developer
              adoption and integration.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Multi-language SDKs</li>
              <li>• Interactive documentation</li>
              <li>• Code examples</li>
              <li>• Developer portal</li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab("white-label")}
        >
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🎨</span>
              <span>White-Label Solutions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Enable complete brand customization with themes, assets, and
              configuration management.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Custom themes</li>
              <li>• Brand asset management</li>
              <li>• Real-time preview</li>
              <li>• Export configurations</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">
                  TypeScript SDK v1.2.0 generated successfully
                </span>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">
                  New white-label theme "Corporate Blue" created
                </span>
              </div>
              <span className="text-xs text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">
                  API Gateway rate limit updated for /api/v1/workflows
                </span>
              </div>
              <span className="text-xs text-gray-500">6 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "api-gateway":
        return <APIGatewayDashboard />;
      case "developer-platform":
        return <DeveloperPlatformDashboard />;
      case "white-label":
        return <WhiteLabelCustomizer />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">
                Enterprise Platform
              </h1>
              <nav className="flex space-x-4">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center space-x-2"
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </Button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default EnterpriseDashboard;


