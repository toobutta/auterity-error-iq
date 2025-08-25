import React from "react";
import { AuterityDesignTokens } from "../design-tokens";

interface SystemBadgeProps {
  system: "autmatrix" | "neuroweaver" | "relaycore";
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outlined";
}

export const SystemBadge: React.FC<SystemBadgeProps> = ({
  system,
  label,
  size = "md",
  variant = "filled",
}) => {
  const getSystemInfo = () => {
    switch (system) {
      case "autmatrix":
        return {
          color: AuterityDesignTokens.colors.primary.autmatrix,
          label: label || "AutoMatrix",
          description: "Workflow Automation",
        };
      case "neuroweaver":
        return {
          color: AuterityDesignTokens.colors.primary.neuroweaver,
          label: label || "NeuroWeaver",
          description: "Model Specialization",
        };
      case "relaycore":
        return {
          color: AuterityDesignTokens.colors.primary.relaycore,
          label: label || "RelayCore",
          description: "AI Routing Hub",
        };
      default:
        return {
          color: AuterityDesignTokens.colors.status.pending,
          label: label || system,
          description: "",
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-sm";
      default:
        return "px-3 py-1 text-xs";
    }
  };

  const getVariantClasses = (color: string) => {
    if (variant === "outlined") {
      return `border ${size === "sm" ? "border-1" : "border-2"} text-${color} border-${color}`;
    }
    return `bg-${color} text-white`;
  };

  const systemInfo = getSystemInfo();
  const sizeClasses = getSizeClasses();
  const variantClasses = getVariantClasses(systemInfo.color.replace("#", ""));

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${variantClasses}`}
    >
      {systemInfo.label}
    </span>
  );
};
