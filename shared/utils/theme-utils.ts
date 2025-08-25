import { AuterityDesignTokens } from "../design-tokens";

export interface SystemTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const getSystemTheme = (
  system: "autmatrix" | "neuroweaver" | "relaycore",
): SystemTheme => {
  switch (system) {
    case "autmatrix":
      return {
        primaryColor: AuterityDesignTokens.colors.primary.autmatrix,
        secondaryColor: AuterityDesignTokens.colors.status.active,
        backgroundColor: "#f8fafc",
        textColor: "#1e293b",
        borderColor: "#e2e8f0",
      };
    case "neuroweaver":
      return {
        primaryColor: AuterityDesignTokens.colors.primary.neuroweaver,
        secondaryColor: AuterityDesignTokens.colors.status.warning,
        backgroundColor: "#f1f5f9",
        textColor: "#334155",
        borderColor: "#cbd5e1",
      };
    case "relaycore":
      return {
        primaryColor: AuterityDesignTokens.colors.primary.relaycore,
        secondaryColor: AuterityDesignTokens.colors.status.active,
        backgroundColor: "#f0fdf4",
        textColor: "#166534",
        borderColor: "#bbf7d0",
      };
    default:
      return {
        primaryColor: AuterityDesignTokens.colors.primary.autmatrix,
        secondaryColor: AuterityDesignTokens.colors.status.pending,
        backgroundColor: "#f8fafc",
        textColor: "#1e293b",
        borderColor: "#e2e8f0",
      };
  }
};

export const applySystemTheme = (
  system: "autmatrix" | "neuroweaver" | "relaycore",
): void => {
  const theme = getSystemTheme(system);

  // Apply theme to document root
  const root = document.documentElement;
  root.style.setProperty("--primary-color", theme.primaryColor);
  root.style.setProperty("--secondary-color", theme.secondaryColor);
  root.style.setProperty("--background-color", theme.backgroundColor);
  root.style.setProperty("--text-color", theme.textColor);
  root.style.setProperty("--border-color", theme.borderColor);
};

export const getDepartmentColor = (department: string): string => {
  const departmentColors = AuterityDesignTokens.colors.departments;
  return (
    departmentColors[department as keyof typeof departmentColors] ||
    departmentColors.sales
  );
};

export const getStatusColor = (status: string): string => {
  const statusColors = AuterityDesignTokens.colors.status;
  return (
    statusColors[status as keyof typeof statusColors] || statusColors.pending
  );
};

export const getTypographyStyle = (
  scale: keyof typeof AuterityDesignTokens.typography.scale,
): string => {
  return AuterityDesignTokens.typography.scale[scale];
};

export const getSpacingValue = (
  spacingKey: keyof typeof AuterityDesignTokens.spacing,
): string => {
  return AuterityDesignTokens.spacing[spacingKey];
};
