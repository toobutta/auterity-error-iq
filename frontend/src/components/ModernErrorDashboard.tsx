import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

// Modern Error-IQ Dashboard with sleek design
const ModernErrorDashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Mock data for demonstration
  const metrics = [
    {
      label: "Active Errors",
      value: 127,
      change: -12,
      severity: "critical" as const,
      trend: "down" as const,
      icon: "🚨",
    },
    {
      label: "Affected Users",
      value: 1453,
      change: -8,
      severity: "high" as const,
      trend: "down" as const,
      icon: "👥",
    },
    {
      label: "MTTR",
      value: 23,
      suffix: "min",
      change: 15,
      severity: "medium" as const,
      trend: "up" as const,
      icon: "⏱️",
    },
    {
      label: "Success Rate",
      value: 98.7,
      suffix: "%",
      change: 0.3,
      severity: "low" as const,
      trend: "up" as const,
      icon: "✅",
    },
  ];

  const recentErrors = [
    {
      id: "ERR-001",
      message: "Database connection timeout in checkout flow",
      severity: "critical" as const,
      occurrences: 34,
      lastSeen: "2 min ago",
      service: "payment-service",
    },
    {
      id: "ERR-002",
      message: "Memory leak detected in user session handler",
      severity: "high" as const,
      occurrences: 12,
      lastSeen: "5 min ago",
      service: "auth-service",
    },
    {
      id: "ERR-003",
      message: "API rate limit exceeded for external service",
      severity: "medium" as const,
      occurrences: 8,
      lastSeen: "10 min ago",
      service: "notification-service",
    },
  ];

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-500",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50",
      )}
    >
      {/* Header with glassmorphism */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                E
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Error-IQ</h1>
                <p className="text-xs text-white/70">
                  Real-time Error Monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="glass px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
              >
                {isDarkMode ? "🌞" : "🌙"}
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white/80">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                "glass rounded-2xl p-6 hover-lift transition-all duration-300",
                "border border-white/20 hover:border-white/30",
                isLoading && "animate-pulse",
              )}
            >
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-8 bg-white/20 rounded w-1/2"></div>
                  <div className="h-3 bg-white/20 rounded w-full"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{metric.icon}</span>
                    <div
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        metric.severity === "critical" &&
                          "bg-red-500/20 text-red-300",
                        metric.severity === "high" &&
                          "bg-orange-500/20 text-orange-300",
                        metric.severity === "medium" &&
                          "bg-yellow-500/20 text-yellow-300",
                        metric.severity === "low" &&
                          "bg-green-500/20 text-green-300",
                      )}
                    >
                      {metric.severity}
                    </div>
                  </div>

                  <h3 className="text-white/80 text-sm font-medium mb-2">
                    {metric.label}
                  </h3>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-white">
                      {metric.value.toLocaleString()}
                    </span>
                    {metric.suffix && (
                      <span className="text-white/60 text-sm">
                        {metric.suffix}
                      </span>
                    )}
                    <span className="text-lg">
                      {metric.trend === "up"
                        ? "↗️"
                        : metric.trend === "down"
                          ? "↘️"
                          : "➡️"}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "flex items-center mt-2 text-sm",
                      metric.change > 0 ? "text-red-300" : "text-green-300",
                    )}
                  >
                    <span>
                      {metric.change > 0 ? "+" : ""}
                      {metric.change}%
                    </span>
                    <span className="text-white/50 ml-1">vs last hour</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Errors Section */}
        <div className="glass rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Recent Critical Errors
            </h2>
            <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentErrors.map((error, index) => (
              <div
                key={error.id}
                className={cn(
                  "bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20",
                  "transition-all duration-200 hover:bg-white/10 cursor-pointer",
                  isLoading && "animate-pulse",
                )}
              >
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-white/20 rounded w-3/4"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            error.severity === "critical" &&
                              "bg-red-500/20 text-red-300",
                            error.severity === "high" &&
                              "bg-orange-500/20 text-orange-300",
                            error.severity === "medium" &&
                              "bg-yellow-500/20 text-yellow-300",
                          )}
                        >
                          {error.severity}
                        </span>
                        <span className="text-white/60 text-sm">
                          {error.id}
                        </span>
                        <span className="text-white/40 text-xs">
                          {error.service}
                        </span>
                      </div>

                      <h3 className="text-white font-medium mb-1">
                        {error.message}
                      </h3>

                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <span>{error.occurrences} occurrences</span>
                        <span>Last seen {error.lastSeen}</span>
                      </div>
                    </div>

                    <button className="text-white/60 hover:text-white transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <button className="glass px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 border border-white/20">
            📊 Analytics Dashboard
          </button>
          <button className="glass px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 border border-white/20">
            🔔 Alert Settings
          </button>
          <button className="glass px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 border border-white/20">
            📋 Export Report
          </button>
          <button className="glass px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 border border-white/20">
            ⚙️ Configuration
          </button>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        className={cn(
          "fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600",
          "rounded-full shadow-2xl hover:shadow-3xl text-white",
          "transition-all duration-300 hover:scale-110 z-50",
        )}
      >
        <svg
          className="w-6 h-6 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
};

export default ModernErrorDashboard;


