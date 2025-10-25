/**
 * AutoMatrix AI Hub - Design Tokens
 * Modern design system for automotive dealership workflow automation
 */

export const automotiveDesignTokens = {
  // === COLOR SYSTEM ===
  colors: {
    // Primary automotive brand colors
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#1e40af", // Main brand blue
      600: "#1d4ed8",
      700: "#1e3a8a",
      800: "#1e3a8a",
      900: "#1e2a78",
    },

    // Automotive semantic colors
    automotive: {
      blue: "#1e40af", // Professional, trustworthy
      silver: "#64748b", // Metallic, premium
      gold: "#f59e0b", // Accent, luxury
      red: "#dc2626", // Alerts, critical
      green: "#059669", // Success, eco-friendly
    },

    // Business domain colors
    semantic: {
      dealership: "#1e40af", // Primary business operations
      customer: "#f59e0b", // Customer management
      inventory: "#059669", // Inventory and stock
      service: "#8b5cf6", // Service department
      finance: "#06b6d4", // Finance and insurance
      sales: "#ef4444", // Sales operations
    },

    // Node type colors for workflow builder
    nodeTypes: {
      customer: {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#92400e",
        icon: "#f59e0b",
      },
      inventory: {
        bg: "#ecfdf5",
        border: "#a7f3d0",
        text: "#065f46",
        icon: "#059669",
      },
      service: {
        bg: "#faf5ff",
        border: "#c4b5fd",
        text: "#6b21a8",
        icon: "#8b5cf6",
      },
      finance: {
        bg: "#ecfeff",
        border: "#a5f3fc",
        text: "#0e7490",
        icon: "#06b6d4",
      },
      dealership: {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
        icon: "#1e40af",
      },
    },

    // Status and feedback colors
    status: {
      success: "#059669",
      warning: "#f59e0b",
      error: "#dc2626",
      info: "#1e40af",
      pending: "#64748b",
      active: "#10b981",
      inactive: "#6b7280",
    },

    // Neutral grays
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },

  // === SPACING SYSTEM ===
  spacing: {
    // Automotive-specific spacing
    automotive: {
      xs: "4px", // Tight spacing
      sm: "8px", // Small gaps
      md: "16px", // Standard spacing
      lg: "24px", // Comfortable spacing
      xl: "32px", // Generous spacing
      "2xl": "48px", // Large sections
    },

    // Component-specific spacing
    dashboard: "24px", // Dashboard grid gaps
    nodeGap: "16px", // Workflow node spacing
    cardPadding: "24px", // Card internal padding
    sidebarWidth: "256px", // Sidebar width
    headerHeight: "64px", // Header height
  },

  // === TYPOGRAPHY SYSTEM ===
  typography: {
    fontFamily: {
      sans: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
    },

    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },

    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },

    lineHeight: {
      tight: "1.2",
      normal: "1.5",
      relaxed: "1.6",
      loose: "1.8",
    },

    // Automotive typography scale
    scale: {
      display: {
        fontSize: "2.5rem",
        fontWeight: "700",
        lineHeight: "1.2",
      },
      heading1: {
        fontSize: "2rem",
        fontWeight: "600",
        lineHeight: "1.3",
      },
      heading2: {
        fontSize: "1.5rem",
        fontWeight: "600",
        lineHeight: "1.4",
      },
      heading3: {
        fontSize: "1.25rem",
        fontWeight: "600",
        lineHeight: "1.4",
      },
      bodyLarge: {
        fontSize: "1.125rem",
        fontWeight: "400",
        lineHeight: "1.6",
      },
      body: {
        fontSize: "1rem",
        fontWeight: "400",
        lineHeight: "1.6",
      },
      caption: {
        fontSize: "0.875rem",
        fontWeight: "400",
        lineHeight: "1.5",
      },
      small: {
        fontSize: "0.75rem",
        fontWeight: "400",
        lineHeight: "1.4",
      },
    },
  },

  // === BORDER RADIUS ===
  borderRadius: {
    none: "0",
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    automotive: "12px", // Standard automotive radius
    node: "8px", // Workflow node radius
    full: "9999px", // Fully rounded
  },

  // === SHADOWS ===
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

    // Automotive-specific shadows
    automotive: "0 8px 25px rgba(30, 64, 175, 0.15)",
    hover: "0 12px 30px rgba(0, 0, 0, 0.15)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    node: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },

  // === GLASSMORPHISM ===
  glassmorphism: {
    background: "rgba(255, 255, 255, 0.12)",
    backgroundStrong: "rgba(255, 255, 255, 0.20)",
    border: "rgba(255, 255, 255, 0.18)",
    borderStrong: "rgba(255, 255, 255, 0.30)",
    backdropFilter: "blur(20px)",

    // Dark mode variants
    dark: {
      background: "rgba(15, 23, 42, 0.40)",
      backgroundStrong: "rgba(15, 23, 42, 0.60)",
      border: "rgba(148, 163, 184, 0.15)",
      borderStrong: "rgba(148, 163, 184, 0.25)",
    },
  },

  // === GRADIENTS ===
  gradients: {
    primary: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    accent: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    success: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    danger: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
    surface: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",

    // Background gradients
    backgroundLight: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    backgroundDark: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",

    // Automotive themed gradients
    automotive: {
      blue: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
      silver: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
      gold: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    },
  },

  // === TRANSITIONS ===
  transitions: {
    fast: "150ms ease",
    smooth: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    spring: "400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)",

    // Automotive-specific transitions
    automotive: {
      default: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
      hover: "200ms ease",
      focus: "150ms ease",
    },
  },

  // === Z-INDEX SCALE ===
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },

  // === BREAKPOINTS ===
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

