import { useCallback } from "react";
import {
  onErrorEvent,
  KiroErrorEvent,
} from "../kiro/hooks/error-intelligence.hook";
import { applyErrorSteering } from "../kiro/steering/error-routing";
import { checkKiroPermission } from "../kiro/permissions/error-analytics";
import { AppError } from "../types/error";

export const useKiroIntegration = (userRole = "guest") => {
  const triggerKiroHook = useCallback(
    async (workflowId: string, error: AppError) => {
      const kiroError: KiroErrorEvent = {
        workflowId,
        error: {
          type: mapErrorCategoryToKiroType(error.category),
          message: error.message,
          stack: error.stack,
        },
      };

      try {
        await onErrorEvent(kiroError);
      } catch (hookError) {

      }
    },
    [],
  );

  const getErrorRoute = useCallback((error: AppError): string => {
    return applyErrorSteering({
      type: mapErrorCategoryToKiroType(error.category),
      message: error.message,
    });
  }, []);

  const hasPermission = useCallback(
    (resource: string): boolean => {
      return checkKiroPermission(userRole, resource);
    },
    [userRole],
  );

  return {
    triggerKiroHook,
    getErrorRoute,
    hasPermission,
  };
};

const mapErrorCategoryToKiroType = (
  category: string,
): "validation" | "runtime" | "ai_service" | "system" => {
  switch (category) {
    case "validation":
      return "validation";
    case "ai_service":
      return "ai_service";
    case "network":
    case "database":
    case "authentication":
    case "authorization":
      return "system";
    default:
      return "runtime";
  }
};


