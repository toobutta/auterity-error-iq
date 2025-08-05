import { AuterityDesignTokens } from "../design-tokens";

export interface ComponentVariant {
  size: "sm" | "md" | "lg";
  variant: "filled" | "outlined" | "ghost";
  theme: "autmatrix" | "neuroweaver" | "relaycore";
}

export const getComponentClasses = (variant: ComponentVariant): string => {
  const classes: string[] = [];
  
  // Size classes
  switch (variant.size) {
    case "sm":
      classes.push("text-sm", "px-2", "py-1");
      break;
    case "lg":
      classes.push("text-lg", "px-4", "py-2");
      break;
    default:
      classes.push("text-base", "px-3", "py-1.5");
  }
  
  // Variant classes
  switch (variant.variant) {
    case "outlined":
      classes.push("border", "bg-transparent");
      break;
    case "ghost":
      classes.push("bg-transparent", "hover:bg-opacity-10");
      break;
    default:
      classes.push("border-0");
  }
  
  return classes.join(" ");
};

export const getSystemColorClasses = (system: "autmatrix" | "neuroweaver" | "relaycore"): string => {
  const color = AuterityDesignTokens.colors.primary[system];
  const hexColor = color.replace("#", "");
  
  return `text-${hexColor} border-${hexColor} bg-${hexColor}`;
};

export const getDepartmentColorClasses = (department: string): string => {
  const departmentColors = AuterityDesignTokens.colors.departments;
  const color = departmentColors[department as keyof typeof departmentColors] || departmentColors.sales;
  const hexColor = color.replace("#", "");
  
  return `text-${hexColor} border-${hexColor} bg-${hexColor}`;
};

export const getStatusColorClasses = (status: string): string => {
  const statusColors = AuterityDesignTokens.colors.status;
  const color = statusColors[status as keyof typeof statusColors] || statusColors.pending;
  const hexColor = color.replace("#", "");
  
  return `text-${hexColor} border-${hexColor} bg-${hexColor}`;
};

export const getTypographyClasses = (scale: keyof typeof AuterityDesignTokens.typography.scale): string => {
  // This would typically integrate with Tailwind's font size utilities
  // For now, we'll return classes that can be used with Tailwind
  return `text-${scale}`;
};

export const getSpacingClasses = (spacingKey: keyof typeof AuterityDesignTokens.spacing): string => {
  // Return Tailwind spacing classes
  const spacing = AuterityDesignTokens.spacing[spacingKey];
  // Convert spacing values to Tailwind classes (this is a simplified approach)
  return `p-${spacingKey} m-${spacingKey}`;
};

// Utility for creating consistent shadow effects
export const getShadowClasses = (level: "sm" | "md" | "lg" | "xl"): string => {
  switch (level) {
    case "sm":
      return "shadow-sm";
    case "lg":
      return "shadow-lg";
    case "xl":
      return "shadow-xl";
    default:
      return "shadow";
  }
};

// Utility for creating consistent border radius
export const getRoundedClasses = (size: "sm" | "md" | "lg" | "full"): string => {
  switch (size) {
    case "sm":
      return "rounded-sm";
    case "lg":
      return "rounded-lg";
    case "full":
      return "rounded-full";
    default:
      return "rounded";
  }
};

// Utility for creating consistent hover effects
export const getHoverClasses = (system: "autmatrix" | "neuroweaver" | "relaycore"): string => {
  const color = AuterityDesignTokens.colors.primary[system];
  const hexColor = color.replace("#", "");
  
  return `hover:bg-${hexColor} hover:bg-opacity-10`;
};
