// Design Tokens for Auterity Error-IQ
export const tokens = {
  // Color System - Semantic roles for Error-IQ
  colors: {
    // Brand colors
    brand: {
      primary: "#4f46e5", // Indigo - primary actions
      secondary: "#06b6d4", // Cyan - secondary actions
    },

    // Severity levels (core to Error-IQ)
    severity: {
      critical: "#dc2626", // Red-600 - critical errors
      high: "#ea580c", // Orange-600 - high priority
      medium: "#ca8a04", // Yellow-600 - medium priority
      low: "#65a30d", // Lime-600 - low priority
      info: "#0284c7", // Sky-600 - informational
    },

    // Semantic colors
    semantic: {
      success: "#16a34a", // Green-600
      warning: "#ca8a04", // Yellow-600
      error: "#dc2626", // Red-600
      info: "#0284c7", // Sky-600
    },

    // Neutral scale (accessible contrast)
    neutral: {
      0: "#ffffff", // Pure white
      50: "#f8fafc", // Light backgrounds
      100: "#f1f5f9", // Subtle backgrounds
      200: "#e2e8f0", // Borders
      300: "#cbd5e1", // Disabled states
      400: "#94a3b8", // Placeholder text
      500: "#64748b", // Secondary text
      600: "#475569", // Primary text (light mode)
      700: "#334155", // Headings
      800: "#1e293b", // Dark text
      900: "#0f172a", // Darkest
      950: "#020617", // True black
    },

    // Background layers
    background: {
      primary: "#ffffff", // Main content
      secondary: "#f8fafc", // Subtle areas
      tertiary: "#f1f5f9", // Cards, panels
      overlay: "rgba(15, 23, 42, 0.5)", // Modal overlays
    },

    // Interactive states
    interactive: {
      hover: "rgba(79, 70, 229, 0.05)",
      focus: "#4f46e5",
      active: "rgba(79, 70, 229, 0.1)",
      disabled: "#e2e8f0",
    },

    // Status indicators
    status: {
      online: "#16a34a", // Green
      offline: "#64748b", // Gray
      loading: "#0284c7", // Blue
      error: "#dc2626", // Red
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      mono: ["Fira Code", "Monaco", "Consolas", "monospace"],
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
      sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
      base: ["1rem", { lineHeight: "1.5rem" }], // 16px
      lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
      xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
      "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  // Spacing System (8px grid)
  spacing: {
    px: "1px",
    0: "0",
    0.5: "0.125rem", // 2px
    1: "0.25rem", // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem", // 8px
    2.5: "0.625rem", // 10px
    3: "0.75rem", // 12px
    3.5: "0.875rem", // 14px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    7: "1.75rem", // 28px
    8: "2rem", // 32px
    9: "2.25rem", // 36px
    10: "2.5rem", // 40px
    11: "2.75rem", // 44px
    12: "3rem", // 48px
    14: "3.5rem", // 56px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    28: "7rem", // 112px
    32: "8rem", // 128px
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    DEFAULT: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px",
  },

  // Shadows & Elevation
  boxShadow: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
  },

  // Z-Index Scale
  zIndex: {
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    dropdown: "1000",
    sticky: "1020",
    fixed: "1030",
    modal: "1040",
    popover: "1050",
    tooltip: "1060",
    toast: "1070",
  },

  // Animation & Motion
  animation: {
    durations: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
      slower: "500ms",
    },
    easings: {
      DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // Breakpoints
  screens: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

// Export individual token categories for tree-shaking
export const {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  zIndex,
  animation,
  screens,
} = tokens;

// Type exports for TypeScript
export type TokenColors = typeof colors;
export type SeverityLevel = keyof typeof colors.severity;
export type SemanticColor = keyof typeof colors.semantic;
export type NeutralColor = keyof typeof colors.neutral;


