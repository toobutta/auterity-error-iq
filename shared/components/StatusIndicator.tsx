import React from "react";
import { AuterityDesignTokens } from "../design-tokens";

interface StatusIndicatorProps {
  status: "active" | "warning" | "error" | "pending" | "success" | "info";
  label: string;
  size?: "sm" | "md" | "lg";
  system?: "autmatrix" | "neuroweaver" | "relaycore";
  showLabel?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = "md",
  system,
  showLabel = true
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return AuterityDesignTokens.colors.status.active;
      case "warning":
        return AuterityDesignTokens.colors.status.warning;
      case "error":
        return AuterityDesignTokens.colors.status.error;
      case "pending":
        return AuterityDesignTokens.colors.status.pending;
      case "success":
        return AuterityDesignTokens.colors.primary.autmatrix;
      case "info":
        return AuterityDesignTokens.colors.primary.neuroweaver;
      default:
        return AuterityDesignTokens.colors.status.pending;
    }
  };

  const getSystemColor = () => {
    if (!system) return getStatusColor();
    return AuterityDesignTokens.colors.primary[system];
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "lg":
        return "w-6 h-6";
      default:
        return "w-4 h-4";
    }
  };

  const bgColor = getSystemColor();

  return (
    <div className="flex items-center">
      <div
        className={`rounded-full ${getSizeClasses()} flex items-center justify-center`}
        style={{ backgroundColor: bgColor }}
      >
        {status === "error" && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {status === "warning" && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )}
        {status === "success" && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      {showLabel && (
        <span className="ml-2 text-sm font-medium" style={{ color: bgColor }}>
          {label}
        </span>
      )}
    </div>
  );
};
