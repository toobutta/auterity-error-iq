import React from "react";
import { getEnabledKiroModules } from "../kiro/register";

interface KiroStatusIndicatorProps {
  className?: string;
}

export const KiroStatusIndicator: React.FC<KiroStatusIndicatorProps> = ({
  className = "",
}) => {
  const enabledModules = getEnabledKiroModules();
  const isActive = enabledModules.length > 0;

  if (!isActive) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-600 font-medium">Kiro Active</span>
      </div>
      <div className="text-xs text-gray-500">
        {enabledModules.length} module{enabledModules.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
};


