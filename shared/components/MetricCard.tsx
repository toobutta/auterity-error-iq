import React from "react";
import { StatusIndicator } from "./StatusIndicator";
import { AuterityDesignTokens } from "../design-tokens";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  status?: "active" | "warning" | "error" | "pending" | "success" | "info";
  system?: "autmatrix" | "neuroweaver" | "relaycore";
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend = "neutral",
  status,
  system,
  icon,
  className = ""
}) => {
  const getTrendIcon = () => {
    if (trend === "up") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    } else if (trend === "down") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  const getStatusColor = () => {
    if (status) {
      switch (status) {
        case "active":
          return AuterityDesignTokens.colors.status.active;
        case "warning":
          return AuterityDesignTokens.colors.status.warning;
        case "error":
          return AuterityDesignTokens.colors.status.error;
        case "success":
          return AuterityDesignTokens.colors.status.active;
        case "info":
          return AuterityDesignTokens.colors.primary.neuroweaver;
        default:
          return AuterityDesignTokens.colors.status.pending;
      }
    }
    return "#6b7280"; // Default gray
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold mt-2" style={{ color: system ? AuterityDesignTokens.colors.primary[system] : getStatusColor() }}>
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-2 rounded-full bg-gray-100">
            {icon}
          </div>
        )}
      </div>
      
      {trend !== "neutral" && (
        <div className="flex items-center mt-4">
          {getTrendIcon()}
          <span className="text-sm ml-1" style={{ color: trend === "up" ? AuterityDesignTokens.colors.status.active : AuterityDesignTokens.colors.status.error }}>
            {trend === "up" ? "Increasing" : "Decreasing"}
          </span>
        </div>
      )}
      
      {status && (
        <div className="mt-4">
          <StatusIndicator 
            status={status} 
            label={status.charAt(0).toUpperCase() + status.slice(1)} 
            system={system}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