// === UTILITY FUNCTIONS ===

/**
 * Get color value from design tokens
 */
export function getColor(path: string): string {
  const keys = path.split(".");
  let value: Record<string, unknown> | string = automotiveDesignTokens.colors;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key] as
        | Record<string, unknown>
        | string;
    } else {
      return "#000000";
    }
  }

  return typeof value === "string" ? value : "#000000";
}

/**
 * Get spacing value from design tokens
 */
export function getSpacing(key: string): string {
  return (
    automotiveDesignTokens.spacing.automotive[
      key as keyof typeof automotiveDesignTokens.spacing.automotive
    ] || "0"
  );
}

/**
 * Get typography style from design tokens
 */
export function getTypographyStyle(
  scale: keyof typeof automotiveDesignTokens.typography.scale,
) {
  return automotiveDesignTokens.typography.scale[scale];
}

/**
 * Get node type styling
 */
export function getNodeTypeStyle(
  nodeType: keyof typeof automotiveDesignTokens.colors.nodeTypes,
) {
  return automotiveDesignTokens.colors.nodeTypes[nodeType];
}

/**
 * Get semantic color based on context
 */
export function getSemanticColor(
  context: keyof typeof automotiveDesignTokens.colors.semantic,
): string {
  return automotiveDesignTokens.colors.semantic[context];
}

/**
 * Get status color
 */
export function getStatusColor(
  status: keyof typeof automotiveDesignTokens.colors.status,
): string {
  return automotiveDesignTokens.colors.status[status];
}

/**
 * Generate CSS custom properties for theme integration
 */
export function generateCSSCustomProperties(): Record<string, string> {
  const customProperties: Record<string, string> = {};

  // Primary colors
  Object.entries(automotiveDesignTokens.colors.primary).forEach(
    ([key, value]) => {
      customProperties[`--color-primary-${key}`] = value;
    },
  );

  // Automotive colors
  Object.entries(automotiveDesignTokens.colors.automotive).forEach(
    ([key, value]) => {
      customProperties[`--color-automotive-${key}`] = value;
    },
  );

  // Semantic colors
  Object.entries(automotiveDesignTokens.colors.semantic).forEach(
    ([key, value]) => {
      customProperties[`--color-semantic-${key}`] = value;
    },
  );

  // Spacing
  Object.entries(automotiveDesignTokens.spacing.automotive).forEach(
    ([key, value]) => {
      customProperties[`--spacing-automotive-${key}`] = value;
    },
  );

  // Shadows
  Object.entries(automotiveDesignTokens.shadows).forEach(([key, value]) => {
    customProperties[`--shadow-${key}`] = value;
  });

  return customProperties;
}

// Export the main design tokens
export default automotiveDesignTokens;


